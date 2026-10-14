#!/usr/bin/env python3
"""One-way, fail-closed MediaFlow Personal -> MediaFlow Plus frontend importer.

Only the --plus directory is ever written. Personal is a read-only checkout.
The base source is replaced, but Plus-owned features live in plus/extensions/
and are reapplied *after* importing the new base, inside the regular app build.
No user, auth, or Supabase database data is accessed or copied.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path

PLUS_PROJECT_URL = "https://puaqaobplyrdrujapznp.supabase.co"
PERSONAL_PROJECT_URL = "https://wgeijxfdpgehesxialxm.supabase.co"
ROOT_FILES = ("index.html", "manifest.json", "icon.svg", "favicon.ico",
              "package.json", "vite.v260.config.ts", "vite.v261.config.ts")
CONST_PATH = Path("src/js/core/constants/001-constants.js")
MANIFEST = Path("plus/extensions/manifest.json")
STATE = Path("plus/sync/state.json")


def die(message: str) -> None:
    raise RuntimeError("Plus sync blocked: " + message)


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_field(text: str, name: str) -> str:
    found = re.findall(r"(?m)^const " + re.escape(name) + r"='([^']+)';", text)
    if len(found) != 1:
        die("missing/duplicate cloud setting " + name)
    return found[0]


def safe_source(base: Path, path: str) -> Path:
    if not isinstance(path, str) or not re.fullmatch(r"[A-Za-z0-9_./-]+", path):
        die("unsafe Plus extension path")
    candidate = (base / path).resolve()
    if not candidate.is_relative_to(base.resolve()) or not candidate.is_file():
        die("missing or escaping Plus extension " + path)
    return candidate


def apply_extensions(plus: Path) -> None:
    manifest = json.loads((plus / MANIFEST).read_text(encoding="utf-8"))
    if sorted(manifest) != ["assets", "runtime_modules", "stylesheets"]:
        die("unknown Plus extension manifest fields")
    if any(not isinstance(manifest[x], list) for x in manifest):
        die("extension manifest fields must be arrays")
    base = plus / "plus/extensions"
    order_path = plus / "src/js/runtime-order.json"
    order = json.loads(order_path.read_text(encoding="utf-8"))
    build = json.loads((plus / "src/js/build-order.json").read_text(encoding="utf-8"))
    if not any(x.get("slot") == "runtime_extensions" for x in build):
        die("the Personal runtime extension slot changed; manual review required")
    css_links = []
    for kind, srcdir, destdir, suffix in (
        ("runtime_modules", "runtime", "src/js/components/plus", ".js"),
        ("stylesheets", "styles", "assets/css/plus", ".css"),
        ("assets", "assets", "assets/plus", None),
    ):
        names = manifest[kind]
        if len(names) != len(set(names)):
            die("duplicate Plus " + kind)
        for name in names:
            if not isinstance(name, str) or not re.fullmatch(r"[A-Za-z0-9_-]+(?:/[A-Za-z0-9_-]+)*\.[A-Za-z0-9]+", name):
                die("invalid extension filename " + str(name))
            if suffix and not name.endswith(suffix):
                die("invalid extension type " + name)
            source = safe_source(base, srcdir + "/" + name)
            dest = plus / destdir / name
            if dest.exists():
                die("Plus overlay would overwrite a Personal file " + str(dest))
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, dest)
            if kind == "runtime_modules":
                order.append(dest.relative_to(plus / "src/js").as_posix())
            elif kind == "stylesheets":
                css_links.append('<link rel="stylesheet" href="' + dest.relative_to(plus).as_posix() + '">')
    order_path.write_text(json.dumps(order, indent=2) + "\n", encoding="utf-8")
    if css_links:
        index_path = plus / "index.html"
        index = index_path.read_text(encoding="utf-8")
        if index.count("</head>") != 1:
            die("Personal HTML head layout changed")
        index = index.replace("</head>", "\n".join(css_links) + "\n</head>", 1)
        index_path.write_text(index, encoding="utf-8")


def sync(personal: Path, plus: Path, tag: str, commit: str, next_version: int) -> None:
    personal = personal.resolve()
    plus = plus.resolve()
    if personal == plus or personal in plus.parents or plus in personal.parents:
        die("Personal and Plus must be separate checkouts")
    if not re.fullmatch(r"[0-9]+", tag) or not re.fullmatch(r"[0-9a-f]{40}", commit):
        die("expected numeric Personal stable release and immutable SHA")
    personal_version = int((personal / "VERSION").read_text().strip())
    if personal_version != int(tag):
        die("Personal checkout is not the selected stable release")
    current_plus_version = int((plus / "VERSION").read_text().strip())
    if next_version != current_plus_version + 1:
        die("Plus release number must advance by exactly one")
    state = json.loads((plus / STATE).read_text(encoding="utf-8"))
    if state["personal_tag"] == tag and state["personal_sha"] == commit:
        die("Personal release already mirrored; nothing to deploy")
    if personal_version < int(state["personal_tag"]):
        die("Personal release regression is not allowed")

    old_plus = (plus / CONST_PATH).read_text(encoding="utf-8")
    url = read_field(old_plus, "SUPABASE_URL")
    key = read_field(old_plus, "SUPABASE_PUBLISHABLE_KEY")
    if url != PLUS_PROJECT_URL or not (key.startswith("sb_publishable_") or key.startswith("eyJ")):
        die("existing Plus cloud configuration is not verified")
    personal_constants = (personal / CONST_PATH).read_text(encoding="utf-8")
    if read_field(personal_constants, "SUPABASE_URL") != PERSONAL_PROJECT_URL:
        die("unexpected Personal project; refusing unsafe import")

    # Guard against unregistered Plus additions being silently deleted.
    prior_runtime = json.loads((plus / "src/js/runtime-order.json").read_text(encoding="utf-8"))
    registered = json.loads((plus / MANIFEST).read_text(encoding="utf-8"))["runtime_modules"]
    prior_overlays = [x for x in prior_runtime if x.startswith("components/plus/")]
    if set(prior_overlays) != {"components/plus/" + x for x in registered}:
        die("Plus runtime modules are not all registered as preserved overlays")

    # IMPORTANT: shutil never operates on any path within the Personal checkout.
    for dirname in ("src", "assets", "scripts"):
        target = plus / dirname
        if target.exists():
            shutil.rmtree(target)
        shutil.copytree(personal / dirname, target)
    for name in ROOT_FILES:
        shutil.copy2(personal / name, plus / name)

    config_path = plus / CONST_PATH
    updated = personal_constants
    for name, value in (("SUPABASE_URL", url), ("SUPABASE_PUBLISHABLE_KEY", key)):
        updated, count = re.subn(
            r"(?m)^const " + name + r"='[^']*';",
            lambda _match: "const " + name + "='" + value + "';",
            updated,
        )
        if count != 1:
            die("Personal cloud configuration layout changed")
    if PERSONAL_PROJECT_URL in updated:
        die("Personal database URL leaked into Plus")
    config_path.write_text(updated, encoding="utf-8")

    # Verify all base files before the Plus overlay is applied.
    number = 0
    for dirname in ("src", "assets", "scripts"):
        for file in (personal / dirname).rglob("*"):
            if not file.is_file():
                continue
            rel = file.relative_to(personal)
            if rel == CONST_PATH:
                continue
            target = plus / rel
            if not target.exists() or sha(file) != sha(target):
                die("unexpected imported source mismatch " + str(rel))
            number += 1
    apply_extensions(plus)
    (plus / "VERSION").write_text(str(next_version) + "\n", encoding="utf-8")
    (plus / STATE).write_text(json.dumps({
        "personal_tag": tag,
        "personal_sha": commit,
        "plus_release": next_version,
    }, indent=2) + "\n", encoding="utf-8")
    print("Copied", number, "identical Personal source/asset/script files.")
    print("Plus cloud remains isolated; Plus-only extensions reapplied.")
    print("Mirrored Personal", tag, "into Plus", next_version)


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--personal", type=Path, required=True)
    cli.add_argument("--plus", type=Path, required=True)
    cli.add_argument("--tag", required=True)
    cli.add_argument("--sha", required=True)
    cli.add_argument("--next-version", type=int, required=True)
    args = cli.parse_args()
    sync(args.personal, args.plus, args.tag, args.sha, args.next_version)
