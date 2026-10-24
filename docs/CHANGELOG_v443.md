# MediaFlow Plus v443 — Personal v547 synchronization

Inherited Personal stable v547, commit 03beec2e28977c00c3827499eb0b39f9757edcc6.

Personal is read-only. Plus Supabase, existing user data, and Plus-exclusive extensions are retained.

## Inherited Personal changes

v547 Stable: Add ID-first External Ratings Intelligence with automatic rating refresh and missing-rating backfill across saved Library titles. External Ratings Intelligence uses saved IMDb, MAL, AniList, Kitsu, TMDB, Trakt, SIMKL, TVmaze, VNDB and other supported IDs to prioritize compatible providers. Saving changed IDs queues an automatic refresh; missing ratings across existing Library titles are backfilled gradually while MediaFlow is open and online. Refresh reuses the existing verified provider adapters and rating-only merge path, respects provider configuration, auth readiness, rate limits and recovery locks, preserves existing ratings on failure, and never overwrites manually locked ratings or personal ratings. Periodic refresh of already-populated ratings is opt-in; newly retrieved ratings are eligible for scheduled refresh. Regression tests cover ID-provider mapping, automatic enqueue, bounded retry state, auth/online guards, lock coordination and preservation of existing Library/History/XP data. No Supabase schema change.


## Rollback

backup/before-sync-443-personal-547
