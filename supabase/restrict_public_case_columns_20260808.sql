-- Already applied to production on 2026-08-08; restored from Supabase migration history.
-- Defense in depth: public readers get only the columns required by MMIPS public loaders.
-- RLS continues to decide which rows are visible; these grants decide which columns can ever be selected.

revoke select on table public.cases from public, anon, authenticated;
revoke select on table public.persons from public, anon, authenticated;
revoke select on table public.case_verifications from public, anon, authenticated;
revoke select on table public.case_events from public, anon, authenticated;
revoke select on table public.profile_photos from public, anon, authenticated;

-- Public case projection. Deliberately excludes exact latitude/longitude and other unused columns.
grant select (
  id,
  person_id,
  slug,
  status,
  profile_type,
  urgency_level,
  review_status,
  public_summary,
  last_seen_date,
  last_known_datetime,
  last_known_time_zone,
  last_seen_area_public,
  last_seen_city,
  last_seen_state,
  notification_area_requested,
  likely_travel_mode,
  possible_direction,
  vehicle_description,
  official_info_pending,
  location_precision,
  lead_agency,
  agency_case_number,
  namus_number,
  ncic_status,
  tribe_notified,
  family_liaison,
  official_tip_contact,
  photo_storage_path,
  photo_alt_text,
  last_public_update,
  published_at
) on table public.cases to anon, authenticated;

grant select (
  id,
  full_name,
  age,
  tribal_affiliation
) on table public.persons to anon, authenticated;

grant select (
  case_id,
  verification_type,
  source_label,
  source_url,
  is_public
) on table public.case_verifications to anon, authenticated;

grant select (
  id,
  case_id,
  event_date,
  title,
  description,
  is_public
) on table public.case_events to anon, authenticated;

grant select (
  id,
  case_id,
  storage_path,
  alt_text,
  caption,
  photo_type,
  use_on_profile,
  use_on_flyer,
  is_main,
  sort_order
) on table public.profile_photos to anon, authenticated;
