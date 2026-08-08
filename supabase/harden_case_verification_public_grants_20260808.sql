-- MMIPS least-privilege hardening for public case verification provenance.
-- Applied to production through the approved Supabase migration workflow on 2026-08-08.
-- Anonymous/authenticated users need SELECT only; RLS further restricts reads to public
-- verification rows belonging to approved, published cases.

revoke insert, update, delete, truncate, references, trigger
  on table public.case_verifications
  from anon, authenticated;

grant select
  on table public.case_verifications
  to anon, authenticated;
