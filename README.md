# MMIPS admin profile status/type editor fix

Upload these changed files into the GitHub repo root and commit.

Adds an admin-only published profile editor that can update live public profile status/type after publication:

- urgent missing -> standard missing
- missing -> remembering / information needed
- located / resolved update
- direct edits to profile type, urgency level, status, public text, official contacts, and notification planning fields

New files:

- app/api/admin/profiles/route.ts
- app/api/admin/profiles/[id]/route.ts

Updated file:

- app/admin/AdminDashboard.tsx

No new Supabase migration is needed beyond the profile_types.sql and multiple_photos.sql migrations already provided.

After deployment, open `/admin`, find the new "Published profile status/type editor" section, and use the quick transition buttons or manual dropdowns. Status/type updates are written to `cases`/`persons` and logged in `audit_log`.

## Admin quick lookup + family resources update

This update improves reviewer workflow and family-facing resources.

### Admin improvements

- Adds quick search fields for submissions, correction/removal requests, and published profiles.
- Published profile search can look up a profile by name, slug, city/location text, Tribe, agency, report/case number, NamUs number, notification area, or official contact.
- Submission search can find names, submitter emails, agencies, NamUs numbers, notification areas, and summary text.
- Correction/removal search can find requester name/email and request details.

No new Supabase migration is required for this update.

### Resources page improvements

- Adds a family-first checklist for what to do when someone is missing.
- Adds official resource links for 911, NamUs, BIA MMU, FBI tips, NCMEC, and StrongHearts Native Helpline.
- Clarifies that MMIPS does not collect investigative tips.
