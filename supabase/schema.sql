-- MMIPS starter schema for Supabase/PostgreSQL.
-- Run in a new Supabase SQL editor. Review with counsel/security before public launch.

create extension if not exists "uuid-ossp";

create type case_status as enum ('missing', 'murdered_unsolved', 'unidentified', 'resolved', 'unknown');
create type review_status as enum ('pending_review', 'needs_more_info', 'approved', 'rejected', 'hidden');
create type location_precision as enum ('exact_private', 'approximate', 'city', 'county', 'hidden');

create table if not exists submissions (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  review_status review_status not null default 'pending_review',
  full_name text not null,
  age int,
  status case_status not null default 'unknown',
  tribal_affiliation text,
  last_seen_date date,
  last_seen_location text not null,
  lead_agency text,
  agency_case_number text,
  namus_number text,
  tip_contact text,
  summary text not null,
  submitter_name text not null,
  submitter_email text not null,
  submitter_phone text,
  relationship text not null,
  moderator_notes text,
  source_ip inet
);

create table if not exists persons (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  full_name text not null,
  age int,
  tribal_affiliation text,
  public_notes text
);

create table if not exists cases (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  person_id uuid references persons(id) on delete cascade,
  slug text unique not null,
  status case_status not null default 'unknown',
  review_status review_status not null default 'pending_review',
  public_summary text not null,
  last_seen_date date,
  last_seen_city text,
  last_seen_county text,
  last_seen_state text,
  last_seen_area_public text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  location_precision location_precision not null default 'city',
  lead_agency text,
  agency_case_number text,
  namus_number text,
  ncic_status text default 'unknown',
  tribe_notified text default 'unknown',
  family_liaison text default 'unknown',
  official_tip_contact text,
  last_public_update date,
  published_at timestamptz
);

create table if not exists case_verifications (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid references cases(id) on delete cascade,
  created_at timestamptz not null default now(),
  verification_type text not null,
  source_label text,
  source_url text,
  notes text,
  is_public boolean not null default false
);

create table if not exists case_events (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid references cases(id) on delete cascade,
  created_at timestamptz not null default now(),
  event_date date,
  title text not null,
  description text,
  is_public boolean not null default false
);

create table if not exists correction_requests (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  case_id uuid references cases(id) on delete set null,
  requester_name text not null,
  requester_email text not null,
  relationship text not null,
  request_type text not null,
  request_details text not null,
  review_status review_status not null default 'pending_review'
);

create table if not exists alert_subscribers (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  email text,
  phone text,
  consent_source text not null,
  consent_text text not null,
  consent_at timestamptz not null default now(),
  opt_out_at timestamptz,
  preferred_area text,
  email_enabled boolean not null default true,
  sms_enabled boolean not null default false
);

create table if not exists alerts_sent (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  case_id uuid references cases(id) on delete set null,
  channel text not null,
  recipient_hash text not null,
  message text not null,
  provider_message_id text,
  status text not null default 'queued'
);

create table if not exists audit_log (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  reason text,
  metadata jsonb default '{}'::jsonb
);

alter table submissions enable row level security;
alter table persons enable row level security;
alter table cases enable row level security;
alter table case_verifications enable row level security;
alter table case_events enable row level security;
alter table correction_requests enable row level security;
alter table alert_subscribers enable row level security;
alter table alerts_sent enable row level security;
alter table audit_log enable row level security;

-- Public can read approved/published cases only.
create policy "public_read_published_cases" on cases for select using (review_status = 'approved' and published_at is not null);
create policy "public_read_persons_for_published_cases" on persons for select using (
  exists (select 1 from cases where cases.person_id = persons.id and cases.review_status = 'approved' and cases.published_at is not null)
);
create policy "public_read_public_verifications" on case_verifications for select using (
  is_public = true and exists (select 1 from cases where cases.id = case_verifications.case_id and cases.review_status = 'approved' and cases.published_at is not null)
);
create policy "public_read_public_events" on case_events for select using (
  is_public = true and exists (select 1 from cases where cases.id = case_events.case_id and cases.review_status = 'approved' and cases.published_at is not null)
);

-- Inserts should go through server routes using the service-role key, not public anonymous insert.
-- Do not expose service-role keys in browser code.
