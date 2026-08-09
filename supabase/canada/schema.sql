-- MMIPS Canada starter schema.
-- IMPORTANT: This file is for a NEW, SEPARATE Canadian Supabase project only.
-- Do not run it against the United States MMIPS database.
-- Real intake remains closed until Canadian privacy, governance, moderation,
-- bilingual, security, and synthetic-rehearsal release gates are complete.

create extension if not exists pgcrypto;

create type case_status as enum ('missing', 'homicide_unsolved', 'unidentified', 'resolved', 'unknown');
create type review_status as enum ('pending_review', 'needs_more_info', 'approved', 'rejected', 'hidden');
create type location_precision as enum ('exact_private', 'approximate', 'locality', 'region', 'hidden');
create type indigenous_affiliation_type as enum ('first_nation', 'inuit', 'metis', 'multiple', 'self_described', 'not_disclosed');
create type official_reference_type as enum ('local_police_file', 'rcmp_file', 'provincial_or_territorial_reference', 'other_official');

create table persons (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  age int check (age is null or (age >= 0 and age <= 130)),
  public_notes text
);

create table person_indigenous_affiliations (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references persons(id) on delete cascade,
  affiliation_type indigenous_affiliation_type not null,
  preferred_people_or_nation_name text,
  preferred_community_name text,
  inuit_region text,
  metis_government_or_community text,
  permission_to_publish boolean not null default false,
  created_at timestamptz not null default now()
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  review_status review_status not null default 'pending_review',
  full_name text not null,
  age int check (age is null or (age >= 0 and age <= 130)),
  status case_status not null default 'unknown',
  last_seen_date date,
  last_seen_locality text not null,
  last_seen_province_territory char(2) not null check (last_seen_province_territory in ('AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT')),
  last_seen_postal_code char(7) check (last_seen_postal_code is null or last_seen_postal_code ~ '^[ABCEGHJ-NPRSTVXY][0-9][ABCEGHJ-NPRSTVWXYZ] [0-9][ABCEGHJ-NPRSTVWXYZ][0-9]$'),
  lead_police_service text,
  police_file_number text,
  public_summary_proposed text not null,
  submitter_name text not null,
  submitter_email text not null,
  submitter_phone text,
  relationship text not null,
  consent_language text not null default 'en' check (consent_language in ('en','fr')),
  consent_text text not null,
  consent_at timestamptz not null default now(),
  moderator_notes text,
  source_ip inet,
  synthetic boolean not null default false
);

create table submission_indigenous_affiliations (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  affiliation_type indigenous_affiliation_type not null,
  preferred_people_or_nation_name text,
  preferred_community_name text,
  inuit_region text,
  metis_government_or_community text,
  permission_to_publish boolean not null default false
);

create table cases (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  person_id uuid not null references persons(id) on delete cascade,
  slug text unique not null,
  status case_status not null default 'unknown',
  review_status review_status not null default 'pending_review',
  public_summary text not null,
  last_seen_date date,
  last_seen_locality text,
  last_seen_province_territory char(2) check (last_seen_province_territory is null or last_seen_province_territory in ('AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT')),
  last_seen_area_public text,
  exact_latitude numeric(10,7),
  exact_longitude numeric(10,7),
  location_precision location_precision not null default 'locality',
  lead_police_service text,
  official_tip_contact text,
  family_liaison text,
  last_public_update date,
  published_at timestamptz,
  synthetic boolean not null default false
);

create table official_case_references (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  reference_type official_reference_type not null,
  agency_or_registry_name text not null,
  reference_number text,
  source_url text,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table case_verifications (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  created_at timestamptz not null default now(),
  verification_type text not null,
  source_label text,
  source_url text,
  notes text,
  is_public boolean not null default false
);

create table public_case_map_points (
  id uuid primary key default gen_random_uuid(),
  case_id uuid unique not null references cases(id) on delete cascade,
  public_latitude numeric(10,7) not null,
  public_longitude numeric(10,7) not null,
  public_area_label text not null,
  province_territory char(2) not null check (province_territory in ('AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT')),
  moderator_approved boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table profile_photos (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  storage_path text not null,
  alt_text text,
  permission_confirmed boolean not null default false,
  use_on_profile boolean not null default false,
  created_at timestamptz not null default now()
);

create table correction_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  case_id uuid references cases(id) on delete set null,
  requester_name text not null,
  requester_email text not null,
  relationship text not null,
  request_type text not null,
  request_details text not null,
  consent_language text not null default 'en' check (consent_language in ('en','fr')),
  review_status review_status not null default 'pending_review'
);

create table alert_subscribers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  postal_code char(7) check (postal_code is null or postal_code ~ '^[ABCEGHJ-NPRSTVXY][0-9][ABCEGHJ-NPRSTVWXYZ] [0-9][ABCEGHJ-NPRSTVWXYZ][0-9]$'),
  province_territory char(2) check (province_territory is null or province_territory in ('AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT')),
  radius_km numeric(8,2) check (radius_km is null or (radius_km > 0 and radius_km <= 1000)),
  consent_language text not null default 'en' check (consent_language in ('en','fr')),
  consent_source text not null,
  consent_text text not null,
  consent_at timestamptz not null default now(),
  confirmed_at timestamptz,
  opt_out_at timestamptz
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  reason text,
  metadata jsonb not null default '{}'::jsonb
);

alter table persons enable row level security;
alter table person_indigenous_affiliations enable row level security;
alter table submissions enable row level security;
alter table submission_indigenous_affiliations enable row level security;
alter table cases enable row level security;
alter table official_case_references enable row level security;
alter table case_verifications enable row level security;
alter table public_case_map_points enable row level security;
alter table profile_photos enable row level security;
alter table correction_requests enable row level security;
alter table alert_subscribers enable row level security;
alter table audit_log enable row level security;

alter table submissions force row level security;
alter table cases force row level security;
alter table public_case_map_points force row level security;
alter table alert_subscribers force row level security;

-- There are intentionally NO anonymous insert policies. Real family/case intake
-- stays fail-closed until the Canadian release gate is explicitly implemented.

create policy public_read_published_cases on cases
for select using (review_status = 'approved' and published_at is not null and hidden is distinct from true);

-- `cases` has no `hidden` column by design; public hiding is controlled through
-- publication state and the map-point hidden flag. Replace the policy above with
-- the final release policy before executing this schema in production.

drop policy if exists public_read_published_cases on cases;
create policy public_read_published_cases on cases
for select using (review_status = 'approved' and published_at is not null);

create policy public_read_persons_for_published_cases on persons
for select using (
  exists (
    select 1 from cases c
    where c.person_id = persons.id
      and c.review_status = 'approved'
      and c.published_at is not null
  )
);

create policy public_read_affiliations_with_permission on person_indigenous_affiliations
for select using (
  permission_to_publish = true
  and exists (
    select 1 from cases c
    where c.person_id = person_indigenous_affiliations.person_id
      and c.review_status = 'approved'
      and c.published_at is not null
  )
);

create policy public_read_public_references on official_case_references
for select using (
  is_public = true
  and exists (
    select 1 from cases c
    where c.id = official_case_references.case_id
      and c.review_status = 'approved'
      and c.published_at is not null
  )
);

create policy public_read_public_verifications on case_verifications
for select using (
  is_public = true
  and exists (
    select 1 from cases c
    where c.id = case_verifications.case_id
      and c.review_status = 'approved'
      and c.published_at is not null
  )
);

create policy public_read_approved_map_points on public_case_map_points
for select using (
  moderator_approved = true
  and hidden = false
  and exists (
    select 1 from cases c
    where c.id = public_case_map_points.case_id
      and c.review_status = 'approved'
      and c.published_at is not null
  )
);

create policy public_read_authorized_photos on profile_photos
for select using (
  permission_confirmed = true
  and use_on_profile = true
  and exists (
    select 1 from cases c
    where c.id = profile_photos.case_id
      and c.review_status = 'approved'
      and c.published_at is not null
  )
);

create or replace view public_case_map_projection
with (security_invoker = true)
as
select
  p.id as point_id,
  c.id as case_id,
  c.slug,
  pe.full_name,
  c.status,
  c.last_seen_date,
  c.last_seen_locality,
  c.last_seen_province_territory,
  p.public_area_label,
  p.public_latitude,
  p.public_longitude,
  c.lead_police_service,
  c.last_public_update,
  c.synthetic
from public_case_map_points p
join cases c on c.id = p.case_id
join persons pe on pe.id = c.person_id
where p.moderator_approved = true
  and p.hidden = false
  and c.review_status = 'approved'
  and c.published_at is not null;

grant select on public_case_map_projection to anon, authenticated;

create index public_case_map_points_province_idx on public_case_map_points (province_territory);
create index cases_last_seen_province_idx on cases (last_seen_province_territory);
create index cases_publication_idx on cases (review_status, published_at) where published_at is not null;
create index official_case_references_case_idx on official_case_references (case_id);
create index person_indigenous_affiliations_person_idx on person_indigenous_affiliations (person_id);
create index profile_photos_case_idx on profile_photos (case_id);
