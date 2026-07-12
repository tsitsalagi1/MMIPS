import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";
import { sendTransactionalEmail, siteUrl } from "@/lib/email";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> | { id: string } };

type SubmissionPhotoForPublish = {
  storage_path: string;
  original_name?: string | null;
  content_type?: string | null;
  size_bytes?: number | null;
  alt_text?: string | null;
  caption?: string | null;
  photo_type?: string | null;
  use_on_profile?: boolean | null;
  use_on_flyer?: boolean | null;
  is_main?: boolean | null;
  sort_order?: number | null;
};

type CopiedProfilePhoto = {
  storage_path: string;
  original_name: string;
  content_type: string | null;
  size_bytes: number | null;
  alt_text: string | null;
  caption: string | null;
  photo_type: string;
  use_on_profile: boolean;
  use_on_flyer: boolean;
  is_main: boolean;
  sort_order: number;
};


function makeSlug(name: string, id: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "case";
  return `${base}-${id.slice(0, 8)}`;
}

function safeFileName(name: string) {
  const cleaned = name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned || "case-photo";
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

      await sendTransactionalEmail({
        to: submission.submitter_email,
        subject: action === "needs_more_info" ? "MMIPS needs more information" : "MMIPS update on your submitted information",
        text: [
          `Hello ${submission.submitter_name || ""},`,
          action === "needs_more_info"
            ? "An MMIPS reviewer marked your submitted information as needing more information before it can be considered further."
            : "An MMIPS reviewer reviewed your submitted information and it was not published.",
          moderatorNotes ? `Reviewer note: ${moderatorNotes}` : null,
          "You can reply to contact@mmips.com with questions or updated information.",
          "MMIPS is not law enforcement and does not replace emergency reporting or official missing-person databases."
        ].filter(Boolean).join("\n\n")
      });

      return NextResponse.json({ ok: true, message: `Submission marked ${action.replaceAll("_", " ")}.` });
    }

    if (action !== "approve") {
      return NextResponse.json({ ok: false, message: "Unknown action." }, { status: 400 });
    }

    const slug = makeSlug(submission.full_name, submission.id);

    const { data: submittedPhotos, error: submittedPhotosError } = await admin.supabase
      .from("submission_photos")
      .select("*")
      .eq("submission_id", id)
      .order("sort_order", { ascending: true });
    if (submittedPhotosError && submittedPhotosError.code !== "42P01") throw submittedPhotosError;

    const photosToCopy: SubmissionPhotoForPublish[] = submittedPhotos?.length
      ? submittedPhotos
      : submission.photo_storage_path
        ? [{
            storage_path: submission.photo_storage_path,
            original_name: submission.photo_original_name || "profile-photo",
            content_type: submission.photo_content_type || null,
            size_bytes: submission.photo_size || null,
            alt_text: submission.photo_alt_text || null,
            caption: submission.photo_alt_text || null,
            photo_type: "main_face",
            use_on_profile: true,
            use_on_flyer: true,
            is_main: true,
            sort_order: 0
          }]
        : [];

    const copiedPhotos: CopiedProfilePhoto[] = [];
    for (const photo of photosToCopy || []) {
      const { data: privateFile, error: downloadError } = await admin.supabase.storage
        .from("mmips-submission-photos")
        .download(photo.storage_path);
      if (downloadError) throw downloadError;

      const sortOrder = photo.sort_order ?? copiedPhotos.length;
      const publicPath: string = `profiles/${slug}/${sortOrder}-${crypto.randomUUID()}-${safeFileName(photo.original_name || "profile-photo")}`;
      const { error: uploadPhotoError } = await admin.supabase.storage
        .from("mmips-public-case-photos")
        .upload(publicPath, privateFile, {
          contentType: photo.content_type || privateFile.type || "application/octet-stream",
          upsert: false
        });
      if (uploadPhotoError) throw uploadPhotoError;

      copiedPhotos.push({
        storage_path: publicPath,
        original_name: photo.original_name || "profile-photo",
        content_type: photo.content_type || privateFile.type || null,
        size_bytes: photo.size_bytes || privateFile.size || null,
        alt_text: photo.alt_text || photo.caption || submission.photo_alt_text || null,
        caption: photo.caption || null,
        photo_type: photo.photo_type || "other",
        use_on_profile: photo.use_on_profile !== false,
        use_on_flyer: photo.use_on_flyer !== false,
        is_main: photo.is_main === true || copiedPhotos.length === 0,
        sort_order: sortOrder
      });
    }

    const mainCopiedPhoto = copiedPhotos.find((photo) => photo.is_main) || copiedPhotos[0] || null;
    const publicPhotoPath = mainCopiedPhoto?.storage_path || null;

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
        profile_type: submission.profile_type || (submission.status === "murdered_unsolved" ? "murdered_info_needed" : "missing"),
        urgency_level: submission.urgency_level || "standard",
        review_status: "approved",
        public_summary: submission.summary,
        last_seen_date: submission.last_seen_date,
        last_known_datetime: submission.last_known_datetime,
        last_known_time_zone: submission.last_known_time_zone,
        last_seen_area_public: submission.last_seen_location,
        notification_area_requested: submission.notification_area_requested,
        likely_travel_mode: submission.likely_travel_mode,
        possible_direction: submission.possible_direction,
        vehicle_description: submission.vehicle_description,
        official_info_pending: submission.official_info_pending || false,
        location_precision: "city",
        lead_agency: submission.lead_agency,
        agency_case_number: submission.agency_case_number,
        namus_number: submission.namus_number,
        official_tip_contact: submission.tip_contact,
        photo_storage_path: publicPhotoPath,
        photo_alt_text: mainCopiedPhoto?.alt_text || submission.photo_alt_text,
        last_public_update: todayIsoDate(),
        published_at: new Date().toISOString()
      })
      .select("id, slug")
      .single();

    if (caseError) throw caseError;

    if (copiedPhotos.length) {
      const { error: publicPhotosError } = await admin.supabase.from("profile_photos").insert(copiedPhotos.map((photo) => ({
        case_id: caseRecord.id,
        ...photo,
        permission_confirmed: true
      })));
      if (publicPhotosError && publicPhotosError.code !== "42P01") throw publicPhotosError;
    }

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
      metadata: { submission_id: id, slug: caseRecord.slug, profile_type: submission.profile_type, urgency_level: submission.urgency_level, photo_storage_path: publicPhotoPath, photo_count: copiedPhotos.length }
    });

    const publicProfileUrl = `${siteUrl()}/profiles/${caseRecord.slug}`;
    await sendTransactionalEmail({
      to: submission.submitter_email,
      subject: "MMIPS public profile published",
      text: [
        `Hello ${submission.submitter_name || ""},`,
        "An MMIPS reviewer approved the submitted information and published the public awareness profile.",
        `Public profile: ${publicProfileUrl}`,
        moderatorNotes ? `Reviewer note: ${moderatorNotes}` : null,
        "If anything needs to be corrected or removed, use the correction/removal form or email corrections@mmips.com.",
        "MMIPS is not law enforcement and does not replace emergency reporting or official missing-person databases."
      ].filter(Boolean).join("\n\n")
    });

    return NextResponse.json({ ok: true, message: "Submission approved and public profile created.", slug: caseRecord.slug });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin action failed.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
