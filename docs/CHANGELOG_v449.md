# MediaFlow Plus v449 — Personal v554 synchronization

Inherited Personal stable v554, commit b7aa389372d6f5b2ce301f77b8f70f5712997a66.

Personal is read-only. Plus Supabase, existing user data, and Plus-exclusive extensions are retained.

## Inherited Personal changes

v554 Stable: External ratings refresh now attempts all enabled and ready rating providers instead of narrowing the search to providers matching IDs already saved. Titles without supported IDs remain eligible for title-based discovery. Romanized, English, original and alternate title variants contribute to the title signature, and verified provider IDs are saved through the existing guarded merge while unrelated metadata remains untouched. Existing authentication, provider readiness, metadata locks, request limits and stale-title guards remain in place. No schema or Supabase changes.


## Rollback

backup/before-sync-449-personal-554
