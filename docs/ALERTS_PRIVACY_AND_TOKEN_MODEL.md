# Alerts privacy and token model

Confirmation credentials are 32 random bytes encoded as base64url; only a SHA-256-prefixed hash is stored, expiration is 48 hours, and the atomic confirmation function clears the hash on success.

Unsubscribe uses a random, private `unsubscribe_token_id` plus HMAC-SHA-256. The public `v1.<id>.<signature>` bearer token is reconstructible server-side but is never stored. Verification parses bounded input and compares signatures with `timingSafeEqual`. `ALERT_UNSUBSCRIBE_SIGNING_KEY` is server-only. During controlled rotation, configure `ALERT_UNSUBSCRIBE_PREVIOUS_SIGNING_KEY`, deploy the new current key, retain the previous key through the longest email-link retention period, then remove it. Emergency compromise response disables alert delivery/unsubscribe routes, rotates keys, and communicates a safe forward fix; old links necessarily stop after emergency revocation. Ordinary resubscription preserves the identifier, so old links continue to unsubscribe.

Normalized email, bounded consent evidence, preferences, token hashes/IDs, resend counters, and delivery metadata are private. Public responses remain generic. Provider bodies are discarded; only a validated bounded provider message ID and bounded failure code may be retained. No email, token, request body, or provider body is logged.
