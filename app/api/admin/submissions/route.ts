import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function cleanSearch(value: string | null) {
  return (value || "").trim().replace(/[,%]/g, " ").slice(0, 120);
}

export async function GET(request: Request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin.ok) return admin.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending_review";
    const q = cleanSearch(searchParams.get("q"));

    const query = admin.supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(q ? 250 : 100);

    if (status !== "all") {
      query.eq("review_status", status);
    }

    if (q) {
      const term = `%${q}%`;
      query.or([
        `full_name.ilike.${term}`,
        `status.ilike.${term}`,
        `profile_type.ilike.${term}`,
        `urgency_level.ilike.${term}`,
        `tribal_affiliation.ilike.${term}`,
        `last_seen_location.ilike.${term}`,
        `last_known_datetime.ilike.${term}`,
        `notification_area_requested.ilike.${term}`,
        `likely_travel_mode.ilike.${term}`,
        `possible_direction.ilike.${term}`,
        `vehicle_description.ilike.${term}`,
        `lead_agency.ilike.${term}`,
        `agency_case_number.ilike.${term}`,
        `namus_number.ilike.${term}`,
        `tip_contact.ilike.${term}`,
        `summary.ilike.${term}`,
        `submitter_name.ilike.${term}`,
        `submitter_email.ilike.${term}`
      ].join(","));
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
