# MMIPS photo/flyer upload update

Upload these changed files into the GitHub repo root and commit.

Before testing uploads, run `supabase/photo_uploads.sql` in Supabase SQL Editor. It adds photo metadata columns and creates two Storage buckets:

- `mmips-submission-photos` — private pending-review uploads.
- `mmips-public-case-photos` — public images copied here only when an admin approves/publishes a case.

Then redeploy Vercel and test with a fake case and one small JPG/PNG/WebP/GIF image under 5 MB.

Safety behavior:

- Users can submit one optional image/flyer.
- The image stays private while the submission is pending.
- Admins see a temporary signed preview in `/admin`.
- On `Approve + publish`, the image is copied into the public bucket and shown on the public case card/page.
- Image permission confirmation is required if a file is uploaded.
