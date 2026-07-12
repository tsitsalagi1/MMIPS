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
    const visibility = searchParams.get("visibility") || "published";
    const q = cleanSearch(searchParams.get("q"));

    if (q.length < 2) {
      return NextResponse.json({ ok: true, profiles: [], requiresSearch: true });
    }

    let personIds: string[] = [];
    if (q) {
      const term = `%${q}%`;
      const { data: people, error: peopleError } = await admin.supabase
        .from("persons")
        .select("id")
        .or(`full_name.ilike.${term},tribal_affiliation.ilike.${term}`)
        .limit(100);
      if (peopleError) throw peopleError;
      personIds = (people || []).map((person: any) => person.id).filter(Boolean);
    }

    const query = admin.supabase
      .from("cases")
      .select(`
        id,
        slug,
        status,
        profile_type,
        urgency_level,
        review_status,
        public_summary,
        last_seen_date,
        last_known_datetime,
        last_known_time_zone,
        last_seen_area_public,
        notification_area_requested,
        likely_travel_mode,
        possible_direction,
        vehicle_description,
        official_info_pending,
        location_precision,
        lead_agency,
        agency_case_number,
        namus_number,
        official_tip_contact,
        ncic_status,
        tribe_notified,
        family_liaison,
        last_public_update,
        published_at,
        person_id,
        persons(id, full_name, age, tribal_affiliation)
      `)
      .order("updated_at", { ascending: false })
      .limit(250);

    if (visibility === "published") {
      query.eq("review_status", "approved").not("published_at", "is", null);
    } else if (visibility === "hidden") {
      query.eq("review_status", "hidden");
    }

    if (q) {
      const term = `%${q}%`;
      const orParts = [
        `slug.ilike.${term}`,
        `status.ilike.${term}`,
        `profile_type.ilike.${term}`,
        `urgency_level.ilike.${term}`,
        `public_summary.ilike.${term}`,
        `last_seen_area_public.ilike.${term}`,
        `notification_area_requested.ilike.${term}`,
        `likely_travel_mode.ilike.${term}`,
        `possible_direction.ilike.${term}`,
        `vehicle_description.ilike.${term}`,
        `lead_agency.ilike.${term}`,
        `agency_case_number.ilike.${term}`,
        `namus_number.ilike.${term}`,
        `official_tip_contact.ilike.${term}`,
        `ncic_status.ilike.${term}`,
        `tribe_notified.ilike.${term}`,
        `family_liaison.ilike.${term}`
      ];
      if (personIds.length) orParts.push(`person_id.in.(${personIds.join(",")})`);
      query.or(orParts.join(","));
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ ok: true, profiles: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load public profiles.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
