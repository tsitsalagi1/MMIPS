import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
const loader = fs.readFileSync("lib/public-map.ts", "utf8");
const component = fs.readFileSync("components/map/PublicMapExperience.tsx", "utf8");
const page = fs.readFileSync("app/map/page.tsx", "utf8");
const zipRoute = fs.readFileSync("app/api/map/zip/route.ts", "utf8");
const migration = fs.readFileSync("supabase/public_case_map_points_20260805.sql", "utf8");
const productionMapSources = [loader, component, page, zipRoute].join("\n");

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

test("Map V1 omits photos until public authorization can be established unambiguously", () => {
  assert.doesNotMatch(loader, /profile_photos|storage_path|thumbnailUrl|thumbnailAlt|publicStorageUrl/);
});

test("renderer entry does not simulate geography or expose unsafe location controls", () => {
  assert.match(component, /<h2 id="visual-map-heading">Public map<\/h2>/);
  assert.match(component, /Search public profiles/);
  assert.doesNotMatch(component, /markerLayer|zoomControls|left:|top:/);
  assert.doesNotMatch(component, /navigator\.geolocation|GeolocateControl|routeControl|localStorage|sessionStorage/);
});

test("map page is ZIP-first while Search Profiles remains the non-map fallback", () => {
  assert.match(component, /Enter a ZIP code/);
  assert.match(component, /fetch\("\/api\/map\/zip"/);
  assert.match(component, /method: "POST"/);
  assert.match(component, /cache: "no-store"/);
  assert.match(component, /href="\/profiles"/);
  assert.match(component, /Public map data is not configured/);
  assert.match(component, /temporarily unavailable/);
  assert.match(component, /role="status" aria-live="polite"/);
  assert.match(component, /Profile type<select/);
  assert.match(component, /Public status<select/);
  assert.match(component, /Approved area<select/);
  assert.match(component, /Open selected public profile/);
  assert.doesNotMatch(component, /Accessible public profile results|ACCESSIBLE_PAGE_SIZE|accessiblePoints|Previous 20|Next 20/);
  assert.doesNotMatch(component, /\.map\(\(point\) => <article/);
  assert.doesNotMatch(page, /getPublishedCases|getPublicMapPoints/);
  assert.match(page, /points=\{\[\]\}/);
});

test("ZIP lookup validates input, loads nearby public points, and does not persist or log searches", () => {
  assert.match(zipRoute, /normalizeZip/);
  assert.match(zipRoute, /lookupZcta\(zip\)/);
  assert.match(zipRoute, /getPublicMapPointsNear/);
  assert.match(zipRoute, /PUBLIC_MAP_ZIP_RADIUS_MILES/);
  assert.match(zipRoute, /points: nearby\.points/);
  assert.match(zipRoute, /"Cache-Control": "no-store"/);
  assert.match(zipRoute, /export async function POST/);
  assert.doesNotMatch(zipRoute, /console\.|insert\(|update\(|upsert\(|localStorage|sessionStorage|searchParams/);
});

test("nearby public map query is geographically bounded before public case hydration", () => {
  assert.match(loader, /loadNearbyPointRows/);
  assert.match(loader, /\.gte\("public_latitude"/);
  assert.match(loader, /\.lte\("public_latitude"/);
  assert.match(loader, /\.gte\("public_longitude"/);
  assert.match(loader, /\.lte\("public_longitude"/);
  assert.match(loader, /\.limit\(LOCAL_MAP_POINT_LIMIT\)/);
  assert.match(loader, /distanceMiles/);
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
