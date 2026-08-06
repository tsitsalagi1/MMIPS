# Alerts Privacy and Token Model

Subscriber email addresses, preferences, confirmation token hashes, unsubscribe token hashes, delivery history, and bounded provider metadata are private.

## Email normalization

Email input is trimmed, lowercased, length-bounded, checked for whitespace, and validated with a simple email shape before storage. Public responses never reveal whether a normalized email is new, pending, active, unsubscribed, or suppressed.

## Tokens

Confirmation and unsubscribe tokens are separate 32-byte cryptographically random base64url values. Raw tokens are sent only in email links and are never stored. The database stores `sha256:`-prefixed SHA-256 hashes. Confirmation tokens expire after 48 hours and are single-use because activation clears the stored confirmation hash and expiration. Unsubscribe tokens are separate from confirmation tokens and remain usable for low-friction unsubscribe until rotated by a future confirmed subscription request.

## Provider failure behavior

Routes return bounded public error codes and do not expose Supabase or email-provider bodies. Provider response bodies are discarded and not logged. Tests use mocked/synthetic delivery only; live email delivery is not verified.

## Remaining limitations

Distributed rate limiting is not implemented. Live RLS verification remains static-only until run in an isolated synthetic Supabase project. Alert dispatch triggering is intentionally not automatic yet.
