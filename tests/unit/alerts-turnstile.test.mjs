import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyTurnstileToken } from '../../.test-dist/lib/security/turnstile.js';

const TURNSTILE_SECRET_KEY_NAME = 'TURNSTILE_SECRET_KEY';
const TURNSTILE_BYPASS_KEY_NAME = 'ALLOW_INSECURE_TURNSTILE_BYPASS';
const request = new Request('https://mmips.com/api/alerts/subscribe');
function response(payload, ok = true) { return async () => ({ ok, async json() { return payload; } }); }

test('Turnstile behavior validates success, rejection, action, hostname, timeout, and production configuration', { concurrency: false }, async () => {
  const original = {
    secret: process.env[TURNSTILE_SECRET_KEY_NAME],
    bypass: process.env[TURNSTILE_BYPASS_KEY_NAME],
    node: process.env.NODE_ENV
  };

  try {
    process.env[TURNSTILE_SECRET_KEY_NAME] = 'synthetic-turnstile-secret';
    process.env.NODE_ENV = 'production';
    delete process.env[TURNSTILE_BYPASS_KEY_NAME];
    const options = { expectedAction: 'alerts_subscribe', expectedHostname: 'mmips.com' };

    assert.equal((await verifyTurnstileToken('synthetic-valid', request, { ...options, fetcher: response({ success: true, action: 'alerts_subscribe', hostname: 'mmips.com' }) })).ok, true);
    for (const payload of [
      { success: false },
      { success: false, 'error-codes': ['timeout-or-duplicate'] },
      { success: true, action: 'wrong', hostname: 'mmips.com' },
      { success: true, action: 'alerts_subscribe', hostname: 'foreign.example' }
    ]) assert.equal((await verifyTurnstileToken('synthetic-token', request, { ...options, fetcher: response(payload) })).ok, false);
    assert.equal((await verifyTurnstileToken('synthetic-token', request, { ...options, fetcher: async () => { throw new DOMException('timeout', 'AbortError'); } })).ok, false);

    delete process.env[TURNSTILE_SECRET_KEY_NAME];
    assert.equal((await verifyTurnstileToken('synthetic-token', request, options)).ok, false);
    process.env[TURNSTILE_SECRET_KEY_NAME] = 'synthetic-turnstile-secret';
    assert.equal((await verifyTurnstileToken('synthetic-token', request, { expectedAction: 'alerts_subscribe', fetcher: response({ success: true }) })).ok, false);

    delete process.env[TURNSTILE_SECRET_KEY_NAME];
    process.env[TURNSTILE_BYPASS_KEY_NAME] = 'true';
    process.env.NODE_ENV = 'development';
    assert.deepEqual(await verifyTurnstileToken(null, request, options), { ok: true, skipped: true });
    process.env.NODE_ENV = 'production';
    assert.equal((await verifyTurnstileToken(null, request, options)).ok, false);
    assert.equal(JSON.stringify(process.env).includes('synthetic-valid'), false);
  } finally {
    if (original.secret === undefined) delete process.env[TURNSTILE_SECRET_KEY_NAME];
    else process.env[TURNSTILE_SECRET_KEY_NAME] = original.secret;
    if (original.bypass === undefined) delete process.env[TURNSTILE_BYPASS_KEY_NAME];
    else process.env[TURNSTILE_BYPASS_KEY_NAME] = original.bypass;
    if (original.node === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = original.node;
  }
});
