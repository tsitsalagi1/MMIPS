import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const page = fs.readFileSync('app/submit/page.tsx', 'utf8');
const route = fs.readFileSync('app/api/submissions/route.ts', 'utf8');
const controls = fs.readFileSync('lib/release-controls.ts', 'utf8');

test('deployed submit page defaults to a fail-closed release mode', () => {
  assert.match(page, /submissionIntakeModeFromEnv/);
  assert.match(page, /intakeMode === "locked"/);
  assert.match(page, /New submissions are temporarily paused/);
  assert.match(page, /Please do not send private case details by email while intake is paused/);
});

test('protected preview exposes an explicit synthetic-only rehearsal warning and marker', () => {
  assert.match(page, /intakeMode === "synthetic"/);
  assert.match(page, /Synthetic rehearsal only/);
  assert.match(page, /Do not enter any real person, family, case, witness, subscriber, requester, or investigative information/);
  assert.match(page, /name="synthetic_rehearsal" value="true"/);
});

test('submission API checks release lock before reading request body', () => {
  const mode = route.indexOf('const intakeMode = submissionIntakeModeFromEnv()');
  const guard = route.indexOf('if (intakeMode === "locked")');
  const parse = route.indexOf('request.formData()');
  const insert = route.indexOf('.from("submissions")');
  assert.ok(mode >= 0, 'release mode must be resolved');
  assert.ok(guard > mode, 'locked-mode guard must exist');
  assert.ok(parse > guard, 'locked-mode guard must run before parsing submission data');
  assert.ok(insert > guard, 'locked-mode guard must run before database insert');
  assert.match(route, /submission_intake_locked/);
});

test('synthetic mode requires an explicit rehearsal marker before downstream processing', () => {
  const parse = route.indexOf('request.formData()');
  const marker = route.indexOf('form.get("synthetic_rehearsal") !== "true"');
  const turnstile = route.indexOf('const verification = await verifyTurnstileToken', marker);
  assert.ok(marker > parse, 'synthetic marker can only be checked after form parsing');
  assert.ok(turnstile > marker, 'synthetic marker must be checked before Turnstile/downstream processing');
  assert.match(route, /synthetic_submission_marker_required/);
});

test('Canada production intake is open while retaining an explicit emergency pause', () => {
  assert.match(controls, /export function canadaSubmissionIntakeMode/);
  assert.match(controls, /input\.realFlag === "false" \? "locked" : "real"/);
  assert.match(controls, /input\.vercelEnv === "preview"[\s\S]*input\.syntheticFlag === "true"/);
});
