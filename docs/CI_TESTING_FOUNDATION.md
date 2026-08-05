# MMIPS CI and testing foundation

This foundation is intentionally conservative: it pins the toolchain already selected by the previous `latest` install, documents the Node runtime needed by that lockfile, and adds checks that require no production Supabase project or production credentials. It does **not** claim that Version 1 release testing is complete.

## Toolchain

- Node.js: `>=22.23.1 <23` via `package.json` engines and `.nvmrc` (`22.23.1`).
- npm: `>=10.9.0 <12` with `npm ci` from `package-lock.json`.
- Next.js: `16.3.0`.
- React / React DOM: `19.2.8`.
- TypeScript: `6.0.3`.
- ESLint: `9.39.5` with `eslint-config-next` `16.3.0` flat config.
- Unit-test framework: Node's built-in `node:test` runner against selected production TypeScript modules compiled into ignored `.test-dist/` output.
- Browser E2E framework: Not configured. Playwright should be added later when approved npm registry access is available.
- Accessibility framework: Static source baseline only. axe or equivalent browser accessibility scanning is not configured.
- Integration-test environment: Not configured. True database/HTTP integration testing requires an isolated synthetic staging Supabase project or approved local test database.

## Compatibility reasoning

Next.js 16 requires Node.js `20.9.0` or newer. The pinned Supabase JS package line requires Node 22 or later. Node 22 is therefore the selected compatible LTS line for MMIPS in this correction pass. Do not switch to Node 24 unless a concrete Node 22 incompatibility is found and documented in a dedicated dependency review.

## Clean installation

Use:

```bash
npm ci
```

Do not commit `node_modules`, `.next`, `.test-dist`, test videos, traces, local environment files, coverage output, TypeScript build info, or generated build artifacts.

## Commands

- `npm run dev` starts the local Next.js development server.
- `npm run build` runs a production Next.js build and TypeScript validation.
- `npm run start` starts the production server after a build.
- `npm run lint` runs ESLint flat config with zero warnings allowed.
- `npm run typecheck` runs `tsc --noEmit`.
- `npm run build:test-modules` compiles selected production TypeScript modules into ignored `.test-dist/` for Node tests.
- `npm run test:unit` runs unit tests against compiled production status/type logic.
- `npm run test:static` runs static source checks, including synthetic/demo public-data contract checks.
- `npm run test:contract` runs static authorization and build/rendering contract checks. It is not a live HTTP or database integration suite.
- `npm run test:security` runs security unit/static/contract checks, including upload validation, public-data minimization, admin guard coverage, storage-migration static contracts, safe API error patterns, and service-role browser-import boundaries. It is not live RLS/storage verification or penetration testing.
- `npm run test:smoke` runs no-browser public route/source smoke checks. It is not browser end-to-end testing.
- `npm run test:accessibility:baseline` checks static source patterns such as a homepage landmark and image alternative text. It is not an axe scan, keyboard test, screen-reader test, or WCAG conformance result.
- `npm run security:secrets` scans tracked text files for high-confidence accidental secret patterns.
- `npm run security:audit` runs online `npm audit --audit-level=high` and is used by GitHub Actions.
- `npm run security:audit:offline` is a limited local fallback for Codex environments where the npm advisory endpoint is unavailable. It is not current release-grade vulnerability evidence.
- `npm run verify` runs the foundation checks that can run in this workspace and uses the offline audit fallback. GitHub CI additionally runs the online audit command.

## Synthetic test data rules

All fixtures must be unmistakably synthetic or demo-only. Do not use real family, victim, witness, requester, moderator, investigative, agency case, subscriber, photo, exact-location, or private submission data. Exact or sensitive locations must remain private by default.

## Admin dashboard rendering contract

The initial production build failed while prerendering `/admin` because `AdminDashboard` initializes the browser Supabase client and public Supabase browser environment variables are not present in ordinary CI. `app/admin/page.tsx` exports `dynamic = "force-dynamic"` so the authenticated admin dashboard is server-rendered on demand rather than prerendered into static output. This is appropriate for an admin dashboard because admin content must not be public static content or cached as a public artifact. This flag does not expose admin data; API access still depends on bearer-token authentication and allowlisted admin email checks. The verification performed was `npm run build` plus `npm run test:contract`, including a source contract that asserts the route remains dynamic while the dashboard still initializes the browser Supabase client.

## Protected staging strategy

Ordinary CI must not require production secrets. Future protected staging suites may use a separate staging Supabase project with synthetic data only, separate buckets, separate email provider configuration, and protected GitHub environments. Those suites should fail honestly when staging configuration is requested but absent; they must not fake database security coverage.

## CI jobs and future branch protection

The workflow `.github/workflows/ci.yml` defines the check name `release-foundation-verify` for pull requests and pushes to `main`. The job uses `.nvmrc` through `actions/setup-node`, runs `npm ci`, then runs named steps for lint, typecheck, unit, static, contract, security, production build, smoke, accessibility baseline, secret-pattern scan, and online dependency audit. After review, branch protection should require this check before merge.

## Known coverage gaps

- Browser end-to-end testing is not configured.
- Playwright and axe packages were not added because the npm registry returned 403 responses for new packages in this workspace.
- axe or equivalent browser accessibility scanning is not configured.
- WCAG 2.2 AA is not verified; manual keyboard and screen-reader review remain required.
- No live or isolated-database integration test environment is configured.
- No live Supabase RLS, storage, email, Turnstile, or production deployment verification is performed.
- No full secret-scanning service such as GitHub secret scanning is configured by this repository change.
- Protected staging lifecycle tests remain future work.

## Updating dependencies safely

Use a dedicated PR. Review Node engine requirements, peer dependencies, framework release notes, and security advisories before changing versions. Run `npm install --package-lock-only` in the approved cloud environment, then `npm ci`, the named foundation checks, and GitHub CI online audit. Do not upgrade to `latest` blindly.

## Local reproduction for emergency backup only

Normal development, review, staging, and deployment remain cloud-based. If an encrypted disaster-recovery backup environment must reproduce CI, use Node 22.23.1, run `npm ci`, then run `npm run verify` without production credentials. Treat `security:audit:offline` output as limited local evidence only.
