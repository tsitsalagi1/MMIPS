# Map V1 architecture

The semantic accessible list is the complete authoritative interface. Filters run once, and the same filtered `PublicMapPoint[]` feeds both the list and optional browser renderer. Missing data configuration and query errors return no profiles and never substitute synthetic or private data.

`PublicMapExperience` is a Client Component and dynamically imports `MapLibreRenderer` with `ssr: false`. Only that renderer imports MapLibre 6.0.0 and its CSS. It creates one map, updates its GeoJSON source on filtering, removes listeners and the map on unmount, and renders selection as a React summary outside the canvas. Server Components, API/database modules, and `lib/public-map.ts` never import MapLibre or use browser globals.

GeoJSON revalidates coordinate bounds, uses `[publicLongitude, publicLatitude]`, and allowlists only public-safe identity, label, category/status, and approved precision properties. No photo, exact/private coordinate, address, contact, moderator state/evidence, note, storage path, or filename crosses the renderer boundary.

Exact HTTPS provider origins and attribution are required. Invalid configuration or WebGL2/fetch/style/context failures leave the list usable. Rotation, pitch, touch pitch, and scroll zoom are disabled; conservative, zero-duration camera fits avoid implying street/building precision. There is no geolocation, geocoding, routing, tracking, or automatic popup.

`supabase/public_case_map_points_20260805.sql` remains **STATIC REVIEW ONLY — NOT EXECUTED**. RLS continues to enforce approved, visible points linked to approved published cases. Live RLS, approved provider, CSP, browser, keyboard, screen-reader, zoom/reflow, and trauma-informed review remain release gates.
