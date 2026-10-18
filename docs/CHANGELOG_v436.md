# MediaFlow Plus v436 — Personal v505 synchronization

Inherited Personal stable v505, commit 0f0b6ab2652ffc4aafbe4585d0f5fffd18a5b5a0.

Personal is read-only. Plus Supabase, existing user data, and Plus-exclusive extensions are retained.

## Inherited Personal changes

## MediaFlow v505 Stable — Responsive Navigation Handoff

Built on v504 Stable, preserving previous releases and the rollback-safe foundation.

- **No overlapping menus when resizing:** the mobile bottom navigation activates at viewport widths of **1080px and below**, while desktop menus are exclusive to **1081px and above**.
- **All desktop styles covered:** sidebar, mini sidebar, top dock, and bottom dock are hidden while the mobile bar is active; the saved desktop navigation mode is restored when widening the window.
- **Responsive logic fixed at the source:** aligns v421/v422/v423 navigation CSS and the desktop eligibility function with the existing v277/v278 mobile-tabbar breakpoint, removing the 861–1080px conflict.
- **Preference safety:** narrow-window layouts override stale desktop-forced CSS without overwriting the user's navigation-style setting.
- **Lifecycle cleanup:** deactivates hidden dock interactions, closes its overflow/popup state, and cancels in-progress desktop drag dropzones when switching to mobile.
- **PWA:** rebuilt v505 script, service-worker cache, and version metadata so installed MediaFlow updates pick up the fix.
- **Regression checks:** coverage for phone, tablet and narrow desktop widths, including 1080/1081 boundary, responsive CSS guards and generated assets.
- **No migrations:** Supabase data, Library, Logging and recovery workflows remain unchanged.

Includes the complete version source snapshot and SHA-256 checksum.



## Rollback

backup/before-sync-436-personal-505
