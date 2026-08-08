import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const robots = fs.readFileSync('app/robots.ts', 'utf8');
const sitemap = fs.readFileSync('app/sitemap.ts', 'utf8');
const transactionalPages = [
  'app/admin/page.tsx',
  'app/alerts/confirm/page.tsx',
  'app/alerts/unsubscribe/page.tsx',
  'app/alerts/confirmed/page.tsx',
  'app/alerts/unsubscribed/page.tsx',
  'app/submit/received/page.tsx',
  'app/corrections/received/page.tsx'
];

test('crawler policy blocks API endpoints and advertises a sitemap', () => {
  assert.match(robots, /disallow: \["\/api\/"\]/);
  assert.match(robots, /\/sitemap\.xml/);
});

test('transactional, token-bearing, receipt, and admin pages are noindex', () => {
  for (const path of transactionalPages) {
    const source = fs.readFileSync(path, 'utf8');
    assert.match(source, /index: false/, `${path} must be noindex`);
    assert.match(source, /follow: false/, `${path} must be nofollow`);
    assert.match(source, /noarchive: true/, `${path} must be noarchive`);
  }
});

test('sitemap contains public informational surfaces and excludes private/transactional paths', () => {
  for (const path of ['/profiles', '/alerts', '/map', '/resources', '/how-it-works', '/corrections', '/privacy', '/terms']) {
    assert.ok(sitemap.includes(`"${path}"`), `${path} should be in sitemap`);
  }
  for (const path of ['/admin', '/api', '/alerts/confirm', '/alerts/unsubscribe', '/submit/received', '/corrections/received']) {
    assert.equal(sitemap.includes(`"${path}"`), false, `${path} must not be in sitemap`);
  }
});
