# MediaFlow Plus v410 — Community Global Rankings

**Baseline:** v409

- Replaces client-only, paginated-sample Top rankings with a database-aggregated ranking across all Community reviews visible to the current authenticated user.
- Adds a PostgreSQL `mfp_top_rated` view with `security_invoker=true`, so underlying review RLS remains enforced.
- Ranks by average score (descending), breaking ties by number of ratings, with a limit of 25 results.
- Preserves the review feed, review publishing, private library isolation, and existing Community UI.
- Verified the view has `security_invoker=true` in the separate MediaFlow Plus database.
- GitHub CI build and live multi-account testing are required before calling the release fully verified.

**Outstanding Community work:** Realtime chat, robust moderation administration and rate limits, richer shared collection integration, and browser end-to-end tests.
