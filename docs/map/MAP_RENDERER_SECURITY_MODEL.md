# Map renderer security model

## Public data boundary

The renderer receives the same filtered `PublicMapPoint[]` as the authoritative list and projects it to GeoJSON. Coordinates are revalidated and ordered `[publicLongitude, publicLatitude]`. Features contain only a public identifier, slug, public name, public map label, public profile type, public status, and approved precision. Raw/private coordinates, exact addresses, contacts, moderation state/evidence, notes, photos, storage paths, and filenames are excluded. Coordinates are not placed in URLs, HTML data attributes, storage, analytics, or logs.

The database migration remains **STATIC REVIEW ONLY — NOT EXECUTED**. RLS, not the anonymous client, enforces `moderator_approved = true` and `hidden_at is null`.

## Browser and provider boundary

MapLibre GL JS 6.0.0 is exactly pinned and loaded by `next/dynamic` with `ssr: false` from a Client Component. No provider is hard-coded, selected, or approved. Enabling requires an absolute HTTPS style URL, non-empty attribution, and an exact comma-separated HTTPS origin allowlist. Wildcards, credentials, non-HTTPS/custom schemes, style origins outside the allowlist, and origin-substring lookalikes fail closed.

`transformRequest` applies exact `URL.origin` matching to style, source, tile, sprite, glyph, and image requests. Rejected requests produce only a bounded internal code; full URLs, query parameters, response bodies, coordinates, names, slugs, IDs, and device/GPU information are not logged. Provider review must inventory every required origin before configuration.

## Failure and interaction model

A usable WebGL2 context is required before MapLibre construction. Missing/invalid configuration, WebGL2 absence, initialization/style failure, rejected resources, and context loss show generic inline wording while the complete list and profile links remain available. There is no alert, retry loop, fingerprint collection, geolocation, geocoder, routing, visitor-position feature, automatic popup, tracking, or analytics.

Rotation, pitch, touch pitch, and scroll zoom are disabled. Keyboard-operable zoom controls omit the compass. Camera fits use zero duration and conservative maximum zoom; no fly-to, pulsing, or continuous animation is used. Selection renders a public-safe React summary outside the canvas without focus movement or forced scrolling.
