-- MediaFlow Plus only — v412 Inbox additive schema.
-- Reuses mfp_messages; never creates or copies a second message store.
ALTER TABLE public.mfp_messages ADD COLUMN IF NOT EXISTS read_at timestamptz;
CREATE INDEX IF NOT EXISTS mfp_messages_inbox_sender_time_idx
  ON public.mfp_messages(sender_id,created_at DESC);
CREATE INDEX IF NOT EXISTS mfp_messages_inbox_recipient_time_idx
  ON public.mfp_messages(recipient_id,created_at DESC);
-- The only allowed edit by the message recipient is marking read_at.
REVOKE UPDATE ON TABLE public.mfp_messages FROM authenticated;
GRANT UPDATE(read_at) ON TABLE public.mfp_messages TO authenticated;
DROP POLICY IF EXISTS mfp_messages_recipient_read_receipt ON public.mfp_messages;
CREATE POLICY mfp_messages_recipient_read_receipt ON public.mfp_messages
  FOR UPDATE TO authenticated
  USING (recipient_id=(SELECT auth.uid()))
  WITH CHECK (recipient_id=(SELECT auth.uid()));
-- The existing SELECT policy permits only the sender or recipient to see a message.
-- RLS filters realtime row changes with the subscriber's access token.
DO $$
BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM pg_publication_tables
  WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='mfp_messages'
 ) THEN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.mfp_messages;
 END IF;
END $$;
