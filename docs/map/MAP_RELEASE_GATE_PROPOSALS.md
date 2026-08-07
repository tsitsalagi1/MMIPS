# Map release gate proposals

Implemented and statically/build verified: exact MapLibre GL JS 6.0.0 dependency, ESM browser-only dynamic loading, strict public GeoJSON, exact-origin request enforcement, WebGL2 and bounded failure paths, conservative non-animated camera, map/list/filter parity, selected-profile live region, and permanent accessible-list authority. The production build passes without a Version 5 fallback.

Release remains blocked pending: approved provider/privacy/retention/attribution review; complete request-host inventory; narrow enforced CSP and worker verification; supported-browser WebGL2 tests; manual keyboard, screen-reader, reduced-motion, zoom/reflow and WCAG 2.2 AA evaluation; independent trauma-informed review; isolated synthetic live RLS tests; and reviewed moderator workflows. No geolocation, geocoding, routing, tracking, photos, provider token, or real data may be introduced.

`supabase/public_case_map_points_20260805.sql` remains **STATIC REVIEW ONLY — NOT EXECUTED**. Live RLS and column-privilege verification remain incomplete. Approximate public precisions only are allowed; exact/address/street/building/shelter/home/GPS/raw coordinates remain prohibited.
