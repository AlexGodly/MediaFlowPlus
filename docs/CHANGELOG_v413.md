# MediaFlow Plus v413 — Live Community Workspace Integration

**Version:** 413 Modular / Stable  
**Baseline:** MediaFlow Plus v412  
**Release date:** October 13, 2026  
**Developer:** Alex Godly  
**Scope:** MediaFlow Plus repository and Plus Supabase project exclusively  
**MediaFlow Personal:** Read-only historical research; **no changes or deployments**

## 1. Architecture: Community reads original owner data

v413 expands the Plus live public-workspace Edge Function. Library, rated titles, History, Personal Order, Old System, and Statistics views derive from the owner's latest **successfully synced canonical `mediaflow_states.state_data`**. The Edge Function decompresses that state only when an authorized public request needs it and emits an allowlisted, read-only projection.

**It does not save, replicate, mirror, or materialize the owner's workspace data in Community tables.**

- Publication records contain original owner/collection **references**, not collection contents.
- Subscriptions contain subscriber, owner, and original collection **references**.
- Ratings and catalog results are computed in memory **on request** from opted-in owners' Library records.
- Member messages, follows, reactions and social metadata are first-class social objects, not duplicated media libraries.
- Deliberate **Quick Add** or **Convert to my collection** creates data only in the viewer's own private workspace, after explicit action.
- The owner's original cloud workspace remains protected by owner-only RLS. No public raw-state API or cross-user state-table grants were introduced.

## 2. Read-only public workspace sections

The shareable Community profile now supports the following independently publishable sections:

| Public section | Canonical data source | Access control |
| --- | --- | --- |
| Library | Owner `state_data.library` | `show_library` opt-in |
| History | Owner `state_data.sessions` | `show_history` opt-in |
| Personal Order | Owner `state_data.orderPlan.titleIds` resolved against Library | `show_personal_order` opt-in |
| Old System | Owner `state_data.oldSystem.balances` | `show_old_system` opt-in |
| Statistics | Live summaries of canonical Library and sessions | `show_statistics` opt-in |
| Ratings | Live owner Library item ratings | `show_ratings` opt-in |
| Level & XP | Privacy-gated, currently displays parity verification notice | `show_levels` opt-in |

The owner sets visibility in **Community → My profile**. All section toggles default to **private**. The server checks visibility **before** reading and emitting the requested section. Publishing Library alone **does not publish title ratings** unless Ratings is independently enabled.

Public sections render in shareable profile pages as responsive, paginated, read-only tabs; private fields, user notes, private app settings, and entire raw states are omitted.

**Important limit:** The new public tabs are presentation-level showcases, not exact interactive clones of every private Workspace page. XP/Level calculation is intentionally not shown as a number until its current Plus reward-ledger formula is verified.

## 3. Live Browse and Top Ratings

- New **Browse** page and mobile navigation entry; Community's Browse and Top actions use the same canonical data.
- **Titles** discover media with provider IDs from members who explicitly published their Libraries.
- **Top Rated** aggregates actual owner Library ratings only from members who explicitly published Ratings.
- Search and page navigation preserve selected mode.
- Returned results include provider identity, media name, optional HTTPS cover, number of opted-in Libraries, ratings count and average rating as applicable.
- Backend reads current owner cloud states at request time and does **not** write media or ratings copies.
- Scans at most **8 eligible owner accounts** and **75,000 titles per account** in this initial bounded implementation. When the scan is partial, the UI explicitly warns that results are **not comprehensive global rankings**. Only authenticated Plus users can access the global Browse computation.

### Explicit viewer-only Quick Add

Browse offers **+ Add**, opening a category-selection dialog using the viewer's real category configuration and icons. Importing a title:
- Requires explicit selection and confirmation of a destination category.
- Detects existing titles by selected external provider ID to avoid duplicates.
- Adds a new private Library title with fresh personal status/progress in the viewer's workspace.
- Does not alter the owner's source title, collection, ratings, XP, or profile.
- Warns if cloud save fails instead of silently reporting success.

## 4. Historical Personal v302–v329 research

The source history of the canceled Community system was inspected **without writing to Personal Edition**:
- v302–v326 contributed historical Friends, Inbox, Browse, Profile Studio and rich public Workspace UI patterns.
- v327–v329 supplied the model for on-demand secure owner-native projections and no-media-copy Community queries.
- Old mirrored public media, ratings, History, XP, and collection snapshot publication mechanisms were **not** restored.
- Full audit: `docs/COMMUNITY_RESTORATION_PERSONAL_v302_v329_READONLY_AUDIT.md`.

## 5. Regression, security and operational checks

**Verified:**
- Python modular build and production JavaScript syntax verification: PASS.
- Automated Chromium authenticated-synthetic navigation of Dashboard, Library, History, Community, Friends, Inbox, Browse, About, plus critical mini Inbox and guest public profile routes: PASS.
- Synthetic public Edge tests: section visibility, private-field redaction, independent ratings visibility, paging, user blocks, original-source marker, and on-demand Browse and Top consent gates: PASS.
- Separate Plus public Edge endpoint discovery HTTP health check: PASS.
- Database review: zero rows in obsolete Community media `mfp_reviews` and `mfp_collections` tables at audit time; neither accepts normal authenticated INSERT/UPDATE.
- The Plus source files contain no Personal Edition backend endpoint, and Personal Edition was not modified.

**Still required before full historical Community parity:**
- Real two-account + guest browser verification of permission revocations, subscriptions, conversions, messaging and blocking.
- Profile read-only interface parity for all private Workspace controls and modes.
- Live cross-user Level/XP formula parity (v334 rewards and all later changes), accurate global level ranks, and a validated server-side active-time ledger.
- Pagination/global search scalability across more than eight eligible accounts. Current bounded Browse and Top are **not** worldwide rankings.
- Verification of cloud sync/PWA updates and large-library frame timings on physical Android/Windows devices.

**Supabase security advisor (Plus):** one existing Auth warning for disabled leaked-password protection; no new database schema security findings from this release. Performance advisor reports several informational historical foreign-key indexes.

## 6. Source changes

- `src/js/components/306-v412-live-public-workspaces.js`: add opt-in public Workspace sections, profile controls and page rendering.
- `src/js/components/308-v413-live-browse-top.js`: live Browse/Top, provider-aware Quick Add, viewport-aware controls, and release bugfix for duplicate renderer/paginator names.
- `assets/css/220-v413-live-workspace-tabs.css`, `assets/css/221-v413-community-live-browse.css`: responsive, theme-aware UI.
- `src/js/runtime-order.json`, `index.html`: wire the new runtime and styles.
- `supabase/functions/mfp-public-workspace/index.ts`: canonical server-side section projections and bounded Community aggregation, deployed **only to Plus**.
- `tests/live-public-projection.cjs` and `tests/community-critical-pages-smoke.cjs`: new privacy and browser contracts.
- `.github/workflows/ui-regression-smoke.yml`: require the Edge privacy tests.
- `VERSION`, `version.json`, `package.json`, versioned bundle and PWA shell: v413 release metadata.

**No Personal Edition source, database, deployment, release, or user data was changed.**
