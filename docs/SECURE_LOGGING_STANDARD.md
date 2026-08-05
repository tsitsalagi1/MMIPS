# MMIPS Secure Logging Standard

## Permitted operational fields

Timestamp, route name, HTTP method, status code, synthetic correlation/request ID, bounded error category/code, environment name, deployment ID, and non-sensitive aggregate counters.

## Prohibited fields

Names, emails, phone numbers, exact/sensitive locations, private narratives, authorization evidence, moderator notes, request bodies, bearer tokens, cookies, service-role keys, Turnstile tokens, subscriber details, storage object paths for private photos, SQL text/errors with record contents, stack traces in client responses, and real family/investigative data.

## Redaction rules

- Return generic client errors for server/provider/database failures.
- Log provider/database errors as bounded codes only unless a human incident responder uses an approved secure channel.
- Never log FormData bodies or broad object spreads from submissions/corrections.
- Hash or truncate IPs where operationally required; document retention.
- Correlation IDs should be random and not derived from personal data.

## Retention and access

Production logs should have short operational retention, access limited to designated operators, incident exports encrypted, and audit-log access reviewed. Security incidents involving accidental private exposure require preservation of evidence without copying private content into GitHub, PRs, or Codex logs.

## Development vs production

Local/demo logging may confirm that a code path was reached, but must not include real personal data. Production logs must be privacy-minimized and never include secrets or private records.
