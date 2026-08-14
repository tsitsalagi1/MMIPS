-- Source-of-truth reconciliation for the Canada urgent-alert event ledger.
-- Apply after 007_cross_border_alert_delivery.sql and only to the separate
-- Canadian Supabase project. This is idempotent because the live synthetic
-- rehearsal database received the equivalent forward migration first.

create table if not exists public.urgent_alert_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  event_key text not null unique,
  title text not null,
  public_url text not null,
  public_map_label text not null,
  public_latitude numeric not null,
  public_longitude numeric not null,
  approved_by uuid,
  matched_count integer not null default 0,
  sent_count integer not null default 0,
  status text not null default 'draft'
    check (status in ('draft', 'sending', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.urgent_alert_events enable row level security;
alter table public.urgent_alert_events force row level security;
revoke all on public.urgent_alert_events from public, anon, authenticated;
grant select, insert, update, delete on public.urgent_alert_events to service_role;

create index if not exists urgent_alert_events_case_idx
  on public.urgent_alert_events(case_id);
create index if not exists urgent_alert_events_status_idx
  on public.urgent_alert_events(status);

-- Rollback/forward-fix: do not drop this ledger after any rehearsal or live
-- delivery exists. Disable dispatch first and use a reviewed forward migration.
