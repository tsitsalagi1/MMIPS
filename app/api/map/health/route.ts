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

function safePathname(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.pathname : null;
  } catch {
    return null;
  }
}

function collectHttpOrigins(value: unknown, origins = new Set<string>()): Set<string> {
  if (typeof value === "string") {
    if (value.startsWith("https://")) {
      try {
        origins.add(new URL(value).origin);
      } catch {
        // Ignore malformed URLs in diagnostics; MapLibre will report them independently.
      }
    }
    return origins;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectHttpOrigins(item, origins));
    return origins;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectHttpOrigins(item, origins));
  }
  return origins;
}

async function probeStyle(styleUrl: string | undefined, allowedOrigins: string[]) {
  if (!styleUrl) return {
    attempted: false,
    status: null,
    contentType: null,
    looksLikeStyle: false,
    styleVersion: null,
    sourceCount: null,
    layerCount: null,
    resourceOrigins: [] as string[],
    disallowedResourceOrigins: [] as string[]
  };

  try {
    const response = await fetch(styleUrl, {
      cache: "no-store",
      headers: {
        Origin: "https://mmips.com",
        Referer: "https://mmips.com/map",
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(8000)
    });
    const contentType = response.headers.get("content-type");
    let style: unknown = null;
    if (contentType?.includes("json")) {
      try {
        style = await response.json();
      } catch {
        style = null;
      }
    }
    const record = style && typeof style === "object" && !Array.isArray(style) ? style as Record<string, unknown> : null;
    const resourceOrigins = [...collectHttpOrigins(style)].sort();
    const disallowedResourceOrigins = resourceOrigins.filter((origin) => !allowedOrigins.includes(origin));
    const sources = record?.sources && typeof record.sources === "object" && !Array.isArray(record.sources) ? record.sources as Record<string, unknown> : null;
    const layers = Array.isArray(record?.layers) ? record.layers : null;
    const styleVersion = typeof record?.version === "number" ? record.version : null;

    return {
      attempted: true,
      status: response.status,
      contentType,
      looksLikeStyle: response.ok && styleVersion === 8 && Boolean(sources) && Boolean(layers),
      styleVersion,
      sourceCount: sources ? Object.keys(sources).length : null,
      layerCount: layers ? layers.length : null,
      resourceOrigins,
      disallowedResourceOrigins
    };
  } catch {
    return {
      attempted: true,
      status: null,
      contentType: null,
      looksLikeStyle: false,
      styleVersion: null,
      sourceCount: null,
      layerCount: null,
      resourceOrigins: [] as string[],
      disallowedResourceOrigins: [] as string[]
    };
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
  const upstream = await probeStyle(styleUrl, allowedOrigins);

  return NextResponse.json(
    {
      ok: configured && upstream.status === 200 && upstream.looksLikeStyle && upstream.disallowedResourceOrigins.length === 0,
      provider: styleOrigin === "https://api.maptiler.com" ? "maptiler" : styleOrigin ? "other" : "unconfigured",
      styleConfigured: Boolean(styleUrl),
      attributionConfigured: Boolean(attribution),
      allowedOriginsConfigured: Boolean(originsRaw),
      styleOrigin,
      stylePathname: safePathname(styleUrl),
      styleHasKeyParameter: (() => {
        if (!styleUrl) return false;
        try { return new URL(styleUrl).searchParams.has("key"); } catch { return false; }
      })(),
      allowedOrigins,
      styleOriginAllowed: Boolean(styleOrigin && allowedOrigins.includes(styleOrigin)),
      upstream
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
