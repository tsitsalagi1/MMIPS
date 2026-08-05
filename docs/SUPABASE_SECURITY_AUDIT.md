# Supabase Security, RLS, and Migration Audit

Static audit date: 2026-08-05. Files reviewed: `supabase/schema.sql`, `supabase/profile_types.sql`, `supabase/photo_uploads.sql`, `supabase/multiple_photos.sql`, and `supabase/security_hardening_20260805.sql`. No SQL was executed against a live or staging Supabase database.

## Schema exposure and RLS

Tables in public schema are exposed to Supabase Data API unless table grants and RLS prevent access. The schema enables RLS on submissions, persons, cases, case_verifications, case_events, correction_requests, alert_subscribers, alerts_sent, and audit_log. The multiple photo migration enables RLS on submission_photos and profile_photos.

## Findings

- Mixed public/private `cases` and `persons` tables rely on row policies, not column-level protection. Public app code was changed to explicit selected columns and no longer reads latitude/longitude, but a dedicated public-safe view/table is still recommended before launch.
- Private intake/correction/subscriber/audit tables had RLS but lacked explicit grant revocation in the original schema. New forward migration `supabase/security_hardening_20260805.sql` revokes anon/authenticated privileges from private tables and grants SELECT only to RLS-protected public tables.
- `audit_log` has RLS but no immutable append-only trigger. Service role and owners can still alter records; append-only controls and external retention remain release blockers.
- Storage buckets are defined, but storage.objects policies are not fully specified in SQL. Live bucket and object-policy verification remains incomplete.
- UPDATE policies with `WITH CHECK` are limited/absent for public roles because writes should go through service-role server routes. This is appropriate only if service-role credentials stay server-only and admin endpoints remain guarded.

## New migration

`supabase/security_hardening_20260805.sql` must be applied after all existing SQL files in this order:

1. `supabase/schema.sql`
2. `supabase/profile_types.sql`
3. `supabase/photo_uploads.sql`
4. `supabase/multiple_photos.sql`
5. `supabase/security_hardening_20260805.sql`

## Verification queries

Run only in an isolated synthetic Supabase project:

```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;
select grantee, table_name, privilege_type from information_schema.role_table_grants where table_schema = 'public' order by table_name, grantee, privilege_type;
select schemaname, tablename, policyname, cmd, qual, with_check from pg_policies where schemaname in ('public','storage') order by schemaname, tablename, policyname;
select id, public, file_size_limit, allowed_mime_types from storage.buckets where id in ('mmips-submission-photos','mmips-public-case-photos');
```

## Rollback / forward-fix

Do not disable RLS or make private buckets public. If the hardening migration blocks a legitimate route, keep real submissions disabled and add a narrower forward migration after human security review. Restore grants/policies only from the last reviewed migration and rerun synthetic RLS/storage tests.

## Correction-pass storage migration review (2026-08-05)

`supabase/security_hardening_20260805.sql` is marked **STATIC REVIEW ONLY — NOT EXECUTED**. The correction pass removed direct `storage.buckets` `INSERT ... ON CONFLICT DO UPDATE` statements because Supabase Storage bucket metadata is service-managed. Bucket creation and verification now live in `docs/STORAGE_CONFIGURATION_RUNBOOK.md` and must be performed through the approved Supabase Storage API or dashboard process.

## Public-safe view/table requirement

The current `lib/cases.ts` explicit field allowlist is an immediate application-layer control. It reduces accidental public overfetch but does not eliminate the live-verification risk created by mixed public/private fields in `cases`, `persons`, `case_verifications`, and `profile_photos`. Before launch, MMIPS should consider a dedicated public-safe view or materialized/public table containing only approved public fields.

If a PostgreSQL view is exposed to anon/authenticated roles, it must use `security_invoker = true` where supported so underlying RLS still applies, or it must be placed in an unexposed schema with access explicitly revoked and only accessed through reviewed server-side shaping. No public-safe database view or table is created in this correction pass.

## Required isolated synthetic verification

Run in a separate synthetic staging Supabase project only:

- anon SELECT on approved/published public profiles returns approved public fields only;
- anon SELECT on `submissions` is denied or returns no rows;
- anon SELECT on `correction_requests` is denied or returns no rows;
- authenticated ordinary user cannot read private submissions, correction requests, subscriber data, private photo metadata, or audit log records;
- service-role server paths can perform required inserts/reads/updates without browser exposure;
- unpublished, pending, rejected, hidden, and removed cases are not returned to anon/authenticated public readers;
- `mmips-submission-photos` upload/read/list/delete is service-role/admin-route only and denied for anon/ordinary authenticated users;
- `mmips-public-case-photos` permits anonymous reads only for moderator-approved copied objects and denies anonymous writes;
- guessed object paths do not expose pending/private/rejected/removed objects;
- anon/authenticated UPDATE/DELETE on `audit_log` is denied.
