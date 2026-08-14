-- Synthetic-only U.S.–Canada distance-alert rehearsal data and isolation.
-- Apply to the United States Supabase project only after urgent_geo_alerts_20260808.sql.
-- These reserved .test addresses cannot receive Internet email. No real subscriber
-- is modified, and synthetic targets can match only synthetic subscribers.

create extension if not exists pgcrypto;

alter table public.cases add column if not exists synthetic boolean not null default false;
alter table public.alert_subscribers add column if not exists synthetic boolean not null default false;

update public.cases c
set synthetic = true
from public.persons p
where p.id = c.person_id
  and c.synthetic = false
  and p.full_name like 'MMIPS TEST PERSON%NOT A REAL PERSON%'
  and c.official_tip_contact ilike '%SYNTHETIC%';

create index if not exists cases_synthetic_idx on public.cases(synthetic) where synthetic = true;
create index if not exists alert_subscribers_synthetic_active_idx
  on public.alert_subscribers(synthetic, status, email_enabled)
  where status = 'active' and email_enabled = true;

insert into public.alert_subscribers (
  email, email_normalized, status, synthetic, consent_source, consent_text, consent_at,
  subscription_requested_at, confirmed_at, unsubscribe_token_id, preferences,
  home_zip, home_latitude, home_longitude, radius_miles, all_urgent,
  geography_source, email_enabled, updated_at
)
values
  (
    'synthetic-detroit-border@example.test', 'synthetic-detroit-border@example.test',
    'active', true, 'synthetic_cross_border_rehearsal',
    'FICTIONAL TEST SUBSCRIBER — no real person or deliverable address.', now(), now(), now(),
    replace(replace(rtrim(encode(gen_random_bytes(32), 'base64'), '='), '+', '-'), '/', '_'),
    '{"categories":["urgent_community_alerts"]}'::jsonb,
    '48226', 42.3314, -83.0458, 10, false, 'synthetic-city-centre-rehearsal', true, now()
  ),
  (
    'synthetic-chicago-outside@example.test', 'synthetic-chicago-outside@example.test',
    'active', true, 'synthetic_cross_border_rehearsal',
    'FICTIONAL TEST SUBSCRIBER — no real person or deliverable address.', now(), now(), now(),
    replace(replace(rtrim(encode(gen_random_bytes(32), 'base64'), '='), '+', '-'), '/', '_'),
    '{"categories":["urgent_community_alerts"]}'::jsonb,
    '60601', 41.8781, -87.6298, 100, false, 'synthetic-city-centre-rehearsal', true, now()
  )
on conflict (email_normalized) do update set
  status = excluded.status,
  synthetic = excluded.synthetic,
  preferences = excluded.preferences,
  home_zip = excluded.home_zip,
  home_latitude = excluded.home_latitude,
  home_longitude = excluded.home_longitude,
  radius_miles = excluded.radius_miles,
  all_urgent = excluded.all_urgent,
  geography_source = excluded.geography_source,
  email_enabled = excluded.email_enabled,
  updated_at = excluded.updated_at
where public.alert_subscribers.synthetic = true;

comment on column public.cases.synthetic is 'Explicit fictional-data boundary; false for all real-person records.';
comment on column public.alert_subscribers.synthetic is 'Explicit fictional rehearsal audience boundary; never inferred from email at dispatch time.';

-- Rollback/forward-fix: suppress only these two reserved .test rows by setting
-- status='suppressed' and email_enabled=false. Keep the synthetic columns and
-- dispatch isolation in place; do not revert to name-prefix audience checks.
