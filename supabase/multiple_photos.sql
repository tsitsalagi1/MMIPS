-- MMIPS multiple photo/gallery migration.
-- Run once in Supabase SQL Editor after uploading this update.

create table if not exists submission_photos (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  storage_path text not null,
  original_name text,
  content_type text,
  size_bytes int,
  alt_text text,
  caption text,
  photo_type text not null default 'other',
  use_on_profile boolean not null default true,
  use_on_flyer boolean not null default true,
  is_main boolean not null default false,
  sort_order int not null default 0,
  permission_confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists submission_photos_submission_id_idx on submission_photos(submission_id);
create index if not exists submission_photos_sort_idx on submission_photos(submission_id, sort_order);

alter table submission_photos enable row level security;

drop policy if exists "Admins only submission photos" on submission_photos;
create policy "Admins only submission photos"
  on submission_photos
  for all
  using (false)
  with check (false);

create table if not exists profile_photos (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  storage_path text not null,
  original_name text,
  content_type text,
  size_bytes int,
  alt_text text,
  caption text,
  photo_type text not null default 'other',
  use_on_profile boolean not null default true,
  use_on_flyer boolean not null default true,
  is_main boolean not null default false,
  sort_order int not null default 0,
  permission_confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists profile_photos_case_id_idx on profile_photos(case_id);
create index if not exists profile_photos_sort_idx on profile_photos(case_id, sort_order);

alter table profile_photos enable row level security;

drop policy if exists "Public can read approved public profile photos" on profile_photos;
create policy "Public can read approved public profile photos"
  on profile_photos
  for select
  using (
    use_on_profile = true
    and exists (
      select 1 from cases
      where cases.id = profile_photos.case_id
        and cases.review_status = 'approved'
        and cases.published_at is not null
    )
  );

-- Keep the older single-photo columns in place for backward compatibility.
-- New submissions also fill the older main-photo fields so older UI still degrades safely.
