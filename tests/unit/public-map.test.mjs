import assert from "node:assert/strict";
import test from "node:test";
import { filterPublicMapPoints, isPublicMapPrecision, sanitizePublicMapRows, syntheticPublicMapPoints } from "../../.test-dist/lib/public-map.js";

test("public map precision allowlist rejects exact private precision", () => {
  for (const value of ["state", "broad_region", "tribal_region", "county", "city_centroid"]) assert.equal(isPublicMapPrecision(value), true);
  for (const value of ["exact", "address", "street", "building", "shelter", "home", "gps_device", "raw_last_known_coordinate"]) assert.equal(isPublicMapPrecision(value), false);
});

test("public map row sanitizer exposes only approved published visible approximate points", () => {
  const rows = [{ public_label: "Synthetic area", public_latitude: "35.10", public_longitude: "-95.10", precision: "county", region_type: "synthetic", moderator_approved: true, hidden_at: null, cases: { id: "case-1", slug: "synthetic", status: "missing", profile_type: "missing", review_status: "approved", published_at: "2026-08-01", last_public_update: "2026-08-02", persons: { full_name: "Synthetic Demo" }, profile_photos: [] }, latitude: 1, longitude: 2, exact_address: "forbidden" }];
  const [point] = sanitizePublicMapRows(rows);
  assert.deepEqual(Object.keys(point).sort(), ["caseId", "lastPublicUpdate", "precision", "profileType", "publicLatitude", "publicLongitude", "publicMapLabel", "publicName", "publicStatus", "regionType", "slug", "thumbnailAlt", "thumbnailUrl"].sort());
  assert.equal(point.publicLatitude, 35.10);
  assert.equal(point.publicLongitude, -95.10);
  assert.equal("latitude" in point, false);
  assert.equal("longitude" in point, false);
  assert.equal("exact_address" in point, false);
});

test("public map sanitizer excludes unsafe rows", () => {
  const base = { public_label: "Synthetic area", public_latitude: 35, public_longitude: -95, precision: "county", region_type: "synthetic", moderator_approved: true, hidden_at: null, cases: { id: "case-1", slug: "synthetic", status: "missing", profile_type: "missing", review_status: "approved", published_at: "2026-08-01", persons: { full_name: "Synthetic Demo" }, profile_photos: [] } };
  assert.equal(sanitizePublicMapRows([{ ...base, moderator_approved: false }]).length, 0);
  assert.equal(sanitizePublicMapRows([{ ...base, hidden_at: "2026-08-02" }]).length, 0);
  assert.equal(sanitizePublicMapRows([{ ...base, precision: "exact" }]).length, 0);
  assert.equal(sanitizePublicMapRows([{ ...base, cases: { ...base.cases, published_at: null } }]).length, 0);
  assert.equal(sanitizePublicMapRows([{ ...base, cases: { ...base.cases, review_status: "rejected" } }]).length, 0);
});

test("filter parity uses one filtered collection for map and list", () => {
  const result = filterPublicMapPoints(syntheticPublicMapPoints, { profileType: "missing", status: "missing", region: syntheticPublicMapPoints[0].publicMapLabel });
  assert.equal(result.length, 1);
  assert.equal(filterPublicMapPoints(syntheticPublicMapPoints, { profileType: "unidentified", status: "all", region: "all" }).length, 0);
});
