# MediaFlow Plus v442 — Personal v546 synchronization

Inherited Personal stable v546, commit 352ab84882290c721978253b14b220bc11de2570.

Personal is read-only. Plus Supabase, existing user data, and Plus-exclusive extensions are retained.

## Inherited Personal changes

v546 Stable: Add designed recovery lock-conflict controls for Cover Recovery and Metadata Recovery. Resume Safely requests a cooperative pause and fences the previous worker before waiting for its active legacy lease to release. Force Start fences the previous process immediately, waits for in-flight provider requests and Library saves to settle, and presents an explicit final confirmation if an unresponsive worker will not release its lease. Takeover copies the latest durable cursor into a separate per-account queue key so older tabs cannot overwrite the new checkpoint. Expired locks no longer block recovery; cancellation preserves the existing queue; cross-tab handoff asks v546 workers to pause and abort provider requests. Regression tests cover both recovery types, latest-checkpoint selection, lock fencing, queue isolation, stale lease expiry, and waiting for active leases. No Library fields, ratings, progress, History, XP or Supabase schema are changed by this feature.


## Rollback

backup/before-sync-442-personal-546
