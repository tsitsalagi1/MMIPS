import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const siteMode = fs.readFileSync("lib/site-mode.ts", "utf8");
const portals = fs.readFileSync("lib/country-portals.ts", "utf8");
const gateway = fs.readFileSync("components/GlobalGateway.tsx", "utf8");
const home = fs.readFileSync("app/page.tsx", "utf8");
const layout = fs.readFileSync("app/layout.tsx", "utf8");
const proxy = fs.readFileSync("proxy.ts", "utf8");
const sitemap = fs.readFileSync("app/sitemap.ts", "utf8");
const robots = fs.readFileSync("app/robots.ts", "utf8");
const nextConfig = fs.readFileSync("next.config.ts", "utf8");
const turnstile = fs.readFileSync("lib/security/turnstile.ts", "utf8");
const architecture = fs.readFileSync("docs/GLOBAL_FEDERATION_ARCHITECTURE.md", "utf8");

test("United States remains the safe default unless global mode is explicitly enabled", () => {
  assert.match(siteMode, /MMIPS_SITE_MODE === "global" \? "global" : "us"/);
  assert.match(home, /mmipsSiteMode\(\) === "global"/);
  assert.match(home, /UnitedStatesHomePage/);
  assert.match(home, /NamUs number/);
  assert.match(home, /contact 911/);
});

test("country gateway activates only implemented country portals", () => {
  assert.match(portals, /code: "US"[\s\S]*status: "active"/);
  assert.match(portals, /code: "CA"[\s\S]*status: "preparing"/);
  assert.match(portals, /code: "AU"[\s\S]*status: "preparing"/);
  assert.match(portals, /code: "NZ"[\s\S]*status: "preparing"/);
  assert.match(gateway, /Choose your country or region/);
  assert.match(gateway, /does not hold a worldwide family or case database/);
  assert.match(gateway, /does not automatically redirect visitors based on IP address/);
});

test("global gateway is isolated from country application and API routes", () => {
  assert.match(proxy, /MMIPS_SITE_MODE !== "global"/);
  assert.match(proxy, /pathname\.startsWith\("\/api\/"\)/);
  assert.match(proxy, /Choose a country-specific MMIPS system/);
  assert.match(proxy, /status: 404/);
  assert.match(proxy, /gatewayUrl\.pathname = "\/"/);
  assert.match(sitemap, /if \(isGlobal\)[\s\S]*return \[\{ url: base/);
});

test("global and United States deployment surfaces are distinct", () => {
  assert.match(layout, /GlobalHeader/);
  assert.match(layout, /UnitedStatesHeader/);
  assert.match(layout, /GlobalFooter/);
  assert.match(layout, /UnitedStatesFooter/);
  assert.match(layout, /United States · Change country/);
  assert.match(layout, /MMIPS Global[\s\S]*does not maintain a worldwide family, subscriber, or case database/);
});

test("domain cutover is explicit and merging alone cannot silently change the canonical host", () => {
  assert.match(layout, /NEXT_PUBLIC_SITE_URL \|\| "https:\/\/mmips\.com"/);
  assert.match(sitemap, /NEXT_PUBLIC_SITE_URL \|\| "https:\/\/mmips\.com"/);
  assert.match(robots, /NEXT_PUBLIC_SITE_URL \|\| "https:\/\/mmips\.com"/);
  assert.match(layout, /const globalUrl = process\.env\.NEXT_PUBLIC_GLOBAL_SITE_URL/);
  assert.match(layout, /\{globalUrl \? <a href=\{globalUrl\}>United States · Change country<\/a> : null\}/);
});

test("global gateway gets a narrower browser security surface than the United States portal", () => {
  assert.match(nextConfig, /const isGlobal = process\.env\.MMIPS_SITE_MODE === "global"/);
  assert.match(nextConfig, /globalGatewayContentSecurityPolicy/);
  assert.match(nextConfig, /connect-src 'self'/);
  assert.match(nextConfig, /isGlobal[\s\S]*globalGatewayContentSecurityPolicy[\s\S]*unitedStatesContentSecurityPolicy/);
  assert.match(turnstile, /"us\.mmips\.com"/);
});

test("architecture prohibits shared country-private credentials and data warehouse", () => {
  assert.match(architecture, /global gateway receives no country Supabase secrets/i);
  assert.match(architecture, /One country must never receive another country's Supabase service-role key/i);
  assert.match(architecture, /Cross-border sharing must be explicit and public-only/i);
  assert.match(architecture, /current MMIPS application becomes the United States implementation/i);
});
