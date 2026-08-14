import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migration = fs.readFileSync("supabase/canada/009_moderation_release_guards.sql", "utf8");
const actionRoute = fs.readFileSync("app/api/admin/canada/submissions/[id]/route.ts", "utf8");
const dashboard = fs.readFileSync("app/admin/CanadaAdminDashboard.tsx", "utf8");

test("Canada profile approval fails closed without recorded consent and publication request", () => {
  assert.match(migration, /s\.consent_at is null/);
  assert.match(migration, /btrim\(s\.consent_text\)/);
  assert.match(migration, /btrim\(s\.consent_version\)/);
  assert.match(migration, /s\.publication_requested is not true/);
  assert.match(migration, /official tip or reporting contact is required/i);
});

test("profile and map approval are separate server-enforced decisions", () => {
  assert.match(migration, /Public map approval is a separate moderated action/);
  assert.match(migration, /public_map_enabled\s*\n?\s*\) values[\s\S]*true, false/);
  assert.match(migration, /create or replace function public\.approve_canada_submission_map/);
  assert.match(migration, /s\.map_requested is not true/);
  assert.match(migration, /round\(target_public_latitude, 2\)/);
  assert.match(actionRoute, /action === "approve_map"/);
  assert.match(actionRoute, /safetyConfirmed !== true/);
  assert.match(dashboard, /Approve profile only/);
  assert.match(dashboard, /Approve map separately/);
});

test("moderation decisions require reasons and hiding removes every public projection", () => {
  assert.match(migration, /length\(clean_reason\) < 12/);
  assert.match(actionRoute, /reason\.length < 12/);
  assert.match(migration, /published_at = null/);
  assert.match(migration, /public_profile_enabled = false/);
  assert.match(migration, /public_map_enabled = false/);
  assert.match(migration, /moderator_approved = false/);
  assert.match(migration, /hidden = true/);
  assert.match(migration, /refresh_canada_public_case\(linked_case_id\)/);
});

test("Canada urgent event ledger is represented in source with private service-role access", () => {
  const ledger = fs.readFileSync("supabase/canada/008_canada_urgent_alert_events.sql", "utf8");
  assert.match(ledger, /create table if not exists public\.urgent_alert_events/);
  assert.match(ledger, /force row level security/);
  assert.match(ledger, /revoke all on public\.urgent_alert_events from public, anon, authenticated/);
  assert.match(ledger, /grant select, insert, update, delete on public\.urgent_alert_events to service_role/);
});
