import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export function createServiceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase service environment variables are missing.");
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

function allowedAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!token) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, code: "admin_token_missing", message: "Missing admin token." }, { status: 401 })
    };
  }

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user?.email) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, code: "admin_session_invalid", message: "Invalid admin session." }, { status: 401 })
    };
  }

  const email = data.user.email.toLowerCase();
  const allowed = allowedAdminEmails();

  if (!allowed.length || !allowed.includes(email)) {
    await supabase.from("audit_log").insert({
      actor_id: data.user.id,
      action: "admin_access_denied",
      entity_type: "admin",
      reason: "Authenticated email is not in the admin allowlist."
    });

    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, code: "admin_not_allowlisted", message: "This account is not authorized for MMIPS admin." }, { status: 403 })
    };
  }

  const hasVerifiedMfa = Boolean(data.user.factors?.some((factor) => factor.status === "verified"));
  if (hasVerifiedMfa) {
    const { data: claimData, error: claimError } = await supabase.auth.getClaims(token);
    const aal = claimData?.claims?.aal;
    if (claimError || aal !== "aal2") {
      return {
        ok: false as const,
        response: NextResponse.json({ ok: false, code: "admin_mfa_required", message: "Authenticator verification is required for this admin account." }, { status: 403 })
      };
    }
  }

  return { ok: true as const, supabase, user: data.user, email };
}
