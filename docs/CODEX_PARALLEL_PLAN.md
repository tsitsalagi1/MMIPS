# MMIPS Codex Parallel Cloud-Build Plan

All work remains cloud-based through GitHub/Codex review. No agent commits directly to `main`, no agent merges its own PR, and all work uses synthetic data only.

## Wave 1 workstreams

### `codex/foundation-ci`

Primary ownership:
- `package.json`
- lockfile
- `.github/workflows/*`
- test configuration files
- synthetic fixtures under future test directories

Scope:
- Stabilize dependency installation.
- Add CI for clean install, lint, type check, tests, build, and security checks.
- Add minimal test scaffolding without changing production behavior.

Dependencies:
- None; start first.

Likely conflicts:
- `package.json`, lockfile, CI files.

Cross-review:
- Reviewed by `codex/security-audit` for secret handling and by `codex/trauma-accessibility` later for fixture language.

### `codex/alerts-v1`

Primary ownership:
- `app/alerts/page.tsx`
- future alert API routes
- future alert email templates
- future alert tests
- future Supabase alert migrations

Scope:
- Implement double opt-in, unsubscribe, subscriber privacy, and synthetic tests.

Dependencies:
- Should consume CI patterns from `codex/foundation-ci`.
- Requires migration review from `codex/security-audit`.

Likely conflicts:
- `lib/email.ts` if alert emails reuse transactional email helper.

Migration order:
1. Subscriber tables and RLS.
2. Token/confirmation tables or columns.
3. Unsubscribe/audit logging structures.
4. Application routes.

Cross-review:
- Security review by `codex/security-audit`.
- Trauma/accessibility review in Wave 2.

### `codex/map-v1`

Primary ownership:
- `app/map/page.tsx`
- map/list components
- future map utility functions
- future map tests

Scope:
- Build privacy-safe interactive map and accessible list parity.
- Use only approved approximate public fields.

Dependencies:
- Needs published-profile data contract from current `lib/cases.ts`.
- Should wait for foundation CI test conventions.

Likely conflicts:
- `lib/cases.ts`, `lib/status.ts`, CSS.

Migration order:
- Avoid migrations unless absolutely necessary. If needed, add generalized public map fields only after security review.

Cross-review:
- Security review for exact-location leakage.
- Trauma/accessibility review for map alternatives.

### `codex/security-audit`

Primary ownership:
- `supabase/*.sql`
- auth/admin helpers
- security docs
- security tests or scripts

Scope:
- Audit RLS, storage access, service-role boundaries, Turnstile enforcement, environment-variable usage, logging, and migration order.

Dependencies:
- Starts in parallel but must review migrations from alerts and map before merge.

Likely conflicts:
- Supabase SQL files and admin/auth helpers.

Migration order:
1. Baseline schema review.
2. Existing photo/profile migrations review.
3. Alerts migrations review.
4. Any map/privacy migrations review.
5. Forward-fix/rollback documentation.

Cross-review:
- Reviews all Wave 1 PRs before merge.

## Wave 2 workstreams

### `codex/trauma-accessibility`

Primary ownership:
- family-facing copy and component accessibility fixes
- accessibility tests
- docs related to trauma-informed review

Dependencies:
- Begins after Wave 1 stabilizes major flows.
- Reviews forms, profiles, flyers, alerts, and map/list.

### `codex/operations-release`

Primary ownership:
- release runbooks
- monitoring/backup/restore/incident docs
- release checklist updates

Dependencies:
- Begins after Wave 1 architecture is known.
- Must record staging rehearsal, backup/restore rehearsal, independent review, and final go/no-go process.

## Merge order

1. `codex/foundation-ci`
2. `codex/security-audit` baseline findings that do not depend on alerts/map
3. `codex/alerts-v1`
4. `codex/map-v1`
5. `codex/security-audit` final RLS/storage/security follow-up
6. `codex/trauma-accessibility`
7. `codex/operations-release`

No PR may merge until CI passes, review is complete, synthetic data only is confirmed, and the PR includes the MMIPS task report.
