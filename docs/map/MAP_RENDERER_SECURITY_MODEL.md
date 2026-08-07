# Public map renderer security model

The visual map is optional. The complete accessible list is authoritative before JavaScript, during loading, and after configuration, WebGL2, style, resource, initialization, or context-loss failure.

MapLibre 6.0.0 is imported only by `MapLibreRenderer`, a dynamically loaded Client Component with SSR disabled. A strict GeoJSON projection allows only approved public identifiers, names, labels, categories, status, precision, and approximate public longitude/latitude in `[longitude, latitude]` order. It excludes invalid coordinates and does not include photos, contacts, moderation or authorization fields, raw coordinates, exact locations, storage paths, or unpublished records.

Configuration requires an HTTPS style URL, attribution, and comma-separated exact HTTPS origins. Wildcards and non-origin strings are rejected. `transformRequest` applies exact `URL.origin` membership to style, source, tile, sprite, glyph, and image requests MapLibre routes through that boundary. Rejections use bounded internal states without logging URLs, query strings, profile information, coordinates, provider bodies, or device details.

Provider approval and provider/CSP browser testing remain pending. Any CSP change must name reviewed origins; it must not add wildcard sources, `unsafe-eval`, geolocation, geocoding, routing, analytics, or tracking. No provider or token is committed.
