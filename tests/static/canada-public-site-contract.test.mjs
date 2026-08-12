import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const canadaPublic = fs.readFileSync("lib/canada-public.ts", "utf8");
const canadaSearch = fs.readFileSync("components/CanadaProfilesSearch.tsx", "utf8");
const canadaHome = fs.readFileSync("components/CanadaHome.tsx", "utf8");
const canadaProfile = fs.readFileSync("components/CanadaPublicProfile.tsx", "utf8");
const canadaPrivacy = fs.readFileSync("components/CanadaPrivacy.tsx", "utf8");
const mapRoute = fs.readFileSync("app/api/profiles/map/route.ts", "utf8");
const searchRoute = fs.readFileSync("app/api/profiles/search/route.ts", "utf8");
const projections = fs.readFileSync("supabase/canada/003_materialized_public_projections.sql", "utf8");
const sourceLockdown = fs.readFileSync("supabase/canada/004_lock_public_source_tables.sql", "utf8");

test("Canada map and profile APIs use only the separate Canada data adapter", () => {
  assert.match(mapRoute, /mmipsSiteMode\(\) === "ca"/);
  assert.match(mapRoute, /getCanadaPublicMapPoints/);
  assert.doesNotMatch(mapRoute, /getCanadaFederatedPublicMapPoints/);
  assert.doesNotMatch(mapRoute, /crossBorder/);
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

test("Canada search mirrors the U.S. map-first experience without profile cards", () => {
  assert.match(canadaSearch, /Province or territory/);
  assert.match(canadaSearch, /Canadian postal code/);
  assert.match(canadaSearch, /Within 1,000 km/);
  assert.match(canadaSearch, /MMIPS Canada public profile map/);
  assert.match(canadaSearch, /Selected public profile/);
  assert.match(canadaSearch, /SYNTHETIC TEST DATA IS PRESENT/);
  assert.doesNotMatch(canadaSearch, /PROFILE_CARD_PAGE_SIZE/);
  assert.doesNotMatch(canadaSearch, /Browse the current results/);
  assert.doesNotMatch(canadaSearch, /Show more profiles/);
  assert.doesNotMatch(canadaSearch, /sourceCountry === "us"/);
  assert.doesNotMatch(canadaSearch, /ZIP code/);
});

test("Canada public profile remains Canada-specific", () => {
  assert.match(canadaProfile, /First Nations, Inuit or Métis affiliation/);
  assert.match(canadaProfile, /Police \/ official contact/);
  assert.match(canadaProfile, /approximate public area/);
  assert.match(canadaProfile, /SYNTHETIC TEST DATA/);
  assert.doesNotMatch(canadaProfile, /NamUs/);
  assert.doesNotMatch(canadaProfile, /NCIC/);
});

test("Canada homepage follows the U.S. family-first structure with Canadian language", () => {
  assert.match(canadaHome, /Built for families first/);
  assert.match(canadaHome, /Start with official reporting/);
  assert.match(canadaHome, /Families keep control/);
  assert.match(canadaHome, /Share facts, not rumors/);
  assert.match(canadaHome, /Simple, reviewed, and careful/);
  assert.match(canadaHome, /First Nations, Inuit and Métis/);
  assert.doesNotMatch(canadaHome, /border-area|cross-border|nearby U\.S\./i);
});

test("Canada privacy copy explains public and private boundaries in plain language", () => {
  assert.match(canadaPrivacy, /What can appear publicly/);
  assert.match(canadaPrivacy, /What stays private/);
  assert.match(canadaPrivacy, /Test data during development/);
  assert.match(canadaPrivacy, /Collect and keep only what is needed/);
  assert.match(canadaPrivacy, /withdrawal of consent/);
  assert.match(canadaPrivacy, /deletion or de-identification/);
  assert.doesNotMatch(canadaPrivacy, /Cross-border public information/);
});
