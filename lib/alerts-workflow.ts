import {
  canSendConfirmation,
  createConfirmationToken,
  createUnsubscribeTokenId,
  hashAlertToken,
  normalizeEmail,
  normalizePreferences,
  signUnsubscribeToken,
  verifyUnsubscribeToken,
  type AlertEventKind,
  type AlertStore
} from "./alerts-core";

export const ALERT_CONSENT_SOURCE = "urgent_alerts_web";
export const ALERT_CONSENT_TEXT = "urgent_geo_alerts_disclosure_2026-08";
export type WorkflowEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  headers?: Partial<Record<"List-Unsubscribe" | "List-Unsubscribe-Post", string>>;
  idempotencyKey?: string;
};
export type WorkflowEmailResult = {
  ok: boolean;
  skipped: boolean;
  code?: "missing_recipient" | "provider_unconfigured" | "provider_rejected" | "provider_unavailable";
  providerMessageId?: string;
};
export type WorkflowMailer = { send(input: WorkflowEmail): Promise<WorkflowEmailResult> };
export type ConfirmationFactory = (now: Date) => { token: string; hash: string; expiresAt: string };
export type WorkflowDependencies = {
  now?: () => Date;
  mailer: WorkflowMailer;
  siteUrl: string;
  confirmationFactory?: ConfirmationFactory;
  unsubscribeIdFactory?: () => string;
  signingKeys?: readonly string[];
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function paragraphHtml(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("\n");
}

function htmlLink(url: string, label: string) {
  return `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;
}

function listHtml(items: string[]) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

export function validatedSiteUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    throw new Error("alerts_site_url_invalid");
  }
  return url.origin;
}

function confirmationEmail(confirmationUrl: string, alertsUrl: string, unsubscribeUrl?: string) {
  const text = [
    "Thank you for choosing to help your community and support Indigenous families.",
    "",
    "Your attention matters. Responsible sharing of verified, moderator-approved information can help a missing or murdered Indigenous person’s case reach people who may recognize a person, vehicle, area, or circumstance — without spreading rumors or exposing private information.",
    "",
    "CONFIRM YOUR SUBSCRIPTION",
    confirmationUrl,
    ...(unsubscribeUrl ? [
      "",
      "UNSUBSCRIBE / CANCEL THIS REQUEST",
      unsubscribeUrl
    ] : []),
    "",
    "WHAT YOU WILL RECEIVE",
    "• Urgent MMIPS community alerts that match the ZIP code and distance you selected.",
    "• If you chose the all-urgent option, every moderator-approved urgent MMIPS community alert.",
    "• Subscription messages needed to confirm or manage your alerts.",
    "",
    "Every urgent alert will include a link to the approved MMIPS public profile, the official tip/reporting contact for that case, and an unsubscribe link.",
    "",
    "HOW YOU CAN HELP",
    "• Read the approved profile carefully and share the official MMIPS profile or flyer when appropriate.",
    "• Send tips or case information only to the official agency/contact listed in the alert. If someone is in immediate danger, call 911.",
    "• Do not investigate, confront anyone, post unverified accusations, or share private/sensitive locations.",
    "• Encourage trusted people in your community to subscribe to MMIPS alerts:",
    alertsUrl,
    "",
    "PRIVACY AND OPTING OUT",
    "Your ZIP/radius preferences remain private and are used only to decide whether an approved urgent public alert matches the area you chose. MMIPS does not use this subscription to report or investigate a case.",
    "",
    unsubscribeUrl
      ? "If you did not request these alerts, use the unsubscribe/cancel link above or simply do not confirm. No explanation is required."
      : "If you did not request these alerts, do not confirm this subscription. No explanation is required."
  ].join("\n");

  const html = [
    "<p><strong>Thank you for choosing to help your community and support Indigenous families.</strong></p>",
    "<p>Your attention matters. Responsible sharing of verified, moderator-approved information can help a missing or murdered Indigenous person’s case reach people who may recognize a person, vehicle, area, or circumstance — without spreading rumors or exposing private information.</p>",
    "<h2>Confirm your subscription</h2>",
    `<p>${htmlLink(confirmationUrl, "Confirm MMIPS urgent community alerts")}</p>`,
    ...(unsubscribeUrl ? [
      "<h2>Unsubscribe / cancel this request</h2>",
      `<p>${htmlLink(unsubscribeUrl, "Unsubscribe / cancel this alert request")}</p>`
    ] : []),
    "<h2>What you will receive</h2>",
    listHtml([
      "Urgent MMIPS community alerts that match the ZIP code and distance you selected.",
      "If you chose the all-urgent option, every moderator-approved urgent MMIPS community alert.",
      "Subscription messages needed to confirm or manage your alerts."
    ]),
    "<p>Every urgent alert will include a link to the approved MMIPS public profile, the official tip/reporting contact for that case, and an unsubscribe link.</p>",
    "<h2>How you can help</h2>",
    listHtml([
      "Read the approved profile carefully and share the official MMIPS profile or flyer when appropriate.",
      "Send tips or case information only to the official agency/contact listed in the alert. If someone is in immediate danger, call 911.",
      "Do not investigate, confront anyone, post unverified accusations, or share private/sensitive locations."
    ]),
    `<p>Encourage trusted people in your community to subscribe: ${htmlLink(alertsUrl, alertsUrl)}</p>`,
    "<h2>Privacy and opting out</h2>",
    "<p>Your ZIP/radius preferences remain private and are used only to decide whether an approved urgent public alert matches the area you chose. MMIPS does not use this subscription to report or investigate a case.</p>",
    unsubscribeUrl
      ? "<p>If you did not request these alerts, use the unsubscribe/cancel link above or simply do not confirm. No explanation is required.</p>"
      : "<p>If you did not request these alerts, do not confirm this subscription. No explanation is required.</p>"
  ].join("\n");

  return { text, html };
}

export async function requestAlertSubscription(
  store: AlertStore,
  emailInput: unknown,
  prefsInput: unknown,
  dependencies: WorkflowDependencies
) {
  const email = normalizeEmail(emailInput);
  if (!email) return { ok: false as const, code: "invalid_email" as const };

  const now = dependencies.now?.() ?? new Date();
  const existing = await store.findSubscriberByEmail(email);
  const eligibility = canSendConfirmation(existing, now);
  if (!eligibility.send) return { ok: true as const, code: "accepted" as const };

  const confirmation = (dependencies.confirmationFactory ?? createConfirmationToken)(now);
  const subscriber = await store.savePending({
    email,
    consentSource: ALERT_CONSENT_SOURCE,
    consentText: ALERT_CONSENT_TEXT,
    confirmationTokenHash: confirmation.hash,
    confirmationExpiresAt: confirmation.expiresAt,
    unsubscribeTokenId:
      existing?.unsubscribe_token_id ?? (dependencies.unsubscribeIdFactory ?? createUnsubscribeTokenId)(),
    preferences: normalizePreferences(prefsInput),
    requestedAt: now.toISOString(),
    windowStartedAt: eligibility.windowStartedAt!,
    sendCount: eligibility.sendCount!
  });

  const origin = validatedSiteUrl(dependencies.siteUrl);
  const confirmationUrl = `${origin}/alerts/confirm?token=${encodeURIComponent(confirmation.token)}`;
  const signingKey = dependencies.signingKeys?.find((key) => key.length >= 32);
  const unsubscribeToken = signingKey ? signUnsubscribeToken(subscriber.unsubscribe_token_id, signingKey) : null;
  const unsubscribePageUrl = unsubscribeToken
    ? `${origin}/alerts/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`
    : undefined;
  const unsubscribeApiUrl = unsubscribeToken
    ? `${origin}/api/alerts/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`
    : undefined;
  const content = confirmationEmail(confirmationUrl, `${origin}/alerts`, unsubscribePageUrl);
  const result = await dependencies.mailer.send({
    to: email,
    subject: "Confirm MMIPS urgent community alerts — thank you for helping",
    text: content.text,
    html: content.html,
    ...(unsubscribeApiUrl ? {
      headers: {
        "List-Unsubscribe": `<${unsubscribeApiUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
      }
    } : {})
  });
  if (result.ok) await store.markConfirmationSent(subscriber.id, now.toISOString());
  return { ok: true as const, code: "accepted" as const };
}

export async function confirmAlertSubscription(
  store: AlertStore,
  token: unknown,
  dependencies: Pick<WorkflowDependencies, "now" | "mailer">
) {
  if (typeof token === "string" && token.length >= 32 && token.length <= 256) {
    const subscriber = await store.activateByConfirmationHash(
      hashAlertToken(token),
      dependencies.now?.() ?? new Date()
    );
    if (subscriber) {
      const text = [
        "Thank you for helping your community. Your MMIPS urgent community alerts subscription is confirmed.",
        "",
        "MMIPS will use your private ZIP/radius preference only to match moderator-approved urgent public alerts. Each alert will include the approved MMIPS profile, the official tip/reporting contact, and an unsubscribe link.",
        "",
        "When an alert arrives, you can help by reading and responsibly sharing the approved profile. Send any tips only to the official contact listed in that alert. If someone is in immediate danger, call 911. Do not send tips to MMIPS or reply to an alert with case information.",
        "",
        "You can unsubscribe from any future alert with one click."
      ].join("\n");
      await dependencies.mailer.send({
        to: subscriber.email_normalized,
        subject: "MMIPS urgent alerts confirmed — thank you for helping",
        text,
        html: paragraphHtml(text)
      });
    }
  }
  return { ok: true as const, code: "confirmation_processed" as const };
}

export async function unsubscribeFromAlerts(
  store: AlertStore,
  token: unknown,
  dependencies: Pick<WorkflowDependencies, "now" | "signingKeys">
) {
  const id = verifyUnsubscribeToken(token, dependencies.signingKeys ?? []);
  if (id) await store.unsubscribeByTokenId(id, dependencies.now?.() ?? new Date());
  return { ok: true as const, code: "unsubscribe_processed" as const };
}

function safePublicUrl(value: string, site: string) {
  const url = new URL(value);
  const allowed = new URL(validatedSiteUrl(site));
  if (
    url.protocol !== "https:" ||
    url.origin !== allowed.origin ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error("alerts_public_url_invalid");
  }
  if (url.pathname.startsWith("/cases/")) {
    url.pathname = url.pathname.replace(/^\/cases\//, "/profiles/");
  }
  if (!url.pathname.startsWith("/profiles/")) throw new Error("alerts_public_url_invalid");
  return url.toString();
}

function safeContact(value?: string) {
  const contact = (value ?? "See the approved MMIPS profile for the official case contact.")
    .trim()
    .replace(/[\r\n]+/g, " ")
    .slice(0, 500);
  return contact || "See the approved MMIPS profile for the official case contact.";
}

export function buildPublicAlertEmail(input: {
  title: string;
  publicUrl: string;
  publicMapLabel?: string;
  tipContact?: string;
  leadAgency?: string | null;
  unsubscribeTokenId: string;
  signingKey: string;
  deliveryKey: string;
  siteUrl: string;
}) {
  const origin = validatedSiteUrl(input.siteUrl);
  const token = signUnsubscribeToken(input.unsubscribeTokenId, input.signingKey);
  const unsubscribeUrl = `${origin}/api/alerts/unsubscribe?token=${encodeURIComponent(token)}`;
  const publicUrl = safePublicUrl(input.publicUrl, origin);
  const safeTitle = input.title.trim().slice(0, 160) || "Approved public profile";
  const safeArea =
    input.publicMapLabel?.trim().replace(/[\r\n]+/g, " ").slice(0, 200) || "See approved profile";
  const tipContact = safeContact(input.tipContact);
  const leadAgency =
    input.leadAgency?.trim().replace(/[\r\n]+/g, " ").slice(0, 160) || "Official case contact";
  const alertsUrl = `${origin}/alerts`;

  const text = [
    "URGENT MMIPS COMMUNITY ALERT",
    safeTitle,
    "",
    `Approved public-awareness area: ${safeArea}`,
    "",
    `View the approved MMIPS public profile: ${publicUrl}`,
    "",
    "IF YOU HAVE INFORMATION",
    `${leadAgency}: ${tipContact}`,
    "If someone is in immediate danger, call 911.",
    "Do not send tips to MMIPS and do not reply to this email with case information.",
    "",
    "HOW YOU CAN HELP",
    "• Read the approved profile carefully and share the official MMIPS profile or flyer when appropriate.",
    "• Keep information accurate. Do not post rumors, unverified accusations, or private/sensitive locations.",
    "• Do not investigate or confront anyone yourself.",
    `• Encourage others who want to help responsibly to subscribe: ${alertsUrl}`,
    "",
    "WHY YOU RECEIVED THIS",
    "You confirmed MMIPS urgent community alerts, and this moderator-approved alert matched your saved alert preferences.",
    "",
    "Unsubscribe from future MMIPS alerts:",
    unsubscribeUrl
  ].join("\n");

  const html = [
    "<p><strong>URGENT MMIPS COMMUNITY ALERT</strong></p>",
    `<h1>${escapeHtml(safeTitle)}</h1>`,
    `<p><strong>Approved public-awareness area:</strong> ${escapeHtml(safeArea)}</p>`,
    `<p>${htmlLink(publicUrl, "View the approved MMIPS public profile")}</p>`,
    "<h2>If you have information</h2>",
    `<p><strong>${escapeHtml(leadAgency)}:</strong> ${escapeHtml(tipContact)}</p>`,
    "<p>If someone is in immediate danger, call 911.</p>",
    "<p><strong>Do not send tips to MMIPS and do not reply to this email with case information.</strong></p>",
    "<h2>How you can help</h2>",
    listHtml([
      "Read the approved profile carefully and share the official MMIPS profile or flyer when appropriate.",
      "Keep information accurate. Do not post rumors, unverified accusations, or private/sensitive locations.",
      "Do not investigate or confront anyone yourself."
    ]),
    `<p>Encourage others who want to help responsibly to subscribe: ${htmlLink(alertsUrl, alertsUrl)}</p>`,
    "<h2>Why you received this</h2>",
    "<p>You confirmed MMIPS urgent community alerts, and this moderator-approved alert matched your saved alert preferences.</p>",
    `<p>${htmlLink(unsubscribeUrl, "Unsubscribe from future MMIPS alerts")}</p>`
  ].join("\n");

  return {
    subject: `URGENT MMIPS community alert — ${safeTitle}`.slice(0, 190),
    text,
    html,
    unsubscribeUrl,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
    } as const,
    idempotencyKey: `alert-${hashAlertToken(input.deliveryKey).slice(7, 39)}`
  };
}

export async function prepareApprovedPublicAlertDelivery(
  store: AlertStore,
  event: {
    key: string;
    kind: AlertEventKind;
    title: string;
    publicUrl: string;
    approved: boolean;
    published: boolean;
    hidden?: boolean;
    removed?: boolean;
  }
) {
  if (!event.approved || !event.published || event.hidden || event.removed) {
    return { queued: 0, skipped: "not_public_safe" as const };
  }
  let queued = 0;
  for (const subscriber of await store.activeSubscribers()) {
    if (
      subscriber.status === "active" &&
      (await store.claimDelivery({ subscriberId: subscriber.id, alertEventKey: event.key }))
    ) {
      queued++;
    }
  }
  return { queued, skipped: null };
}

export async function sendClaimedAlert(
  store: AlertStore,
  delivery: { id: string },
  message: WorkflowEmail,
  mailer: WorkflowMailer
) {
  const result = await mailer.send(message);
  if (result.ok) {
    await store.updateDelivery(delivery.id, "sent", { providerMessageId: result.providerMessageId });
  } else {
    await store.updateDelivery(
      delivery.id,
      result.code === "provider_rejected" ? "failed_final" : "failed_retryable",
      { failureCode: result.code ?? "provider_unavailable" }
    );
  }
  return result;
}
