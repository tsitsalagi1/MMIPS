# MMIPS Abuse Protection Plan

Distributed rate limiting is unresolved and remains a release blocker. This task did not add a paid provider or claim distributed protection.

## Current controls

- Cloudflare Turnstile helper supports server-side verification when `TURNSTILE_SECRET_KEY` is configured.
- Submission uploads are limited to five files and 5 MB per file.
- Upload validation now requires allowed extensions, MIME type agreement, and image magic-byte signatures.
- Search inputs in admin endpoints are length-bounded and strip `%`/`,`.

## Required before launch

- Production Turnstile secret must be configured; missing secret must fail closed in production.
- Verify hostname/action and token outcome fields where supported.
- Add distributed IP/requester/email rate limits for submissions, corrections/removals, uploads, alert subscription/confirm/unsubscribe, and admin auth attempts.
- Store only minimized IP/rate-limit identifiers with retention limits.
- Add request body size limits at hosting/proxy layer.
- Non-enumerating responses for correction/removal and future alert subscriber flows.
- Monitoring/alerting for bursts, upload failures, Turnstile failures, and admin auth denial spikes.
