# MMIPS Current State Gap Analysis

Baseline inspected: `/workspace/MMIPS` at `e61872d Add files via upload`.

This audit is based on repository inspection only. It does not claim any command passed unless listed in the final task report.

## Already implemented

- Next.js app structure exists with `app`, `components`, `lib`, and `supabase` directories.
- `package.json` exists with `dev`, `build`, `start`, and `lint` scripts.
- Public submission page includes safety notices, authority confirmations, anti-rumor confirmation, Turnstile widget, public/private location language, and multiple-photo component wiring.
- Submission API accepts pending-review submissions, verifies Turnstile when configured, supports private Supabase storage upload, limits images to five files, checks image MIME types, limits each image to 5 MB, and inserts photo metadata.
- Confirmation routes exist for submissions and correction requests.
- Admin dashboard and admin APIs exist for submissions, corrections, and public profile lookup.
- Public profile listing, profile detail routes, flyer routes, share buttons, and flyer image download/print functionality exist.
- Correction/removal request page and API exist.
- Public map page exists as a safety-filtered list grouped by category rather than an exact-location map.
- Supabase SQL files exist for baseline schema, profile types, single-photo uploads, and multiple-photo metadata.
- Turnstile server verification helper exists and is called by submission/correction APIs.
- Email helper exists using Resend when `RESEND_API_KEY` is configured.
- Legal, privacy, data policy, terms, and safety policy pages exist.

## Partially implemented

- Dependency management exists, but dependencies use `latest` and no committed root lockfile was present after cleanup, which weakens release reproducibility.
- Lint is configured as `next lint`, but current Next.js versions may not support that command; CI is not present in the inspected tree.
- Submission flow exists, but review-before-submit and visible reference-number confirmation are not verified as complete.
- Moderator review exists, but release-grade audit logging, request-more-information workflows, and documented moderator procedures are incomplete or unverified.
- Multiple-photo upload support exists, but public approval rules, malware scanning, image moderation procedures, and storage policies require deeper validation.
- Public profiles, flyers, and sharing exist, but QR generation and complete E2E coverage are missing or unverified.
- Correction/removal intake exists, but urgent temporary hiding, complete audit trail, and human escalation procedures are unverified.
- Alert page exists, but it is currently a static form with a non-submitting button; double opt-in and unsubscribe are missing.
- Map is privacy-safe by avoiding exact map pins, but Version 1 requires an interactive public map plus accessible list.
- RLS policies are present in SQL files, but live database enforcement was not verified and all storage policies require review.
- Environment-variable usage exists for Supabase, admin emails, Turnstile, Resend, and site URL, but required staging/production separation is undocumented.
- Accessibility-minded components and labels exist, but WCAG 2.2 AA is not verified by automated or manual testing.

## Missing

- CI workflow files.
- Committed dependency lockfile.
- Unit, integration, E2E, accessibility, and security test suites.
- Type-check script in `package.json`.
- Working alert subscription backend, double opt-in, unsubscribe, alert send workflow, and subscriber data model.
- Interactive map implementation with privacy-safe geocoding/generalization and accessible equivalent list parity.
- Documented separate staging and production systems.
- Monitoring and alerting configuration.
- Backup schedule documentation for database and storage.
- Actual restore rehearsal documentation.
- Incident-response runbook.
- Independent family-support or victim-services review record.
- Explicit final go/no-go release approval record.

## Unsafe or unverified

- Live Supabase schema, RLS, and storage bucket policies were not verified from this repository-only task.
- Service-role use exists in server routes; production secret handling must be verified in deployment settings without exposing values.
- `TURNSTILE_SECRET_KEY` is optional in code and verification is skipped when missing; this is acceptable for local/demo development but not for public launch.
- Email delivery is skipped when `RESEND_API_KEY` is missing; Version 1 alerts and confirmations require verified email configuration.
- Logs in demo/error paths should be reviewed to avoid unnecessary personal data in production logs.
- No security scan result is present.
- No accessibility audit result is present.

## Blocked by policy or external review

- Real submissions must remain disabled until policies are final, independent family-support/victim-services review is complete, staging rehearsal passes, restore rehearsal passes, and final go/no-go is recorded.
- Production credentials must not be added to Codex; production deployment verification must be completed by authorized humans through cloud provider settings.
