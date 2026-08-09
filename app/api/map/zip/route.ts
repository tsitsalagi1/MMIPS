import { NextResponse } from "next/server";
import { getPublicMapPointsNear, PUBLIC_MAP_ZIP_RADIUS_MILES } from "../../../../lib/public-map";
import { lookupZcta, normalizeZip } from "../../../../lib/zip-geo";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter a valid 5-digit ZIP code." }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const zip = normalizeZip((body as { zip?: unknown } | null)?.zip);
  if (!zip) {
    return NextResponse.json({ error: "Enter a valid 5-digit ZIP code." }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const result = await lookupZcta(zip);
  if (!result) {
    return NextResponse.json({ error: "That ZIP code could not be located." }, { status: 404, headers: NO_STORE_HEADERS });
  }

  const nearby = await getPublicMapPointsNear(result.latitude, result.longitude, PUBLIC_MAP_ZIP_RADIUS_MILES);
  if (nearby.availability === "error") {
    return NextResponse.json({ error: "Nearby public map information is temporarily unavailable." }, { status: 503, headers: NO_STORE_HEADERS });
  }

  return NextResponse.json(
    {
      zip: result.zip,
      latitude: result.latitude,
      longitude: result.longitude,
      radiusMiles: PUBLIC_MAP_ZIP_RADIUS_MILES,
      availability: nearby.availability,
      points: nearby.points
    },
    { headers: NO_STORE_HEADERS }
  );
}
