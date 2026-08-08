export const ALERT_RADIUS_OPTIONS = [10, 25, 50, 100, 250] as const;
export type AlertRadiusMiles = typeof ALERT_RADIUS_OPTIONS[number];

export type ZctaPoint = {
  zip: string;
  latitude: number;
  longitude: number;
  source: "U.S. Census Bureau TIGERweb 2020 ZCTA";
};

const TIGERWEB_ZCTA_QUERY = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Census2020/MapServer/84/query";

export function normalizeZip(input: unknown) {
  if (typeof input !== "string") return null;
  const zip = input.trim();
  return /^[0-9]{5}$/.test(zip) ? zip : null;
}

export function normalizeAlertRadius(input: unknown): AlertRadiusMiles | null {
  const value = Number(input);
  return (ALERT_RADIUS_OPTIONS as readonly number[]).includes(value) ? value as AlertRadiusMiles : null;
}

export async function lookupZcta(zipInput: unknown, fetcher: typeof fetch = fetch): Promise<ZctaPoint | null> {
  const zip = normalizeZip(zipInput);
  if (!zip) return null;

  const params = new URLSearchParams({
    where: `ZCTA5='${zip}'`,
    outFields: "ZCTA5,CENTLAT,CENTLON,INTPTLAT,INTPTLON",
    returnGeometry: "false",
    f: "json"
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetcher(`${TIGERWEB_ZCTA_QUERY}?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal
    });
    if (!response.ok) return null;
    const body = await response.json() as { features?: Array<{ attributes?: Record<string, unknown> }> };
    const attributes = body.features?.[0]?.attributes;
    if (!attributes || attributes.ZCTA5 !== zip) return null;
    const latitude = Number(attributes.CENTLAT ?? attributes.INTPTLAT);
    const longitude = Number(attributes.CENTLON ?? attributes.INTPTLON);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
    return { zip, latitude, longitude, source: "U.S. Census Bureau TIGERweb 2020 ZCTA" };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function distanceMiles(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const earthRadiusMiles = 3958.7613;
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLon = toRadians(b.longitude - a.longitude);
  const h = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * earthRadiusMiles * Math.asin(Math.min(1, Math.sqrt(h)));
}
