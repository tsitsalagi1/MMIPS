import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending_review";

    const query = admin.supabase
      .from("correction_requests")
      .select("*, cases(slug, public_summary, persons(full_name))")
      .order("created_at", { ascending: false })
      .limit(100);

    if (status !== "all") query.eq("review_status", status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ ok: true, correctionRequests: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load correction requests.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
