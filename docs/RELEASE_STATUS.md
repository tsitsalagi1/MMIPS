# MMIPS Version 1 Release Status

Status: **Not ready for real submissions or real-person alert sends.**

Last updated: 2026-08-08.

## Current decision

Real family, victim, witness, subscriber, requester, or investigative data must not be entered into staging or development. Production real submission intake must remain disabled until the remaining Version 1 release gates pass and a named human records a final go/no-go decision.

Real-person publication and real-person urgent alert sending remain locked during the synthetic launch rehearsal. Nothing in this status record authorizes those locks to be removed.

## Current production baseline

- Repository: `tsitsalagi1/MMIPS`
- Production branch: `main`
- Latest successful Vercel production deployment: GitHub PR #34, ZIP-radius urgent community alerts and geographic profile search.
- GitHub `main` also contains PR #35, the production Turnstile hostname validation and privacy-safe diagnostic fix, but that change has not reached production because the Vercel Hobby deployment quota is exhausted.
- Supabase project reported `ACTIVE_HEALTHY` during the 2026-08-08 launch-hardening audit.
- Aggregate live case-state check: 16 case records, 0 approved, 0 published.

## Implemented controls

### Public/private case boundary

- Public profiles are limited to approved, published cases.
- Persons are readable only when linked to an approved, published case.
- Public events and verification records require both their public flag and an approved, published case.
- Public profile photos require profile-use approval and an approved, published case.
- Public map points are stored in a dedicated relation and require moderator approval, non-hidden status, and an approved, published case.
- Real official-source publication remains locked during the synthetic rehearsal.

### Privacy-safe map and geographic search

- Interactive MapLibre/MapTiler public map is implemented.
- Exact/private case coordinates are not used for the public map.
- Moderator-approved approximate public map points are separated from private case data.
- ZIP-distance public profile search compares Census-derived generalized ZIP geography only with approved public map points.
- Profiles without an approved public map point are excluded from geographic results rather than falling back to private location data.

### Alerts

- Double-opt-in alert subscription is implemented.
- ZIP-radius urgent community alert preferences are implemented for 10/25/50/100/250-mile radii.
- Census TIGERweb ZCTA lookup derives generalized ZIP-area geography server-side; the public flow does not request a street address or device geolocation.
- Subscriber email, ZIP, radius, generalized geography, delivery ledger, and urgent-alert event ledger remain private/service-role data.
- Moderator urgent-alert send requires approved published profile state, `urgent_public_awareness`, an approved public map point, explicit `SEND URGENT ALERT` confirmation, and the existing synthetic rehearsal lock.
- Real-person alert sends remain locked.
- Current production alert signup has one observed 400 failure. PR #35 adds production hostname handling and privacy-safe Turnstile diagnostics but is awaiting deployment capacity.

### Submission and correction safety

- Submission review-before-send and opaque public request references are implemented.
- Public submission images are restricted by application validation to JPEG/JPG, PNG, and WebP; SVG/GIF/active content and embedded metadata are rejected.
- Submission objects use generated private storage paths rather than original filenames.
- Database write guards enforce normalized-email rate limiting and clear `source_ip` before persistence.
- Distributed public abuse controls use keyed/hash-based identifiers rather than persisted raw IP addresses.
- PR #89 adds a production fail-closed real-submission release control at both the `/submit` page and `/api/submissions` POST route. Until that PR is reviewed and deployed, the current production submit page remains a release-control concern.

### Admin and security

- Admin authenticator TOTP enrollment is implemented.
- Once a verified factor exists, protected admin APIs require AAL2. Live metadata verification found one verified TOTP factor.
- Production CSP/HSTS security headers are implemented.
- Explicit deny-all RLS policies exist for private application tables.
- Public grants were removed from private application data.
- Relevant public-schema `SECURITY DEFINER` functions have explicit execute ACLs limited to `postgres`/`service_role`, not `PUBLIC`.
- Image metadata/dimension guards, distributed abuse controls, and raw-IP minimization are implemented.

## Live database verification — 2026-08-08

Metadata-only production checks found:

- all application tables in the exposed `public` schema have RLS enabled;
- `alert_subscribers`, `alert_deliveries`, `public_case_map_points`, and `urgent_alert_events` use forced RLS;
- `submissions`, `correction_requests`, `audit_log`, and `alerts_sent` retain deny-by-default public policies;
- public case/person/event/verification/photo/map policies remain constrained to approved/published or moderator-approved state;
- the private submission write guard sets `source_ip := null` before persistence;
- no `/api/submissions` requests were observed in the prior 24-hour Vercel runtime-log window when the intake-control gap was found.

No real family/subscriber/requester content was read to perform these checks.

## Storage verification — 2026-08-08

- `mmips-submission-photos` is private.
- `mmips-public-case-photos` is intentionally public for approved public assets.
- Both buckets have a 5 MB bucket-level file-size limit.
- `storage.objects` has RLS enabled and no anon/authenticated object policy granting direct writes.
- Remaining defense-in-depth configuration item: both bucket MIME allowlists still include `image/gif`, while the application intentionally rejects GIF. Remove GIF through the supported Supabase Storage API/dashboard workflow; do not mutate `storage.buckets` directly with SQL.

## Current release blockers

1. **Vercel deployment capacity:** the Hobby rolling deployment quota is currently exhausted. PR #35 and PR #89 cannot be production-verified until capacity returns.
2. **Production alert signup:** deploy PR #35/main changes, run a synthetic signup, and inspect privacy-safe Turnstile diagnostics if the 400 persists.
3. **Integrated hardening review:** PR #89 must pass full CI, receive human review, and be deployed as one consolidated change rather than several quota-consuming merges.
4. **Synthetic urgent-alert retry rehearsal:** verify one deliberately failed/retried synthetic provider-delivery sequence after PR #89 deployment.
5. **Real submission lock verification:** verify production `/submit` is locked and direct POST is rejected before request parsing after PR #89 deployment.
6. **Storage MIME defense in depth:** remove `image/gif` from both bucket allowlists using a supported Supabase Storage control plane.
7. **Supabase Auth warning:** Security Advisor reports leaked-password protection disabled. If the project plan supports the feature, enable it before real-production launch.
8. **Browser release verification:** protected staging/browser E2E, browser accessibility/axe-equivalent checks, and full user-flow verification remain required.
9. **Operational recovery:** backup/restore rehearsal, monitoring/incident-response exercise, and documented recovery evidence remain incomplete.
10. **Independent review:** independent family-support/victim-services and trauma-informed accessibility review remains incomplete.
11. **Final policies/go-no-go:** the named human release decision has not been recorded; real submission intake, real publication, and real alert sending must remain locked.

## Performance advisor status

Supabase Performance Advisor currently reports only informational unused-index notices. No indexes were removed during launch hardening because the database is young and current low usage is not evidence that the indexes are unnecessary.

## Consolidated hardening candidate

PR #89 (`release/consolidated-launch-hardening-20260808`) consolidates the green pre-deployment fixes discovered during the 2026-08-08 audit:

- fail-closed urgent-alert preference scope;
- ledger-backed/idempotent urgent-alert retries and persisted event-state accounting;
- Vercel Node 22 major-version engine contract alignment;
- fail-closed real-submission release control;
- current launch-hardening audit documentation and regression tests.

Focused PRs #85, #86, #87, and #88 each passed the full `release-foundation-verify` workflow before consolidation. PR #89 must independently pass the same integrated suite.

## Release principle

A green build is necessary but not sufficient. MMIPS Version 1 is ready for real-world use only when technical checks, live synthetic verification, privacy/security controls, accessibility, operational recovery, independent human review, and the named final go/no-go decision are all complete.
