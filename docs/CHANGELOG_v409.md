# MediaFlow Plus v409 — Community Integration Reliability

**Baseline:** v408 Community Ecosystem  
**Date:** October 13, 2026  
**Developer:** Alex Godly

## Changes
1. **Community navigation:** Registers Community in mobile More Pages and re-normalizes saved desktop navigation layouts so existing accounts see the page.
2. **Reviews:** Corrects review upsert to target the unique `(user_id,media_key)` constraint, allowing members to edit an existing review instead of failing on duplicate keys.
3. **Safety:** Adds member blocking with owner-only RLS. Blocked members cannot initiate new follows or direct messages to the blocker. Blockers no longer see blocked members' public posts or profile listings.
4. **User interface:** Adds Block action to People directory; refines no-results states and search input behavior.
5. **Security:** Confirms all eleven Community tables have RLS enabled; Supabase security advisors report zero lints.

## Verification
- Database DDL applied and inspected in the separate MediaFlow Plus Supabase project.
- GitHub automated production build and JavaScript syntax checks are required for release.
- Live two-account browser end-to-end tests remain outstanding.

## Known limitations
- Global rankings still use a limited review sample.
- Real-time chat and push notifications are not yet available.
- No full moderation console, automated anti-spam, or quick-add from Community to Library.
- Block enforcement is focused on new follows/messages and profile/post visibility; further cross-surface blocking audits remain necessary.
- Community requires real authenticated user testing before treating it as production-hardened.

No Personal Edition code or database was modified.
