import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const lookupRoute = fs.readFileSync("app/api/admin/map-points/route.ts", "utf8");
const writeRoute = fs.readFileSync("app/api/admin/map-points/[caseId]/route.ts", "utf8");
const component = fs.readFileSync("app/admin/AdminMapPoints.tsx", "utf8");
const page = fs.readFileSync("app/admin/page.tsx", "utf8");

test("moderator map workflow is admin-only and uses the dedicated public relation", () => {
  assert.match(lookupRoute, /requireAdmin/);
  assert.match(writeRoute, /requireAdmin/);
  assert.match(writeRoute, /from\("public_case_map_points"\)/);
  assert.doesNotMatch(writeRoute, /last_seen_location|last_known_location_private|raw_last_known_coordinate|home_address|shelter_address/);
});

test("publication requires an already-approved public case and explicit safety review", () => {
  assert.match(writeRoute, /review_status !== "approved"/);
  assert.match(writeRoute, /!publicCase\.published_at/);
  assert.match(writeRoute, /safety_confirmed/);
  assert.match(writeRoute, /moderator_approved: true/);
  assert.match(writeRoute, /safety_reviewed_at: now/);
  assert.match(writeRoute, /approved_by: admin\.user\.id/);
});

test("coordinates are deliberately rounded and omitted from audit metadata", () => {
  assert.match(writeRoute, /toFixed\(decimals\)/);
  assert.match(writeRoute, /precision === "state" \|\| precision === "broad_region" \? 1 : 2/);
  const auditMetadata = writeRoute.match(/metadata:\s*\{([\s\S]*?)\}\s*\n\s*\}\);/)?.[1] ?? "";
  assert.doesNotMatch(auditMetadata, /public_latitude|public_longitude/);
});

test("admin UI gives explicit private-location warnings and supports hiding", () => {
  assert.match(component, /Never copy a private\/exact location here/);
  assert.match(component, /deliberately approximate public-awareness area/);
  assert.match(component, /Hide current map point/);
  assert.match(component, /moderator safety\/review notes/i);
  assert.match(page, /AdminMapPoints/);
});
