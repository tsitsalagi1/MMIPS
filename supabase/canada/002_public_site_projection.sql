-- MMIPS Canada public-site projections.
-- Apply ONLY to the separate Canadian Supabase project after 001_prelaunch_hardening.sql.
-- These views expose only rows already released by the underlying Canada RLS gates.

-- SECURITY INVOKER is intentional: anon/authenticated callers remain subject to
-- the underlying RLS policies and column grants.
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
  c.synthetic,
  c.location_precision,
  p.updated_at
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

grant select on public_case_map_projection to anon, authenticated;

-- The explicit release-gate columns are safe to reference but are not exposed by
-- the view. Granting column SELECT lets SECURITY INVOKER evaluate the view while
-- RLS remains the authority for row visibility.
grant select (public_profile_enabled, public_map_enabled, suppressed_at)
  on cases to anon, authenticated;

create or replace view public_canada_profile_projection
with (security_invoker = true)
as
select
  c.id as case_id,
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
  coalesce(aff.affiliations, '[]'::jsonb) as indigenous_affiliations,
  coalesce(refs.references, '[]'::jsonb) as official_references,
  coalesce(photos.photos, '[]'::jsonb) as photos
from cases c
join persons pe on pe.id = c.person_id
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'affiliation_type', a.affiliation_type,
      'preferred_people_or_nation_name', a.preferred_people_or_nation_name,
      'preferred_community_name', a.preferred_community_name,
      'inuit_region', a.inuit_region,
      'metis_government_or_community', a.metis_government_or_community
    ) order by a.created_at, a.id
  ) as affiliations
  from person_indigenous_affiliations a
  where a.person_id = pe.id
) aff on true
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'reference_type', r.reference_type,
      'agency_or_registry_name', r.agency_or_registry_name,
      'reference_number', r.reference_number,
      'source_url', r.source_url
    ) order by r.created_at, r.id
  ) as references
  from official_case_references r
  where r.case_id = c.id
) refs on true
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'id', ph.id,
      'storage_path', ph.storage_path,
      'alt_text', ph.alt_text
    ) order by ph.created_at, ph.id
  ) as photos
  from profile_photos ph
  where ph.case_id = c.id
) photos on true
where c.review_status = 'approved'
  and c.published_at is not null
  and c.public_profile_enabled = true
  and c.suppressed_at is null;

grant select on public_canada_profile_projection to anon, authenticated;

comment on view public_case_map_projection is
  'Canada-only public map projection. SECURITY INVOKER preserves underlying RLS and explicit map/profile release gates.';
comment on view public_canada_profile_projection is
  'Canada-only public profile projection. SECURITY INVOKER preserves underlying RLS, consent, photo, source, and suppression gates.';
