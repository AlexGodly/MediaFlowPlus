# MediaFlow Plus v452 — Personal v560 synchronization

Inherited Personal stable v560, commit 1ee0cc3b62cd2963241f2ac2066a57a45a0ba805.

Personal is read-only. Plus Supabase, existing user data, and Plus-exclusive extensions are retained.

## Inherited Personal changes

## MediaFlow v560 Stable

### TMDB really is on now
- v559 switched TMDB on in your cover settings, but if you had a recovery job saved in your browser, MediaFlow kept using that job's older source list everywhere — so Find cover automatically still said TMDB was "off for background recovery" and never asked TMDB.
- TMDB is now included whenever it's on in your settings, even with a saved job, and the saved job is updated so resuming it uses TMDB too.
- Troubleshooting: run `MediaFlowV560.diagnose()` in the browser console to see which cover sources are on.



## Rollback

backup/before-sync-452-personal-560
