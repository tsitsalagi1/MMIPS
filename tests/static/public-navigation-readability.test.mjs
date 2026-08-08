import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const layout = fs.readFileSync('app/layout.tsx', 'utf8');
const howItWorks = fs.readFileSync('app/how-it-works/page.tsx', 'utf8');
const readability = fs.readFileSync('app/readability-overrides.css', 'utf8');
const caseCard = fs.readFileSync('components/CaseCard.tsx', 'utf8');

test('top navigation follows the public-first MMIPS order and omits corrections/map', () => {
  const navStart = layout.indexOf('<div className="nav-links">');
  const navEnd = layout.indexOf('</div>', navStart);
  const nav = layout.slice(navStart, navEnd);
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
  assert.equal(nav.includes('href="/corrections"'), false);
  assert.equal(nav.includes('href="/map"'), false);
});

test('corrections stays available in footer and How It Works', () => {
  assert.match(layout, /href="\/corrections">Correction\/removal requests/);
  assert.match(howItWorks, /href="\/corrections"/);
});

test('family resources and public map remain discoverable outside the top navigation', () => {
  assert.match(layout, /href="\/resources">Family Resources/);
  assert.match(layout, /href="\/map">Public Map/);
});

test('helper and placeholder text are forced to readable warm neutral colors', () => {
  assert.match(readability, /\.field-help/);
  assert.match(readability, /color: var\(--muted\) !important/);
  assert.match(readability, /input::placeholder/);
  assert.doesNotMatch(readability, /#[0-9a-f]{0,2}46748d/i);
});

test('synthetic public cards are explicitly labeled as test data', () => {
  assert.match(caseCard, /item\.slug\.startsWith\("mmips-test-"\)/);
  assert.match(caseCard, /SYNTHETIC TEST DATA/);
  assert.match(caseCard, /not a real person or real case/i);
});
