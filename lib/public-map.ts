import type { CaseStatus, LocationPrecision, ProfileType } from "./types";
import { createClient } from "@supabase/supabase-js";

export interface PublicMapPoint {
  publicId: string;
  slug: string;
  publicName: string;
  mapLabel: string;
  profileType: ProfileType;
  status: CaseStatus;
  precision: Exclude<LocationPrecision, "exact_private" | "hidden">;
  publicLongitude: number;
  publicLatitude: number;
}

export interface PublicMapProperties {
  publicId: string;
  slug: string;
  publicName: string;
  mapLabel: string;
  profileType: ProfileType;
  status: CaseStatus;
  precision: PublicMapPoint["precision"];
}

export interface PublicMapFeatureCollection {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties: PublicMapProperties;
  }>;
}

export function toPublicGeoJson(points: readonly PublicMapPoint[]): PublicMapFeatureCollection {
  return {
    type: "FeatureCollection",
    features: points.filter(isRenderablePoint).map((point) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [point.publicLongitude, point.publicLatitude] },
      properties: {
        publicId: point.publicId,
        slug: point.slug,
        publicName: point.publicName,
        mapLabel: point.mapLabel,
        profileType: point.profileType,
        status: point.status,
        precision: point.precision,
      },
    })),
  };
}

function isRenderablePoint(point: PublicMapPoint) {
  return Number.isFinite(point.publicLongitude) && Number.isFinite(point.publicLatitude)
    && point.publicLongitude >= -180 && point.publicLongitude <= 180
    && point.publicLatitude >= -90 && point.publicLatitude <= 90;
}

type PublicMapRow = {
  public_id: string;
  slug: string;
  public_name: string;
  public_map_label: string;
  profile_type: ProfileType;
  status: CaseStatus;
  public_precision: PublicMapPoint["precision"];
  public_longitude: number;
  public_latitude: number;
};

/**
 * Loads only the columns exposed by the reviewed public map relation. Never
 * substitute a query against `cases`: that table contains private coordinates.
 */
export async function getPublicMapPoints(): Promise<PublicMapPoint[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return [];

  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await client
    .from("public_case_map_points")
    .select("public_id, slug, public_name, public_map_label, profile_type, status, public_precision, public_longitude, public_latitude");

  if (error) {
    console.error("Could not load public map points", { code: error.code });
    return [];
  }

  return ((data ?? []) as PublicMapRow[]).map((row) => ({
    publicId: row.public_id,
    slug: row.slug,
    publicName: row.public_name,
    mapLabel: row.public_map_label,
    profileType: row.profile_type,
    status: row.status,
    precision: row.public_precision,
    publicLongitude: row.public_longitude,
    publicLatitude: row.public_latitude,
  })).filter(isRenderablePoint);
}
