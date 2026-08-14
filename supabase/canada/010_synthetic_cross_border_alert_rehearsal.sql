-- Synthetic-only U.S.–Canada distance-alert rehearsal data and isolation.
-- Apply to the separate Canadian Supabase project only after 009.
-- These reserved .test addresses cannot receive Internet email. No real subscriber
-- is modified, and synthetic targets can match only synthetic subscribers.

alter table public.cases add column if not exists urgency_level text not null default 'standard';
alter table public.cases drop constraint if exists cases_urgency_level_check;
alter table public.cases add constraint cases_urgency_level_check
  check (urgency_level in ('standard','urgent_public_awareness','renewed_visibility','status_update'));

alter table public.alert_subscribers add column if not exists synthetic boolean not null default false;

drop index if exists public.alert_subscribers_email_normalized_uq;
create unique index if not exists alert_subscribers_email_normalized_uq
  on public.alert_subscribers(email_normalized);

create index if not exists alert_subscribers_synthetic_active_idx
  on public.alert_subscribers(synthetic, status, email_enabled)
  where status = 'active' and email_enabled = true;

insert into public.alert_subscribers (
  email, email_normalized, postal_code, province_territory, radius_km,
  status, synthetic, consent_language, consent_source, consent_text, consent_at,
  subscription_requested_at, confirmed_at, unsubscribe_token_id, preferences,
  home_zip, home_latitude, home_longitude, radius_miles, all_urgent,
  geography_source, email_enabled, updated_at
)
values
  (
    'synthetic-windsor-border@example.test', 'synthetic-windsor-border@example.test',
    'N9A 1A1', 'ON', 16.09, 'active', true, 'en', 'synthetic_cross_border_rehearsal',
    'FICTIONAL TEST SUBSCRIBER — no real person or deliverable address.', now(), now(), now(),
    replace(replace(rtrim(encode(gen_random_bytes(32), 'base64'), '='), '+', '-'), '/', '_'),
    '{"categories":["urgent_community_alerts"]}'::jsonb,
    'N9A', 42.3149, -83.0364, 10, false, 'synthetic-city-centre-rehearsal', true, now()
  ),
  (
    'synthetic-toronto-outside@example.test', 'synthetic-toronto-outside@example.test',
    'M5H 2N2', 'ON', 160.93, 'active', true, 'en', 'synthetic_cross_border_rehearsal',
    'FICTIONAL TEST SUBSCRIBER — no real person or deliverable address.', now(), now(), now(),
    replace(replace(rtrim(encode(gen_random_bytes(32), 'base64'), '='), '+', '-'), '/', '_'),
    '{"categories":["urgent_community_alerts"]}'::jsonb,
    'M5H', 43.6532, -79.3832, 100, false, 'synthetic-city-centre-rehearsal', true, now()
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

comment on column public.alert_subscribers.synthetic is 'Explicit fictional rehearsal audience boundary; never inferred from email at dispatch time.';

-- Rollback/forward-fix: suppress only these two reserved .test rows by setting
-- status='suppressed' and email_enabled=false. Keep the synthetic column,
-- urgency constraint, and dispatch isolation in place.
