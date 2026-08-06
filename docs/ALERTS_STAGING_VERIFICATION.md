# Alerts V1 Staging Verification

Use an isolated synthetic Supabase project only. Do not use real subscriber, family, victim, witness, requester, moderator, investigative, exact-location, production, or staging-live data.

## Migration order

1. Apply baseline schema.
2. Apply `supabase/security_hardening_20260805.sql` if not already present.
3. Apply `supabase/alerts_v1_20260805.sql`.

The Alerts V1 migration is marked `STATIC REVIEW ONLY — NOT EXECUTED` in this repository and was not applied by Codex.

## Verification

Run the verification queries embedded in the migration, then use synthetic addresses from reserved example domains through the public routes. Verify anon and ordinary authenticated roles cannot select, insert, update, or delete `alert_subscribers` or `alerts_sent`; service-role server routes can perform pending, confirm, unsubscribe, and ledger writes.

## Rollback / forward fix

If the migration has not been applied, rollback is to revert the code and migration file. If applied in synthetic staging, disable alert routes, preserve a database snapshot, and use a reviewed forward migration to drop or repair policies/indexes/columns. Do not run destructive subscriber changes in production without human approval.

## Accessibility verification still required

Source checks do not prove WCAG 2.2 AA conformance. Browser, keyboard, screen-reader, 200% zoom/reflow, contrast, Turnstile, and independent trauma-informed human review remain required.
