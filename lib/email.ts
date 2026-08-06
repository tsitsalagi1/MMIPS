export type EmailInput = {
  to: string | null | undefined;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  headers?: Partial<Record<"List-Unsubscribe" | "List-Unsubscribe-Post", string>>;
  idempotencyKey?: string;
};
export type EmailResult = { ok: boolean; skipped: boolean; code?: "missing_recipient" | "provider_unconfigured" | "provider_rejected" | "provider_unavailable"; providerMessageId?: string };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function paragraphHtml(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("\n");
}

export async function sendTransactionalEmail({ to, subject, text, html, replyTo, headers, idempotencyKey }: EmailInput): Promise<EmailResult> {
  const recipient = typeof to === "string" ? to.trim() : "";
  if (!recipient) return { ok: false, skipped: true, code: "missing_recipient" };

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "MMIPS <notifications@mmips.com>";
  const defaultReplyTo = process.env.EMAIL_REPLY_TO || "contact@mmips.com";

  if (!apiKey) {
    console.info("MMIPS email not sent because RESEND_API_KEY is not configured.", { reason: "missing_resend_api_key", hasRecipient: Boolean(recipient), subjectLength: subject.length });
    return { ok: false, skipped: true, code: "provider_unconfigured" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey.slice(0, 256) } : {})
    },
    body: JSON.stringify({
      from,
      to: recipient,
      subject,
      text,
      html: html || paragraphHtml(text),
      reply_to: replyTo || defaultReplyTo,
      headers: headers ? Object.fromEntries(Object.entries(headers).filter(([name, value]) => ["List-Unsubscribe", "List-Unsubscribe-Post"].includes(name) && typeof value === "string" && value.length <= 1000)) : undefined
    })
  });

  if (!response.ok) {
    await response.text().catch(() => "");
    console.error("MMIPS email send failed.", { code: "email_provider_non_2xx", status: response.status });
    return { ok: false, skipped: false, code: response.status >= 500 ? "provider_unavailable" : "provider_rejected" };
  }
  const payload = await response.json().catch(() => null) as { id?: unknown } | null;
  const providerMessageId = typeof payload?.id === "string" && /^[A-Za-z0-9_-]{1,200}$/.test(payload.id) ? payload.id : undefined;
  return { ok: true, skipped: false, providerMessageId };
}

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://mmips.com";
}
