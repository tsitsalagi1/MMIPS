import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { clientIpFromRequest, verifyTurnstileToken } from "@/lib/security/turnstile";
import { sendTransactionalEmail } from "@/lib/email";

function required(value: FormDataEntryValue | null, field: string) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new Error(`${field} is required.`);
  return text;
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function safeFileName(name: string) {
  const cleaned = name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned || "uploaded-image";
}

const MAX_UPLOAD_COUNT = 5;

type SubmittedPhotoPreference = {
  index: number;
  originalName?: string;
  photoType?: string;
  caption?: string;
  useOnProfile?: boolean;
  useOnFlyer?: boolean;
  isMain?: boolean;
  sortOrder?: number;
};

function parsePhotoPreferences(form: FormData): SubmittedPhotoPreference[] {
  const raw = String(form.get("photo_preferences") ?? "").trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.photos)) return [];
    return parsed.photos.map((item: any, fallbackIndex: number) => ({
      index: Number.isFinite(Number(item.index)) ? Number(item.index) : fallbackIndex,
      originalName: typeof item.originalName === "string" ? item.originalName : undefined,
      photoType: typeof item.photoType === "string" ? item.photoType : "other",
      caption: typeof item.caption === "string" ? item.caption.trim().slice(0, 240) : "",
      useOnProfile: item.useOnProfile !== false,
      useOnFlyer: item.useOnFlyer !== false,
      isMain: item.isMain === true,
      sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : fallbackIndex
    }));
  } catch {
    return [];
  }
}

function normalizePhotoType(value?: string) {
  const allowed = new Set(["main_face", "full_body", "identifying_mark", "clothing_item", "vehicle", "official_flyer", "other"]);
  return value && allowed.has(value) ? value : "other";
}

function getOptionalImages(form: FormData) {
  let files = form.getAll("profile_photos").filter((item): item is File => item instanceof File && item.size > 0);
  const legacyFile = form.get("case_photo");
  if (!files.length && legacyFile instanceof File && legacyFile.size > 0) files = [legacyFile];
  if (!files.length) return [];

  if (files.length > MAX_UPLOAD_COUNT) {
    throw new Error(`Please upload no more than ${MAX_UPLOAD_COUNT} images.`);
  }

  const confirmed = form.get("confirm_photo_permission") === "on";
  if (!confirmed) {
    throw new Error("Please confirm you have permission to share the uploaded images.");
  }

  const preferences = parsePhotoPreferences(form);
  const mainIndexFromPrefs = preferences.find((pref) => pref.isMain)?.index;

  return files.map((file, index) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      throw new Error("Photo uploads must be JPG, PNG, WebP, or GIF images.");
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error("Each photo upload must be 5 MB or smaller.");
    }
    const pref = preferences.find((item) => item.index === index) || preferences[index] || { index };
    return {
      file,
      index,
      photoType: normalizePhotoType(pref.photoType),
      caption: pref.caption || null,
      useOnProfile: pref.useOnProfile !== false,
      useOnFlyer: pref.useOnFlyer !== false,
      isMain: mainIndexFromPrefs === undefined ? index === 0 : mainIndexFromPrefs === index,
      sortOrder: Number.isFinite(Number(pref.sortOrder)) ? Number(pref.sortOrder) : index
    };
  }).map((photo, index, all) => {
    if (!all.some((item) => item.isMain) && index === 0) return { ...photo, isMain: true, useOnProfile: true, useOnFlyer: true };
    if (photo.isMain) return { ...photo, useOnProfile: true, useOnFlyer: true };
    return photo;
  });
}


function normalizeProfileType(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  if (["urgent_missing", "missing", "murdered_info_needed", "unidentified"].includes(text)) return text;
  return "missing";
}

function statusForProfileType(profileType: string) {
  if (profileType === "murdered_info_needed") return "murdered_unsolved";
  if (profileType === "unidentified") return "unidentified";
  return "missing";
}

function optionalText(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim() || null;
}

function optionalDateTimeLocal(form: FormData, name: string) {
  const value = optionalText(form, name);
  if (!value) return null;
  // datetime-local arrives without a timezone. Store a best-effort ISO-like string so admins can read it.
  return value;
}

function redirectTo(request: Request, path: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const base = siteUrl || new URL(request.url).origin;
  return NextResponse.redirect(new URL(path, base), { status: 303 });
}

export async function GET(request: Request) {
  return redirectTo(request, "/submit");
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();

    const verification = await verifyTurnstileToken(form.get("cf-turnstile-response"), request);
    if (!verification.ok) {
      throw new Error(verification.message);
    }

    const imageFiles = getOptionalImages(form);
    const photoAltText = optionalText(form, "photo_alt_text");
    const profileType = normalizeProfileType(form.get("profile_type"));
    const isUrgent = profileType === "urgent_missing";

    if (isUrgent && form.get("confirm_report_first") !== "on") {
      throw new Error("For urgent public-awareness requests, please confirm that official reporting has been started or must be started immediately.");
    }
    if (isUrgent && form.get("confirm_mmips_no_tips") !== "on") {
      throw new Error("Please confirm that tips should go to 911 or the listed official contact, not MMIPS.");
    }

    const payload: Record<string, unknown> = {
      full_name: required(form.get("full_name"), "Full name"),
      age: form.get("age") ? Number(form.get("age")) : null,
      status: statusForProfileType(profileType),
      profile_type: profileType,
      urgency_level: optionalText(form, "urgency_level") || (isUrgent ? "urgent_public_awareness" : profileType === "murdered_info_needed" ? "renewed_visibility" : "standard"),
      tribal_affiliation: optionalText(form, "tribal_affiliation"),
      last_seen_date: optionalText(form, "last_seen_date"),
      last_seen_location: required(form.get("last_seen_location"), "Public location text"),
      last_known_datetime: optionalDateTimeLocal(form, "last_known_datetime"),
      last_known_time_zone: optionalText(form, "last_known_time_zone"),
      last_known_location_private: optionalText(form, "last_known_location_private"),
      notification_area_requested: optionalText(form, "notification_area_requested"),
      likely_travel_mode: optionalText(form, "likely_travel_mode"),
      possible_direction: optionalText(form, "possible_direction"),
      vehicle_description: optionalText(form, "vehicle_description"),
      official_info_pending: form.get("official_info_pending") === "on",
      official_report_contacted: form.get("confirm_report_first") === "on",
      lead_agency: optionalText(form, "lead_agency"),
      agency_case_number: optionalText(form, "agency_case_number"),
      namus_number: optionalText(form, "namus_number"),
      tip_contact: optionalText(form, "tip_contact"),
      summary: required(form.get("summary"), "Summary"),
      submitter_name: required(form.get("submitter_name"), "Submitter name"),
      submitter_email: required(form.get("submitter_email"), "Submitter email"),
      submitter_phone: optionalText(form, "submitter_phone"),
      relationship: required(form.get("relationship"), "Relationship"),
      source_ip: clientIpFromRequest(request),
      review_status: "pending_review",
      photo_alt_text: photoAltText
    };

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      console.info("Submission captured in demo mode:", { ...payload, imageFiles: imageFiles.map((item) => ({ name: item.file.name, type: item.file.type, size: item.file.size })) });
      return redirectTo(request, "/submit/received?mode=demo");
    }

    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

    const { data: submissionRow, error } = await supabase
      .from("submissions")
      .insert(payload)
      .select("id")
      .single();

    if (error) throw error;

    if (imageFiles.length && submissionRow?.id) {
      const photoRows = [];
      for (const photo of imageFiles) {
        const filePath = `submissions/${submissionRow.id}/${photo.sortOrder}-${crypto.randomUUID()}-${safeFileName(photo.file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("mmips-submission-photos")
          .upload(filePath, photo.file, { contentType: photo.file.type, upsert: false });
        if (uploadError) throw uploadError;
        photoRows.push({
          submission_id: submissionRow.id,
          storage_path: filePath,
          original_name: photo.file.name,
          content_type: photo.file.type,
          size_bytes: photo.file.size,
          alt_text: photo.caption || photoAltText,
          caption: photo.caption,
          photo_type: photo.photoType,
          use_on_profile: photo.useOnProfile,
          use_on_flyer: photo.useOnFlyer,
          is_main: photo.isMain,
          sort_order: photo.sortOrder,
          permission_confirmed: true
        });
      }

      const { error: photoRowsError } = await supabase.from("submission_photos").insert(photoRows);
      if (photoRowsError) throw photoRowsError;

      const mainPhoto = photoRows.find((photo) => photo.is_main) || photoRows[0];
      await supabase
        .from("submissions")
        .update({
          photo_storage_path: mainPhoto.storage_path,
          photo_original_name: mainPhoto.original_name,
          photo_content_type: mainPhoto.content_type,
          photo_size: mainPhoto.size_bytes,
          photo_alt_text: mainPhoto.alt_text,
          photo_permission_confirmed: true
        })
        .eq("id", submissionRow.id);
    }

    await sendTransactionalEmail({
      to: String(payload.submitter_email || ""),
      subject: "MMIPS received your submitted information",
      text: [
        `Hello ${payload.submitter_name || ""},`,
        `MMIPS received your ${profileType === "urgent_missing" ? "urgent public-awareness" : profileType === "murdered_info_needed" ? "information-needed" : "public-awareness"} submission for review.`,
        "Nothing has been published. An MMIPS reviewer will review it for consent, safety, and accuracy before anything appears publicly.",
        submissionRow?.id ? `Reference ID: ${submissionRow.id}` : null,
        "If this is an emergency or someone is in immediate danger, call 911. MMIPS is not law enforcement and does not replace a police report, NamUs, Tribal law enforcement, BIA MMU, FBI, or local authorities.",
        "Questions or updates: contact@mmips.com"
      ].filter(Boolean).join("\n\n")
    });

    return redirectTo(request, "/submit/received");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Submission failed.";
    return redirectTo(request, `/submit?error=${encodeURIComponent(message)}`);
  }
}
