-- MMIPS Alerts V1 correction migration
-- STATIC REVIEW ONLY — NOT EXECUTED
-- Order: schema.sql, security_hardening_20260805.sql, then this file in isolated synthetic staging.
-- Any normalized collision stops migration for human reconciliation; never merge or delete rows here.
alter table alert_subscribers add column if not exists email_normalized text;
alter table alert_subscribers add column if not exists status text not null default 'pending' check (status in ('pending','active','unsubscribed','suppressed'));
alter table alert_subscribers add column if not exists subscription_requested_at timestamptz;
alter table alert_subscribers add column if not exists confirmation_token_hash text;
alter table alert_subscribers add column if not exists confirmation_expires_at timestamptz;
alter table alert_subscribers add column if not exists confirmation_last_sent_at timestamptz;
alter table alert_subscribers add column if not exists confirmation_window_started_at timestamptz;
alter table alert_subscribers add column if not exists confirmation_send_count integer not null default 0 check (confirmation_send_count between 0 and 3);
alter table alert_subscribers add column if not exists unsubscribe_token_id text;
alter table alert_subscribers add column if not exists unsubscribe_token_version integer not null default 1 check (unsubscribe_token_version = 1);
alter table alert_subscribers add column if not exists confirmed_at timestamptz;
alter table alert_subscribers add column if not exists unsubscribed_at timestamptz;
alter table alert_subscribers add column if not exists updated_at timestamptz not null default now();
alter table alert_subscribers add column if not exists preferences jsonb not null default '{"categories":["all_public_alerts"]}'::jsonb;
-- Preserve required consent_source, consent_text, consent_at and all phone/SMS-only records.
update alert_subscribers set email_normalized=lower(btrim(email)) where email is not null and email_normalized is null and length(btrim(email)) between 3 and 254 and btrim(email) like '%@%.%';
do $$ begin if exists (select 1 from alert_subscribers where email_normalized is not null group by email_normalized having count(*) > 1) then raise exception 'MMIPS_ALERT_EMAIL_COLLISION_REQUIRES_HUMAN_RECONCILIATION'; end if; end $$;
create unique index if not exists alert_subscribers_email_normalized_key on alert_subscribers(email_normalized) where email_normalized is not null;
create unique index if not exists alert_subscribers_confirmation_token_hash_key on alert_subscribers(confirmation_token_hash) where confirmation_token_hash is not null;
create unique index if not exists alert_subscribers_unsubscribe_token_id_key on alert_subscribers(unsubscribe_token_id) where unsubscribe_token_id is not null;
create table if not exists alert_deliveries (
 id uuid primary key default uuid_generate_v4(), subscriber_id uuid not null references alert_subscribers(id) on delete restrict,
 alert_event_key text not null check(length(alert_event_key) between 1 and 200), delivery_status text not null default 'queued' check(delivery_status in ('queued','sent','failed_retryable','failed_final')),
 provider_message_id text check(provider_message_id is null or length(provider_message_id)<=200), failure_code text check(failure_code is null or failure_code in ('provider_unconfigured','provider_unavailable','provider_rejected','unknown_bounded')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(subscriber_id, alert_event_key)
);
-- Legacy alerts_sent is intentionally unchanged. alert_deliveries stores no message body or address.
create or replace function confirm_alert_subscription(token_hash text, confirmed_time timestamptz) returns table(id uuid,email_normalized text) language sql security definer set search_path=public as $$
 update alert_subscribers set status='active',confirmation_token_hash=null,confirmation_expires_at=null,confirmed_at=confirmed_time,email_enabled=true,updated_at=confirmed_time where confirmation_token_hash=token_hash and status='pending' and confirmation_expires_at > confirmed_time returning id, email_normalized;
$$;
revoke all on function confirm_alert_subscription(text,timestamptz) from public,anon,authenticated; grant execute on function confirm_alert_subscription(text,timestamptz) to service_role;
alter table alert_subscribers enable row level security; alter table alert_subscribers force row level security;
alter table alert_deliveries enable row level security; alter table alert_deliveries force row level security;
revoke all on alert_subscribers, alert_deliveries from anon, authenticated; grant select,insert,update,delete on alert_subscribers,alert_deliveries to service_role;
drop policy if exists alert_subscribers_service_role_all on alert_subscribers; create policy alert_subscribers_service_role_all on alert_subscribers for all to service_role using(true) with check(true);
drop policy if exists alert_deliveries_service_role_all on alert_deliveries; create policy alert_deliveries_service_role_all on alert_deliveries for all to service_role using(true) with check(true);
-- Verification (synthetic only): inspect collision query, grants/RLS; insert a pending row with email plus consent_source='alerts_v1_web', consent_text='alerts_v1_disclosure_2026-08', consent_at and subscription_requested_at; exercise concurrent RPC and ledger uniqueness.
-- Forward fix: disable routes/dispatch, then apply a reviewed repair migration. Drop alert_deliveries only if unused. Never merge/delete subscriber or consent history automatically.
