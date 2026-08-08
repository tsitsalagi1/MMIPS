import { canSendConfirmation, createConfirmationToken, createUnsubscribeTokenId, hashAlertToken, normalizeEmail, normalizePreferences, signUnsubscribeToken, verifyUnsubscribeToken, type AlertEventKind, type AlertStore } from "./alerts-core";

export const ALERT_CONSENT_SOURCE = "urgent_alerts_web";
export const ALERT_CONSENT_TEXT = "urgent_geo_alerts_disclosure_2026-08";
export type WorkflowEmail = { to: string; subject: string; text: string; html: string; headers?: Partial<Record<"List-Unsubscribe" | "List-Unsubscribe-Post", string>>; idempotencyKey?: string };
export type WorkflowEmailResult = { ok: boolean; skipped: boolean; code?: "missing_recipient" | "provider_unconfigured" | "provider_rejected" | "provider_unavailable"; providerMessageId?: string };
export type WorkflowMailer = { send(input: WorkflowEmail): Promise<WorkflowEmailResult> };
export type ConfirmationFactory = (now: Date) => { token: string; hash: string; expiresAt: string };
export type WorkflowDependencies = { now?: () => Date; mailer: WorkflowMailer; siteUrl: string; confirmationFactory?: ConfirmationFactory; unsubscribeIdFactory?: () => string; signingKeys?: readonly string[] };

function escapeHtml(value: string) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
function paragraphHtml(text: string) { return text.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => `<p>${escapeHtml(line)}</p>`).join("\n"); }
export function validatedSiteUrl(value: string) { const url = new URL(value); if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) throw new Error("alerts_site_url_invalid"); return url.origin; }

export async function requestAlertSubscription(store: AlertStore, emailInput: unknown, prefsInput: unknown, dependencies: WorkflowDependencies) {
  const email = normalizeEmail(emailInput); if (!email) return { ok: false as const, code: "invalid_email" as const };
  const now = dependencies.now?.() ?? new Date(), existing = await store.findSubscriberByEmail(email), eligibility = canSendConfirmation(existing, now);
  if (!eligibility.send) return { ok: true as const, code: "accepted" as const };
  const confirmation = (dependencies.confirmationFactory ?? createConfirmationToken)(now);
  const subscriber = await store.savePending({ email, consentSource: ALERT_CONSENT_SOURCE, consentText: ALERT_CONSENT_TEXT, confirmationTokenHash: confirmation.hash, confirmationExpiresAt: confirmation.expiresAt, unsubscribeTokenId: existing?.unsubscribe_token_id ?? (dependencies.unsubscribeIdFactory ?? createUnsubscribeTokenId)(), preferences: normalizePreferences(prefsInput), requestedAt: now.toISOString(), windowStartedAt: eligibility.windowStartedAt!, sendCount: eligibility.sendCount! });
  const origin = validatedSiteUrl(dependencies.siteUrl), confirmationUrl = `${origin}/alerts/confirm?token=${encodeURIComponent(confirmation.token)}`;
  const text = `Please confirm your MMIPS urgent community alerts subscription: ${confirmationUrl}\n\nYour ZIP/radius preferences remain private and are used only to decide whether an approved urgent public alert falls within the area you chose. Subscribing does not report a case or ask MMIPS to investigate. If you did not request this, ignore this message.`;
  const result = await dependencies.mailer.send({ to: email, subject: "Confirm MMIPS urgent community alerts", text, html: paragraphHtml(text) });
  if (result.ok) await store.markConfirmationSent(subscriber.id, now.toISOString());
  return { ok: true as const, code: "accepted" as const };
}

export async function confirmAlertSubscription(store: AlertStore, token: unknown, dependencies: Pick<WorkflowDependencies, "now" | "mailer">) {
  if (typeof token === "string" && token.length >= 32 && token.length <= 256) {
    const subscriber = await store.activateByConfirmationHash(hashAlertToken(token), dependencies.now?.() ?? new Date());
    if (subscriber) { const text = "Your MMIPS urgent community alerts subscription is confirmed. MMIPS will use your private ZIP/radius preference only for approved public alert matching. Every alert includes an unsubscribe link."; await dependencies.mailer.send({ to: subscriber.email_normalized, subject: "MMIPS urgent alerts confirmed", text, html: paragraphHtml(text) }); }
  }
  return { ok: true as const, code: "confirmation_processed" as const };
}
export async function unsubscribeFromAlerts(store: AlertStore, token: unknown, dependencies: Pick<WorkflowDependencies, "now" | "signingKeys">) { const id = verifyUnsubscribeToken(token, dependencies.signingKeys ?? []); if (id) await store.unsubscribeByTokenId(id, dependencies.now?.() ?? new Date()); return { ok: true as const, code: "unsubscribe_processed" as const }; }

function safePublicUrl(value: string, site: string) { const url = new URL(value), allowed = new URL(validatedSiteUrl(site)); if (url.protocol !== "https:" || url.origin !== allowed.origin || !url.pathname.startsWith("/cases/") || url.username || url.password) throw new Error("alerts_public_url_invalid"); return url.toString(); }
export function buildPublicAlertEmail(input: { title: string; publicUrl: string; unsubscribeTokenId: string; signingKey: string; deliveryKey: string; siteUrl: string }) {
  const origin = validatedSiteUrl(input.siteUrl), token = signUnsubscribeToken(input.unsubscribeTokenId, input.signingKey), unsubscribeUrl = `${origin}/api/alerts/unsubscribe?token=${encodeURIComponent(token)}`, publicUrl = safePublicUrl(input.publicUrl, origin), safeTitle = input.title.slice(0, 160);
  const text = `MMIPS public alert: ${safeTitle}\n\nView the approved public profile or update: ${publicUrl}\n\nThis message contains moderator-approved public information only.\n\nUnsubscribe: ${unsubscribeUrl}`;
  return { subject: "MMIPS public alert", text, html: paragraphHtml(text), unsubscribeUrl, headers: { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } as const, idempotencyKey: `alert-${hashAlertToken(input.deliveryKey).slice(7, 39)}` };
}
export async function prepareApprovedPublicAlertDelivery(store: AlertStore, event: { key: string; kind: AlertEventKind; title: string; publicUrl: string; approved: boolean; published: boolean; hidden?: boolean; removed?: boolean }) { if (!event.approved || !event.published || event.hidden || event.removed) return { queued: 0, skipped: "not_public_safe" as const }; let queued = 0; for (const subscriber of await store.activeSubscribers()) { if (subscriber.status === "active" && await store.claimDelivery({ subscriberId: subscriber.id, alertEventKey: event.key })) queued++; } return { queued, skipped: null }; }
export async function sendClaimedAlert(store: AlertStore, delivery: { id: string }, message: WorkflowEmail, mailer: WorkflowMailer) { const result = await mailer.send(message); if (result.ok) await store.updateDelivery(delivery.id, "sent", { providerMessageId: result.providerMessageId }); else await store.updateDelivery(delivery.id, result.code === "provider_rejected" ? "failed_final" : "failed_retryable", { failureCode: result.code ?? "provider_unavailable" }); return result; }
