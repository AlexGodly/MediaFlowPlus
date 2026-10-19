# MediaFlow Plus v437 — Personal v507 synchronization

Inherited Personal stable v507, commit 5c55134cb1716525288c7722134ec7b03eece9e9.

Personal is read-only. Plus Supabase, existing user data, and Plus-exclusive extensions are retained.

## Inherited Personal changes

## MediaFlow v507 Stable — Complete Data Integrity & Update Reliability

Builds on v506 Stable, keeping backward-compatible cloud and export schemas.

- **Cloud & Sync Now:** stop anonymous/unhydrated uploads and verify the authenticated account identity throughout cloud reads, merge, uploads and readback.
- **Full Data & Automatic Export:** derive backed-up fields from the actual current persistent cloud snapshot, including future persistent fields, not an older fixed list. Scheduled backups continue to use the same current full builder.
- **Data import / Settings import:** require successful cloud upload and authenticated full-state readback before reporting imported data as cloud-verified.
- **Collections & Personal Order import:** keep merge semantics and inform users when imported changes are local but cloud verification is pending or failed; prevent silent confirmations.
- **Settings export/import:** include current settings, backup and automatic update preferences, without copying unrelated Library/History data to a settings-only preset.
- **History / XP:** confirm complete Library History, consumption session metadata, per-unit logging timestamps and XP ledgers remain in canonical backups; retain History/XP CSV and JSON exporters. No XP rewards are re-awarded during auditing.
- **PWA / automatic updates:** rebuild v507 app and versioned service-worker cache, preserving safe auth-aware automatic update and reload behavior.
- **Read-only audit:** expose `MediaFlowV507.audit()` and `App.v507ExportAuditReport()` to inspect local export parity and download a concise status report. Live cloud verification still requires Sync Now under a signed-in account.
- **Regression checks:** run synthetic complete snapshot / automatic export / cloud readback / account-change / import contract / PWA tests, JavaScript syntax check and project verification.
- **No data migrations:** do not change existing account data, Supabase schema or older archived releases.

Includes the complete v507 project archive and SHA-256 checksum.



## Rollback

backup/before-sync-437-personal-507
