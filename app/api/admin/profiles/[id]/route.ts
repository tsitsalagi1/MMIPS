import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> | { id: string } };

const caseStatuses = new Set(["missing", "murdered_unsolved", "unidentified", "resolved", "unknown"]);
const profileTypes = new Set(["urgent_missing", "missing", "murdered_info_needed", "unidentified", "located"]);
const urgencyLevels = new Set(["standard", "urgent_public_awareness", "renewed_visibility", "status_update"]);
const locationPrecisions = new Set(["exact_private", "approximate", "city", "county", "hidden"]);

function optionalText(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function optionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildCaseUpdates(raw: any) {
  if (!raw || typeof raw !== "object") return {};
  const updates: Record<string, unknown> = {};

  if (typeof raw.status === "string" && caseStatuses.has(raw.status)) updates.status = raw.status;
  if (typeof raw.profile_type === "string" && profileTypes.has(raw.profile_type)) updates.profile_type = raw.profile_type;
  if (typeof raw.urgency_level === "string" && urgencyLevels.has(raw.urgency_level)) updates.urgency_level = raw.urgency_level;
  if (typeof raw.location_precision === "string" && locationPrecisions.has(raw.location_precision)) updates.location_precision = raw.location_precision;

  const publicSummary = optionalText(raw.public_summary);
  if (publicSummary !== undefined) updates.public_summary = publicSummary;

  const lastSeenAreaPublic = optionalText(raw.last_seen_area_public);
  if (lastSeenAreaPublic !== undefined) updates.last_seen_area_public = lastSeenAreaPublic;

  const leadAgency = optionalText(raw.lead_agency);
  if (leadAgency !== undefined) updates.lead_agency = leadAgency;

  const agencyCaseNumber = optionalText(raw.agency_case_number);
  if (agencyCaseNumber !== undefined) updates.agency_case_number = agencyCaseNumber;

  const namusNumber = optionalText(raw.namus_number);
  if (namusNumber !== undefined) updates.namus_number = namusNumber;

  const officialTipContact = optionalText(raw.official_tip_contact);
  if (officialTipContact !== undefined) updates.official_tip_contact = officialTipContact;

  const ncicStatus = optionalText(raw.ncic_status);
  if (ncicStatus !== undefined) updates.ncic_status = ncicStatus;

  const tribeNotified = optionalText(raw.tribe_notified);
  if (tribeNotified !== undefined) updates.tribe_notified = tribeNotified;

  const familyLiaison = optionalText(raw.family_liaison);
  if (familyLiaison !== undefined) updates.family_liaison = familyLiaison;

  const notificationArea = optionalText(raw.notification_area_requested);
  if (notificationArea !== undefined) updates.notification_area_requested = notificationArea;

  const likelyTravelMode = optionalText(raw.likely_travel_mode);
  if (likelyTravelMode !== undefined) updates.likely_travel_mode = likelyTravelMode;

  const possibleDirection = optionalText(raw.possible_direction);
  if (possibleDirection !== undefined) updates.possible_direction = possibleDirection;

  const vehicleDescription = optionalText(raw.vehicle_description);
  if (vehicleDescription !== undefined) updates.vehicle_description = vehicleDescription;

  if (typeof raw.official_info_pending === "boolean") updates.official_info_pending = raw.official_info_pending;

  if (Object.keys(updates).length) {
    updates.updated_at = new Date().toISOString();
    updates.last_public_update = todayIsoDate();
  }

  return updates;
}

function buildPersonUpdates(raw: any) {
  if (!raw || typeof raw !== "object") return {};
  const updates: Record<string, unknown> = {};

  const fullName = optionalText(raw.full_name);
  if (fullName !== undefined) updates.full_name = fullName;

  const tribalAffiliation = optionalText(raw.tribal_affiliation);
  if (tribalAffiliation !== undefined) updates.tribal_affiliation = tribalAffiliation;

  const age = optionalNumber(raw.age);
  if (age !== undefined) updates.age = age;

  return updates;
}

export async function PATCH(request: Request, context: Params) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;

    const params = await context.params;
    const id = params.id;
    const body = await request.json().catch(() => ({}));
    const moderatorNotes = String(body.moderator_notes || "").trim() || null;

    const { data: current, error: loadError } = await admin.supabase
      .from("cases")
      .select("id, person_id, slug, status, profile_type, urgency_level, review_status")
      .eq("id", id)
      .single();

    if (loadError || !current) {
      return NextResponse.json({ ok: false, message: "Public profile not found." }, { status: 404 });
    }

    const caseUpdates = buildCaseUpdates(body.case_updates);
    const personUpdates = buildPersonUpdates(body.person_updates);

    if (!Object.keys(caseUpdates).length && !Object.keys(personUpdates).length) {
      return NextResponse.json({ ok: false, message: "No valid profile changes were provided." }, { status: 400 });
    }

    if (Object.keys(caseUpdates).length) {
      const { error: caseError } = await admin.supabase
        .from("cases")
        .update(caseUpdates)
        .eq("id", id);
      if (caseError) throw caseError;
    }

    if (current.person_id && Object.keys(personUpdates).length) {
      const { error: personError } = await admin.supabase
        .from("persons")
        .update(personUpdates)
        .eq("id", current.person_id);
      if (personError) throw personError;
    }

    await admin.supabase.from("audit_log").insert({
      actor_id: admin.user.id,
      action: "public_profile_status_update",
      entity_type: "cases",
      entity_id: id,
      reason: moderatorNotes,
      metadata: {
        slug: current.slug,
        before: {
          status: current.status,
          profile_type: current.profile_type,
          urgency_level: current.urgency_level
        },
        case_updates: caseUpdates,
        person_updates: Object.keys(personUpdates)
      }
    });

    return NextResponse.json({
      ok: true,
      message: `Public profile updated. The live profile, flyer, JPEG export, map category, and QR-linked page now use the updated status/type.`,
      slug: current.slug
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update public profile.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
