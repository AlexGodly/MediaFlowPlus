# MediaFlow Plus v447 — Personal v552 synchronization

Inherited Personal stable v552, commit 8c1c3273019aa285c2dac7efe70c31e692a3d6b8.

Personal is read-only. Plus Supabase, existing user data, and Plus-exclusive extensions are retained.

## Inherited Personal changes

v552 Stable: Replaces the native JavaScript Delete Collection confirmation with a responsive, accessible MediaFlow dialog that follows the active theme. Cancel, Escape, close, and backdrop clicks leave the collection unchanged. Deletion still uses the existing collection removal, tombstone, cloud persistence, and refresh behavior. The Library and title progress are preserved. No Supabase schema changes.


## Rollback

backup/before-sync-447-personal-552
