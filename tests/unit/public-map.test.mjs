import assert from "node:assert/strict";
import test from "node:test";
import { filterPublicMapPoints, getPublicMapPoints, isPublicMapPrecision, loadPublicMapPoints, sanitizePublicMapRows } from "../../.test-dist/lib/public-map.js";
import { syntheticApprovedMapRow } from "../fixtures/public-map.mjs";

function projectionRowFromFixture() {
  const { cases, ...mapRow } = syntheticApprovedMapRow;
  return {
    ...mapRow,
    case_id: cases.id,
    slug: cases.slug,
    public_name: cases.persons.full_name,
    profile_type: cases.profile_type,
    public_status: cases.status,
    last_public_update: cases.last_public_update,
    updated_at: "2026-08-02T00:00:00Z"
  };
}

test("public precision accepts only bounded approximate values", () => {
  for (const value of ["state", "broad_region", "tribal_region", "county", "city_centroid"]) assert.equal(isPublicMapPrecision(value), true);
  for (const value of ["exact", "address", "street", "building", "shelter", "home", "gps_device"]) assert.equal(isPublicMapPrecision(value), false);
});

test("public map sanitizer accepts the granted projection and returns an explicit allowlist", () => {
  const [point] = sanitizePublicMapRows([{ ...projectionRowFromFixture(), latitude: 1, longitude: 2, exact_address: "forbidden", profile_photos: [{ storage_path: "private", use_on_profile: false }] }]);
  assert.ok(point);
  assert.deepEqual(Object.keys(point).sort(), ["caseId", "lastPublicUpdate", "precision", "profileType", "publicLatitude", "publicLongitude", "publicMapLabel", "publicName", "publicStatus", "regionType", "slug"].sort());
  for (const field of ["latitude", "longitude", "exact_address", "thumbnailUrl", "thumbnailAlt", "moderator_approved", "hidden_at"]) assert.equal(field in point, false);
});

test("sanitizer does not require private moderation fields returned to the anonymous client", () => {
  const projection = projectionRowFromFixture();
  assert.equal("moderator_approved" in projection, false);
  assert.equal("hidden_at" in projection, false);
  assert.equal(sanitizePublicMapRows([projection]).length, 1);
});

test("legacy nested sanitizer rejects unpublished, rejected, and forbidden-precision records", () => {
  const base = syntheticApprovedMapRow;
  assert.equal(sanitizePublicMapRows([{ ...base, cases: { ...base.cases, published_at: null } }]).length, 0);
  assert.equal(sanitizePublicMapRows([{ ...base, cases: { ...base.cases, review_status: "rejected" } }]).length, 0);
  assert.equal(sanitizePublicMapRows([{ ...projectionRowFromFixture(), precision: "exact" }]).length, 0);
});

test("anonymous loader reads the RLS-safe public map projection without case hydration batches", async () => {
  const calls = [];
  const terminal = Promise.resolve({ data: [projectionRowFromFixture()], error: null });
  const chain = {
    select: (columns) => { calls.push(["select", columns]); return chain; },
    order: (...args) => { calls.push(["order", ...args]); return chain; },
    range: (...args) => { calls.push(["range", ...args]); return terminal; }
  };

  const result = await loadPublicMapPoints({ from: (table) => { calls.push(["from", table]); return chain; } });
  assert.equal(result.availability, "available");
  assert.equal(result.points.length, 1);

  assert.equal(calls.find(([name]) => name === "from")?.[1], "public_map_profile_projection");
  const selected = calls.find(([name]) => name === "select")?.[1] ?? "";
  assert.match(selected, /case_id/);
  assert.match(selected, /slug/);
  assert.match(selected, /public_name/);
  assert.match(selected, /public_latitude/);
  assert.match(selected, /public_longitude/);
  assert.doesNotMatch(selected, /moderator_approved|hidden_at|approved_by|safety_reviewed_at|public_notes|profile_photos/);
  assert.deepEqual(calls.map(([name]) => name), ["from", "select", "order", "range"]);
});

test("an empty public map projection is available rather than an error", async () => {
  const calls = [];
  const terminal = Promise.resolve({ data: [], error: null });
  const chain = {
    select: (columns) => { calls.push(["select", columns]); return chain; },
    order: (...args) => { calls.push(["order", ...args]); return chain; },
    range: (...args) => { calls.push(["range", ...args]); return terminal; }
  };
  const result = await loadPublicMapPoints({ from: () => chain });
  assert.deepEqual(result, { points: [], availability: "available" });
  assert.deepEqual(calls.map(([name]) => name), ["select", "order", "range"]);
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
  const chain = { select: () => chain, order: () => chain, range: () => terminal };
  const messages = [];
  const original = console.error;
  console.error = (...args) => messages.push(args);
  try {
    assert.deepEqual(await loadPublicMapPoints({ from: () => chain }), { points: [], availability: "error" });
    assert.deepEqual(messages, [["Public map request failed", { code: "PUBLIC_MAP_QUERY_FAILED" }]]);
  } finally { console.error = original; }
});

test("filters use one collection for list parity", () => {
  const first = projectionRowFromFixture();
  const points = sanitizePublicMapRows([first, { ...first, public_label: "Synthetic second area", case_id: "synthetic-case-002", slug: "synthetic-second", public_status: "located" }]);
  assert.deepEqual(filterPublicMapPoints(points, { profileType: "missing", status: "located", region: "all" }).map((point) => point.caseId), ["synthetic-case-002"]);
});
