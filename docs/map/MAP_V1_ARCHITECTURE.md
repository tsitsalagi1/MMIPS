# Public profile map architecture

`/profiles` is the single public discovery interface for MMIPS. It combines profile search controls, the national public-awareness map, and the selected-profile summary. It does not render a paginated wall of public profile cards. The legacy `/map` route permanently redirects to `/profiles` so old bookmarks and links continue to work without maintaining a second public map page.

The page shell renders without waiting for the national map dataset. `ProfilesSearch` is a Client Component and dynamically imports `MapLibreRenderer` with `ssr: false`. After the page becomes interactive it requests `GET /api/profiles/map`, which returns the complete bounded collection of approved public map points. The response contains only the existing public map projection and is edge-cacheable for a short interval because it contains public data only. The national point collection is then rendered as clustered map markers so the broad geographic scale remains visible.

Search controls call `POST /api/profiles/search`. Name, Tribe, agency, status, state/province, NamUs, and optional U.S. ZIP/radius criteria are resolved against approved published profiles. The client uses the returned profile IDs to filter the already-loaded public map collection. ZIP-distance searches use the existing Census ZCTA helper and a geographically bounded public-map query rather than hydrating the national map collection again. ZIP searches return only a general camera focus and do not become case locations.

`MapLibreRenderer` is the only component that imports MapLibre 6.0.0 and its CSS. Large national result sets use viewport-bounded DOM clustering; small filtered sets use independent accessible markers. The map starts with a U.S./Canada continental view. Search results without a ZIP focus fit their approved public points, while ZIP searches use a zero-duration camera move. Rotation, pitch, touch pitch, and scroll zoom remain disabled.

GeoJSON revalidates coordinate bounds, uses `[publicLongitude, publicLatitude]`, and allowlists only public-safe identity, label, category/status, and approved precision properties. No photo, exact/private coordinate, address, contact, moderator state/evidence, note, storage path, or filename crosses the renderer boundary.

The page explicitly explains that MMIPS is a public-awareness resource rather than a complete statistical census and that cluster totals are approved MMIPS public-profile counts rather than population-adjusted rates. Synthetic scale-test points remain visibly labeled so load-test clusters cannot be mistaken for real prevalence.

Exact HTTPS basemap provider origins and attribution are required. Invalid configuration or WebGL/fetch/style/context failures leave the search controls usable. `supabase/public_case_map_points_20260805.sql` remains **STATIC REVIEW ONLY — NOT EXECUTED**. RLS continues to enforce approved, visible points linked to approved published cases.
