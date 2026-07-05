# MMIPS Public Badge Fix

This patch fixes a public display-label issue on approved case cards/pages.

## Problem fixed

Approved public cases with no explicit public verification rows could display a badge labeled `Pending review`. That was a misleading fallback label, not a privacy/security failure. The public list was still only loading cases where `review_status = approved` and `published_at` is not null.

## What changed

- Adds a safe public verification status: `mmips_reviewed`.
- Changes the fallback badge from `Pending review` to `MMIPS reviewed for publication`.
- Filters `pending_review` out of public verification badges so a pending-review label is never shown on public pages.
- Keeps the public query restricted to approved/published cases only.

## Files

Upload these files to the GitHub repo root and commit:

- `lib/cases.ts`
- `lib/types.ts`
- `lib/status.ts`
- `components/StatusBadge.tsx`
- `README.md` (optional)

After commit, Vercel should redeploy automatically. Then refresh `https://mmips.com/cases`.
