import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAlertStore, MAX_ALERT_REQUEST_BYTES, unsubscribeFromAlerts } from "@/lib/alerts";
export const runtime = "nodejs";
export async function GET(request: NextRequest) { return NextResponse.redirect(new URL(`/alerts/unsubscribe?token=${encodeURIComponent(request.nextUrl.searchParams.get("token") || "")}`, request.url), { status: 303 }); }
export async function POST(request: NextRequest) {
  if (Number(request.headers.get("content-length") || 0) > MAX_ALERT_REQUEST_BYTES) return NextResponse.json({ ok: true, code: "unsubscribe_processed" });
  const token = request.nextUrl.searchParams.get("token");
  const contentType = request.headers.get("content-type") || "";
  let shouldProcess = true;
  if (contentType.includes("application/x-www-form-urlencoded")) shouldProcess = (await request.text()).trim() === "List-Unsubscribe=One-Click";
  else { const body = await request.json().catch(() => ({})) as { token?: unknown }; if (!token && typeof body.token === "string") request.nextUrl.searchParams.set("token", body.token); }
  const store = createSupabaseAlertStore();
  if (store && shouldProcess) try { await unsubscribeFromAlerts(store, request.nextUrl.searchParams.get("token")); } catch {}
  return NextResponse.json({ ok: true, code: "unsubscribe_processed", message: "Your unsubscribe request was processed." }, { status: 200 });
}
