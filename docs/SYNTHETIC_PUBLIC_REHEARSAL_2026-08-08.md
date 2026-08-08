# MMIPS synthetic public rehearsal — 2026-08-08

MMIPS production contains five intentionally fictional public profiles for launch testing. Every synthetic person name begins with `MMIPS TEST PERSON` and includes `NOT A REAL PERSON` in the public name. These records exist only to exercise the real public search, ZIP-distance, profile, flyer, map, correction/removal, and alert workflows without using a real family or case.

## Synthetic public slugs

- `mmips-test-person-001` — standard missing profile, Tahlequah-area test point
- `mmips-test-person-002` — urgent missing/public-awareness profile, Tahlequah/Cherokee County test point
- `mmips-test-person-003` — murdered/unsolved information-needed profile, Muskogee-area test point
- `mmips-test-person-004` — unidentified profile, broad Eastern Oklahoma test point
- `mmips-test-person-005` — located/resolved profile, Oklahoma City-area test point

The urgent synthetic record is deliberately positioned inside the 74464 / 50-mile rehearsal area so a confirmed test subscriber using those preferences can exercise geographic alert matching.

## Safety rules

- Never replace these names, summaries, agency names, or tip contacts with real-person data during rehearsal.
- Never use a real private incident/home coordinate. Map points are city-centroid or broad-region synthetic references.
- The synthetic agency and tip-contact fields are explicitly labeled test-only.
- Real-person urgent sends remain locked by the application rehearsal guard.
- Do not bypass email confirmation for test subscribers. Confirmation and unsubscribe must be tested through the same public workflow users will use.

## Cleanup / unpublish after rehearsal

Use a reviewed database action targeting only the synthetic slugs. A safe cleanup should set `published_at = null` and `review_status = 'pending_review'` for `slug like 'mmips-test-person-%'`, and hide/remove only their corresponding synthetic map points. Do not use a broad case-table update.
