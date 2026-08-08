-- MMIPS explicit deny-all RLS policies for private public-schema tables, 2026-08-08.
-- Applied to production through the approved Supabase migration workflow on 2026-08-08.
-- Public grants are already revoked; these restrictive policies make the intended deny-all posture explicit.

create policy "deny public alerts_sent access" on public.alerts_sent
  as restrictive for all to anon, authenticated
  using (false) with check (false);

create policy "deny public audit_log access" on public.audit_log
  as restrictive for all to anon, authenticated
  using (false) with check (false);

create policy "deny public correction_requests access" on public.correction_requests
  as restrictive for all to anon, authenticated
  using (false) with check (false);

create policy "deny public submissions access" on public.submissions
  as restrictive for all to anon, authenticated
  using (false) with check (false);
