-- MediaFlow Plus v412: publication permissions and subscriptions are REFERENCES ONLY.
-- No collection cover, title, library entry or workspace state is copied here.
-- Canonical collection contents remain exclusively in owner's mediaflow_states.
CREATE TABLE IF NOT EXISTS public.mfp_collection_publications (
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collection_id text NOT NULL,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, collection_id),
  CONSTRAINT mfp_publication_collection_id_length CHECK (length(collection_id) BETWEEN 1 AND 180)
);
ALTER TABLE public.mfp_collection_publications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mfp_collection_publications FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.mfp_collection_publications TO authenticated;
DROP POLICY IF EXISTS mfp_publications_owner_select ON public.mfp_collection_publications;
CREATE POLICY mfp_publications_owner_select ON public.mfp_collection_publications
 FOR SELECT TO authenticated USING (owner_id=(SELECT auth.uid()));
DROP POLICY IF EXISTS mfp_publications_owner_insert ON public.mfp_collection_publications;
CREATE POLICY mfp_publications_owner_insert ON public.mfp_collection_publications
 FOR INSERT TO authenticated WITH CHECK (owner_id=(SELECT auth.uid()));
DROP POLICY IF EXISTS mfp_publications_owner_update ON public.mfp_collection_publications;
CREATE POLICY mfp_publications_owner_update ON public.mfp_collection_publications
 FOR UPDATE TO authenticated USING (owner_id=(SELECT auth.uid()))
 WITH CHECK (owner_id=(SELECT auth.uid()));
DROP POLICY IF EXISTS mfp_publications_owner_delete ON public.mfp_collection_publications;
CREATE POLICY mfp_publications_owner_delete ON public.mfp_collection_publications
 FOR DELETE TO authenticated USING (owner_id=(SELECT auth.uid()));
CREATE INDEX IF NOT EXISTS mfp_publications_public_idx
 ON public.mfp_collection_publications (owner_id,collection_id) WHERE is_published;

CREATE TABLE IF NOT EXISTS public.mfp_collection_subscriptions (
 subscriber_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 owner_id uuid NOT NULL,
 collection_id text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (subscriber_id,owner_id,collection_id),
 FOREIGN KEY (owner_id,collection_id)
  REFERENCES public.mfp_collection_publications(owner_id,collection_id)
  ON DELETE CASCADE,
 CONSTRAINT mfp_subscription_no_self CHECK (subscriber_id<>owner_id)
);
ALTER TABLE public.mfp_collection_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mfp_collection_subscriptions FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,DELETE ON public.mfp_collection_subscriptions TO authenticated;
DROP POLICY IF EXISTS mfp_subscriptions_select_own ON public.mfp_collection_subscriptions;
CREATE POLICY mfp_subscriptions_select_own ON public.mfp_collection_subscriptions
 FOR SELECT TO authenticated USING (subscriber_id=(SELECT auth.uid()));
DROP POLICY IF EXISTS mfp_subscriptions_insert_valid ON public.mfp_collection_subscriptions;
CREATE POLICY mfp_subscriptions_insert_valid ON public.mfp_collection_subscriptions
 FOR INSERT TO authenticated WITH CHECK (
  subscriber_id=(SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.mfp_collection_publications p
    JOIN public.mfp_profiles profile ON profile.user_id=p.owner_id
    WHERE p.owner_id=mfp_collection_subscriptions.owner_id
      AND p.collection_id=mfp_collection_subscriptions.collection_id
      AND p.is_published AND profile.is_public
  )
 );
DROP POLICY IF EXISTS mfp_subscriptions_delete_own ON public.mfp_collection_subscriptions;
CREATE POLICY mfp_subscriptions_delete_own ON public.mfp_collection_subscriptions
 FOR DELETE TO authenticated USING (subscriber_id=(SELECT auth.uid()));
CREATE INDEX IF NOT EXISTS mfp_subscriptions_owner_idx
 ON public.mfp_collection_subscriptions(owner_id,collection_id);

-- Critical security note: the owner's publications policy above allows only
-- the OWNER to SELECT rows. The subscriber INSERT policy cannot see those rows
-- under RLS, so subscription creation must eventually go through a purpose-
-- built, privilege-audited RPC or add a safe public-publications SELECT policy.
-- DO NOT weaken mediaflow_states SELECT RLS or use raw state_data as payload.
