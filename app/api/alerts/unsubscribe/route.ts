import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAlertStore, unsubscribeFromAlerts } from "@/lib/alerts";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const store = createSupabaseAlertStore();
  if (store) { try { await unsubscribeFromAlerts(store, request.nextUrl.searchParams.get("token")); } catch {} }
  return NextResponse.redirect(new URL("/alerts/unsubscribed", request.url));
}
