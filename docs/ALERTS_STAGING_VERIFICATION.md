# Alerts V1 staging verification

**Migration is STATIC REVIEW ONLY — NOT EXECUTED.** Order: baseline `supabase/schema.sql`, reviewed security hardening, then `supabase/alerts_v1_20260805.sql` in a disposable synthetic Supabase project. Run the collision preflight; any normalized duplicate must stop work for human reconciliation. Never merge/delete it automatically. Verify legacy phone-only rows survive and new email rows satisfy all legacy consent NOT NULL fields.

With synthetic addresses and Cloudflare test keys, verify anon/auth cannot read/write subscriber or delivery tables; service-role routes can; confirmation is atomic under concurrent POSTs; GET pages perform no writes; cooldown/window limits persist; RFC 8058 POST is generic/idempotent; and delivery uniqueness/retry states hold. Confirm missing production Turnstile, email, signing, or Supabase configuration fails closed. No remote IP is sent to Siteverify.

Mocked tests are not live RLS or live email evidence. Before release, perform isolated migration/RLS verification, mocked-to-sandbox provider acceptance and retry monitoring, browser/keyboard/screen-reader/contrast/zoom testing, and independent review. Distributed network rate limiting remains required.

Rollback/forward-fix: disable alert routes and dispatch first; snapshot synthetic evidence; apply a reviewed forward migration to repair function/policies/table. Drop `alert_deliveries` only if unused. Never drop, merge, or rewrite subscriber/consent history automatically.

## Synthetic behavioral evidence (2026-08-06)
The unit suite now runs the production workflow functions against an atomic in-memory synthetic store, fixed clock, deterministic token factories/signing keys, and controlled mailer responses. It covers subscription lifecycle/cooldown/window behavior, provider outcomes, concurrent confirmation, signed unsubscribe and key rotation, event/status filtering, ledger deduplication and delivery transitions, URL/header/content contracts, and Turnstile fail-closed behavior. Route and migration contracts remain source/static tests. These are mocked behavioral tests—not live Supabase concurrency/RLS or live Resend evidence.

Resend's provider idempotency retention is only a temporary secondary safeguard; MMIPS's durable unique subscriber/event ledger remains responsible for long-term duplicate suppression. Distributed network rate limiting, live isolated RLS, live provider verification/monitoring, browser/manual accessibility, and independent review remain unresolved release gates.
