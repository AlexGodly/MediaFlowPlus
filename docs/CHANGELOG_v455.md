# MediaFlow Plus v455 — Personal v563 synchronization

Inherited Personal stable v563, commit f297193aed6015fb7d9637b3a87d91acb935bd4d.

Personal is read-only. Plus Supabase, existing user data, and Plus-exclusive extensions are retained.

## Inherited Personal changes

## MediaFlow v563 Stable

### Fixes
- **On This Day** no longer shows logs of titles you deleted from your Library. The logs stay in History; only the anniversary card leaves them out.
- **Old System:** Consume now applies your conversion rules (subtracting from the source categories) and records the entry, so **Undo last** works. Before, only the consumed category went up and nothing could be undone.
- **Categories:** deleting a category keeps it for recovery again, so **Restore deleted category** in Settings → Categories brings it back.
- The MediaFlow app (5.0.1.563) has the same On This Day fix; its Old System and category restore already worked this way.



## Rollback

backup/before-sync-455-personal-563
