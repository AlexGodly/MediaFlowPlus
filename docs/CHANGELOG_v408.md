# MediaFlow Plus v408 — Community Ecosystem

**Release:** v408 Stable (pending CI verification)  
**Baseline:** MediaFlow Plus v407  
**Developer:** Alex Godly  
**Date:** October 13, 2026

## 1. Community navigation and design
- Added a dedicated Community page with responsive, theme-aware cards and navigation.
- Seven areas: Feed, People, Collections, Reviews & Top, Messages, Alerts, My Profile.
- Community data lives outside the personal library's cloud-state document.

## 2. Public identity and privacy
- Usernames, display names, bios, HTTPS avatars and public/private profile controls.
- No automatic publishing of Library, History, ratings, collections, settings, or activity from the private MediaFlow state.
- Profiles are created explicitly. Only authenticated community members can browse public profiles.

## 3. Social feed
- Publish and delete posts, optional related media title, likes, comments, and reports.
- Paginated feeds with bounded client requests.

## 4. People and discovery
- Search usernames, follow/unfollow public profiles, start direct messages.

## 5. Shared collections
- Publish curated title-name lists explicitly, without uploading the owner's private library.
- Browse published collections and report inappropriate content.

## 6. Reviews and rankings
- Publish and update 0–10 ratings keyed by media identifier.
- Display community ratings from the current loaded review page. **These are not yet global database-wide rankings**; scalable aggregate ranking remains follow-up work.

## 7. Messages and notifications
- Authenticated one-to-one direct messages with participant-only RLS.
- Server-side notifications for follows, likes, comments, and messages.
- Mark notifications as read.

## 8. Safety and backend
- Ten new community tables, Row Level Security and restricted Data API grants.
- Private internal notification trigger function; authenticated clients cannot forge notification rows.
- Reporting table for user submissions; administrative moderation console, blocks, abuse rate limits and anti-spam automation remain future hardening tasks.
- Private MediaFlow Plus state remains in its original protected table.

## 9. Compatibility and testing
- v407 browser-cache isolation remains intact.
- Source and build integration completed. CI and browser end-to-end verification required before considering this production-hardened.
- No original MediaFlow Personal database or repository changes.

## 10. Known limitations
- Feed and messaging are refreshed on navigation; realtime subscriptions and push notifications are not yet implemented.
- No native quick-add from community titles into private Library yet.
- Collections accept manually entered title names; structured media-ID mapping is a future enhancement.
- Rankings use loaded review samples rather than a complete aggregate.
- Public release should be treated as an initial complete-area implementation, not a fully moderated mature social network.
