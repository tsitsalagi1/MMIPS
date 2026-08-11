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
      publicMapLabel: row.public_label,
      publicLatitude: lat,
      publicLongitude: lon,
      precision: row.precision,
      regionType: row.region_type || "approved public area",
      lastPublicUpdate: row.last_public_update ?? nestedCase?.last_public_update ?? null
    } satisfies PublicMapPoint];
  });
}

type PublicMapClient = Pick<SupabaseClient, "from">;

async function loadAllProjectionRows(client: PublicMapClient, select: string) {
  const rows: any[] = [];
  for (let from = 0; ; from += MAP_POINT_PAGE_SIZE) {
    const { data, error } = await client
      .from(MAP_PROJECTION)
      .select(select)
      .order("updated_at", { ascending: false })
      .range(from, from + MAP_POINT_PAGE_SIZE - 1);

    if (error) return { rows: [] as any[], error };
    const page = data || [];
    rows.push(...page);
    if (page.length < MAP_POINT_PAGE_SIZE) break;
  }
  return { rows, error: null };
}

async function loadNearbyProjectionRows(client: PublicMapClient, latitude: number, longitude: number, radiusMiles: number) {
  const rows: any[] = [];
  const latitudeDelta = radiusMiles / 69.0;
  const longitudeScale = Math.max(0.2, Math.cos(latitude * Math.PI / 180));
  const longitudeDelta = radiusMiles / (69.0 * longitudeScale);

  for (let from = 0; ; from += MAP_POINT_PAGE_SIZE) {
    const { data, error } = await client
      .from(MAP_PROJECTION)
      .select(MAP_POINT_SELECT)
      .gte("public_latitude", latitude - latitudeDelta)
      .lte("public_latitude", latitude + latitudeDelta)
      .gte("public_longitude", longitude - longitudeDelta)
      .lte("public_longitude", longitude + longitudeDelta)
      .order("updated_at", { ascending: false })
      .range(from, from + MAP_POINT_PAGE_SIZE - 1);

    if (error) return { rows: [] as any[], error };
    const page = data || [];
    rows.push(...page);
    if (page.length < MAP_POINT_PAGE_SIZE) break;
  }

  return { rows, error: null };
}

export async function loadPublicMapPoints(client: PublicMapClient): Promise<PublicMapResult> {
  const result = await loadAllProjectionRows(client, MAP_POINT_SELECT);
  if (result.error) {
    console.error("Public map request failed", { code: "PUBLIC_MAP_QUERY_FAILED" });
    return { points: [], availability: "error" };
  }
  return { points: sanitizePublicMapRows(result.rows), availability: "available" };
}

export async function getPublicMapPoints(): Promise<PublicMapResult> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return { points: [], availability: "unconfigured" };
  return loadPublicMapPoints(supabase);
}

export async function getPublicMapPointsNear(
  latitude: number,
  longitude: number,
  radiusMiles = PUBLIC_MAP_ZIP_RADIUS_MILES
): Promise<PublicMapResult> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { points: [], availability: "error" };
  }
  if (!Number.isFinite(radiusMiles) || radiusMiles <= 0 || radiusMiles > 250) {
    return { points: [], availability: "error" };
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) return { points: [], availability: "unconfigured" };

  const result = await loadNearbyProjectionRows(supabase, latitude, longitude, radiusMiles);
  if (result.error) {
    console.error("Public map request failed", { code: "PUBLIC_MAP_QUERY_FAILED" });
    return { points: [], availability: "error" };
  }

  return {
    availability: "available",
    points: sanitizePublicMapRows(result.rows).filter((point) => distanceMiles(
      { latitude, longitude },
      { latitude: point.publicLatitude, longitude: point.publicLongitude }
    ) <= radiusMiles)
  };
}

function includesText(value: unknown, query: string) {
  return typeof value === "string" && value.toLowerCase().includes(query);
}

export async function searchPublicProfileIds(filters: PublicProfileSearchFilters): Promise<PublicProfileIdSearchResult> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return { ids: [], availability: "unconfigured" };

  const result = await loadAllProjectionRows(supabase, SEARCH_PROJECTION_SELECT);
  if (result.error) {
    console.error("Public profile search failed", { code: "PUBLIC_PROFILE_SEARCH_QUERY_FAILED" });
    return { ids: [], availability: "error" };
  }

  const q = filters.q.trim().toLowerCase();
  const state = filters.state.trim().toLowerCase();
  const status = filters.status;
  const ids = result.rows.flatMap((row: Record<string, any>) => {
    if (status !== "all" && row.public_status !== status) return [];
    if (state && ![row.last_seen_area_public, row.last_seen_city, row.last_seen_state, row.public_label].some((value) => includesText(value, state))) return [];
    if (q && ![
      row.public_name,
      row.tribal_affiliation,
      row.public_label,
      row.last_seen_area_public,
      row.last_seen_city,
      row.last_seen_state,
      row.lead_agency,
      row.namus_number
    ].some((value) => includesText(value, q))) return [];
    return typeof row.case_id === "string" ? [row.case_id] : [];
  });

  return { ids: [...new Set(ids)], availability: "available" };
}

export interface PublicMapFilters { profileType: string; status: string; region: string; }
export function filterPublicMapPoints(points: PublicMapPoint[], filters: PublicMapFilters): PublicMapPoint[] {
  return points.filter((point) =>
    (filters.profileType === "all" || point.profileType === filters.profileType) &&
    (filters.status === "all" || point.publicStatus === filters.status) &&
    (filters.region === "all" || point.publicMapLabel === filters.region)
  );
}
