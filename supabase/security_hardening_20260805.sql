-- MMIPS security hardening forward migration, 2026-08-05.
-- STATIC REVIEW ONLY — NOT EXECUTED.
-- Apply after supabase/schema.sql, supabase/profile_types.sql, supabase/photo_uploads.sql, and supabase/multiple_photos.sql
-- in a separate synthetic staging Supabase project only after human review.
-- Purpose: explicitly default-deny private public-schema tables and prevent anonymous/authenticated Data API grants
-- from broad private-table access.
-- Storage bucket metadata is service-managed and must be configured through the approved Supabase Storage API
-- or dashboard process documented in docs/STORAGE_CONFIGURATION_RUNBOOK.md. This migration intentionally does
-- not INSERT, UPDATE, DELETE, or otherwise mutate storage.buckets.

alter table submissions enable row level security;
alter table correction_requests enable row level security;
alter table alert_subscribers enable row level security;
alter table alerts_sent enable row level security;
alter table audit_log enable row level security;
alter table case_verifications enable row level security;
alter table case_events enable row level security;
alter table persons enable row level security;
alter table cases enable row level security;

alter table if exists submission_photos enable row level security;
alter table if exists profile_photos enable row level security;

revoke all on submissions from anon, authenticated;
revoke all on correction_requests from anon, authenticated;
revoke all on alert_subscribers from anon, authenticated;
revoke all on alerts_sent from anon, authenticated;
revoke all on audit_log from anon, authenticated;
revoke all on submission_photos from anon, authenticated;

-- The public site reads approved cases/persons/verifications/events/photos through explicit RLS policies.
-- Grant table-level SELECT only where a reviewed policy also restricts rows.
grant select on cases to anon, authenticated;
grant select on persons to anon, authenticated;
grant select on case_verifications to anon, authenticated;
grant select on case_events to anon, authenticated;
grant select on profile_photos to anon, authenticated;

-- Reviewed storage.objects policy posture to verify in synthetic staging:
-- 1. No anon/authenticated INSERT, UPDATE, DELETE, SELECT, or LIST access to bucket_id = 'mmips-submission-photos'.
-- 2. No anon/authenticated write access to bucket_id = 'mmips-public-case-photos'.
-- 3. Public reads from 'mmips-public-case-photos' must be limited to moderator-approved copied objects only.
-- 4. Service-role server routes perform pending uploads, signed admin reads, and moderator publication copies.
-- No storage.objects policy is created here because live bucket/object-policy behavior must be tested in a
-- separate synthetic staging project before launch.

-- Verification queries for isolated synthetic database execution:
-- select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename;
-- select grantee, table_name, privilege_type from information_schema.role_table_grants where table_schema = 'public' order by table_name, grantee, privilege_type;
-- select schemaname, tablename, policyname, cmd, qual, with_check from pg_policies where schemaname in ('public','storage') order by schemaname, tablename, policyname;
-- select id, public, file_size_limit, allowed_mime_types from storage.buckets where id in ('mmips-submission-photos','mmips-public-case-photos');
-- As anon: SELECT approved/published public profiles should return only approved rows permitted by RLS.
-- As anon: SELECT from submissions and correction_requests must be denied or return no rows by privilege/RLS.
-- As authenticated ordinary user: private submissions, correction_requests, subscriber data, private photo metadata, and audit_log must be denied.
-- As service role: server-only routes must be able to insert/read/update required private records.
-- As anon/authenticated: unpublished, pending, rejected, hidden, and removed cases must not be discoverable.
-- Storage tests: pending bucket upload/read/list/delete requires service role only; public bucket reads only approved copied objects; guessed pending/public object paths must not expose private objects.
-- Audit tests: anon/authenticated UPDATE/DELETE audit_log must be denied; service role writes should be append-only in future forward migration.

-- Rollback / forward-fix guidance:
-- Do not disable RLS or make pending-review buckets public. If this migration blocks a legitimate app path,
-- add a narrower replacement policy in a new forward migration after human security review. In an emergency,
-- restore table grants/policies from the last reviewed migration and keep real submissions disabled until verified.
