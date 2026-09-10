-- SHAKSHUKA TRAVEL admin v2
-- Adds location type and per-event participant travel checklist fields.

alter table public.locations
  add column if not exists venue_type text not null default 'dropzone'
  check (venue_type in ('dropzone', 'tunnel', 'other'));

alter table public.event_participants
  add column if not exists flight_done boolean not null default false,
  add column if not exists insurance_done boolean not null default false,
  add column if not exists reserve_done boolean not null default false,
  add column if not exists license_done boolean not null default false,
  add column if not exists checklist_extra jsonb not null default '{}'::jsonb;

-- Existing admin policies already allow authenticated admins to manage these tables.
-- These grants are repeated safely in case the project was initialized in stages.
grant select, insert, update, delete on public.locations to authenticated;
grant select, insert, update, delete on public.participants to authenticated;
grant select, insert, update, delete on public.event_participants to authenticated;
