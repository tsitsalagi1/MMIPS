# MMIPS Form and Error-Recovery Audit

Source review only. No browser behavior is claimed as passing.

## Family-facing forms reviewed

- Submission form: `app/submit/page.tsx`, `components/ProfileTypeFields.tsx`, `components/PhotoPermissionUpload.tsx`, `components/TurnstileWidget.tsx`, `app/api/submissions/route.ts`
- Correction/removal form: `app/corrections/page.tsx`, `app/api/corrections/route.ts`
- Alerts placeholder: `app/alerts/page.tsx`

## Submission form findings

| Area | Source evidence | Determination | Risk | Recommendation | Release-blocking |
|---|---|---|---|---|---|
| Persistent labels | Inputs are generally wrapped in labels | Confirmed source strength | Some labels carry too much text | Keep labels; add separate help text | Medium |
| Required/optional | HTML `required` used; optional sometimes in label | Partial | Users may not know why optional/required | Add visible required/optional and why-requested help per section | Critical |
| Field grouping | Headings and grids exist | Partial | No fieldsets/legends for related radio/checkbox groups confirmed | Add semantic fieldsets/legends | High |
| Heading structure | h1/h2/h3 present | Likely adequate | Needs rendered audit | Verify and adjust | Medium |
| Input types | email, number, date, file used | Partial | Phone lacks `type="tel"`; autocomplete absent | Add types/autocomplete after privacy review | High |
| Autocomplete | Not found in reviewed form source | Confirmed gap | Harder completion for disabled/stressed users | Add safe autocomplete (`name`, `email`, `tel`) where appropriate | High |
| Error summaries | Query error banner only | Confirmed gap | Errors may be missed; data loss after server redirect | Add summary with links/focus | Critical |
| Inline errors | Browser native only; source no inline server field errors | Confirmed gap | Repeated failure | Add inline errors and suggestions | Critical |
| Focus movement | No source focus logic except submit disabling | Confirmed gap | Screen-reader/keyboard users may not know error | Move focus to error summary/status after failure | Critical |
| Error suggestions | Placeholder guidance only | Partial | Unclear recovery | Plain suggestions for missing fields, files, Turnstile, network | Critical |
| Data preservation | Plain POST redirects on errors | Likely gap | Re-entering traumatic details | Preserve non-file fields; explain file reattachment limits | Critical |
| Uploaded files | Browser cannot preserve after server redirect; no source recovery | Confirmed likely gap | Photos lost after error | Client-side review/upload staging or explicit reattach guidance | Critical |
| Duplicate submission | Submit button not generally guarded; photo component can disable | Likely gap | Duplicate private submissions | Add loading/disabled state and idempotency/reference handling | High |
| Loading states | None visible for server form submit | Confirmed gap | Uncertainty | Add calm submitting state | High |
| Timeout/provider failure | Turnstile/API errors redirect with query | Confirmed likely gap | Repeated entry and anxiety | Dedicated error route/status preserving state | Critical |
| Back navigation | Single page; no multi-step review | Source cannot ensure state | Risk of loss | Add review screen with edit/back preserving data | Critical |
| Review-before-submit | Not present in current source | Confirmed gap | Users may publish candidates accidentally | Implement required review screen later | Critical |
| Final wording | Button `Submit for review` | Partial | Does not say private or final | Use final button only after review: "Send private submission for review" | High |
| Reference number | Confirmation route has no visible unique reference | Confirmed gap | Follow-up confusion | Show generated reference number | Critical |
| Withdrawal/correction | Correction route exists but not linked on confirmation source reviewed | Partial | Hard to correct/remove | Add clear correction/urgent-hide path on confirmation | Critical |

## Correction/removal form findings

- Likely strengths: dedicated route, requester information, request type choices, and received page.
- Likely gaps: no browser-verified inline errors, no urgent hide SLA, no reference number, no data preservation evidence, and no immediate-hiding operational promise unless staffing exists.
- Recommended: distinguish correction, consent review, removal, and urgent safety concern; add "If someone is in immediate danger, contact emergency/official authorities first"; provide reference number and private handling statement.

## Alerts placeholder findings

- The form uses email/area/checkbox but button is `type="button"` and no backend is present.
- This is release-blocking because it presents an action that does not work. Until Alerts V1 exists, the UI should clearly say alerts are not available and should not collect input.

## Browser verification still required

- HTML5 validation message behavior and language.
- Screen-reader announcement of labels, errors, status, disabled submit, Turnstile.
- Keyboard tab order and focus after errors.
- Mobile viewport, 200% zoom, target size, and virtual keyboard behavior.
- Slow network, failed upload, failed Turnstile, failed Supabase, duplicate submit, and back/refresh behavior.
