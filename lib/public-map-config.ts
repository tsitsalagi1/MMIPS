export type MapConfigResult =
  | { ok: true; styleUrl: string; attribution: string; allowedOrigins: ReadonlySet<string> }
  | { ok: false; code: "MAP_CONFIG_UNAVAILABLE" | "MAP_CONFIG_INVALID" };

export function validateMapConfig(values: { styleUrl?: string; attribution?: string; allowedOrigins?: string }): MapConfigResult {
  if (!values.styleUrl || !values.attribution || !values.allowedOrigins) return { ok: false, code: "MAP_CONFIG_UNAVAILABLE" };
  try {
    const style = new URL(values.styleUrl);
    const origins = values.allowedOrigins.split(",").map((value) => value.trim());
    if (style.protocol !== "https:" || !values.attribution.trim() || !origins.length) throw new Error("invalid");
    const normalized = origins.map((origin) => {
      if (origin.includes("*")) throw new Error("invalid");
      const parsed = new URL(origin);
      if (parsed.protocol !== "https:" || parsed.origin !== origin || parsed.pathname !== "/") throw new Error("invalid");
      return parsed.origin;
    });
    const allowedOrigins = new Set(normalized);
    if (!allowedOrigins.has(style.origin)) throw new Error("invalid");
    return { ok: true, styleUrl: style.href, attribution: values.attribution.trim(), allowedOrigins };
  } catch {
    return { ok: false, code: "MAP_CONFIG_INVALID" };
  }
}

export function isAllowedMapRequest(url: string, origins: ReadonlySet<string>) {
  try { return new URL(url).protocol === "https:" && origins.has(new URL(url).origin); } catch { return false; }
}
