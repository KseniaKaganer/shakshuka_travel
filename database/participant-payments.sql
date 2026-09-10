-- SHAKSHUKA TRAVEL V4
-- Participant payments
-- Run once in Supabase -> SQL Editor.

alter table public.event_participants
  add column if not exists payment_paid numeric(12,2) not null default 0,
  add column if not exists payment_total numeric(12,2) not null default 0,
  add column if not exists coach_tickets_paid numeric(12,2) not null default 0,
  add column if not exists coach_tickets_total numeric(12,2) not null default 0;

alter table public.event_participants
  drop constraint if exists event_participants_payment_paid_nonnegative;
alter table public.event_participants
  add constraint event_participants_payment_paid_nonnegative
  check (payment_paid >= 0);

alter table public.event_participants
  drop constraint if exists event_participants_payment_total_nonnegative;
alter table public.event_participants
  add constraint event_participants_payment_total_nonnegative
  check (payment_total >= 0);

alter table public.event_participants
  drop constraint if exists event_participants_coach_tickets_paid_nonnegative;
alter table public.event_participants
  add constraint event_participants_coach_tickets_paid_nonnegative
  check (coach_tickets_paid >= 0);

alter table public.event_participants
  drop constraint if exists event_participants_coach_tickets_total_nonnegative;
alter table public.event_participants
  add constraint event_participants_coach_tickets_total_nonnegative
  check (coach_tickets_total >= 0);
