-- Already applied to production on 2026-08-08; restored from Supabase migration history.

alter table public.cases
  add constraint cases_profile_type_check
  check (profile_type is null or profile_type in ('urgent_missing','missing','murdered_info_needed','unidentified','located'))
  not valid;

alter table public.cases validate constraint cases_profile_type_check;

alter table public.cases
  add constraint cases_urgency_level_check
  check (urgency_level is null or urgency_level in ('standard','urgent_public_awareness','renewed_visibility','status_update'))
  not valid;

alter table public.cases validate constraint cases_urgency_level_check;
