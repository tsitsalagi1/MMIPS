import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function required(value: FormDataEntryValue | null, field: string) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new Error(`${field} is required.`);
  return text;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();

    const payload = {
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
      review_status: "pending_review"
    };

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      console.info("Submission captured in demo mode:", payload);
      return NextResponse.json({ ok: true, mode: "demo", message: "Submission received in demo mode. Configure Supabase to store submissions." });
    }

    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { error } = await supabase.from("submissions").insert(payload);

    if (error) throw error;

    return NextResponse.json({ ok: true, message: "Submission received for review." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Submission failed.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
