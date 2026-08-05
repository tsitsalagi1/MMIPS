# MMIPS Accessibility and Trauma-Informed Test Plan

Use synthetic scenarios only. Do not use real family, victim, witness, requester, moderator, subscriber, law-enforcement, or exact-location data.

| Test | Prerequisites | Synthetic scenario | Steps | Expected behavior | Evidence | Privacy restrictions | Release gate | Automation | Human mandatory |
|---|---|---|---|---|---|---|---|---|---|
| Automated browser accessibility scan | Staging with synthetic data, axe/Playwright configured | Demo missing-person profile with approximate area | Crawl home, submit, corrections, profiles, flyer, alerts, map, admin | No critical/serious automated violations; no conformance claim | Axe reports/screenshots | Redact submitted details | WCAG/source gate | Yes | Review results yes |
| Keyboard-only submission | Browser build | Synthetic family submitter | Tab through form, choose photos, trigger errors, submit | Logical order, visible focus, no trap, errors reachable | Video/notes | Synthetic only | WCAG/trauma | Partially | Yes |
| Screen-reader submission | NVDA/JAWS/VoiceOver | Same synthetic case | Read headings, fields, help, errors, confirmation | Labels/help/errors announced; no surprise publication | Transcript/notes | Synthetic only | WCAG | No | Yes |
| 200% zoom | Browser | All public routes | Zoom to 200%, complete tasks | No horizontal loss, controls visible | Screenshots | Synthetic public data | WCAG | Partially | Yes |
| Narrow mobile viewport | 320px/390px | Public and form flows | Navigate and submit/correct | Reflow, target sizes, readable content | Screenshots/video | Synthetic | WCAG | Yes | Review yes |
| Reduced motion | OS/browser setting | Share/download/profile | Toggle reduced motion | No essential motion or unpaused animation | Notes | N/A | WCAG | Partially | Yes |
| Contrast | Final CSS/build | All states incl. warning/error/focus | Measure text, controls, focus, status badges | AA contrast for normal/large/non-text | Tool output | N/A | WCAG | Yes | Review yes |
| Form error recovery | Staging with synthetic API failures | Missing required fields, bad file, no Turnstile | Submit invalid/failed form | Error summary, inline errors, preserved non-file data, file reattach guidance | Screenshots/log ids without secrets | No private real data | Submission journey | Yes | Yes |
| Timeout/provider failure | Controlled Turnstile/Supabase/email failures | Synthetic submitter | Expire token, disable provider, slow response | Calm failure, no public data, retry without full re-entry | HAR redacted/notes | No tokens/secrets | Security/UX | Partially | Yes |
| Slow network | Browser throttling | Synthetic long form | Upload allowed demo image and submit | Loading state, duplicate prevention, recovery | Video | Synthetic image | UX/accessibility | Yes | Yes |
| Duplicate submit | Staging API | Synthetic form | Double click/refresh/back after submit | One submission/reference or idempotent handling | Test logs | Synthetic | Reliability/privacy | Yes | Review yes |
| Save-and-return | When implemented | Partially completed synthetic submission | Leave and resume | Clear privacy model and resume without data loss | Test evidence | No sensitive real data | Future gate | Yes | Yes |
| Profile/flyer | Synthetic approved profile | Missing/located/murdered/unidentified profiles | View, print, download, share | Neutral wording, dates, official contact, correction/removal, accessible text alternative | Screenshots/PDF/JPEG | Public synthetic only | Profiles/flyers | Yes | Yes |
| Alerts | Alerts V1 implemented | Synthetic subscriber | Subscribe, confirm, unsubscribe | Double opt-in, accessible emails/forms, private subscriber data | Emails redacted | Synthetic inbox only | Alerts | Yes | Yes |
| Map/list parity | Map V1 implemented | Multiple synthetic approximate areas | Use map and list by keyboard/SR | Same discoverability, no exact locations | Screenshots/axe/notes | Approximate synthetic only | Map | Yes | Yes |
| Admin consequential actions | Staging admin synthetic account | Publish/hide/remove/request more info | Complete actions with keyboard and SR | Checklist, preview, reason, confirmation, audit, no accidental action | Screen recording redacted | Synthetic admin only | Moderation | Partially | Yes |
| Independent trauma review | Reviewer agreement/support | Synthetic family journey | Reviewer completes supported walkthrough | Findings recorded without requiring personal disclosure | Severity log | Confidential notes, no real stories | Independent review | No | Yes |

## Evidence handling

- Store only synthetic screenshots, reports, and redacted logs.
- Do not capture secrets, tokens, production credentials, real emails, real phone numbers, exact private locations, or real personal narratives.
- Label each artifact with date, environment, commit, route, tool, and reviewer role.
