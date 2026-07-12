import { createClient } from "@supabase/supabase-js";
import type { MmipsCase } from "./types";

export const sampleCases: MmipsCase[] = [
  {
    id: "demo-001",
    slug: "demo-case-family-approved",
    fullName: "Demo Profile — Family Approved Placeholder",
    age: 27,
    tribalAffiliation: "Tribal affiliation shown only with family approval",
    status: "missing",
    profileType: "missing",
    urgencyLevel: "standard",
    verification: ["mmips_reviewed", "family_verified", "agency_case_number"],
    lastSeenDate: "2026-07-01",
    lastSeenLocation: "Tahlequah, Oklahoma",
    publicLocationNote: "Approximate city-level location shown for safety.",
    leadAgency: "Example Police Department",
    agencyCaseNumber: "EX-2026-0001",
    namusNumber: "Pending / unknown",
    ncicStatus: "requested",
    tribeNotified: "unknown",
    familyLiaison: "unknown",
    lastPublicUpdate: "2026-07-05",
    summary: "This is a placeholder record to show how a public profile will look after moderation. Replace with verified, family-approved information only.",
    photoUrl: "/placeholder-person.svg",
    photoAltText: "MMIPS placeholder image",
    tipPhone: "911 for emergencies; list official tip line here",
    latitude: 35.9154,
    longitude: -94.96996,
    locationPrecision: "city",
    riskFlags: ["Public demo", "Do not use as a real profile"]
  }
];

function createPublicSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

function publicStorageUrl(bucket: string, path?: string | null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !path) return null;
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${url}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

function mapCase(row: any): MmipsCase {
  const person = Array.isArray(row.persons) ? row.persons[0] : row.persons;
  const verification = Array.isArray(row.case_verifications)
    ? row.case_verifications
        .map((item: any) => item.verification_type)
        .filter(Boolean)
        // A public profile has already been reviewed/approved. Never show a pending-review
        // label on a public profile, even if an older verification row contains it.
        .filter((status: string) => status !== "pending_review")
    : [];

  return {
    id: row.id,
    slug: row.slug,
    fullName: person?.full_name || "Name withheld",
    age: person?.age ?? null,
    tribalAffiliation: person?.tribal_affiliation || null,
    status: row.status,
    profileType: row.profile_type || (row.status === "murdered_unsolved" ? "murdered_info_needed" : row.status === "unidentified" ? "unidentified" : row.status === "resolved" ? "located" : "missing"),
    urgencyLevel: row.urgency_level || "standard",
    verification: verification.length ? verification : ["mmips_reviewed"],
    lastSeenDate: row.last_seen_date || null,
    lastKnownDatetime: row.last_known_datetime || null,
    lastKnownTimeZone: row.last_known_time_zone || null,
    lastSeenLocation: row.last_seen_area_public || [row.last_seen_city, row.last_seen_state].filter(Boolean).join(", ") || "Location withheld",
    publicLocationNote: `Public location precision: ${row.location_precision || "city"}.`,
    notificationAreaRequested: row.notification_area_requested || null,
    likelyTravelMode: row.likely_travel_mode || null,
    possibleDirection: row.possible_direction || null,
    vehicleDescription: row.vehicle_description || null,
    officialInfoPending: row.official_info_pending || false,
    leadAgency: row.lead_agency || null,
    agencyCaseNumber: row.agency_case_number || null,
    namusNumber: row.namus_number || null,
    ncicStatus: row.ncic_status || "unknown",
    tribeNotified: row.tribe_notified || "unknown",
    familyLiaison: row.family_liaison || "unknown",
    lastPublicUpdate: row.last_public_update || null,
    summary: row.public_summary,
    photoUrl: publicStorageUrl("mmips-public-case-photos", row.photo_storage_path) || "/placeholder-person.svg",
    photoAltText: row.photo_alt_text || null,
    tipPhone: row.official_tip_contact || "911 for emergencies; list official tip line here",
    latitude: row.latitude ? Number(row.latitude) : undefined,
    longitude: row.longitude ? Number(row.longitude) : undefined,
    locationPrecision: row.location_precision || "city",
    riskFlags: []
  };
}

export async function getPublishedCases(): Promise<MmipsCase[]> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return sampleCases;

  const { data, error } = await supabase
    .from("cases")
    .select("*, persons(*), case_verifications(*)")
    .eq("review_status", "approved")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Could not load published profiles", error);
    return [];
  }

  if (!data?.length) return [];
  return data.map(mapCase);
}

export async function getCaseBySlug(slug: string): Promise<MmipsCase | null> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return sampleCases.find((item) => item.slug === slug) || null;

  const { data, error } = await supabase
    .from("cases")
    .select("*, persons(*), case_verifications(*)")
    .eq("slug", slug)
    .eq("review_status", "approved")
    .not("published_at", "is", null)
    .maybeSingle();

  if (error) {
    console.error("Could not load public profile", error);
    return null;
  }

  if (!data) return null;
  return mapCase(data);
}
