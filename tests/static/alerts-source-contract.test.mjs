import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync('app/alerts/page.tsx', 'utf8');
const migration = readFileSync('supabase/alerts_v1_20260805.sql', 'utf8');
const alerts = readFileSync('lib/alerts.ts', 'utf8');
const alertsCore = readFileSync('lib/alerts-core.ts', 'utf8');

test('alerts page has persistent accessible consent, privacy, and status messaging', () => {
  for (const text of ['Subscribing does not report a case', 'MMIPS does not investigate tips', 'Your email address and alert preferences remain private', 'You must confirm through an email link', 'role="status"', 'role="alert"', 'htmlFor="alert-email"']) assert.equal(page.includes(text), true, text);
  assert.equal(page.includes('placeholder='), false);
});

test('alerts migration statically enforces private RLS posture', () => {
  for (const sql of ['STATIC REVIEW ONLY', 'alter table alert_subscribers enable row level security', 'alter table alerts_sent enable row level security', 'revoke all on alert_subscribers from anon, authenticated', 'revoke all on alerts_sent from anon, authenticated', 'confirmation_token_hash', 'unsubscribe_token_hash', 'alert_subscribers_email_normalized_key', 'alerts_sent_subscriber_event_key']) assert.equal(migration.includes(sql), true, sql);
  assert.equal(/create policy .* to anon/i.test(migration), false);
});

test('alert implementation hashes tokens and avoids raw subscriber logging', () => {
  assert.equal(alertsCore.includes('randomBytes(ALERT_TOKEN_BYTES)'), true);
  assert.equal(alertsCore.includes('createHash("sha256")'), true);
  assert.equal(alerts.includes('console.log'), false);
  assert.equal(alerts.includes('console.error'), false);
  assert.equal(alerts.includes('SUPABASE_SERVICE_ROLE_KEY'), true);
});
