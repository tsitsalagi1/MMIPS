-- Already applied to production on 2026-08-08; restored from Supabase migration history.

alter table public.case_verifications
  add constraint case_verifications_source_url_length_check
  check (source_url is null or length(source_url) <= 2048)
  not valid;

alter table public.case_verifications validate constraint case_verifications_source_url_length_check;

alter table public.case_verifications
  add constraint case_verifications_public_source_https_check
  check (is_public = false or (source_url is not null and source_url ~ '^https://'))
  not valid;

alter table public.case_verifications validate constraint case_verifications_public_source_https_check;
