# MMIPS Storage Configuration Runbook

Status: **static runbook only — steps not performed in this Codex task**.

Supabase Storage bucket metadata is service-managed. Do not manage `storage.buckets` by direct application migration `INSERT`, `UPDATE`, or `DELETE`. Bucket creation and configuration must be performed through the approved Supabase Storage API, Supabase dashboard, or another reviewed operational process with synthetic staging verification before production launch.

## Required buckets

### `mmips-submission-photos`

- Visibility: private.
- Purpose: pending-review family/authorized submitter photo uploads.
- Public reads: prohibited.
- Direct anonymous/authenticated browser writes: prohibited.
- Expected server behavior: server-only service-role routes upload generated object paths after validation; admin routes create short-lived signed URLs only for authenticated allowlisted moderators.
- Allowed Version 1 MIME types: `image/jpeg`, `image/png`, `image/webp`.
- Size limit: 5 MB per object.

### `mmips-public-case-photos`

- Visibility: public only for moderator-approved copied objects.
- Purpose: public profile/flyer/share images after human moderation and approval.
- Public reads: allowed only for objects copied during moderator publication.
- Direct anonymous/authenticated writes: prohibited.
- Expected server behavior: admin publication route copies validated private objects to generated public paths with `upsert: false`.
- Allowed Version 1 MIME types: `image/jpeg`, `image/png`, `image/webp`.
- Size limit: 5 MB per object.

## Configuration process

1. Use a separate synthetic staging Supabase project; never use production data or production credentials in Codex.
2. Create or update `mmips-submission-photos` through the Supabase Storage API or dashboard as a private bucket with the MIME and size limits above.
3. Create or update `mmips-public-case-photos` through the Supabase Storage API or dashboard as the public approved-assets bucket with the MIME and size limits above.
4. Review storage object policies so anonymous and ordinary authenticated users cannot list, upload, update, delete, or read pending-review objects.
5. Review storage object policies so anonymous users can read only approved public objects and cannot write to either bucket.
6. Record the human operator, environment, date, and verification evidence outside source control without secrets or private data.

## Synthetic verification checklist

These checks require an isolated synthetic staging Supabase project and were **not performed** in this Codex task.

- Anonymous user cannot list `mmips-submission-photos`.
- Anonymous user cannot read a guessed object path in `mmips-submission-photos`.
- Anonymous user cannot upload, update, overwrite, or delete objects in `mmips-submission-photos`.
- Ordinary authenticated non-admin user cannot list/read/write/delete objects in `mmips-submission-photos`.
- Server-only service role can upload a synthetic pending JPEG/PNG/WebP object with a generated path.
- Allowlisted admin route can create a short-lived signed URL for the synthetic pending object.
- Anonymous user cannot write to `mmips-public-case-photos`.
- Moderator publication copies a synthetic approved object to `mmips-public-case-photos` with `upsert: false`.
- Anonymous user can read the approved public copied object.
- Anonymous user cannot use guessed paths to read non-existent, pending, rejected, or private objects.
- Removed/hidden profile workflow prevents future public discovery and triggers cache/storage cleanup procedures.

## Upload security limitations

Magic-byte validation is one defensive control. It is not proof that an image is safe. Version 1 launch remains blocked until a reviewed image-processing pipeline covers secure decoding, frame and dimension limits, pixel-count limits, re-encoding, EXIF/metadata stripping, decompression-bomb protection, and malware or sandbox scanning where appropriate. GIF is intentionally excluded from Version 1 until those controls exist.
