import assert from "node:assert/strict";
import test from "node:test";
import { filterPublicMapPoints, getPublicMapPoints, isPublicMapPrecision, loadPublicMapPoints, sanitizePublicMapRows } from "../../.test-dist/lib/public-map.js";
import { syntheticApprovedMapRow } from "../fixtures/public-map.mjs";

test("public precision accepts only bounded approximate values", () => {
  for (const value of ["state", "broad_region", "tribal_region", "county", "city_centroid"]) assert.equal(isPublicMapPrecision(value), true);
  for (const value of ["exact", "address", "street", "building", "shelter", "home", "gps_device"]) assert.equal(isPublicMapPrecision(value), false);
});

test("public map sanitizer accepts the granted projection and returns an explicit allowlist", () => {
  const [point] = sanitizePublicMapRows([{ ...syntheticApprovedMapRow, latitude: 1, longitude: 2, exact_address: "forbidden", profile_photos: [{ storage_path: "private", use_on_profile: false }] }]);
  assert.ok(point);
  assert.deepEqual(Object.keys(point).sort(), ["caseId", "lastPublicUpdate", "precision", "profileType", "publicLatitude", "publicLongitude", "publicMapLabel", "publicName", "publicStatus", "regionType", "slug"].sort());
  for (const field of ["latitude", "longitude", "exact_address", "thumbnailUrl", "thumbnailAlt", "moderator_approved", "hidden_at"]) assert.equal(field in point, false);
});

test("sanitizer does not require private moderation fields returned to the anonymous client", () => {
  assert.equal("moderator_approved" in syntheticApprovedMapRow, false);
  assert.equal("hidden_at" in syntheticApprovedMapRow, false);
  assert.equal(sanitizePublicMapRows([syntheticApprovedMapRow]).length, 1);
});

test("unpublished, rejected, and forbidden-precision records are excluded", () => {
  const base = syntheticApprovedMapRow;
  assert.equal(sanitizePublicMapRows([{ ...base, cases: { ...base.cases, published_at: null } }]).length, 0);
  assert.equal(sanitizePublicMapRows([{ ...base, cases: { ...base.cases, review_status: "rejected" } }]).length, 0);
  assert.equal(sanitizePublicMapRows([{ ...base, precision: "exact" }]).length, 0);
});

test("anonymous loader uses the dedicated point projection then approved public cases", async () => {
  const calls = [];
  const { cases, ...basePointRow } = syntheticApprovedMapRow;
  const pointRow = { ...basePointRow, case_id: cases.id };

  const pointTerminal = Promise.resolve({ data: [pointRow], error: null });
  const pointChain = {
    select: (columns) => { calls.push(["point-select", columns]); return pointChain; },
    order: (...args) => { calls.push(["point-order", ...args]); return pointChain; },
    limit: (...args) => { calls.push(["point-limit", ...args]); return pointTerminal; }
  };

  const caseTerminal = Promise.resolve({ data: [cases], error: null });
  const caseChain = {
    select: (columns) => { calls.push(["case-select", columns]); return caseChain; },
    in: (...args) => { calls.push(["case-in", ...args]); return caseChain; },
    eq: (...args) => { calls.push(["case-eq", ...args]); return caseChain; },
    not: (...args) => { calls.push(["case-not", ...args]); return caseTerminal; }
  };

  const result = await loadPublicMapPoints({ from: (table) => table === "public_case_map_points" ? pointChain : caseChain });
  assert.equal(result.availability, "available");
  assert.equal(result.points.length, 1);

  const pointSelected = calls.find(([name]) => name === "point-select")?.[1] ?? "";
  assert.match(pointSelected, /case_id, public_label, public_latitude, public_longitude, precision, region_type, updated_at/);
  assert.doesNotMatch(pointSelected, /moderator_approved|hidden_at|approved_by|safety_reviewed_at|public_notes/);

  const caseSelected = calls.find(([name]) => name === "case-select")?.[1] ?? "";
  assert.doesNotMatch(caseSelected, /latitude|longitude|moderator_notes|requester|source_ip/);
  assert.match(caseSelected, /review_status/);
  assert.match(caseSelected, /published_at/);
  assert.deepEqual(calls.map(([name]) => name), ["point-select", "point-order", "point-limit", "case-select", "case-in", "case-eq", "case-not"]);
});

test("an empty public map relation is available rather than an error", async () => {
  const calls = [];
  const terminal = Promise.resolve({ data: [], error: null });
  const chain = {
    select: (columns) => { calls.push(["select", columns]); return chain; },
    order: (...args) => { calls.push(["order", ...args]); return chain; },
    limit: (...args) => { calls.push(["limit", ...args]); return terminal; }
  };
  const result = await loadPublicMapPoints({ from: () => chain });
  assert.deepEqual(result, { points: [], availability: "available" });
  assert.deepEqual(calls.map(([name]) => name), ["select", "order", "limit"]);
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
  const chain = { select: () => chain, order: () => chain, limit: () => terminal };
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
