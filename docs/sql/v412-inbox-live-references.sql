-- MediaFlow Plus v412: additive live-sharing reference model and Inbox security.
-- No copied collections, titles, Library snapshots, or profile workspace payloads.
BEGIN;
DO $mfp$
DECLARE r record;
BEGIN
 FOR r IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'mfp_%'
 LOOP
  EXECUTE format('REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLE public.%I FROM anon, authenticated',r.tablename);
 END LOOP;
END
$mfp$;
GRANT UPDATE(read_at) ON TABLE public.mfp_messages TO authenticated;
CREATE TABLE IF NOT EXISTS public.mfp_shared_collections (
 owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 collection_id text NOT NULL CHECK (char_length(collection_id) BETWEEN 1 AND 160),
 is_published boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(owner_id,collection_id)
);
CREATE TABLE IF NOT EXISTS public.mfp_collection_subscriptions (
 subscriber_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 owner_id uuid NOT NULL,
 collection_id text NOT NULL,
 subscribed_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(subscriber_id,owner_id,collection_id),
 FOREIGN KEY(owner_id,collection_id) REFERENCES public.mfp_shared_collections(owner_id,collection_id) ON DELETE CASCADE,
 CHECK(subscriber_id<>owner_id)
);
CREATE INDEX IF NOT EXISTS mfp_subscriptions_owner_idx ON public.mfp_collection_subscriptions(owner_id,collection_id);
CREATE TABLE IF NOT EXISTS public.mfp_profile_showcase (
 owner_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 enabled boolean NOT NULL DEFAULT false,
 show_collections boolean NOT NULL DEFAULT true,
 show_categories boolean NOT NULL DEFAULT false,
 show_statistics boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mfp_shared_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfp_collection_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfp_profile_showcase ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mfp_shared_collections,public.mfp_collection_subscriptions,public.mfp_profile_showcase FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.mfp_shared_collections,public.mfp_profile_showcase TO anon,authenticated;
GRANT INSERT,UPDATE,DELETE ON public.mfp_shared_collections,public.mfp_profile_showcase TO authenticated;
GRANT SELECT,INSERT,DELETE ON public.mfp_collection_subscriptions TO authenticated;
CREATE POLICY mfp_shared_read ON public.mfp_shared_collections FOR SELECT TO anon,authenticated
 USING(is_published OR owner_id=(select auth.uid()));
CREATE POLICY mfp_shared_insert ON public.mfp_shared_collections FOR INSERT TO authenticated
 WITH CHECK(owner_id=(select auth.uid()));
CREATE POLICY mfp_shared_update ON public.mfp_shared_collections FOR UPDATE TO authenticated
 USING(owner_id=(select auth.uid())) WITH CHECK(owner_id=(select auth.uid()));
CREATE POLICY mfp_shared_delete ON public.mfp_shared_collections FOR DELETE TO authenticated
 USING(owner_id=(select auth.uid()));
CREATE POLICY mfp_showcase_read ON public.mfp_profile_showcase FOR SELECT TO anon,authenticated
 USING(enabled OR owner_id=(select auth.uid()));
CREATE POLICY mfp_showcase_insert ON public.mfp_profile_showcase FOR INSERT TO authenticated
 WITH CHECK(owner_id=(select auth.uid()));
CREATE POLICY mfp_showcase_update ON public.mfp_profile_showcase FOR UPDATE TO authenticated
 USING(owner_id=(select auth.uid())) WITH CHECK(owner_id=(select auth.uid()));
CREATE POLICY mfp_showcase_delete ON public.mfp_profile_showcase FOR DELETE TO authenticated
 USING(owner_id=(select auth.uid()));
CREATE POLICY mfp_subscriptions_read ON public.mfp_collection_subscriptions FOR SELECT TO authenticated
 USING(subscriber_id=(select auth.uid()) OR owner_id=(select auth.uid()));
CREATE POLICY mfp_subscriptions_insert ON public.mfp_collection_subscriptions FOR INSERT TO authenticated
 WITH CHECK(subscriber_id=(select auth.uid()) AND EXISTS(
  SELECT 1 FROM public.mfp_shared_collections s
  WHERE s.owner_id=mfp_collection_subscriptions.owner_id
    AND s.collection_id=mfp_collection_subscriptions.collection_id
    AND s.is_published
 ));
CREATE POLICY mfp_subscriptions_delete ON public.mfp_collection_subscriptions FOR DELETE TO authenticated
 USING(subscriber_id=(select auth.uid()));
DO $mfp$
BEGIN
 IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime' AND NOT puballtables)
 AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='mfp_messages')
 THEN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.mfp_messages;
 END IF;
END
$mfp$;
COMMIT;
