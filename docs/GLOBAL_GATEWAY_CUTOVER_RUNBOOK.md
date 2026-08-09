# MMIPS Global Gateway / United States Cutover Runbook

This cutover is designed to avoid downtime and avoid moving the existing United States case database.

## Target deployment model

### Existing country application

The current Vercel project becomes the United States country deployment.

Environment:

```text
MMIPS_SITE_MODE=us
NEXT_PUBLIC_SITE_URL=https://us.mmips.com
NEXT_PUBLIC_GLOBAL_SITE_URL=https://mmips.com
```

Keep the current U.S. Supabase environment variables and current production database attached only to this country deployment.

### New global gateway project

Create a second Vercel project from the same repository for the gateway.

Environment:

```text
MMIPS_SITE_MODE=global
NEXT_PUBLIC_SITE_URL=https://mmips.com
NEXT_PUBLIC_US_SITE_URL=https://us.mmips.com
```

Do **not** configure Supabase database/service-role/storage secrets on the global gateway project.

The global gateway application code rejects `/api/*` and redirects country application routes back to `/`.

## Safe domain cutover order

1. Deploy this branch to Preview and run the complete CI suite.
2. On the existing MMIPS Vercel project, add `us.mmips.com` while leaving `mmips.com` attached.
3. Set `MMIPS_SITE_MODE=us`, `NEXT_PUBLIC_SITE_URL=https://us.mmips.com`, and `NEXT_PUBLIC_GLOBAL_SITE_URL=https://mmips.com` on the existing country project.
4. Deploy and verify `https://us.mmips.com` before changing the apex domain.
5. Verify on the U.S. portal:
   - homepage;
   - `/profiles` full public map/data;
   - search and text fallback;
   - `/alerts`;
   - `/submit` remains release-locked as intended;
   - corrections/removal;
   - admin MFA/AAL2;
   - security headers;
   - public/private database separation;
   - current U.S. synthetic-data labeling;
   - no new runtime errors.
6. Create the separate Vercel gateway project from the same repository.
7. Configure only the gateway environment values shown above. Do not copy U.S. Supabase secrets into the gateway.
8. Verify the gateway on its `vercel.app` production URL:
   - homepage renders country cards;
   - United States points to `https://us.mmips.com`;
   - Canada/Australia/Aotearoa remain `preparing`;
   - `/profiles`, `/submit`, `/alerts`, `/admin`, and other country routes redirect to `/`;
   - `/api/*` returns 404;
   - sitemap lists only the gateway root;
   - gateway build/runtime has no database dependency.
9. Reassign `mmips.com` from the existing U.S. Vercel project to the new global gateway project.
10. Confirm TLS/DNS and test `https://mmips.com` from an unauthenticated browser.
11. Keep `us.mmips.com` as the canonical U.S. portal.
12. Update external U.S. links gradually or preserve redirects where appropriate. Do not create a redirect loop between `mmips.com` and `us.mmips.com`.

## Rollback

If the gateway cutover has a problem:

1. Reassign `mmips.com` to the existing U.S. Vercel project.
2. Keep `us.mmips.com` attached to the U.S. project.
3. Do not alter or restore the U.S. database; no database migration is required for gateway rollback.
4. Diagnose the separate gateway project without touching country data.

## Canada implementation rule

Canada must not reuse the U.S. Supabase project.

Before creating the Canadian project, explicitly select the Supabase organization and review/confirm the project cost. Target data-region selection should be evaluated for Canadian requirements; Supabase currently offers `ca-central-1` as a specific Canada Central region.

Canada remains `preparing` until its own application questions, terminology, reporting channels, privacy rules, moderators, synthetic rehearsal, and release gates are complete.

## Future country projects

Each future country follows the same pattern:

```text
country subdomain
→ country Vercel project
→ country-specific application configuration/code
→ country Supabase project
→ country administrators
→ country release gate
```

No future country activation may require giving the global gateway direct access to that country's private database.
