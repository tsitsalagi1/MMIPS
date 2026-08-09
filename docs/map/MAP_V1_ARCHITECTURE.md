# Map V1 architecture

`/profiles` is the complete authoritative non-map interface for public-profile browsing and search. `/map` is a map-first exploration interface: filters run once and the same filtered `PublicMapPoint[]` feeds the optional browser renderer, while a selected marker renders a public-safe React summary outside the canvas. The map page links directly to Search Profiles instead of duplicating paginated profile cards below the map. Missing data configuration and query errors return no map profiles and never substitute synthetic or private data.

`PublicMapExperience` is a Client Component and dynamically imports `MapLibreRenderer` with `ssr: false`. Only that renderer imports MapLibre 6.0.0 and its CSS. It creates one map, updates its public point overlay on filtering, removes listeners and the map on unmount, and renders selection as a React summary outside the canvas. Server Components, API/database modules, and `lib/public-map.ts` never import MapLibre or use browser globals.

GeoJSON revalidates coordinate bounds, uses `[publicLongitude, publicLatitude]`, and allowlists only public-safe identity, label, category/status, and approved precision properties. No photo, exact/private coordinate, address, contact, moderator state/evidence, note, storage path, or filename crosses the renderer boundary.

ZIP focus uses `POST /api/map/zip`, a same-origin no-store endpoint that validates a 5-digit U.S. ZIP and calls the existing server-side U.S. Census TIGERweb ZCTA helper. The browser receives only the ZIP centroid needed to focus the map. The lookup does not use browser geolocation, does not write the searched ZIP into case data, and does not convert the ZIP into an exact case location. ZIP focus is an instantaneous zero-duration camera change.

Exact HTTPS basemap provider origins and attribution are required. Invalid configuration or WebGL/fetch/style/context failures leave Search Profiles available. Rotation, pitch, touch pitch, and scroll zoom are disabled; conservative, zero-duration camera changes avoid implying street/building precision. There is no browser geolocation, routing, tracking, or automatic popup.

`supabase/public_case_map_points_20260805.sql` remains **STATIC REVIEW ONLY — NOT EXECUTED**. RLS continues to enforce approved, visible points linked to approved published cases. Live RLS, approved provider, CSP, browser, keyboard, screen-reader, zoom/reflow, and trauma-informed review remain release gates.
