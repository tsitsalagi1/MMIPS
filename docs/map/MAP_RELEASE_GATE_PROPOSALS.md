# MAP RELEASE GATE PROPOSALS

Status: Map V1 implementation evidence for static review. Use synthetic data only; no production or staging data was accessed.

## Summary

The public map uses a dedicated `public_case_map_points` boundary and `lib/public-map.ts` allowlist. Exact/private case coordinates remain outside the public map response. The visual map is provider-gated by `NEXT_PUBLIC_MAP_STYLE_URL`; when absent or unavailable, the equivalent accessible list remains visible and complete.

## Privacy model

Allowed precision values are `state`, `broad_region`, `tribal_region`, `county`, and `city_centroid`. Prohibited precision includes exact, address, street, building, shelter, home, GPS-device, raw last-known coordinates, automatic geocoding, visitor geolocation, requester/family contact data, EXIF, IP address, or narrative-derived location parsing.

Family authorization and moderator approval are required before a point becomes public. Hidden, unpublished, rejected, and unapproved records must not appear. City centroids are permitted only as approved public-area centroids, never event, residence, shelter, recovery, or investigative points.

## Accessibility and parity

The list is permanent equal-access functionality, not just fallback. Filters for profile type, status, and approved area affect the map marker set and list from the same filtered collection. Result counts use a polite live region. Profile links remain available from the list without interacting with the visual map.

Browser keyboard, screen-reader, and WCAG conformance are not claimed from source review. Human and browser testing remain release gates.

## Provider and CSP

Preferred engine evaluated: MapLibre GL JS, selected because it is open-source and does not require Google Maps billing/tracking. Exact package install was attempted for `maplibre-gl@5.13.0`, but the registry returned 403 in this Codex environment; no dependency was added. Provider configuration remains deferred until a reviewed style/tile URL, attribution, retention policy, and CSP host allowlist are approved.

Required CSP plan: no `connect-src *`, `img-src *`, `worker-src *`, or `script-src unsafe-eval`. Allow only reviewed style/tile/connect/image/worker origins and blob worker/image behavior required by the chosen provider after testing.

## Migration and RLS

Migration order: existing schema, profile/photo migrations, security hardening migration, then `supabase/public_case_map_points_20260805.sql`. The migration is STATIC REVIEW ONLY — NOT EXECUTED. It enables RLS, grants only column-limited select, denies public writes, allows anon/authenticated reads only for approved visible points connected to approved published cases, and omits private moderator identity from public grants.

## Verification still required

Run isolated synthetic Supabase tests for anon/authenticated/service-role behavior, hidden/unpublished exclusion, unapproved point exclusion, column privacy, table/view RLS bypass attempts, and provider failure behavior. Do not run against production.

## Rollback / forward fix

If a public point is unsafe, set `hidden_at` through the reviewed moderator workflow. If policy behavior is too broad, keep real submissions disabled and add a narrower reviewed forward migration. Do not disable RLS.
