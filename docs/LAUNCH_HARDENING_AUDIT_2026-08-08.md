# MMIPS launch hardening audit — 2026-08-08

This record summarizes production-safe checks and hardening performed while Vercel deployment capacity was exhausted. No real family, victim, witness, subscriber, requester, moderator, or investigative content was read for this audit.

## Deployment state

- Latest successful Vercel production deployment is the ZIP-radius urgent-alert release from GitHub PR #34.
- GitHub PR #35 (production Turnstile hostname validation and privacy-safe failure diagnostics) is merged to `main` but has not reached production because the Vercel Hobby deployment quota is exhausted.
- The last successful Vercel build completed successfully but used Node 22.22.2 while the repository declared a higher Node 22 minor minimum, producing an `EBADENGINE` warning. The consolidated hardening branch changes the deploy contract to Node `22.x` while preserving exact development/CI pinning separately.
- Production runtime logs for the prior 24 hours contained no 5xx errors. The only observed 4xx was one `POST /api/alerts/subscribe` 400, matching the alert signup problem under investigation.

## Alert hardening findings

- Invalid/incomplete urgent-alert geography could fall back to the legacy broad `all_public_alerts` category. The consolidated hardening branch makes this fail closed to urgent-community-alert scope.
- A partial urgent-alert provider failure could leave failed delivery rows, then a same-hour retry could skip existing ledger rows and incorrectly mark the event as sent. The consolidated hardening branch freezes the audience in the delivery ledger, retries only retryable rows with stable idempotency identity, and derives final event state from persisted delivery rows.
- Alerts, submission intake, and correction/removal now share one Turnstile hostname resolver. Canonical `mmips.com` and `www.mmips.com` are pinned to the actual request hostname; noncanonical deployed hosts require `TURNSTILE_EXPECTED_HOSTNAME` or fail closed.
- Turnstile tokens are action-scoped: `alerts_subscribe`, `submission_intake`, and `correction_request` are distinct and validated server-side.

## Real submission intake finding and immediate production mitigation

The release status says MMIPS is not ready for real submissions and requires a named-human go/no-go before intake opens, but the currently deployed production submission route would process a completed real submission. The consolidated hardening branch adds fail-closed application controls at both the page and API layers and separates real-production intake from synthetic protected-preview intake.

No `/api/submissions` production requests were observed in the prior 24-hour Vercel runtime-log window when this issue was discovered.

Because the application fix cannot reach production until Vercel capacity returns, a narrow database-side kill switch was applied immediately through the Supabase migration system:

```sql
revoke insert on table public.submissions from service_role;
```

Verification after the migration showed:

- `service_role` INSERT on `public.submissions`: **false**
- `service_role` SELECT on `public.submissions`: **true**
- `service_role` UPDATE on `public.submissions`: **true**

This prevents the currently deployed server route from persisting a new submission without disrupting existing-record moderation or correction/removal intake. The exact applied migration is recorded in `supabase/lock_real_submission_inserts_until_launch_20260808.sql`.

A separate reviewed migration will be required to restore submission INSERT before a protected synthetic end-to-end write rehearsal. Do not restore INSERT until the application-side production/preview release controls are deployed and verified.

The live database `private.mmips_submission_write_guard` was also verified to set `new.source_ip := null` before persistence. The consolidated application branch goes further and no longer places raw requester IP into the Supabase insert payload at all; the database guard remains a second defense.

## Supabase security posture

The connected Supabase project reported `ACTIVE_HEALTHY` during the audit.

Metadata-only verification showed:

- all application tables in the exposed `public` schema have RLS enabled;
- `alert_subscribers`, `alert_deliveries`, `public_case_map_points`, and `urgent_alert_events` use forced RLS;
- private submission/correction/audit tables use deny-by-default policies for public roles;
- public case/person/event/verification/photo/map policies require the intended approved/published or moderator-approved state;
- public-schema `SECURITY DEFINER` functions used by MMIPS have explicit execute ACLs limited to `postgres` and `service_role`, not `PUBLIC`;
- one verified TOTP MFA factor exists for admin authentication;
- aggregate case-state check showed 16 total case records, 0 approved, and 0 published.

Supabase Security Advisor reported one warning: leaked-password protection is disabled. If the project plan supports it, enable it through Auth settings before real-production launch.

Performance Advisor reported only informational unused-index notices. No indexes were removed because the project is young and current low usage is not evidence that the indexes are unnecessary.

## Storage posture and remaining configuration item

- `mmips-submission-photos` is private.
- `mmips-public-case-photos` is intentionally public for approved public assets.
- `storage.objects` has RLS enabled and currently has no object policies granting anon/authenticated writes.
- Both buckets still list `image/gif` in their bucket-level allowed MIME types even though the application rejects GIF uploads pending a reviewed image-processing path.

For defense in depth, remove `image/gif` from both bucket allowlists using a supported Supabase Storage API or Dashboard workflow. Do not update `storage.buckets` directly with SQL; the repository operating rules prohibit bypassing the supported Storage control plane.

## Public URL and crawler hardening

- Admin, alert token/action pages, alert result pages, submission receipts, and correction/removal receipts are explicitly `noindex`, `nofollow`, and `noarchive`.
- `robots.txt` blocks crawler access to `/api/` endpoints.
- The sitemap contains only public informational surfaces and excludes admin/API/token/receipt paths.
- Legacy `/cases` URLs permanently canonicalize to `/profiles` equivalents instead of creating a second public URL family.

## Remaining pre-launch platform actions

1. Wait for Vercel deployment capacity to return and deploy one consolidated, reviewed hardening change rather than multiple small production deployments.
2. Verify the production Alerts signup with synthetic input and inspect the new privacy-safe Turnstile diagnostic code if it still fails.
3. After the application release controls are deployed and verified, use a separate reviewed migration to restore submission INSERT for a protected synthetic write rehearsal; keep production real intake locked.
4. Verify one synthetic partial urgent-alert delivery/retry sequence before enabling real alert sends.
5. Confirm production `/submit` is locked and a direct production POST is rejected before request parsing after the application deployment.
6. Remove GIF from both Storage bucket MIME allowlists through a supported Storage control plane.
7. Enable Supabase leaked-password protection if the project plan supports it.
8. Keep all 16 case records unpublished until the existing human moderation and launch decisions are complete.
9. Complete protected browser E2E, browser accessibility, backup/restore, incident-response, and independent trauma-informed/family-support review before final go/no-go.

No item in this audit authorizes real-person publication, real alert sending, or real submission intake.
