alter table public.alert_subscribers
  add column if not exists email_normalized text,
  add column if not exists email_enabled boolean not null default true,
  add column if not exists status text not null default 'pending',
  add column if not exists subscription_requested_at timestamptz,
  add column if not exists confirmation_token_hash text,
  add column if not exists confirmation_expires_at timestamptz,
  add column if not exists confirmation_last_sent_at timestamptz,
  add column if not exists confirmation_window_started_at timestamptz,
  add column if not exists confirmation_send_count integer not null default 0,
  add column if not exists unsubscribe_token_id text,
  add column if not exists unsubscribe_token_version integer not null default 1,
  add column if not exists unsubscribed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists preferences jsonb not null default '{"categories":["urgent_community_alerts"]}'::jsonb,
  add column if not exists home_zip text,
  add column if not exists home_latitude numeric,
  add column if not exists home_longitude numeric,
  add column if not exists radius_miles integer,
  add column if not exists all_urgent boolean not null default false,
  add column if not exists geography_source text;

update public.alert_subscribers
set email_normalized = lower(trim(email)),
    status = case
      when opt_out_at is not null then 'unsubscribed'
      when confirmed_at is not null then 'active'
      else 'pending'
    end,
    email_enabled = (opt_out_at is null),
    home_zip = coalesce(home_zip, trim(postal_code::text)),
    radius_miles = coalesce(
      radius_miles,
      case when radius_km is null then null else round((radius_km::numeric / 1.609344))::integer end
    ),
    updated_at = now()
where email_normalized is null or home_zip is null or radius_miles is null;

create unique index if not exists alert_subscribers_email_normalized_uq
  on public.alert_subscribers(email_normalized)
  where email_normalized is not null;

create table if not exists public.alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid not null references public.alert_subscribers(id) on delete cascade,
  alert_event_key text not null,
  delivery_status text not null default 'queued'
    check (delivery_status in ('queued','sent','failed_retryable','failed_final')),
  provider_message_id text,
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subscriber_id, alert_event_key)
);

alter table public.alert_deliveries enable row level security;
alter table public.alert_deliveries force row level security;
revoke all on table public.alert_deliveries from anon, authenticated;
grant select, insert, update on table public.alert_deliveries to service_role;

alter table public.alert_subscribers enable row level security;
alter table public.alert_subscribers force row level security;
revoke all on table public.alert_subscribers from anon, authenticated;
grant select, insert, update on table public.alert_subscribers to service_role;

create index if not exists alert_deliveries_event_key_idx on public.alert_deliveries(alert_event_key);
create index if not exists alert_deliveries_subscriber_idx on public.alert_deliveries(subscriber_id);
