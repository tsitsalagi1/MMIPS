import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
const loader = fs.readFileSync("lib/public-map.ts", "utf8");
const component = fs.readFileSync("components/ProfilesSearch.tsx", "utf8");
const profilesPage = fs.readFileSync("app/profiles/page.tsx", "utf8");
const mapRedirect = fs.readFileSync("app/map/page.tsx", "utf8");
const mapDataRoute = fs.readFileSync("app/api/profiles/map/route.ts", "utf8");
const profileSearchRoute = fs.readFileSync("app/api/profiles/search/route.ts", "utf8");
const migration = fs.readFileSync("supabase/public_case_map_points_20260805.sql", "utf8");
const productionMapSources = [loader, component, profilesPage, mapDataRoute, profileSearchRoute].join("\n");

test("production map uses a dedicated allowlist and no synthetic runtime fixture", () => {
  assert.match(loader, /from\("public_case_map_points"\)/);
  assert.match(loader, /availability: "unconfigured"/);
  assert.match(loader, /availability: "error"/);
  assert.doesNotMatch(productionMapSources, /syntheticPublicMapPoints|tests\/fixtures|Synthetic Test Person|demo-case-family-approved/);
  assert.doesNotMatch(loader, /last_seen_location|requester|moderator_notes|approved_by|source_ip|photo_original_name/);
});

test("anonymous loader requests only the public projection and leaves moderation enforcement to RLS", () => {
  const selectCall = loader.match(/\.select\("([^"]+)"\)/)?.[1] ?? "";
  assert.match(selectCall, /case_id/);
  assert.match(selectCall, /public_label/);
  assert.match(selectCall, /public_latitude/);
  assert.match(selectCall, /public_longitude/);
  assert.match(selectCall, /precision/);
  assert.match(selectCall, /region_type/);
  assert.doesNotMatch(selectCall, /moderator_approved|hidden_at|approved_by|safety_reviewed_at|public_notes/);
  assert.doesNotMatch(loader, /\.eq\("moderator_approved"/);
  assert.doesNotMatch(loader, /\.is\("hidden_at"/);
  assert.doesNotMatch(loader, /row\.moderator_approved|row\.hidden_at/);
});

test("public map omits photos until public authorization can be established unambiguously", () => {
  assert.doesNotMatch(loader, /profile_photos|storage_path|thumbnailUrl|thumbnailAlt|publicStorageUrl/);
});

test("Search Profiles owns the public map without unsafe location controls", () => {
  assert.match(component, /National MMIPS public profile map/);
  assert.match(component, /Map context:/);
  assert.match(component, /Open selected public profile/);
  assert.doesNotMatch(component, /navigator\.geolocation|GeolocateControl|routeControl|localStorage|sessionStorage/);
  assert.doesNotMatch(component, /CaseCard|Previous 20|Next 20/);
});

test("Search Profiles loads all approved public points asynchronously and searches the same map", () => {
  assert.match(component, /fetch\("\/api\/profiles\/map"/);
  assert.match(component, /fetch\("\/api\/profiles\/search"/);
  assert.match(component, /setAllPoints\(points\)/);
  assert.match(component, /setVisiblePoints\(points\)/);
  assert.match(mapDataRoute, /getPublicMapPoints\(\)/);
  assert.match(mapDataRoute, /s-maxage=60/);
  assert.doesNotMatch(profilesPage, /getPublishedCases|getPublicMapPoints/);
});

test("ZIP search stays approximate and bounded", () => {
  assert.match(profileSearchRoute, /normalizeZip/);
  assert.match(profileSearchRoute, /lookupZcta\(zip\)/);
  assert.match(profileSearchRoute, /getPublicMapPointsNear/);
  assert.match(profileSearchRoute, /mapFocus/);
  assert.match(profileSearchRoute, /"Cache-Control": "private, no-store"/);
  assert.doesNotMatch(profileSearchRoute, /insert\(|update\(|upsert\(|localStorage|sessionStorage/);
  assert.match(loader, /loadNearbyPointRows/);
  assert.match(loader, /\.gte\("public_latitude"/);
  assert.match(loader, /\.lte\("public_latitude"/);
  assert.match(loader, /\.gte\("public_longitude"/);
  assert.match(loader, /\.lte\("public_longitude"/);
  assert.match(loader, /\.limit\(LOCAL_MAP_POINT_LIMIT\)/);
});

test("legacy map page permanently redirects to the unified Search Profiles page", () => {
  assert.match(mapRedirect, /permanentRedirect\("\/profiles"\)/);
});

test("migration grants exactly the public map columns and keeps moderation state private", () => {
  assert.match(migration, /STATIC REVIEW ONLY — NOT EXECUTED/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /force row level security/);
  assert.match(migration, /grant select \(case_id, public_label, public_latitude, public_longitude, precision, region_type, updated_at\) on public_case_map_points to anon, authenticated;/);
  assert.doesNotMatch(migration, /grant select \([^)]*(public_notes|approved_by|safety_reviewed_at|moderator_approved|hidden_at)/);
  for (const privateField of ["public_notes", "approved_by", "safety_reviewed_at", "moderator_approved", "hidden_at"]) {
    assert.match(migration, new RegExp(`Confirm[^\\n]*${privateField}`));
  }
});

test("RLS owns public visibility decisions and public roles receive no write policy", () => {
  for (const contract of [/review_status = 'approved'/, /published_at is not null/, /moderator_approved = true/, /hidden_at is null/]) assert.match(migration, contract);
  assert.doesNotMatch(migration, /create policy[\s\S]{0,160}for (insert|update|delete) to (anon|authenticated)/i);
  assert.match(migration, /No anon\/authenticated INSERT, UPDATE, or DELETE policies are defined/);
});
