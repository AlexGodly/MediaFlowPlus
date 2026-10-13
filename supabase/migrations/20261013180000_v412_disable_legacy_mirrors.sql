-- MediaFlow Plus-only policy: stop the obsolete v408 copy-based media publishers.
-- No rows are deleted. Review text and old data remain available under prior RLS.
-- Community must derive ratings from owners' current canonical Library records.
-- Community Collections must use owner_id + collection_id permissions/references.
REVOKE INSERT, UPDATE ON TABLE public.mfp_reviews FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE ON TABLE public.mfp_collections FROM PUBLIC, anon, authenticated;
-- Private canonical owner state remains unchanged and remains owner-only.
