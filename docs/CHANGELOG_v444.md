# MediaFlow Plus v444 — Personal v548 synchronization

Inherited Personal stable v548, commit 35227e6951ee08a28705857543ae3ad2dc0e218f.

Personal is read-only. Plus Supabase, existing user data, and Plus-exclusive extensions are retained.

## Inherited Personal changes

v548 Stable: Fixes severe responsiveness stalls in Dashboard Logging with large Libraries. Logging now builds a cached search index with precomputed normalized sort keys and a single reusable natural-language collator, then reuses sorted indexes as the user types or changes filters. Search, category/status/priority filtering, ascending/descending sorting and stable tie behavior are preserved. Relevant Library or category-name changes invalidate the cache before results are returned. Regression coverage compares old and optimized search/filter/sort results and exercises 30,000 titles. This is a read-only performance optimization: no Library, progress, History, XP, personal order, collection, cloud data, or Supabase schema changes.


## Rollback

backup/before-sync-444-personal-548
