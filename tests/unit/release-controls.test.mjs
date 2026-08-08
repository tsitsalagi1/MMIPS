import assert from 'node:assert/strict';
import test from 'node:test';
import { realSubmissionIntakeEnabled } from '../../.test-dist/lib/release-controls.js';

test('production submission intake fails closed without an explicit release flag', () => {
  assert.equal(realSubmissionIntakeEnabled({ nodeEnv: 'production' }), false);
  assert.equal(realSubmissionIntakeEnabled({ nodeEnv: 'production', flag: '' }), false);
  assert.equal(realSubmissionIntakeEnabled({ nodeEnv: 'production', flag: 'false' }), false);
  assert.equal(realSubmissionIntakeEnabled({ nodeEnv: 'production', flag: 'TRUE' }), false);
});

test('production submission intake opens only for exact explicit true', () => {
  assert.equal(realSubmissionIntakeEnabled({ nodeEnv: 'production', flag: 'true' }), true);
});

test('non-production environments remain available for synthetic testing', () => {
  assert.equal(realSubmissionIntakeEnabled({ nodeEnv: 'test' }), true);
  assert.equal(realSubmissionIntakeEnabled({ nodeEnv: 'development' }), true);
});
