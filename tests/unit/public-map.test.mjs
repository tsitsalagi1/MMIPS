import assert from "node:assert/strict";
import test from "node:test";
import { filterPublicMapPoints, getPublicMapPoints, isPublicMapPrecision, loadPublicMapPoints, sanitizePublicMapRows } from "../../.test-dist/lib/public-map.js";
import { syntheticApprovedMapRow } from "../fixtures/public-map.mjs";

test("public precision accepts only bounded approximate values", () => {
  for (const value of ["state", "broad_region", "tribal_region", "county", "city_centroid"]) assert.equal(isPublicMapPrecision(value), true);
  for (const value of ["exact", "address", "street", "building", "shelter", "home", "gps_device"]) assert.equal(isPublicMapPrecision(value), false);
});

test("public map sanitizer returns an explicit allowlist without private or photo fields", () => {
  const [point] = sanitizePublicMapRows([{ ...syntheticApprovedMapRow, latitude: 1, longitude: 2, exact_address: "forbidden", profile_photos: [{ storage_path: "private", use_on_profile: false }] }]);
  assert.deepEqual(Object.keys(point).sort(), ["caseId", "lastPublicUpdate", "precision", "profileType", "publicLatitude", "publicLongitude", "publicMapLabel", "publicName", "publicStatus", "regionType", "slug"].sort());
  for (const field of ["latitude", "longitude", "exact_address", "thumbnailUrl", "thumbnailAlt"]) assert.equal(field in point, false);
});

test("unapproved, hidden, unpublished, rejected, and forbidden-precision records are excluded", () => {
  const base = syntheticApprovedMapRow;
  assert.equal(sanitizePublicMapRows([{ ...base, moderator_approved: false }]).length, 0);
  assert.equal(sanitizePublicMapRows([{ ...base, hidden_at: "2026-08-02" }]).length, 0);
  assert.equal(sanitizePublicMapRows([{ ...base, cases: { ...base.cases, published_at: null } }]).length, 0);
  assert.equal(sanitizePublicMapRows([{ ...base, cases: { ...base.cases, review_status: "rejected" } }]).length, 0);
  assert.equal(sanitizePublicMapRows([{ ...base, precision: "exact" }]).length, 0);
});

test("missing Supabase configuration returns no synthetic profile", async () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  try { assert.deepEqual(await getPublicMapPoints(), { points: [], availability: "unconfigured" }); }
  finally {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousKey;
  }
});

test("database failure returns no synthetic profile and only a safe internal error code", async () => {
  const terminal = Promise.resolve({ data: null, error: { code: "private-provider-detail" } });
  const chain = { select: () => chain, eq: () => chain, is: () => chain, order: () => chain, limit: () => terminal };
  const messages = [];
  const original = console.error;
  console.error = (...args) => messages.push(args);
  try {
    assert.deepEqual(await loadPublicMapPoints({ from: () => chain }), { points: [], availability: "error" });
    assert.deepEqual(messages, [["Public map request failed", { code: "PUBLIC_MAP_QUERY_FAILED" }]]);
  } finally { console.error = original; }
});

test("filters use one collection for list parity", () => {
  const points = sanitizePublicMapRows([syntheticApprovedMapRow, { ...syntheticApprovedMapRow, public_label: "Synthetic second area", cases: { ...syntheticApprovedMapRow.cases, id: "synthetic-case-002", slug: "synthetic-second", status: "located" } }]);
  assert.deepEqual(filterPublicMapPoints(points, { profileType: "missing", status: "located", region: "all" }).map((point) => point.caseId), ["synthetic-case-002"]);
});
