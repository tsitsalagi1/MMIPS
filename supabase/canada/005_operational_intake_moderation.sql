-- MMIPS Canada operational intake + moderation foundation.
-- Apply only to the separate Canadian Supabase project.
-- Real intake remains release-controlled at the application layer until the
-- Canadian privacy/security rehearsal is complete.

alter table public.submissions
  add column if not exists public_reference text unique,
  add column if not exists official_tip_contact text,
  add column if not exists authority_basis text,
  add column if not exists consent_version text not null default '2026-08-12-v1',
  add column if not exists publication_requested boolean not null default true,
  add column if not exists map_requested boolean not null default true,
  add column if not exists last_seen_area_public_proposed text,
  add column if not exists public_latitude_proposed numeric(10,7),
  add column if not exists public_longitude_proposed numeric(10,7),
  add column if not exists decision_at timestamptz,
  add column if not exists decision_by uuid,
  add constraint submissions_public_latitude_bounds check (public_latitude_proposed is null or public_latitude_proposed between -90 and 90),
  add constraint submissions_public_longitude_bounds check (public_longitude_proposed is null or public_longitude_proposed between -180 and 180);

create or replace function public.set_canada_submission_reference()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.public_reference is null or btrim(new.public_reference) = '' then
    new.public_reference := 'CA-' || to_char(current_date, 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  end if;
  return new;
end;
$$;

drop trigger if exists submissions_set_canada_reference on public.submissions;
create trigger submissions_set_canada_reference
before insert on public.submissions
for each row execute function public.set_canada_submission_reference();

update public.submissions
set public_reference = 'CA-' || to_char(created_at, 'YYYY') || '-' || upper(substr(replace(id::text, '-', ''), 1, 8))
where public_reference is null;

create table if not exists public.submission_photos (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  storage_path text not null unique,
  original_name text,
  content_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  alt_text text,
  caption text,
  is_main boolean not null default false,
  sort_order integer not null default 0,
  permission_confirmed boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists canada_submission_photos_submission_idx on public.submission_photos(submission_id, sort_order);
alter table public.submission_photos enable row level security;
alter table public.submission_photos force row level security;
revoke all on public.submission_photos from public, anon, authenticated;

create table if not exists public.canada_moderation_decisions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  case_id uuid references public.cases(id) on delete set null,
  actor_id uuid,
  action text not null check (action in ('needs_more_info','rejected','approved','hidden','reopened')),
  reason text,
  public_summary_snapshot text,
  public_area_snapshot text,
  map_enabled boolean,
  created_at timestamptz not null default now()
);
create index if not exists canada_moderation_decisions_submission_idx on public.canada_moderation_decisions(submission_id, created_at desc);
alter table public.canada_moderation_decisions enable row level security;
alter table public.canada_moderation_decisions force row level security;
revoke all on public.canada_moderation_decisions from public, anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mmips-canada-submission-photos', 'mmips-canada-submission-photos', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.review_canada_submission(
  target_submission_id uuid,
  target_action text,
  target_reason text,
  target_actor_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  next_status review_status;
begin
  if target_action not in ('needs_more_info','rejected','hidden','reopened') then
    raise exception 'Unsupported moderation action';
  end if;
  next_status := case target_action
    when 'needs_more_info' then 'needs_more_info'::review_status
    when 'rejected' then 'rejected'::review_status
    when 'hidden' then 'hidden'::review_status
    else 'pending_review'::review_status
  end;

  update public.submissions
  set review_status = next_status,
      moderator_notes = nullif(btrim(target_reason), ''),
      decision_at = now(),
      decision_by = target_actor_id,
      source_ip = null
  where id = target_submission_id;
  if not found then raise exception 'Submission not found'; end if;

  insert into public.canada_moderation_decisions(submission_id, actor_id, action, reason)
  values (target_submission_id, target_actor_id, target_action, nullif(btrim(target_reason), ''));
  insert into public.audit_log(actor_id, action, entity_type, entity_id, reason)
  values (target_actor_id, 'canada_submission_' || target_action, 'submission', target_submission_id, nullif(btrim(target_reason), ''));
end;
$$;
revoke all on function public.review_canada_submission(uuid,text,text,uuid) from public, anon, authenticated;

create or replace function public.approve_canada_submission(
  target_submission_id uuid,
  target_slug text,
  target_public_summary text,
  target_public_area text,
  target_public_latitude numeric,
  target_public_longitude numeric,
  target_publish_map boolean,
  target_actor_id uuid,
  target_reason text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  s public.submissions%rowtype;
  new_person_id uuid;
  new_case_id uuid;
begin
  select * into s from public.submissions where id = target_submission_id for update;
  if not found then raise exception 'Submission not found'; end if;
  if s.review_status not in ('pending_review'::review_status, 'needs_more_info'::review_status) then raise exception 'Submission is not eligible for approval'; end if;
  if target_slug is null or target_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'Invalid public slug'; end if;
  if target_public_summary is null or length(btrim(target_public_summary)) < 20 then raise exception 'Public summary is too short'; end if;
  if target_public_area is null or length(btrim(target_public_area)) < 3 then raise exception 'Public area is required'; end if;
  if target_publish_map and (target_public_latitude is null or target_public_longitude is null) then raise exception 'Map coordinates are required when map publication is enabled'; end if;
  if target_public_latitude is not null and target_public_latitude not between -90 and 90 then raise exception 'Latitude out of bounds'; end if;
  if target_public_longitude is not null and target_public_longitude not between -180 and 180 then raise exception 'Longitude out of bounds'; end if;

  insert into public.persons(full_name, age, public_notes)
  values (s.full_name, s.age, null)
  returning id into new_person_id;

  insert into public.cases(
    person_id, slug, status, review_status, public_summary, last_seen_date,
    last_seen_locality, last_seen_province_territory, last_seen_area_public,
    location_precision, lead_police_service, official_tip_contact, last_public_update,
    published_at, synthetic, public_profile_enabled, public_map_enabled
  ) values (
    new_person_id, target_slug, s.status, 'approved'::review_status, btrim(target_public_summary), s.last_seen_date,
    s.last_seen_locality, s.last_seen_province_territory, btrim(target_public_area),
    'locality'::location_precision, s.lead_police_service, s.official_tip_contact, current_date,
    now(), s.synthetic, true, coalesce(target_publish_map, false)
  ) returning id into new_case_id;

  insert into public.person_indigenous_affiliations(
    person_id, affiliation_type, preferred_people_or_nation_name, preferred_community_name,
    inuit_region, metis_government_or_community, permission_to_publish
  )
  select new_person_id, affiliation_type, preferred_people_or_nation_name, preferred_community_name,
         inuit_region, metis_government_or_community, permission_to_publish
  from public.submission_indigenous_affiliations
  where submission_id = target_submission_id and permission_to_publish = true;

  if coalesce(target_publish_map, false) then
    insert into public.public_case_map_points(
      case_id, public_latitude, public_longitude, public_area_label,
      province_territory, moderator_approved, hidden
    ) values (
      new_case_id, target_public_latitude, target_public_longitude, btrim(target_public_area),
      s.last_seen_province_territory, true, false
    );
  end if;

  update public.submissions
  set review_status = 'approved'::review_status,
      moderator_notes = nullif(btrim(target_reason), ''),
      decision_at = now(),
      decision_by = target_actor_id,
      source_ip = null
  where id = target_submission_id;

  insert into public.canada_moderation_decisions(
    submission_id, case_id, actor_id, action, reason, public_summary_snapshot, public_area_snapshot, map_enabled
  ) values (
    target_submission_id, new_case_id, target_actor_id, 'approved', nullif(btrim(target_reason), ''),
    btrim(target_public_summary), btrim(target_public_area), coalesce(target_publish_map, false)
  );
  insert into public.audit_log(actor_id, action, entity_type, entity_id, reason, metadata)
  values (
    target_actor_id, 'canada_submission_approved', 'submission', target_submission_id,
    nullif(btrim(target_reason), ''), jsonb_build_object('case_id', new_case_id, 'map_enabled', coalesce(target_publish_map, false))
  );

  perform public.refresh_canada_public_case(new_case_id);
  return new_case_id;
end;
$$;
revoke all on function public.approve_canada_submission(uuid,text,text,text,numeric,numeric,boolean,uuid,text) from public, anon, authenticated;
