# MediaFlow Plus v440 — Personal v536 synchronization

Inherited Personal stable v536, commit f2d46f67d9aa2c1799bc442ce5c7e8e35e3929a5.

Personal is read-only. Plus Supabase, existing user data, and Plus-exclusive extensions are retained.

## Inherited Personal changes

v536 Stable: Fix incorrect categoryStatus(...).status lookups that forced Rotation XP to x1 despite user settings. All Quick Logging, Advanced Logging, Batch Logging, XP preview, skipped History records and edited History now use actual Neglected, Due, Healthy or Overused category health to apply configurable XP multipliers. Respect user-selected zero multipliers, preserve legacy unknown-status fallback, leave already-stored historical XP untouched and avoid duplicate XP rewards. Regression-test actual source for four health states, preview/streak math, submit paths, History edit and cloud/PWA continuity. Includes full legacy/v/536 archive, ZIP, SHA256 and GitHub Pages deployment. No Supabase schema or data migration.


## Rollback

backup/before-sync-440-personal-536
