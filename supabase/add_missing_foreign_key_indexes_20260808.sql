-- MMIPS foreign-key index maintenance, 2026-08-08.
-- Applied to production through the approved Supabase migration workflow on 2026-08-08.
-- Purpose: add covering indexes identified by the Supabase database linter.

create index if not exists alerts_sent_case_id_idx on public.alerts_sent(case_id);
create index if not exists case_events_case_id_idx on public.case_events(case_id);
create index if not exists case_verifications_case_id_idx on public.case_verifications(case_id);
create index if not exists cases_person_id_idx on public.cases(person_id);
create index if not exists correction_requests_case_id_idx on public.correction_requests(case_id);

-- Forward-fix/rollback note:
-- These indexes contain no new data and do not alter RLS or grants.
-- If an index must be removed later, drop only the specific named index after confirming query plans and foreign-key maintenance impact.
