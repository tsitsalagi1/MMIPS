import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const rehearsal = fs.readFileSync('docs/SYNTHETIC_PUBLIC_REHEARSAL_2026-08-08.md', 'utf8');

test('synthetic rehearsal documentation names only the dedicated test slugs', () => {
  for (let i = 1; i <= 5; i++) {
    assert.match(rehearsal, new RegExp(`mmips-test-person-00${i}`));
  }
  assert.match(rehearsal, /NOT A REAL PERSON/);
  assert.match(rehearsal, /Do not bypass email confirmation/);
  assert.match(rehearsal, /slug like 'mmips-test-person-%'/);
});
