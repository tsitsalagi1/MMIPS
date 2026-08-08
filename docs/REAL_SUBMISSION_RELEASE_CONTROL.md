# Real submission intake release control

MMIPS real family/case submission intake is fail-closed until the Version 1 release gates pass and a named human records the final go/no-go decision.

## Deployed-environment behavior

MMIPS uses two separate non-secret release-control flags so production and protected synthetic-preview testing cannot accidentally enable one another.

### Production

`MMIPS_REAL_SUBMISSIONS_ENABLED=true` is required to open real production intake.

- Missing, blank, `false`, or any value other than the exact lowercase string `true`: production intake is locked.
- `true`: production intake may render and the submission API may process real requests, but only after the named-human launch go/no-go.

### Vercel Preview

`MMIPS_SYNTHETIC_SUBMISSIONS_ENABLED=true` is required to open protected Preview intake for synthetic rehearsal.

- Missing or any other value: Preview intake is locked.
- `true`: Preview renders an explicit **Synthetic rehearsal only** warning and includes the synthetic rehearsal marker required by the API.
- Setting the real-production flag does not open Preview.
- Setting the synthetic-preview flag does not open Production.

### Local test/development

Local `test` and `development` runtimes use synthetic mode. They must never receive real family, victim, witness, case, subscriber, requester, or investigative information.

Unknown deployed/runtime combinations fail closed.

## Server boundary

The `/api/submissions` POST route resolves the intake mode before reading request form data.

- `locked`: request is rejected before form parsing, Turnstile, image processing, Supabase writes, or email.
- `synthetic`: form parsing is allowed only for the protected rehearsal workflow, and the request must contain the synthetic rehearsal marker emitted by the synthetic-mode page before downstream processing continues.
- `real`: normal production submission processing is allowed only because the exact real-production release flag was enabled.

The `/submit` page mirrors this boundary: locked mode hides the form; synthetic mode shows a prominent fictional-data-only warning; real mode shows the normal production form.

## Go/no-go procedure for real intake

Do not set `MMIPS_REAL_SUBMISSIONS_ENABLED=true` in Production until all repository release gates required for real submissions are complete and the named human decision-maker records the go decision.

When approved:

1. Record go/no-go evidence and remaining accepted risks in the release record.
2. Verify protected Preview with `MMIPS_SYNTHETIC_SUBMISSIONS_ENABLED=true` using fictional MMIPS rehearsal data only.
3. Set `MMIPS_REAL_SUBMISSIONS_ENABLED=true` for the Vercel Production environment only.
4. Create one reviewed production deployment.
5. Verify the rendered `/submit` page and one controlled synthetic smoke check before announcing real intake as open.
6. If verification fails, remove/disable the production flag and redeploy the last known-safe locked state.

## Preview rehearsal procedure

To enable a protected Vercel Preview for synthetic browser/E2E testing:

1. Set `MMIPS_SYNTHETIC_SUBMISSIONS_ENABLED=true` for Preview only.
2. Confirm the preview page displays the synthetic-only warning before entering any test data.
3. Use fictional MMIPS test identities/data only.
4. Remove or disable the Preview flag when the rehearsal is complete if continued intake is unnecessary.

## Emergency stop

To stop production intake, remove the Production real-intake variable or set it to anything other than exact lowercase `true`, then deploy the reviewed locked state. The server-side route is the authoritative safety boundary; do not rely only on hiding the form.

This release control is not a substitute for the existing moderation, authorization, privacy, upload, rate-limit, Turnstile, database, or publication controls.
