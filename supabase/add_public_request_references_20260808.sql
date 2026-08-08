-- MMIPS public request reference codes, 2026-08-08.
-- Applied to production through the approved Supabase migration workflow on 2026-08-08.
-- These opaque references are user-facing tracking labels only. They are not authentication credentials.

alter table public.submissions add column if not exists public_reference text;
update public.submissions
set public_reference = 'MMIPS-' || upper(substr(md5(id::text || clock_timestamp()::text || random()::text), 1, 16))
where public_reference is null;
alter table public.submissions alter column public_reference set default ('MMIPS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)));
alter table public.submissions alter column public_reference set not null;
create unique index if not exists submissions_public_reference_uidx on public.submissions(public_reference);

alter table public.correction_requests add column if not exists public_reference text;
update public.correction_requests
set public_reference = 'MMIPS-C-' || upper(substr(md5(id::text || clock_timestamp()::text || random()::text), 1, 16))
where public_reference is null;
alter table public.correction_requests alter column public_reference set default ('MMIPS-C-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)));
alter table public.correction_requests alter column public_reference set not null;
create unique index if not exists correction_requests_public_reference_uidx on public.correction_requests(public_reference);
