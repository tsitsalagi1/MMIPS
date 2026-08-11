-- MMIPS Canada public projection tables.
-- Apply ONLY to the separate Canadian Supabase project after 002_public_site_projection.sql.
--
-- SECURITY NOTE:
-- SECURITY INVOKER views require underlying table privileges that would be too broad
-- for Canada because released case rows still contain private columns. Replace the
-- views with trigger-maintained tables containing only deliberately public fields.

revoke all on public_case_map_projection from anon, authenticated;
revoke all on public_canada_profile_projection from anon, authenticated;
drop view if exists public_case_map_projection;
drop view if exists public_canada_profile_projection;

create table public_canada_profile_projection (
  case_id uuid primary key,
  slug text unique not null,
  full_name text not null,
  age integer,
  status case_status not null,
  public_summary text not null,
  last_seen_date date,
  last_seen_locality text,
  last_seen_province_territory char(2),
  last_seen_area_public text,
  location_precision location_precision not null,
  lead_police_service text,
  official_tip_contact text,
  last_public_update date,
  published_at timestamptz not null,
  synthetic boolean not null default false,
  indigenous_affiliations jsonb not null default '[]'::jsonb,
  official_references jsonb not null default '[]'::jsonb,
  photos jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table public_case_map_projection (
  point_id uuid primary key,
  case_id uuid unique not null,
  slug text not null,
  full_name text not null,
  status case_status not null,
  last_seen_date date,
  last_seen_locality text,
  last_seen_province_territory char(2),
  public_area_label text not null,
  public_latitude numeric(10,7) not null check (public_latitude between -90 and 90),
  public_longitude numeric(10,7) not null check (public_longitude between -180 and 180),
  lead_police_service text,
  last_public_update date,
  synthetic boolean not null default false,
  location_precision location_precision not null,
  updated_at timestamptz not null default now()
);

alter table public_canada_profile_projection enable row level security;
alter table public_canada_profile_projection force row level security;
alter table public_case_map_projection enable row level security;
alter table public_case_map_projection force row level security;

revoke all on public_canada_profile_projection, public_case_map_projection from public, anon, authenticated;
grant select on public_canada_profile_projection, public_case_map_projection to anon, authenticated;

create policy canada_public_profiles_read_only
on public_canada_profile_projection
for select
to anon, authenticated
using (true);

create policy canada_public_map_read_only
on public_case_map_projection
for select
to anon, authenticated
using (true);

create or replace function refresh_canada_public_case(target_case_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  delete from public.public_case_map_projection where case_id = target_case_id;
  delete from public.public_canada_profile_projection where case_id = target_case_id;

  insert into public.public_canada_profile_projection (
    case_id, slug, full_name, age, status, public_summary,
    last_seen_date, last_seen_locality, last_seen_province_territory,
    last_seen_area_public, location_precision, lead_police_service,
    official_tip_contact, last_public_update, published_at, synthetic,
    indigenous_affiliations, official_references, photos, updated_at
  )
  select
    c.id,
    c.slug,
    pe.full_name,
    pe.age,
    c.status,
    c.public_summary,
    c.last_seen_date,
    c.last_seen_locality,
    c.last_seen_province_territory,
    c.last_seen_area_public,
    c.location_precision,
    c.lead_police_service,
    c.official_tip_contact,
    c.last_public_update,
    c.published_at,
    c.synthetic,
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'affiliation_type', a.affiliation_type,
          'preferred_people_or_nation_name', a.preferred_people_or_nation_name,
          'preferred_community_name', a.preferred_community_name,
          'inuit_region', a.inuit_region,
          'metis_government_or_community', a.metis_government_or_community
        ) order by a.created_at, a.id
      )
      from public.person_indigenous_affiliations a
      where a.person_id = pe.id and a.permission_to_publish = true
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'reference_type', r.reference_type,
          'agency_or_registry_name', r.agency_or_registry_name,
          'reference_number', r.reference_number,
          'source_url', r.source_url
        ) order by r.created_at, r.id
      )
      from public.official_case_references r
      where r.case_id = c.id and r.is_public = true
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', ph.id,
          'storage_path', ph.storage_path,
          'alt_text', ph.alt_text
        ) order by ph.created_at, ph.id
      )
      from public.profile_photos ph
      where ph.case_id = c.id
        and ph.permission_confirmed = true
        and ph.use_on_profile = true
    ), '[]'::jsonb),
    now()
  from public.cases c
  join public.persons pe on pe.id = c.person_id
  where c.id = target_case_id
    and c.review_status = 'approved'
    and c.published_at is not null
    and c.public_profile_enabled = true
    and c.suppressed_at is null;

  insert into public.public_case_map_projection (
    point_id, case_id, slug, full_name, status, last_seen_date,
    last_seen_locality, last_seen_province_territory, public_area_label,
    public_latitude, public_longitude, lead_police_service,
    last_public_update, synthetic, location_precision, updated_at
  )
  select
    mp.id,
    c.id,
    c.slug,
    pe.full_name,
    c.status,
    c.last_seen_date,
    c.last_seen_locality,
    c.last_seen_province_territory,
    mp.public_area_label,
    mp.public_latitude,
    mp.public_longitude,
    c.lead_police_service,
    c.last_public_update,
    c.synthetic,
    c.location_precision,
    now()
  from public.cases c
  join public.persons pe on pe.id = c.person_id
  join public.public_case_map_points mp on mp.case_id = c.id
  where c.id = target_case_id
    and c.review_status = 'approved'
    and c.published_at is not null
    and c.public_profile_enabled = true
    and c.public_map_enabled = true
    and c.suppressed_at is null
    and mp.moderator_approved = true
    and mp.hidden = false;
end;
$$;

revoke all on function refresh_canada_public_case(uuid) from public, anon, authenticated;

create or replace function sync_canada_public_case_trigger()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  perform public.refresh_canada_public_case(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

create or replace function sync_canada_public_case_child_trigger()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  perform public.refresh_canada_public_case(coalesce(new.case_id, old.case_id));
  return coalesce(new, old);
end;
$$;

create or replace function sync_canada_public_person_trigger()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_person_id uuid := coalesce(new.id, old.id);
  item record;
begin
  for item in select id from public.cases where person_id = target_person_id loop
    perform public.refresh_canada_public_case(item.id);
  end loop;
  return coalesce(new, old);
end;
$$;

create or replace function sync_canada_public_affiliation_trigger()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target_person_id uuid := coalesce(new.person_id, old.person_id);
  item record;
begin
  for item in select id from public.cases where person_id = target_person_id loop
    perform public.refresh_canada_public_case(item.id);
  end loop;
  return coalesce(new, old);
end;
$$;

revoke all on function sync_canada_public_case_trigger() from public, anon, authenticated;
revoke all on function sync_canada_public_case_child_trigger() from public, anon, authenticated;
revoke all on function sync_canada_public_person_trigger() from public, anon, authenticated;
revoke all on function sync_canada_public_affiliation_trigger() from public, anon, authenticated;

drop trigger if exists cases_sync_canada_public_projection on cases;
create trigger cases_sync_canada_public_projection
after insert or update or delete on cases
for each row execute function sync_canada_public_case_trigger();

drop trigger if exists map_points_sync_canada_public_projection on public_case_map_points;
create trigger map_points_sync_canada_public_projection
after insert or update or delete on public_case_map_points
for each row execute function sync_canada_public_case_child_trigger();

drop trigger if exists official_refs_sync_canada_public_projection on official_case_references;
create trigger official_refs_sync_canada_public_projection
after insert or update or delete on official_case_references
for each row execute function sync_canada_public_case_child_trigger();

drop trigger if exists photos_sync_canada_public_projection on profile_photos;
create trigger photos_sync_canada_public_projection
after insert or update or delete on profile_photos
for each row execute function sync_canada_public_case_child_trigger();

drop trigger if exists persons_sync_canada_public_projection on persons;
create trigger persons_sync_canada_public_projection
after update on persons
for each row execute function sync_canada_public_person_trigger();

drop trigger if exists affiliations_sync_canada_public_projection on person_indigenous_affiliations;
create trigger affiliations_sync_canada_public_projection
after insert or update or delete on person_indigenous_affiliations
for each row execute function sync_canada_public_affiliation_trigger();

-- Backfill any already-released Canadian cases. The new project currently has no
-- real rows, but this makes the migration safe to apply after future data imports.
do $$
declare
  item record;
begin
  for item in select id from public.cases loop
    perform public.refresh_canada_public_case(item.id);
  end loop;
end;
$$;

comment on table public_canada_profile_projection is
  'Canada-only public profile projection table. Contains only fields that passed explicit publication, permission, and suppression gates.';
comment on table public_case_map_projection is
  'Canada-only public map projection table. Contains only moderator-approved approximate map data for explicitly released public profiles.';
