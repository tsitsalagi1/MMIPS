import { NextResponse } from "next/server";
import { safeApiError } from "@/lib/security/api-errors";
import { requireAdmin } from "@/lib/supabase/admin";
import { mmipsSiteMode } from "@/lib/site-mode";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (mmipsSiteMode() !== "ca") return NextResponse.json({ ok: false, message: "Canada admin API only." }, { status: 404 });
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending_review";
    const allowed = new Set(["pending_review", "needs_more_info", "approved", "rejected", "hidden", "all"]);
    if (!allowed.has(status)) return NextResponse.json({ ok: false, message: "Invalid review status." }, { status: 400 });

    let query = admin.supabase
      .from("submissions")
      .select("id,created_at,updated_at,public_reference,review_status,full_name,age,status,last_seen_date,last_seen_locality,last_seen_province_territory,last_seen_postal_code,lead_police_service,police_file_number,official_tip_contact,public_summary_proposed,submitter_name,submitter_email,submitter_phone,relationship,authority_basis,consent_language,consent_version,publication_requested,map_requested,last_seen_area_public_proposed,public_latitude_proposed,public_longitude_proposed,moderator_notes,synthetic,decision_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (status !== "all") query = query.eq("review_status", status);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ ok: true, submissions: data || [] }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return safeApiError({ code: "canada_submissions_load_failed", message: "Could not load Canadian submissions." });
  }
}
