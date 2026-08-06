import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

const loader = fs.readFileSync("lib/public-map.ts", "utf8");
const component = fs.readFileSync("components/map/PublicMapExperience.tsx", "utf8");
const page = fs.readFileSync("app/map/page.tsx", "utf8");
const migration = fs.readFileSync("supabase/public_case_map_points_20260805.sql", "utf8");

test("public map uses dedicated map table and allowlisted response, not cases coordinates", () => {
  assert.match(loader, /from\("public_case_map_points"\)/);
  assert.doesNotMatch(loader, /last_seen_location|requester|moderator_notes|approved_by|source_ip|photo_original_name/);
  assert.doesNotMatch(page, /getPublishedCases|latitude|longitude|lastSeenLocation/);
});

test("public map does not implement geolocation or browser geocoding", () => {
  assert.doesNotMatch(component, /geolocation|getCurrentPosition|watchPosition|geocode|Geocoder|locate me/i);
  assert.doesNotMatch(loader, /geocode|last_seen_area_public.*public_latitude|latitude: row\.latitude|longitude: row\.longitude/i);
});

test("map/list accessible parity and non-color-only status contract is present", () => {
  assert.match(component, /Equivalent accessible list/);
  assert.match(component, /role="status"/);
  assert.match(component, /Profile type/);
  assert.match(component, /Public status/);
  assert.match(component, /Approved area/);
  assert.match(component, /mapCategoryLabel/);
  assert.match(component, /Open public profile/);
});

test("provider fallback and attribution configuration contract is present", () => {
  assert.match(page, /NEXT_PUBLIC_MAP_STYLE_URL/);
  assert.match(page, /NEXT_PUBLIC_MAP_ATTRIBUTION/);
  assert.match(component, /Visual map background unavailable/);
  assert.match(component, /Configure NEXT_PUBLIC_MAP_STYLE_URL/);
  assert.doesNotMatch(component + page, /google|apiKey|accessToken|Mapbox/i);
});

test("migration RLS contract denies public writes and avoids broad select star", () => {
  assert.match(migration, /STATIC REVIEW ONLY/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on public_case_map_points from anon, authenticated/);
  assert.match(migration, /grant select \(case_id, public_label, public_latitude, public_longitude, precision, region_type, public_notes, updated_at\)/);
  assert.doesNotMatch(migration, /grant all|select \*/i);
  assert.match(migration, /No anon\/authenticated INSERT, UPDATE, or DELETE policies/);
});
