import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const mapExperience = fs.readFileSync('components/map/PublicMapExperience.tsx', 'utf8');
const mapPage = fs.readFileSync('app/map/page.tsx', 'utf8');
const publicMap = fs.readFileSync('lib/public-map.ts', 'utf8');
const zipRoute = fs.readFileSync('app/api/map/zip/route.ts', 'utf8');
const publicCases = fs.readFileSync('lib/cases.ts', 'utf8');
const profilesPage = fs.readFileSync('app/profiles/page.tsx', 'utf8');
const profilesSearch = fs.readFileSync('components/ProfilesSearch.tsx', 'utf8');
const readability = fs.readFileSync('app/readability-overrides.css', 'utf8');

test('map page avoids duplicate cards and skips the national point collection on initial load', () => {
  assert.match(mapExperience, /href="\/profiles"/);
  assert.match(mapExperience, /Search public profiles/);
  assert.match(mapExperience, /Enter a ZIP code/);
  assert.match(mapExperience, /starts without downloading the national profile collection/);
  assert.doesNotMatch(mapExperience, /ACCESSIBLE_PAGE_SIZE|Previous 20|Next 20|accessiblePoints/);
  assert.doesNotMatch(mapExperience, /\.map\(\(point\) => <article/);
  assert.doesNotMatch(mapPage, /getPublishedCases|getPublicMapPoints/);
  assert.match(mapPage, /points=\{\[\]\}/);
});

test('ZIP search uses bounded geographic reads instead of the national loader', () => {
  assert.match(zipRoute, /getPublicMapPointsNear/);
  assert.match(publicMap, /PUBLIC_MAP_ZIP_RADIUS_MILES = 100/);
  assert.match(publicMap, /LOCAL_MAP_POINT_LIMIT = 1000/);
  assert.match(publicMap, /\.gte\("public_latitude"/);
  assert.match(publicMap, /\.lte\("public_latitude"/);
  assert.match(publicMap, /\.gte\("public_longitude"/);
  assert.match(publicMap, /\.lte\("public_longitude"/);
  assert.match(publicMap, /\.limit\(LOCAL_MAP_POINT_LIMIT\)/);
  assert.match(publicMap, /distanceMiles/);
});

test('complete public map loader remains bounded for administrative and test uses', () => {
  assert.match(publicMap, /MAP_POINT_PAGE_SIZE = 1000/);
  assert.match(publicMap, /\.range\(from, from \+ MAP_POINT_PAGE_SIZE - 1\)/);
  assert.doesNotMatch(publicMap, /\.limit\(250\)/);
  assert.match(publicMap, /CASE_ID_CHUNK_SIZE = 200/);
});

test('profile browsing uses bounded reads and paginates visible results', () => {
  assert.match(profilesPage, /INITIAL_PROFILE_LIMIT = 24/);
  assert.match(profilesPage, /getPublishedCases\(\{ limit: INITIAL_PROFILE_LIMIT \}\)/);
  assert.match(publicCases, /PUBLIC_CASE_PAGE_SIZE = 500/);
  assert.match(publicCases, /PUBLIC_CASE_SAFETY_LIMIT = 10000/);
  assert.match(publicCases, /\.range\(from, from \+ PUBLIC_CASE_PAGE_SIZE - 1\)/);
  assert.match(profilesSearch, /RESULTS_PER_PAGE = 20/);
  assert.match(profilesSearch, /Previous 20/);
  assert.match(profilesSearch, /Next 20/);
});

test('homepage hero has a calmer profile headline measure', () => {
  assert.match(readability, /\.calm-hero \.hero-copy h1/);
  assert.match(readability, /max-width: 16ch/);
  assert.match(readability, /line-height: 1\.09/);
});
