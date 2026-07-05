import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> | { id: string } };

function makeSlug(name: string, id: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "case";
  return `${base}-${id.slice(0, 8)}`;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
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

    const { data: submission, error: loadError } = await admin.supabase
      .from("submissions")
      .select("*")
      .eq("id", id)
      .single();

    if (loadError || !submission) {
      return NextResponse.json({ ok: false, message: "Submission not found." }, { status: 404 });
    }

    if (action === "needs_more_info" || action === "rejected") {
      const { error } = await admin.supabase
        .from("submissions")
        .update({ review_status: action, moderator_notes: moderatorNotes, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;

      await admin.supabase.from("audit_log").insert({
        actor_id: admin.user.id,
        action: `submission_${action}`,
        entity_type: "submissions",
        entity_id: id,
        reason: moderatorNotes
      });

      return NextResponse.json({ ok: true, message: `Submission marked ${action.replaceAll("_", " ")}.` });
    }

    if (action !== "approve") {
      return NextResponse.json({ ok: false, message: "Unknown action." }, { status: 400 });
    }

    const slug = makeSlug(submission.full_name, submission.id);

    const { data: person, error: personError } = await admin.supabase
      .from("persons")
      .insert({
        full_name: submission.full_name,
        age: submission.age,
        tribal_affiliation: submission.tribal_affiliation,
        public_notes: null
      })
      .select("id")
      .single();

    if (personError) throw personError;

    const { data: caseRecord, error: caseError } = await admin.supabase
      .from("cases")
      .insert({
        person_id: person.id,
        slug,
        status: submission.status,
        review_status: "approved",
        public_summary: submission.summary,
        last_seen_date: submission.last_seen_date,
        last_seen_area_public: submission.last_seen_location,
        location_precision: "city",
        lead_agency: submission.lead_agency,
        agency_case_number: submission.agency_case_number,
        namus_number: submission.namus_number,
        official_tip_contact: submission.tip_contact,
        last_public_update: todayIsoDate(),
        published_at: new Date().toISOString()
      })
      .select("id, slug")
      .single();

    if (caseError) throw caseError;

    await admin.supabase
      .from("submissions")
      .update({ review_status: "approved", moderator_notes: moderatorNotes, updated_at: new Date().toISOString() })
      .eq("id", id);

    await admin.supabase.from("audit_log").insert({
      actor_id: admin.user.id,
      action: "submission_approved_and_case_published",
      entity_type: "cases",
      entity_id: caseRecord.id,
      reason: moderatorNotes,
      metadata: { submission_id: id, slug: caseRecord.slug }
    });

    return NextResponse.json({ ok: true, message: "Submission approved and public case page created.", slug: caseRecord.slug });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin action failed.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
