import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const route = fs.readFileSync('app/api/admin/synthetic-scale/route.ts', 'utf8');
const admin = fs.readFileSync('app/admin/AdminSyntheticScale.tsx', 'utf8');
const adminPage = fs.readFileSync('app/admin/page.tsx', 'utf8');

test('national synthetic loader is admin-gated, batched, reversible, and never urgent', () => {
  assert.match(route, /requireAdmin\(request\)/);
  assert.match(route, /BATCH_SIZE = 150/);
  assert.match(route, /PREFIX = "mmips-test-scale-"/);
  assert.match(route, /review_status: "pending_review"/);
  assert.match(route, /moderator_approved: false/);
  assert.match(route, /urgency_level: "standard"/);
  assert.doesNotMatch(route, /urgent_public_awareness/);
  assert.match(route, /STAGE NATIONAL SYNTHETIC TEST/);
  assert.match(route, /PUBLISH NATIONAL SYNTHETIC TEST/);
  assert.match(route, /REMOVE NATIONAL SYNTHETIC TEST/);
  assert.match(route, /audit_log/);
  assert.match(route, /SYNTHETIC TEST ONLY — DO NOT SEND REAL TIPS/);
});

test('national geography comes only from official government endpoints', () => {
  assert.match(route, /tigerweb\.geo\.census\.gov/);
  assert.match(route, /services\.sac-isc\.gc\.ca/);
  assert.match(route, /ADMIN_LAND_TYPE='INDIAN RESERVE'/);
  assert.match(route, /Federal Indian reservation|geographyName/);
});

test('admin UI requires explicit phrases and exposes stage-publish-remove sequence', () => {
  assert.match(adminPage, /AdminSyntheticScale/);
  assert.match(admin, /STAGE NATIONAL SYNTHETIC TEST/);
  assert.match(admin, /PUBLISH NATIONAL SYNTHETIC TEST/);
  assert.match(admin, /REMOVE NATIONAL SYNTHETIC TEST/);
  assert.match(admin, /Nothing is public yet/);
  assert.match(admin, /Working in small audited batches/);
});
