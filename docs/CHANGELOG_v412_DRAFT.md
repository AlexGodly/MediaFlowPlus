# MediaFlow Plus v412 — Restored Community experience (development)

- Community Home restored: shortcuts, featured source-linked collections and updates.
- Live verified-ID Browse of explicitly opted-in public user Libraries (no database copies), alphabetical/ratings sort, search, pagination.
- Friends restored: following, followers and mutuals from source relationship rows.
- Manual Quick Add explicitly creates a title in the importing user's *own* Library, never silently copies another user's data.
- Owner-controlled live Browse opt-in is off by default; public profile and enabled showcase are required.
- Public collection requests now verify profile visibility and publication/showcase status on every read, including after unpublishing.
- No changes to MediaFlow Personal or its data, repository, releases, or deployment.
- Live scans are currently capped at 50 public accounts and 20,000 distinct matched verified IDs; the UI discloses incomplete results.
- To complete before release: validate deployed Plus Edge Function, run two-account/private-revocation tests, mobile/tablet browser verification, and finish legacy v302–v329 parity assessment.
- Not published or deployed from this development commit.
