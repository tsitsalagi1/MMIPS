import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const mapExperience = fs.readFileSync('components/map/PublicMapExperience.tsx', 'utf8');
const mapPage = fs.readFileSync('app/map/page.tsx', 'utf8');
const publicMap = fs.readFileSync('lib/public-map.ts', 'utf8');
const publicCases = fs.readFileSync('lib/cases.ts', 'utf8');
const profilesPage = fs.readFileSync('app/profiles/page.tsx', 'utf8');
const profilesSearch = fs.readFileSync('components/ProfilesSearch.tsx', 'utf8');
const readability = fs.readFileSync('app/readability-overrides.css', 'utf8');

test('map page avoids duplicating paginated profile cards at public scale', () => {
  assert.match(mapExperience, /href="\/profiles"/);
  assert.match(mapExperience, /Search public profiles/);
  assert.match(mapExperience, /Zoom map to a ZIP code/);
  assert.doesNotMatch(mapExperience, /ACCESSIBLE_PAGE_SIZE|Previous 20|Next 20|accessiblePoints/);
  assert.doesNotMatch(mapExperience, /\.map\(\(point\) => <article/);
  assert.doesNotMatch(mapPage, /getPublishedCases/);
});

test('public map loader no longer silently truncates at 250 points', () => {
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
