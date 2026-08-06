-- MMIPS Alerts V1 private subscriber migration
-- STATIC REVIEW ONLY — NOT EXECUTED
-- Migration order: run after supabase/schema.sql and supabase/security_hardening_20260805.sql in an isolated synthetic staging project.
-- Rollback/forward-fix: disable alert routes, create a forward migration that drops policies/indexes added here if unused, or repairs columns/policies after snapshot restore. Do not destructively alter production subscriber data without human approval.

create extension if not exists "uuid-ossp";

alter table alert_subscribers add column if not exists email_normalized text;
alter table alert_subscribers add column if not exists status text not null default 'pending' check (status in ('pending','active','unsubscribed','suppressed'));
alter table alert_subscribers add column if not exists confirmation_token_hash text;
alter table alert_subscribers add column if not exists confirmation_expires_at timestamptz;
alter table alert_subscribers add column if not exists unsubscribe_token_hash text;
alter table alert_subscribers add column if not exists confirmed_at timestamptz;
alter table alert_subscribers add column if not exists unsubscribed_at timestamptz;
alter table alert_subscribers add column if not exists updated_at timestamptz not null default now();
alter table alert_subscribers add column if not exists preferences jsonb not null default '{"categories":["all_public_alerts"]}'::jsonb;

alter table alert_subscribers alter column email drop not null;
alter table alert_subscribers alter column phone drop not null;
alter table alert_subscribers alter column sms_enabled set default false;

create unique index if not exists alert_subscribers_email_normalized_key on alert_subscribers (email_normalized) where email_normalized is not null;
create unique index if not exists alert_subscribers_confirmation_token_hash_key on alert_subscribers (confirmation_token_hash) where confirmation_token_hash is not null;
create unique index if not exists alert_subscribers_unsubscribe_token_hash_key on alert_subscribers (unsubscribe_token_hash) where unsubscribe_token_hash is not null;

alter table alerts_sent add column if not exists subscriber_id uuid references alert_subscribers(id) on delete set null;
alter table alerts_sent add column if not exists alert_event_key text;
alter table alerts_sent add column if not exists delivery_status text not null default 'queued' check (delivery_status in ('queued','sent','skipped','failed_retryable','failed_final'));
alter table alerts_sent add column if not exists failure_code text check (failure_code is null or failure_code in ('provider_unavailable','provider_rejected','duplicate_suppressed','subscriber_inactive','unsafe_event','unknown_bounded'));
alter table alerts_sent add column if not exists updated_at timestamptz not null default now();

create unique index if not exists alerts_sent_subscriber_event_key on alerts_sent (subscriber_id, alert_event_key) where subscriber_id is not null and alert_event_key is not null;

alter table alert_subscribers enable row level security;
alter table alerts_sent enable row level security;
alter table alert_subscribers force row level security;
alter table alerts_sent force row level security;

revoke all on alert_subscribers from anon, authenticated;
revoke all on alerts_sent from anon, authenticated;

drop policy if exists "alert_subscribers_service_role_all" on alert_subscribers;
drop policy if exists "alerts_sent_service_role_all" on alerts_sent;
create policy "alert_subscribers_service_role_all" on alert_subscribers for all to service_role using (true) with check (true);
create policy "alerts_sent_service_role_all" on alerts_sent for all to service_role using (true) with check (true);

-- Verification queries for isolated synthetic staging only:
-- select relrowsecurity, relforcerowsecurity from pg_class where relname in ('alert_subscribers','alerts_sent');
-- select grantee, privilege_type from information_schema.role_table_grants where table_name in ('alert_subscribers','alerts_sent') and grantee in ('anon','authenticated');
-- select policyname, roles, cmd from pg_policies where tablename in ('alert_subscribers','alerts_sent');
-- insert synthetic pending/active/unsubscribed subscribers through server routes only; verify anon/authenticated SELECT returns denied/no rows.
