-- Complete the private MMIPS Canada alert-subscription contract.
-- Apply to the separate Canadian Supabase project only after 010.
-- Application order: database first (this migration), then the matching app
-- release. The new function and constraints are backward-compatible with 010.

update public.alert_subscribers
set email_normalized = lower(btrim(email)),
    updated_at = now()
where email_normalized is null;

alter table public.alert_subscribers
  alter column email_normalized set not null;

alter table public.alert_subscribers
  drop constraint if exists alert_subscribers_status_check,
  add constraint alert_subscribers_status_check
    check (status in ('pending', 'active', 'unsubscribed', 'suppressed')),
  drop constraint if exists alert_subscribers_confirmation_send_count_check,
  add constraint alert_subscribers_confirmation_send_count_check
    check (confirmation_send_count >= 0 and confirmation_send_count <= 3),
  drop constraint if exists alert_subscribers_unsubscribe_token_version_check,
  add constraint alert_subscribers_unsubscribe_token_version_check
    check (unsubscribe_token_version >= 1),
  drop constraint if exists alert_subscribers_home_zip_check,
  add constraint alert_subscribers_home_zip_check
    check (
      home_zip is null
      or home_zip ~ '^[ABCEGHJ-NPRSTVXY][0-9][ABCEGHJ-NPRSTVWXYZ]$'
    ),
  drop constraint if exists alert_subscribers_radius_miles_check,
  add constraint alert_subscribers_radius_miles_check
    check (radius_miles is null or radius_miles in (10, 16, 25, 31, 50, 62, 100, 155, 250, 311)),
  drop constraint if exists alert_subscribers_home_coordinates_check,
  add constraint alert_subscribers_home_coordinates_check
    check (
      (home_latitude is null and home_longitude is null)
      or (
        home_latitude between -90 and 90
        and home_longitude between -180 and 180
      )
    );

create unique index if not exists alert_subscribers_confirmation_token_hash_key
  on public.alert_subscribers(confirmation_token_hash)
  where confirmation_token_hash is not null;

create unique index if not exists alert_subscribers_unsubscribe_token_id_key
  on public.alert_subscribers(unsubscribe_token_id)
  where unsubscribe_token_id is not null;

create or replace function public.confirm_alert_subscription(
  token_hash text,
  confirmed_time timestamptz
)
returns table(id uuid, email_normalized text)
language sql
security definer
set search_path = pg_catalog, public
as $$
  update public.alert_subscribers as subscriber
  set status = 'active',
      confirmation_token_hash = null,
      confirmation_expires_at = null,
      confirmed_at = confirmed_time,
      unsubscribed_at = null,
      opt_out_at = null,
      email_enabled = true,
      updated_at = confirmed_time
  where subscriber.confirmation_token_hash = token_hash
    and subscriber.status = 'pending'
    and subscriber.confirmation_expires_at > confirmed_time
  returning subscriber.id, subscriber.email_normalized;
$$;

revoke all on function public.confirm_alert_subscription(text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.confirm_alert_subscription(text, timestamptz)
  to service_role;

alter table public.alert_subscribers enable row level security;
alter table public.alert_subscribers force row level security;
revoke all on table public.alert_subscribers from public, anon, authenticated;
grant select, insert, update on table public.alert_subscribers to service_role;

comment on column public.alert_subscribers.home_zip is
  'Canada-only broad three-character Forward Sortation Area retained for private alert matching; never a street address.';
comment on column public.alert_subscribers.home_latitude is
  'Representative point for a broad Statistics Canada 2021 Census FSA; not a subscriber home or device coordinate.';
comment on column public.alert_subscribers.home_longitude is
  'Representative point for a broad Statistics Canada 2021 Census FSA; not a subscriber home or device coordinate.';

-- Rollback/forward-fix: redeploy the previous application to close Canada alert
-- signup. Existing rows can remain private. To disable confirmation during an
-- incident, revoke execute on confirm_alert_subscription from service_role;
-- restore it with the grant above after the incident is resolved.
