# MMIPS Moderator UX Audit

Source review only. No authorization, API, SQL, or production behavior was modified.

## Evidence reviewed

- `app/admin/page.tsx`, `app/admin/AdminDashboard.tsx`
- Admin APIs under `app/api/admin/**` when present from source search
- Public profile/correction data shapes referenced by `AdminDashboard`

## Findings

| Area | Source-level determination | Trauma/accessibility risk | Recommendation | Release-blocking |
|---|---|---|---|---|
| Private/public separation | Dashboard types include raw submission, submitter, photos, public profile edit state | Private/public data are adjacent; accidental publication risk | Add prominent public/private sections, public preview, and "will be public" labels | Critical |
| Public preview | Public profile edit state exists; source evidence of a full preview before publish requires deeper browser test | Moderators may approve without seeing family-facing view | Require preview matching public page/flyer before publish | Critical |
| Approval checklist | Not confirmed as complete | Cognitive overload and missed safety checks | Mandatory checklist: authority, no exact sensitive location, official/family-approved contact, photo permissions, no accusations, family-sensitive status wording | Critical |
| Request-more-information | Status label exists; complete workflow not confirmed | Families may receive unclear or retraumatizing requests | Build reason/requested-fields templates and family-facing response route | Critical |
| Reject flow | Status label exists; notes/workflow not confirmed | Harmful or unexplained rejection | Require calm reason, private note, and non-public status | High |
| Publication confirmation | Not confirmed | Accidental public exposure | Require deliberate confirmation for publish with consequences | Critical |
| Edit reason | Not confirmed | Audit/recoverability gap | Require edit reason for public changes | Critical |
| Status transitions | Labels include pending, needs_more_info, approved, rejected, hidden | Some support exists | Transitions may not enforce allowed paths/consequences | Display transition warnings and allowed next states | High |
| Urgent hide/removal | Hidden label exists; immediate operational flow not confirmed | Acute safety risk | Dedicated urgent hide action with reason, second check where safe, and escalation log | Critical/Operations |
| Correction review | CorrectionRequest type exists | Good baseline but needs flow verification | Queue, compare requested change to current public fields, preview result | Critical |
| Photo approval | Photo metadata fields exist | Adjacent private images/captions may be accidentally public | Per-photo approval toggles, public alt/caption review, no filename leakage | Critical |
| Audit history visibility | Not confirmed | Moderators lack context and recoverability | Show audit history without exposing it publicly | Critical/Security |
| Consequence warnings | Not confirmed | Accidental high-risk changes | Consequence banners for publish, hide, remove, photo publish, status resolved/located | Critical |
| Accidental-action prevention | Not confirmed | One-click public impact | Require confirmation and idempotency for consequential actions | Critical |
| National-volume usability | Dashboard likely lists many items client-side | Overload at scale | Filters, queue priority, status counts, age of request, urgent safety queue | High/Operations |
| Accessibility | Client dashboard with dynamic state needs manual testing | Keyboard/SR barriers could block moderators with disabilities | Keyboard, screen-reader, zoom, target-size tests for all admin flows | Critical |

## Moderator release blockers

1. Public/private separation and preview before publication.
2. Required approval checklist and edit reasons.
3. Urgent hide/removal operational workflow.
4. Correction/request-more-information family communication flow.
5. Audit history and recoverability visibility.
6. Keyboard/screen-reader verification of consequential admin actions.
