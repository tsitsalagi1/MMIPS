import { NextRequest, NextResponse } from "next/server";
import { isCrossBorderAlertPayload } from "@/lib/cross-border-alert-contract";
import { verifyCrossBorderAlert } from "@/lib/cross-border-alert-auth";
import { processCrossBorderAlert } from "@/lib/cross-border-alert-delivery";
import { safeApiError } from "@/lib/security/api-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-mmips-alert-signature") || "";
    const payload = await request.json().catch(() => null);
    if (!isCrossBorderAlertPayload(payload) || !verifyCrossBorderAlert(payload, signature)) {
      return NextResponse.json({ ok: false, message: "Invalid relay request." }, { status: 401 });
    }
    const result = await processCrossBorderAlert(payload);
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return safeApiError({
      code: "cross_border_alert_relay_failed",
      message: "Could not process the cross-border alert relay."
    });
  }
}
