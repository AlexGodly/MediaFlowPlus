# MediaFlow Plus v412 — Community restoration (development draft)

**Baseline:** v411 Plus production. **Date:** October 13, 2026. **Developer:** Alex Godly.  
**Branch:** `feature/v412-smart-filters-inbox-live-community`  
**Status:** In development; not released or deployed. Personal Edition must remain untouched.

## 1. Community Home — restored
- Dedicated Community Home landing with responsive, theme-aware welcome section.
- Navigation to Browse Titles, People, Community Collections, Top Titles, Friends, Inbox and Feed.
- Public collections appear as owner-linked cards, fetched on demand, and source Community posts remain their existing social records.
- Empty-state treatment for no published collections or posts.

## 2. Canonical live Browse and Top rankings
- Verified MAL/SIMKL titles are projected **directly from opted-in source workspaces**. No copied title/media catalog, ratings mirror, or materialized public snapshot.
- Title search, alphabetical and public-rating sorting, source-aware results, pagination and explicit Quick Add.
- Opt-in for Library visibility plus separately controlled `show_ratings`; no public browse results from private profile or disabled public showcase.
- Ranked titles derive from the same current, published rating projection; the UI discloses scan truncation.
- Safety/performance limit: max 50 opted-in public workspaces scanned, 20,000 distinct matched media keys and 40 results per request. Not an exhaustive global leaderboard.
- Provider keys are constrained before inclusion in dynamic UI actions.

## 3. Friends, Inbox and Collections
- Live Following/Followers/Mutuals from `mfp_follows`; existing v412 Inbox and mini Inbox preserved.
- Replaces legacy shadow-collection authoring in Community Collections view with directly linked, currently published workspace collections.
- Original canonical Collections may be published/unpublished from their owner's workspace using small reference/permission records only.
- Subscriptions store reference IDs only and follow current owner edits. Existing manual, *explicitly confirmed* Convert and Quick Add remain the only independent-copy paths; nothing is automatically cloned.

## 4. Public workspace profiles and pages
- Live profile, category counts/aggregate statistics and explicitly shared Collections.
- Individually opt-in/opt-out read-only public Library, History, Personal Order, Old System, Statistics, Ratings, and Level tabs.
- Current authoritative XP/Level parity remains **unverified**: the level tab deliberately shows an unavailable notice rather than inventing a computed number.
- Every page rechecks the profile's public status, enabled showcase and specific section permission before accessing canonical state.
- Revocation immediately removes future access; private profiles return 404; private sections return 403.

## 5. Privacy and data integrity
- Canonical source remains `public.mediaflow_states.state_data`; Community stores only posts, relationship metadata, references and explicit user-written social content.
- Public Edge Function uses allowlisted, paginated outputs; never sends full state or service-role credentials.
- Read-only GET/OPTIONS server; private Settings, library notes, account metadata and full state are not returned.
- No destructive migrations; **no changes** to MediaFlow Personal GitHub, Supabase, live website, releases, archives or user data.

## 6. Tests and verification
- CI builds modular MediaFlow JavaScript and checks syntax.
- Added source contracts for Community Home, live Browse, profile pages and permissions.
- Added synthetic Edge-function tests for default-private access, independent publication permissions, opt-in ratings, immediate unpublishing and prohibition on database writes.
- Synthetic-account Chromium regression for Dashboard, Library, History, Community and expired-session recovery.
- Responsive synthetic-browser regression across desktop (1440px), tablet (820px), mobile (390px) and narrow mobile (320px); includes Home, Browse, Top and public-profile projection.
- **Release gates not yet met:** all checks green at final head, real two-account cross-user and revocation verification, production data compatibility, complete historical v302–v329 feature parity and go-live approval.

## 7. Deployment
- This is a **development branch only**. v411 production, the live Plus Edge Function and Plus Supabase data have not been modified by this change set.
- The new Edge implementation must be reviewed and deployed to **Plus only**, with permission tests, before the new directory/Browse/section endpoints become live.
- No version tag, GitHub Release, production commit or rollout until tests and scope are approved.

## 8. Compatibility
| Surface | Status |
|---|---|
| Desktop/tablet/mobile layouts | Added; synthetic regression under CI |
| Plus production | Unchanged |
| Plus canonical user data | Unchanged by development commits |
| Personal Edition repo/database/deployment | Unchanged |
| Public profile/collection privacy | Strict opt-in, read-only projection |
| Legacy full feature parity | In progress |


## 9. Community Home, Workspace gateway and nested navigation (restored after review)
- Real public Community Home at the dedicated #/community/home route, available before sign-in, with polished Home, Browse Titles, Collections and Top Titles destinations.
- Public Home has a prominent My Workspace gateway. Signed-in users return to the actual private Dashboard/Library/History workspace; visitors who are not logged in go to the existing sign-in form. Authentication and canonical state persistence are preserved.
- The account login screen includes an optional Explore the Community Home entry.
- Separate private Workspace label/header in the existing sidebar. All existing Workspace navigation continues respecting the canonical v161 saved visibility and ordering.
- Community is a nested, collapsible sidebar group with Home, Browse Titles, Community Collections, Top Titles, People, Feed, Friends, Inbox, Notifications, Reviews and Public Profile.
- The existing independent Inbox page remains authoritative for messages. The Community Inbox link routes to it rather than creating a second conversation database.
- Mobile More uses the same nested, collapsible Community group and responsive navigation. The sprawling duplicate top tab strip on the Community page is removed.
- Settings → Navigation now includes Community group visibility, expansion, page hide/show, up/down ordering and Restore Defaults; settings are persisted with the existing Settings state, not with a second local database.
- Public Community pages never read private S.library state. Live public directory requests are routed through the existing visibility-gated read-only endpoint. The Home renders a usable empty/recovery state while the Plus-only endpoint has not yet been deployed.

**Additional checks:** source-level navigation/guest route contracts and synthetic Chromium browser tests of Home, Workspace, desktop collapse, intermediate/mobile More, active menu states, and horizontal overflow. These are required gates before production.
