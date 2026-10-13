# MediaFlow Plus — Community restoration research (Personal v302–v329, read-only)

**Date:** October 13, 2026  
**Destination:** `AlexGodly/MediaFlowPlus` ONLY  
**Source inspected:** archived `AlexGodly/MediaFlow` **beta** files and releases at tag `329`.  
**Non-negotiable:** NO commits, branch updates, deployments, migrations, functions, data edits, deletions, or other writes to MediaFlow Personal.

## Decision: bring back the v329 *architecture*, not the old media snapshots

The historical Community implementation changed architecture during development. Restoring all v302–v326 publishing mechanics would reintroduce the very copied data the owner forbids. Restore social interactions and UI concepts, but derive every public media item and statistic from the **same canonical owner workspace cloud state**.

`mediaflow_states.state_data` is a **private compressed JSONB snapshot**. Never grant other users or anonymous browsers row access to that snapshot. The Plus server must read the owner's current successfully synced state behind an explicitly opted-in authorization gate, return only allowlisted display fields for the requested section, and never persist any projection. Publication permissions, relationships, subscriptions, message records and other **new social interactions** may have independent records: they are not clones of existing workspace media.

The owner is the only editor of their Library, Collections, Personal Order, History, XP and settings. A viewer sees a read-only public projection. A subscriber sees a live reference. Explicit conversion to My Collections creates an owner-independent copy *in the subscriber's own private workspace only*.

## Historical feature-by-feature inventory (verified against archived beta release notes)

| Historical release | Restorable Community function | Plus adaptation |
|---|---|---|
| **v302** | Guest homepage, public usernames/profiles and URLs, Friends, Inbox, direct messages, blocks, shared media Browse, Ratings, Collections, floating chat | Reuse ideas; **reject v302 public media replication/publishing** |
| **v303** | Guest route, Community navigation/semantic icons, logo and PWA route repair | Bring guest links and accessible navigation |
| **v304** | Public Statistics and local-startup repair | Render opted-in owner-computed stats; never publish Statistics snapshots |
| **v305** | Navigation and auth session reliability | Prevent guest/auth route loops; recover expired sessions |
| **v306** | Community click controls repair | Confirm all buttons navigate/do work |
| **v307** | Login route navigation errors fixed | Deep-link authentication continuity |
| **v308** | Dynamic theme parity | Honor Workspace themes for signed-in Community; safe public guest theme |
| **v309** | Browse five views, advanced search/filter/sort, MAL/SIMKL canonical IDs, validated Quick Add | Live search over opted-in authoritative Libraries; importing is an explicit **viewer** action |
| **v310** | Collection directory, read-only detail, five views, creator attribution, saved Community Collections | Publish collection **ID permission**, subscribe by reference; no collection/title payload copies |
| **v311** | Ratings leaderboard, top-three podium, global rank and Quick Add | Aggregate opted-in ratings from original Library, not another reviews/rating table |
| **v312** | Ratings filters and revision refresh, user rankings, private usage opt-in, sharing links | Live on-demand ranking calculations; exact permission-specific metrics |
| **v313** | Community polish, public profile and saved Collection fixes | Reuse UI patterns; no snapshots |
| **v314** | More provider sources, Community exploration and rankings polish | Verified identity IDs only; no duplicate title groups |
| **v315** | Workspace sidebar & two-level Community nav | Native Plus navigation settings and mobile More |
| **v316** | Active-time XP, Statistics and fresh rankings | Only recreate if Plus has an authoritative server time ledger; never infer fictitious historic XP |
| **v317** | XP controls, title-start and Statistics ordering, Community refresh | Keep Plus engine authoritative |
| **v318** | Unified Community refresh bar and Statistics grouping | UI consistency, lifecycle-safe refresh |
| **v319** | Single semantic Refresh icon across Community | One refresh interaction per section, loading/failure state |
| **v320** | Premium Friends/Inbox redesign, Following/Followers/Mutuals, searching, responsive conversations | One message source and one canonical social relationship graph |
| **v321** | Friends semantic icons, flash-free Community Collections empty state | Correct first paint and icon semantics |
| **v322** | Sidebar identity opens the correct public profile | Same identity route, safe unshared fallback |
| **v323** | Profile Studio, public tabs, themes, favorites, Level and XP | Restore **visibility settings only**; reject its duplicated public snapshot tables |
| **v324** | Workspace-like Library/Collections/Order/Old/History/Stats profile tabs | Original owner's data, read-only display |
| **v325** | Native Workspace renderer parity | Use read-only compatibility layer and disable every write or mutation action |
| **v326** | Native Statistics presentation | Derive view from canonical owner state instead of public Statistics mirror |
| **v327** | Secure live private-cloud → whitelisted public section projection | **Primary reference architecture** |
| **v328** | Full single-source Community Browse, Ratings, Users, Collections, subscriptions; old mirror cleanup | **Primary reference architecture**; no title/rating/History/XP copies |
| **v329** | Accurate Category icons, Collection public/private control, public History titles, safe Quick Add, XP parity | Restore with tests against current Plus engine rather than blindly porting historical XP math |

### Historical sources

- `beta/docs/CHANGELOG_v303.md` through `beta/docs/CHANGELOG_v329.md` on Personal Edition tag `329`; v302's release body at `releases/tag/302`.
- `beta/supabase/functions/mediaflow-public-live/index.ts` (v327–v329 native profile projection).
- `beta/supabase/functions/mediaflow-community-live/index.ts` (v328–v329 live aggregation).
- `beta/src/js/components/251-v327-live-public-workspace.js`, `252-v328-single-source-community.js`, `253-v329-public-profile-parity.js`.
- **Read-only sources**: these are reference implementations, not files to change in Personal Edition.

## Target Plus components and privacy contract

### Private canonical model

- **Library:** the owner's `state_data.library`.
- **Collections:** the owner's `state_data.collections`, `titleIds` and owner Library entries.
- **Ratings:** each owner's actual Library title rating; aggregate server-side *when requested* by verified provider ID.
- **Ranks:** calculate from current allowed inputs on demand; real global position before pagination and search. Do not use replicated leaderboard rows.
- **XP and Level:** compute from current owner's canonical XP ledger, sessions, settings and any authoritative Plus server-ledgers. Match the Plus Workspace formula exactly before displaying a Verified/Level comparison.
- **Personal Order:** the owner's original `state_data.orderPlan` and collection assignments.
- **History:** the owner's original sessions; resolve title and cover against their original Library for viewing.
- **Old System / Statistics:** derive the permitted read-only sections from owner's original saved state.
- **Profile Favorites:** keep only canonical title IDs and visibility settings; resolve titles/covers from owner's state at read time.
- **Public Collections subscriptions:** `(subscriber_id,owner_id,collection_id)` references, never a media snapshot.
- **Public collection publishing:** `(owner_id,collection_id)` permissions, never a media snapshot.
- **Inbox/Friends/follows/posts:** first-class social objects, not clones of existing workspace media.

### Guest/public views

- Opt-in profile; opt-in **per section**.
- Individual Collection publishing independent of exposing the full Library.
- Library, History, Order, Old System, Statistics, Ratings and XP may be independently hidden.
- Server-side checks must reject disabled fields **before** reading or emitting section contents; the frontend alone is never a privacy boundary.
- Read-only actions must be non-mutating even when adapted from the owner's Workspace renderer. Quick Add writes to the **viewer's** private Library after explicit confirmation, never to the owner's account.
- Private title descriptions, raw cloud payloads, user identifiers beyond needed public linkage, private notes, secrets, authentication tokens and unrelated settings are never emitted.
- Hide/unpublish should revoke access immediately upon the next authorized request. Avoid caching sensitive responses.

## Actual Plus implementation and gaps

**Already established in Plus**:
- Plus-only `mfp_profiles`, `mfp_messages`, `mfp_blocks` and other Community relationship tables.
- Plus-only owner `mediaflow_states` private storage with owner-only RLS, no cross-edition state sharing.
- v412 Plus-only Inbox and floating mini Inbox source, responsive layout, saved message/read receipt integration.
- Plus-only live public workspace Edge projection: original owner state is read at request time, never saved as a second media table.
- Plus-only `mfp_collection_publications` and `mfp_collection_subscriptions` reference rows.
- Profile opt-in visibility fields, default false.
- Plus-only no-copy guard revoking Community's obsolete `mfp_reviews`/`mfp_collections` media-mirror INSERT/UPDATE privileges; **existing rows, if any, are preserved**.
- Personal v406–v408 Smart Filters, picker refinements and performance changes were inspected and selectively ported to Plus-only source.

**Not yet demonstrated at production parity**:
- Full read-only public versions of **every** Workspace page (Library, Personal Order, Old System, History, Statistics) with all safe original controls.
- Global live Browse/Top Ratings/Level Rankings across an unbounded community; this is more expensive than cached mirror tables and needs batching/limits or a normalized **authoritative** backend schema, not duplicate public tables.
- Cross-account native XP parity for the current Plus leveling/XP engine.
- Complete public favorites and verified-provider Quick Add.
- Two real Plus-account privacy tests, live concurrent owner updates, blocked-user access and unsubscribe/unpublish tests.
- Scale/performance measurements for tens of thousands of Library titles across many participating accounts.

## Backend scaling caveat

Personal v328 itself documented that decompressing **every public account's full state** on every global search is expensive. At a larger scale, the correct optimization is to normalize the **authoritative primary Library data store** into searchable private rows and use access-controlled server queries against that store. It must *replace or be the canonical source*, not introduce a second mirrored public Library. Until such a migration is designed and proven, keep requests bounded and never claim globally comprehensive rankings from partial scans.

## Done criteria

1. Add public tabs and visibility configuration, defaults private.
2. Query authoritative owner source via audited allowlisted API; no media mirrors.
3. Mirror the six Workspace page designs **without private editing actions**.
4. Support public Browse, Ratings, users/ranks, Quick Add with verified provider identities and owner consent.
5. Follow/Followers/Mutuals, full Inbox and floating inbox: one social/messages source.
6. Collections subscribe → owner edit → subscriber refresh reflects change without duplicated rows; Convert creates a new **private owner-independent collection**.
7. Verify guest and two-account reads; hidden tabs return 403/404; private raw `state_data` never exposed.
8. Run browser/PWA/data-contract regressions and Plus-only Supabase RLS/security advisors.
9. **Never write to MediaFlow Personal.**

This is an architectural restoration plan and audit, not a claim of full historical-feature parity or completion.
