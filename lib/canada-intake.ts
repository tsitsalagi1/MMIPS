import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { canadaSubmissionIntakeModeFromEnv } from "@/lib/release-controls";
import { clientIpFromRequest, expectedTurnstileHostname, verifyTurnstileToken } from "@/lib/security/turnstile";
import { MAX_UPLOAD_COUNT, validateImageFile } from "@/lib/security/uploads";
import { sendTransactionalEmail } from "@/lib/email";
import { appendIdentifyingDetailsToSummary } from "@/lib/submission-identifying-details";

const PROVINCES = new Set(["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"]);
const STATUSES = new Set(["missing","homicide_unsolved","unidentified","resolved","unknown"]);
const AFFILIATION_TYPES = new Set(["first_nation","inuit","metis","multiple","self_described","not_disclosed"]);

function required(form: FormData, name: string, label: string, max = 4000) {
  const value = String(form.get(name) ?? "").trim().slice(0, max);
  if (!value) throw new Error(`${label} is required.`);
  return value;
}

function optional(form: FormData, name: string, max = 4000) {
  return String(form.get(name) ?? "").trim().slice(0, max) || null;
}

function redirect(request: Request, path: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  return NextResponse.redirect(new URL(path, base), { status: 303 });
}

export async function handleCanadaSubmission(request: Request) {
  const mode = canadaSubmissionIntakeModeFromEnv();
  if (mode === "locked") {
    return redirect(request, "/submit?error=Canadian%20case%20submissions%20are%20not%20open%20yet.");
  }

  try {
    const form = await request.formData();
    if (mode === "synthetic" && form.get("synthetic_rehearsal") !== "true") throw new Error("Synthetic rehearsal marker required.");

    const verification = await verifyTurnstileToken(form.get("cf-turnstile-response"), request, {
      expectedAction: "canada_submission_intake",
      expectedHostname: expectedTurnstileHostname(request)
    });
    if (!verification.ok) throw new Error(verification.message);

    for (const field of ["confirm_official_reporting", "confirm_authority", "confirm_public_review", "confirm_privacy"]) {
      if (form.get(field) !== "on") throw new Error("Required confirmation missing.");
    }

    const province = required(form, "last_seen_province_territory", "Province or territory", 2).toUpperCase();
    if (!PROVINCES.has(province)) throw new Error("Choose a valid province or territory.");
    const status = required(form, "status", "Case status", 40);
    if (!STATUSES.has(status)) throw new Error("Choose a valid case status.");

    const affiliationType = optional(form, "affiliation_type", 40);
    if (affiliationType && !AFFILIATION_TYPES.has(affiliationType)) throw new Error("Choose a valid Indigenous affiliation type.");
    const affiliationPermission = form.get("permission_to_publish_affiliation") === "on";

    const files = form.getAll("profile_photos").filter((item): item is File => item instanceof File && item.size > 0);
    if (files.length > MAX_UPLOAD_COUNT) throw new Error(`Please upload no more than ${MAX_UPLOAD_COUNT} images.`);
    if (files.length && form.get("confirm_photo_permission") !== "on") throw new Error("Please confirm permission to share uploaded photos for review.");

    const payload = {
      full_name: required(form, "full_name", "Full name", 200),
      age: form.get("age") ? Number(form.get("age")) : null,
      status,
      last_seen_date: optional(form, "last_seen_date", 20),
      last_seen_locality: required(form, "last_seen_locality", "Last-seen locality", 300),
      last_seen_province_territory: province,
      last_seen_postal_code: optional(form, "last_seen_postal_code", 7),
      lead_police_service: optional(form, "lead_police_service", 300),
      police_file_number: optional(form, "police_file_number", 200),
      official_tip_contact: optional(form, "official_tip_contact", 500),
      public_summary_proposed: appendIdentifyingDetailsToSummary(form, required(form, "public_summary_proposed", "Public facts for review", 8000)),
      submitter_name: required(form, "submitter_name", "Your name", 200),
      submitter_email: required(form, "submitter_email", "Your email", 320),
      submitter_phone: optional(form, "submitter_phone", 100),
      relationship: required(form, "relationship", "Relationship", 100),
      authority_basis: required(form, "authority_basis", "Authority or permission basis", 1000),
      consent_language: String(form.get("consent_language") ?? "en") === "fr" ? "fr" : "en",
      consent_text: "I authorize MMIPS Canada to review the submitted information for public awareness. I understand nothing is published automatically; public profile, affiliation, photo, and map release are separate review decisions; I can request correction, suppression, withdrawal, or deletion/de-identification review.",
      consent_version: "2026-08-12-v1",
      publication_requested: true,
      map_requested: form.get("map_requested") === "on",
      last_seen_area_public_proposed: optional(form, "last_seen_area_public_proposed", 500),
      public_latitude_proposed: null,
      public_longitude_proposed: null,
      review_status: "pending_review",
      synthetic: mode === "synthetic",
      source_ip: clientIpFromRequest(request)
    };

    const supabase = createServiceSupabaseClient();
    const { data: submission, error } = await supabase.from("submissions").insert(payload).select("id,public_reference").single();
    if (error || !submission?.id) throw error || new Error("Submission could not be stored.");

    if (affiliationType) {
      const { error: affiliationError } = await supabase.from("submission_indigenous_affiliations").insert({
        submission_id: submission.id,
        affiliation_type: affiliationType,
        preferred_people_or_nation_name: optional(form, "preferred_people_or_nation_name", 300),
        preferred_community_name: optional(form, "preferred_community_name", 300),
        inuit_region: optional(form, "inuit_region", 300),
        metis_government_or_community: optional(form, "metis_government_or_community", 300),
        permission_to_publish: affiliationPermission
      });
      if (affiliationError) throw affiliationError;
    }

    if (files.length) {
      const rows = [];
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const safe = await validateImageFile(file);
        const path = `${submission.id}/${String(index + 1).padStart(2, "0")}-${crypto.randomUUID()}.${safe.extension}`;
        const { error: uploadError } = await supabase.storage.from("mmips-canada-submission-photos").upload(path, file, { contentType: safe.contentType, upsert: false });
        if (uploadError) throw uploadError;
        rows.push({ submission_id: submission.id, storage_path: path, original_name: file.name.slice(0, 240), content_type: safe.contentType, size_bytes: file.size, alt_text: optional(form, "photo_alt_text", 500), is_main: index === 0, sort_order: index, permission_confirmed: true });
      }
      const { error: photoError } = await supabase.from("submission_photos").insert(rows);
      if (photoError) throw photoError;
    }

    await sendTransactionalEmail({
      to: payload.submitter_email,
      subject: "MMIPS Canada received your information for review",
      text: [
        `Hello ${payload.submitter_name},`,
        "MMIPS Canada received your information for review. Nothing has been published automatically.",
        submission.public_reference ? `Reference: ${submission.public_reference}` : null,
        mode === "synthetic" ? "This was a synthetic rehearsal submission. Do not use synthetic testing for real people or real cases." : "A moderator must review permission, safety, official contacts, public wording, photos, and any map location before release.",
        "MMIPS is not police or an emergency service. If someone is in immediate danger, call 911 and continue working with the police service of jurisdiction.",
        "Questions: contact@mmips.com"
      ].filter(Boolean).join("\n\n")
    });

    return redirect(request, `/submit/received?ref=${encodeURIComponent(submission.public_reference || "")}&country=ca`);
  } catch (error) {
    console.warn("MMIPS Canada submission rejected.", { code: "canada_submission_rejected", name: error instanceof Error ? error.name : "unknown" });
    return redirect(request, "/submit?error=The%20submission%20could%20not%20be%20processed.%20Please%20review%20the%20form%20and%20try%20again.");
  }
}
