# MediaFlow Plus v458 — Personal v574 synchronization

Inherited Personal stable v574, commit 1cc18a2ff19e89fbc6855d6ef169168b9b8a5488.

Personal is read-only. Plus Supabase, existing user data, and Plus-exclusive extensions are retained.

## Inherited Personal changes

## MediaFlow v574 Stable

### Batch Log: XP preview
- Above **Log batch** you now see what the batch earns before you save: "This batch earns +N XP", with the parts (consumption, streak, completions, rewatch / reread and the Batch Log bonus). It's worked out with the same calculation the save uses, so it matches what you get. It updates as you change titles, amounts, minutes, the date or the time. The MediaFlow app shows the same in Log a title.

### Live sync
- The website checked for changes from your other devices a few seconds too far back, so after any change from another device it kept syncing every few seconds. It now only syncs when there's really something new.



## Rollback

backup/before-sync-458-personal-574
