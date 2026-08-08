import assert from 'node:assert/strict';
import test from 'node:test';
import { submissionIntakeMode } from '../../.test-dist/lib/release-controls.js';

test('production submission intake fails closed without an explicit real-release flag', () => {
  assert.equal(submissionIntakeMode({ nodeEnv: 'production', vercelEnv: 'production' }), 'locked');
  assert.equal(submissionIntakeMode({ nodeEnv: 'production', vercelEnv: 'production', realFlag: '' }), 'locked');
  assert.equal(submissionIntakeMode({ nodeEnv: 'production', vercelEnv: 'production', realFlag: 'false' }), 'locked');
  assert.equal(submissionIntakeMode({ nodeEnv: 'production', vercelEnv: 'production', realFlag: 'TRUE' }), 'locked');
});

test('production submission intake opens only for exact explicit real-release true', () => {
  assert.equal(submissionIntakeMode({ nodeEnv: 'production', vercelEnv: 'production', realFlag: 'true' }), 'real');
});

test('Vercel preview stays locked unless synthetic rehearsal is explicitly enabled', () => {
  assert.equal(submissionIntakeMode({ nodeEnv: 'production', vercelEnv: 'preview' }), 'locked');
  assert.equal(submissionIntakeMode({ nodeEnv: 'production', vercelEnv: 'preview', syntheticFlag: 'true' }), 'synthetic');
  assert.equal(submissionIntakeMode({ nodeEnv: 'production', vercelEnv: 'preview', realFlag: 'true' }), 'locked');
});

test('local development and test environments are synthetic-only', () => {
  assert.equal(submissionIntakeMode({ nodeEnv: 'test' }), 'synthetic');
  assert.equal(submissionIntakeMode({ nodeEnv: 'development' }), 'synthetic');
});

test('unknown deployed environments fail closed', () => {
  assert.equal(submissionIntakeMode({}), 'locked');
  assert.equal(submissionIntakeMode({ nodeEnv: 'production', vercelEnv: 'custom' }), 'locked');
});
