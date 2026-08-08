-- MMIPS distributed public request rate limits, 2026-08-08.
-- Applied to production through the approved Supabase migration workflow on 2026-08-08.
-- Raw request identifiers are never stored in the counter table. A database-only random secret hashes them before persistence.

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create table if not exists private.rate_limit_secret (
  singleton boolean primary key default true check (singleton),
  secret bytea not null,
  created_at timestamptz not null default now()
);

insert into private.rate_limit_secret(singleton, secret)
values (true, extensions.gen_random_bytes(32))
on conflict (singleton) do nothing;

create table if not exists private.rate_limit_counters (
  scope text not null,
  key_hash text not null,
  window_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (scope, key_hash, window_start)
);

revoke all on private.rate_limit_secret from public, anon, authenticated;
revoke all on private.rate_limit_counters from public, anon, authenticated;

create or replace function public.mmips_consume_rate_limit(
  p_scope text,
  p_identifier text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, private, extensions
as $$
declare
  v_secret bytea;
  v_hash text;
  v_window timestamptz;
  v_count integer;
begin
  if p_scope is null or length(p_scope) < 2 or length(p_scope) > 80
     or p_identifier is null or length(p_identifier) < 1 or length(p_identifier) > 500
     or p_limit < 1 or p_limit > 10000
     or p_window_seconds < 10 or p_window_seconds > 604800 then
    return false;
  end if;

  select secret into v_secret from private.rate_limit_secret where singleton = true;
  if v_secret is null then return false; end if;

  v_hash := encode(extensions.digest(v_secret || convert_to(p_scope || ':' || p_identifier, 'UTF8'), 'sha256'), 'hex');
  v_window := to_timestamp(floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds);

  insert into private.rate_limit_counters(scope, key_hash, window_start, request_count, updated_at)
  values (p_scope, v_hash, v_window, 1, clock_timestamp())
  on conflict (scope, key_hash, window_start)
  do update set request_count = private.rate_limit_counters.request_count + 1, updated_at = clock_timestamp()
  returning request_count into v_count;

  if random() < 0.02 then
    delete from private.rate_limit_counters where window_start < clock_timestamp() - interval '8 days';
  end if;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.mmips_consume_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.mmips_consume_rate_limit(text, text, integer, integer) to service_role;

-- Older source IP values are not needed once the private distributed limiter is available.
update public.submissions set source_ip = null where source_ip is not null;
