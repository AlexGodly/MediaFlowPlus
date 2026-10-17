# MediaFlow Plus v430 — Personal v479 synchronization

Inherited Personal stable v479, commit 2d6cd0849524f2efcf53d699041dfd989f3025e3.

Personal is read-only. Plus Supabase, existing user data, and Plus-exclusive extensions are retained.

## Inherited Personal changes

# MediaFlow v479 — Fix External Ratings Refresh Icon

## Fix
- The existing **Refresh external ratings** control already called `mf425Icon('refresh',17)`, but the shared `MF425_PATHS` icon registry did not define `refresh`. Its fallback drew `MF425_PATHS.images`, displaying a picture icon instead of the requested refresh symbol.
- Register a dedicated two-arrow clockwise refresh SVG path in `MF425_PATHS.refresh`. The existing v467 button immediately picks it up in **Edit/Add Title** and **Title Details** (including refreshing/busy state). No additional circle-arrow control is added elsewhere.
- The button's click handler `App.mf467RefreshRatings`, disabled/busy behavior, progress feedback, API/provider logic, rating values and Supabase data remain exactly unchanged.
- Icon inherits the button's text color and MediaFlow theme and preserves the current 17px icon size.

## QA
- `node scripts/test-v479-rating-icon.cjs`: verifies semantic refresh SVG, no image fallback, same button text/onclick and editor/details/busy behavior.
- `node scripts/test-v479-browser.cjs`: actual Chromium rendering and preserved responsive UI regressions (320px/mobile/tablet/desktop).
- PWA/worker version, cache update, interrupted upgrade rollback and standard `scripts/check.py` quality gates.
- Archive complete release source in `legacy/v/479`, deploy via GitHub Pages and publish numeric `479` Stable release with ZIP and SHA256.



## Rollback

backup/before-sync-430-personal-479
