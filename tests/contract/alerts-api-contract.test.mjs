import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const subscribe = readFileSync('app/api/alerts/subscribe/route.ts', 'utf8');
const confirm = readFileSync('app/api/alerts/confirm/route.ts', 'utf8');
const unsubscribe = readFileSync('app/api/alerts/unsubscribe/route.ts', 'utf8');

test('subscribe API is POST-only, bounded, generic, and server-side', () => {
  assert.equal(subscribe.includes('export async function POST'), true);
  assert.equal(subscribe.includes('MAX_ALERT_REQUEST_BYTES'), true);
  assert.equal(subscribe.includes('verifyTurnstile'), true);
  assert.equal(subscribe.includes('If this email can receive MMIPS alerts'), true);
  assert.equal(subscribe.includes('createSupabaseAlertStore'), true);
  assert.equal(subscribe.includes('error.message'), false);
});

test('confirm and unsubscribe use opaque token-only low-friction links', () => {
  assert.equal(confirm.includes('searchParams.get("token")'), true);
  assert.equal(confirm.includes('/alerts/confirmed'), true);
  assert.equal(unsubscribe.includes('searchParams.get("token")'), true);
  assert.equal(unsubscribe.includes('/alerts/unsubscribed'), true);
  assert.equal(confirm.includes('email'), false);
  assert.equal(unsubscribe.includes('email'), false);
});
