import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const page = fs.readFileSync('app/submit/page.tsx', 'utf8');
const route = fs.readFileSync('app/api/submissions/route.ts', 'utf8');

test('production submit page hides intake behind explicit release control', () => {
  assert.match(page, /realSubmissionIntakeEnabledFromEnv/);
  assert.match(page, /New submissions are temporarily paused/);
  assert.match(page, /Please do not send private case details by email while intake is paused/);
  assert.match(page, /intakeEnabled[\s\S]*<form/);
});

test('submission API checks release lock before reading request body', () => {
  const guard = route.indexOf('if (!realSubmissionIntakeEnabledFromEnv())');
  const parse = route.indexOf('request.formData()');
  const insert = route.indexOf('.from("submissions")');
  assert.ok(guard >= 0, 'release guard must exist');
  assert.ok(parse > guard, 'release guard must run before parsing submission data');
  assert.ok(insert > guard, 'release guard must run before database insert');
  assert.match(route, /real_submission_intake_locked/);
});
