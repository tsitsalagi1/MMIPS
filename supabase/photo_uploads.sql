-- MMIPS photo/flyer upload migration. Run this in Supabase SQL Editor after uploading the code update.

alter table submissions add column if not exists photo_storage_path text;
alter table submissions add column if not exists photo_original_name text;
alter table submissions add column if not exists photo_content_type text;
alter table submissions add column if not exists photo_size int;
alter table submissions add column if not exists photo_alt_text text;
alter table submissions add column if not exists photo_permission_confirmed boolean not null default false;

alter table cases add column if not exists photo_storage_path text;
alter table cases add column if not exists photo_alt_text text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mmips-submission-photos',
  'mmips-submission-photos',
  false,
  5242880,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mmips-public-case-photos',
  'mmips-public-case-photos',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];
