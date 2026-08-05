import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

const publicPages = ["app/page.tsx", "app/submit/page.tsx", "app/resources/page.tsx", "app/safety-policy/page.tsx"];

test("public smoke foundation confirms core public route source files exist", () => {
  for (const file of publicPages) assert.equal(fs.existsSync(file), true, `${file} should exist`);
  const home = fs.readFileSync("app/page.tsx", "utf8");
  assert.match(home, /Nothing submitted to MMIPS is published automatically/);
});

test("public smoke foundation confirms admin is not linked as public homepage navigation", () => {
  const home = fs.readFileSync("app/page.tsx", "utf8");
  assert.doesNotMatch(home, /href=["']\/admin["']/);
});
