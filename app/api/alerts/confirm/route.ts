import { NextRequest, NextResponse } from "next/server";
import { confirmAlertSubscription, createSupabaseAlertStore, MAX_ALERT_REQUEST_BYTES } from "@/lib/alerts";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (Number(request.headers.get("content-length") || 0) > MAX_ALERT_REQUEST_BYTES) return NextResponse.json({ ok: true, code: "confirmation_processed" });
  const body = await request.json().catch(() => ({})) as { token?: unknown };
  const store = createSupabaseAlertStore();
  if (store) try { await confirmAlertSubscription(store, body.token); } catch {}
  return NextResponse.json({ ok: true, code: "confirmation_processed", message: "Your confirmation request was processed." });
}
