import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const required = [
  'supabase/least_privilege_public_read_tables_20260808.sql',
  'supabase/restrict_public_case_columns_20260808.sql',
  'supabase/enforce_safe_publication_state_20260808.sql',
  'supabase/constrain_case_ages_20260808.sql',
  'supabase/constrain_case_profile_and_urgency_20260808.sql',
  'supabase/constrain_public_source_urls_20260808.sql',
  'supabase/constrain_intake_categories_20260808.sql',
  'supabase/lock_real_submission_inserts_until_launch_20260808.sql'
];

test('production hardening migrations audited on 2026-08-08 are recorded in source control', () => {
  for (const path of required) assert.equal(fs.existsSync(path), true, `${path} must exist`);
});

test('recorded publication hardening preserves the critical database invariants', () => {
  const publication = fs.readFileSync('supabase/enforce_safe_publication_state_20260808.sql', 'utf8');
  const columns = fs.readFileSync('supabase/restrict_public_case_columns_20260808.sql', 'utf8');
  assert.match(publication, /published_at is null or review_status = 'approved'/);
  assert.match(publication, /location_precision <> 'exact_private'/);
  assert.doesNotMatch(columns, /grant select \([^)]*latitude[^)]*\) on table public\.cases/is);
  assert.doesNotMatch(columns, /grant select \([^)]*longitude[^)]*\) on table public\.cases/is);
});
