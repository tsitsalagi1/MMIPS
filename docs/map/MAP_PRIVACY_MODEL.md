# Map privacy model

The dedicated public map table contains intentionally approximate public-awareness centroids only. It must never be populated automatically from raw coordinates, exact addresses, IP/EXIF/device data, family contacts, narratives, shelters, recovery sites, residences, witness locations, or investigative information. Random jitter alone is not a privacy control.

Public release requires family authorization, moderator approval, and a recorded safety review. Only approved, published cases connected to approved, non-hidden points may be read. Allowed precision is `state`, `broad_region`, `tribal_region`, `county`, and carefully reviewed `city_centroid`; exact, address, street, building, shelter, home, GPS/device, and raw last-known precision are prohibited.

Missing configuration and database errors fail closed to an empty public list. There is no synthetic production fallback, private-coordinate fallback, browser geolocation, or geocoding. Map V1 omits thumbnails because the current queried schema cannot independently prove every necessary public-photo permission. `public_notes`, moderator identity, review evidence, and private source coordinates are not public columns.
