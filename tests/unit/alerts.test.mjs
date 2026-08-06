import assert from 'node:assert/strict';
import test from 'node:test';
import { createAlertTokens, hashAlertToken, normalizeEmail, normalizePreferences } from '../../.test-dist/lib/alerts-core.js';

test('normalizes synthetic email addresses and rejects invalid or oversized input', () => {
  assert.equal(normalizeEmail('  DEMO.SUBSCRIBER@EXAMPLE.TEST '), 'demo.subscriber@example.test');
  assert.equal(normalizeEmail('not an email'), null);
  assert.equal(normalizeEmail('x'.repeat(255) + '@example.test'), null);
});

test('normalizes Version 1 preferences to all public alerts only', () => {
  assert.deepEqual(normalizePreferences({ categories: ['all_public_alerts', 'exact_location'] }), { categories: ['all_public_alerts'] });
  assert.deepEqual(normalizePreferences(undefined), { categories: ['all_public_alerts'] });
});

test('generates separate strong confirmation and unsubscribe tokens and stores hashable values', () => {
  const tokens = createAlertTokens(new Date('2026-08-05T00:00:00Z'));
  assert.notEqual(tokens.confirmationToken, tokens.unsubscribeToken);
  assert.ok(tokens.confirmationToken.length >= 40);
  assert.ok(tokens.unsubscribeToken.length >= 40);
  assert.match(tokens.confirmationTokenHash, /^sha256:[a-f0-9]{64}$/);
  assert.match(tokens.unsubscribeTokenHash, /^sha256:[a-f0-9]{64}$/);
  assert.equal(tokens.confirmationTokenHash, hashAlertToken(tokens.confirmationToken));
  assert.equal(tokens.unsubscribeTokenHash, hashAlertToken(tokens.unsubscribeToken));
  assert.equal(tokens.confirmationTokenHash.includes(tokens.confirmationToken), false);
  assert.equal(tokens.unsubscribeTokenHash.includes(tokens.unsubscribeToken), false);
  assert.equal(tokens.confirmationExpiresAt, '2026-08-07T00:00:00.000Z');
});

test('confirmation token hashes are deterministic without exposing raw token material', () => {
  const hash = hashAlertToken('synthetic-token-value-for-test-only');
  assert.match(hash, /^sha256:[a-f0-9]{64}$/);
  assert.equal(hash.includes('synthetic-token-value'), false);
});
