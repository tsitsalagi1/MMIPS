# Map provider and CSP plan

Status: MapLibre GL JS 6.0.0 is exactly pinned and the browser-only renderer is implemented. No production style/tile provider is hard-coded, selected, approved, or configured; no provider token is committed.

The renderer requires `NEXT_PUBLIC_MAP_STYLE_URL` (absolute HTTPS), `NEXT_PUBLIC_MAP_ATTRIBUTION` (non-empty), and `NEXT_PUBLIC_MAP_ALLOWED_ORIGINS` (exact comma-separated HTTPS origins). These are public configuration, not secrets. The style origin must be listed. Wildcards, custom/non-HTTPS schemes, credentials, and substring/suffix matches are rejected. MapLibre `transformRequest` enforces the same exact-origin boundary for style, source, tile, glyph, sprite, and image requests without logging URLs or response bodies. Provider approval must review privacy terms, retention, attribution, every request origin, and any token's public purpose/domain restrictions.

Do not add `connect-src *`, `img-src *`, `worker-src *`, `unsafe-eval`, or provider wildcards. The normal Version 6 ESM build emitted MapLibre's client worker behavior in the production bundle; no CSP-specific bundle exists. Browser verification of worker creation and the minimum exact `connect-src`, `img-src`, and possibly `worker-src blob:` directives remains incomplete until a provider is approved. No CSP was weakened in this change.

External map requests can disclose visitor IP address and request metadata. The map therefore remains optional; the accessible list is authoritative. No geolocation, geocoding, routing, ads, analytics, tracking, or map telemetry is added.
