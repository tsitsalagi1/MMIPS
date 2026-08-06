import { NextRequest, NextResponse } from "next/server";
import { confirmAlertSubscription, createSupabaseAlertStore } from "@/lib/alerts";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const store = createSupabaseAlertStore();
  if (store) { try { await confirmAlertSubscription(store, request.nextUrl.searchParams.get("token")); } catch {} }
  return NextResponse.redirect(new URL("/alerts/confirmed", request.url));
}
