# MediaFlow Plus v459 — Personal v576 synchronization

Inherited Personal stable v576, commit 21173f0973feb893c80c485f7931ab572e547acc.

Personal is read-only. Plus Supabase, existing user data, and Plus-exclusive extensions are retained.

## Inherited Personal changes

## MediaFlow v576 Stable

### Checked: saving, sync and moving your data
A full check of everything that saves or moves your data: cloud saving, Sync Now, full backups (export, import, automatic), Settings Presets, Personal Order and Collections import/export, History and XP exports, XP calculation and PWA updates. They all carry everything added up to now (per-title units and names, log times, cover and details presets, Batch Log time and XP, live sync).
- **Fixed:** the data audit reported "xpLedger backup / automatic export mismatch" and "Read-only audit changed account data" on accounts with empty XP sections, although nothing was missing. It now only lists real problems.



## Rollback

backup/before-sync-459-personal-576
