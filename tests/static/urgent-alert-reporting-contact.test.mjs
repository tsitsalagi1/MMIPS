import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const route = fs.readFileSync('app/api/admin/alerts/urgent/route.ts', 'utf8');
const sender = fs.readFileSync('lib/urgent-alerts.ts', 'utf8');
const admin = fs.readFileSync('app/admin/AdminUrgentAlerts.tsx', 'utf8');

test('urgent alert target loads and requires the official reporting contact', () => {
  assert.match(route, /official_tip_contact/);
  assert.match(route, /lead_agency/);
  assert.match(route, /Add an official tip\/reporting contact/);
  assert.match(route, /officialTipContact/);
});

test('urgent alert email uses canonical profiles route and passes reporting details', () => {
  assert.match(sender, /\/profiles\/\$\{encodeURIComponent\(target\.slug\)\}/);
  assert.match(sender, /tipContact: target\.officialTipContact/);
  assert.match(sender, /leadAgency: target\.leadAgency/);
  assert.match(sender, /publicMapLabel: target\.publicMapLabel/);
  assert.doesNotMatch(sender, /subject: "Urgent MMIPS community alert"/);
});

test('moderator preview shows the exact profile link and tip routing before send', () => {
  assert.match(admin, /Profile link in alert:/);
  assert.match(admin, /Tips\/reporting contact:/);
  assert.match(admin, /Every urgent alert directs case information to the official contact/);
});
