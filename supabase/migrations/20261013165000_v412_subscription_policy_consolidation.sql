-- MediaFlow Plus v412: remove obsolete permissive subscription policies
-- left behind by the prototype publication-table path.
-- Preserve all rows/tables; only the canonical mfp_collection_publications
-- membership policy remains authoritative.
drop policy if exists mfp_subscriptions_insert on public.mfp_collection_subscriptions;
drop policy if exists mfp_subscriptions_read on public.mfp_collection_subscriptions;
drop policy if exists mfp_subscriptions_delete on public.mfp_collection_subscriptions;
