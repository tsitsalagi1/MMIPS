import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migration = fs.readFileSync("supabase/urgent_geo_alerts_20260808.sql", "utf8");
const page = fs.readFileSync("app/alerts/page.tsx", "utf8");
const subscribe = fs.readFileSync("app/api/alerts/subscribe/route.ts", "utf8");
const zipGeo = fs.readFileSync("lib/zip-geo.ts", "utf8");
const urgentRoute = fs.readFileSync("app/api/admin/alerts/urgent/route.ts", "utf8");
const urgentUi = fs.readFileSync("app/admin/AdminUrgentAlerts.tsx", "utf8");
const urgentAlerts = fs.readFileSync("lib/urgent-alerts.ts", "utf8");
const profileSearch = fs.readFileSync("app/api/profiles/search/route.ts", "utf8");

test("public signup asks for email plus generalized ZIP/radius, not street/device location", () => {
  assert.match(page, /Help your community\. Get urgent MMIP alerts near you/);
  assert.match(page, /ZIP code/);
  assert.match(page, /Within 10 miles/);
  assert.match(page, /Within 250 miles/);
  assert.match(page, /does not ask for your street address or device location/);
  assert.doesNotMatch(page, /navigator\.geolocation|getCurrentPosition|watchPosition/);
});

test("server derives generalized ZCTA point from ZIP without sending subscriber email to Census", () => {
  assert.match(subscribe, /lookupZcta\(zip\)/);
  assert.match(subscribe, /homeLatitude: zcta\.latitude/);
  assert.match(subscribe, /homeLongitude: zcta\.longitude/);
  assert.doesNotMatch(zipGeo, /email_normalized|subscriber|turnstile|CF-Connecting-IP|X-Forwarded-For/);
  assert.match(zipGeo, /tigerweb\.geo\.census\.gov/);
  assert.match(zipGeo, /returnGeometry: "false"/);
});

test("subscriber geography and urgent event ledger remain private service-role data", () => {
  for (const column of ["home_zip", "home_latitude", "home_longitude", "radius_miles", "all_urgent", "geography_source"]) assert.ok(migration.includes(column), column);
  assert.match(migration, /urgent_alert_events enable row level security/);
  assert.match(migration, /urgent_alert_events force row level security/);
  assert.match(migration, /revoke all on public\.urgent_alert_events from public, anon, authenticated/);
  assert.match(migration, /grant select, insert, update, delete on public\.urgent_alert_events to service_role/);
});

test("urgent send requires published approval, urgent status, approved map point, explicit human confirmation, and synthetic lock", () => {
  assert.match(urgentRoute, /review_status !== "approved"/);
  assert.match(urgentRoute, /!loaded\.profile\.published_at/);
  assert.match(urgentRoute, /urgency_level !== "urgent_public_awareness"/);
  assert.match(urgentRoute, /moderator_approved/);
  assert.match(urgentRoute, /SEND URGENT ALERT/);
  assert.match(urgentRoute, /MMIPS TEST PERSON/);
  assert.match(urgentRoute, /status: 423/);
  assert.match(urgentUi, /A raw submission never sends a public alert automatically/);
});

test("urgent retries reuse the frozen delivery ledger and summarize persisted delivery state", () => {
  assert.match(urgentAlerts, /Freeze the initial audience in the private delivery ledger/);
  assert.match(urgentAlerts, /from\("alert_deliveries"\)/);
  assert.match(urgentAlerts, /select\("id,subscriber_id,delivery_status"\)/);
  assert.match(urgentAlerts, /delivery\.delivery_status !== "queued" && delivery\.delivery_status !== "failed_retryable"/);
  assert.match(urgentAlerts, /deliveryKey: delivery\.id/);
  assert.match(urgentAlerts, /summarizeUrgentDeliveryState\(finalStatuses, matchedCount\)/);
  assert.match(urgentAlerts, /sent_at: summary\.status === "sent" \? completedAt : null/);
});

test("ZIP-distance public search uses only approved public map points for geography", () => {
  assert.match(profileSearch, /getPublishedCases/);
  assert.match(profileSearch, /getPublicMapPoints/);
  assert.match(profileSearch, /distanceMiles/);
  assert.doesNotMatch(profileSearch, /last_known_location_private|latitude\s*:\s*item\.latitude|longitude\s*:\s*item\.longitude/);
});
