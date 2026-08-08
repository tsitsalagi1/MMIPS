# Real submission intake release control

MMIPS real family/case submission intake is fail-closed in production until the Version 1 release gates pass and a named human records the final go/no-go decision.

## Production behavior

`MMIPS_REAL_SUBMISSIONS_ENABLED` is a non-secret release-control flag.

- Missing, blank, `false`, or any value other than the exact lowercase string `true`: production intake is locked.
- `true`: production intake may render and the submission API may process requests.
- Development and test environments remain available for synthetic-only testing.

The public `/submit` page hides the form while locked and explains that intake is paused. The `/api/submissions` POST route independently checks the same release control before it parses request form data, runs Turnstile, validates images, writes to Supabase, or sends email.

## Go/no-go procedure

Do not set the production flag to `true` until all repository release gates required for real submissions are complete and the named human decision-maker records the go decision.

When approved:

1. Record the go/no-go evidence and remaining accepted risks in the release record.
2. Set `MMIPS_REAL_SUBMISSIONS_ENABLED=true` for the Vercel Production environment only.
3. Create a reviewed production deployment.
4. Verify the rendered `/submit` page and one synthetic end-to-end submission before announcing intake as open.
5. If verification fails, remove/disable the flag and redeploy the last known-safe production state.

## Emergency stop

To stop intake, remove the Production environment variable or set it to anything other than exact lowercase `true`, then deploy the reviewed locked state. The server-side route remains the authoritative safety boundary; do not rely only on hiding the form.

This flag is not a substitute for the existing moderation, authorization, privacy, upload, rate-limit, Turnstile, or database controls.
