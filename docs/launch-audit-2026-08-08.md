# MMIPS launch hardening audit — 2026-08-08

This branch is reserved for non-behavioral audit notes discovered while Vercel deployment capacity is exhausted. Behavioral fixes belong on focused branches with regression tests.

## Current production deployment gap

The latest successful production deployment is the ZIP-radius urgent-alert release. The subsequent Turnstile hostname fix is merged to `main` but has not reached production because the Vercel Hobby deployment quota is exhausted.

## Findings queued

- Invalid/incomplete urgent-alert geography can fall back to the legacy `all_public_alerts` category in `normalizePreferences`; focused fix prepared separately.
- Failed/partial urgent alert delivery rows are not actually reclaimable on a same-hour retry, and an empty retry invocation can incorrectly rewrite the event status to `sent`; focused fix planned separately.
- Production alert signup failures are handled as bounded 4xx responses, so grouped Vercel runtime *errors* can be empty even when users see a failure. Warning-level Turnstile diagnostics on the next deployment are needed to distinguish token rejection, action mismatch, hostname mismatch, configuration, rate-limit, and provider/network paths.

No production data or deployment state is changed by this note.
