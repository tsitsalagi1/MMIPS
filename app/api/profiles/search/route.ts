import { NextRequest, NextResponse } from "next/server";
import { getPublicMapPointsNear, searchPublicProfileIds } from "@/lib/public-map";
import { lookupZcta, normalizeAlertRadius, normalizeZip } from "@/lib/zip-geo";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { q?: unknown; status?: unknown; state?: unknown; zip?: unknown; radiusMiles?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, message: "Search request was not valid." }, { status: 400 }); }

  const q = typeof body.q === "string" ? body.q.trim().toLowerCase().slice(0, 100) : "";
  const status = typeof body.status === "string" ? body.status.trim().slice(0, 40) : "all";
  const state = typeof body.state === "string" ? body.state.trim().toLowerCase().slice(0, 40) : "";
  const zipInput = typeof body.zip === "string" ? body.zip.trim() : "";
  const radiusInput = body.radiusMiles;

  const searchResult = await searchPublicProfileIds({ q, status, state });
  if (searchResult.availability !== "available") {
    return NextResponse.json({ ok: false, message: "Public profile search is temporarily unavailable. Please try again." }, { status: 503 });
  }

  let matchingIds = searchResult.ids;
  let mapFocus: { latitude: number; longitude: number; zoom: number } | null = null;

  if (zipInput || radiusInput !== undefined) {
    const zip = normalizeZip(zipInput);
    const radiusMiles = normalizeAlertRadius(radiusInput);
    if (!zip || !radiusMiles) return NextResponse.json({ ok: false, message: "Enter a valid 5-digit ZIP code and choose a distance." }, { status: 400 });
    const zcta = await lookupZcta(zip);
    if (!zcta) return NextResponse.json({ ok: false, message: "We could not verify that ZIP code right now. Check it and try again." }, { status: 400 });

    const mapResult = await getPublicMapPointsNear(zcta.latitude, zcta.longitude, radiusMiles);
    if (mapResult.availability !== "available") return NextResponse.json({ ok: false, message: "ZIP-distance search is temporarily unavailable. You can still search by name, status, Tribe, agency, or state." }, { status: 503 });
    const nearbyCaseIds = new Set(mapResult.points.map((point) => point.caseId));
    matchingIds = matchingIds.filter((id) => nearbyCaseIds.has(id));
    mapFocus = { latitude: zcta.latitude, longitude: zcta.longitude, zoom: radiusMiles <= 25 ? 9 : radiusMiles <= 100 ? 7 : 5 };
  }

  return NextResponse.json(
    { ok: true, count: matchingIds.length, profiles: matchingIds.map((id) => ({ id })), mapFocus },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
