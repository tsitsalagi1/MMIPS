import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const alerts = fs.readFileSync('app/alerts/page.tsx', 'utf8');
const home = fs.readFileSync('app/page.tsx', 'utf8');
const safety = fs.readFileSync('components/SafetyNotice.tsx', 'utf8');
const profilesSearch = fs.readFileSync('components/ProfilesSearch.tsx', 'utf8');
const caseCard = fs.readFileSync('components/CaseCard.tsx', 'utf8');
const profilePage = fs.readFileSync('app/profiles/[slug]/page.tsx', 'utf8');
const css = fs.readFileSync('app/readability-overrides.css', 'utf8');

test('alerts use plain required-field guidance without visible asterisk markers', () => {
  assert.doesNotMatch(alerts, /aria-hidden="true">\*<\/span>/);
  assert.match(alerts, /Email and ZIP code are required/);
  assert.match(alerts, /id="alert-email"[^>]+required/);
  assert.match(alerts, /id="alert-zip"[^>]+required/);
  assert.match(alerts, /We use this to match nearby alerts, not to find your home address/);
});

test('technical ZIP language is removed from family-facing search help', () => {
  assert.doesNotMatch(profilesSearch, /ZIP Code Tabulation Area|request body|private incident or home coordinate/);
  assert.match(profilesSearch, /approved awareness area nearby/);
});

test('public profile cards and detail pages expose scan-friendly reading hooks', () => {
  assert.match(caseCard, /case-card-location/);
  assert.match(caseCard, /case-card-summary/);
  assert.match(profilePage, /public-profile-page/);
  assert.match(profilePage, /<dl className="profile-facts">/);
  assert.match(profilePage, /What is publicly known/);
});

test('shared typography gives public reading surfaces more space', () => {
  assert.match(css, /body\s*\{[\s\S]*?line-height:\s*1\.65/);
  assert.match(css, /p,\s*\nli,[\s\S]*?line-height:\s*1\.65/);
  assert.match(css, /h1\s*\{[\s\S]*?line-height:\s*1\.04/);
  assert.match(css, /\.case-card-grid > div:last-child/);
  assert.match(css, /\.profile-facts > div/);
});

test('safety and homepage copy use short, direct family-facing language', () => {
  assert.match(safety, /Need immediate help\?/);
  assert.match(safety, /If someone is in immediate danger, call 911/);
  assert.match(safety, /It is not law enforcement and it is not a tip line/);
  assert.match(home, /A respectful place to find and share reviewed MMIP profiles/);
  assert.match(home, /Share facts, not rumors/);
});
