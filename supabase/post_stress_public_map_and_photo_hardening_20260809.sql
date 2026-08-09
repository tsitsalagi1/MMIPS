-- Applied to production through Supabase on 2026-08-09.
-- Purpose:
-- 1. Require explicit permission_confirmed=true before any profile photo can be publicly read.
-- 2. Provide one RLS-respecting, public-safe projection for the complete approved MMIPS map/search dataset.
--
-- Migration order:
-- - Safe to apply before the application release; existing code does not depend on the new view.
-- - Deploy application changes after this migration so map/search reads switch to the projection.
--
-- Rollback / forward-fix:
-- - The view can be dropped if the application is first reverted to the prior loader.
-- - Do not weaken the photo policy during rollback. If a compatibility issue appears, forward-fix the application instead.

-- Defense in depth: a photo must have both explicit public-use selection and
-- explicit permission confirmation before an anonymous/authenticated public read.
drop policy if exists "Public can read approved public profile photos" on public.profile_photos;

create policy "Public can read approved public profile photos"
on public.profile_photos
for select
to anon, authenticated
using (
  permission_confirmed = true
  and use_on_profile = true
  and exists (
    select 1
    from public.cases
    where cases.id = profile_photos.case_id
      and cases.review_status = 'approved'
      and cases.published_at is not null
  )
);

-- SECURITY INVOKER is required: the view must obey the underlying table RLS
-- and column grants rather than using the view creator's elevated privileges.
create or replace view public.public_map_profile_projection
with (security_invoker = true)
as
select
  map_point.case_id,
  case_row.slug,
  person_row.full_name as public_name,
  case_row.profile_type,
  case_row.status as public_status,
  map_point.public_label,
  map_point.public_latitude,
  map_point.public_longitude,
  map_point.precision,
  map_point.region_type,
  case_row.last_public_update,
  case_row.last_seen_area_public,
  case_row.last_seen_city,
  case_row.last_seen_state,
  case_row.lead_agency,
  case_row.namus_number,
  person_row.tribal_affiliation,
  map_point.updated_at
from public.public_case_map_points as map_point
join public.cases as case_row on case_row.id = map_point.case_id
left join public.persons as person_row on person_row.id = case_row.person_id
where case_row.review_status = 'approved'
  and case_row.published_at is not null;

revoke all on public.public_map_profile_projection from public;
grant select on public.public_map_profile_projection to anon, authenticated, service_role;

comment on view public.public_map_profile_projection is
  'RLS-respecting public projection for approved MMIPS map/search data. Contains only public-safe approximate geography and public profile search fields.';
