# Urgent alert delivery retry audit — 2026-08-08

## Finding

The current urgent-alert send path can leave an event in `partial` or `failed` when one or more provider sends fail. A later retry in the same hourly event window calls `claimDelivery()` again, but existing `(subscriber_id, alert_event_key)` rows are ignored by the unique delivery ledger. Because the second attempt then sees no newly claimed deliveries, the current event summary can incorrectly be rewritten as `sent` even though the prior failed delivery rows remain unsent.

## Safety objective

A retry must never create duplicate messages, must never broaden the original audience silently, and must never mark an event fully sent unless the delivery ledger shows every intended delivery as sent. Provider retries should reuse the existing delivery identity/idempotency key.

## Planned implementation

1. Keep the unique per-subscriber/event delivery ledger as the idempotency boundary.
2. Allow retryable existing delivery rows to be reclaimed without reopening `sent` or `failed_final` rows.
3. Reuse the same delivery id so the Resend `Idempotency-Key` remains stable across retries.
4. Derive event `sent`/`partial`/`failed` state from persisted delivery rows, not only counters from the current function invocation.
5. Add regression coverage for retryable failures, successful retry, sent-row suppression, and accurate event totals.

This audit note is intentionally code-independent and does not change production behavior by itself.
