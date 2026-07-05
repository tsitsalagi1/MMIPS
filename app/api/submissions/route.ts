import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { clientIpFromRequest, verifyTurnstileToken } from "@/lib/security/turnstile";

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

function getOptionalImage(form: FormData) {
  const file = form.get("case_photo");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Photo upload must be a JPG, PNG, WebP, or GIF image.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Photo upload must be 5 MB or smaller.");
  }
  const confirmed = form.get("confirm_photo_permission") === "on";
  if (!confirmed) {
    throw new Error("Please confirm you have permission to share the uploaded image.");
  }
  return file;
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

    const imageFile = getOptionalImage(form);
    const photoAltText = String(form.get("photo_alt_text") ?? "").trim() || null;

    const payload: Record<string, unknown> = {
      full_name: required(form.get("full_name"), "Full name"),
      age: form.get("age") ? Number(form.get("age")) : null,
      status: required(form.get("status"), "Status"),
      tribal_affiliation: String(form.get("tribal_affiliation") ?? "").trim() || null,
      last_seen_date: String(form.get("last_seen_date") ?? "").trim() || null,
      last_seen_location: required(form.get("last_seen_location"), "Last seen location"),
      lead_agency: String(form.get("lead_agency") ?? "").trim() || null,
      agency_case_number: String(form.get("agency_case_number") ?? "").trim() || null,
      namus_number: String(form.get("namus_number") ?? "").trim() || null,
      tip_contact: String(form.get("tip_contact") ?? "").trim() || null,
      summary: required(form.get("summary"), "Summary"),
      submitter_name: required(form.get("submitter_name"), "Submitter name"),
      submitter_email: required(form.get("submitter_email"), "Submitter email"),
      submitter_phone: String(form.get("submitter_phone") ?? "").trim() || null,
      relationship: required(form.get("relationship"), "Relationship"),
      source_ip: clientIpFromRequest(request),
      review_status: "pending_review",
      photo_alt_text: photoAltText
    };

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      console.info("Submission captured in demo mode:", { ...payload, imageFile: imageFile ? { name: imageFile.name, type: imageFile.type, size: imageFile.size } : null });
      return redirectTo(request, "/submit/received?mode=demo");
    }

    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

    if (imageFile) {
      const filePath = `submissions/${crypto.randomUUID()}-${safeFileName(imageFile.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("mmips-submission-photos")
        .upload(filePath, imageFile, { contentType: imageFile.type, upsert: false });
      if (uploadError) throw uploadError;
      payload.photo_storage_path = filePath;
      payload.photo_original_name = imageFile.name;
      payload.photo_content_type = imageFile.type;
      payload.photo_size = imageFile.size;
      payload.photo_permission_confirmed = true;
    }

    const { error } = await supabase.from("submissions").insert(payload);

    if (error) throw error;

    return redirectTo(request, "/submit/received");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Submission failed.";
    return redirectTo(request, `/submit?error=${encodeURIComponent(message)}`);
  }
}
