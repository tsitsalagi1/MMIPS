import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const canadaPublic = fs.readFileSync("lib/canada-public.ts", "utf8");
const crossBorderMap = fs.readFileSync("lib/cross-border-public-map.ts", "utf8");
const canadaSearch = fs.readFileSync("components/CanadaProfilesSearch.tsx", "utf8");
const canadaProfile = fs.readFileSync("components/CanadaPublicProfile.tsx", "utf8");
const canadaPrivacy = fs.readFileSync("components/CanadaPrivacy.tsx", "utf8");
const mapRoute = fs.readFileSync("app/api/profiles/map/route.ts", "utf8");
const searchRoute = fs.readFileSync("app/api/profiles/search/route.ts", "utf8");
const projections = fs.readFileSync("supabase/canada/003_materialized_public_projections.sql", "utf8");
const sourceLockdown = fs.readFileSync("supabase/canada/004_lock_public_source_tables.sql", "utf8");

test("Canada map and profile APIs branch to the separate Canada data adapter", () => {
  assert.match(mapRoute, /mmipsSiteMode\(\) === "ca"/);
  assert.match(mapRoute, /getCanadaPublicMapPoints/);
  assert.match(mapRoute, /getCanadaFederatedPublicMapPoints/);
  assert.match(searchRoute, /mmipsSiteMode\(\) === "ca"/);
  assert.match(searchRoute, /searchCanadaPublicProfileIds/);
  assert.match(searchRoute, /geocodeCanadianPostalCode/);
  assert.match(searchRoute, /radiusKm/);
});

test("Canada public data reads only safe projection tables", () => {
  assert.match(canadaPublic, /CANADA_MAP_VIEW = "public_case_map_projection"/);
  assert.match(canadaPublic, /CANADA_PROFILE_VIEW = "public_canada_profile_projection"/);
  assert.doesNotMatch(canadaPublic, /\.from\("cases"\)/);
  assert.doesNotMatch(canadaPublic, /\.from\("persons"\)/);
  assert.doesNotMatch(canadaPublic, /exact_latitude/);
  assert.doesNotMatch(canadaPublic, /exact_longitude/);
});

test("Canada cross-border map imports only the fixed U.S. public projection endpoint", () => {
  assert.match(crossBorderMap, /https:\/\/us\.mmips\.com\/api\/profiles\/map/);
  assert.match(crossBorderMap, /sanitizeUnitedStatesPublicPoint/);
  assert.match(crossBorderMap, /sourceCountry: "us"/);
  assert.match(crossBorderMap, /profileUrl:/);
  assert.match(crossBorderMap, /MAX_REMOTE_PUBLIC_POINTS/);
  assert.doesNotMatch(crossBorderMap, /service_role/i);
  assert.doesNotMatch(crossBorderMap, /submitter/i);
  assert.doesNotMatch(crossBorderMap, /requester/i);
  assert.doesNotMatch(crossBorderMap, /exact_latitude/i);
  assert.doesNotMatch(crossBorderMap, /exact_longitude/i);
});

test("Canada projection tables are read-only public surfaces maintained by release-gated triggers", () => {
  assert.match(projections, /create table public_canada_profile_projection/);
  assert.match(projections, /create table public_case_map_projection/);
  assert.match(projections, /force row level security/);
  assert.match(projections, /for select[\s\S]*to anon, authenticated[\s\S]*using \(true\)/);
  assert.match(projections, /public_profile_enabled = true/);
  assert.match(projections, /public_map_enabled = true/);
  assert.match(projections, /suppressed_at is null/);
  assert.match(projections, /permission_to_publish = true/);
  assert.match(projections, /permission_confirmed = true/);
  assert.match(projections, /use_on_profile = true/);
  assert.match(projections, /moderator_approved = true/);
  assert.match(projections, /mp\.hidden = false/);
  assert.doesNotMatch(projections, /exact_latitude/);
  assert.doesNotMatch(projections, /exact_longitude/);
});

test("Canada source tables are not directly readable by public roles", () => {
  assert.match(sourceLockdown, /revoke all on[\s\S]*persons[\s\S]*cases[\s\S]*public_case_map_points[\s\S]*profile_photos[\s\S]*from anon, authenticated/);
  assert.match(sourceLockdown, /grant select on public_canada_profile_projection, public_case_map_projection to anon, authenticated/);
});

test("Canada search keeps Canadian controls while adding cross-border cards", () => {
  assert.match(canadaSearch, /Province or territory/);
  assert.match(canadaSearch, /Canadian postal code/);
  assert.match(canadaSearch, /Within 1,000 km/);
  assert.match(canadaSearch, /Canada and border-area map/);
  assert.match(canadaSearch, /Browse the current results/);
  assert.match(canadaSearch, /Show more profiles/);
  assert.match(canadaSearch, /sourceCountry === "us"/);
  assert.match(canadaProfile, /First Nations, Inuit or Métis affiliation/);
  assert.match(canadaProfile, /Police \/ official contact/);
  assert.match(canadaProfile, /approximate public area/);
  assert.doesNotMatch(canadaProfile, /NamUs/);
  assert.doesNotMatch(canadaProfile, /NCIC/);
  assert.doesNotMatch(canadaSearch, /ZIP code/);
});

test("Canada privacy copy explains public/private boundaries in plain language", () => {
  assert.match(canadaPrivacy, /What can appear publicly/);
  assert.match(canadaPrivacy, /What stays private/);
  assert.match(canadaPrivacy, /Cross-border public information/);
  assert.match(canadaPrivacy, /Collect and keep only what is needed/);
  assert.match(canadaPrivacy, /withdrawal of consent/);
  assert.match(canadaPrivacy, /deletion or de-identification/);
});
