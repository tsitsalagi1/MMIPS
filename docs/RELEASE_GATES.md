# MMIPS Version 1 Release Gates

Each gate is binary: complete every item or do not enable real submissions.

## Repository controls

- [ ] All work is reviewed through pull requests.
- [ ] No direct commits to `main`.
- [ ] No agent merges its own pull request.
- [ ] Branch protection or equivalent review controls are enabled.

## Reproducible installation

- [ ] A clean install command is documented; GitHub CI evidence is pending after this PR runs.
- [x] Required Node/runtime versions are documented.
- [x] Install uses the lockfile.

## Dependency lockfile

- [x] A dependency lockfile is committed.
- [x] Dependencies are pinned or reviewed for release stability.
- [x] Dependency audit/remediation policy is documented.

## CI

- [ ] CI runs on pull requests; workflow is configured and awaits GitHub run evidence.
- [ ] CI runs clean install, lint, type check, tests, build, and security checks where configured.
- [ ] CI blocks merge on required failures.

## Tests

- [x] Foundation unit tests cover selected production status/type pure logic; broader critical-flow coverage remains incomplete.
- [ ] Integration tests cover server routes and Supabase interactions with synthetic data. Current static contract tests are not live HTTP/database integration evidence.
- [ ] Browser E2E tests cover submission, moderation, profiles, flyers, alerts, map/list, and correction/removal. Current smoke checks are source/route-presence checks only.
- [x] Tests never use real family or investigative data.

## Security

- [ ] Secrets are absent from the repository.
- [ ] Production secrets are absent from Codex environments.
- [ ] Admin routes require authentication and authorization.
- [ ] Security headers and dependency scanning are reviewed. Baseline headers and local dependency audit were added/reviewed in `codex/security-audit`, but full CSP enforcement, GitHub audit evidence, manual penetration testing, and independent security review remain incomplete.

## RLS and storage access

- [ ] RLS is enabled on all sensitive tables. Static SQL now enables/reasserts RLS, but live isolated-database verification remains incomplete.
- [ ] Anonymous users can read only approved public records. Static policies and public loader allowlists were reviewed, but live anon-role tests remain incomplete.
- [ ] Pending submissions, correction requests, subscriber data, moderator notes, audit logs, private images, and authorization evidence are not public.
- [ ] Private storage buckets deny public reads. Static bucket posture is private for pending uploads, but live storage/object-policy verification remains incomplete. Bucket metadata must be configured through the approved Supabase Storage API/dashboard process, not direct application migration mutation.
- [ ] Public storage buckets contain only moderator-approved public assets. Code copies approved photos during moderation, but live storage contents/policies and cleanup are unverified. GIF uploads are deferred until secure image-processing controls exist.

## Submission journey

- [ ] Submitters see safety, privacy, emergency, and official-reporting notices.
- [ ] Review-before-submit exists.
- [ ] Confirmation includes a reference number.
- [ ] Submissions remain private until moderation.

## Moderation

- [ ] Moderators can approve, reject, request more information, hide, correct, and remove.
- [ ] Actions require notes and audit entries.
- [ ] Publication requires documented authorization and safety review.

## Profiles, flyers, and sharing

- [ ] Public profiles show only approved public information.
- [ ] Flyers use only approved public fields and photos.
- [ ] QR/share links point to public profile/flyer URLs.
- [ ] Share copy discourages rumors and points tips to official contacts.

## Alerts

- [ ] Double opt-in works.
- [ ] Unsubscribe works.
- [ ] Alert sends are logged without leaking unnecessary personal information.
- [ ] Alert scope respects family approval and map/location privacy.

## Map privacy

- [ ] Map uses approximate public locations only.
- [ ] Sensitive exact locations are never exposed.
- [ ] Accessible list alternative is available.

## Trauma-informed UX

- [ ] Family-facing language is calm, direct, non-blaming, and non-coercive.
- [ ] Forms minimize cognitive load and explain why information is requested.
- [ ] Users can pause, review, and correct before final submission.

## WCAG 2.2 AA

- [ ] Keyboard navigation works.
- [ ] Focus states are visible.
- [ ] Color contrast meets AA.
- [ ] Forms have labels and meaningful errors.
- [ ] Automated browser accessibility and manual accessibility checks are documented and completed. Current static baseline documentation is not WCAG 2.2 AA evidence.

## Monitoring

- [ ] App health and critical failures are monitored.
- [ ] Email, storage, submission, moderation, and auth failures alert operators.
- [ ] Logs avoid secrets and unnecessary sensitive personal data.

## Backup and restoration

- [ ] Database backups are scheduled and encrypted.
- [ ] Storage backups are scheduled and encrypted.
- [ ] Restore rehearsal is completed and documented.

## Final policies

- [ ] Terms, privacy, data policy, safety policy, correction/removal policy, photo permission policy, moderation policy, and alert consent policy are final and reviewed.

## Synthetic staging rehearsal

- [ ] Full launch rehearsal uses synthetic data only.
- [ ] Staging tests submission through removal, alerts, map/list, public sharing, backup, and restore.

## Final go/no-go approval

- [ ] Independent family-support/victim-services review is complete.
- [ ] Remaining risks are documented.
- [ ] Named human decision-maker records go/no-go before enabling real submissions.
