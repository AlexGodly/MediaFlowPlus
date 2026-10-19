# MediaFlow Plus v438 — Personal v516 synchronization

Inherited Personal stable v516, commit 76e58c22e4df7c91abc929b865e813cabe9f8d17.

Personal is read-only. Plus Supabase, existing user data, and Plus-exclusive extensions are retained.

## Inherited Personal changes

Fix the Settings Center jumping to the top when selecting, hiding, or reordering categories in Today’s Balance and Library Overview Display. Save changes without full page rerenders, keep the current expanded Settings section, preserve scrolling inside category lists and document, retain keyboard focus, and refresh follow-source previews. Regression tests cover both panels, bulk visibility, master toggles, balance scope, and persistence. Fully rebuilt PWA, service worker, release archive and cloud-compatible data.


## Rollback

backup/before-sync-438-personal-516
