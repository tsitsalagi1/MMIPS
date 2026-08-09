# MMIPS Global Federation Architecture

## Decision

MMIPS is one worldwide identity and safety standard, but it is **not one worldwide application database**.

`mmips.com` is the global country/region gateway. It must not store family submissions, case records, subscriber geography, moderator notes, private photos, investigative information, or country-admin credentials.

Each active country operates as a separate country system with its own deployment and its own Supabase project.

Initial target topology:

- `mmips.com` — Global gateway; no case database.
- `us.mmips.com` — United States MMIPS; current production application and current Supabase project.
- `ca.mmips.com` — Canada MMIPS; future separate application/project/database.
- `au.mmips.com` — Australia MMIPS; future separate application/project/database.
- `nz.mmips.com` — Aotearoa / New Zealand MMIPS; future separate application/project/database.

## Non-negotiable isolation rules

1. One country must never receive another country's Supabase service-role key, database password, Auth admin key, storage credential, alert subscriber table, or private submission table.
2. The global gateway receives no country Supabase secrets.
3. Country administrators authenticate only against their country system unless a future governance process explicitly creates a separate global administrative function with no routine country-family-data access.
4. Country systems may share reviewed source-code packages for security, accessibility, uploads, moderation primitives, map rendering, and testing. Shared code does not imply shared data.
5. Country-specific terminology, intake questions, legal notices, emergency instructions, official systems, resource pages, and moderation requirements remain country-owned and country-specific.
6. A country can impose stronger safety or privacy protections than the MMIPS minimum standard.
7. MMIPS must not silently redirect a visitor based on IP geolocation. Visitors select the country/region they intend to use.

## Global gateway responsibilities

The global gateway may store or embed only low-risk configuration such as:

- country code;
- public country/region display name;
- public portal URL;
- public availability state (`active` or `preparing`);
- short public description.

The gateway must not become a master index of private country records.

A future global public discovery layer, if approved, must be built from separately approved public relay records and must not require direct read access to country-private databases.

## Cross-border relay model

Cross-border sharing must be explicit and public-only.

A country may publish a small relay object to another country containing only information already approved for public distribution, for example:

- origin country;
- canonical public profile URL;
- approved public display name;
- approved public photo URL or asset, if authorized for cross-border reuse;
- approved approximate public-awareness area;
- official public tip contact;
- public alert status and expiry.

Never relay submitter identity, submitter contact details, subscriber geography, exact/private coordinates, moderator notes, private source material, service credentials, or unpublished records.

The origin country remains canonical. Corrections/removals must propagate to any public relay copies.

## Shared minimum safety controls

Every country implementation must preserve at least:

- human review before publication;
- public/private data separation;
- safe approximate-location controls;
- explicit photo/publication permission controls;
- correction/removal workflow;
- administrator MFA/AAL2 or equivalent strong MFA;
- least-privilege database access and RLS or equivalent controls;
- auditable administrative changes;
- abuse protection and rate limiting;
- secure upload validation;
- accessible non-map result access;
- trauma-informed presentation;
- no public rumors, unverified suspect accusations, or unsafe private-location disclosure;
- explicit synthetic/test-data labeling and separation from real-person workflows.

## United States preservation rule

The current MMIPS application becomes the United States implementation. U.S.-specific concepts such as NamUs, NCIC, ZIP codes, 911, Tribal law enforcement, FBI/BIA MMU references, state/county geography, and U.S. release controls are not generalized merely to make other countries fit.

Other countries build their own country-specific workflows.

## Country activation gate

A country portal must remain `preparing` until all of the following are complete:

1. separate deployment/project;
2. separate database/Auth/Storage environment;
3. country-specific reporting and emergency guidance;
4. country-specific Indigenous terminology review;
5. country-specific privacy/legal review;
6. country-specific moderation and correction/removal procedures;
7. synthetic rehearsal data only during validation;
8. security, accessibility, map, alert, and disaster-recovery checks;
9. explicit release authorization for real intake.

No global release decision automatically opens real intake in a country system.
