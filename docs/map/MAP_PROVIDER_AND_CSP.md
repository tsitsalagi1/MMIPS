# Map provider and CSP

No production provider is selected or approved. Public configuration uses `NEXT_PUBLIC_MAP_STYLE_URL`, `NEXT_PUBLIC_MAP_ATTRIBUTION`, and `NEXT_PUBLIC_MAP_ALLOWED_ORIGINS`; these contain public configuration, never secrets. The renderer requires exact HTTPS origins and attribution and rejects all other schemes and wildcards.

Style, source, tile, sprite, glyph, and image requests are restricted by `transformRequest`. Future CSP should enumerate the same reviewed origins for the minimum necessary `connect-src` and `img-src` directives. MapLibre 6.0.0's bundled worker was observed in the Next production build. Browser confirmation of provider headers and the minimal worker policy remains a release gate. Do not add wildcard sources or `unsafe-eval`.
