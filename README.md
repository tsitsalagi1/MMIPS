# MMIPS Starter

MMIPS = Missing & Murdered Indigenous People Search.

This Next.js/Supabase project is a public-awareness and family-support layer. It is not law enforcement, does not collect or investigate tips, and does not replace 911, police reports, NamUs, NCIC, Tribal law enforcement, BIA MMU, FBI, or local authorities.

## This update adds

- Profile types:
  - urgent missing-person public awareness
  - standard missing-person public profile
  - murdered loved one / information-needed profile
  - unidentified person public profile
- Urgent submitter-entered public-awareness planning fields:
  - last known date/time
  - likely travel mode
  - possible direction
  - requested notification area
  - vehicle/public detail if safe and authorized
- Admin review display for urgent/map planning fields.
- Dynamic public profile and flyer tone by profile type.
- Map page categories for urgent missing, missing, murdered/information-needed, located/resolved, and unidentified.
- Stronger “MMIPS does not collect tips” wording.

## Required database migration

After uploading this code, run this in Supabase SQL Editor:

```text
supabase/profile_types.sql
```

Run the migration before testing new submissions, because the submit API writes new profile-type fields.

## Test checklist

1. Submit an urgent missing-person public-awareness request with fake data.
2. Confirm the urgent required checkboxes work.
3. Confirm the admin dashboard shows urgent planning fields.
4. Approve the fake profile.
5. Confirm the public profile and flyer show urgent public-awareness language.
6. Submit a murdered/information-needed fake profile.
7. Confirm the public profile/flyer use remembrance/information-needed language, not urgent missing language.
8. Check `/map` and confirm profile categories display.
9. Remove/delete all fake profiles before real use.

## Multiple photo + flyer-preview update

This update changes the submit form from one optional image to up to five family-approved photos/flyers. Submitters can label each photo, choose the main profile/flyer photo, select which photos can appear on the public profile and flyer, and preview a calm flyer-style layout before submission.

Run this migration before testing the feature:

```sql
supabase/multiple_photos.sql
```

What it adds:

- `submission_photos` private review table.
- `profile_photos` public approved-photo table.
- Up to five images per submission, max 5 MB each.
- Main-photo selection.
- Profile/flyer usage preferences.
- Submitter-side flyer preview.
- Admin photo-gallery review.
- Public profile gallery.
- Flyer collage layout using approved flyer photos.

The older single-photo fields stay in place for backward compatibility.
