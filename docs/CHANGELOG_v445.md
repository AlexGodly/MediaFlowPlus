# MediaFlow Plus v445 — Personal v550 synchronization

Inherited Personal stable v550, commit bb343bd4a49c84576ee4fa6ae06877a268b4d454.

Personal is read-only. Plus Supabase, existing user data, and Plus-exclusive extensions are retained.

## Inherited Personal changes

v550 Stable: Reduces main-thread work from automatic external-rating intelligence on large Libraries. Background scans now inspect small chunks at a bounded cadence, pause while the page is hidden, and reuse recently loaded rating checkpoints in memory instead of repeatedly reading localStorage. Explicit external-ID-change refreshes keep priority. v549 Dashboard aggregation and v548 large-Library Logging optimizations remain included. No Library, progress, History, XP, collection, personal-order, cloud, or Supabase schema changes.


## Rollback

backup/before-sync-445-personal-550
