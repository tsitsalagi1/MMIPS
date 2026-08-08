# MMIPS launch hardening audit — 2026-08-08

This record summarizes the production-safe checks performed while Vercel deployment capacity was exhausted. No real family, victim, witness, subscriber, requester, or investigative content was read for this audit.

## Deployment state

- Latest successful Vercel production deployment is the ZIP-radius urgent-alert release from GitHub PR #34.
- GitHub PR #35 (production Turnstile hostname validation and privacy-safe failure diagnostics) is merged to `main` but has not reached production because the Vercel Hobby deployment quota is exhausted.
- The last successful Vercel build completed successfully but used Node 22.22.2 while the repository declared a higher Node 22 minor minimum, producing an `EBADENGINE` warning. The consolidated hardening branch changes the deploy contract to Node `22.x` while preserving exact development/CI pinning separately.
- Production runtime logs for the prior 24 hours contained no 5xx errors. The only observed 4xx was one `POST /api/alerts/subscribe` 400, matching the alert signup problem under investigation.

## Alert hardening findings

- Invalid/incomplete urgent-alert geography could fall back to the legacy broad `all_public_alerts` category. The consolidated hardening branch makes this fail closed to urgent-community-alert scope.
- A partial urgent-alert provider failure could leave failed delivery rows, then a same-hour retry could skip existing ledger rows and incorrectly mark the event as sent. The consolidated hardening branch freezes the audience in the delivery ledger, retries only retryable rows with stable idempotency identity, and derives final event state from persisted delivery rows.

## Real submission intake finding

The release status says MMIPS is not ready for real submissions and requires a named-human go/no-go before intake opens, but the current production submission route would process a completed real submission. The consolidated hardening branch adds a fail-closed production release control at both the page and API layers. The server checks the lock before parsing submission data.

No `/api/submissions` production requests were observed in the prior 24-hour Vercel runtime-log window when this issue was discovered.

The live database `private.mmips_submission_write_guard` was verified to set `new.source_ip := null` before persistence, so the existing database layer continues to minimize raw requester IP storage.

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

Supabase Security Advisor reported one warning: leaked-password protection is disabled. Supabase documents this feature as available on Pro plans and above. If the project plan supports it, enable it through Auth settings before real-production launch.

Performance Advisor reported only informational unused-index notices. No indexes were removed because the project is young and these indexes may be required as traffic/query patterns develop.

## Storage posture and remaining configuration item

- `mmips-submission-photos` is private.
- `mmips-public-case-photos` is intentionally public for approved public assets.
- `storage.objects` has RLS enabled and currently has no object policies granting anon/authenticated writes.
- Both buckets still list `image/gif` in their bucket-level allowed MIME types even though the application rejects GIF uploads pending a reviewed image-processing path.

For defense in depth, remove `image/gif` from both bucket allowlists using a supported Supabase Storage API or Dashboard workflow. Do not update `storage.buckets` directly with SQL; the repository operating rules prohibit bypassing the supported Storage control plane.

## Remaining pre-launch platform actions

1. Wait for Vercel deployment capacity to return and deploy one consolidated, reviewed hardening change rather than multiple small production deployments.
2. Verify the production Alerts signup with synthetic input and inspect the new privacy-safe Turnstile diagnostic code if it still fails.
3. Verify one synthetic partial urgent-alert delivery/retry sequence before enabling real alert sends.
4. Confirm the production submission page is locked and a direct production POST is rejected before request parsing.
5. Remove GIF from both Storage bucket MIME allowlists through a supported Storage control plane.
6. Enable Supabase leaked-password protection if the project plan supports it.
7. Keep all 16 case records unpublished until the existing human moderation and launch decisions are complete.

No item in this audit authorizes real-person publication, real alert sending, or real submission intake.
