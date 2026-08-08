-- Already applied to production on 2026-08-08; restored from Supabase migration history.

alter table public.cases
  add constraint cases_published_requires_approved
  check (published_at is null or review_status = 'approved')
  not valid;

alter table public.cases
  validate constraint cases_published_requires_approved;

alter table public.cases
  add constraint cases_published_forbids_exact_private_location
  check (published_at is null or location_precision <> 'exact_private')
  not valid;

alter table public.cases
  validate constraint cases_published_forbids_exact_private_location;
