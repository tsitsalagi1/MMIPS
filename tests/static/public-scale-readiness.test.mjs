import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const mapExperience = fs.readFileSync('components/map/PublicMapExperience.tsx', 'utf8');
const mapPage = fs.readFileSync('app/map/page.tsx', 'utf8');
const publicMap = fs.readFileSync('lib/public-map.ts', 'utf8');
const profilesPage = fs.readFileSync('app/profiles/page.tsx', 'utf8');
const profilesSearch = fs.readFileSync('components/ProfilesSearch.tsx', 'utf8');
const readability = fs.readFileSync('app/readability-overrides.css', 'utf8');

test('map accessible results are paginated instead of rendering every public profile', () => {
  assert.match(mapExperience, /ACCESSIBLE_PAGE_SIZE = 20/);
  assert.match(mapExperience, /Previous 20/);
  assert.match(mapExperience, /Next 20/);
  assert.doesNotMatch(mapExperience, /profiles\.map\(/);
  assert.doesNotMatch(mapPage, /getPublishedCases/);
});

test('public map loader no longer silently truncates at 250 points', () => {
  assert.match(publicMap, /MAP_POINT_PAGE_SIZE = 1000/);
  assert.match(publicMap, /\.range\(from, from \+ MAP_POINT_PAGE_SIZE - 1\)/);
  assert.doesNotMatch(publicMap, /\.limit\(250\)/);
  assert.match(publicMap, /CASE_ID_CHUNK_SIZE = 200/);
});

test('profile browsing limits initial DOM and paginates explicit search results', () => {
  assert.match(profilesPage, /INITIAL_PROFILE_LIMIT = 24/);
  assert.match(profilesSearch, /RESULTS_PER_PAGE = 20/);
  assert.match(profilesSearch, /Previous 20/);
  assert.match(profilesSearch, /Next 20/);
});

test('homepage hero has a calmer profile headline measure', () => {
  assert.match(readability, /\.calm-hero \.hero-copy h1/);
  assert.match(readability, /max-width: 16ch/);
  assert.match(readability, /line-height: 1\.09/);
});
