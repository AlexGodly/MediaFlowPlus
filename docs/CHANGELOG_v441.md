# MediaFlow Plus v441 — Personal v545 synchronization

Inherited Personal stable v545, commit 37b7ef7e8ca0d8e13738a5363267dc6e6049dd80.

Personal is read-only. Plus Supabase, existing user data, and Plus-exclusive extensions are retained.

## Inherited Personal changes

v545 Stable: Repair a production-blocking JavaScript ReferenceError in v514 Settings/Balance integration. Removed the unconditional reference to a retired v264BalanceMarkup renderer; the optional legacy renderer is extended only if present. This restores initialization of all later runtime extensions, including XP projection, live Logging card repair and v544 reward guarantee. Hoist v537 numeric and formatting helpers so an early Logging render cannot trigger a temporal-dead-zone crash. Guard the retired v265 Balance enhancement to avoid unrelated Dashboard errors. Regression tests reproduce startup with the legacy function absent and present, early XP helper usage, Advanced Logging 15 units/3h30m, preservation of the XP guarantee, and production bundle ordering. No Supabase schema change, History rewrite or XP adjustment. Publish full legacy/v/545 archive, Stable ZIP, SHA256 and GitHub Pages deployment.


## Rollback

backup/before-sync-441-personal-545
