import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const theme = fs.readFileSync("app/theme-overrides.css", "utf8");

test("MMIPS interaction highlights use gold rather than blue", () => {
  assert.match(theme, /::selection[\s\S]*background: var\(--gold\)/);
  assert.match(theme, /:focus-visible[\s\S]*outline: 3px solid var\(--gold\)/);
  assert.match(theme, /--blue: #d8ad5d/);
});

test("warning and status notices cannot fall back to pale blue panels", () => {
  assert.match(theme, /\.notice\.warning/);
  assert.match(theme, /background: linear-gradient\(180deg, rgba\(42, 35, 24, \.98\), rgba\(27, 24, 19, \.98\)\) !important/);
  assert.match(theme, /border-left: 6px solid var\(--gold\) !important/);
  assert.match(theme, /color: var\(--text\) !important/);
  assert.doesNotMatch(theme, /#eef2ff|#e0e7ff|#dbeafe|#eff6ff/i);
});
