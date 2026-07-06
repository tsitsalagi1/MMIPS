import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyTurnstileToken } from "@/lib/security/turnstile";

function required(value: FormDataEntryValue | null, field: string) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new Error(`${field} is required.`);
  return text;
}

function redirectTo(request: Request, path: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const base = siteUrl || new URL(request.url).origin;
  return NextResponse.redirect(new URL(path, base), { status: 303 });
}

export async function GET(request: Request) {
  return redirectTo(request, "/corrections");
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();

    const verification = await verifyTurnstileToken(form.get("cf-turnstile-response"), request);
    if (!verification.ok) {
      throw new Error(verification.message);
    }

    const caseReference = String(form.get("case_reference") ?? "").trim();
    const requestType = required(form.get("request_type"), "Request type");
    const requestDetails = required(form.get("request_details"), "Request details");
    const requesterName = required(form.get("requester_name"), "Your name");
    const requesterEmail = required(form.get("requester_email"), "Your email");
    const relationship = required(form.get("relationship"), "Relationship");
    const requesterPhone = String(form.get("requester_phone") ?? "").trim();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      console.info("Correction/removal request captured in demo mode:", {
        caseReference,
        requestType,
        requestDetails,
        requesterName,
        requesterEmail,
        requesterPhone,
        relationship
      });
      return redirectTo(request, "/corrections/received?mode=demo");
    }

    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
    let caseId: string | null = null;

    if (caseReference) {
      const slug = caseReference.split("/profiles/").pop()?.split("?")[0]?.split("#")[0]?.replace(/^\/+|\/+$/g, "") || caseReference;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      const lookup = supabase.from("cases").select("id").limit(1);
      const { data: caseRows } = isUuid
        ? await lookup.or(`slug.eq.${slug},id.eq.${slug}`)
        : await lookup.eq("slug", slug);
      caseId = caseRows?.[0]?.id || null;
    }

    const { error } = await supabase.from("correction_requests").insert({
      case_id: caseId,
      requester_name: requesterName,
      requester_email: requesterEmail,
      relationship,
      request_type: requestType,
      request_details: [
        caseReference ? `Profile reference: ${caseReference}` : "Profile reference: not provided",
        requesterPhone ? `Requester phone: ${requesterPhone}` : null,
        "",
        requestDetails
      ].filter(Boolean).join("\n"),
      review_status: "pending_review"
    });

    if (error) throw error;

    return redirectTo(request, "/corrections/received");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return redirectTo(request, `/corrections?error=${encodeURIComponent(message)}`);
  }
}
