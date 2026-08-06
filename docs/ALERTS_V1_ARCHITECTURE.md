# Alerts V1 architecture

Alerts V1 is a server-only, double-opt-in email system. The browser submits email, the single `all_public_alerts` preference, and a Turnstile token. Production fails closed unless Supabase, Resend, Turnstile, an expected Turnstile hostname, and the unsubscribe signing key are configured. The Alerts form renders Turnstile with action `alerts_subscribe`; Siteverify checks success, action, and reviewed hostname with a five-second timeout. MMIPS does not send the optional remote IP to Cloudflare.

A request writes the legacy-required `email`, `consent_source`, `consent_text`, and `consent_at` request evidence plus `subscription_requested_at`; confirmation is separately recorded in `confirmed_at`. A durable 10-minute cooldown and three-send/24-hour window applies per normalized address. Active and suppressed addresses are never mailed. An unsubscribed address may explicitly resubscribe; its stable unsubscribe identifier is preserved.

GET `/alerts/confirm` and GET `/alerts/unsubscribe` only render calm pages. Explicit browser POSTs perform changes. POST `/api/alerts/unsubscribe?token=...` also supports RFC 8058 form submissions and returns generic 200 JSON without redirect. Confirmation is a single conditional database function update.

The private `alert_deliveries` ledger uses `queued`, `sent`, `failed_retryable`, and `failed_final`. A unique subscriber/event key is the provider idempotency boundary. Automated dispatch remains disconnected pending live review; provider acceptance must precede `sent`.

Unresolved release blockers: distributed network rate limiting, live RLS and migration verification, live provider delivery/monitoring, browser/keyboard/screen-reader/contrast/zoom testing, and independent security/accessibility review.
