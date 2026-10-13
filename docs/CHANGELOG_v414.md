# MediaFlow Plus v414 Stable — Public Community Home and Workspace Navigation

**Date:** October 13, 2026  
**Developer:** Alex Godly  
**Baseline:** v413 production  
**Status:** Deployment-ready after smoke and publish verification

## 1. Public Community Home
- Adds the official `#/community/home` public entry, preserving the signed-in Workspace.
- For signed-out visitors, the default landing experience becomes Community Home when the login screen is presented.
- Prominent **My Workspace** action leads existing users to their private Dashboard or the normal login screen.
- Adds public landing links to Browse Titles, Top Rated and public Collections with opt-in live discovery and appropriate empty states.
- The landing page never touches private account libraries or creates public catalog copies.

## 2. Workspace and collapsible Community menu
- Desktop sidebar has a distinct Workspace gateway and a collapsible Community section.
- Community entries: Home, Browse Titles, Collections, Top Titles, People, Feed, Friends, Inbox, Notifications and Public Profile.
- Mobile and tablet **More** navigation has a matching collapsible nested Community section.
- Active-item states and existing Dashboard, Library, Collections, Friends, Inbox, Browse and Top routes remain functional.
- Hides redundant flat Community, Browse, Friends and Inbox destinations while retaining the original canonical navigation state.
- Settings → Navigation gains group visibility, expanded state, page hide/show, ordering and reset. Settings persist via the established MediaFlow cloud sync.

## 3. Current v413 features preserved
- Built on the latest Plus v413 code and retains its existing Cloud, Logging, Performance, Friends, Inbox, Community subscriptions and no-copy live Browse & Top.
- Community reads public Collections and Browse entries directly from their owners’ canonical workspaces through existing privacy-gated read-only Plus Edge endpoints.
- User data, MediaFlow Personal edition and live Supabase tables remain unchanged.
- No wholesale merge of the outdated v412 development branch.

## 4. Testing and release gates
- Syntax, modular build, PWA assets, browser critical-page smoke and public projection tests.
- New source contract checks verify Workspace entry, collapsible Community navigation, Home, canonical destination routing and data nonmutation.
- Deployment is finished only when GitHub Pages publishes v414 and the live site exposes the new Home/Workspace navigation.

## 5. Deployment
- Site: https://alexgodly.github.io/MediaFlowPlus/
- Public Community Home: https://alexgodly.github.io/MediaFlowPlus/#/community/home
- Version tag: `414`.
