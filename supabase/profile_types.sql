-- MMIPS profile types + urgent public-awareness planning migration.
-- Run this once in Supabase SQL Editor after uploading the code update.

alter table submissions add column if not exists profile_type text not null default 'missing';
alter table submissions add column if not exists urgency_level text not null default 'standard';
alter table submissions add column if not exists last_known_datetime text;
alter table submissions add column if not exists last_known_time_zone text;
alter table submissions add column if not exists last_known_location_private text;
alter table submissions add column if not exists notification_area_requested text;
alter table submissions add column if not exists likely_travel_mode text;
alter table submissions add column if not exists possible_direction text;
alter table submissions add column if not exists vehicle_description text;
alter table submissions add column if not exists official_info_pending boolean not null default false;
alter table submissions add column if not exists official_report_contacted boolean not null default false;

alter table cases add column if not exists profile_type text not null default 'missing';
alter table cases add column if not exists urgency_level text not null default 'standard';
alter table cases add column if not exists last_known_datetime text;
alter table cases add column if not exists last_known_time_zone text;
alter table cases add column if not exists notification_area_requested text;
alter table cases add column if not exists likely_travel_mode text;
alter table cases add column if not exists possible_direction text;
alter table cases add column if not exists vehicle_description text;
alter table cases add column if not exists official_info_pending boolean not null default false;

-- Backfill profile_type for older rows based on current status.
update submissions set profile_type = 'murdered_info_needed' where status = 'murdered_unsolved' and (profile_type is null or profile_type = 'missing');
update submissions set profile_type = 'unidentified' where status = 'unidentified' and (profile_type is null or profile_type = 'missing');
update cases set profile_type = 'murdered_info_needed' where status = 'murdered_unsolved' and (profile_type is null or profile_type = 'missing');
update cases set profile_type = 'unidentified' where status = 'unidentified' and (profile_type is null or profile_type = 'missing');
