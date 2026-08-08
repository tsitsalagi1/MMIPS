-- Already applied to production on 2026-08-08; restored from Supabase migration history.

revoke insert, update, delete, truncate, references, trigger on table public.cases from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.persons from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.case_events from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on table public.profile_photos from anon, authenticated;

grant select on table public.cases to anon, authenticated;
grant select on table public.persons to anon, authenticated;
grant select on table public.case_events to anon, authenticated;
grant select on table public.profile_photos to anon, authenticated;
