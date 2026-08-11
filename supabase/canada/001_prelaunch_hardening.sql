-- MMIPS Canada prelaunch hardening.
-- Apply ONLY after supabase/canada/schema.sql in the separate Canadian project.
-- This migration keeps real intake locked while strengthening privacy, release gates,
-- lifecycle controls, coordinate validation, RLS, and query performance.

create type privacy_request_type as enum (
  'access',
  'correction',
  'withdraw_consent',
  'suppress_publication',
  'delete_or_deidentify',
  'other'
);

alter table submissions
  add column retention_until timestamptz,
  add column source_ip_delete_after timestamptz not null default (now() + interval '30 days'),
  add column withdrawn_at timestamptz;

alter table cases
  add column public_profile_enabled boolean not null default false,
  add column public_map_enabled boolean not null default false,
  add column suppressed_at timestamptz,
  add column suppression_reason text,
  add constraint cases_exact_latitude_bounds check (exact_latitude is null or exact_latitude between -90 and 90),
  add constraint cases_exact_longitude_bounds check (exact_longitude is null or exact_longitude between -180 and 180);

alter table public_case_map_points
  add constraint public_case_map_points_latitude_bounds check (public_latitude between -90 and 90),
  add constraint public_case_map_points_longitude_bounds check (public_longitude between -180 and 180);

create table privacy_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  case_id uuid references cases(id) on delete set null,
  request_type privacy_request_type not null,
  requester_name text not null,
  requester_email text not null,
  requester_phone text,
  relationship text,
  request_details text not null,
  consent_language text not null default 'en' check (consent_language in ('en','fr')),
  review_status review_status not null default 'pending_review',
  resolved_at timestamptz,
  resolution_notes text
);

alter table privacy_requests enable row level security;
alter table privacy_requests force row level security;
revoke all on privacy_requests from anon, authenticated;

-- Force RLS on every table that can contain personal, family, moderation,
-- verification, subscriber, or audit data. service_role/BYPASSRLS remains the
-- controlled server-side administrative path.
alter table persons force row level security;
alter table person_indigenous_affiliations force row level security;
alter table submission_indigenous_affiliations force row level security;
alter table official_case_references force row level security;
alter table case_verifications force row level security;
alter table profile_photos force row level security;
alter table correction_requests force row level security;
alter table audit_log force row level security;

-- Published rows require an explicit Canada public-profile release gate in
-- addition to review approval and a publication timestamp.
drop policy if exists public_read_published_cases on cases;
create policy public_read_published_cases on cases
for select using (
  review_status = 'approved'
  and published_at is not null
  and public_profile_enabled = true
  and suppressed_at is null
);

drop policy if exists public_read_persons_for_published_cases on persons;
create policy public_read_persons_for_published_cases on persons
for select using (
  exists (
    select 1 from cases c
    where c.person_id = persons.id
      and c.review_status = 'approved'
      and c.published_at is not null
      and c.public_profile_enabled = true
      and c.suppressed_at is null
  )
);

drop policy if exists public_read_affiliations_with_permission on person_indigenous_affiliations;
create policy public_read_affiliations_with_permission on person_indigenous_affiliations
for select using (
  permission_to_publish = true
  and exists (
    select 1 from cases c
    where c.person_id = person_indigenous_affiliations.person_id
      and c.review_status = 'approved'
      and c.published_at is not null
      and c.public_profile_enabled = true
      and c.suppressed_at is null
  )
);

drop policy if exists public_read_public_references on official_case_references;
create policy public_read_public_references on official_case_references
for select using (
  is_public = true
  and exists (
    select 1 from cases c
    where c.id = official_case_references.case_id
      and c.review_status = 'approved'
      and c.published_at is not null
      and c.public_profile_enabled = true
      and c.suppressed_at is null
  )
);

drop policy if exists public_read_public_verifications on case_verifications;
create policy public_read_public_verifications on case_verifications
for select using (
  is_public = true
  and exists (
    select 1 from cases c
    where c.id = case_verifications.case_id
      and c.review_status = 'approved'
      and c.published_at is not null
      and c.public_profile_enabled = true
      and c.suppressed_at is null
  )
);

drop policy if exists public_read_approved_map_points on public_case_map_points;
create policy public_read_approved_map_points on public_case_map_points
for select using (
  moderator_approved = true
  and hidden = false
  and exists (
    select 1 from cases c
    where c.id = public_case_map_points.case_id
      and c.review_status = 'approved'
      and c.published_at is not null
      and c.public_profile_enabled = true
      and c.public_map_enabled = true
      and c.suppressed_at is null
  )
);

drop policy if exists public_read_authorized_photos on profile_photos;
create policy public_read_authorized_photos on profile_photos
for select using (
  permission_confirmed = true
  and use_on_profile = true
  and exists (
    select 1 from cases c
    where c.id = profile_photos.case_id
      and c.review_status = 'approved'
      and c.published_at is not null
      and c.public_profile_enabled = true
      and c.suppressed_at is null
  )
);

-- The original view does not expose private columns, but rebuild it so its
-- predicate mirrors the explicit profile/map release gates above.
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
  and c.published_at is not null
  and c.public_profile_enabled = true
  and c.public_map_enabled = true
  and c.suppressed_at is null;

-- Foreign-key and release-query indexes that are easy to miss during the
-- blueprint stage but matter once the Canadian system grows.
create index if not exists submission_indigenous_affiliations_submission_idx
  on submission_indigenous_affiliations (submission_id);
create index if not exists cases_person_idx on cases (person_id);
create index if not exists case_verifications_case_idx on case_verifications (case_id);
create index if not exists correction_requests_case_idx on correction_requests (case_id);
create index if not exists privacy_requests_case_idx on privacy_requests (case_id);
create index if not exists submissions_review_status_idx on submissions (review_status, created_at);
create index if not exists privacy_requests_review_status_idx on privacy_requests (review_status, created_at);
create index if not exists cases_public_release_idx
  on cases (review_status, public_profile_enabled, public_map_enabled, published_at)
  where published_at is not null and suppressed_at is null;

-- Keep mutable records' timestamps trustworthy without depending on every
-- application path remembering to set updated_at.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger submissions_set_updated_at
before update on submissions
for each row execute function set_updated_at();

create trigger cases_set_updated_at
before update on cases
for each row execute function set_updated_at();

create trigger public_case_map_points_set_updated_at
before update on public_case_map_points
for each row execute function set_updated_at();

create trigger privacy_requests_set_updated_at
before update on privacy_requests
for each row execute function set_updated_at();

comment on column submissions.source_ip_delete_after is
  'Operational deletion deadline for source_ip; application/maintenance jobs must clear source_ip after this time.';
comment on column cases.public_profile_enabled is
  'Explicit Canadian public-profile release gate; approval/published_at alone are insufficient.';
comment on column cases.public_map_enabled is
  'Explicit Canadian public-map release gate; profile release alone is insufficient.';
comment on table privacy_requests is
  'Canadian privacy/access/correction/withdrawal/suppression/deletion request workflow; never publicly readable.';
