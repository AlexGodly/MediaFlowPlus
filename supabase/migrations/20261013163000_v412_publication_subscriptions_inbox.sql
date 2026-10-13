-- MediaFlow Plus v412: opt-in live sharing metadata + safer Inbox privileges.
-- Never execute in MediaFlow Personal. Private mediaflow_states RLS is unchanged.

alter table public.mfp_profiles alter column is_public set default false;
alter table public.mfp_profiles add column if not exists show_workspace_stats boolean not null default false;
alter table public.mfp_profiles add column if not exists show_workspace_categories boolean not null default false;

create table if not exists public.mfp_collection_publications (
 owner_id uuid not null references auth.users(id) on delete cascade,
 collection_id text not null check (char_length(collection_id) between 1 and 160),
 created_at timestamptz not null default now(),
 primary key(owner_id,collection_id)
);
create table if not exists public.mfp_collection_subscriptions (
 subscriber_id uuid not null references auth.users(id) on delete cascade,
 owner_id uuid not null references auth.users(id) on delete cascade,
 collection_id text not null check (char_length(collection_id) between 1 and 160),
 subscribed_at timestamptz not null default now(),
 primary key(subscriber_id,owner_id,collection_id),
 check(subscriber_id<>owner_id)
);
create index if not exists mfp_colpub_recent_idx on public.mfp_collection_publications(created_at desc);
create index if not exists mfp_subscriber_collections_idx on public.mfp_collection_subscriptions(subscriber_id,subscribed_at desc);
alter table public.mfp_collection_publications enable row level security;
alter table public.mfp_collection_subscriptions enable row level security;
revoke all on public.mfp_collection_publications from public,anon,authenticated;
revoke all on public.mfp_collection_subscriptions from public,anon,authenticated;
grant select,insert,delete on public.mfp_collection_publications to authenticated;
grant select,insert,delete on public.mfp_collection_subscriptions to authenticated;

create schema if not exists mfp_internal;
revoke all on schema mfp_internal from public;
grant usage on schema mfp_internal to authenticated;

-- The caller identity is read from the signed JWT; arbitrary (viewer, owner)
-- pairs cannot be supplied. SECURITY DEFINER exists solely to check both sides'
-- blocking records without exposing their private blocklists through RLS.
create or replace function mfp_internal.can_contact_user(target_id uuid)
returns boolean language sql stable security definer
set search_path = ''
as $$
 select (select auth.uid()) is not null and target_id is not null
 and not exists (
  select 1 from public.mfp_blocks b
  where (b.blocker_id=(select auth.uid()) and b.blocked_id=target_id)
     or (b.blocker_id=target_id and b.blocked_id=(select auth.uid()))
 );
$$;
revoke all on function mfp_internal.can_contact_user(uuid) from public,anon;
grant execute on function mfp_internal.can_contact_user(uuid) to authenticated;

drop policy if exists mfp_collection_publications_select on public.mfp_collection_publications;
create policy mfp_collection_publications_select on public.mfp_collection_publications
for select to authenticated using (
 owner_id=(select auth.uid()) or (
 mfp_internal.can_contact_user(owner_id)
 and exists(select 1 from public.mfp_profiles p where p.user_id=owner_id and p.is_public)
 ));
drop policy if exists mfp_collection_publications_insert on public.mfp_collection_publications;
create policy mfp_collection_publications_insert on public.mfp_collection_publications
for insert to authenticated with check(owner_id=(select auth.uid()));
drop policy if exists mfp_collection_publications_delete on public.mfp_collection_publications;
create policy mfp_collection_publications_delete on public.mfp_collection_publications
for delete to authenticated using(owner_id=(select auth.uid()));

drop policy if exists mfp_collection_subscriptions_select on public.mfp_collection_subscriptions;
create policy mfp_collection_subscriptions_select on public.mfp_collection_subscriptions
for select to authenticated using(subscriber_id=(select auth.uid()));
drop policy if exists mfp_collection_subscriptions_insert on public.mfp_collection_subscriptions;
create policy mfp_collection_subscriptions_insert on public.mfp_collection_subscriptions
for insert to authenticated with check(
 subscriber_id=(select auth.uid()) and mfp_internal.can_contact_user(owner_id)
 and exists(
 select 1 from public.mfp_collection_publications pub
 join public.mfp_profiles p on p.user_id=pub.owner_id
 where pub.owner_id=mfp_collection_subscriptions.owner_id
 and pub.collection_id=mfp_collection_subscriptions.collection_id and p.is_public
 ));
drop policy if exists mfp_collection_subscriptions_delete on public.mfp_collection_subscriptions;
create policy mfp_collection_subscriptions_delete on public.mfp_collection_subscriptions
for delete to authenticated using(subscriber_id=(select auth.uid()));

-- Existing recipient UPDATE policy is owner-scoped but the old table-level
-- UPDATE grant was too broad. Limit writes to read_at, not message body/sender.
revoke update on public.mfp_messages from public,anon,authenticated;
grant update(read_at) on public.mfp_messages to authenticated;
create index if not exists mfp_messages_recipient_recent_idx
 on public.mfp_messages(recipient_id,created_at desc);
create index if not exists mfp_messages_sender_recent_idx
 on public.mfp_messages(sender_id,created_at desc);

drop policy if exists mfp_messages_insert on public.mfp_messages;
create policy mfp_messages_insert on public.mfp_messages
for insert to authenticated with check(
 sender_id=(select auth.uid()) and sender_id<>recipient_id
 and mfp_internal.can_contact_user(recipient_id)
 and exists(select 1 from public.mfp_profiles p where p.user_id=recipient_id and p.is_public)
);
drop policy if exists mfp_follows_insert on public.mfp_follows;
create policy mfp_follows_insert on public.mfp_follows
for insert to authenticated with check(
 follower_id=(select auth.uid()) and follower_id<>following_id
 and mfp_internal.can_contact_user(following_id)
 and exists(select 1 from public.mfp_profiles p where p.user_id=following_id and p.is_public)
);
-- Incoming blocks now hide the public profile as well, without exposing the
-- other account's blocklist in SELECT results.
drop policy if exists mfp_profiles_read on public.mfp_profiles;
create policy mfp_profiles_read on public.mfp_profiles
for select to authenticated using (
 user_id=(select auth.uid()) or (is_public and mfp_internal.can_contact_user(user_id))
);

-- Realtime delivery still follows SELECT RLS. Allow the already-protected
-- inbox table into the publication if it is not present yet.
do $$
begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime')
 and not exists(
 select 1 from pg_publication_tables where pubname='supabase_realtime'
 and schemaname='public' and tablename='mfp_messages'
 ) then
  alter publication supabase_realtime add table public.mfp_messages;
 end if;
end $$;
