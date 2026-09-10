-- SHAKSHUKA TRAVEL - participant portal v1
-- Run once in Supabase SQL Editor.
--
-- This intentionally exposes ONLY participant display names for published events.
-- Phone numbers remain private and are checked server-side.

create or replace function public.normalize_travel_phone(p_phone text)
returns text
language plpgsql
immutable
as $$
declare
  digits text;
begin
  digits := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');

  -- Treat Israeli +972... and 0... formats as equivalent.
  if digits like '972%' then
    digits := '0' || substr(digits, 4);
  end if;

  return digits;
end;
$$;

create or replace function public.get_event_participant_names(p_event_id uuid)
returns table (
  participant_id uuid,
  display_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.display_name
  from public.event_participants ep
  join public.participants p on p.id = ep.participant_id
  join public.events e on e.id = ep.event_id
  where ep.event_id = p_event_id
    and e.status = 'published'
    and p.active = true
    and ep.participant_status in ('invited', 'active', 'completed')
  order by lower(p.display_name);
$$;

create or replace function public.get_participant_event_access(
  p_event_id uuid,
  p_participant_id uuid,
  p_phone text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'ok', true,
    'display_name', p.display_name,
    'flight_done', ep.flight_done,
    'insurance_done', ep.insurance_done,
    'reserve_done', ep.reserve_done,
    'license_done', ep.license_done
  )
  into result
  from public.event_participants ep
  join public.participants p on p.id = ep.participant_id
  join public.events e on e.id = ep.event_id
  where ep.event_id = p_event_id
    and ep.participant_id = p_participant_id
    and e.status = 'published'
    and p.active = true
    and ep.participant_status in ('invited', 'active', 'completed')
    and public.normalize_travel_phone(p.phone) =
        public.normalize_travel_phone(p_phone);

  return coalesce(result, jsonb_build_object('ok', false));
end;
$$;

revoke all on function public.normalize_travel_phone(text) from public;
revoke all on function public.get_event_participant_names(uuid) from public;
revoke all on function public.get_participant_event_access(uuid, uuid, text) from public;

grant execute on function public.get_event_participant_names(uuid) to anon, authenticated;
grant execute on function public.get_participant_event_access(uuid, uuid, text) to anon, authenticated;
