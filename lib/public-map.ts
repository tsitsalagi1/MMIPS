import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CaseStatus, ProfileType } from "./types";

export const PUBLIC_MAP_PRECISIONS = ["state", "broad_region", "tribal_region", "county", "city_centroid"] as const;
export type PublicMapPrecision = typeof PUBLIC_MAP_PRECISIONS[number];
export type PublicMapAvailability = "available" | "unconfigured" | "error";

export interface PublicMapPoint {
  caseId: string;
  slug: string;
  publicName: string;
  profileType: ProfileType;
  publicStatus: CaseStatus;
  publicMapLabel: string;
  publicLatitude: number;
  publicLongitude: number;
  precision: PublicMapPrecision;
  regionType: string;
  lastPublicUpdate: string | null;
}

export interface PublicMapResult {
  points: PublicMapPoint[];
  availability: PublicMapAvailability;
}

const FORBIDDEN_PRECISIONS = new Set(["exact", "address", "street", "building", "shelter", "home", "gps_device", "raw_last_known_coordinate"]);

export function isPublicMapPrecision(value: unknown): value is PublicMapPrecision {
  return typeof value === "string" && (PUBLIC_MAP_PRECISIONS as readonly string[]).includes(value) && !FORBIDDEN_PRECISIONS.has(value);
}

function createPublicSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

export function sanitizePublicMapRows(rows: unknown[] | null | undefined): PublicMapPoint[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((unknownRow) => {
    const row = unknownRow as Record<string, any>;
    const caseRow = Array.isArray(row.cases) ? row.cases[0] : row.cases;
    const person = Array.isArray(caseRow?.persons) ? caseRow.persons[0] : caseRow?.persons;
    if (!caseRow || caseRow.review_status !== "approved" || !caseRow.published_at) return [];
    if (row.moderator_approved !== true || row.hidden_at) return [];
    if (!isPublicMapPrecision(row.precision)) return [];
    const lat = Number(row.public_latitude);
    const lon = Number(row.public_longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return [];
    return [{
      caseId: caseRow.id,
      slug: caseRow.slug,
      publicName: person?.full_name || "Name withheld",
      profileType: caseRow.profile_type || "unknown",
      publicStatus: caseRow.status || "unknown",
      publicMapLabel: row.public_label,
      publicLatitude: lat,
      publicLongitude: lon,
      precision: row.precision,
      regionType: row.region_type || "approved public area",
      lastPublicUpdate: caseRow.last_public_update || null
    } satisfies PublicMapPoint];
  });
}

type PublicMapClient = Pick<SupabaseClient, "from">;

export async function loadPublicMapPoints(client: PublicMapClient): Promise<PublicMapResult> {
  const { data, error } = await client
    .from("public_case_map_points")
    .select("case_id, public_label, public_latitude, public_longitude, precision, region_type, moderator_approved, hidden_at, cases!inner(id, slug, status, profile_type, review_status, published_at, last_public_update, persons(full_name))")
    .eq("moderator_approved", true)
    .is("hidden_at", null)
    .order("updated_at", { ascending: false })
    .limit(250);
  if (error) {
    console.error("Public map request failed", { code: "PUBLIC_MAP_QUERY_FAILED" });
    return { points: [], availability: "error" };
  }
  return { points: sanitizePublicMapRows(data), availability: "available" };
}

export async function getPublicMapPoints(): Promise<PublicMapResult> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return { points: [], availability: "unconfigured" };
  return loadPublicMapPoints(supabase);
}

export interface PublicMapFilters { profileType: string; status: string; region: string; }
export function filterPublicMapPoints(points: PublicMapPoint[], filters: PublicMapFilters): PublicMapPoint[] {
  return points.filter((point) =>
    (filters.profileType === "all" || point.profileType === filters.profileType) &&
    (filters.status === "all" || point.publicStatus === filters.status) &&
    (filters.region === "all" || point.publicMapLabel === filters.region)
  );
}
