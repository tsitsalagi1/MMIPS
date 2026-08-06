# MMIPS Version 1 Release Status

Status: **Not ready for real submissions**.

## Current decision

Real family, victim, witness, subscriber, requester, or investigative data must not be entered into staging or development. Production real submissions must remain disabled until all Version 1 release gates pass and a named human records a final go/no-go decision.

## Baseline

- Expected repository: `tsitsalagi1/MMIPS`
- Selected base: `main`
- Baseline commit inspected: `e61872d Add files via upload`
- Codex workspace may appear as `work`; that is not a release concern by itself.

## Completed in this coordination task

- Persistent Codex safety rules added.
- Full Version 1 release specification added.
- Binary release gates added.
- Current-state gap analysis added.
- Parallel Codex workstream plan added.
- Trauma-informed UX standard added.
- Pull-request template added.
- Detailed prompts for six cloud workstreams added.

## Release blockers

- CI and automated checks now have a foundation workflow and accurately named synthetic unit/static/contract/smoke/accessibility-baseline checks, but full Version 1 protected staging, browser E2E, axe/browser accessibility, live database integration, security, RLS, and live deployment verification remain incomplete.
- Alerts V1 is not implemented.
- Interactive privacy-safe map V1 is not implemented.
- Live RLS/storage policies are unverified.
- Monitoring, backups, and restore rehearsal are not complete.
- Independent family-support/victim-services review is not complete.
- Final policies and final go/no-go are not complete.

## Foundation CI evidence (codex/foundation-ci)

- Added pinned dependency declarations, `package-lock.json` usage, Node 22.23.1 runtime documentation, ESLint flat config, `typecheck`, accurately named synthetic unit/static/contract/smoke/accessibility-baseline scripts, secret-pattern scan, separate online/offline dependency audit commands, and pull-request CI workflow.
- Evidence is limited to commands run in the Codex workspace plus the configured GitHub workflow. Browser end-to-end testing, axe or equivalent browser accessibility scanning, live/isolated Supabase integration, protected staging lifecycle testing, RLS/storage verification, full secret-scanning service evidence, and independent trauma-informed accessibility review remain incomplete.

## Security audit update (codex/security-audit, 2026-08-05)

- Added static threat model, access-control matrix, Supabase/RLS audit, security findings register, secure logging standard, and abuse-protection plan.
- Fixed confirmed high-risk public overfetch in public profile loaders by replacing broad `SELECT *` joins with explicit public field selection and by not exposing latitude/longitude from the public loader.
- Hardened upload validation with extension/MIME agreement, image magic-byte checks, SVG/active-content rejection, and generated UUID-only object names that do not include original filenames.
- Added a forward SQL hardening migration that explicitly enables RLS, revokes anon/authenticated access to private tables, grants SELECT only for RLS-protected public tables, and reasserts private/public storage bucket posture.
- Added static/unit security checks for upload validation, admin guard coverage, public data overfetch prevention, security headers, and audit-log grant hardening.
- Live Supabase RLS behavior, live storage policies, isolated staging lifecycle, browser E2E, full malware scanning/re-encoding, distributed rate limiting, report-only/full CSP verification, manual penetration testing, independent security review, and incident-response exercise remain incomplete release blockers.

## Security audit correction-pass update (codex/security-audit, 2026-08-05)

- Removed direct `storage.buckets` mutation from `supabase/security_hardening_20260805.sql`; bucket configuration is now documented in `docs/STORAGE_CONFIGURATION_RUNBOOK.md` for approved Supabase Storage API/dashboard handling and separate synthetic verification.
- Restricted Version 1 uploads to JPEG/JPG, PNG, and WebP; GIF remains deferred until a reviewed image-processing pipeline exists.
- Added safer API error handling for current identified `app/api/**` 500 responses and privacy-minimized operational error codes.
- Added regression tests for GIF/SVG rejection, empty/oversized/spoofed/mismatched images, storage migration bucket-mutation prohibition, raw-error response prevention, public coordinate exclusion, and service-role browser-import boundaries.
- The SQL migration remains static review only and was not executed. Live RLS/storage verification remains incomplete.


## Alerts V1 implementation update (codex/alerts-v1, 2026-08-05)

- Added private email-alert subscription UI, server routes, token hashing, static migration, synthetic tests, and documentation.
- Alerts remain not production-ready until the static migration is reviewed/applied in isolated synthetic staging, live RLS is verified, live email delivery is tested with non-production provider credentials, distributed rate limiting is implemented, and browser/manual accessibility review is completed.
