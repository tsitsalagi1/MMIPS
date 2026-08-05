import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

const casesSource = fs.readFileSync("lib/cases.ts", "utf8");

test("demo public profile fixture is explicitly synthetic/demo-only", () => {
  assert.match(casesSource, /demo-001/);
  assert.match(casesSource, /Demo Profile/);
  assert.match(casesSource, /Public demo/);
  assert.match(casesSource, /Do not use as a real profile/);
});

test("public profile query contract only selects approved published records", () => {
  assert.match(casesSource, /\.eq\("review_status", "approved"\)/);
  assert.match(casesSource, /\.not\("published_at", "is", null\)/);
});

test("public profile photo contract excludes photos disabled for profile display", () => {
  assert.match(casesSource, /\.filter\(\(photo: any\) => photo\.use_on_profile !== false\)/);
});
