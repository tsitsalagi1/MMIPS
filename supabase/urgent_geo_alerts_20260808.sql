-- MMIPS urgent community alert geographic preferences, 2026-08-08.
-- Additive, privacy-preserving migration. Subscriber ZIP centroids are generalized Census ZCTA values,
-- not home, device, incident, or exact coordinates. All subscriber/event rows remain service-role only.

-- Replace the former partial unique index so PostgREST/Supabase upsert(onConflict=email_normalized)
-- has a valid conflict arbiter while still allowing multiple NULL legacy/SMS-only rows.
drop index if exists public.alert_subscribers_email_normalized_key;
create unique index if not exists alert_subscribers_email_normalized_unique
  on public.alert_subscribers(email_normalized);

alter table public.alert_subscribers add column if not exists home_zip text;
alter table public.alert_subscribers add column if not exists home_latitude numeric;
alter table public.alert_subscribers add column if not exists home_longitude numeric;
alter table public.alert_subscribers add column if not exists radius_miles integer;
alter table public.alert_subscribers add column if not exists all_urgent boolean not null default false;
alter table public.alert_subscribers add column if not exists geography_source text;

alter table public.alert_subscribers drop constraint if exists alert_subscribers_home_zip_check;
alter table public.alert_subscribers add constraint alert_subscribers_home_zip_check
  check (home_zip is null or home_zip ~ '^[0-9]{5}$');
alter table public.alert_subscribers drop constraint if exists alert_subscribers_radius_miles_check;
alter table public.alert_subscribers add constraint alert_subscribers_radius_miles_check
  check (radius_miles is null or radius_miles in (10,25,50,100,250));
alter table public.alert_subscribers drop constraint if exists alert_subscribers_home_latitude_check;
alter table public.alert_subscribers add constraint alert_subscribers_home_latitude_check
  check (home_latitude is null or home_latitude between -90 and 90);
alter table public.alert_subscribers drop constraint if exists alert_subscribers_home_longitude_check;
alter table public.alert_subscribers add constraint alert_subscribers_home_longitude_check
  check (home_longitude is null or home_longitude between -180 and 180);

create index if not exists alert_subscribers_active_geo_idx
  on public.alert_subscribers(status, email_enabled, home_zip, radius_miles)
  where status = 'active' and email_enabled = true;

create table if not exists public.urgent_alert_events (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid not null references public.cases(id) on delete restrict,
  event_key text not null unique check (length(event_key) between 8 and 200),
  title text not null check (length(title) between 1 and 160),
  public_url text not null check (length(public_url) between 1 and 500),
  public_map_label text not null check (length(public_map_label) between 1 and 200),
  public_latitude numeric not null check (public_latitude between -90 and 90),
  public_longitude numeric not null check (public_longitude between -180 and 180),
  approved_by uuid,
  matched_count integer not null default 0 check (matched_count >= 0),
  sent_count integer not null default 0 check (sent_count >= 0),
  status text not null default 'draft' check (status in ('draft','sending','sent','partial','failed')),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists urgent_alert_events_case_id_idx on public.urgent_alert_events(case_id);

alter table public.urgent_alert_events enable row level security;
alter table public.urgent_alert_events force row level security;
revoke all on public.urgent_alert_events from public, anon, authenticated;
grant select, insert, update, delete on public.urgent_alert_events to service_role;
drop policy if exists urgent_alert_events_service_role_all on public.urgent_alert_events;
create policy urgent_alert_events_service_role_all on public.urgent_alert_events
  for all to service_role using (true) with check (true);

comment on column public.alert_subscribers.home_latitude is 'Generalized Census ZCTA representative latitude derived server-side from subscriber ZIP; never a home/device coordinate.';
comment on column public.alert_subscribers.home_longitude is 'Generalized Census ZCTA representative longitude derived server-side from subscriber ZIP; never a home/device coordinate.';
