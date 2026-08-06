import { createClient } from "@supabase/supabase-js";
import { sendTransactionalEmail, siteUrl, type EmailResult } from "@/lib/email";
import { type AlertStore } from "./alerts-core";
import * as workflow from "./alerts-workflow";
export * from "./alerts-core";
export { buildPublicAlertEmail, prepareApprovedPublicAlertDelivery, sendClaimedAlert, validatedSiteUrl } from "./alerts-workflow";

export type AlertMailer = { send(input: Parameters<typeof sendTransactionalEmail>[0]): Promise<EmailResult> };
const productionMailer: AlertMailer = { send: sendTransactionalEmail };
export const ALERT_CONSENT_SOURCE = workflow.ALERT_CONSENT_SOURCE;
export const ALERT_CONSENT_TEXT = workflow.ALERT_CONSENT_TEXT;
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
      const values = { email: input.email, email_normalized: input.email, status: "pending", consent_source: input.consentSource, consent_text: input.consentText, consent_at: input.requestedAt, subscription_requested_at: input.requestedAt, confirmation_token_hash: input.confirmationTokenHash, confirmation_expires_at: input.confirmationExpiresAt, unsubscribe_token_id: current?.unsubscribe_token_id ?? input.unsubscribeTokenId, unsubscribe_token_version: 1, preferences: input.preferences, confirmation_window_started_at: input.windowStartedAt, confirmation_send_count: input.sendCount, confirmed_at: null, unsubscribed_at: null, updated_at: input.requestedAt };
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
  return workflow.requestAlertSubscription(store, emailInput, prefsInput, { now: dependencies.now ? () => dependencies.now! : undefined, mailer: dependencies.mailer ?? productionMailer, siteUrl: siteUrl() });
}
export async function confirmAlertSubscription(store: AlertStore, token: unknown, now = new Date(), mailer: AlertMailer = productionMailer) {
  return workflow.confirmAlertSubscription(store, token, { now: () => now, mailer });
}
export async function unsubscribeFromAlerts(store: AlertStore, token: unknown, now = new Date(), keys = unsubscribeSigningKeys()) { return workflow.unsubscribeFromAlerts(store, token, { now: () => now, signingKeys: keys }); }
