import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const route = fs.readFileSync("app/api/admin/profiles/[id]/route.ts", "utf8");
const panel = fs.readFileSync("app/admin/AdminOfficialSourceDrafts.tsx", "utf8");

test("real official-source publication is server-locked during synthetic rehearsal", () => {
  assert.match(route, /OFFICIAL_SOURCE_PUBLICATION_LOCKED = true/);
  assert.match(route, /official_source_publication_locked/);
  assert.match(route, /Real cases must remain unpublished/);
  const lockIndex = route.indexOf('action === "publish_official_source" && OFFICIAL_SOURCE_PUBLICATION_LOCKED');
  const publishIndex = route.indexOf('review_status: "approved"');
  assert.ok(lockIndex > -1 && publishIndex > lockIndex);
});

test("admin UI clearly identifies the synthetic-only rehearsal state", () => {
  assert.match(panel, /Real-case publication is locked during testing/);
  assert.match(panel, /MMIPS TEST PERSON — NOT A REAL PERSON/);
  assert.match(panel, /Private — publication locked/);
  assert.match(panel, /server also rejects direct publication requests/);
  assert.match(panel, /disabled=\{OFFICIAL_SOURCE_PUBLICATION_LOCKED\}/);
});
