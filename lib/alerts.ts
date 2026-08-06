import { createClient } from "@supabase/supabase-js";
import { paragraphHtml, sendTransactionalEmail, siteUrl, type EmailResult } from "@/lib/email";
import { canSendConfirmation, createConfirmationToken, createUnsubscribeTokenId, hashAlertToken, normalizeEmail, normalizePreferences, signUnsubscribeToken, verifyUnsubscribeToken, type AlertEventKind, type AlertStore } from "./alerts-core";
export * from "./alerts-core";

export type AlertMailer = { send(input: Parameters<typeof sendTransactionalEmail>[0]): Promise<EmailResult> };
const productionMailer: AlertMailer = { send: sendTransactionalEmail };
export const ALERT_CONSENT_SOURCE = "alerts_v1_web";
export const ALERT_CONSENT_TEXT = "alerts_v1_disclosure_2026-08";
const subscriberFields = "id,email_normalized,status,confirmation_token_hash,confirmation_expires_at,unsubscribe_token_id,unsubscribe_token_version,preferences,confirmation_last_sent_at,confirmation_window_started_at,confirmation_send_count";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}
export function unsubscribeSigningKeys() { return [process.env.ALERT_UNSUBSCRIBE_SIGNING_KEY, process.env.ALERT_UNSUBSCRIBE_PREVIOUS_SIGNING_KEY].filter((v): v is string => Boolean(v)); }

export function createSupabaseAlertStore(): AlertStore | null {
  const client = supabaseAdmin(); if (!client) return null;
  return {
    async findSubscriberByEmail(email) { const { data, error } = await client.from("alert_subscribers").select(subscriberFields).eq("email_normalized", email).maybeSingle(); if (error) throw new Error("alerts_db_lookup_failed"); return data; },
    async savePending(input) {
      const current = await this.findSubscriberByEmail(input.email);
      const values = { email: input.email, email_normalized: input.email, status: "pending", consent_source: ALERT_CONSENT_SOURCE, consent_text: ALERT_CONSENT_TEXT, consent_at: input.requestedAt, subscription_requested_at: input.requestedAt, confirmation_token_hash: input.confirmationTokenHash, confirmation_expires_at: input.confirmationExpiresAt, unsubscribe_token_id: current?.unsubscribe_token_id ?? input.unsubscribeTokenId, unsubscribe_token_version: 1, preferences: input.preferences, confirmation_window_started_at: input.windowStartedAt, confirmation_send_count: input.sendCount, confirmed_at: null, unsubscribed_at: null, updated_at: input.requestedAt };
      const { data, error } = await client.from("alert_subscribers").upsert(values, { onConflict: "email_normalized" }).select(subscriberFields).single(); if (error) throw new Error("alerts_db_upsert_failed"); return data;
    },
    async markConfirmationSent(id, sentAt) { const { error } = await client.from("alert_subscribers").update({ confirmation_last_sent_at: sentAt, updated_at: sentAt }).eq("id", id).eq("status", "pending"); if (error) throw new Error("alerts_db_sent_marker_failed"); },
    async activateByConfirmationHash(hash, now) {
      const { data, error } = await client.rpc("confirm_alert_subscription", { token_hash: hash, confirmed_time: now.toISOString() });
      if (error) throw new Error("alerts_db_confirm_failed"); return Array.isArray(data) && data[0] ? data[0] : null;
    },
    async unsubscribeByTokenId(id, now) { const { error } = await client.from("alert_subscribers").update({ status: "unsubscribed", unsubscribed_at: now.toISOString(), opt_out_at: now.toISOString(), email_enabled: false, confirmation_token_hash: null, confirmation_expires_at: null, updated_at: now.toISOString() }).eq("unsubscribe_token_id", id).in("status", ["pending", "active"]); if (error) throw new Error("alerts_db_unsubscribe_failed"); return true; },
    async activeSubscribers() { const { data, error } = await client.from("alert_subscribers").select(subscriberFields).eq("status", "active").eq("email_enabled", true); if (error) throw new Error("alerts_db_active_lookup_failed"); return data ?? []; },
    async claimDelivery(input) { const { data, error } = await client.from("alert_deliveries").upsert({ subscriber_id: input.subscriberId, alert_event_key: input.alertEventKey, delivery_status: "queued", updated_at: new Date().toISOString() }, { onConflict: "subscriber_id,alert_event_key", ignoreDuplicates: true }).select("id,delivery_status").maybeSingle(); if (error) throw new Error("alerts_db_delivery_claim_failed"); return data; },
    async updateDelivery(id, status, details = {}) { const { error } = await client.from("alert_deliveries").update({ delivery_status: status, provider_message_id: details.providerMessageId ?? null, failure_code: details.failureCode ?? null, updated_at: new Date().toISOString() }).eq("id", id).neq("delivery_status", "sent"); if (error) throw new Error("alerts_db_delivery_update_failed"); }
  };
}

export async function requestAlertSubscription(store: AlertStore, emailInput: unknown, prefsInput?: unknown, dependencies: { now?: Date; mailer?: AlertMailer } = {}) {
  const email = normalizeEmail(emailInput); if (!email) return { ok: false as const, code: "invalid_email" };
  const now = dependencies.now ?? new Date(), existing = await store.findSubscriberByEmail(email), eligibility = canSendConfirmation(existing, now);
  if (!eligibility.send) return { ok: true as const, code: "accepted" };
  const confirmation = createConfirmationToken(now);
  const subscriber = await store.savePending({ email, confirmationTokenHash: confirmation.hash, confirmationExpiresAt: confirmation.expiresAt, unsubscribeTokenId: existing?.unsubscribe_token_id ?? createUnsubscribeTokenId(), preferences: normalizePreferences(prefsInput), requestedAt: now.toISOString(), windowStartedAt: eligibility.windowStartedAt!, sendCount: eligibility.sendCount! });
  const result = await sendAlertConfirmationEmail(email, `${siteUrl()}/alerts/confirm?token=${encodeURIComponent(confirmation.token)}`, dependencies.mailer);
  if (result.ok) await store.markConfirmationSent(subscriber.id, now.toISOString());
  return { ok: true as const, code: "accepted" };
}
export async function confirmAlertSubscription(store: AlertStore, token: unknown, now = new Date(), mailer: AlertMailer = productionMailer) {
  if (typeof token === "string" && token.length >= 32 && token.length <= 256) { const subscriber = await store.activateByConfirmationHash(hashAlertToken(token), now); if (subscriber) await sendAlertConfirmationSuccessEmail(subscriber.email_normalized, mailer); }
  return { ok: true as const, code: "confirmation_processed" };
}
export async function unsubscribeFromAlerts(store: AlertStore, token: unknown, now = new Date(), keys = unsubscribeSigningKeys()) { const id = verifyUnsubscribeToken(token, keys); if (id) await store.unsubscribeByTokenId(id, now); return { ok: true as const, code: "unsubscribe_processed" }; }

export function sendAlertConfirmationEmail(to: string, confirmationUrl: string, mailer: AlertMailer = productionMailer) { const text = `Please confirm your MMIPS email alerts subscription: ${confirmationUrl}\n\nSubscribing does not report a case or ask MMIPS to investigate. If you did not request this, ignore this message.`; return mailer.send({ to, subject: "Confirm MMIPS email alerts", text, html: paragraphHtml(text) }); }
export function sendAlertConfirmationSuccessEmail(to: string, mailer: AlertMailer = productionMailer) { const text = "Your MMIPS public email alerts subscription is confirmed. Every alert includes an unsubscribe link."; return mailer.send({ to, subject: "MMIPS email alerts confirmed", text, html: paragraphHtml(text) }); }
function safePublicUrl(value: string) { const url = new URL(value); const allowed = new URL(siteUrl()); if (url.protocol !== "https:" || url.origin !== allowed.origin || !url.pathname.startsWith("/cases/")) throw new Error("alerts_public_url_invalid"); return url.toString(); }
export function buildPublicAlertEmail(input: { title: string; publicUrl: string; unsubscribeTokenId: string; signingKey: string; deliveryKey: string }) {
  const token = signUnsubscribeToken(input.unsubscribeTokenId, input.signingKey), unsubscribeUrl = `${siteUrl()}/api/alerts/unsubscribe?token=${encodeURIComponent(token)}`, publicUrl = safePublicUrl(input.publicUrl), safeTitle = input.title.slice(0, 160);
  const text = `MMIPS public alert: ${safeTitle}\n\nView the approved public profile or update: ${publicUrl}\n\nUnsubscribe: ${unsubscribeUrl}`;
  return { subject: "MMIPS public alert", text, html: paragraphHtml(text), unsubscribeUrl, headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" }, idempotencyKey: `alert-${hashAlertToken(input.deliveryKey).slice(7, 39)}` };
}
export async function prepareApprovedPublicAlertDelivery(store: AlertStore, event: { key: string; kind: AlertEventKind; title: string; publicUrl: string; approved: boolean; published: boolean; hidden?: boolean; removed?: boolean }) { if (!event.approved || !event.published || event.hidden || event.removed) return { queued: 0, skipped: "not_public_safe" as const }; let queued = 0; for (const subscriber of await store.activeSubscribers()) { if (subscriber.status !== "active") continue; if (await store.claimDelivery({ subscriberId: subscriber.id, alertEventKey: event.key })) queued++; } return { queued, skipped: null }; }
