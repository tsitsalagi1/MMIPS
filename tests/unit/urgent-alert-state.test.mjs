import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeUrgentDeliveryState } from '../../.test-dist/lib/urgent-alert-state.js';

test('fully sent urgent audience is marked sent', () => {
  assert.deepEqual(summarizeUrgentDeliveryState(['sent', 'sent'], 2), {
    status: 'sent', sent: 2, failed: 0, failedFinal: 0, retryable: 0, missing: 0
  });
});

test('retryable delivery keeps event partial instead of falsely sent', () => {
  assert.deepEqual(summarizeUrgentDeliveryState(['sent', 'failed_retryable'], 2), {
    status: 'partial', sent: 1, failed: 1, failedFinal: 0, retryable: 1, missing: 0
  });
});

test('final delivery failure remains failed when nothing sent', () => {
  assert.deepEqual(summarizeUrgentDeliveryState(['failed_final'], 1), {
    status: 'failed', sent: 0, failed: 1, failedFinal: 1, retryable: 0, missing: 0
  });
});

test('missing planned ledger rows cannot be treated as success', () => {
  assert.deepEqual(summarizeUrgentDeliveryState(['sent'], 2), {
    status: 'partial', sent: 1, failed: 1, failedFinal: 0, retryable: 0, missing: 1
  });
});

test('zero-recipient urgent event completes without inventing failures', () => {
  assert.deepEqual(summarizeUrgentDeliveryState([], 0), {
    status: 'sent', sent: 0, failed: 0, failedFinal: 0, retryable: 0, missing: 0
  });
});
