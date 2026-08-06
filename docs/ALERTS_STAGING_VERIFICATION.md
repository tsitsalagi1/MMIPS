# Alerts V1 staging verification

**Migration is STATIC REVIEW ONLY — NOT EXECUTED.** Order: baseline `supabase/schema.sql`, reviewed security hardening, then `supabase/alerts_v1_20260805.sql` in a disposable synthetic Supabase project. Run the collision preflight; any normalized duplicate must stop work for human reconciliation. Never merge/delete it automatically. Verify legacy phone-only rows survive and new email rows satisfy all legacy consent NOT NULL fields.

With synthetic addresses and Cloudflare test keys, verify anon/auth cannot read/write subscriber or delivery tables; service-role routes can; confirmation is atomic under concurrent POSTs; GET pages perform no writes; cooldown/window limits persist; RFC 8058 POST is generic/idempotent; and delivery uniqueness/retry states hold. Confirm missing production Turnstile, email, signing, or Supabase configuration fails closed. No remote IP is sent to Siteverify.

Mocked tests are not live RLS or live email evidence. Before release, perform isolated migration/RLS verification, mocked-to-sandbox provider acceptance and retry monitoring, browser/keyboard/screen-reader/contrast/zoom testing, and independent review. Distributed network rate limiting remains required.

Rollback/forward-fix: disable alert routes and dispatch first; snapshot synthetic evidence; apply a reviewed forward migration to repair function/policies/table. Drop `alert_deliveries` only if unused. Never drop, merge, or rewrite subscriber/consent history automatically.
