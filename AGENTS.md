# MMIPS Codex Agent Rules

Scope: this file applies to the entire repository.

MMIPS is a trauma-facing public-awareness and family-support platform for Missing and Murdered Indigenous People. Safety, dignity, privacy, reliability, accessibility, transparency, family control, and recoverability take priority over speed.

## Data and privacy

- Never use real family, victim, witness, subscriber, requester, moderator, investigative, law-enforcement, exact-location, or case data for development or testing.
- Use synthetic data only. Label fixtures and examples as synthetic or demo data.
- Private submissions, requester information, moderator notes, audit details, authorization evidence, private images, subscriber information, and exact/sensitive locations must never be public.
- Exact and sensitive locations remain private by default. Public map/profile locations must be approximate and safety-filtered.
- Do not publish unverified accusations, rumors, graphic details, private addresses, or details that could endanger a person, family, witness, community, shelter, or investigation.
- Human moderation is mandatory before public publication.

## Credentials and environments

- Do not add production credentials, tokens, service-role keys, API keys, or secrets to Codex environments, commits, tests, docs, screenshots, logs, or pull requests.
- GitHub is the permanent source of truth. Normal development, testing, review, staging, and deployment must remain cloud-based.
- Local computers are used only for periodic encrypted disaster-recovery backups.

## Git and review controls

- Never commit directly to `main`.
- Never merge the agent's own pull request.
- Work only in the assigned task scope.
- Do not weaken safety controls to make tests pass.
- If Codex uses an internal branch or workspace named `work`, do not treat that name as an error by itself.
- If `git remote -v` is empty in the Codex sandbox, do not alter or authenticate remotes with shell commands; use the Codex platform review and pull-request workflow.

## Testing, migrations, and accessibility

- Every behavior change requires tests appropriate to the change.
- Every consequential database migration requires documented migration order and rollback or forward-fix instructions.
- WCAG 2.2 AA is the accessibility target.
- Trauma-informed principles must govern family-facing interactions.

## Mandatory task report

Every task must end with this exact report format, completed honestly and placed in one plain-text fenced code block:

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
