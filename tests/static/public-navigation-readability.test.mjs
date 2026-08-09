import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const layout = fs.readFileSync('app/layout.tsx', 'utf8');
const howItWorks = fs.readFileSync('app/how-it-works/page.tsx', 'utf8');
const readability = fs.readFileSync('app/readability-overrides.css', 'utf8');
const profilesSearch = fs.readFileSync('components/ProfilesSearch.tsx', 'utf8');
const caseCard = fs.readFileSync('components/CaseCard.tsx', 'utf8');

function unitedStatesNav() {
  const headerStart = layout.indexOf('function UnitedStatesHeader()');
  assert.ok(headerStart >= 0, 'United States header should exist');
  const navStart = layout.indexOf('<div className="nav-links">', headerStart);
  const navEnd = layout.indexOf('</div>', navStart);
  assert.ok(navStart >= headerStart && navEnd > navStart, 'United States navigation should exist');
  return layout.slice(navStart, navEnd);
}

test('United States top navigation uses the public-first MMIPS order without a separate Map link', () => {
  const nav = unitedStatesNav();
  const expected = [
    'href="/how-it-works">How it works',
    'href="/profiles">Search Profiles',
    'href="/alerts">Alerts',
    'href="/resources">Family Resources',
    'href="/submit">Submit Information'
  ];
  let previous = -1;
  for (const item of expected) {
    const index = nav.indexOf(item);
    assert.ok(index > previous, `${item} should appear in the requested order`);
    previous = index;
  }
  assert.match(nav, /United States · Change country/);
  assert.equal(nav.includes('href="/map"'), false);
  assert.equal(nav.includes('href="/corrections"'), false);
});

test('corrections stays available in the U.S. footer and How It Works while Map is removed from navigation', () => {
  assert.match(layout, /href="\/corrections">Correction\/removal requests/);
  assert.match(howItWorks, /href="\/corrections"/);
  assert.doesNotMatch(unitedStatesNav(), /href="\/map"/);
  assert.match(unitedStatesNav(), /href="\/resources">Family Resources/);
});

test('helper and placeholder text are forced to readable warm neutral colors', () => {
  assert.match(readability, /\.field-help/);
  assert.match(readability, /color: var\(--muted\) !important/);
  assert.match(readability, /input::placeholder/);
  assert.doesNotMatch(readability, /#[0-9a-f]{0,2}46748d/i);
});

test('Search Profiles owns the national map and keeps data context visible', () => {
  assert.match(profilesSearch, /National MMIPS public profile map/);
  assert.match(profilesSearch, /Map context:/);
  assert.match(profilesSearch, /SYNTHETIC TEST DATA IS PRESENT/);
  assert.match(profilesSearch, /Show all map points/);
  assert.doesNotMatch(profilesSearch, /CaseCard|Previous 20|Next 20|profile-pagination/);
});

test('synthetic public cards remain explicitly labeled wherever cards are still used elsewhere', () => {
  assert.match(caseCard, /item\.slug\.startsWith\("mmips-test-"\)/);
  assert.match(caseCard, /SYNTHETIC TEST DATA/);
  assert.match(caseCard, /not a real person or real case/i);
});
