# Map staging verification plan

Status: static plan only. Do not use production/staging credentials or real data. The migration is **STATIC REVIEW ONLY — NOT EXECUTED**.

In an isolated synthetic Supabase project, later verify RLS exposes only approved non-hidden approximate points linked to approved published cases; public roles cannot read moderation fields or write map points. Inspect responses for absence of raw coordinates, addresses, contacts, notes, evidence, and photos. Never weaken RLS.

After a provider is formally approved, configure only its reviewed HTTPS style and exact request origins plus required attribution. With browser developer tools and CSP reporting, inventory style/source/tile/glyph/sprite/image/worker requests, confirm lookalike and unlisted origins fail, ensure URLs/bodies are not logged, and derive narrow CSP directives without wildcards or `unsafe-eval`.

Using synthetic points, test MapLibre creation, feature/list/filter parity, keyboard tab order and zoom, no scroll capture, selected-summary announcement, reduced motion, WebGL2 disabled/context loss, constructor and initial-style failure, JavaScript disabled, provider outage, zoom/reflow, and supported browsers/screen readers. Browser/provider/CSP and live RLS verification are not complete in this implementation environment.
