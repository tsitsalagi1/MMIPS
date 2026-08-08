import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const layout = fs.readFileSync("app/layout.tsx", "utf8");
const alertsPage = fs.readFileSync("app/alerts/page.tsx", "utf8");
const theme = fs.readFileSync("app/theme-overrides.css", "utf8");

test("Alerts and Submit Information use the requested navigation order", () => {
  const alertsIndex = layout.indexOf('<Link href="/alerts">Alerts</Link>');
  const mapIndex = layout.indexOf('<Link href="/map">Map</Link>');
  const submitIndex = layout.indexOf('<Link href="/submit">Submit Information</Link>');
  assert.ok(alertsIndex > -1 && mapIndex > -1 && submitIndex > -1);
  assert.ok(alertsIndex < mapIndex && mapIndex < submitIndex);
});

test("Alerts page is a centered readable column with visible helper text", () => {
  assert.match(alertsPage, /className="alerts-page stack page-narrow"/);
  assert.match(theme, /\.alerts-page \{/);
  assert.match(theme, /width: min\(880px, calc\(100% - 32px\)\)/);
  assert.match(theme, /margin: 0 auto/);
  assert.match(theme, /\.alerts-page \.field-help,[\s\S]*color: var\(--muted\) !important/);
  assert.match(theme, /\.alerts-page \.status-message:empty/);
});
