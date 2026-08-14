import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { safeApiError } from "@/lib/security/api-errors";
import { matchedUrgentSubscribers, sendUrgentCommunityAlert } from "@/lib/urgent-alerts";
import type { UrgentAlertTarget } from "@/lib/urgent-alerts";
import { prepareCrossBorderAlertRequest } from "@/lib/cross-border-alert-request";
import { mmipsSiteMode } from "@/lib/site-mode";

export const dynamic = "force-dynamic";

type RelayResult = { matched: number; sent: number; failed: number; available: boolean };

function urgentEventKey(caseId: string) {
  return `urgent:${caseId}:${new Date().toISOString().slice(0, 13)}`;
}

async function relayPeer(target: UrgentAlertTarget, caseId: string, intent: "preview" | "send"): Promise<RelayResult> {
  try {
    const prepared = prepareCrossBorderAlertRequest(target, urgentEventKey(caseId), intent);
    const response = await fetch(prepared.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-MMIPS-Alert-Signature": prepared.signature
      },
      body: JSON.stringify(prepared.payload),
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return { matched: 0, sent: 0, failed: 0, available: false };
    const data = await response.json().catch(() => ({}));
    return {
      matched: Number(data.matched) || 0,
      sent: Number(data.sent) || 0,
      failed: Number(data.failed) || 0,
      available: true
    };
  } catch {
    return { matched: 0, sent: 0, failed: 0, available: false };
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;
    const caseId = new URL(request.url).searchParams.get("caseId") || "";
    if (!caseId) {
      return NextResponse.json({ ok: false, message: "Choose a published profile first." }, { status: 400 });
    }
    const loaded = await loadTarget(admin, caseId);
    if ("error" in loaded) {
      return NextResponse.json({ ok: false, message: loaded.error }, { status: 409 });
    }
    const [localMatched, crossBorder] = await Promise.all([
      matchedUrgentSubscribers(loaded.target),
      relayPeer(loaded.target, caseId, "preview")
    ]);
    return NextResponse.json({
      ok: true,
      profile: {
        id: loaded.profile.id,
        slug: loaded.profile.slug,
        name: loaded.target.title,
        urgency_level: loaded.profile.urgency_level,
        public_map_label: loaded.target.publicMapLabel,
        official_tip_contact: loaded.target.officialTipContact,
        lead_agency: loaded.target.leadAgency,
        public_profile_url: `/profiles/${loaded.profile.slug}`
      },
      matchedCount: localMatched.length + crossBorder.matched,
      localMatchedCount: localMatched.length,
      crossBorderMatchedCount: crossBorder.matched,
      crossBorderAvailable: crossBorder.available,
      canSend:
        loaded.profile.review_status === "approved" &&
        Boolean(loaded.profile.published_at) &&
        loaded.profile.urgency_level === "urgent_public_awareness" &&
        loaded.profile.synthetic === true &&
        Boolean(loaded.target.officialTipContact)
    });
  } catch {
    return safeApiError({
      code: "urgent_alert_preview_failed",
      message: "Could not preview the urgent alert audience."
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;
    const body = await request.json().catch(() => ({}));
    const caseId = typeof body.caseId === "string" ? body.caseId : "";
    const confirmation = typeof body.confirmation === "string" ? body.confirmation.trim() : "";
    if (!caseId) {
      return NextResponse.json({ ok: false, message: "Choose a published profile first." }, { status: 400 });
    }
    if (confirmation !== "SEND URGENT ALERT") {
      return NextResponse.json(
        { ok: false, message: "Type SEND URGENT ALERT to confirm this community-wide action." },
        { status: 400 }
      );
    }

    const loaded = await loadTarget(admin, caseId);
    if ("error" in loaded) {
      return NextResponse.json({ ok: false, message: loaded.error }, { status: 409 });
    }
    if (loaded.profile.review_status !== "approved" || !loaded.profile.published_at) {
      return NextResponse.json(
        { ok: false, message: "Urgent alerts can be sent only for approved published profiles." },
        { status: 409 }
      );
    }
    if (loaded.profile.urgency_level !== "urgent_public_awareness") {
      return NextResponse.json(
        {
          ok: false,
          message: "Mark the public profile as Urgent public awareness before sending an urgent alert."
        },
        { status: 409 }
      );
    }

    // Synthetic rehearsal lock: the audience and target must share an explicit database marker.
    // Names and email domains are display labels, never security boundaries.
    if (loaded.profile.synthetic !== true || loaded.target.synthetic !== true) {
      return NextResponse.json(
        {
          ok: false,
          message: "Real-person urgent alerts are locked while the synthetic launch rehearsal is active."
        },
        { status: 423 }
      );
    }

    const localResult = await sendUrgentCommunityAlert(loaded.target, admin.user.id);
    const crossBorder = await relayPeer(loaded.target, caseId, "send");
    await admin.supabase.from("audit_log").insert({
      actor_id: admin.user.id,
      action: "urgent_community_alert_sent",
      entity_type: "cases",
      entity_id: caseId,
      reason: "Moderator confirmed approved urgent public alert.",
      metadata: {
        slug: loaded.profile.slug,
        matched_count: localResult.matched,
        sent_count: localResult.sent,
        failed_count: localResult.failed,
        duplicate: localResult.duplicate,
        cross_border_available: crossBorder.available,
        cross_border_matched_count: crossBorder.matched,
        cross_border_sent_count: crossBorder.sent,
        cross_border_failed_count: crossBorder.failed
      }
    });

    const totalMatched = localResult.matched + crossBorder.matched;
    const totalSent = localResult.sent + crossBorder.sent;
    return NextResponse.json({
      ok: true,
      message: localResult.duplicate && crossBorder.sent === 0
        ? "This hourly urgent alert event was already processed."
        : `Urgent alert processed across the U.S.–Canada network: ${totalSent} sent of ${totalMatched} matched subscribers.`,
      result: {
        ...localResult,
        totalMatched,
        totalSent,
        crossBorder
      }
    });
  } catch {
    return safeApiError({
      code: "urgent_alert_send_failed",
      message: "Could not send the urgent community alert."
    });
  }
}

function personName(raw: any) {
  const person = Array.isArray(raw?.persons) ? raw.persons[0] : raw?.persons;
  return person?.full_name || "Name withheld";
}

async function loadTarget(
  admin: Awaited<ReturnType<typeof requireAdmin>> & { ok: true },
  caseId: string
) {
  const canada = mmipsSiteMode() === "ca";
  const profileFields = canada
    ? "id,slug,status,urgency_level,review_status,published_at,official_tip_contact,lead_police_service,synthetic,persons(full_name)"
    : "id,slug,status,profile_type,urgency_level,review_status,published_at,official_tip_contact,lead_agency,synthetic,persons(full_name)";
  const { data: rawProfile, error: profileError } = await admin.supabase
    .from("cases")
    .select(profileFields)
    .eq("id", caseId)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!rawProfile) return { error: "Profile not found." } as const;
  const profile = rawProfile as any;

  const officialTipContact =
    typeof profile.official_tip_contact === "string" ? profile.official_tip_contact.trim() : "";
  if (!officialTipContact) {
    return {
      error:
        "Add an official tip/reporting contact to the public profile before sending an urgent alert. MMIPS urgent alerts must tell recipients where case information should be reported."
    } as const;
  }

  const basePointQuery = admin.supabase
    .from("public_case_map_points")
    .select(canada
      ? "public_area_label,public_latitude,public_longitude,moderator_approved,hidden"
      : "public_label,public_latitude,public_longitude,precision,moderator_approved,safety_reviewed_at,hidden_at")
    .eq("case_id", caseId)
    .eq("moderator_approved", true);
  const { data: rawPoint, error: pointError } = canada
    ? await basePointQuery.eq("hidden", false).maybeSingle()
    : await basePointQuery.is("hidden_at", null).maybeSingle();
  if (pointError) throw pointError;
  if (!rawPoint) {
    return {
      error:
        "This profile needs an approved public map point before a geographic urgent alert can be sent."
    } as const;
  }
  const point = rawPoint as any;

  const latitude = Number(point.public_latitude);
  const longitude = Number(point.public_longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { error: "The approved public map point is unavailable." } as const;
  }

  return {
    target: {
      caseId: profile.id,
      slug: profile.slug,
      title: personName(profile),
      publicMapLabel: canada ? point.public_area_label : point.public_label,
      officialTipContact,
      leadAgency: typeof (canada ? profile.lead_police_service : profile.lead_agency) === "string"
        ? (canada ? profile.lead_police_service : profile.lead_agency).trim() || null
        : null,
      latitude,
      longitude,
      synthetic: profile.synthetic === true
    },
    profile,
    point
  } as const;
}
