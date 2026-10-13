# MediaFlow Plus v412 — Smart Organization, Inbox & Live Community Workspace

**Edition:** MediaFlow Plus by Alex Godly  
**Baseline:** MediaFlow Plus v411  
**Development date:** October 13, 2026  
**Personal Edition:** Read-only comparison; **no Personal repository/database writes**  
**Supabase:** Plus project `puaqaobplyrdrujapznp` only

## 1. Personal Edition v406–v408 audit and safe integration

The v406, v407 and v408 Personal release notes/source were examined as *read-only references*. Plus retains its independent authentication, Community, Supabase, and release history.

- **v406:** Three-way membership filters in Personal Order Add Titles, Add Collections, and Logging Library; each filter checks current target membership, never main-Library existence by itself.
- **v406/407:** Searchable bulk category/status/priority actions based on canonical Set Category/Status/Priority order and visibility; actual configurable category artwork, semantic status/priority icons, and exactly one icon per action option. Unlike Personal v407's compact status/priority lists, **Plus keeps all three action pickers searchable**, as requested for the new Plus update.
- **v408:** Linear-time repeat/history lookups, same-turn repeat and Logging-candidate memoization, responsive Logging Browse Library grids, searchable Collections category filters in both the browser and Add Titles, and current-release portable export stamps.
- **About:** Personal v408 About-page source already matched the Plus source exactly. Retained its FAQ, features, developer/contact links, and page structure; routed Plus update checking and “Open latest web app” to MediaFlow Plus instead of Personal.

These are source-level ports rather than a wholesale copy of Personal Edition; Personal Edition code and data remain untouched.

## 2. Dedicated Inbox + floating mini inbox

- Separate Inbox page added to desktop navigation and mobile More menu.
- Floating Inbox action opens a compact conversation panel across the app with unread badge.
- Conversation grouping, recipient search, send/reply, read receipts, relative message dates and responsive desktop/mobile layout.
- Uses the pre-existing **canonical `mfp_messages` table**, not a second message dataset.
- Optional Realtime Postgres events and periodic fallback refreshing.
- Existing Community Messages and Message member actions route into the canonical Inbox.
- Authenticated-account changes clear local message caches and per-conversation state.
- Restricts recipient UPDATE grants to `read_at`; other message fields cannot be edited by recipients.

## 3. Public profiles: real workspace, live permission-filtered showcase

- Public shareable profile links `#/u/username` (including signed-out guest view).
- Owner can opt in to public workspace totals and category names; published collections are displayed.
- Private Library contents, History, settings and private collections are **not exposed wholesale**.
- Backend `mfp-public-workspace` Edge Function reads the **current canonical owner workspace state** (including compressed snapshots), projects only allowed fields, and returns no raw workspace JSON.
- Changing a source collection updates what public viewers see on their next secure read. Unpublishing/restricting a profile revokes subsequent public access.

## 4. Live collection sharing, subscribing and converting

- Publish/unpublish an **existing owned Collection** by recording its owner ID and canonical collection ID; no duplicate titles or collection snapshot are stored.
- Copy a share link `#/collection/username/collectionId`.
- Browse live published Collections through Community → Collections and profile links.
- Subscribe by an owner/collection reference. Subscriptions display in a separate **Community Collections** section on the existing Collections browser.
- Subscription view is read-only and resolves the owner's current published collection; unpublishing marks it unavailable without deleting an independent converted copy.
- **Convert to my collection** explicitly imports the current published title names and cover/category metadata. Missing titles are added privately to the subscriber's Library, an independently editable Collection is created, and it can participate in Personal Order. The original remains unchanged.
- Public catalog is paginated; conversion is safety-capped at 10,000 collection titles per operation, with an explicit error rather than silent truncation.

## 5. Security, schema and data preservation

- New owner-only publication references and subscriber-only subscription references, with RLS.
- Private `mediaflow_states` SELECT ownership rules remain unchanged. Sharing uses a server-side allowlist rather than granting other users access to the private JSON/compressed blob.
- No profile or Collection Library payload is copied into public publication/subscription tables.
- Corrected cross-user blocking checks through `mfp_internal.can_contact_user` tied to the authenticated caller; consolidated permissive obsolete prototype subscription policies.
- Supabase authentication leaked-password-protection advisor warning remains a project configuration task, not a consequence of this frontend release.

## 6. Testing and verification

- Existing build pipeline must complete Python modular build, Node syntax validation, PWA asset generation and edition endpoint isolation.
- Chromium critical-page smoke covers Dashboard, Library, History, Community, Inbox, responsive controls, navigation and account-loss recovery; contains synthetic account/Library data and never writes to the production database.
- Added independent live endpoint smoke for the read-only Community discovery function.
- Database RLS audit confirms publication/subscription/message/profile tables remain RLS-enabled.
- **Not yet verified by two distinct real accounts:** Inbox message delivery/read receipts, public-profile permission changes across sessions, owner collection live updates, cross-account subscribe/convert and installed PWA updates. Do not treat synthetic or schema checks as proof of those end-to-end outcomes.
- Full 100,000-title device performance and installed PWA refresh benchmarking remain outstanding.

## 7. Compatibility

| Concern | Compatibility |
|---|---|
| Original MediaFlow Personal Edition | Completely untouched |
| Plus Library, History, Logging, XP | Preserved |
| Plus cloud state and recovery | Existing canonical snapshot; no destructive migration |
| Plus Collections & Personal Order | Existing IDs, membership and export/import format preserved |
| Plus Community | Canonical new Inbox; read-only live publication references |
| Dynamic themes, mobile, tablet | Theme-aware, responsive new interfaces |
| Supabase migration | **Plus only**, additive sharing references and hardened read receipt permissions |

**Release packaging:** Generated build/assets, PWA and GitHub release must pass CI before claiming successful deployment.
