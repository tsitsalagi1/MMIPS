-- Already applied to production on 2026-08-08; restored from Supabase migration history.

alter table public.submissions
  add constraint submissions_profile_type_check
  check (profile_type is null or profile_type in ('urgent_missing','missing','murdered_info_needed','unidentified'))
  not valid;
alter table public.submissions validate constraint submissions_profile_type_check;

alter table public.submissions
  add constraint submissions_urgency_level_check
  check (urgency_level is null or urgency_level in ('standard','urgent_public_awareness','renewed_visibility'))
  not valid;
alter table public.submissions validate constraint submissions_urgency_level_check;

alter table public.submissions
  add constraint submissions_relationship_check
  check (relationship is null or relationship in ('family','authorized_advocate','legal_representative','tribal_representative','law_enforcement','other'))
  not valid;
alter table public.submissions validate constraint submissions_relationship_check;

alter table public.correction_requests
  add constraint correction_requests_type_check
  check (request_type in ('correction','removal','unsafe_location','consent_question','updated_tip_contact','other'))
  not valid;
alter table public.correction_requests validate constraint correction_requests_type_check;

alter table public.correction_requests
  add constraint correction_requests_relationship_check
  check (relationship in ('family','authorized_advocate','legal_representative','tribal_representative','law_enforcement','official_contact','other'))
  not valid;
alter table public.correction_requests validate constraint correction_requests_relationship_check;
