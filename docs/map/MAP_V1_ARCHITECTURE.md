# Map V1 foundation architecture

Status: foundation only; no visual map renderer is installed. The accessible list is the authoritative public interface.

## Data flow and failure states

`getPublicMapPoints` checks public Supabase configuration, reads only the dedicated `public_case_map_points` boundary, sanitizes rows into an explicit public response, and returns `{ points, availability }`. Missing configuration returns no points with `unconfigured`; a query failure returns no points with `error`; neither path substitutes demo data or private case coordinates. Public messaging is generic.

Filters operate once over the allowlisted points used by the list. The placeholder has no markers, geographic positioning, map role, or inert zoom controls. A real browser-only renderer may be added only after the compatibility, provider, CSP, privacy, and accessibility gates in `MAP_PROVIDER_AND_CSP.md` pass.

## Public boundary

Allowed precision is `state`, `broad_region`, `tribal_region`, `county`, or conditionally approved `city_centroid`. Exact, address, street, building, shelter, home, device/GPS, raw last-known, geocoded, narrative-derived, and private coordinates are prohibited. Family authorization and moderator safety review are prerequisites outside this public loader.

Map V1 returns no photos. The current photo schema does not expose enough independent publication/moderation, public-bucket, and hidden/removed evidence for this loader to prove authorization unambiguously. Photo support remains an incomplete release gate.

## Migration and rollback

Apply existing schema and photo/security migrations first, then statically review `supabase/public_case_map_points_20260805.sql` in an isolated synthetic project. It has not been executed. Unsafe points must be hidden through a reviewed server workflow; policy defects require a narrower forward migration, never disabling RLS.
