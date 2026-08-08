import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const casesIndex = fs.readFileSync('app/cases/page.tsx', 'utf8');
const caseProfile = fs.readFileSync('app/cases/[slug]/page.tsx', 'utf8');
const caseFlyer = fs.readFileSync('app/cases/[slug]/flyer/page.tsx', 'utf8');

test('legacy cases routes permanently canonicalize to profiles routes', () => {
  for (const source of [casesIndex, caseProfile, caseFlyer]) {
    assert.match(source, /permanentRedirect/);
    assert.doesNotMatch(source, /import \{ redirect \}/);
  }
  assert.match(casesIndex, /permanentRedirect\("\/profiles"\)/);
  assert.match(caseProfile, /permanentRedirect\(`\/profiles\/\$\{slug\}`\)/);
  assert.match(caseFlyer, /permanentRedirect\(`\/profiles\/\$\{slug\}\/flyer`\)/);
});
