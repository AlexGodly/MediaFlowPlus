# MediaFlow Plus v446 — Personal v551 synchronization

Inherited Personal stable v551, commit 989d12a39ea872e24b9695d07b2041e22e7936cc.

Personal is read-only. Plus Supabase, existing user data, and Plus-exclusive extensions are retained.

## Inherited Personal changes

v551 Stable: Removes the repeated full-Library validation pass from Logging search, reuses pre-indexed title metadata and lazy sorted indexes in Batch Log, and avoids rebuilding all Library caches when only last-seen metadata changes. Last-seen persistence is deferred to idle time where supported. These changes target app-wide main-thread stalls affecting selection, editing, navigation, and large-Library interactions. Existing search/filter/sort behavior and user data remain authoritative. No Supabase schema changes.


## Rollback

backup/before-sync-446-personal-551
