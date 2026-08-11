-- MMIPS Canada public-source lockdown.
-- Public readers use only the trigger-maintained projection tables created by
-- 003_materialized_public_projections.sql. Source tables remain service/admin only.

revoke all on
  persons,
  person_indigenous_affiliations,
  cases,
  official_case_references,
  case_verifications,
  public_case_map_points,
  profile_photos
from anon, authenticated;

-- Public projection tables remain the only anonymous/authenticated database read surface.
grant select on public_canada_profile_projection, public_case_map_projection to anon, authenticated;
