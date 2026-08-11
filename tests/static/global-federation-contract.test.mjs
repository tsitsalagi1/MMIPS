import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const siteMode = fs.readFileSync("lib/site-mode.ts", "utf8");
const portals = fs.readFileSync("lib/country-portals.ts", "utf8");
const canadaConfig = fs.readFileSync("lib/canada-config.ts", "utf8");
const canadaPublic = fs.readFileSync("lib/canada-public.ts", "utf8");
const crossBorderMap = fs.readFileSync("lib/cross-border-public-map.ts", "utf8");
const gateway = fs.readFileSync("components/GlobalGateway.tsx", "utf8");
const canadaHome = fs.readFileSync("components/CanadaHome.tsx", "utf8");
const canadaSearch = fs.readFileSync("components/CanadaProfilesSearch.tsx", "utf8");
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
const canadaHardening = fs.readFileSync("supabase/canada/001_prelaunch_hardening.sql", "utf8");
const canadaPublicProjection = fs.readFileSync("supabase/canada/002_public_site_projection.sql", "utf8");

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
  assert.match(gateway, /Find the MMIPS site for your country/);
});

test("global gateway remains isolated from every country application and API route", () => {
  assert.match(proxy, /MMIPS_SITE_MODE !== "global"/);
  assert.match(proxy, /Choose a country-specific MMIPS system/);
  assert.match(proxy, /status: 404/);
  assert.match(proxy, /gatewayUrl\.pathname = "\/"/);
});

test("Canada exposes only deliberately converted public routes and APIs", () => {
  assert.match(proxy, /MMIPS_SITE_MODE !== "ca"/);
  assert.match(proxy, /canadaPublicRouteAllowed/);
  assert.match(proxy, /pathname === "\/profiles"/);
  assert.match(proxy, /pathname === "\/resources"/);
  assert.match(proxy, /pathname === "\/how-it-works"/);
  assert.match(proxy, /pathname === "\/submit"/);
  assert.match(proxy, /pathname === "\/privacy"/);
  assert.match(proxy, /pathname === "\/api\/profiles\/map"/);
  assert.match(proxy, /pathname === "\/api\/profiles\/search"/);
  assert.match(proxy, /This API is not enabled for MMIPS Canada/);
  assert.match(proxy, /canadaHome\.pathname = "\/"/);
});

test("Canada public experience remains Canada-specific while allowing public-only border awareness", () => {
  assert.match(canadaHome, /First Nations/);
  assert.match(canadaHome, /Inuit/);
  assert.match(canadaHome, /Métis/);
  assert.match(canadaHome, /Public awareness should not stop at the border/);
  assert.match(canadaSearch, /Canadian postal code/);
  assert.match(canadaSearch, /Province or territory/);
  assert.match(canadaSearch, /Within 100 km/);
  assert.match(crossBorderMap, /https:\/\/us\.mmips\.com\/api\/profiles\/map/);
  assert.match(crossBorderMap, /sourceCountry: "us"/);
  assert.doesNotMatch(canadaSearch, /NamUs/);
  assert.doesNotMatch(canadaSearch, /NCIC/);
  assert.doesNotMatch(canadaSearch, /ZIP code/);
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

test("Canada public data adapter uses only Canada projections and kilometres", () => {
  assert.match(canadaPublic, /public_case_map_projection/);
  assert.match(canadaPublic, /public_canada_profile_projection/);
  assert.match(canadaPublic, /normalizeCanadianPostalCode/);
  assert.match(canadaPublic, /country", "ca"/);
  assert.match(canadaPublic, /postal_code/);
  assert.match(canadaPublic, /radiusKm/);
  assert.doesNotMatch(canadaPublic, /lookupZcta/);
  assert.doesNotMatch(canadaPublic, /radiusMiles/);
});

test("Global, Canada and United States deployment surfaces are distinct", () => {
  assert.match(layout, /GlobalHeader/);
  assert.match(layout, /CanadaHeader/);
  assert.match(layout, /UnitedStatesHeader/);
  assert.match(layout, /GlobalFooter/);
  assert.match(layout, /CanadaFooter/);
  assert.match(layout, /UnitedStatesFooter/);
  assert.match(layout, /United States · Change country/);
  assert.match(layout, /Canada · Change country/);
  assert.match(layout, /MMIPS Global[\s\S]*Case information stays with each country site/);
});

test("Canada sitemap and robots expose only converted Canada public pages", () => {
  assert.match(sitemap, /mode === "ca"/);
  assert.match(sitemap, /canadaPaths/);
  assert.match(sitemap, /"\/profiles"/);
  assert.match(sitemap, /"\/resources"/);
  assert.match(robots, /mode === "ca"/);
  assert.match(robots, /"\/profiles"/);
  assert.match(robots, /"\/resources"/);
  assert.match(robots, /"\/api\/"/);
  assert.match(sitemap, /https:\/\/ca\.mmips\.com/);
  assert.match(robots, /https:\/\/ca\.mmips\.com/);
});

test("Canada country build can use its own Supabase origin and the shared MapTiler renderer", () => {
  assert.match(nextConfig, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(nextConfig, /siteMode === "ca"/);
  assert.match(nextConfig, /https:\/\/api\.maptiler\.com/);
  assert.match(nextConfig, /countrySiteContentSecurityPolicy/);
  assert.match(nextConfig, /globalGatewayContentSecurityPolicy/);
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

test("Canada prelaunch hardening adds explicit release, privacy and lifecycle controls", () => {
  assert.match(canadaHardening, /public_profile_enabled boolean not null default false/);
  assert.match(canadaHardening, /public_map_enabled boolean not null default false/);
  assert.match(canadaHardening, /privacy_request_type/);
  assert.match(canadaHardening, /delete_or_deidentify/);
  assert.match(canadaHardening, /source_ip_delete_after[\s\S]*30 days/);
  assert.match(canadaHardening, /privacy_requests force row level security/);
  assert.match(canadaHardening, /revoke all on privacy_requests from anon, authenticated/);
  assert.match(canadaHardening, /public_profile_enabled = true[\s\S]*suppressed_at is null/);
  assert.match(canadaHardening, /public_map_enabled = true/);
  assert.match(canadaHardening, /security_invoker = true/);
});

test("Canada public projections remain RLS-invoking and release-gated", () => {
  assert.match(canadaPublicProjection, /security_invoker = true/);
  assert.match(canadaPublicProjection, /public_profile_enabled = true/);
  assert.match(canadaPublicProjection, /public_map_enabled = true/);
  assert.match(canadaPublicProjection, /suppressed_at is null/);
  assert.match(canadaPublicProjection, /person_indigenous_affiliations/);
  assert.match(canadaPublicProjection, /official_case_references/);
  assert.match(canadaPublicProjection, /profile_photos/);
  assert.doesNotMatch(canadaPublicProjection, /exact_latitude/);
  assert.doesNotMatch(canadaPublicProjection, /exact_longitude/);
});

test("architecture prohibits shared country-private credentials and data warehouse", () => {
  assert.match(architecture, /global gateway receives no country Supabase secrets/i);
  assert.match(architecture, /One country must never receive another country's Supabase service-role key/i);
  assert.match(architecture, /Cross-border sharing must be explicit and public-only/i);
  assert.match(architecture, /current MMIPS application becomes the United States implementation/i);
  assert.match(canadaArchitecture, /Separate Supabase project\/database\/Auth\/Storage/);
  assert.match(canadaArchitecture, /Do not copy United States family, case, alert-subscriber, moderator, or administrator data/);
});
