# MMIPS Alerts V1 Architecture

Alerts V1 implements private email-only subscription, double opt-in confirmation, unsubscribe, and a server-only delivery preparation boundary. Subscriber data is private and must not be exposed to public pages or browser Supabase clients.

## Lifecycle

1. A visitor submits an email address on `/alerts`.
2. `POST /api/alerts/subscribe` bounds request size, validates the email, runs Turnstile when configured, normalizes the address, and returns a generic response.
3. The server creates a pending subscriber only through service-role access and sends a confirmation email when email is configured.
4. `GET /api/alerts/confirm?token=...` activates a pending subscriber only if the hashed token is valid, unexpired, and unused.
5. `GET /api/alerts/unsubscribe?token=...` marks matching pending or active subscriptions as unsubscribed immediately and idempotently.

GET is used for confirm/unsubscribe because email clients and users need low-friction links with no login. The routes redirect to plain-language result pages and use opaque tokens only.

## Delivery boundary

`prepareApprovedPublicAlertDelivery` only queues events explicitly marked approved and published, and excludes hidden or removed events. Automated dispatch is not wired to moderator actions in this task. Future integration must prove the source event contains only public-safe profile/update information and must use the `alerts_sent` ledger for duplicate prevention.

## Preferences

Version 1 supports `all_public_alerts` only. Exact coordinates, exact addresses, radius preferences, private tribal enrollment information, inferred sensitive identity, and unpublished data are not used.
