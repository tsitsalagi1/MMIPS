import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const mapRedirect = fs.readFileSync('app/map/page.tsx', 'utf8');
const publicMap = fs.readFileSync('lib/public-map.ts', 'utf8');
const publicCases = fs.readFileSync('lib/cases.ts', 'utf8');
const profilesPage = fs.readFileSync('app/profiles/page.tsx', 'utf8');
const profilesSearch = fs.readFileSync('components/ProfilesSearch.tsx', 'utf8');
const mapDataRoute = fs.readFileSync('app/api/profiles/map/route.ts', 'utf8');
const profileSearchRoute = fs.readFileSync('app/api/profiles/search/route.ts', 'utf8');
const readability = fs.readFileSync('app/readability-overrides.css', 'utf8');

test('Search Profiles is the single public discovery surface and has no card wall', () => {
  assert.match(profilesPage, /<ProfilesSearch \/>/);
  assert.doesNotMatch(profilesPage, /getPublishedCases|INITIAL_PROFILE_LIMIT/);
  assert.match(profilesSearch, /National MMIPS public profile map/);
  assert.match(profilesSearch, /fetch\("\/api\/profiles\/map"/);
  assert.match(profilesSearch, /fetch\("\/api\/profiles\/search"/);
  assert.doesNotMatch(profilesSearch, /CaseCard|RESULTS_PER_PAGE|Previous 20|Next 20|visibleProfiles|profile-pagination/);
});

test('legacy map route permanently redirects to Search Profiles', () => {
  assert.match(mapRedirect, /permanentRedirect\("\/profiles"\)/);
  assert.doesNotMatch(mapRedirect, /PublicMapExperience|MMIPS public map/);
});

test('national map dataset is fetched after the page shell and remains bounded', () => {
  assert.match(mapDataRoute, /getPublicMapPoints\(\)/);
  assert.match(mapDataRoute, /s-maxage=60/);
  assert.match(publicMap, /MAP_POINT_PAGE_SIZE = 1000/);
  assert.match(publicMap, /MAP_POINT_SAFETY_LIMIT = 10000/);
  assert.match(publicMap, /\.range\(from, from \+ MAP_POINT_PAGE_SIZE - 1\)/);
  assert.match(publicMap, /CASE_ID_CHUNK_SIZE = 200/);
  assert.doesNotMatch(publicMap, /\.limit\(250\)/);
});

test('ZIP profile search uses bounded nearby map reads instead of hydrating the national map again', () => {
  assert.match(profileSearchRoute, /getPublicMapPointsNear/);
  assert.doesNotMatch(profileSearchRoute, /getPublicMapPoints\(/);
  assert.match(publicMap, /LOCAL_MAP_POINT_LIMIT = 1000/);
  assert.match(publicMap, /\.gte\("public_latitude"/);
  assert.match(publicMap, /\.lte\("public_latitude"/);
  assert.match(publicMap, /\.gte\("public_longitude"/);
  assert.match(publicMap, /\.lte\("public_longitude"/);
  assert.match(publicMap, /\.limit\(LOCAL_MAP_POINT_LIMIT\)/);
});

test('profile search backend remains bounded even though visible results are map-only', () => {
  assert.match(publicCases, /PUBLIC_CASE_PAGE_SIZE = 500/);
  assert.match(publicCases, /PUBLIC_CASE_SAFETY_LIMIT = 10000/);
  assert.match(publicCases, /\.range\(from, from \+ PUBLIC_CASE_PAGE_SIZE - 1\)/);
});

test('homepage hero has a calmer profile headline measure', () => {
  assert.match(readability, /\.calm-hero \.hero-copy h1/);
  assert.match(readability, /max-width: 16ch/);
  assert.match(readability, /line-height: 1\.09/);
});
