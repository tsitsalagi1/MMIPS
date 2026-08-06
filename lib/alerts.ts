import { createClient } from "@supabase/supabase-js";
import { paragraphHtml, sendTransactionalEmail, siteUrl } from "@/lib/email";
import { createAlertTokens, hashAlertToken, normalizeEmail, normalizePreferences, type AlertEventKind, type AlertSubscriberRecord, type AlertStore } from "./alerts-core";
export { ALERT_CONFIRMATION_TTL_HOURS, ALERT_TOKEN_BYTES, MAX_ALERT_REQUEST_BYTES, createAlertTokens, hashAlertToken, normalizeEmail, normalizePreferences } from "./alerts-core";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function createSupabaseAlertStore(): AlertStore | null {
  const client = supabaseAdmin();
  if (!client) return null;
  return {
    async findSubscriberByEmail(email) {
      const { data, error } = await client.from("alert_subscribers").select("id,email_normalized,status,confirmation_token_hash,confirmation_expires_at,unsubscribe_token_hash,preferences").eq("email_normalized", email).maybeSingle();
      if (error) throw new Error("alerts_db_lookup_failed");
      return data as AlertSubscriberRecord | null;
    },
    async upsertPendingSubscription(input) {
      const { data, error } = await client.from("alert_subscribers").upsert({
        email_normalized: input.email,
        status: "pending",
        confirmation_token_hash: input.confirmationTokenHash,
        confirmation_expires_at: input.confirmationExpiresAt,
        unsubscribe_token_hash: input.unsubscribeTokenHash,
        preferences: input.preferences,
        confirmed_at: null,
        unsubscribed_at: null,
        updated_at: new Date().toISOString()
      }, { onConflict: "email_normalized" }).select("id,email_normalized,status,confirmation_token_hash,confirmation_expires_at,unsubscribe_token_hash,preferences").single();
      if (error) throw new Error("alerts_db_upsert_failed");
      return data as AlertSubscriberRecord;
    },
    async activateByConfirmationHash(hash, now) {
      const { data: row, error } = await client.from("alert_subscribers").select("id,email_normalized,status,confirmation_token_hash,confirmation_expires_at,unsubscribe_token_hash,preferences").eq("confirmation_token_hash", hash).eq("status", "pending").gt("confirmation_expires_at", now.toISOString()).maybeSingle();
      if (error) throw new Error("alerts_db_confirm_lookup_failed");
      if (!row) return null;
      const { data, error: updateError } = await client.from("alert_subscribers").update({ status: "active", confirmation_token_hash: null, confirmation_expires_at: null, confirmed_at: now.toISOString(), updated_at: now.toISOString() }).eq("id", row.id).eq("status", "pending").select("id,email_normalized,status,confirmation_token_hash,confirmation_expires_at,unsubscribe_token_hash,preferences").single();
      if (updateError) throw new Error("alerts_db_confirm_failed");
      return data as AlertSubscriberRecord;
    },
    async unsubscribeByHash(hash, now) {
      const { error } = await client.from("alert_subscribers").update({ status: "unsubscribed", unsubscribed_at: now.toISOString(), updated_at: now.toISOString(), confirmation_token_hash: null, confirmation_expires_at: null }).eq("unsubscribe_token_hash", hash).in("status", ["pending", "active"]);
      if (error) throw new Error("alerts_db_unsubscribe_failed");
      return true;
    },
    async activeSubscribers() {
      const { data, error } = await client.from("alert_subscribers").select("id,email_normalized,status,confirmation_token_hash,confirmation_expires_at,unsubscribe_token_hash,preferences").eq("status", "active");
      if (error) throw new Error("alerts_db_active_lookup_failed");
      return data as AlertSubscriberRecord[];
    },
    async hasDelivery(subscriberId, alertEventKey) {
      const { data, error } = await client.from("alerts_sent").select("id").eq("subscriber_id", subscriberId).eq("alert_event_key", alertEventKey).maybeSingle();
      if (error) throw new Error("alerts_db_delivery_lookup_failed");
      return Boolean(data);
    },
    async recordDelivery(input) {
      const { error } = await client.from("alerts_sent").insert({ subscriber_id: input.subscriberId, alert_event_key: input.alertEventKey, status: input.status, provider_message_id: input.providerMessageId ?? null, failure_code: input.failureCode ?? null });
      if (error) throw new Error("alerts_db_delivery_insert_failed");
    }
  };
}

export async function requestAlertSubscription(store: AlertStore, emailInput: unknown, prefsInput?: unknown) {
  const email = normalizeEmail(emailInput);
  if (!email) return { ok: false as const, code: "invalid_email" };
  const existing = await store.findSubscriberByEmail(email);
  if (existing?.status === "active" || existing?.status === "suppressed") return { ok: true as const, code: "accepted" };
  const tokens = createAlertTokens();
  await store.upsertPendingSubscription({ email, confirmationTokenHash: tokens.confirmationTokenHash, confirmationExpiresAt: tokens.confirmationExpiresAt, unsubscribeTokenHash: tokens.unsubscribeTokenHash, preferences: normalizePreferences(prefsInput) });
  const confirmUrl = `${siteUrl()}/api/alerts/confirm?token=${encodeURIComponent(tokens.confirmationToken)}`;
  await sendAlertConfirmationEmail(email, confirmUrl);
  return { ok: true as const, code: "accepted" };
}

export async function confirmAlertSubscription(store: AlertStore, token: unknown, now = new Date()) {
  if (typeof token !== "string" || token.length < 32 || token.length > 256) return { ok: true as const, code: "confirmation_processed" };
  const subscriber = await store.activateByConfirmationHash(hashAlertToken(token), now);
  if (subscriber) await sendAlertConfirmationSuccessEmail(subscriber.email_normalized);
  return { ok: true as const, code: "confirmation_processed" };
}

export async function unsubscribeFromAlerts(store: AlertStore, token: unknown, now = new Date()) {
  if (typeof token === "string" && token.length >= 32 && token.length <= 256) await store.unsubscribeByHash(hashAlertToken(token), now);
  return { ok: true as const, code: "unsubscribe_processed" };
}

export async function sendAlertConfirmationEmail(to: string, confirmationUrl: string) {
  const text = `Please confirm your MMIPS email alerts subscription by opening this link: ${confirmationUrl}\n\nSubscribing does not report a case, send a tip, or ask MMIPS to investigate. Your email is kept private. If you did not request this, you can ignore this message.`;
  return sendTransactionalEmail({ to, subject: "Confirm MMIPS email alerts", text, html: paragraphHtml(text) });
}

export async function sendAlertConfirmationSuccessEmail(to: string) {
  const text = "Your MMIPS public email alerts subscription is confirmed. You can unsubscribe from any alert email. MMIPS does not investigate tips; send urgent or official information to the listed agency or official contact.";
  return sendTransactionalEmail({ to, subject: "MMIPS email alerts confirmed", text, html: paragraphHtml(text) });
}

export function buildPublicAlertEmail(input: { title: string; publicUrl: string; unsubscribeToken: string }) {
  const unsubscribeUrl = `${siteUrl()}/api/alerts/unsubscribe?token=${encodeURIComponent(input.unsubscribeToken)}`;
  const safeTitle = input.title.slice(0, 160);
  const text = `MMIPS public alert: ${safeTitle}\n\nView the approved public profile or update: ${input.publicUrl}\n\nThis alert contains only moderator-approved public information. MMIPS does not investigate tips.\n\nUnsubscribe: ${unsubscribeUrl}`;
  return { subject: "MMIPS public alert", text, html: paragraphHtml(text), unsubscribeUrl };
}

export async function prepareApprovedPublicAlertDelivery(store: AlertStore, event: { key: string; kind: AlertEventKind; title: string; publicUrl: string; approved: boolean; published: boolean; hidden?: boolean; removed?: boolean }) {
  if (!event.approved || !event.published || event.hidden || event.removed) return { queued: 0, skipped: "not_public_safe" as const };
  const subscribers = await store.activeSubscribers();
  let queued = 0;
  for (const subscriber of subscribers) {
    if (!subscriber.unsubscribe_token_hash) continue;
    if (subscriber.status !== "active") continue;
    if (await store.hasDelivery(subscriber.id, event.key)) continue;
    await store.recordDelivery({ subscriberId: subscriber.id, alertEventKey: event.key, status: "queued" });
    queued += 1;
  }
  return { queued, skipped: null };
}
