import { NextResponse } from "next/server";
import { getCanadaPublicMapPoints } from "@/lib/canada-public";
import { getPublicMapPoints } from "@/lib/public-map";
import { mmipsSiteMode } from "@/lib/site-mode";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = mmipsSiteMode() === "ca"
    ? await getCanadaPublicMapPoints()
    : await getPublicMapPoints();
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
