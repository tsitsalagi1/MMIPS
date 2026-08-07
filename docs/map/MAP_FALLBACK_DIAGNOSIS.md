# Public map fallback diagnosis

## Confirmed zero-result cause

The profile search and map page both called `getPublishedCases()`. That loader deliberately maps every production database row with `latitude` and `longitude` set to `undefined`, because `cases` is a mixed public/private table and its coordinates must not enter a public response. The map page then discarded every profile whose coordinates were undefined. Consequently, search could show the same profiles using non-coordinate fields while the map list and GeoJSON received zero points. This happened before GeoJSON creation and before MapLibre initialization; it was not caused by CSP or a style request.

The fix uses the separately reviewed `public_case_map_points` relation and selects only its public-safe columns. It does not query coordinates from `cases`. The complete accessible list continues to use `getPublishedCases()` and is therefore no longer incorrectly coupled to whether a profile has a public map point.

## Independent visual-renderer configuration

After points load, MapLibre still intentionally stays unavailable unless all three public deployment values are present and valid:

- `NEXT_PUBLIC_MAP_STYLE_URL`: absolute HTTPS URL for the approved style;
- `NEXT_PUBLIC_MAP_ATTRIBUTION`: required provider attribution; and
- `NEXT_PUBLIC_MAP_ALLOWED_ORIGINS`: comma-separated, exact HTTPS origins needed by the style, tiles, sources, glyphs, sprites, and images.

The style URL's exact origin must be in the allowlist. Every additional resource origin referenced by the approved style must also be listed. Wildcards, HTTP, paths in origin entries, and substring matches are rejected. These values are public configuration, not secrets. Because Next.js embeds `NEXT_PUBLIC_*` values into the client bundle, configure them in the deployment environment before building and redeploy after a change.

The `public_case_map_points` relation must also exist in the target Supabase project with the reviewed anonymous read grant/RLS behavior. If its static migration has not been approved and applied by an authorized operator, the loader safely returns no map points. This task did not execute or add a migration.
