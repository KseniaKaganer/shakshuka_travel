-- SHAKSHUKA TRAVEL - secure admin dashboard setup
-- Run this ONCE in Supabase SQL Editor after the base schema exists.

-- 1) Admin allow-list. Each row points to a real Supabase Auth user.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Helper used by RLS policies. SECURITY DEFINER lets it check admin_users
-- without creating recursive RLS problems.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Basic API permissions. RLS still decides which rows each role may use.
grant usage on schema public to anon, authenticated;

grant select on public.locations to anon, authenticated;
grant select on public.events to anon, authenticated;
grant select on public.event_links to anon, authenticated;

grant select, insert, update, delete on public.locations to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.participants to authenticated;
grant select, insert, update, delete on public.event_participants to authenticated;
grant select, insert, update, delete on public.event_links to authenticated;
grant select on public.admin_users to authenticated;

-- Admin can see inactive locations too, and manage them.
drop policy if exists "Admins can view all locations" on public.locations;
create policy "Admins can view all locations"
on public.locations for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert locations" on public.locations;
create policy "Admins can insert locations"
on public.locations for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update locations" on public.locations;
create policy "Admins can update locations"
on public.locations for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete locations" on public.locations;
create policy "Admins can delete locations"
on public.locations for delete
to authenticated
using (public.is_admin());

-- Admin can see and manage all events, including drafts.
drop policy if exists "Admins can view all events" on public.events;
create policy "Admins can view all events"
on public.events for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert events" on public.events;
create policy "Admins can insert events"
on public.events for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update events" on public.events;
create policy "Admins can update events"
on public.events for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete events" on public.events;
create policy "Admins can delete events"
on public.events for delete
to authenticated
using (public.is_admin());

-- Participant data remains private from anonymous visitors.
drop policy if exists "Admins can manage participants" on public.participants;
create policy "Admins can manage participants"
on public.participants for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage event participants" on public.event_participants;
create policy "Admins can manage event participants"
on public.event_participants for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Admin can manage useful links too (future editor can use this).
drop policy if exists "Admins can manage event links" on public.event_links;
create policy "Admins can manage event links"
on public.event_links for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Admin may see their own allow-list record.
drop policy if exists "Admins can view own admin record" on public.admin_users;
create policy "Admins can view own admin record"
on public.admin_users for select
to authenticated
using (user_id = auth.uid());

-- IMPORTANT: after creating Ksenia and Ilya in Authentication > Users,
-- add their user IDs with statements like these (replace the UUIDs/emails):
--
-- insert into public.admin_users (user_id, email, display_name)
-- values ('PASTE-KSENIA-AUTH-USER-ID', 'YOUR-EMAIL', 'Ksenia');
--
-- insert into public.admin_users (user_id, email, display_name)
-- values ('PASTE-ILYA-AUTH-USER-ID', 'ILYA-EMAIL', 'Ilya');
