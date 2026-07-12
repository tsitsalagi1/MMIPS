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

    const submissionIds = (data || []).map((item: any) => item.id);
    let photosBySubmission: Record<string, any[]> = {};

    if (submissionIds.length) {
      const { data: photoRows, error: photoError } = await admin.supabase
        .from("submission_photos")
        .select("*")
        .in("submission_id", submissionIds)
        .order("sort_order", { ascending: true });
      if (photoError && photoError.code !== "42P01") throw photoError;

      for (const photo of photoRows || []) {
        const { data: signed } = await admin.supabase.storage
          .from("mmips-submission-photos")
          .createSignedUrl(photo.storage_path, 60 * 60);
        const next = { ...photo, signed_url: signed?.signedUrl || null };
        photosBySubmission[photo.submission_id] = [...(photosBySubmission[photo.submission_id] || []), next];
      }
    }

    const submissions = await Promise.all((data || []).map(async (item: any) => {
      const photos = photosBySubmission[item.id] || [];
      if (photos.length) return { ...item, photos, photo_signed_url: photos.find((photo) => photo.is_main)?.signed_url || photos[0]?.signed_url || null };
      if (!item.photo_storage_path) return { ...item, photos: [] };
      const { data: signed } = await admin.supabase.storage
        .from("mmips-submission-photos")
        .createSignedUrl(item.photo_storage_path, 60 * 60);
      return { ...item, photos: [], photo_signed_url: signed?.signedUrl || null };
    }));

    return NextResponse.json({ ok: true, submissions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load submissions.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
