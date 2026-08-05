# MMIPS Version 1 Full Release Specification

Version 1 is a complete public launch readiness target, not a partial launch, demo, or soft-launch exception. Real submissions may not be enabled until all release gates pass and a human go/no-go decision is recorded.

## 1. Family submission journey

- Families and authorized submitters can understand what MMIPS is, what it is not, what may become public, and what remains private before entering information.
- The submit form must accept only information needed for review and public-awareness decisions.
- Emergency and official-reporting guidance must appear before and during submission.
- Submissions must enter a private pending-review state by default.
- Submitters must confirm authority/permission, no rumors or public accusations, and understanding of moderation.

## 2. Multiple-photo permissions

- The submission journey supports multiple photos with per-photo purpose, caption, alt text, and permission choices.
- Photos remain private until a moderator explicitly approves use on a public profile or flyer.
- At least one permission confirmation is required before accepting uploaded images.
- Public display must respect profile/flyer permissions and avoid exposing private or sensitive imagery.

## 3. Review-before-submit

- Submitters must see a review screen before final submission.
- The review screen must clearly separate public candidate information from private reviewer-only information.
- Submitters must be able to go back and revise entries without losing work.

## 4. Confirmation and reference number

- Successful submissions must show a calm confirmation page with a unique reference number.
- Confirmation must explain that nothing is public yet and describe expected next steps.
- A confirmation email should be sent when email is configured, without exposing private details unnecessarily.

## 5. Moderator review and publication

- Moderators must authenticate and be allowlisted.
- Moderators can view pending submissions, private requester information, private notes, uploaded photos, and safety confirmations.
- Publication requires explicit approval, documented review notes, public-safe profile fields, and verified/family-authorized public contact information.
- Public records must be written only after moderation.

## 6. Request-more-information process

- Moderators can move a submission to needs-more-information with a reason and requested fields.
- Family/authorized contacts receive a trauma-informed message explaining what is needed and why.
- The public site must not reveal needs-more-information status for private submissions.

## 7. Correction, urgent hiding, and removal

- Families, authorized advocates, tribal representatives, law enforcement, and official contacts can request corrections, urgent hiding, consent review, or removal.
- Urgent safety concerns must support immediate temporary hiding while review continues.
- All correction/removal actions must be logged with reviewer, reason, timestamp, and public/private impact.

## 8. Published-profile status transitions

- Supported public statuses include missing, urgent public awareness, murdered/unsolved information-needed, unidentified, resolved/located, hidden, and removed.
- Status transitions must preserve audit history and avoid exposing private historical details.
- Resolved/located profiles must be handled with family control and careful wording.

## 9. Public profile, flyer, QR, and sharing

- Approved profiles have public pages with neutral language, official tip contacts, verification indicators, approximate public location text, and correction/removal links.
- Printable/downloadable flyers must use only approved public fields and approved photos.
- QR codes and share links must point to live public profiles/flyers.
- Sharing copy must discourage rumors and route tips to official contacts.

## 10. Working email-alert double opt-in and unsubscribe

- Visitors can subscribe to location/category-based alerts using double opt-in.
- Alerts are sent only after confirmation.
- Every alert includes a one-click unsubscribe link and mailing address/policy language as required.
- Subscriber data remains private and is not shown in public pages or logs.

## 11. Privacy-safe interactive public map plus accessible list

- The map shows only approximate, approved, safety-filtered public areas.
- Exact addresses, private last-known locations, shelters, trafficking-risk locations, witness locations, and sensitive minor locations are never mapped publicly.
- An accessible list provides the same public profile discovery as the visual map.
- Map controls and result lists must be keyboard accessible and screen-reader usable.

## 12. Security and RLS requirements

- Supabase Row Level Security must be enabled for all tables containing submission, requester, subscriber, audit, moderation, photo, and profile data.
- Anonymous users may read only approved public profiles and approved public profile photos.
- Inserts and privileged reads/writes happen through server routes with service-role credentials only.
- Admin access requires authentication plus explicit allowlist or role authorization.

## 13. File-upload security

- Uploads enforce type allowlists, size limits, private pending-review storage, unique object paths, and no public access before approval.
- Public copies must be created only after moderation.
- Upload metadata must not leak private original context.
- Malware scanning or equivalent compensating controls must be defined before launch.

## 14. Automated testing

- Version 1 requires unit, integration, end-to-end, accessibility, and security checks in CI.
- Tests must use synthetic data only.
- Critical flows include submission, moderation, correction/removal, alerts opt-in/unsubscribe, map privacy, public profile/flyer rendering, and auth failure cases.

## 15. Separate staging and production systems

- Staging and production must use separate Supabase projects, storage buckets, email domains/provider configuration, Turnstile keys, and deployment targets.
- Staging must never contain real family or investigative data.
- Production secrets must never be available to Codex tasks.

## 16. Monitoring

- Monitor production health, failed submissions, failed email sends, admin errors, storage failures, and security-relevant events.
- Alerts must reach designated human operators.
- Logs must avoid secrets and unnecessary personal information.

## 17. Database and storage backups

- Production database and storage backups must be scheduled, encrypted, access-controlled, and periodically exported for encrypted disaster recovery.
- Backup coverage must include private submissions, public profiles, audit logs, subscriber data, and storage objects.

## 18. Actual restore rehearsal

- Before launch, run and document a restore rehearsal into an isolated non-production environment.
- Verify database records, storage objects, RLS policies, and application functionality after restore.

## 19. Incident response

- Define triage, containment, public/private communication, family notification, credential rotation, evidence preservation, and post-incident review steps.
- Include special handling for accidental public exposure of private/sensitive information.

## 20. Moderator operations

- Moderators need written procedures for intake review, verification, publication, urgent hiding, corrections, takedowns, family contact, and escalation.
- Moderation must include calm language, least-public-information decisions, and clear handoffs.

## 21. Independent family-support or victim-services review

- A qualified family-support, Indigenous community, victim-services, legal, or comparable reviewer must evaluate Version 1 before real submissions are enabled.
- Findings must be tracked and either resolved or explicitly accepted by project leadership.

## 22. Explicit final go/no-go decision

- Real submissions remain disabled until all release gates are reviewed.
- A named human decision-maker must record a final go/no-go decision with date, remaining risks, and launch scope.
