# Map release gate proposals

For later reconciliation into shared release documents after parallel work is reviewed:

- Mark the accessible list foundation implemented, but the interactive visual map incomplete: no engine is installed and the placeholder has no simulated geography.
- Keep MapLibre version selection open between exactly pinned `6.0.0` and `5.24.0` until Node 22.23.1 / Next.js 16.3 / React 19.2 / TypeScript 6 and browser compatibility testing completes.
- Keep provider privacy, attribution, external-host inventory, CSP enforcement, browser, keyboard, screen-reader, zoom/reflow, and reduced-motion verification incomplete.
- Record that production missing-configuration and query-error paths return no profiles; synthetic records exist only in test fixtures.
- Keep photo support incomplete because Map V1 omits thumbnails until an unambiguous public-photo authorization contract exists.
- Record `supabase/public_case_map_points_20260805.sql` as STATIC REVIEW ONLY — NOT EXECUTED. Live RLS and exact column-privilege verification remain incomplete.
- Public precisions are state, broad region, tribal region, county, and conditionally approved city centroid. Exact/address/street/building/shelter/home/GPS/raw-last-known precision remains prohibited.
