import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { safeApiError } from "@/lib/security/api-errors";
import { matchedUrgentSubscribers, sendUrgentCommunityAlert } from "@/lib/urgent-alerts";

export const dynamic = "force-dynamic";

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
    const matched = await matchedUrgentSubscribers(loaded.target);
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
      matchedCount: matched.length,
      canSend:
        loaded.profile.review_status === "approved" &&
        Boolean(loaded.profile.published_at) &&
        loaded.profile.urgency_level === "urgent_public_awareness" &&
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

    // Synthetic rehearsal lock: do not send real-case alerts while the release rehearsal is active.
    if (!loaded.target.title.startsWith("MMIPS TEST PERSON")) {
      return NextResponse.json(
        {
          ok: false,
          message: "Real-person urgent alerts are locked while the synthetic launch rehearsal is active."
        },
        { status: 423 }
      );
    }

    const result = await sendUrgentCommunityAlert(loaded.target, admin.user.id);
    await admin.supabase.from("audit_log").insert({
      actor_id: admin.user.id,
      action: "urgent_community_alert_sent",
      entity_type: "cases",
      entity_id: caseId,
      reason: "Moderator confirmed approved urgent public alert.",
      metadata: {
        slug: loaded.profile.slug,
        matched_count: result.matched,
        sent_count: result.sent,
        failed_count: result.failed,
        duplicate: result.duplicate
      }
    });

    return NextResponse.json({
      ok: true,
      message: result.duplicate
        ? "This hourly urgent alert event was already sent."
        : `Urgent alert processed: ${result.sent} sent of ${result.matched} matched subscribers.`,
      result
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
  const { data: profile, error: profileError } = await admin.supabase
    .from("cases")
    .select(
      "id,slug,status,profile_type,urgency_level,review_status,published_at,official_tip_contact,lead_agency,persons(full_name)"
    )
    .eq("id", caseId)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) return { error: "Profile not found." } as const;

  const officialTipContact =
    typeof profile.official_tip_contact === "string" ? profile.official_tip_contact.trim() : "";
  if (!officialTipContact) {
    return {
      error:
        "Add an official tip/reporting contact to the public profile before sending an urgent alert. MMIPS urgent alerts must tell recipients where case information should be reported."
    } as const;
  }

  const { data: point, error: pointError } = await admin.supabase
    .from("public_case_map_points")
    .select("public_label,public_latitude,public_longitude,precision,moderator_approved,safety_reviewed_at,hidden_at")
    .eq("case_id", caseId)
    .is("hidden_at", null)
    .eq("moderator_approved", true)
    .maybeSingle();
  if (pointError) throw pointError;
  if (!point) {
    return {
      error:
        "This profile needs an approved public map point before a geographic urgent alert can be sent."
    } as const;
  }

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
      publicMapLabel: point.public_label,
      officialTipContact,
      leadAgency: typeof profile.lead_agency === "string" ? profile.lead_agency.trim() || null : null,
      latitude,
      longitude
    },
    profile,
    point
  } as const;
}
