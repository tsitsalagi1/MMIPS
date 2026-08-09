import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
const loader = fs.readFileSync("lib/public-map.ts", "utf8");
const component = fs.readFileSync("components/ProfilesSearch.tsx", "utf8");
const renderer = fs.readFileSync("components/map/MapLibreRenderer.tsx", "utf8");
const profilesPage = fs.readFileSync("app/profiles/page.tsx", "utf8");
const mapRedirect = fs.readFileSync("app/map/page.tsx", "utf8");
const mapDataRoute = fs.readFileSync("app/api/profiles/map/route.ts", "utf8");
const profileSearchRoute = fs.readFileSync("app/api/profiles/search/route.ts", "utf8");
const foundationMigration = fs.readFileSync("supabase/public_case_map_points_20260805.sql", "utf8");
const hardeningMigration = fs.readFileSync("supabase/post_stress_public_map_and_photo_hardening_20260809.sql", "utf8");
const productionMapSources = [loader, component, profilesPage, mapDataRoute, profileSearchRoute].join("\n");

test("production map uses one RLS-safe public projection and no synthetic runtime fixture", () => {
  assert.match(loader, /MAP_PROJECTION = "public_map_profile_projection"/);
  assert.match(loader, /from\(MAP_PROJECTION\)/);
  assert.match(loader, /availability: "unconfigured"/);
  assert.match(loader, /availability: "error"/);
  assert.doesNotMatch(productionMapSources, /syntheticPublicMapPoints|tests\/fixtures|Synthetic Test Person|demo-case-family-approved/);
  assert.doesNotMatch(loader, /requester|moderator_notes|approved_by|source_ip|photo_original_name/);
});

test("projection exposes only public-safe map and search fields and obeys underlying RLS", () => {
  assert.match(hardeningMigration, /security_invoker = true/);
  assert.match(hardeningMigration, /public\.public_map_profile_projection/);
  assert.match(hardeningMigration, /grant select on public\.public_map_profile_projection to anon, authenticated, service_role/);
  assert.doesNotMatch(hardeningMigration, /select[\s\S]{0,500}(moderator_notes|requester|approved_by|source_ip|public_notes)/i);
  assert.match(loader, /MAP_POINT_SELECT = "case_id, slug, public_name, profile_type, public_status, public_label, public_latitude, public_longitude, precision, region_type, last_public_update, updated_at"/);
});

test("national and nearby loaders page until exhaustion instead of silently truncating public data", () => {
  assert.match(loader, /for \(let from = 0; ; from \+= MAP_POINT_PAGE_SIZE\)/);
  assert.match(loader, /if \(page\.length < MAP_POINT_PAGE_SIZE\) break/);
  assert.doesNotMatch(loader, /MAP_POINT_SAFETY_LIMIT|LOCAL_MAP_POINT_LIMIT|\.limit\(LOCAL_MAP_POINT_LIMIT\)/);
});

test("public projection selects omit photos and private coordinate fields while precision denylist remains explicit", () => {
  assert.doesNotMatch(loader, /profile_photos|storage_path|thumbnailUrl|thumbnailAlt|publicStorageUrl/);
  const mapSelect = loader.match(/const MAP_POINT_SELECT = "([^"]+)"/)?.[1] || "";
  const searchSelect = loader.match(/const SEARCH_PROJECTION_SELECT = "([^"]+)"/)?.[1] || "";
  const selectedFields = `${mapSelect},${searchSelect}`.split(",").map((field) => field.trim()).filter(Boolean);
  for (const forbidden of ["exact_address", "raw_last_known_coordinate", "last_known_location_private", "latitude", "longitude"]) {
    assert.equal(selectedFields.includes(forbidden), false, forbidden);
  }
  assert.equal(selectedFields.includes("public_latitude"), true);
  assert.equal(selectedFields.includes("public_longitude"), true);
  assert.match(loader, /FORBIDDEN_PRECISIONS[\s\S]*raw_last_known_coordinate/);
});

test("Search Profiles owns the public map and provides a complete text alternative", () => {
  assert.match(component, /National MMIPS public profile map/);
  assert.match(component, /Map context:/);
  assert.match(component, /Open selected public profile/);
  assert.match(component, /View all .* current results as text/);
  assert.match(component, /Current map results as text/);
  assert.match(component, /TEXT_RESULTS_PAGE_SIZE = 50/);
  assert.match(component, /Previous results/);
  assert.match(component, /Next results/);
  assert.match(component, /onFailure=\{\(\) => setTextViewOpen\(true\)\}/);
  assert.match(renderer, /same current results are available in the text view on this page/);
  assert.doesNotMatch(component, /navigator\.geolocation|GeolocateControl|routeControl|localStorage|sessionStorage/);
});

test("Search Profiles loads every approved public point asynchronously and searches the same map", () => {
  assert.match(component, /fetch\("\/api\/profiles\/map"/);
  assert.match(component, /fetch\("\/api\/profiles\/search"/);
  assert.match(component, /setAllPoints\(points\)/);
  assert.match(component, /setVisiblePoints\(points\)/);
  assert.match(mapDataRoute, /getPublicMapPoints\(\)/);
  assert.match(mapDataRoute, /s-maxage=60/);
  assert.doesNotMatch(profilesPage, /getPublishedCases|getPublicMapPoints/);
});

test("profile search returns minimal IDs rather than full profile objects", () => {
  assert.match(profileSearchRoute, /searchPublicProfileIds/);
  assert.match(profileSearchRoute, /profiles: matchingIds\.map\(\(id\) => \(\{ id \}\)\)/);
  assert.doesNotMatch(profileSearchRoute, /getPublishedCases/);
  assert.doesNotMatch(profileSearchRoute, /case_verifications|profile_photos|public_summary|photo_storage_path/);
});

test("ZIP search stays approximate and untruncated", () => {
  assert.match(profileSearchRoute, /normalizeZip/);
  assert.match(profileSearchRoute, /lookupZcta\(zip\)/);
  assert.match(profileSearchRoute, /getPublicMapPointsNear/);
  assert.match(profileSearchRoute, /mapFocus/);
  assert.match(profileSearchRoute, /"Cache-Control": "private, no-store"/);
  assert.doesNotMatch(profileSearchRoute, /insert\(|update\(|upsert\(|localStorage|sessionStorage/);
  assert.match(loader, /loadNearbyProjectionRows/);
  assert.match(loader, /\.gte\("public_latitude"/);
  assert.match(loader, /\.lte\("public_latitude"/);
  assert.match(loader, /\.gte\("public_longitude"/);
  assert.match(loader, /\.lte\("public_longitude"/);
  assert.match(loader, /\.range\(from, from \+ MAP_POINT_PAGE_SIZE - 1\)/);
});

test("synthetic national data stays visible but is explicitly counted and labeled", () => {
  assert.match(component, /syntheticCount\.toLocaleString\(\)/);
  assert.match(component, /remain visible for full-scale testing/);
  assert.match(component, /must not be interpreted as real case prevalence/);
  assert.match(component, /SYNTHETIC TEST DATA/);
});

test("legacy map page permanently redirects to the unified Search Profiles page", () => {
  assert.match(mapRedirect, /permanentRedirect\("\/profiles"\)/);
});

test("original map migration grants only approved public coordinate columns", () => {
  assert.match(foundationMigration, /STATIC REVIEW ONLY — NOT EXECUTED/);
  assert.match(foundationMigration, /enable row level security/);
  assert.match(foundationMigration, /force row level security/);
  assert.match(foundationMigration, /grant select \(case_id, public_label, public_latitude, public_longitude, precision, region_type, updated_at\) on public_case_map_points to anon, authenticated;/);
  assert.doesNotMatch(foundationMigration, /grant select \([^)]*(public_notes|approved_by|safety_reviewed_at|moderator_approved|hidden_at)/);
});

test("RLS owns public visibility decisions and public roles receive no map write policy", () => {
  for (const contract of [/review_status = 'approved'/, /published_at is not null/, /moderator_approved = true/, /hidden_at is null/]) assert.match(foundationMigration, contract);
  assert.doesNotMatch(foundationMigration, /create policy[\s\S]{0,160}for (insert|update|delete) to (anon|authenticated)/i);
  assert.match(foundationMigration, /No anon\/authenticated INSERT, UPDATE, or DELETE policies are defined/);
});

test("public profile photos require explicit permission confirmation in RLS", () => {
  assert.match(hardeningMigration, /permission_confirmed = true/);
  assert.match(hardeningMigration, /use_on_profile = true/);
  assert.match(hardeningMigration, /to anon, authenticated/);
});
