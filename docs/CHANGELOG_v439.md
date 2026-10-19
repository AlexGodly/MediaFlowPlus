# MediaFlow Plus v439 — Personal v530 synchronization

Inherited Personal stable v530, commit 95677b2bbf45d57ae720f6609b557acaf223a964.

Personal is read-only. Plus Supabase, existing user data, and Plus-exclusive extensions are retained.

## Inherited Personal changes

v530 Stable: Fix the actual Add/Edit Category renderer inherited from v144, which still showed only Video and Reading despite the v527 universal-media expansion. All category modals now show Watching, Reading, Playing and Listening; retain the internal video identifier for legacy compatibility and existing category data. Verify rendered HTML, selected edit values, stable cloud save path and full PWA bundle. Preserve 24 packaged category icons, 15 units, XP and cloud data. No Supabase migration.


## Rollback

backup/before-sync-439-personal-530
