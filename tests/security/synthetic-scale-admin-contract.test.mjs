import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const route = fs.readFileSync('app/api/admin/synthetic-scale/route.ts', 'utf8');
const admin = fs.readFileSync('app/admin/AdminSyntheticScale.tsx', 'utf8');
const adminPage = fs.readFileSync('app/admin/page.tsx', 'utf8');
const benchmarks = fs.readFileSync('lib/synthetic-scale-benchmarks.ts', 'utf8');

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
  assert.match(route, /body\.source !== source/);
  assert.match(route, /mmipsSiteMode\(\)/);
  assert.match(route, /sourcePrefix\(source\)/);
});

test('national geography comes only from official government endpoints', () => {
  assert.match(route, /tigerweb\.geo\.census\.gov/);
  assert.match(route, /services\.sac-isc\.gc\.ca/);
  assert.match(route, /ADMIN_LAND_TYPE='INDIAN RESERVE'/);
  assert.match(route, /MapServer\/47\/query/);
  assert.match(route, /MapServer\/6\/query/);
  assert.match(route, /State_County\/MapServer\/2\/query/);
  assert.match(route, /US_TERRITORY_FIPS = \["60", "66", "69", "72", "78"\]/);
  assert.match(route, /us_territory_scale_test/);
  assert.match(route, /isTerritoryFixture \? "state" : "tribal_region"/);
  assert.match(route, /alaska_native_village_scale_test/);
  assert.match(route, /inuit_community_scale_test/);
  assert.match(route, /yukon_first_nation_scale_test/);
  assert.match(benchmarks, /covering every province and territory/);
});

test('official aggregate benchmarks are explicit and never represented as real cases', () => {
  assert.match(benchmarks, /targetProfiles: 4200/);
  assert.match(benchmarks, /missingProfiles: 1500/);
  assert.match(benchmarks, /murderedUnsolvedProfiles: 2700/);
  assert.match(benchmarks, /alaskaProfiles: 363/);
  assert.match(benchmarks, /territoryProfiles: 125/);
  assert.match(benchmarks, /American Samoa/);
  assert.match(benchmarks, /Puerto Rico/);
  assert.match(benchmarks, /U\.S\. Virgin Islands/);
  assert.match(benchmarks, /targetProfiles: 1181/);
  assert.match(benchmarks, /missingProfiles: 164/);
  assert.match(benchmarks, /murderedUnsolvedProfiles: 1017/);
  assert.match(benchmarks, /does not publish a comparable current national open-case total/);
  assert.match(benchmarks, /do not represent prevalence/);
  assert.match(benchmarks, /territory fixtures are an even coverage allocation/);
});

test('admin UI requires explicit phrases and exposes stage-publish-remove sequence', () => {
  assert.match(adminPage, /AdminSyntheticScale/);
  assert.match(admin, /STAGE NATIONAL SYNTHETIC TEST/);
  assert.match(admin, /PUBLISH NATIONAL SYNTHETIC TEST/);
  assert.match(admin, /REMOVE NATIONAL SYNTHETIC TEST/);
  assert.match(admin, /Nothing is public yet/);
  assert.match(admin, /Working in small audited batches/);
  assert.match(adminPage, /AdminSyntheticScale source="us"/);
  assert.match(adminPage, /AdminSyntheticScale source="ca"/);
});
