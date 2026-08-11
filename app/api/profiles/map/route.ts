import { NextResponse } from "next/server";
import { getCanadaPublicMapPoints } from "@/lib/canada-public";
import { getCanadaFederatedPublicMapPoints } from "@/lib/cross-border-public-map";
import { getPublicMapPoints } from "@/lib/public-map";
import { mmipsSiteMode } from "@/lib/site-mode";

export const dynamic = "force-dynamic";

export async function GET() {
  if (mmipsSiteMode() === "ca") {
    const localResult = await getCanadaPublicMapPoints();
    const result = await getCanadaFederatedPublicMapPoints(localResult);
    const status = result.availability === "error" ? 503 : 200;

    return NextResponse.json(
      {
        ok: result.availability !== "error",
        availability: result.availability,
        points: result.points,
        canadaCount: result.canadaCount,
        unitedStatesCount: result.unitedStatesCount,
        crossBorder: true
      },
      {
        status,
        headers: {
          "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300"
        }
      }
    );
  }

  const result = await getPublicMapPoints();
  const status = result.availability === "error" ? 503 : 200;

  return NextResponse.json(
    { ok: result.availability !== "error", availability: result.availability, points: result.points },
    {
      status,
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300"
      }
    }
  );
}
