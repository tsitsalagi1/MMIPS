# MMIPS Version 1 Threat Model

Static repository audit date: 2026-08-05. Scope: current Next.js app, Supabase SQL, storage upload paths, admin/public routes, and configured foundation checks. No production data, production secrets, live Supabase project, or live storage buckets were accessed.

## Assets

- Private submissions, submitter contact details, requester details, relationship/authorization statements, moderator notes, audit metadata, exact/sensitive locations, private pending photos, source IPs, correction/removal requests, alert subscriber records, provider identifiers, admin sessions, service-role credentials, and database/storage backups.
- Public assets: approved public profiles, approved public photos, flyers, public policy pages, approximate public location text, and official public tip contacts.

## Trust boundaries and roles

- Anonymous browser visitor to public Next.js pages and public API routes.
- Public form submitter to server route using Turnstile and service-role server insert.
- Browser Supabase anon client to RLS-protected public reads.
- Admin browser session to `app/admin/**` UI and `app/api/admin/**` API routes.
- Server-only Supabase service-role client to database/storage.
- Supabase Auth, PostgREST/RLS, Storage, Cloudflare Turnstile, Vercel/Next.js hosting, Resend email, GitHub/CI, npm registry.
- Human moderators/operators and database owners.

## Sensitive data categories

Private contact details, authorization evidence, exact/sensitive locations, shelter/trafficking/minor locations, private narratives, private photo originals and metadata, source IPs, subscriber data, audit details, moderator notes, service-role keys, bearer tokens, provider errors, and backup artifacts.

## Threat inventory

| Threat | Likelihood | Impact | Current control | Remaining risk | Required mitigation | Release-blocking |
|---|---:|---:|---|---|---|---|
| Anonymous visitor reads pending/private submissions through Data API | Medium | Critical | RLS enabled in schema; new hardening migration revokes private-table grants | Live RLS not verified | Execute policies in isolated Supabase; keep real submissions disabled until verified | Yes |
| Automated bot floods submissions/corrections/uploads | High | High | Turnstile helper; max upload count/size | No distributed rate limit; missing-secret dev bypass | Add distributed rate limiting, production Turnstile secret/action checks | Yes |
| Malicious submitter uploads SVG/active/spoofed image | High | High | Upload MIME allowlist existed; new magic-byte/extension validation rejects SVG/spoofs | No AV/re-encoding/decompression-dimension parser | Add image re-encode and malware scanning before launch | Yes |
| Oversized/decompression-bomb image | Medium | High | 5 MB byte limit | Dimension/pixel-count and decompression bomb validation incomplete | Add safe image parser/re-encoding sandbox | Yes |
| Unauthorized family member requests correction/removal | Medium | High | Human moderation before publication/removal | Authorization evidence model/process incomplete | Moderator SOP and stronger request verification | Yes |
| Disgruntled or compromised moderator exposes data | Medium | High | Admin allowlist and audit inserts | Audit immutability live verification incomplete; broad admin reads remain powerful | Least-privilege admin roles, immutable audit storage, review procedures | Yes |
| Stolen admin session accesses admin endpoints | Medium | High | `requireAdmin` checks bearer token and allowlist per API | Session hardening/MFA not documented; token compromise still high impact | MFA, short sessions, alerting, audit review | Yes |
| Leaked service-role key | Low | Critical | Key read only server-side; secret scan | Production environment cannot be inspected by Codex | Human cloud-secret review and rotation runbook | Yes |
| Misconfigured RLS | Medium | Critical | SQL RLS enable statements and policies | Static only; no live verification | Run verification queries and isolated integration tests | Yes |
| Misconfigured storage buckets | Medium | Critical | Pending bucket configured private; public bucket only for approved copies | Live bucket/object policies not verified | Live storage policy tests and signed URL tests | Yes |
| Guessable object paths | Medium | High | New generated UUID object names omit originals | Existing older objects may include original names | Migrate/review existing synthetic/staging objects; cleanup old paths | Yes until verified |
| Public API overfetching | High | High | Public loaders now explicit-select allowlisted fields | Need integration tests against actual RLS/view | Prefer public-safe DB view and contract tests | Yes |
| Search-filter injection via `.or()`/`.ilike()` | Medium | High | Basic cleaning strips `%`/`,` and length-bounds admin search | Public correction caseReference had limited parsing; admin search still uses PostgREST filter strings | Central validation helpers and tests for every filter | No if admin-only; Yes for public endpoints if found |
| Exact-location disclosure | Medium | Critical | Public loaders now do not read/map lat/long; policy requires approximate text | Existing schema public policy could expose lat/long if selected directly by anon | Public safe view or RLS split needed | Yes |
| Accidental publication of private notes | Medium | Critical | Public app uses explicit fields; admin uses service role | Mixed public/private cases table; publication process manual | Dedicated public profile view/table | Yes |
| Cached/indexed removed profile | Medium | High | Public query requires approved + published_at not null; admin cache no-store headers | Robots/noindex for removed/admin not fully verified | Add cache purge/runbook, noindex private/admin flows | Yes |
| Alert-subscriber enumeration | Medium | Critical | Alerts not implemented; subscriber table RLS enabled | No double opt-in/unsubscribe backend yet | Alerts V1 must include non-enumerating responses and private RLS | Yes |
| Provider outage, DB/storage failure | Medium | High | Demo mode only when env absent | Monitoring/backups/restore rehearsal incomplete | Ops runbooks, backups, restore rehearsal | Yes |
| Audit-log tampering | Medium | High | Audit table RLS; new migration revokes anon/auth grants | Service role/owner can still alter; no append-only trigger | Append-only trigger and external log retention | Yes |
| Family-safety/retraumatization from public content | Medium | Critical | Human moderation mandatory; trauma-informed docs | Independent family-support review incomplete | Complete review/SOP/go-no-go | Yes |

## Incident scenarios

1. Private pending photo becomes public due to bucket policy drift: disable submissions, revoke public bucket/policy, rotate signed URLs, notify affected family through approved incident procedure, preserve audit evidence.
2. Service-role key exposure: revoke/rotate key, review logs for unauthorized reads/writes, disable admin/submission paths until verified, notify affected people if private data may have been accessed.
3. Moderator account compromise: revoke session/account, freeze consequential moderation, review audit log, restore hidden/published status from backups if needed.
4. Public overfetch reveals exact location: take site/API offline or block route, purge caches/search indexes, notify affected family, migrate to public-safe view.

## Correction-pass update (2026-08-05)

GIF upload support is intentionally deferred. Animated image formats increase decoder, frame-count, dimension, pixel-count, and decompression-bomb risk. GIF may be reconsidered only after secure decoding, frame and dimension limits, pixel-count limits, re-encoding, EXIF/metadata stripping, decompression-bomb protection, and malware or sandbox scanning are reviewed and tested.

Magic-byte validation is documented as one control, not proof of image safety. Original filenames do not form storage object paths in the current application code; object paths use generated UUIDs and `upsert: false`, but live storage policy verification is still release-blocking.
