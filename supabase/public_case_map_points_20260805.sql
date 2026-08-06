-- MMIPS public map points forward migration, 2026-08-05.
-- STATIC REVIEW ONLY — NOT EXECUTED.
-- Apply after supabase/security_hardening_20260805.sql in an isolated synthetic staging Supabase project only.

create type public_map_precision as enum ('state', 'broad_region', 'tribal_region', 'county', 'city_centroid');

create table if not exists public_case_map_points (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid not null references cases(id) on delete cascade,
  public_label text not null,
  public_latitude numeric(8,5) not null,
  public_longitude numeric(8,5) not null,
  precision public_map_precision not null,
  region_type text not null,
  moderator_approved boolean not null default false,
  safety_reviewed_at timestamptz,
  approved_by uuid,
  public_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  hidden_at timestamptz,
  constraint public_case_map_points_lat_range check (public_latitude between -90 and 90),
  constraint public_case_map_points_lon_range check (public_longitude between -180 and 180),
  constraint public_case_map_points_review_requires_approval check ((moderator_approved = false) or (safety_reviewed_at is not null)),
  constraint public_case_map_points_notes_length check (public_notes is null or length(public_notes) <= 500)
);

create unique index if not exists public_case_map_points_one_active_per_case
  on public_case_map_points(case_id)
  where hidden_at is null;

create index if not exists public_case_map_points_public_read_idx
  on public_case_map_points(moderator_approved, hidden_at, precision, updated_at desc);

alter table public_case_map_points enable row level security;

revoke all on public_case_map_points from anon, authenticated;
grant select (case_id, public_label, public_latitude, public_longitude, precision, region_type, public_notes, updated_at) on public_case_map_points to anon, authenticated;

create policy "anon_read_approved_public_map_points" on public_case_map_points
  for select to anon
  using (
    moderator_approved = true
    and hidden_at is null
    and exists (
      select 1 from cases
      where cases.id = public_case_map_points.case_id
        and cases.review_status = 'approved'
        and cases.published_at is not null
    )
  );

create policy "authenticated_read_approved_public_map_points" on public_case_map_points
  for select to authenticated
  using (
    moderator_approved = true
    and hidden_at is null
    and exists (
      select 1 from cases
      where cases.id = public_case_map_points.case_id
        and cases.review_status = 'approved'
        and cases.published_at is not null
    )
  );

-- No anon/authenticated INSERT, UPDATE, or DELETE policies are defined. Moderator workflows must use reviewed server-side service-role routes.

-- Static verification queries:
-- select tablename, rowsecurity from pg_tables where tablename = 'public_case_map_points';
-- select grantee, privilege_type, column_name from information_schema.column_privileges where table_name = 'public_case_map_points' order by grantee, privilege_type, column_name;
-- select policyname, roles, cmd, qual, with_check from pg_policies where tablename = 'public_case_map_points';
-- select indexname, indexdef from pg_indexes where tablename = 'public_case_map_points';
-- Isolated staging plan: use synthetic cases only; verify anon reads only approved visible points connected to approved published cases and cannot read approved_by/safety_reviewed_at.
-- Rollback/forward-fix: do not disable RLS. Hide unsafe points with hidden_at or add narrower policies in a new reviewed forward migration. To abandon before launch, drop policies and table in isolated staging only.
