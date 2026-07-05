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
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (status !== "all") {
      query.eq("review_status", status);
    }

    const { data, error } = await query;
    if (error) throw error;

    const submissions = await Promise.all((data || []).map(async (item: any) => {
      if (!item.photo_storage_path) return item;
      const { data: signed } = await admin.supabase.storage
        .from("mmips-submission-photos")
        .createSignedUrl(item.photo_storage_path, 60 * 60);
      return { ...item, photo_signed_url: signed?.signedUrl || null };
    }));

    return NextResponse.json({ ok: true, submissions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load submissions.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
