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

    if (["needs_more_info", "rejected", "hidden", "reopened"].includes(action)) {
      const { error } = await admin.supabase.rpc("review_canada_submission", {
        target_submission_id: id,
        target_action: action,
        target_reason: reason || null,
        target_actor_id: admin.user.id
      });
      if (error) throw error;
      return NextResponse.json({ ok: true, action });
    }

    if (action !== "approve") return NextResponse.json({ ok: false, message: "Unsupported moderation action." }, { status: 400 });

    const slug = cleanText(body.slug, 120).toLowerCase();
    const publicSummary = cleanText(body.publicSummary, 8000);
    const publicArea = cleanText(body.publicArea, 500);
    const latitude = body.publicLatitude === null || body.publicLatitude === "" || body.publicLatitude === undefined ? null : Number(body.publicLatitude);
    const longitude = body.publicLongitude === null || body.publicLongitude === "" || body.publicLongitude === undefined ? null : Number(body.publicLongitude);
    const publishMap = body.publishMap === true;
    if (!slug || !publicSummary || !publicArea) return NextResponse.json({ ok: false, message: "Slug, public summary, and public area are required." }, { status: 400 });
    if (publishMap && (!Number.isFinite(latitude) || !Number.isFinite(longitude))) {
      return NextResponse.json({ ok: false, message: "Valid public map coordinates are required when map publication is enabled." }, { status: 400 });
    }

    const { data, error } = await admin.supabase.rpc("approve_canada_submission", {
      target_submission_id: id,
      target_slug: slug,
      target_public_summary: publicSummary,
      target_public_area: publicArea,
      target_public_latitude: latitude,
      target_public_longitude: longitude,
      target_publish_map: publishMap,
      target_actor_id: admin.user.id,
      target_reason: reason || null
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, action: "approve", caseId: data });
  } catch {
    return safeApiError({ code: "canada_submission_action_failed", message: "Could not complete that Canadian moderation action." });
  }
}
