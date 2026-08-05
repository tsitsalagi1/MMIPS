import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

test("static accessibility baseline checks homepage source for landmark and image text patterns", () => {
  const source = fs.readFileSync("app/page.tsx", "utf8");
  assert.match(source, /<main>/);
  assert.match(source, /aria-label="MMIPS safety commitments"/);
  assert.match(source, /alt="MMIPS red handprint logo"/);
});
