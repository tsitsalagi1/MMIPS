# MMIPS Abuse Protection Plan

MMIPS uses layered public-form abuse controls. The distributed limiter described here was applied to production on 2026-08-08 and does not require another external API provider or key.

## Current controls

- Cloudflare Turnstile is verified server-side and fails closed in production when its secret is missing.
- Successful Turnstile-verified public form traffic is limited by a private keyed-hash IP counter (30/hour per action/path bucket).
- Submission inserts are limited to 6/hour per normalized submitter email.
- Correction/removal inserts are limited to 10/hour per normalized requester email.
- Rate-limit counters live in an unexposed `private` PostgreSQL schema and store only keyed hashes, time buckets, and counts; raw identifiers are not stored in the counter table.
- A database write guard clears submission `source_ip` before persistence, and legacy stored values were cleared when the migration was applied.
- Old counter windows are opportunistically purged after eight days.
- Alert subscriptions have additional durable normalized-email resend cooldown and bounded-send protections.
- Supabase Auth provides provider-side authentication endpoint limits; MMIPS admin authorization separately requires the server-side admin allowlist.
- Submission uploads are limited to five files and 5 MB per file, and current image validation also rejects unsafe embedded metadata and extreme dimensions.
- Public error responses are designed not to enumerate private records or subscriber addresses.

## Remaining operational hardening

- Add hosting/proxy body-size controls where the hosting plan exposes them independently of route validation.
- Add operator alerts for sustained abuse denials, upload/storage failures, Turnstile failures, and repeated admin-auth denials without logging raw sensitive identifiers.
- Complete browser-level abuse testing with synthetic data only.
