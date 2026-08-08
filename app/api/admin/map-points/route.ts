import { NextResponse } from "next/server";
import { safeApiError } from "@/lib/security/api-errors";
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
    const q = cleanSearch(searchParams.get("q"));
    if (q.length < 2) return NextResponse.json({ ok: true, profiles: [], requiresSearch: true });

    const term = `%${q}%`;
    const { data: people, error: peopleError } = await admin.supabase
      .from("persons")
      .select("id")
      .or(`full_name.ilike.${term},tribal_affiliation.ilike.${term}`)
      .limit(100);
    if (peopleError) throw peopleError;

    const personIds = (people || []).map((person: { id?: string }) => person.id).filter(Boolean) as string[];
    const orParts = [
      `slug.ilike.${term}`,
      `last_seen_area_public.ilike.${term}`
    ];
    if (personIds.length) orParts.push(`person_id.in.(${personIds.join(",")})`);

    const { data, error } = await admin.supabase
      .from("cases")
      .select(`
        id,
        slug,
        status,
        profile_type,
        review_status,
        published_at,
        last_seen_area_public,
        persons(id, full_name, tribal_affiliation),
        public_case_map_points(id, public_label, public_latitude, public_longitude, precision, region_type, moderator_approved, safety_reviewed_at, hidden_at, updated_at)
      `)
      .eq("review_status", "approved")
      .not("published_at", "is", null)
      .or(orParts.join(","))
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) throw error;

    return NextResponse.json({ ok: true, profiles: data || [] });
  } catch {
    return safeApiError({ code: "admin_map_points_lookup_failed", message: "Could not load published profiles for map review." });
  }
}
