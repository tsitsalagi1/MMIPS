import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CaseStatus, ProfileType } from "./types";

export const PUBLIC_MAP_PRECISIONS = ["state", "broad_region", "tribal_region", "county", "city_centroid"] as const;
export type PublicMapPrecision = typeof PUBLIC_MAP_PRECISIONS[number];
export type PublicMapAvailability = "available" | "unconfigured" | "error";
export type PublicMapSourceCountry = "ca" | "us";

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
  sourceCountry?: PublicMapSourceCountry;
  profileUrl?: string;
}

export interface PublicMapResult {
  points: PublicMapPoint[];
  availability: PublicMapAvailability;
}

export interface PublicProfileSearchFilters {
  q: string;
  status: string;
  state: string;
}

export interface PublicProfileIdSearchResult {
  ids: string[];
  availability: PublicMapAvailability;
}

const FORBIDDEN_PRECISIONS = new Set(["exact", "address", "street", "building", "shelter", "home", "gps_device", "raw_last_known_coordinate"]);
const MAP_POINT_PAGE_SIZE = 1000;
const MAP_PROJECTION = "public_map_profile_projection";
const MAP_POINT_SELECT = "case_id, slug, public_name, profile_type, public_status, public_label, public_latitude, public_longitude, precision, region_type, last_public_update, updated_at";
const SEARCH_PROJECTION_SELECT = "case_id, public_name, public_status, public_label, last_seen_area_public, last_seen_city, last_seen_state, lead_agency, namus_number, tribal_affiliation, updated_at";
export const PUBLIC_MAP_ZIP_RADIUS_MILES = 100;

export function isPublicMapPrecision(value: unknown): value is PublicMapPrecision {
  return typeof value === "string" && (PUBLIC_MAP_PRECISIONS as readonly string[]).includes(value) && !FORBIDDEN_PRECISIONS.has(value);
}

function createPublicSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

function distanceMiles(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const earthRadiusMiles = 3958.7613;
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLon = toRadians(b.longitude - a.longitude);
  const h = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * earthRadiusMiles * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function sanitizePublicMapRows(rows: unknown[] | null | undefined): PublicMapPoint[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((unknownRow) => {
    const row = unknownRow as Record<string, any>;
    const nestedCase = Array.isArray(row.cases) ? row.cases[0] : row.cases;
    const person = Array.isArray(nestedCase?.persons) ? nestedCase.persons[0] : nestedCase?.persons;

    // Preserve the explicit sanitizer guard for legacy/nested test inputs. The
    // production projection itself is already constrained by underlying RLS.
    if (nestedCase && (nestedCase.review_status !== "approved" || !nestedCase.published_at)) return [];
    if (!isPublicMapPrecision(row.precision)) return [];

    const caseId = row.case_id || nestedCase?.id;
    const slug = row.slug || nestedCase?.slug;
    if (typeof caseId !== "string" || typeof slug !== "string") return [];

    const lat = Number(row.public_latitude);
    const lon = Number(row.public_longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return [];

    return [{
      caseId,
      slug,
      publicName: row.public_name || person?.full_name || "Name withheld",
      profileType: row.profile_type || nestedCase?.profile_type || "unknown",
      publicStatus: row.public_status || nestedCase?.status || "unknown",
      publicMapLabel: row.public_label || "Approved approximate public-awareness area",
      publicLatitude: lat,
      publicLongitude: lon,
      precision: row.precision,
      regionType: row.region_type || "public_awareness_area",
      lastPublicUpdate: row.last_public_update || row.updated_at || nestedCase?.last_public_update || nestedCase?.updated_at || null
    }];
  });
}

export async function loadAllPublicMapPoints(client: SupabaseClient | null = createPublicSupabaseClient()): Promise<PublicMapResult> {
  if (!client) return { points: [], availability: "unconfigured" };

  const points: PublicMapPoint[] = [];
  try {
    for (let from = 0; ; from += MAP_POINT_PAGE_SIZE) {
      const to = from + MAP_POINT_PAGE_SIZE - 1;
      const { data, error } = await client
        .from(MAP_PROJECTION)
        .select(MAP_POINT_SELECT)
        .order("updated_at", { ascending: false })
        .order("case_id", { ascending: true })
        .range(from, to);
      if (error) throw error;
      const page = sanitizePublicMapRows(data);
      points.push(...page);
      if (!data || data.length < MAP_POINT_PAGE_SIZE) break;
    }
    return { points, availability: "available" };
  } catch (error) {
    console.error("Public map projection unavailable", { code: (error as { code?: string })?.code || "PUBLIC_MAP_READ_FAILED" });
    return { points: [], availability: "error" };
  }
}

export async function getPublicMapPoints(): Promise<PublicMapResult> {
  return loadAllPublicMapPoints();
}

export async function searchPublicProfileIds(filters: PublicProfileSearchFilters, client: SupabaseClient | null = createPublicSupabaseClient()): Promise<PublicProfileIdSearchResult> {
  if (!client) return { ids: [], availability: "unconfigured" };

  try {
    const normalizedQuery = filters.q.trim().replace(/[%_]/g, "").slice(0, 120);
    const normalizedState = filters.state.trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
    const normalizedStatus = filters.status.trim();
    let query = client.from(MAP_PROJECTION).select(SEARCH_PROJECTION_SELECT);

    if (normalizedStatus && normalizedStatus !== "all") query = query.eq("public_status", normalizedStatus);
    if (normalizedState) query = query.eq("last_seen_state", normalizedState);
    if (normalizedQuery) {
      const escaped = normalizedQuery.replace(/,/g, " ");
      query = query.or(`public_name.ilike.%${escaped}%,public_label.ilike.%${escaped}%,last_seen_area_public.ilike.%${escaped}%,last_seen_city.ilike.%${escaped}%,lead_agency.ilike.%${escaped}%,namus_number.ilike.%${escaped}%,tribal_affiliation.ilike.%${escaped}%`);
    }

    const { data, error } = await query.order("updated_at", { ascending: false }).limit(5000);
    if (error) throw error;
    const ids = Array.from(new Set((data || []).map((row: any) => row.case_id).filter((id: unknown): id is string => typeof id === "string")));
    return { ids, availability: "available" };
  } catch (error) {
    console.error("Public profile search projection unavailable", { code: (error as { code?: string })?.code || "PUBLIC_SEARCH_READ_FAILED" });
    return { ids: [], availability: "error" };
  }
}

export async function queryNearbyPublicMapPoints(center: { latitude: number; longitude: number }, radiusMiles = PUBLIC_MAP_ZIP_RADIUS_MILES): Promise<PublicMapResult> {
  const result = await loadAllPublicMapPoints();
  if (result.availability !== "available") return result;
  return {
    availability: "available",
    points: result.points.filter((point) => distanceMiles(center, { latitude: point.publicLatitude, longitude: point.publicLongitude }) <= radiusMiles)
  };
}
