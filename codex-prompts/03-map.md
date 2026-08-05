# Privacy-Safe Map V1 Prompt

Branch/workspace: `codex/map-v1`

## Scope

Implement the Version 1 privacy-safe interactive public map plus accessible list, using only approved approximate public profile data.

## Files primarily owned

- app/map/page.tsx
- future map components/utilities/tests
- lib/cases.ts and lib/status.ts only if needed

## Dependencies and coordination

Coordinate with security-audit for exact-location leakage review and trauma-accessibility for accessible list parity. Avoid migrations unless reviewed.

## Safety boundaries

- Use synthetic data only. Never use real family, victim, witness, subscriber, requester, moderator, investigative, or exact-location data.
- Do not add production secrets, service-role keys, API keys, tokens, or credentials to Codex, commits, tests, logs, or pull requests.
- Do not commit directly to `main`.
- Do not merge your own pull request.
- Do not weaken safety controls to make tests pass.
- Keep human moderation mandatory before public publication.
- Keep exact and sensitive locations private by default.
- Keep private submissions, requester information, moderator notes, audit details, authorization evidence, private images, and subscriber information non-public.
- Do not publish unverified accusations, rumors, or unsafe details.

## Required tests/checks

- Run clean install where possible.
- Run lint.
- Run type check if configured.
- Run tests for behavior changed or added.
- Run production build.
- Report missing commands honestly as `Not configured`, `Not available`, or `Not run`.

## Pull request requirement

Open a draft pull request using the Codex/GitHub cloud review workflow. Do not merge it. Include the mandatory report below in the PR body and final response.

## Mandatory report format

```text
MMIPS CODEX TASK REPORT

TASK NAME:
TASK TYPE:
STATUS: COMPLETE | PARTIAL | BLOCKED | FAILED

REPOSITORY:
SELECTED BASE:
BASE COMMIT:
TASK BRANCH OR WORKSPACE:

OBJECTIVE:

RESULT SUMMARY:

FILES ADDED:
-

FILES MODIFIED:
-

FILES DELETED:
-

DATABASE OR MIGRATIONS:
-

ENVIRONMENT VARIABLES OR SECRETS:
-

COMMANDS RUN:
1.
   Result:

TESTS AND CHECKS:
- Clean install:
- Production build:
- Type check:
- Lint:
- Unit tests:
- Integration tests:
- End-to-end tests:
- Accessibility tests:
- Security checks:

SECURITY AND PRIVACY REVIEW:
- Real family data used:
- Production credentials accessed:
- Public/private data impact:
- Exact-location impact:
- Upload or storage impact:
- Logging impact:
- Remaining concerns:

TRAUMA-INFORMED AND ACCESSIBILITY IMPACT:

KNOWN LIMITATIONS:

BLOCKERS:

COMMIT:
PULL REQUEST:
DEPLOYMENT OR PREVIEW:

ROLLBACK INSTRUCTIONS:

RECOMMENDED NEXT ACTION:

FILES LIKELY TO CONFLICT WITH OTHER TASKS:

HANDOFF NOTES FOR THE NEXT CODEX AGENT:
```
