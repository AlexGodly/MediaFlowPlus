#!/usr/bin/env python3
"""Offline synthetic tests: one-way sync, Plus overlays, and privacy boundaries."""
import json
import tempfile
import unittest
from pathlib import Path
from sync import sync


class OneWaySyncTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        self.personal = root / "personal"
        self.plus = root / "plus"
        for parent in (self.personal, self.plus):
            for part in ("src/js/core/constants", "src/js/components",
                         "assets/css", "scripts"):
                (parent / part).mkdir(parents=True, exist_ok=True)
            (parent / "index.html").write_text("<html><head></head><body></body></html>")
            (parent / "manifest.json").write_text('{"start_url":"./"}')
            for name in ("icon.svg", "favicon.ico", "package.json",
                         "vite.v260.config.ts", "vite.v261.config.ts"):
                (parent / name).write_text(name)
            (parent / "src/js/runtime-order.json").write_text('["components/base.js"]')
            (parent / "src/js/build-order.json").write_text('[{"slot":"runtime_extensions"}]')
            (parent / "src/js/components/base.js").write_text("const version='personal';")
            (parent / "scripts/build.py").write_text("print('Personal build')")
            (parent / "assets/css/app.css").write_text("body{color:black}")
        (self.personal / "VERSION").write_text("410")
        (self.plus / "VERSION").write_text("415")
        const_path = "src/js/core/constants/001-constants.js"
        (self.personal / const_path).write_text(
            "const SUPABASE_URL='https://wgeijxfdpgehesxialxm.supabase.co';\n"
            "const SUPABASE_PUBLISHABLE_KEY='sb_publishable_personalpublic';\n")
        (self.plus / const_path).write_text(
            "const SUPABASE_URL='https://puaqaobplyrdrujapznp.supabase.co';\n"
            "const SUPABASE_PUBLISHABLE_KEY='sb_publishable_pluspublic';\n")
        (self.plus / "plus/extensions/runtime").mkdir(parents=True)
        (self.plus / "plus/extensions/styles").mkdir(parents=True)
        (self.plus / "plus/extensions/assets").mkdir(parents=True)
        (self.plus / "plus/sync").mkdir(parents=True)
        (self.plus / "plus/extensions/runtime/community.js").write_text("window.PLUS_EXCLUSIVE=true;")
        (self.plus / "plus/extensions/styles/community.css").write_text(".plus{display:block}")
        (self.plus / "plus/extensions/assets/badge.svg").write_text("<svg/>")
        (self.plus / "plus/extensions/manifest.json").write_text(json.dumps({
            "runtime_modules": ["community.js"],
            "stylesheets": ["community.css"],
            "assets": ["badge.svg"],
        }))
        # Previous release already assembled its declared Plus extension.
        (self.plus / "src/js/components/plus").mkdir(parents=True)
        (self.plus / "src/js/components/plus/community.js").write_text("old extension")
        (self.plus / "src/js/runtime-order.json").write_text(
            '["components/base.js","components/plus/community.js"]')
        (self.plus / "plus/sync/state.json").write_text(json.dumps({
            "personal_tag": "409", "personal_sha": "a" * 40, "plus_release": 415,
        }))
        (self.plus / "supabase").mkdir()
        (self.plus / "supabase/unchanged.sql").write_text("-- preserve user's Plus schema")

    def test_one_way_import_preserves_extensions_and_data(self):
        before = {p.relative_to(self.personal): p.read_bytes()
                  for p in self.personal.rglob("*") if p.is_file()}
        sync(self.personal, self.plus, "410", "b" * 40, 416)
        after = {p.relative_to(self.personal): p.read_bytes()
                 for p in self.personal.rglob("*") if p.is_file()}
        self.assertEqual(before, after, "Personal checkout must never change")
        self.assertEqual((self.plus / "supabase/unchanged.sql").read_text(),
                         "-- preserve user's Plus schema")
        base = (self.plus / "src/js/core/constants/001-constants.js").read_text()
        self.assertIn("puaqaobplyrdrujapznp", base)
        self.assertNotIn("wgeijxfdpgehesxialxm", base)
        self.assertNotIn("personalpublic", base)
        self.assertIn("sb_publishable_pluspublic", base)
        self.assertEqual((self.plus / "src/js/components/plus/community.js").read_text(),
                         "window.PLUS_EXCLUSIVE=true;")
        self.assertTrue((self.plus / "assets/plus/badge.svg").exists())
        self.assertIn("assets/css/plus/community.css", (self.plus / "index.html").read_text())
        self.assertEqual(json.loads((self.plus / "src/js/runtime-order.json").read_text()),
                         ["components/base.js", "components/plus/community.js"])
        self.assertEqual((self.plus / "VERSION").read_text(), "416\n")
        self.assertEqual(json.loads((self.plus / "plus/sync/state.json").read_text())["personal_tag"], "410")
        with self.assertRaisesRegex(RuntimeError, "already mirrored"):
            sync(self.personal, self.plus, "410", "b" * 40, 417)

    def test_unknown_unregistered_plus_modules_block_update(self):
        (self.plus / "src/js/runtime-order.json").write_text(
            '["components/base.js","components/plus/unknown.js"]')
        with self.assertRaisesRegex(RuntimeError, "not all registered"):
            sync(self.personal, self.plus, "410", "b" * 40, 416)
        self.assertEqual((self.plus / "VERSION").read_text(), "415")


if __name__ == "__main__":
    unittest.main()
