import { NextResponse } from "next/server";
import { getPublicMapPoints } from "@/lib/public-map";

export const dynamic = "force-dynamic";

export async function GET() {
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
