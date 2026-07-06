type EmailInput = {
  to: string | null | undefined;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

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

export async function sendTransactionalEmail({ to, subject, text, html, replyTo }: EmailInput) {
  const recipient = typeof to === "string" ? to.trim() : "";
  if (!recipient) return { ok: false, skipped: true, reason: "No recipient email address." };

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "MMIPS <notifications@mmips.com>";
  const defaultReplyTo = process.env.EMAIL_REPLY_TO || "contact@mmips.com";

  if (!apiKey) {
    console.info("MMIPS email not sent because RESEND_API_KEY is not configured.", { to: recipient, subject });
    return { ok: false, skipped: true, reason: "RESEND_API_KEY not configured." };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: recipient,
      subject,
      text,
      html: html || paragraphHtml(text),
      reply_to: replyTo || defaultReplyTo
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("MMIPS email send failed.", { to: recipient, subject, status: response.status, body });
    return { ok: false, skipped: false, reason: `Email provider returned ${response.status}.` };
  }

  return { ok: true, skipped: false };
}

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://mmips.com";
}
