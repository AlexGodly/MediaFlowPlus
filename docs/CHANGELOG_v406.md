# MediaFlow Plus v406 — Public Edition

**Release:** v406 Stable (subject to build and deployment checks)  
**Baseline:** MediaFlow v405 modular  
**Developer:** Alex Godly  
**Date:** 2026-10-13

## 1. Separate public edition
MediaFlow Plus is maintained in its own public GitHub repository and GitHub Pages scope, independently of the original MediaFlow project.

## 2. Independent Supabase backend
- Frontend endpoint: `https://puaqaobplyrdrujapznp.supabase.co`
- Uses the dedicated project's publishable browser key, never a service-role secret.
- Retains the v405 `mediaflow_states` cloud-state contract, protected by authenticated per-user Row Level Security.
- Does not transfer or expose original MediaFlow users, sessions, or library data.

## 3. Release and deployment workflow
- Production bundle and PWA service worker are generated from the versioned modular source.
- Build validates JavaScript syntax and rejects a bundled reference to the original Supabase endpoint.
- Generated production files are committed to the MediaFlowPlus main branch.
- GitHub Releases use numeric tags (e.g. `406`) and titles like `v406 Stable`.

## 4. Compatibility and preserved functionality
Retains MediaFlow v405 Library, Logging, History, Collections, Personal Order, Dashboard, Settings, appearance, backup/import/export, cloud synchronization and responsive PWA functionality. A separate account must be created in the MediaFlow Plus Supabase project.

## 5. Verification notes
The dedicated database table and four owner-only Row Level Security policies were inspected. Build and live end-to-end account tests must be checked in CI and in a browser; this changelog does not claim those tests have passed.

## 6. Deployment
Repository: https://github.com/AlexGodly/MediaFlowPlus  
Website: https://alexgodly.github.io/MediaFlowPlus/
