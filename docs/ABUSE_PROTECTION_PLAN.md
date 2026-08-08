# MMIPS Abuse Protection Plan

MMIPS now has distributed application/database rate limiting for public Turnstile-verified form traffic plus database-enforced requester-email limits for submissions and correction/removal requests. Counters live in an unexposed `private` PostgreSQL schema and store only keyed hashes, time buckets, and counts. Raw request identifiers are not stored in the limiter table, and legacy submission `source_ip` values were cleared.

## Current controls

- Cloudflare Turnstile is verified server-side and fails closed in production when its secret is missing.
- Successful Turnstile-verified public form traffic is also limited by a private hashed-IP counter (30/hour per action/path bucket).
- Submission database inserts are limited to 6/hour per normalized submitter email.
- Correction/removal database inserts are limited to 10/hour per normalized requester email.
- The database write guard removes `source_ip` before a submission is stored; application code no longer includes raw source IP in the submission payload.
- Rate-limit identifiers are keyed-hashed with a database-only random secret; raw IP/email values are not stored in the counter table.
- Old counter windows are opportunistically purged after eight days.
- Alert-subscription workflow also has its own durable normalized-email resend cooldown and bounded daily send window.
- Supabase Auth supplies provider-side rate limits for authentication endpoints; MMIPS authorization still requires the server-side admin allowlist.
- Submission uploads are limited to five files and 5 MB per file.
- Upload validation requires allowed extensions, MIME type agreement, and image magic-byte signatures.
- Search inputs in admin endpoints are length-bounded and strip `%`/`,`.
- Generic public error responses avoid exposing whether private records or subscriber addresses exist.

## Remaining hardening work

- Add hosting/proxy request body limits where Vercel controls allow them independently of route-level validation.
- Add operator alerts for sustained abuse-limit denials, upload/storage failures, Turnstile failures, and repeated admin-auth denials without logging raw sensitive identifiers.
- Complete browser-level abuse testing with synthetic data only.
- Consider stronger image normalization/re-encoding and metadata stripping before approving Version 1 image uploads for broad public use.
