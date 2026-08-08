import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function safeOrigin(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const styleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL?.trim();
  const attribution = process.env.NEXT_PUBLIC_MAP_ATTRIBUTION?.trim();
  const originsRaw = process.env.NEXT_PUBLIC_MAP_ALLOWED_ORIGINS?.trim();
  const styleOrigin = safeOrigin(styleUrl);
  const allowedOrigins = (originsRaw || "")
    .split(",")
    .map((value) => safeOrigin(value))
    .filter((value): value is string => Boolean(value));

  const configured = Boolean(styleUrl && attribution && originsRaw && styleOrigin && allowedOrigins.includes(styleOrigin));

  return NextResponse.json(
    {
      ok: configured,
      provider: styleOrigin === "https://api.maptiler.com" ? "maptiler" : styleOrigin ? "other" : "unconfigured",
      styleConfigured: Boolean(styleUrl),
      attributionConfigured: Boolean(attribution),
      allowedOriginsConfigured: Boolean(originsRaw),
      styleOrigin,
      allowedOrigins,
      styleOriginAllowed: Boolean(styleOrigin && allowedOrigins.includes(styleOrigin))
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
