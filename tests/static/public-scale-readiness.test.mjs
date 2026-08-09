import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const mapRedirect = fs.readFileSync('app/map/page.tsx', 'utf8');
const publicMap = fs.readFileSync('lib/public-map.ts', 'utf8');
const profilesPage = fs.readFileSync('app/profiles/page.tsx', 'utf8');
const profilesSearch = fs.readFileSync('components/ProfilesSearch.tsx', 'utf8');
const mapDataRoute = fs.readFileSync('app/api/profiles/map/route.ts', 'utf8');
const profileSearchRoute = fs.readFileSync('app/api/profiles/search/route.ts', 'utf8');
const hardeningMigration = fs.readFileSync('supabase/post_stress_public_map_and_photo_hardening_20260809.sql', 'utf8');
const readability = fs.readFileSync('app/readability-overrides.css', 'utf8');

test('Search Profiles is the single public discovery surface with map-first and optional text results', () => {
  assert.match(profilesPage, /<ProfilesSearch \/>/);
  assert.doesNotMatch(profilesPage, /getPublishedCases|INITIAL_PROFILE_LIMIT/);
  assert.match(profilesSearch, /National MMIPS public profile map/);
  assert.match(profilesSearch, /fetch\("\/api\/profiles\/map"/);
  assert.match(profilesSearch, /fetch\("\/api\/profiles\/search"/);
  assert.match(profilesSearch, /Current map results as text/);
  assert.doesNotMatch(profilesSearch, /CaseCard|Previous 20|Next 20|visibleProfiles|profile-pagination/);
});

test('legacy map route permanently redirects to Search Profiles', () => {
  assert.match(mapRedirect, /permanentRedirect\("\/profiles"\)/);
  assert.doesNotMatch(mapRedirect, /PublicMapExperience|MMIPS public map/);
});

test('national map fetches the complete projection after the page shell without a silent record cap', () => {
  assert.match(mapDataRoute, /getPublicMapPoints\(\)/);
  assert.match(mapDataRoute, /s-maxage=60/);
  assert.match(publicMap, /MAP_POINT_PAGE_SIZE = 1000/);
  assert.match(publicMap, /MAP_PROJECTION = "public_map_profile_projection"/);
  assert.match(publicMap, /for \(let from = 0; ; from \+= MAP_POINT_PAGE_SIZE\)/);
  assert.match(publicMap, /\.range\(from, from \+ MAP_POINT_PAGE_SIZE - 1\)/);
  assert.match(publicMap, /if \(page\.length < MAP_POINT_PAGE_SIZE\) break/);
  assert.doesNotMatch(publicMap, /MAP_POINT_SAFETY_LIMIT|CASE_ID_CHUNK_SIZE/);
  assert.match(hardeningMigration, /security_invoker = true/);
});

test('ZIP profile search pages every bounded-area result rather than truncating at 1000', () => {
  assert.match(profileSearchRoute, /getPublicMapPointsNear/);
  assert.doesNotMatch(profileSearchRoute, /getPublicMapPoints\(/);
  assert.match(publicMap, /loadNearbyProjectionRows/);
  assert.match(publicMap, /\.gte\("public_latitude"/);
  assert.match(publicMap, /\.lte\("public_latitude"/);
  assert.match(publicMap, /\.gte\("public_longitude"/);
  assert.match(publicMap, /\.lte\("public_longitude"/);
  assert.match(publicMap, /\.range\(from, from \+ MAP_POINT_PAGE_SIZE - 1\)/);
  assert.doesNotMatch(publicMap, /LOCAL_MAP_POINT_LIMIT|\.limit\(LOCAL_MAP_POINT_LIMIT\)/);
});

test('profile search backend uses the small projection instead of full public profile hydration', () => {
  assert.match(profileSearchRoute, /searchPublicProfileIds/);
  assert.doesNotMatch(profileSearchRoute, /getPublishedCases/);
  assert.match(publicMap, /SEARCH_PROJECTION_SELECT/);
  assert.doesNotMatch(profileSearchRoute, /profile_photos|case_verifications|public_summary/);
});

test('homepage hero has a calmer profile headline measure', () => {
  assert.match(readability, /\.calm-hero \.hero-copy h1/);
  assert.match(readability, /max-width: 16ch/);
  assert.match(readability, /line-height: 1\.09/);
});
