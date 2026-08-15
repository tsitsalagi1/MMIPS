import { createClient } from "@supabase/supabase-js";
import type { PublicMapAvailability, PublicMapPoint } from "./public-map";
import { normalizeCanadianPostalCode } from "./canada-config";

const PAGE_SIZE = 1000;
const CANADA_MAP_VIEW = "public_case_map_projection";
const CANADA_PROFILE_VIEW = "public_canada_profile_projection";

export type CanadaCaseStatus = "missing" | "homicide_unsolved" | "unidentified" | "resolved" | "unknown";

export type CanadaIndigenousAffiliation = {
  affiliation_type?: string | null;
  preferred_people_or_nation_name?: string | null;
  preferred_community_name?: string | null;
  inuit_region?: string | null;
  metis_government_or_community?: string | null;
};

export type CanadaOfficialReference = {
  reference_type?: string | null;
  agency_or_registry_name?: string | null;
  reference_number?: string | null;
  source_url?: string | null;
};

export type CanadaPublicProfile = {
  caseId: string;
  slug: string;
  fullName: string;
  age: number | null;
  status: CanadaCaseStatus;
  publicSummary: string;
  lastSeenDate: string | null;
  lastSeenLocality: string | null;
  provinceTerritory: string | null;
  publicArea: string | null;
  locationPrecision: string;
  leadPoliceService: string | null;
  officialTipContact: string | null;
  lastPublicUpdate: string | null;
  synthetic: boolean;
  affiliations: CanadaIndigenousAffiliation[];
  officialReferences: CanadaOfficialReference[];
};

export type CanadaPublicSearchResult = {
  ids: string[];
  availability: PublicMapAvailability;
};

function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !publishableKey) return null;
  return createClient(url, publishableKey, { auth: { persistSession: false } });
}

function mapCanadaStatusToUsCompatible(status: CanadaCaseStatus) {
  if (status === "homicide_unsolved") return "murdered_unsolved" as const;
  return status;
}

function mapCanadaProfileType(status: CanadaCaseStatus) {
  if (status === "homicide_unsolved") return "murdered_info_needed" as const;
  if (status === "unidentified") return "unidentified" as const;
  if (status === "resolved") return "located" as const;
  if (status === "missing") return "missing" as const;
  return "unknown" as const;
}

function mapCanadaPrecision(value: unknown) {
  if (value === "region") return "broad_region" as const;
  if (value === "approximate") return "broad_region" as const;
  if (value === "locality") return "city_centroid" as const;
  return "broad_region" as const;
}

function toMapPoint(row: Record<string, any>): PublicMapPoint | null {
  const caseId = typeof row.case_id === "string" ? row.case_id : "";
  const slug = typeof row.slug === "string" ? row.slug : "";
  const latitude = Number(row.public_latitude);
  const longitude = Number(row.public_longitude);
  if (!caseId || !slug || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const status = (["missing", "homicide_unsolved", "unidentified", "resolved", "unknown"] as const).includes(row.status)
    ? row.status as CanadaCaseStatus
    : "unknown";

  return {
    caseId,
    slug,
    publicName: typeof row.full_name === "string" && row.full_name.trim() ? row.full_name : "Name withheld",
    profileType: mapCanadaProfileType(status),
    publicStatus: mapCanadaStatusToUsCompatible(status),
    publicMapLabel: typeof row.public_area_label === "string" && row.public_area_label.trim()
      ? row.public_area_label
      : [row.last_seen_locality, row.last_seen_province_territory].filter(Boolean).join(", ") || "Approved public awareness area",
    publicLatitude: latitude,
    publicLongitude: longitude,
    precision: mapCanadaPrecision(row.location_precision),
    regionType: typeof row.last_seen_province_territory === "string" ? row.last_seen_province_territory : "Canada",
    lastPublicUpdate: typeof row.last_public_update === "string" ? row.last_public_update : null
  };
}

export async function getCanadaPublicMapPoints() {
  const client = createPublicClient();
  if (!client) return { points: [] as PublicMapPoint[], availability: "unconfigured" as const };

  const select = "case_id,slug,full_name,status,last_seen_locality,last_seen_province_territory,public_area_label,public_latitude,public_longitude,lead_police_service,last_public_update,synthetic,location_precision,updated_at";
  const first = await client.from(CANADA_MAP_VIEW).select(select, { count: "exact" }).order("updated_at", { ascending: false }).order("case_id", { ascending: true }).range(0, PAGE_SIZE - 1);
  if (first.error) {
    console.error("Canada public map request failed", { code: first.error.code });
    return { points: [] as PublicMapPoint[], availability: "error" as const };
  }
  const rows = (first.data || []) as Record<string, any>[];
  const remainingPages = Math.max(0, Math.ceil((first.count ?? rows.length) / PAGE_SIZE) - 1);
  const pages = await Promise.all(Array.from({ length: remainingPages }, async (_, pageIndex) => {
    const from = (pageIndex + 1) * PAGE_SIZE;
    return client.from(CANADA_MAP_VIEW).select(select).order("updated_at", { ascending: false }).order("case_id", { ascending: true }).range(from, from + PAGE_SIZE - 1);
  }));
  const failed = pages.find((page) => page.error);
  if (failed?.error) {
    console.error("Canada public map request failed", { code: failed.error.code });
    return { points: [] as PublicMapPoint[], availability: "error" as const };
  }
  pages.forEach((page) => rows.push(...((page.data || []) as Record<string, any>[])));

  return {
    points: rows.flatMap((row) => {
      const point = toMapPoint(row);
      return point ? [point] : [];
    }),
    availability: "available" as const
  };
}

function includes(value: unknown, query: string) {
  return typeof value === "string" && value.toLocaleLowerCase("en-CA").includes(query);
}

function affiliationIncludes(value: unknown, query: string) {
  if (!Array.isArray(value)) return false;
  return value.some((item) => item && typeof item === "object" && [
    item.preferred_people_or_nation_name,
    item.preferred_community_name,
    item.inuit_region,
    item.metis_government_or_community,
    item.affiliation_type
  ].some((field) => includes(field, query)));
}

export async function searchCanadaPublicProfileIds(filters: { q: string; status: string; province: string }): Promise<CanadaPublicSearchResult> {
  const client = createPublicClient();
  if (!client) return { ids: [], availability: "unconfigured" };

  const select = "case_id,full_name,status,last_seen_locality,last_seen_province_territory,last_seen_area_public,lead_police_service,indigenous_affiliations,published_at";
  const first = await client.from(CANADA_PROFILE_VIEW).select(select, { count: "exact" }).order("published_at", { ascending: false }).order("case_id", { ascending: true }).range(0, PAGE_SIZE - 1);
  if (first.error) {
    console.error("Canada public profile search failed", { code: first.error.code });
    return { ids: [], availability: "error" };
  }
  const rows = (first.data || []) as Record<string, any>[];
  const remainingPages = Math.max(0, Math.ceil((first.count ?? rows.length) / PAGE_SIZE) - 1);
  const pages = await Promise.all(Array.from({ length: remainingPages }, async (_, pageIndex) => {
    const from = (pageIndex + 1) * PAGE_SIZE;
    return client.from(CANADA_PROFILE_VIEW).select(select).order("published_at", { ascending: false }).order("case_id", { ascending: true }).range(from, from + PAGE_SIZE - 1);
  }));
  const failed = pages.find((page) => page.error);
  if (failed?.error) {
    console.error("Canada public profile search failed", { code: failed.error.code });
    return { ids: [], availability: "error" };
  }
  pages.forEach((page) => rows.push(...((page.data || []) as Record<string, any>[])));

  const q = filters.q.trim().toLocaleLowerCase("en-CA");
  const province = filters.province.trim().toUpperCase();
  const ids = rows.flatMap((row) => {
    if (filters.status !== "all" && row.status !== filters.status) return [];
    if (province && row.last_seen_province_territory !== province) return [];
    if (q && ![
      row.full_name,
      row.last_seen_locality,
      row.last_seen_area_public,
      row.lead_police_service
    ].some((value) => includes(value, q)) && !affiliationIncludes(row.indigenous_affiliations, q)) return [];
    return typeof row.case_id === "string" ? [row.case_id] : [];
  });

  return { ids: [...new Set(ids)], availability: "available" };
}

function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const toRad = (degrees: number) => degrees * Math.PI / 180;
  const earthRadiusKm = 6371.0088;
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const deltaLat = toRad(b.latitude - a.latitude);
  const deltaLon = toRad(b.longitude - a.longitude);
  const h = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(h)));
}

export async function getCanadaPublicMapPointsNear(latitude: number, longitude: number, radiusKm: number) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return { points: [] as PublicMapPoint[], availability: "error" as const };
  }
  if (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 1000) {
    return { points: [] as PublicMapPoint[], availability: "error" as const };
  }
  const result = await getCanadaPublicMapPoints();
  if (result.availability !== "available") return result;
  return {
    availability: "available" as const,
    points: result.points.filter((point) => distanceKm(
      { latitude, longitude },
      { latitude: point.publicLatitude, longitude: point.publicLongitude }
    ) <= radiusKm)
  };
}

function parseMapTilerKey() {
  const style = process.env.NEXT_PUBLIC_MAP_STYLE_URL;
  if (!style) return null;
  try {
    const url = new URL(style);
    if (url.origin !== "https://api.maptiler.com") return null;
    return url.searchParams.get("key");
  } catch {
    return null;
  }
}

export async function geocodeCanadianPostalCode(input: string) {
  const postalCode = normalizeCanadianPostalCode(input);
  const key = parseMapTilerKey();
  if (!postalCode || !key) return null;

  const url = new URL(`https://api.maptiler.com/geocoding/${encodeURIComponent(postalCode)}.json`);
  url.searchParams.set("key", key);
  url.searchParams.set("country", "ca");
  url.searchParams.set("types", "postal_code");
  url.searchParams.set("limit", "1");
  url.searchParams.set("autocomplete", "false");
  url.searchParams.set("language", "en,fr");

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ca.mmips.com";
    const response = await fetch(url, {
      headers: { Accept: "application/json", Referer: siteUrl },
      cache: "force-cache",
      next: { revalidate: 86400 }
    });
    if (!response.ok) return null;
    const data = await response.json() as { features?: Array<{ center?: [number, number]; geometry?: { coordinates?: [number, number] } }> };
    const feature = data.features?.[0];
    const coords = feature?.center || feature?.geometry?.coordinates;
    const longitude = Number(coords?.[0]);
    const latitude = Number(coords?.[1]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { postalCode, latitude, longitude };
  } catch {
    return null;
  }
}

function normalizeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

export async function getCanadaPublicProfile(slug: string): Promise<CanadaPublicProfile | null> {
  const client = createPublicClient();
  if (!client) return null;

  const { data, error } = await client
    .from(CANADA_PROFILE_VIEW)
    .select("case_id,slug,full_name,age,status,public_summary,last_seen_date,last_seen_locality,last_seen_province_territory,last_seen_area_public,location_precision,lead_police_service,official_tip_contact,last_public_update,synthetic,indigenous_affiliations,official_references")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Canada public profile request failed", { code: error.code });
    return null;
  }

  const row = data as Record<string, any>;
  const status = (["missing", "homicide_unsolved", "unidentified", "resolved", "unknown"] as const).includes(row.status)
    ? row.status as CanadaCaseStatus
    : "unknown";
  return {
    caseId: String(row.case_id),
    slug: String(row.slug),
    fullName: typeof row.full_name === "string" ? row.full_name : "Name withheld",
    age: Number.isFinite(Number(row.age)) ? Number(row.age) : null,
    status,
    publicSummary: typeof row.public_summary === "string" ? row.public_summary : "",
    lastSeenDate: typeof row.last_seen_date === "string" ? row.last_seen_date : null,
    lastSeenLocality: typeof row.last_seen_locality === "string" ? row.last_seen_locality : null,
    provinceTerritory: typeof row.last_seen_province_territory === "string" ? row.last_seen_province_territory : null,
    publicArea: typeof row.last_seen_area_public === "string" ? row.last_seen_area_public : null,
    locationPrecision: typeof row.location_precision === "string" ? row.location_precision : "locality",
    leadPoliceService: typeof row.lead_police_service === "string" ? row.lead_police_service : null,
    officialTipContact: typeof row.official_tip_contact === "string" ? row.official_tip_contact : null,
    lastPublicUpdate: typeof row.last_public_update === "string" ? row.last_public_update : null,
    synthetic: row.synthetic === true,
    affiliations: normalizeArray<CanadaIndigenousAffiliation>(row.indigenous_affiliations),
    officialReferences: normalizeArray<CanadaOfficialReference>(row.official_references)
  };
}

export function canadaStatusLabel(status: CanadaCaseStatus) {
  if (status === "homicide_unsolved") return "Homicide / information needed";
  if (status === "unidentified") return "Unidentified person";
  if (status === "resolved") return "Resolved / located";
  if (status === "missing") return "Missing";
  return "Status not publicly specified";
}

export function canadaAffiliationLabel(affiliation: CanadaIndigenousAffiliation) {
  return affiliation.preferred_people_or_nation_name
    || affiliation.preferred_community_name
    || affiliation.inuit_region
    || affiliation.metis_government_or_community
    || (affiliation.affiliation_type === "first_nation" ? "First Nations"
      : affiliation.affiliation_type === "inuit" ? "Inuit"
        : affiliation.affiliation_type === "metis" ? "Métis"
          : affiliation.affiliation_type === "multiple" ? "Multiple Indigenous affiliations"
            : affiliation.affiliation_type === "self_described" ? "Self-described Indigenous affiliation"
              : affiliation.affiliation_type === "not_disclosed" ? "Affiliation not disclosed" : null);
}
