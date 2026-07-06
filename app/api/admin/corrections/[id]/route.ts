import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { sendTransactionalEmail, siteUrl } from "@/lib/email";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> | { id: string } };

const caseStatuses = new Set(["missing", "murdered_unsolved", "unidentified", "resolved", "unknown"]);
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

function buildCaseUpdates(raw: any) {
  if (!raw || typeof raw !== "object") return {};
  const updates: Record<string, unknown> = {};

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

  if (typeof raw.status === "string" && caseStatuses.has(raw.status)) {
    updates.status = raw.status;
  }

  if (typeof raw.location_precision === "string" && locationPrecisions.has(raw.location_precision)) {
    updates.location_precision = raw.location_precision;
  }

  if (Object.keys(updates).length) {
    updates.updated_at = new Date().toISOString();
    updates.last_public_update = new Date().toISOString().slice(0, 10);
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
    const action = String(body.action || "");
    const moderatorNotes = String(body.moderator_notes || "").trim() || null;

    const allowed = new Set(["needs_more_info", "approved", "rejected", "hidden", "remove_public_profile"]);
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

    let appliedCaseUpdates: Record<string, unknown> = {};
    let appliedPersonUpdates: Record<string, unknown> = {};
    let targetCase: { id: string; person_id: string | null; slug?: string | null } | null = null;

    if ((action === "approved" || action === "remove_public_profile") && requestRow.case_id) {
      const { data: caseRow, error: caseLoadError } = await admin.supabase
        .from("cases")
        .select("id, person_id, slug")
        .eq("id", requestRow.case_id)
        .single();

      if (caseLoadError || !caseRow) {
        return NextResponse.json({ ok: false, message: "Linked public profile was not found, so updates/removal were not applied." }, { status: 404 });
      }

      targetCase = caseRow;

      if (action === "remove_public_profile") {
        appliedCaseUpdates = {
          review_status: "hidden",
          published_at: null,
          updated_at: new Date().toISOString(),
          last_public_update: new Date().toISOString().slice(0, 10)
        };

        const { error: removeError } = await admin.supabase
          .from("cases")
          .update(appliedCaseUpdates)
          .eq("id", targetCase.id);
        if (removeError) throw removeError;
      }
    }

    if (action === "approved" && targetCase) {
      appliedCaseUpdates = buildCaseUpdates(body.case_updates);
      appliedPersonUpdates = buildPersonUpdates(body.person_updates);

      if (Object.keys(appliedCaseUpdates).length) {
        const { error: caseUpdateError } = await admin.supabase
          .from("cases")
          .update(appliedCaseUpdates)
          .eq("id", targetCase.id);
        if (caseUpdateError) throw caseUpdateError;
      }

      if (targetCase.person_id && Object.keys(appliedPersonUpdates).length) {
        const { error: personUpdateError } = await admin.supabase
          .from("persons")
          .update(appliedPersonUpdates)
          .eq("id", targetCase.person_id);
        if (personUpdateError) throw personUpdateError;
      }
    }

    const details = moderatorNotes
      ? `${requestRow.request_details || ""}\n\n--- Moderator note (${new Date().toISOString()}) ---\n${moderatorNotes}`
      : requestRow.request_details;

    const requestReviewStatus = action === "remove_public_profile" ? "hidden" : action;

    const { error } = await admin.supabase
      .from("correction_requests")
      .update({ review_status: requestReviewStatus, request_details: details })
      .eq("id", id);
    if (error) throw error;

    await admin.supabase.from("audit_log").insert({
      actor_id: admin.user.id,
      action: `correction_request_${action}`,
      entity_type: "correction_requests",
      entity_id: id,
      reason: moderatorNotes,
      metadata: {
        case_id: requestRow.case_id,
        request_type: requestRow.request_type,
        case_updates_applied: Object.keys(appliedCaseUpdates),
        person_updates_applied: Object.keys(appliedPersonUpdates)
      }
    });

    const profileUrl = targetCase?.slug ? `${siteUrl()}/profiles/${targetCase.slug}` : null;
    const appliedCount = Object.keys(appliedCaseUpdates).length + Object.keys(appliedPersonUpdates).length;
    const appliedText = action === "approved" && requestRow.case_id
      ? appliedCount
        ? ` ${appliedCount} public profile field${appliedCount === 1 ? "" : "s"} updated.`
        : " No public profile fields were changed; only the request status was updated."
      : action === "remove_public_profile"
        ? " The linked public profile was removed from public view."
        : "";

    const emailSubject = action === "remove_public_profile"
      ? "MMIPS public profile removed from public view"
      : action === "approved"
        ? "MMIPS correction/removal request completed"
        : action === "needs_more_info"
          ? "MMIPS needs more information"
          : "MMIPS update on your correction/removal request";

    const actionText = action === "remove_public_profile"
      ? "The linked public profile has been removed from public view."
      : action === "approved"
        ? "Your correction/removal request was reviewed and the public profile was updated or marked applied."
        : action === "needs_more_info"
          ? "An MMIPS reviewer marked your correction/removal request as needing more information."
          : action === "rejected"
            ? "An MMIPS reviewer reviewed your correction/removal request and did not make the requested public change."
            : "An MMIPS reviewer closed your correction/removal request without a public profile change.";

    await sendTransactionalEmail({
      to: requestRow.requester_email,
      subject: emailSubject,
      text: [
        `Hello ${requestRow.requester_name || ""},`,
        actionText,
        profileUrl && action !== "remove_public_profile" ? `Public profile: ${profileUrl}` : null,
        moderatorNotes ? `Reviewer note: ${moderatorNotes}` : null,
        "Questions or updates: corrections@mmips.com",
        "MMIPS is not law enforcement and does not replace emergency reporting or official missing-person databases."
      ].filter(Boolean).join("\n\n")
    });

    return NextResponse.json({ ok: true, message: `Correction/removal request marked ${action.replaceAll("_", " ")}.${appliedText}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Correction request action failed.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
