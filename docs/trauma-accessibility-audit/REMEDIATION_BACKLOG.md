# MMIPS Trauma-Informed UX and Accessibility Remediation Backlog

Implementation-ready planning only. Do not treat as completed work.

## Can be fixed after Security merges

| ID | Title | Severity | Affected user | Affected page/file/component | Evidence | Principle | WCAG | Recommended implementation | Dependency | Likely files | Test required | Acceptance criteria | Release-blocking | Future workstream |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TA-001 | Add review-before-submit with public/private separation | Critical | Family/authorized submitter | `app/submit/page.tsx`, submission API | Form posts directly to API | Safety, transparency, choice | 3.3.4, 3.3.7 | Multi-step review showing public candidate vs private reviewer-only data; back/edit without loss | Security | submit components/API | E2E, SR, keyboard | User reviews, edits, and final-sends private submission; no auto-publication | Yes | trauma-accessibility |
| TA-002 | Add reference number and clear next steps | Critical | Submitter | `app/submit/received/page.tsx`, API | Confirmation lacks visible reference | Trustworthiness | 3.3.1/Status N/A | Generate/display reference; explain nothing public; correction/urgent hide path | Security | API/received page | Integration/E2E | Every successful synthetic submission has reference shown and emailed if configured | Yes | trauma-accessibility |
| TA-003 | Data-preserving error recovery | Critical | Submitter | Submit/corrections/API | Redirect errors likely lose data | Empowerment | 3.3.1, 3.3.3, 3.3.7 | Return structured errors; preserve fields; file reattach guidance; focus summary | Security | forms/API | E2E/browser | Failed submit keeps safe data and explains next step | Yes | trauma-accessibility |
| TA-004 | Accessible CAPTCHA/Turnstile failure path | Critical | Disabled/stressed submitter | `components/TurnstileWidget.tsx`, APIs | Widget only, no help path | Safety/equity | 2.1.1, 3.3.8 | Add help, retry, no-data-loss timeout handling, documented alternative | Security/Ops | Turnstile/form/API | Keyboard/SR/provider failure | User can recover without total re-entry | Yes | trauma-accessibility |
| TA-005 | Required/optional and why-requested help | High | Submitter | Submission/correction forms | Required attrs but inconsistent explanation | Transparency | 3.3.2, 3.3.5 | Add per-section help, visible required markers, privacy labels | None | forms/components | Axe/SR | Required and optional are announced and visually clear | Yes | trauma-accessibility |
| TA-006 | Safer location intake wording | Critical | Submitter/profile subject | Location fields | Public location text required | Safety/privacy | 3.3.2 | Persistent approximate-location instruction; block/flag exact-address patterns for review | Security/Map | submit/profile/admin | Unit/static/E2E | Users see do-not-enter-exact-private guidance | Yes | trauma-accessibility |
| TA-007 | Photo caption/privacy safeguards | Critical | Submitter/profile subject | `PhotoPermissionUpload`, admin photo review | Identifying-mark captions | Safety, choice | 1.1.1, 3.3.2 | Separate reviewer caption vs public alt/caption; warn about sensitive image details | Security/Ops | upload/admin/profile | E2E/SR | Public photo metadata only after explicit approval | Yes | trauma-accessibility |
| TA-008 | Skip link and focus-visible verification | High | Keyboard users | Layout/CSS | No skip link found | Accessibility | 2.4.1, 2.4.7, 2.4.11 | Add skip link and robust focus styles | None | layout/CSS | Keyboard/contrast | Skip link works; focus visible on all controls | Yes | trauma-accessibility |
| TA-009 | Status messages for dynamic controls | High | Screen-reader users | Photo/share/flyer controls | Status text not consistently live | Accessibility | 4.1.3 | Add `role=status`/`aria-live` and test | None | components | SR/browser | Copy/download/photo state announced | Yes | trauma-accessibility |
| TA-010 | Accessible flyer alternative | Critical | Public/community | `ShareButtons`, `FlyerActions`, profile/flyer routes | JPEG/canvas image-only | Accessibility, safety | 1.1.1, 1.4.5 | HTML text flyer, printable semantic version, meaningful alt, no image-only essential info | None | flyer/share/profile | Axe/SR/print | Flyer content available as accessible text | Yes | trauma-accessibility |

## Depends on Alerts

| ID | Title | Severity | Affected user | Affected page/file/component | Evidence | Principle | WCAG | Recommended implementation | Dependency | Likely files | Test required | Acceptance criteria | Release-blocking | Future workstream |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TA-011 | Replace inert alerts form with honest state or double opt-in | Critical | Subscriber/family/community | `app/alerts/page.tsx` | Button is non-submitting | Trustworthiness | 3.3.2, 4.1.2 | If not implemented, label unavailable; if implemented, double opt-in/unsubscribe with privacy copy | Alerts | alerts routes/API/email | E2E/email/a11y | No false affordance; subscriber data private | Yes | alerts-v1/trauma |
| TA-012 | Accessible alert consent and unsubscribe copy | High | Subscriber | Alerts pages/emails | Future functionality | Transparency | 3.3.2 | Plain consent, frequency/scope, unsubscribe, privacy statement | Alerts/Legal | alerts/email | SR/email tests | Consent and unsubscribe understandable | Yes | alerts-v1 |

## Depends on Map

| ID | Title | Severity | Affected user | Affected page/file/component | Evidence | Principle | WCAG | Recommended implementation | Dependency | Likely files | Test required | Acceptance criteria | Release-blocking | Future workstream |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TA-013 | Implement map/list parity without exact locations | Critical | Public/families | `app/map/page.tsx` | Current list placeholder | Safety/accessibility | 1.3.1, 2.1.1 | Interactive approximate map plus equivalent list, filters, no exact pins | Map/Security | map/lib cases | E2E/security/a11y | Same profiles discoverable via map and list; exact locations absent | Yes | map-v1 |
| TA-014 | Rename placeholder until map exists | High | Public | `app/map/page.tsx` | Page says public map | Trustworthiness | 2.4.2 | Use honest title/description if map delayed | Map | map page | Browser copy review | No overpromise | Yes if map delayed | trauma/map |

## Depends on Operations/staffing

| ID | Title | Severity | Affected user | Affected page/file/component | Evidence | Principle | WCAG | Recommended implementation | Dependency | Likely files | Test required | Acceptance criteria | Release-blocking | Future workstream |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TA-015 | Urgent hide/removal operational flow | Critical | Family/safety requester | Corrections/admin | Generic correction flow only | Safety | N/A | Dedicated urgent safety request, moderation queue, SLA, escalation, temporary hide authority | Operations/Security | corrections/admin/docs | E2E/admin drill | Urgent synthetic request can hide public item rapidly with audit | Yes | operations/security/trauma |
| TA-016 | Needs-more-information family response flow | Critical | Submitter | Admin/submission | Status exists but family flow not confirmed | Collaboration | 3.3.2 | Templates, requested fields, secure response, no public status leak | Operations/Security | admin/API/forms/email | Integration/SR | Family receives clear request and can respond | Yes | operations/trauma |
| TA-017 | Moderator checklist and cognitive-load controls | Critical | Moderator/families | `AdminDashboard` | High-risk data in dashboard | Safety/recoverability | 2.4.6 | Queue, checklist, preview, reason-required actions, audit context | Operations/Security | admin/API | Admin E2E/SR | Publish/hide/remove cannot happen accidentally | Yes | security/trauma |

## Requires legal or policy review

| ID | Title | Severity | Affected user | Affected page/file/component | Evidence | Principle | WCAG | Recommended implementation | Dependency | Likely files | Test required | Acceptance criteria | Release-blocking | Future workstream |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TA-018 | Review consent/authorization wording | High | Submitter | `app/submit/page.tsx`, policies | Dense legal-style confirmations | Trust | 3.3.2 | Legally reviewed plain-language checklist and policy links | Legal | submit/policy docs | Content review/SR | Wording is understandable and legally approved | Yes | legal/trauma |
| TA-019 | Policy plain-language summaries | High | Public/families | Policy pages | Legal pages exist, final status unknown | Transparency | 3.1.5 advisory | Add summary boxes marked non-substitute for legal text | Legal | policy pages | Content/a11y | Families can understand core privacy/safety terms | Yes | legal/trauma |

## Requires independent human review

| ID | Title | Severity | Affected user | Affected page/file/component | Evidence | Principle | WCAG | Recommended implementation | Dependency | Likely files | Test required | Acceptance criteria | Release-blocking | Future workstream |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| TA-020 | Independent trauma-informed/cultural/accessibility review | Critical | Families/communities/disabled users | Whole app | Required by release spec | Cultural respect | All relevant | Conduct supported synthetic-scenario review; track findings | Independent reviewers/Ops | docs/backlog/app later | Human review | Critical findings resolved or formally block launch | Yes | operations-release |
| TA-021 | Profile/flyer language review for resolved/located/murdered/unidentified statuses | Critical | Families/public | Profiles/flyers/status | Sensitive public status wording | Retraumatization resistance | N/A | Human review of status labels, update dates, contact/tip language | Human/legal/Ops | status/profile/flyer | Human + browser | No blaming/speculation/unsafe language | Yes | trauma-accessibility |
