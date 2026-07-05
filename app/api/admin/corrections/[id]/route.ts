import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> | { id: string } };

export async function PATCH(request: Request, context: Params) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;

    const params = await context.params;
    const id = params.id;
    const body = await request.json().catch(() => ({}));
    const action = String(body.action || "");
    const moderatorNotes = String(body.moderator_notes || "").trim() || null;

    const allowed = new Set(["needs_more_info", "approved", "rejected", "hidden"]);
    if (!allowed.has(action)) {
      return NextResponse.json({ ok: false, message: "Unknown correction-request action." }, { status: 400 });
    }

    const { data: requestRow, error: loadError } = await admin.supabase
      .from("correction_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (loadError || !requestRow) {
      return NextResponse.json({ ok: false, message: "Correction request not found." }, { status: 404 });
    }

    const details = moderatorNotes
      ? `${requestRow.request_details || ""}\n\n--- Moderator note (${new Date().toISOString()}) ---\n${moderatorNotes}`
      : requestRow.request_details;

    const { error } = await admin.supabase
      .from("correction_requests")
      .update({ review_status: action, request_details: details })
      .eq("id", id);
    if (error) throw error;

    await admin.supabase.from("audit_log").insert({
      actor_id: admin.user.id,
      action: `correction_request_${action}`,
      entity_type: "correction_requests",
      entity_id: id,
      reason: moderatorNotes,
      metadata: { case_id: requestRow.case_id, request_type: requestRow.request_type }
    });

    return NextResponse.json({ ok: true, message: `Correction/removal request marked ${action.replaceAll("_", " ")}.` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Correction request action failed.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
