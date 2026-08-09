import { NextRequest, NextResponse } from "next/server";
import { getPublishedCases } from "@/lib/cases";
import { getPublicMapPointsNear } from "@/lib/public-map";
import { lookupZcta, normalizeAlertRadius, normalizeZip } from "@/lib/zip-geo";

export const dynamic = "force-dynamic";

function includesText(value: unknown, query: string) {
  return typeof value === "string" && value.toLowerCase().includes(query);
}

export async function POST(request: NextRequest) {
  let body: { q?: unknown; status?: unknown; state?: unknown; zip?: unknown; radiusMiles?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, message: "Search request was not valid." }, { status: 400 }); }

  const q = typeof body.q === "string" ? body.q.trim().toLowerCase().slice(0, 100) : "";
  const status = typeof body.status === "string" ? body.status.trim().slice(0, 40) : "all";
  const state = typeof body.state === "string" ? body.state.trim().toLowerCase().slice(0, 40) : "";
  const zipInput = typeof body.zip === "string" ? body.zip.trim() : "";
  const radiusInput = body.radiusMiles;

  let profiles = await getPublishedCases();
  let mapFocus: { latitude: number; longitude: number; zoom: number } | null = null;

  if (q) {
    profiles = profiles.filter((item) => [item.fullName, item.tribalAffiliation, item.lastSeenLocation, item.leadAgency, item.namusNumber]
      .some((value) => includesText(value, q)));
  }
  if (status !== "all") profiles = profiles.filter((item) => item.status === status);
  if (state) profiles = profiles.filter((item) => includesText(item.lastSeenLocation, state));

  if (zipInput || radiusInput !== undefined) {
    const zip = normalizeZip(zipInput);
    const radiusMiles = normalizeAlertRadius(radiusInput);
    if (!zip || !radiusMiles) return NextResponse.json({ ok: false, message: "Enter a valid 5-digit ZIP code and choose a distance." }, { status: 400 });
    const zcta = await lookupZcta(zip);
    if (!zcta) return NextResponse.json({ ok: false, message: "We could not verify that ZIP code right now. Check it and try again." }, { status: 400 });

    const mapResult = await getPublicMapPointsNear(zcta.latitude, zcta.longitude, radiusMiles);
    if (mapResult.availability !== "available") return NextResponse.json({ ok: false, message: "ZIP-distance search is temporarily unavailable. You can still search by name, status, Tribe, agency, or state." }, { status: 503 });
    const nearbyCaseIds = new Set(mapResult.points.map((point) => point.caseId));
    profiles = profiles.filter((item) => nearbyCaseIds.has(item.id));
    mapFocus = { latitude: zcta.latitude, longitude: zcta.longitude, zoom: radiusMiles <= 25 ? 9 : radiusMiles <= 100 ? 7 : 5 };
  }

  return NextResponse.json(
    { ok: true, count: profiles.length, profiles, mapFocus },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
