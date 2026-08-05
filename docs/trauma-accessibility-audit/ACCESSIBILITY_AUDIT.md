# MMIPS WCAG 2.2 AA Source-Level Accessibility Audit

Source review only. Do not treat this as WCAG conformance evidence. Browser, keyboard, screen-reader, zoom, and contrast testing remain mandatory.

## Classification key

- Confirmed from source: directly visible in code.
- Likely from source: source suggests issue but browser rendering must verify.
- Requires browser/keyboard/screen-reader/contrast/user verification: cannot be concluded from code alone.

## Findings by topic

| Topic | Evidence | Classification | WCAG 2.2 AA area | Risk | Recommendation | Release-blocking |
|---|---|---|---|---|---|---|
| Page titles | `app/layout.tsx` metadata only needs route-specific review | Likely from source | 2.4.2 Page Titled | Routes may share generic title and reduce orientation | Add route-specific metadata or title pattern in remediation | High |
| Language declaration | Layout source needs verification for `<html lang>` | Confirmed/verify in source | 3.1.1 Language of Page | If present, low; if absent, high | Preserve/ensure `lang="en"`; test rendered DOM | High if absent |
| Landmarks | Pages use `<main>` | Confirmed from source | 1.3.1, 2.4.1 | Good baseline; skip link still needed | Add skip link and verify landmarks in browser | High |
| Heading order | Source uses h1 then h2/h3 mostly | Likely from source | 1.3.1, 2.4.6 | Dynamic cards/forms may create long heading jumps | Browser audit all routes | Medium |
| Form labels | Many inputs wrapped in labels | Confirmed from source | 1.3.1, 3.3.2 | Good baseline; generated/client controls need names verified | Run accessible-name scan | High |
| Instructions | Instructions exist, but required/optional is inconsistent | Confirmed from source | 3.3.2, 3.3.7 | Users may not know optional fields or why asked | Add field-level help and required indicators | Critical for submission |
| Error identification | Top-level error query and some role=alert messages | Confirmed from source | 3.3.1, 3.3.3 | No field-level errors or summary focus from source | Add error summary, inline errors, focus management | Critical |
| Status messages | Photo/copy/download statuses appear as text; not all `aria-live` | Likely from source | 4.1.3 Status Messages | Screen readers may miss copy/download changes | Add `role="status"`/`aria-live` where appropriate | High |
| Focus visibility | CSS must be visually measured | Requires visual/keyboard verification | 2.4.7, 2.4.11 | Unknown | Measure focus contrast and obscuration | Critical before launch |
| Keyboard access | Mostly native controls; canvas/download/share actions need testing | Requires keyboard verification | 2.1.1, 2.1.2 | Unknown for Turnstile, share, print/download | Full keyboard test matrix | Critical |
| Skip links | No skip link found in reviewed source | Confirmed from source | 2.4.1 | Repeated navigation may slow keyboard users | Add visible-on-focus skip link | High |
| Dialog behavior | No dialogs observed | Confirmed from source | 2.1.2/2.4.3 if later added | N/A current | Test if future alerts/map modals added | N/A |
| Button/link names | Mostly descriptive; alert button says Join alert list but is inert | Confirmed from source | 2.4.4, 4.1.2 | Misleading control | Disable with unavailable explanation or implement | Critical/Alerts |
| Images and alt text | Logo and profile images have alt; decorative handling varies | Likely from source | 1.1.1 | Placeholder/person alt needs content review | Verify alt text is useful and non-identifying beyond approval | High |
| Color-only communication | Status badges/cards may rely partly on color | Likely from source | 1.4.1 | Unknown until visual test | Ensure text labels/icons not color-only | High |
| Contrast | CSS colors require measurement | Requires contrast measurement | 1.4.3, 1.4.11 | Unknown | Use axe/contrast tools across themes/states | Critical |
| Motion | No major animation found in source, but loading/Turnstile unknown | Requires browser verification | 2.2.2, 2.3.3 | Unknown | Test reduced motion and third-party widgets | Medium |
| Reflow/zoom | Responsive CSS source review insufficient | Requires zoom/reflow verification | 1.4.10, 1.4.4 | Unknown for cards, flyers, admin tables | 320px and 200% tests | Critical |
| Target size | Buttons/checkboxes need measurement | Requires visual verification | 2.5.8 Target Size | Unknown | Measure touch targets, especially checkboxes/upload/photo cards | High |
| Authentication accessibility | Admin Supabase auth and Turnstile need testing | Requires keyboard/screen-reader verification | 3.3.8 Accessible Authentication | Unknown | Test login without cognitive puzzle barriers | Critical/admin |
| Time limits | No explicit app timeout; Turnstile/session unknown | Requires browser/provider verification | 2.2.1 | Unknown | Document and test token/session expiration recovery | High |
| Repeated entry | No save/return or review step source evidence | Confirmed from source | 3.3.7 Redundant Entry | Users may re-enter after errors | Add preservation/review/save-later | Critical |
| Accessible help | SafetyNotice exists; field-level help partial | Likely from source | 3.3.5, 3.3.6 | Users lack contextual help | Add inline private/public/why text and support links | High |
| Map alternatives | Current map is list only; future interactive map needs parity | Confirmed from source | 1.1.1, 2.1.1, 1.3.1 | Current title promises map; list is accessible conceptually but not complete V1 | Implement map/list parity after Map workstream | Critical/Map |
| Flyer accessibility | JPEG/canvas flyer download is image-only | Confirmed from source | 1.1.1, 1.4.5 | Shared flyer image may be inaccessible | Provide accessible HTML/text/PDF alternative and alt guidance | Critical |

## Route verification matrix

- Homepage: browser axe, keyboard tab order, landmarks, focus, contrast.
- Submit: axe, keyboard, screen reader, browser validation, server errors, Turnstile failure, upload failure, 200% zoom, mobile.
- Corrections: axe, keyboard, error recovery, urgent safety wording, confirmation.
- Profiles/flyers/share: accessible names, image alt, status text, download alternatives, print/PDF.
- Alerts: inert UI honesty and future double opt-in accessibility.
- Map/list: list parity, keyboard controls when map exists, no exact location exposure.
- Admin: keyboard and screen-reader review for high-risk actions, focus after status changes, table/card navigation, cognitive load.
