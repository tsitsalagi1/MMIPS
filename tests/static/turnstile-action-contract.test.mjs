import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const widget = fs.readFileSync('components/TurnstileWidget.tsx', 'utf8');
const submitPage = fs.readFileSync('app/submit/page.tsx', 'utf8');
const correctionPage = fs.readFileSync('app/corrections/page.tsx', 'utf8');
const submitRoute = fs.readFileSync('app/api/submissions/route.ts', 'utf8');
const correctionRoute = fs.readFileSync('app/api/corrections/route.ts', 'utf8');
const turnstile = fs.readFileSync('lib/security/turnstile.ts', 'utf8');

test('Turnstile widgets carry distinct action scopes for sensitive public forms', () => {
  assert.match(widget, /data-action=\{action\}/);
  assert.match(submitPage, /TurnstileWidget action="submission_intake"/);
  assert.match(correctionPage, /TurnstileWidget action="correction_request"/);
});

test('submission server validates the matching Turnstile action and hostname', () => {
  assert.match(submitRoute, /expectedAction: "submission_intake"/);
  assert.match(submitRoute, /expectedHostname: expectedTurnstileHostname\(request\)/);
});

test('correction server validates the matching Turnstile action and hostname', () => {
  assert.match(correctionRoute, /expectedAction: "correction_request"/);
  assert.match(correctionRoute, /expectedHostname: expectedTurnstileHostname\(request\)/);
});

test('canonical production hostname derives from the actual request and noncanonical hosts require configuration', () => {
  assert.match(turnstile, /requestHostname === "mmips\.com"/);
  assert.match(turnstile, /requestHostname === "www\.mmips\.com"/);
  assert.match(turnstile, /TURNSTILE_EXPECTED_HOSTNAME/);
  assert.match(turnstile, /turnstile_expected_hostname_missing/);
});
