import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const route = fs.readFileSync("app/api/alerts/subscribe/route.ts", "utf8");
const page = fs.readFileSync("app/alerts/page.tsx", "utf8");
const store = fs.readFileSync("lib/alerts.ts", "utf8");
const geo = fs.readFileSync("lib/canada-postal-geo.ts", "utf8");
const consent = fs.readFileSync("lib/canada-alert-consent.ts", "utf8");
const data = JSON.parse(fs.readFileSync("data/canada-fsa-centroids.json", "utf8"));
const migration = fs.readFileSync("supabase/canada/011_public_alert_subscriptions.sql", "utf8");

test("Canada signup is public but requires explicit meaningful consent", () => {
  assert.match(route, /mmipsSiteMode\(\) === "ca"/);
  assert.match(route, /body\.consentConfirmed !== true/);
  assert.match(route, /CANADA_ALERT_CONSENT_EN/);
  assert.match(route, /CANADA_ALERT_CONSENT_FR/);
  assert.match(page, /Express consent/);
  assert.match(page, /Consentement exprès/);
  assert.match(page, /CANADA_ALERT_CONSENT_FR/);
  assert.match(page, /CANADA_ALERT_CONSENT_EN/);
  assert.match(consent, /require email confirmation/);
  assert.match(consent, /lien de désabonnement/);
});

test("Canada signup validates locally and retains only a broad FSA", () => {
  assert.match(route, /lookupCanadianPostalArea/);
  assert.match(geo, /Statistics Canada 2021 Census Forward Sortation Area/);
  assert.equal(data.areas.length, 1643);
  assert.match(store, /postal_code: null/);
  assert.doesNotMatch(route, /homePostalCode:/);
  const canadaBranch = route.slice(route.indexOf('mmipsSiteMode() === "ca"'), route.indexOf("const zip = normalizeZip"));
  assert.doesNotMatch(canadaBranch, /lookupZcta/);
});

test("Canada alert confirmation is service-role-only and subscriber storage stays private", () => {
  assert.match(migration, /create or replace function public\.confirm_alert_subscription/);
  assert.match(migration, /confirmation_expires_at > confirmed_time/);
  assert.match(migration, /force row level security/);
  assert.match(migration, /revoke all on table public\.alert_subscribers from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.confirm_alert_subscription\(text, timestamptz\)[\s\S]*to service_role/);
  assert.match(migration, /alert_subscribers_confirmation_token_hash_key/);
  assert.match(migration, /alert_subscribers_unsubscribe_token_id_key/);
});
