import type { PublicMapPoint } from "../../lib/public-map";
import type { FeatureCollection, Point } from "geojson";

export type MapFailureCode =
  | "MAP_CONFIG_UNAVAILABLE"
  | "MAP_CONFIG_INVALID"
  | "MAP_WEBGL2_UNAVAILABLE"
  | "MAP_INITIALIZATION_FAILED"
  | "MAP_STYLE_LOAD_FAILED"
  | "MAP_RESOURCE_REJECTED"
  | "MAP_CONTEXT_LOST";

export interface PublicMapConfig {
  styleUrl: string;
  attribution: string;
  allowedOrigins: ReadonlySet<string>;
}

export type PublicMapFeatureCollection = FeatureCollection<
  Point,
  {
    publicId: string;
    slug: string;
    publicName: string;
    publicMapLabel: string;
    profileType: string;
    publicStatus: string;
    precision: string;
  }
>;

const isHttpsOrigin = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.origin === value && !url.username && !url.password;
  } catch {
    return false;
  }
};

export function readPublicMapConfig(env: Record<string, string | undefined>):
  | { ok: true; value: PublicMapConfig }
  | { ok: false; code: MapFailureCode } {
  const styleValue = env.NEXT_PUBLIC_MAP_STYLE_URL?.trim();
  const attribution = env.NEXT_PUBLIC_MAP_ATTRIBUTION?.trim();
  const originsValue = env.NEXT_PUBLIC_MAP_ALLOWED_ORIGINS?.trim();
  if (!styleValue || !attribution || !originsValue) return { ok: false, code: "MAP_CONFIG_UNAVAILABLE" };

  try {
    const styleUrl = new URL(styleValue);
    const origins = originsValue.split(",").map((origin) => origin.trim());
    if (
      styleUrl.protocol !== "https:" || styleUrl.username || styleUrl.password ||
      origins.some((origin) => !origin || origin.includes("*") || !isHttpsOrigin(origin))
    ) return { ok: false, code: "MAP_CONFIG_INVALID" };
    const allowedOrigins = new Set(origins);
    if (!allowedOrigins.has(styleUrl.origin)) return { ok: false, code: "MAP_CONFIG_INVALID" };
    return { ok: true, value: { styleUrl: styleUrl.href, attribution, allowedOrigins } };
  } catch {
    return { ok: false, code: "MAP_CONFIG_INVALID" };
  }
}

export function isAllowedMapResource(urlValue: string, allowedOrigins: ReadonlySet<string>): boolean {
  try {
    const url = new URL(urlValue);
    return url.protocol === "https:" && !url.username && !url.password && allowedOrigins.has(url.origin);
  } catch {
    return false;
  }
}

export function toPublicGeoJson(points: readonly PublicMapPoint[]): PublicMapFeatureCollection {
  return {
    type: "FeatureCollection",
    features: points.flatMap((point) => {
      const latitude = point.publicLatitude;
      const longitude = point.publicLongitude;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return [];
      return [{
        type: "Feature" as const,
        id: point.caseId,
        geometry: { type: "Point" as const, coordinates: [longitude, latitude] },
        properties: {
          publicId: point.caseId,
          slug: point.slug,
          publicName: point.publicName,
          publicMapLabel: point.publicMapLabel,
          profileType: point.profileType,
          publicStatus: point.publicStatus,
          precision: point.precision
        }
      }];
    })
  };
}

export function hasUsableWebGL2(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true });
    if (!context || context.isContextLost()) return false;
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
