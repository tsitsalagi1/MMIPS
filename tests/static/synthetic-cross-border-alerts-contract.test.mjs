import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const usMigration = fs.readFileSync("supabase/synthetic_cross_border_alert_rehearsal_20260814.sql", "utf8");
const canadaMigration = fs.readFileSync("supabase/canada/010_synthetic_cross_border_alert_rehearsal.sql", "utf8");
const matcher = fs.readFileSync("lib/urgent-alert-matching.ts", "utf8");
const contract = fs.readFileSync("lib/cross-border-alert-contract.ts", "utf8");
const route = fs.readFileSync("app/api/admin/alerts/urgent/route.ts", "utf8");
const signupRoute = fs.readFileSync("app/api/alerts/subscribe/route.ts", "utf8");
const signupPage = fs.readFileSync("app/alerts/page.tsx", "utf8");

test("both country databases mark the private rehearsal audience explicitly", () => {
  for (const migration of [usMigration, canadaMigration]) {
    assert.match(migration, /alert_subscribers add column if not exists synthetic boolean not null default false/);
    assert.match(migration, /@example\.test/);
    assert.match(migration, /synthetic_cross_border_rehearsal/);
    assert.doesNotMatch(migration, /delete from public\.alert_subscribers/i);
  }
});

test("dispatch requires target and subscriber synthetic classes to match", () => {
  assert.match(matcher, /subscriber\.synthetic !== target\.synthetic/);
  assert.match(contract, /typeof p\.synthetic === "boolean"/);
  assert.match(route, /loaded\.profile\.synthetic !== true/);
});

test("Canada route uses Canada case and public-map field names", () => {
  assert.match(route, /lead_police_service/);
  assert.match(route, /public_area_label/);
  assert.match(route, /\.eq\("hidden", false\)/);
});

test("Canada has a constrained urgency field and the U.S. rehearsal cases get an explicit marker", () => {
  assert.match(canadaMigration, /cases_urgency_level_check/);
  assert.match(usMigration, /alter table public\.cases add column if not exists synthetic/);
  assert.match(usMigration, /p\.full_name like 'MMIPS TEST PERSON%NOT A REAL PERSON%'/);
});

test("Canada public signup stays locked until Canadian postal and consent handling is ready", () => {
  assert.match(signupRoute, /mmipsSiteMode\(\) === "ca"/);
  assert.match(signupRoute, /canada_alert_signup_locked/);
  assert.match(signupPage, /Canadian postal-area lookup, bilingual consent language, and privacy review/);
  assert.match(signupPage, /will not ask Canadian visitors to enter a U\.S\. ZIP code/);
});
