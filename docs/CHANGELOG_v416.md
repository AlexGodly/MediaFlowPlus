# MediaFlow Plus v416 — Automatic one-way synchronization

**Personal Edition → MediaFlow Plus only. Never Plus → Personal.**

This release activates automated inheritance of new **published stable Personal releases**. MediaFlow Plus continues to use its independent Supabase accounts, libraries, settings, history and backups. No user data is copied.

The Plus-only GitHub Actions workflow checks new Personal stable releases every 15 minutes (actual GitHub scheduling can be delayed). It skips unchanged releases. On change, it checks out Personal strictly read-only, copies the shared frontend, restores the existing Plus publishable Supabase configuration, reapplies the Plus-exclusive feature manifest, runs isolated tests, builds the bundle/PWA, creates a monotonic numeric release and rollback branch, and requests a new Plus Pages deployment.

New Plus-exclusive frontend features belong in `plus/extensions/runtime/` (JavaScript), `plus/extensions/styles/` (CSS) and `plus/extensions/assets/` (images). Register their filenames in `plus/extensions/manifest.json`. This ensures future Personal imports cannot silently overwrite them. Changes requiring Plus database migrations require separate review; no automated source workflow edits either database.

**Initial synchronization state:** Personal v410 → Plus v416. When Personal releases v411, Plus can inherit it as v417 automatically, provided every safety check passes.

**No edits to MediaFlow Personal**, its repository, Supabase, release tags, workflow settings, or deployment. Existing Plus v415 remains a rollback release.