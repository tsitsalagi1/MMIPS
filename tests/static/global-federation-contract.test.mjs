import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const siteMode = fs.readFileSync("lib/site-mode.ts", "utf8");
const portals = fs.readFileSync("lib/country-portals.ts", "utf8");
const canadaConfig = fs.readFileSync("lib/canada-config.ts", "utf8");
const gateway = fs.readFileSync("components/GlobalGateway.tsx", "utf8");
const canadaHome = fs.readFileSync("components/CanadaHome.tsx", "utf8");
const home = fs.readFileSync("app/page.tsx", "utf8");
const layout = fs.readFileSync("app/layout.tsx", "utf8");
const proxy = fs.readFileSync("proxy.ts", "utf8");
const sitemap = fs.readFileSync("app/sitemap.ts", "utf8");
const robots = fs.readFileSync("app/robots.ts", "utf8");
const nextConfig = fs.readFileSync("next.config.ts", "utf8");
const turnstile = fs.readFileSync("lib/security/turnstile.ts", "utf8");
const architecture = fs.readFileSync("docs/GLOBAL_FEDERATION_ARCHITECTURE.md", "utf8");
const canadaArchitecture = fs.readFileSync("docs/CANADA_FOUNDATION.md", "utf8");
const canadaSchema = fs.readFileSync("supabase/canada/schema.sql", "utf8");

test("United States remains the safe default while Global and Canada require explicit site modes", () => {
  assert.match(siteMode, /MMIPS_SITE_MODE === "global"/);
  assert.match(siteMode, /MMIPS_SITE_MODE === "ca"/);
  assert.match(siteMode, /return "us"/);
  assert.match(home, /mode === "global"/);
  assert.match(home, /mode === "ca"/);
  assert.match(home, /UnitedStatesHomePage/);
  assert.match(home, /NamUs number/);
  assert.match(home, /contact 911/);
});

test("country gateway activates Canada only through an explicit release flag plus URL", () => {
  assert.match(portals, /code: "US"[\s\S]*status: "active"/);
  assert.match(siteMode, /MMIPS_CA_PORTAL_ACTIVE === "true"/);
  assert.match(siteMode, /NEXT_PUBLIC_CA_SITE_URL/);
  assert.match(portals, /code: "CA"[\s\S]*status: canadaActive \? "active" : "preparing"/);
  assert.match(portals, /code: "AU"[\s\S]*status: "preparing"/);
  assert.match(portals, /code: "NZ"[\s\S]*status: "preparing"/);
  assert.match(gateway, /Choose your country or region/);
  assert.match(gateway, /does not hold a worldwide family or case database/);
  assert.match(gateway, /does not automatically redirect visitors based on IP address/);
});

test("global gateway remains isolated from every country application and API route", () => {
  assert.match(proxy, /MMIPS_SITE_MODE !== "global"/);
  assert.match(proxy, /Choose a country-specific MMIPS system/);
  assert.match(proxy, /status: 404/);
  assert.match(proxy, /gatewayUrl\.pathname = "\/"/);
});

test("Canada prelaunch fails closed instead of falling through to United States routes", () => {
  assert.match(proxy, /MMIPS_SITE_MODE !== "ca"/);
  assert.match(proxy, /MMIPS Canada is preparing and does not accept or expose case data yet/);
  assert.match(proxy, /canadaHome\.pathname = "\/"/);
  assert.match(canadaHome, /does not accept case submissions, expose U\.S\. profiles, or connect to the U\.S\. MMIPS database/);
  assert.doesNotMatch(canadaHome, /NamUs/);
  assert.doesNotMatch(canadaHome, /NCIC/);
  assert.doesNotMatch(canadaHome, /ZIP code/);
  assert.match(canadaHome, /Canadian postal codes/);
  assert.match(canadaHome, /kilometres/);
});

test("Canada configuration uses Canadian provinces, territories and postal-code structure", () => {
  for (const code of ["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"]) {
    assert.match(canadaConfig, new RegExp(`code: "${code}"`));
  }
  assert.match(canadaConfig, /CANADA_POSTAL_CODE_REGEX/);
  assert.match(canadaConfig, /ANA NAN/);
  assert.match(canadaConfig, /First Nations/);
  assert.match(canadaConfig, /Inuit/);
  assert.match(canadaConfig, /Métis/);
  assert.match(canadaConfig, /There is no 24-hour waiting period/);
});

test("Global, Canada and United States deployment surfaces are distinct", () => {
  assert.match(layout, /GlobalHeader/);
  assert.match(layout, /CanadaHeader/);
  assert.match(layout, /UnitedStatesHeader/);
  assert.match(layout, /GlobalFooter/);
  assert.match(layout, /CanadaFooter/);
  assert.match(layout, /UnitedStatesFooter/);
  assert.match(layout, /United States · Change country/);
  assert.match(layout, /Canada · Preparing/);
  assert.match(layout, /MMIPS Global[\s\S]*does not maintain a worldwide family, subscriber, or case database/);
});

test("country-shell sitemap and robots expose only the root before Canada release", () => {
  assert.match(sitemap, /mode === "global" \|\| mode === "ca"/);
  assert.match(robots, /mode === "global" \|\| mode === "ca"/);
  assert.match(sitemap, /https:\/\/ca\.mmips\.com/);
  assert.match(robots, /https:\/\/ca\.mmips\.com/);
});

test("Global and Canada prelaunch builds get a narrower browser security surface than United States", () => {
  assert.match(nextConfig, /siteMode === "global" \|\| siteMode === "ca"/);
  assert.match(nextConfig, /databaseLessCountryShellContentSecurityPolicy/);
  assert.match(nextConfig, /connect-src 'self'/);
  assert.match(nextConfig, /isDatabaseLessCountryShell[\s\S]*databaseLessCountryShellContentSecurityPolicy[\s\S]*unitedStatesContentSecurityPolicy/);
  assert.match(turnstile, /"us\.mmips\.com"/);
});

test("Canada schema is explicitly separate, Canada-specific and least-privilege", () => {
  assert.match(canadaSchema, /NEW, SEPARATE Canadian Supabase project only/);
  assert.match(canadaSchema, /last_seen_province_territory/);
  assert.match(canadaSchema, /postal_code/);
  assert.match(canadaSchema, /radius_km/);
  assert.match(canadaSchema, /first_nation/);
  assert.match(canadaSchema, /inuit/);
  assert.match(canadaSchema, /metis/);
  assert.match(canadaSchema, /revoke all[\s\S]*from anon, authenticated/);
  assert.match(canadaSchema, /permission_confirmed = true[\s\S]*use_on_profile = true/);
  assert.match(canadaSchema, /security_invoker = true/);
  assert.doesNotMatch(canadaSchema, /namus/i);
  assert.doesNotMatch(canadaSchema, /ncic/i);
  assert.doesNotMatch(canadaSchema, /last_seen_state/i);
  assert.doesNotMatch(canadaSchema, /last_seen_county/i);
});

test("architecture prohibits shared country-private credentials and data warehouse", () => {
  assert.match(architecture, /global gateway receives no country Supabase secrets/i);
  assert.match(architecture, /One country must never receive another country's Supabase service-role key/i);
  assert.match(architecture, /Cross-border sharing must be explicit and public-only/i);
  assert.match(architecture, /current MMIPS application becomes the United States implementation/i);
  assert.match(canadaArchitecture, /Separate Supabase project\/database\/Auth\/Storage/);
  assert.match(canadaArchitecture, /Do not copy United States family, case, alert-subscriber, moderator, or administrator data/);
});
