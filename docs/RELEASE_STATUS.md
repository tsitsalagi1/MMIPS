# MMIPS Version 1 Release Status

Status: **Not ready for real submissions**.

## Current decision

Real family, victim, witness, subscriber, requester, or investigative data must not be entered into staging or development. Production real submissions must remain disabled until all Version 1 release gates pass and a named human records a final go/no-go decision.

## Baseline

- Expected repository: `tsitsalagi1/MMIPS`
- Selected base: `main`
- Baseline commit inspected: `e61872d Add files via upload`
- Codex workspace may appear as `work`; that is not a release concern by itself.

## Completed in this coordination task

- Persistent Codex safety rules added.
- Full Version 1 release specification added.
- Binary release gates added.
- Current-state gap analysis added.
- Parallel Codex workstream plan added.
- Trauma-informed UX standard added.
- Pull-request template added.
- Detailed prompts for six cloud workstreams added.

## Release blockers

- CI and automated checks now have a foundation workflow and accurately named synthetic unit/static/contract/smoke/accessibility-baseline checks, but full Version 1 protected staging, browser E2E, axe/browser accessibility, live database integration, security, RLS, and live deployment verification remain incomplete.
- Alerts V1 is not implemented.
- Interactive privacy-safe map V1 is not implemented.
- Live RLS/storage policies are unverified.
- Monitoring, backups, and restore rehearsal are not complete.
- Independent family-support/victim-services review is not complete.
- Final policies and final go/no-go are not complete.

## Foundation CI evidence (codex/foundation-ci)

- Added pinned dependency declarations, `package-lock.json` usage, Node 22.23.1 runtime documentation, ESLint flat config, `typecheck`, accurately named synthetic unit/static/contract/smoke/accessibility-baseline scripts, secret-pattern scan, separate online/offline dependency audit commands, and pull-request CI workflow.
- Evidence is limited to commands run in the Codex workspace plus the configured GitHub workflow. Browser end-to-end testing, axe or equivalent browser accessibility scanning, live/isolated Supabase integration, protected staging lifecycle testing, RLS/storage verification, full secret-scanning service evidence, and independent trauma-informed accessibility review remain incomplete.
