# MMIPS Access-Control Matrix

Static audit date: 2026-08-05. Live Supabase/RLS/storage behavior was not executed.

## Database table matrix

Legend: Allow = intended through RLS/policy; Deny = intended denied; Server = service-role server-only; Owner = database owner/operator.

| Table | Data type | anon | authenticated ordinary user | authenticated admin | service role | owner/operator | Notes |
|---|---|---|---|---|---|---|---|
| submissions | Private pending intake | Deny all | Deny all | Server API read/update via service role | CRUD | CRUD | Contains requester contact, exact/private locations, notes, IPs, private photo refs. |
| submission_photos | Private pending photo metadata | Deny all | Deny all | Server API read/write via service role | CRUD | CRUD | New migration revokes anon/auth grants; pending bucket private. |
| correction_requests | Private requester/removal data | Deny all | Deny all | Server API read/update via service role | CRUD | CRUD | Public insert only through service route; non-enumerating public responses needed. |
| alert_subscribers | Private subscriber data | Deny all | Deny all | Server API only when Alerts implemented | CRUD | CRUD | Alerts not implemented; release blocker. |
| alerts_sent | Private alert delivery evidence | Deny all | Deny all | Server API only when Alerts implemented | CRUD | CRUD | Recipient hash only; message content still sensitive. |
| audit_log | Private moderation/security evidence | Deny all | Deny all | Server insert/read via service role | CRUD | CRUD | Append-only trigger not yet implemented/live-verified. |
| cases | Mixed public/private profile table | SELECT approved/published rows only | SELECT approved/published rows only | Server API read/update via service role | CRUD | CRUD | Mixed table can expose sensitive fields if direct anon select; public view recommended. |
| persons | Mixed public identity fields | SELECT only linked approved/published cases | Same | Server API read/update | CRUD | CRUD | Relationship with cases protects rows, not column-level fields. |
| case_verifications | Mixed verification/audit | SELECT public verification for approved cases | Same | Server API | CRUD | CRUD | Private notes must never be selected publicly. |
| case_events | Mixed event data | SELECT public events for approved cases | Same | Server API | CRUD | CRUD | Public flag required. |
| profile_photos | Public-approved photo metadata | SELECT `use_on_profile` linked approved cases | Same | Server API | CRUD | CRUD | Uses public bucket paths after moderator copy. |

## Storage bucket inventory

| Bucket | Public | Naming scheme | Upload | Read | Update/delete | Signed URLs | Publication process | Metadata | Orphan cleanup | Uncertainty |
|---|---|---|---|---|---|---|---|---|---|---|
| mmips-submission-photos | No | `submissions/{submissionId}/{sort}-{uuid}.{ext}` after fix | Server service-role only | Admin signed URL only | Service role only | Admin API creates 1-hour signed URLs | Moderator downloads and copies approved photos | Original name retained in DB metadata only; paths no longer include original name | Not implemented | Live bucket/object policy unverified; no AV/re-encode |
| mmips-public-case-photos | Yes | `profiles/{slug}/{sort}-{uuid}.{ext}` after fix | Moderator service-role copy only | Public URL after approval | Service role only | Public bucket URL | Copy from private only after approval | Content type set from validated/stored image MIME | Not implemented | Live storage policy unverified; cache purge for removed photos incomplete |

## Endpoint inventory

| Endpoint | Methods | Auth/authz | Validation | Rate/Turnstile | Response fields/logging/failure | Tests |
|---|---|---|---|---|---|---|
| `/api/submissions` | GET, POST | Public POST via server service role; no public DB insert | Required fields, profile type/status, upload count/size/type/signature/extension | Turnstile server verification; no distributed rate limit | Redirects with generic error after fix; demo mode log still must avoid private data before launch | security upload unit/static |
| `/api/corrections` | GET, POST | Public POST via server service role | Required fields; case reference bounded partly | Turnstile; no distributed rate limit | Redirects; current route may include raw validation messages | Needs more tests |
| `/api/admin/submissions` | GET | Bearer token + allowlisted email | Status/search bounded; admin-only broad private fields | No route-specific rate limit | Private JSON to admins; raw DB error previously returned in some routes | admin guard static |
| `/api/admin/submissions/[id]` | PATCH | Bearer token + allowlisted email before DB access | Action enum; publication fields from submission; audit insert | No route-specific rate limit | Generic 500 after fix | admin guard static |
| `/api/admin/corrections` | GET | Bearer token + allowlisted email | Search bounded | No route-specific rate limit | Private JSON to admins; raw error message still possible | admin guard static |
| `/api/admin/corrections/[id]` | PATCH | Bearer token + allowlisted email | Action enum; allowlisted updates | No route-specific rate limit | Raw error message still possible | admin guard static |
| `/api/admin/profiles` | GET | Bearer token + allowlisted email | Search minimum length; allowlisted visibility | No route-specific rate limit | Admin JSON | admin guard static |
| `/api/admin/profiles/[id]` | PATCH | Bearer token + allowlisted email | Allowlisted case/person fields | No route-specific rate limit | Raw error message still possible | admin guard static |

## Public/private data flow

Public browsers receive approved profile-shaped fields from `lib/cases.ts`. Private form data flows only to server routes, then service-role Supabase inserts. Admin UI receives private data only after per-endpoint `requireAdmin`. Private photos enter the private bucket and are copied to public storage only during approval. Alerts are not implemented and remain a release blocker.

## Correction-pass update (2026-08-05)

Version 1 upload acceptance is restricted to JPEG/JPG, PNG, and WebP. GIF is excluded until a reviewed image-processing pipeline provides secure decoding, frame/dimension limits, pixel-count limits, re-encoding, EXIF/metadata stripping, decompression-bomb protection, and malware or sandbox scanning where appropriate.

The SQL hardening migration no longer mutates `storage.buckets`; bucket configuration is documented in `docs/STORAGE_CONFIGURATION_RUNBOOK.md` and requires separate synthetic staging verification. Storage objects policies remain static-review-only in this task.

All current `app/api/**` 500 response catch blocks were reviewed for raw `error.message` exposure. Current identified 500 responses now use generic user-safe messages with bounded internal error codes through `safeApiError` or generic redirects; validation/404/403 messages remain explicit but do not contain raw provider/database errors.
