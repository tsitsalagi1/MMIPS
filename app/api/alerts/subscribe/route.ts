import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAlertStore, MAX_ALERT_REQUEST_BYTES, requestAlertSubscription } from "@/lib/alerts";
import { verifyTurnstileToken } from "@/lib/security/turnstile";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const length = Number(request.headers.get("content-length") || "0");
  if (length > MAX_ALERT_REQUEST_BYTES) return NextResponse.json({ ok: false, code: "request_too_large", message: "We could not process that request. Please check the email field and try again." }, { status: 413 });
  let body: { email?: unknown; preferences?: unknown; turnstileToken?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, code: "invalid_request", message: "We could not process that request. Please check the email field and try again." }, { status: 400 }); }
  const turnstile = await verifyTurnstileToken(typeof body.turnstileToken === "string" ? body.turnstileToken : null, request, { expectedAction: "alerts_subscribe", expectedHostname: process.env.TURNSTILE_EXPECTED_HOSTNAME });
  if (!turnstile.ok) return NextResponse.json({ ok: false, code: "abuse_check_failed", message: "We could not process that request right now. Please try again later." }, { status: 400 });
  const store = createSupabaseAlertStore();
  if (!store) return NextResponse.json({ ok: false, code: "alerts_unavailable", message: "Email alerts are not available right now. Please try again later." }, { status: 503 });
  try {
    const result = await requestAlertSubscription(store, body.email, body.preferences);
    if (!result.ok) return NextResponse.json({ ok: false, code: result.code, message: "Enter a valid email address." }, { status: 400 });
    return NextResponse.json({ ok: true, code: "accepted", message: "If this email can receive MMIPS alerts, a confirmation message will be sent." });
  } catch {
    return NextResponse.json({ ok: false, code: "alerts_request_failed", message: "We could not process that request right now. Please try again later." }, { status: 500 });
  }
}
