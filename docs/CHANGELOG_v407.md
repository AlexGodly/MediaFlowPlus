# MediaFlow Plus v407 — Cache Isolation Fix

**Classification:** Stable (pending automated build checks)  
**Baseline:** MediaFlow Plus v406

## Fixed
- Isolated Plus's per-account browser recovery-cache namespace from the original MediaFlow's cache namespace.
- Isolated the fallback/legacy safety-cache key used by Plus, preventing automatic reads of the original edition's browser data.
- Preserved Plus's own authenticated Supabase backend at `puaqaobplyrdrujapznp` and its private per-user cloud-state table.
- No changes to the original MediaFlow database, original MediaFlow repository, or personal-edition local data.

## Cause
GitHub Pages sites at `alexgodly.github.io/MediaFlow/` and `alexgodly.github.io/MediaFlowPlus/` share the same browser storage origin. Prior Plus builds reused some localStorage keys from the original edition. A local recovery path could therefore find personal-edition data.

## Verification
Inspect GitHub Actions for the generated v407 bundle and GitHub Pages deployment. Live browser account verification remains necessary.
