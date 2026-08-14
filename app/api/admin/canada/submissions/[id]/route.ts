import { NextResponse } from "next/server";
import { safeApiError } from "@/lib/security/api-errors";
import { requireAdmin } from "@/lib/supabase/admin";
import { mmipsSiteMode } from "@/lib/site-mode";

export const dynamic = "force-dynamic";

type Body = {
  action?: unknown;
  reason?: unknown;
  slug?: unknown;
  publicSummary?: unknown;
  publicArea?: unknown;
  publicLatitude?: unknown;
  publicLongitude?: unknown;
  publishMap?: unknown;
  safetyConfirmed?: unknown;
};

function cleanText(value: unknown, max = 5000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (mmipsSiteMode() !== "ca") return NextResponse.json({ ok: false, message: "Canada admin API only." }, { status: 404 });
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;
    const { id } = await context.params;
    const body = await request.json() as Body;
    const action = cleanText(body.action, 40);
    const reason = cleanText(body.reason, 2000);

    if (reason.length < 12) {
      return NextResponse.json({ ok: false, message: "Document a moderation reason of at least 12 characters." }, { status: 400 });
    }

    if (action === "mark_urgent") {
      const { data: submission, error: submissionError } = await admin.supabase
        .from("submissions")
        .select("review_status,synthetic")
        .eq("id", id)
        .maybeSingle();
      if (submissionError) throw submissionError;
      if (!submission || submission.review_status !== "approved" || submission.synthetic !== true) {
        return NextResponse.json(
          { ok: false, message: "Only an approved synthetic rehearsal profile can be marked urgent while the release lock is active." },
          { status: 423 }
        );
      }
      const { data: decision, error: decisionError } = await admin.supabase
        .from("canada_moderation_decisions")
        .select("case_id")
        .eq("submission_id", id)
        .eq("action", "approved")
        .not("case_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (decisionError) throw decisionError;
      if (!decision?.case_id) {
        return NextResponse.json({ ok: false, message: "Approved case link not found." }, { status: 409 });
      }
      const { data: updated, error: updateError } = await admin.supabase
        .from("cases")
        .update({ urgency_level: "urgent_public_awareness", updated_at: new Date().toISOString() })
        .eq("id", decision.case_id)
        .eq("review_status", "approved")
        .eq("synthetic", true)
        .select("id")
        .maybeSingle();
      if (updateError) throw updateError;
      if (!updated) return NextResponse.json({ ok: false, message: "Synthetic profile was not eligible." }, { status: 409 });
      const { error: auditError } = await admin.supabase.from("audit_log").insert({
        actor_id: admin.user.id,
        action: "canada_synthetic_profile_marked_urgent",
        entity_type: "cases",
        entity_id: decision.case_id,
        reason,
        metadata: { submission_id: id, urgency_level: "urgent_public_awareness", synthetic: true }
      });
      if (auditError) throw auditError;
      return NextResponse.json({ ok: true, action, caseId: decision.case_id });
    }

    if (["needs_more_info", "rejected", "hidden", "reopened"].includes(action)) {
      const { error } = await admin.supabase.rpc("review_canada_submission", {
        target_submission_id: id,
        target_action: action,
        target_reason: reason,
        target_actor_id: admin.user.id
      });
      if (error) throw error;
      return NextResponse.json({ ok: true, action });
    }

    if (action === "approve_map") {
      const publicArea = cleanText(body.publicArea, 500);
      const latitude = body.publicLatitude === null || body.publicLatitude === "" || body.publicLatitude === undefined ? null : Number(body.publicLatitude);
      const longitude = body.publicLongitude === null || body.publicLongitude === "" || body.publicLongitude === undefined ? null : Number(body.publicLongitude);
      if (body.safetyConfirmed !== true) {
        return NextResponse.json({ ok: false, message: "Confirm that the map coordinates are deliberately approximate and safe for public release." }, { status: 400 });
      }
      if (!publicArea || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return NextResponse.json({ ok: false, message: "A reviewed public area and valid approximate coordinates are required." }, { status: 400 });
      }
      const { data, error } = await admin.supabase.rpc("approve_canada_submission_map", {
        target_submission_id: id,
        target_public_area: publicArea,
        target_public_latitude: latitude,
        target_public_longitude: longitude,
        target_actor_id: admin.user.id,
        target_reason: reason
      });
      if (error) throw error;
      return NextResponse.json({ ok: true, action, mapPointId: data });
    }

    if (action !== "approve") return NextResponse.json({ ok: false, message: "Unsupported moderation action." }, { status: 400 });

    const slug = cleanText(body.slug, 120).toLowerCase();
    const publicSummary = cleanText(body.publicSummary, 8000);
    const publicArea = cleanText(body.publicArea, 500);
    const latitude = body.publicLatitude === null || body.publicLatitude === "" || body.publicLatitude === undefined ? null : Number(body.publicLatitude);
    const longitude = body.publicLongitude === null || body.publicLongitude === "" || body.publicLongitude === undefined ? null : Number(body.publicLongitude);
    if (!slug || !publicSummary || !publicArea) return NextResponse.json({ ok: false, message: "Slug, public summary, and public area are required." }, { status: 400 });
    if (body.publishMap === true || latitude !== null || longitude !== null) {
      return NextResponse.json({ ok: false, message: "Approve the public profile first. Map publication requires a later, separate safety decision." }, { status: 409 });
    }

    const { data, error } = await admin.supabase.rpc("approve_canada_submission", {
      target_submission_id: id,
      target_slug: slug,
      target_public_summary: publicSummary,
      target_public_area: publicArea,
      target_public_latitude: latitude,
      target_public_longitude: longitude,
      target_publish_map: false,
      target_actor_id: admin.user.id,
      target_reason: reason
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, action: "approve", caseId: data });
  } catch {
    return safeApiError({ code: "canada_submission_action_failed", message: "Could not complete that Canadian moderation action." });
  }
}
