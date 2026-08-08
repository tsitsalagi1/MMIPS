import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const route = fs.readFileSync('app/api/map/health/route.ts', 'utf8');

test('map health endpoint reports configuration state without exposing full style URL or API key', () => {
  assert.match(route, /NEXT_PUBLIC_MAP_STYLE_URL/);
  assert.match(route, /NEXT_PUBLIC_MAP_ATTRIBUTION/);
  assert.match(route, /NEXT_PUBLIC_MAP_ALLOWED_ORIGINS/);
  assert.match(route, /styleOrigin/);
  assert.match(route, /allowedOrigins/);
  assert.match(route, /Cache-Control.*no-store/);
  assert.doesNotMatch(route, /styleUrl\s*[,}]/);
  assert.doesNotMatch(route, /apiKey|keyValue|secret/i);
});
