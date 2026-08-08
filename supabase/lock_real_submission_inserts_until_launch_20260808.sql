-- Applied to production on 2026-08-08 while Vercel deployment capacity was exhausted.
-- Purpose: enforce the documented launch decision at the database boundary so the
-- currently deployed submission route cannot persist a real submission before the
-- reviewed application-side release controls reach production.
--
-- This is intentionally narrow: moderation SELECT/UPDATE access remains unchanged,
-- correction/removal intake remains unchanged, and existing submissions are untouched.
--
-- Before a protected synthetic submission rehearsal can write to this shared project,
-- restore INSERT only through a separate reviewed migration after the application-side
-- real/synthetic environment gates are deployed and verified.

revoke insert on table public.submissions from service_role;
