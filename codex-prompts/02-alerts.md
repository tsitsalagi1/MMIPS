# Alerts V1 Prompt

Branch/workspace: `codex/alerts-v1`

## Scope

Implement working email-alert double opt-in and unsubscribe for Version 1, including subscriber privacy, synthetic tests, and safe transactional email behavior.

## Files primarily owned

- app/alerts/page.tsx
- future app/api/alerts/* routes
- future alert migrations
- future alert tests
- lib/email.ts only if needed

## Dependencies and coordination

Wait for or align with foundation-ci. Security-audit must review RLS, token handling, unsubscribe behavior, and migrations before merge.

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
