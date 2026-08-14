-- Canada moderation release guards discovered by the synthetic rehearsal.
-- Apply after 008_canada_urgent_alert_events.sql and only to the separate
-- Canadian Supabase project.

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
  current_status review_status;
  next_status review_status;
  linked_case_id uuid;
  clean_reason text := nullif(btrim(target_reason), '');
begin
  if target_actor_id is null then raise exception 'Moderator identity is required'; end if;
  if clean_reason is null or length(clean_reason) < 12 then raise exception 'A moderation reason of at least 12 characters is required'; end if;
  if target_action not in ('needs_more_info','rejected','hidden','reopened') then raise exception 'Unsupported moderation action'; end if;

  select review_status into current_status
  from public.submissions
  where id = target_submission_id
  for update;
  if not found then raise exception 'Submission not found'; end if;

  if target_action in ('needs_more_info','rejected') and current_status not in ('pending_review'::review_status,'needs_more_info'::review_status) then
    raise exception 'That pre-publication decision is not valid for the current status';
  end if;
  if target_action = 'hidden' and current_status <> 'approved'::review_status then
    raise exception 'Only an approved publication may be hidden';
  end if;
  if target_action = 'reopened' and current_status not in ('needs_more_info'::review_status,'rejected'::review_status) then
    raise exception 'Only an information-needed or rejected submission may be reopened';
  end if;

  next_status := case target_action
    when 'needs_more_info' then 'needs_more_info'::review_status
    when 'rejected' then 'rejected'::review_status
    when 'hidden' then 'hidden'::review_status
    else 'pending_review'::review_status
  end;

  if target_action = 'hidden' then
    select d.case_id into linked_case_id
    from public.canada_moderation_decisions d
    where d.submission_id = target_submission_id
      and d.action = 'approved'
      and d.case_id is not null
    order by d.created_at desc
    limit 1;
    if linked_case_id is null then raise exception 'Approved case link not found'; end if;

    update public.cases
    set review_status = 'hidden'::review_status,
        published_at = null,
        public_profile_enabled = false,
        public_map_enabled = false,
        updated_at = now()
    where id = linked_case_id;
    update public.public_case_map_points
    set moderator_approved = false,
        hidden = true,
        updated_at = now()
    where case_id = linked_case_id;
    perform public.refresh_canada_public_case(linked_case_id);
  end if;

  update public.submissions
  set review_status = next_status,
      moderator_notes = clean_reason,
      decision_at = now(),
      decision_by = target_actor_id,
      source_ip = null
  where id = target_submission_id;

  insert into public.canada_moderation_decisions(submission_id, case_id, actor_id, action, reason)
  values (target_submission_id, linked_case_id, target_actor_id, target_action, clean_reason);
  insert into public.audit_log(actor_id, action, entity_type, entity_id, reason, metadata)
  values (
    target_actor_id,
    'canada_submission_' || target_action,
    'submission',
    target_submission_id,
    clean_reason,
    case when linked_case_id is null then '{}'::jsonb else jsonb_build_object('case_id', linked_case_id) end
  );
end;
$$;
revoke all on function public.review_canada_submission(uuid,text,text,uuid) from public, anon, authenticated;
grant execute on function public.review_canada_submission(uuid,text,text,uuid) to service_role;

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
  clean_reason text := nullif(btrim(target_reason), '');
begin
  if target_actor_id is null then raise exception 'Moderator identity is required'; end if;
  if clean_reason is null or length(clean_reason) < 12 then raise exception 'An approval reason of at least 12 characters is required'; end if;
  select * into s from public.submissions where id = target_submission_id for update;
  if not found then raise exception 'Submission not found'; end if;
  if s.review_status not in ('pending_review'::review_status,'needs_more_info'::review_status) then raise exception 'Submission is not eligible for approval'; end if;
  if s.consent_at is null or nullif(btrim(s.consent_text), '') is null or nullif(btrim(s.consent_version), '') is null then raise exception 'Recorded publication consent is required'; end if;
  if s.publication_requested is not true then raise exception 'The submitter did not request profile publication'; end if;
  if nullif(btrim(s.official_tip_contact), '') is null then raise exception 'An official tip or reporting contact is required'; end if;
  if coalesce(target_publish_map, false) or target_public_latitude is not null or target_public_longitude is not null then
    raise exception 'Public map approval is a separate moderated action';
  end if;
  if target_slug is null or target_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'Invalid public slug'; end if;
  if target_public_summary is null or length(btrim(target_public_summary)) < 20 then raise exception 'Public summary is too short'; end if;
  if target_public_area is null or length(btrim(target_public_area)) < 3 then raise exception 'Public area is required'; end if;

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
    now(), s.synthetic, true, false
  ) returning id into new_case_id;

  insert into public.person_indigenous_affiliations(
    person_id, affiliation_type, preferred_people_or_nation_name, preferred_community_name,
    inuit_region, metis_government_or_community, permission_to_publish
  )
  select new_person_id, affiliation_type, preferred_people_or_nation_name, preferred_community_name,
         inuit_region, metis_government_or_community, permission_to_publish
  from public.submission_indigenous_affiliations
  where submission_id = target_submission_id and permission_to_publish = true;

  update public.submissions
  set review_status = 'approved'::review_status,
      moderator_notes = clean_reason,
      decision_at = now(),
      decision_by = target_actor_id,
      source_ip = null
  where id = target_submission_id;

  insert into public.canada_moderation_decisions(
    submission_id, case_id, actor_id, action, reason, public_summary_snapshot, public_area_snapshot, map_enabled
  ) values (
    target_submission_id, new_case_id, target_actor_id, 'approved', clean_reason,
    btrim(target_public_summary), btrim(target_public_area), false
  );
  insert into public.audit_log(actor_id, action, entity_type, entity_id, reason, metadata)
  values (
    target_actor_id, 'canada_submission_approved', 'submission', target_submission_id,
    clean_reason, jsonb_build_object('case_id', new_case_id, 'map_enabled', false)
  );

  perform public.refresh_canada_public_case(new_case_id);
  return new_case_id;
end;
$$;
revoke all on function public.approve_canada_submission(uuid,text,text,text,numeric,numeric,boolean,uuid,text) from public, anon, authenticated;
grant execute on function public.approve_canada_submission(uuid,text,text,text,numeric,numeric,boolean,uuid,text) to service_role;

create or replace function public.approve_canada_submission_map(
  target_submission_id uuid,
  target_public_area text,
  target_public_latitude numeric,
  target_public_longitude numeric,
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
  linked_case_id uuid;
  point_id uuid;
  clean_reason text := nullif(btrim(target_reason), '');
begin
  if target_actor_id is null then raise exception 'Moderator identity is required'; end if;
  if clean_reason is null or length(clean_reason) < 12 then raise exception 'A map-safety reason of at least 12 characters is required'; end if;
  select * into s from public.submissions where id = target_submission_id for update;
  if not found then raise exception 'Submission not found'; end if;
  if s.review_status <> 'approved'::review_status then raise exception 'The public profile must be approved first'; end if;
  if s.map_requested is not true then raise exception 'The submitter did not request map publication'; end if;
  if s.consent_at is null or nullif(btrim(s.consent_text), '') is null or nullif(btrim(s.consent_version), '') is null then raise exception 'Recorded publication consent is required'; end if;
  if target_public_area is null or length(btrim(target_public_area)) < 3 then raise exception 'Public area is required'; end if;
  if target_public_latitude is null or target_public_latitude not between -90 and 90 then raise exception 'Latitude out of bounds'; end if;
  if target_public_longitude is null or target_public_longitude not between -180 and 180 then raise exception 'Longitude out of bounds'; end if;

  select d.case_id into linked_case_id
  from public.canada_moderation_decisions d
  where d.submission_id = target_submission_id
    and d.action = 'approved'
    and d.case_id is not null
  order by d.created_at desc
  limit 1;
  if linked_case_id is null then raise exception 'Approved case link not found'; end if;
  if not exists (
    select 1 from public.cases c
    where c.id = linked_case_id
      and c.review_status = 'approved'::review_status
      and c.published_at is not null
  ) then raise exception 'The public profile is not currently published'; end if;

  insert into public.public_case_map_points(
    case_id, public_latitude, public_longitude, public_area_label,
    province_territory, moderator_approved, hidden
  ) values (
    linked_case_id, round(target_public_latitude, 2), round(target_public_longitude, 2),
    btrim(target_public_area), s.last_seen_province_territory, true, false
  )
  on conflict (case_id) do update set
    public_latitude = excluded.public_latitude,
    public_longitude = excluded.public_longitude,
    public_area_label = excluded.public_area_label,
    province_territory = excluded.province_territory,
    moderator_approved = true,
    hidden = false,
    updated_at = now()
  returning id into point_id;

  update public.cases set public_map_enabled = true, updated_at = now() where id = linked_case_id;
  insert into public.audit_log(actor_id, action, entity_type, entity_id, reason, metadata)
  values (
    target_actor_id, 'canada_public_map_approved', 'public_case_map_points', point_id,
    clean_reason,
    jsonb_build_object('case_id', linked_case_id, 'public_area_label', btrim(target_public_area), 'coordinate_rounding', '2_decimals')
  );
  perform public.refresh_canada_public_case(linked_case_id);
  return point_id;
end;
$$;
revoke all on function public.approve_canada_submission_map(uuid,text,numeric,numeric,uuid,text) from public, anon, authenticated;
grant execute on function public.approve_canada_submission_map(uuid,text,numeric,numeric,uuid,text) to service_role;

-- Rollback/forward-fix: do not restore the permissive functions from 005.
-- Disable Canada moderation routes and apply a reviewed forward migration.
