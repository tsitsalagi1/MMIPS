-- Already applied to production on 2026-08-08; restored from Supabase migration history.

alter table public.persons
  add constraint persons_age_reasonable_check
  check (age is null or age between 0 and 130)
  not valid;

alter table public.persons validate constraint persons_age_reasonable_check;

alter table public.submissions
  add constraint submissions_age_reasonable_check
  check (age is null or age between 0 and 130)
  not valid;

alter table public.submissions validate constraint submissions_age_reasonable_check;
