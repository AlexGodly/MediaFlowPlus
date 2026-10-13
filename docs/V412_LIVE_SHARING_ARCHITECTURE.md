# v412 — Live Workspace and Community Collections Architecture

**Status:** Engineering design approved as implementation constraint; live shared collections and public workspace rendering are **not yet released**.

## Canonical data contracts

The private workspace is stored in `public.mediaflow_states.state_data` with ownership RLS. The existing browser sync may store the **entire state** compressed as a JSONB envelope `{__mediaflowCompressed:"gzip",data:"<base64>"}`. Collections and title metadata live inside the same snapshot; never grant cross-account SELECT access to this row.

A shared collection must be a **reference** to `(owner_user_id, canonical_collection_id)`. Publication and subscriber records may store these identifiers and visibility flags but **must not** contain another copy of the owner's title list, cover collection, library, or private metadata.

## Required Plus-only backend
1. `mfp_shared_collection_publications`: owner UUID, canonical collection ID, public flag, timestamps, optional slug; owner-only mutations, read policies for published references.
2. `mfp_collection_subscriptions`: subscriber UUID, publication reference, timestamps and uniqueness. Owner updates never write into subscriber state.
3. `mfp_profile_public_settings`: owner, only the flags that govern whether aggregates/categories/selected collections are public.
4. An Edge Function or equivalent **server-enforced allowlist projection**: first validate publication/visibility and any block restrictions, then privately fetch the owner state and decode the existing gzip envelope server-side, select the named collection from that **one source of truth**, resolve only the titles included in that collection, return only those allowed fields. Do not return raw state data to anyone except its owner.
5. A securely authorized refresh/read path; a public profile must not be a background data clone. Guest links are possible only after explicit owner opt-in.
6. Subscription and conversion controls in the existing Collections interface: subscription is read-only/live; conversion is an **explicit** one-time copy into subscriber's personal canonical Collections; only converted collections can join Personal Order.

## Privacy/integrity invariants
- Neither the browser nor a public view gets a different owner's private `mediaflow_states` row, even if the subscription exists.
- No public title, library, history, XP, settings, or collection disclosure without owner opt-in.
- Removing a publication immediately makes the source inaccessible. An explicitly converted copy remains an independent subscriber asset.
- Old manually entered `mfp_collections.titles` must not be promoted as if it were a live original Collection. Migrate only with explicit owner choice.
- An owner's published collection is read at request time, so edits/renames/reorders appear on the next secure fetch; service-level change signals should only carry invalidation, not raw private state.
- Efficient client-side cache keys include owner+collection version, with cache invalidation after publication changes or canonical state updates.
- Distinct Plus project only: `puaqaobplyrdrujapznp`. **Never** touch the Personal Edition Supabase project.

## Release gates
- Verify two real Plus accounts can share, subscribe, see owner's live changes, unsubscribe and convert.
- Verify private profiles/collections leak zero data, including anonymous and blocked viewers.
- Verify a user cannot choose an arbitrary collection ID or user ID to fetch someone else's raw state.
- Verify the conversion is not silently repeated and never mutates the original.
- Run Supabase security advisors, RLS policy tests, browser/PWA regression checks and large-library performance tests.

## In-progress v412 implementation
- Dedicated full Inbox and floating mini Inbox using the preexisting `mfp_messages` canonical table, with read receipts and optimistic fallback/refetch.
- Three Show membership filters (Personal Order titles, Personal Order collections and Logging titles).
- Searchable bulk category/status/priority action pickers based on the owner's existing Settings ordering and category artwork.
- The production build and synthetic-browser smoke tests check app stability. Real two-account production validation is still required.

The full feature is not complete merely because this architecture file exists.
