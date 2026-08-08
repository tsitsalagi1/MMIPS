import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const route = fs.readFileSync('app/api/map/health/route.ts', 'utf8');

test('map health endpoint probes configured style without exposing full style URL or API key', () => {
  assert.match(route, /NEXT_PUBLIC_MAP_STYLE_URL/);
  assert.match(route, /NEXT_PUBLIC_MAP_ATTRIBUTION/);
  assert.match(route, /NEXT_PUBLIC_MAP_ALLOWED_ORIGINS/);
  assert.match(route, /Origin: "https:\/\/mmips\.com"/);
  assert.match(route, /Referer: "https:\/\/mmips\.com\/map"/);
  assert.match(route, /stylePathname/);
  assert.match(route, /styleHasKeyParameter/);
  assert.match(route, /disallowedResourceOrigins/);
  assert.match(route, /Cache-Control.*no-store/);

  const responseBlock = route.slice(route.indexOf('return NextResponse.json('));
  assert.ok(responseBlock.length > 0);
  assert.doesNotMatch(responseBlock, /\bstyleUrl\b/);
  assert.doesNotMatch(route, /searchParams\.get\(["']key["']\)/);
  assert.doesNotMatch(route, /apiKey|keyValue|secret/i);
});
