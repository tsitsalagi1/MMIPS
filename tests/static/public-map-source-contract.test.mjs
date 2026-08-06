import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
const loader = fs.readFileSync("lib/public-map.ts", "utf8");
const component = fs.readFileSync("components/map/PublicMapExperience.tsx", "utf8");
const page = fs.readFileSync("app/map/page.tsx", "utf8");
const migration = fs.readFileSync("supabase/public_case_map_points_20260805.sql", "utf8");
const productionMapSources = [loader, component, page].join("\n");

test("production map uses a dedicated allowlist and no synthetic runtime fixture", () => {
  assert.match(loader, /from\("public_case_map_points"\)/);
  assert.match(loader, /availability: "unconfigured"/);
  assert.match(loader, /availability: "error"/);
  assert.doesNotMatch(productionMapSources, /syntheticPublicMapPoints|tests\/fixtures|Synthetic Test Person|demo-case-family-approved/);
  assert.doesNotMatch(loader, /last_seen_location|requester|moderator_notes|approved_by|source_ip|photo_original_name/);
});

test("Map V1 omits photos until public authorization can be established unambiguously", () => {
  assert.doesNotMatch(loader, /profile_photos|storage_path|thumbnailUrl|thumbnailAlt|publicStorageUrl/);
});

test("placeholder does not simulate geography or expose inert controls", () => {
  assert.match(component, /Interactive visual map is being prepared/);
  assert.match(component, /accessible list below is the authoritative public interface/);
  assert.doesNotMatch(component, /markerLayer|zoomControls|left:|top:|Interactive MapLibre layer loads/);
  assert.doesNotMatch(component, /navigator\.geolocation|GeolocateControl|geocod/i);
});

test("configuration failures preserve a labelled accessible empty list", () => {
  assert.match(component, /Accessible public profile list/);
  assert.match(component, /Public map data is not configured/);
  assert.match(component, /temporarily unavailable/);
  assert.match(component, /role="status" aria-live="polite"/);
  assert.match(component, /Profile type<select/);
  assert.match(component, /Public status<select/);
  assert.match(component, /Approved area<select/);
  assert.match(component, /Open public profile/);
});

test("migration minimizes public columns and has no public write policy", () => {
  assert.match(migration, /STATIC REVIEW ONLY — NOT EXECUTED/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /force row level security/);
  assert.match(migration, /grant select \(case_id, public_label, public_latitude, public_longitude, precision, region_type, updated_at\)/);
  assert.doesNotMatch(migration, /grant select \([^)]*(public_notes|approved_by|safety_reviewed_at|moderator_approved|hidden_at)/);
  assert.doesNotMatch(migration, /create policy[\s\S]{0,120}for (insert|update|delete)/i);
  for (const contract of [/review_status = 'approved'/, /published_at is not null/, /moderator_approved = true/, /hidden_at is null/]) assert.match(migration, contract);
});
