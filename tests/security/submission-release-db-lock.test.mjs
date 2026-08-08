import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const sql = fs.readFileSync('supabase/lock_real_submission_inserts_until_launch_20260808.sql', 'utf8');

test('prelaunch database kill switch revokes only submission INSERT from service_role', () => {
  assert.match(sql, /revoke insert on table public\.submissions from service_role/i);
  assert.doesNotMatch(sql, /revoke\s+(select|update|delete|all)/i);
  assert.doesNotMatch(sql, /correction_requests|cases|persons|alert_subscribers/i);
});
