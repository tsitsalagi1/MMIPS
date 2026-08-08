import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const layout = fs.readFileSync("app/layout.tsx", "utf8");
const alertsPage = fs.readFileSync("app/alerts/page.tsx", "utf8");
const theme = fs.readFileSync("app/theme-overrides.css", "utf8");
const readability = fs.readFileSync("app/readability-overrides.css", "utf8");

test("public navigation prioritizes How It Works, Profiles, Alerts, Map, Family Resources, then Submit", () => {
  const navStart = layout.indexOf('<div className="nav-links">');
  const navEnd = layout.indexOf('</div>', navStart);
  const nav = layout.slice(navStart, navEnd);
  const ordered = [
    '<Link href="/how-it-works">How it works</Link>',
    '<Link href="/profiles">Search Profiles</Link>',
    '<Link href="/alerts">Alerts</Link>',
    '<Link href="/map">Map</Link>',
    '<Link href="/resources">Family Resources</Link>',
    '<Link href="/submit">Submit Information</Link>'
  ];
  let previous = -1;
  for (const item of ordered) {
    const index = nav.indexOf(item);
    assert.ok(index > previous, `${item} should appear in requested order`);
    previous = index;
  }
  assert.equal(nav.includes('<Link href="/corrections">'), false);
});

test("Alerts page is a centered readable column with visible helper text", () => {
  assert.match(alertsPage, /className="alerts-page stack page-narrow"/);
  assert.match(theme, /\.alerts-page \{/);
  assert.match(theme, /width: min\(880px, calc\(100% - 32px\)\)/);
  assert.match(theme, /margin: 0 auto/);
  assert.match(theme, /\.alerts-page \.field-help,[\s\S]*color: var\(--muted\) !important/);
  assert.match(readability, /\.field-help/);
  assert.match(readability, /input::placeholder/);
  assert.match(theme, /\.alerts-page \.status-message:empty/);
});
