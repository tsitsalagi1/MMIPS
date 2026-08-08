import assert from 'node:assert/strict';
import test from 'node:test';
import { hashAlertToken } from '../../.test-dist/lib/alerts-core.js';
import { buildPublicAlertEmail, requestAlertSubscription } from '../../.test-dist/lib/alerts-workflow.js';

const KEY = 'synthetic-alert-signing-key-00000000000000000000';
const UNSUB_ID = 'synthetic_unsubscribe_identifier_00000000000000';
const CONFIRMATION = 'synthetic_confirmation_token_000000000000000000';

class ConfirmationStore {
  async findSubscriberByEmail() { return null; }
  async savePending(input) {
    return {
      id: 'synthetic-subscriber',
      email_normalized: input.email,
      status: 'pending',
      confirmation_token_hash: input.confirmationTokenHash,
      confirmation_expires_at: input.confirmationExpiresAt,
      unsubscribe_token_id: input.unsubscribeTokenId,
      unsubscribe_token_version: 1,
      preferences: input.preferences,
      confirmation_last_sent_at: null,
      confirmation_window_started_at: input.windowStartedAt,
      confirmation_send_count: input.sendCount
    };
  }
  async markConfirmationSent() {}
}

test('confirmation email thanks the subscriber and explains alerts, community help, privacy, and opt-out', async () => {
  const sent = [];
  await requestAlertSubscription(new ConfirmationStore(), 'helper@example.test', {
    homeZip: '74464',
    radiusMiles: 50,
    homeLatitude: 35.915,
    homeLongitude: -94.969,
    geographySource: 'synthetic-zcta'
  }, {
    now: () => new Date('2026-08-08T18:00:00.000Z'),
    siteUrl: 'https://mmips.com',
    confirmationFactory: () => ({
      token: CONFIRMATION,
      hash: hashAlertToken(CONFIRMATION),
      expiresAt: '2026-08-10T18:00:00.000Z'
    }),
    unsubscribeIdFactory: () => UNSUB_ID,
    mailer: {
      async send(message) {
        sent.push(message);
        return { ok: true, skipped: false, providerMessageId: 'synthetic-message' };
      }
    }
  });

  assert.equal(sent.length, 1);
  const email = sent[0];
  assert.match(email.subject, /thank you for helping/i);
  assert.match(email.text, /Thank you for choosing to help your community and support Indigenous families/);
  assert.match(email.text, /WHAT YOU WILL RECEIVE/);
  assert.match(email.text, /HOW YOU CAN HELP/);
  assert.match(email.text, /official tip\/reporting contact/);
  assert.match(email.text, /If someone is in immediate danger, call 911/);
  assert.match(email.text, /Do not investigate, confront anyone, post unverified accusations/);
  assert.match(email.text, /one-click unsubscribe option/);
  assert.match(email.text, /https:\/\/mmips\.com\/alerts/);
  assert.match(email.html, /Confirm MMIPS urgent community alerts/);
});

test('urgent alert email contains canonical profile link, official reporting contact, safe-help guidance, and one-click unsubscribe', () => {
  const email = buildPublicAlertEmail({
    title: 'MMIPS TEST PERSON COMMUNITY ALERT',
    publicUrl: 'https://mmips.com/profiles/mmips-test-person',
    publicMapLabel: 'Tahlequah area',
    tipContact: 'Cherokee Nation Marshal Service: 918-555-0100',
    leadAgency: 'Cherokee Nation Marshal Service',
    unsubscribeTokenId: UNSUB_ID,
    signingKey: KEY,
    deliveryKey: 'synthetic-delivery',
    siteUrl: 'https://mmips.com'
  });

  assert.match(email.subject, /^URGENT MMIPS community alert/);
  assert.match(email.text, /https:\/\/mmips\.com\/profiles\/mmips-test-person/);
  assert.match(email.text, /Approved public-awareness area: Tahlequah area/);
  assert.match(email.text, /Cherokee Nation Marshal Service/);
  assert.match(email.text, /918-555-0100/);
  assert.match(email.text, /Do not send tips to MMIPS/);
  assert.match(email.text, /If someone is in immediate danger, call 911/);
  assert.match(email.text, /Do not investigate or confront anyone yourself/);
  assert.match(email.text, /Unsubscribe from future MMIPS alerts/);
  assert.equal(email.headers['List-Unsubscribe-Post'], 'List-Unsubscribe=One-Click');
});

test('legacy case URLs are canonicalized to profiles in outgoing alert email', () => {
  const email = buildPublicAlertEmail({
    title: 'Synthetic approved alert',
    publicUrl: 'https://mmips.com/cases/legacy-slug',
    publicMapLabel: 'Approved area',
    tipContact: 'Official agency: 555-0100',
    unsubscribeTokenId: UNSUB_ID,
    signingKey: KEY,
    deliveryKey: 'synthetic-legacy-delivery',
    siteUrl: 'https://mmips.com'
  });
  assert.match(email.text, /https:\/\/mmips\.com\/profiles\/legacy-slug/);
  assert.doesNotMatch(email.text, /mmips\.com\/cases\/legacy-slug/);
});
