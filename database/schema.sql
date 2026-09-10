-- SHAKSHUKA TRAVEL - Supabase starter schema
-- Store dates as real DATE values in PostgreSQL.
-- Display them in the frontend as DD/MM/YYYY.

create extension if not exists pgcrypto;

-- Locations used by the event-location dropdown.
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  city text,
  dropzone text,
  address text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Main travel events.
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  location_id uuid references public.locations(id) on delete set null,
  venue text,
  additional_location_info text,
  description text,
  meeting_info text,
  status text not null default 'draft'
    check (status in ('draft','published','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_date_order check (end_date >= start_date)
);

-- Participant master records.
-- We keep phone separate from any future login hash.
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  phone text,
  email text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Connect participants to the events they are allowed to access.
create table if not exists public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  participant_status text not null default 'active'
    check (participant_status in ('invited','active','cancelled','completed')),
  personal_notes text,
  created_at timestamptz not null default now(),
  unique(event_id, participant_id)
);

-- Generic event links (WhatsApp, hotel, DZ, Maps, weather, etc.)
create table if not exists public.event_links (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  url text not null,
  category text,
  visible_to_participants boolean not null default true,
  sort_order integer not null default 0
);

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_events_updated_at on public.events;
create trigger trg_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

-- Enable Row Level Security.
alter table public.locations enable row level security;
alter table public.events enable row level security;
alter table public.participants enable row level security;
alter table public.event_participants enable row level security;
alter table public.event_links enable row level security;

-- PUBLIC READ:
-- For version 1, the travel landing page can show only active locations
-- and events marked "published".
drop policy if exists "Public can view active locations" on public.locations;
create policy "Public can view active locations"
on public.locations for select
to anon, authenticated
using (active = true);

drop policy if exists "Public can view published events" on public.events;
create policy "Public can view published events"
on public.events for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Public can view participant-visible event links" on public.event_links;
create policy "Public can view participant-visible event links"
on public.event_links for select
to anon, authenticated
using (
  visible_to_participants = true
  and exists (
    select 1
    from public.events e
    where e.id = event_links.event_id
      and e.status = 'published'
  )
);

-- IMPORTANT:
-- No public SELECT/INSERT/UPDATE/DELETE policies are created for participants
-- or event_participants. They remain inaccessible from the public website.
-- We will add secure admin policies after the admin login is built.

-- Optional starter locations. Edit/remove freely in Supabase Table Editor.
insert into public.locations (name, country, city, dropzone)
select 'SkyTime', 'Spain', 'Castellón', 'SkyTime'
where not exists (
  select 1 from public.locations where name = 'SkyTime' and country = 'Spain'
);

insert into public.locations (name, country, city, dropzone)
select 'Khao Yai', 'Thailand', 'Khao Yai', null
where not exists (
  select 1 from public.locations where name = 'Khao Yai' and country = 'Thailand'
);

insert into public.locations (name, country, city, dropzone)
select 'Bovec', 'Slovenia', 'Bovec', null
where not exists (
  select 1 from public.locations where name = 'Bovec' and country = 'Slovenia'
);
