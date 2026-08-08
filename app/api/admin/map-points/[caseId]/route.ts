import { NextResponse } from "next/server";
import { PUBLIC_MAP_PRECISIONS, type PublicMapPrecision } from "@/lib/public-map";
import { safeApiError } from "@/lib/security/api-errors";
import { requireAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const REGION_TYPES = new Set(["state", "broad_region", "tribal_region", "county", "city"]);

function cleanText(value: unknown, max = 160) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";
}

function isPrecision(value: unknown): value is PublicMapPrecision {
  return typeof value === "string" && (PUBLIC_MAP_PRECISIONS as readonly string[]).includes(value);
}

function roundedCoordinate(value: unknown, precision: PublicMapPrecision) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return null;
  const decimals = precision === "state" || precision === "broad_region" ? 1 : 2;
  return Number(numeric.toFixed(decimals));
}

export async function PATCH(request: Request, context: { params: Promise<{ caseId: string }> }) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;

    const { caseId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const action = body?.action === "hide" ? "hide" : "save";
    const moderatorNotes = cleanText(body?.moderator_notes, 1000);

    if (moderatorNotes.length < 10) {
      return NextResponse.json({ ok: false, message: "Document the safety/review reason in moderator notes." }, { status: 400 });
    }

    const { data: publicCase, error: caseError } = await admin.supabase
      .from("cases")
      .select("id, slug, review_status, published_at")
      .eq("id", caseId)
      .maybeSingle();
    if (caseError) throw caseError;
    if (!publicCase || publicCase.review_status !== "approved" || !publicCase.published_at) {
      return NextResponse.json({ ok: false, message: "Map points may only be attached to an approved, published profile." }, { status: 409 });
    }

    if (action === "hide") {
      const now = new Date().toISOString();
      const { data: hidden, error: hideError } = await admin.supabase
        .from("public_case_map_points")
        .update({ hidden_at: now, moderator_approved: false, updated_at: now })
        .eq("case_id", caseId)
        .is("hidden_at", null)
        .select("id")
        .maybeSingle();
      if (hideError) throw hideError;

      if (hidden?.id) {
        await admin.supabase.from("audit_log").insert({
          actor_id: admin.user.id,
          action: "public_map_point_hidden",
          entity_type: "public_case_map_points",
          entity_id: hidden.id,
          reason: moderatorNotes,
          metadata: { case_id: caseId, slug: publicCase.slug }
        });
      }

      return NextResponse.json({ ok: true, message: hidden?.id ? "Public map point hidden." : "No active public map point was found." });
    }

    const precision = body?.precision;
    if (!isPrecision(precision)) {
      return NextResponse.json({ ok: false, message: "Choose an approved public map precision." }, { status: 400 });
    }

    const publicLabel = cleanText(body?.public_label, 120);
    const regionType = cleanText(body?.region_type, 40);
    const publicLatitude = roundedCoordinate(body?.public_latitude, precision);
    const publicLongitude = roundedCoordinate(body?.public_longitude, precision);
    const safetyConfirmed = body?.safety_confirmed === true;

    if (publicLabel.length < 2 || !REGION_TYPES.has(regionType)) {
      return NextResponse.json({ ok: false, message: "Provide a public area label and approved region type." }, { status: 400 });
    }
    if (publicLatitude === null || publicLatitude < -90 || publicLatitude > 90 || publicLongitude === null || publicLongitude < -180 || publicLongitude > 180) {
      return NextResponse.json({ ok: false, message: "Provide valid approximate public coordinates." }, { status: 400 });
    }
    if (!safetyConfirmed) {
      return NextResponse.json({ ok: false, message: "Confirm that these are deliberately approximate public-awareness coordinates." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data: existing, error: existingError } = await admin.supabase
      .from("public_case_map_points")
      .select("id")
      .eq("case_id", caseId)
      .is("hidden_at", null)
      .maybeSingle();
    if (existingError) throw existingError;

    const values = {
      case_id: caseId,
      public_label: publicLabel,
      public_latitude: publicLatitude,
      public_longitude: publicLongitude,
      precision,
      region_type: regionType,
      moderator_approved: true,
      safety_reviewed_at: now,
      approved_by: admin.user.id,
      hidden_at: null,
      updated_at: now
    };

    const write = existing?.id
      ? admin.supabase.from("public_case_map_points").update(values).eq("id", existing.id).select("id, case_id, public_label, public_latitude, public_longitude, precision, region_type, updated_at").single()
      : admin.supabase.from("public_case_map_points").insert(values).select("id, case_id, public_label, public_latitude, public_longitude, precision, region_type, updated_at").single();

    const { data: point, error: writeError } = await write;
    if (writeError) throw writeError;

    await admin.supabase.from("audit_log").insert({
      actor_id: admin.user.id,
      action: existing?.id ? "public_map_point_updated" : "public_map_point_created",
      entity_type: "public_case_map_points",
      entity_id: point.id,
      reason: moderatorNotes,
      metadata: {
        case_id: caseId,
        slug: publicCase.slug,
        public_label: publicLabel,
        precision,
        region_type: regionType,
        coordinate_rounding: precision === "state" || precision === "broad_region" ? "1_decimal" : "2_decimals"
      }
    });

    return NextResponse.json({ ok: true, message: "Reviewed public map point saved.", point });
  } catch {
    return safeApiError({ code: "admin_map_point_write_failed", message: "Could not update the public map point." });
  }
}
