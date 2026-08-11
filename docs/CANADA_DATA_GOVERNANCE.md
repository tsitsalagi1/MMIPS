# MMIPS Canada data-governance baseline

This document is a prelaunch engineering and governance baseline, not legal advice and not a statement that one privacy statute applies to every future MMIPS Canada activity.

## Purpose

MMIPS Canada will handle information that can be highly sensitive: identity, family relationships, Indigenous affiliation, missing-person circumstances, police references, location information, contact information, photographs, and moderation records. The Canadian database therefore starts from data minimization, explicit release gates, need-to-know administration, short retention of operational metadata, and rapid suppression/correction workflows.

## Privacy-law baseline

The Office of the Privacy Commissioner of Canada explains that PIPEDA requires limiting collection, limiting use/disclosure/retention, accuracy, safeguards proportionate to sensitivity, openness, access, and a way to challenge compliance. Whether PIPEDA, a provincial private-sector statute, another law, or more than one regime applies to a particular MMIPS Canada activity depends on the organization, activity, province/territory, and facts. MMIPS should use the strongest practical privacy safeguards as the engineering baseline rather than waiting for the narrowest legal minimum.

Official baseline:
- https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/p_principle/
- https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/p_principle/principles/p_safeguards/

## Missing-person reporting baseline

MMIPS Canada does not replace police reporting. RCMP guidance states there is no minimum waiting period to report a missing person and recommends contacting local police or 911 immediately when there are concerns for personal safety. The police service of jurisdiction remains the first reporting path.

Official baseline:
- https://www.rcmp-grc.gc.ca/en/news/2023/best-practices-reporting-a-missing-person
- https://www.rcmp-grc.gc.ca/detach/en

## Database rules before real intake

1. Canada uses a separate Supabase project, Auth tenant, Storage configuration, keys, and administrator allowlist.
2. No U.S. family, subscriber, case, moderator, or administrator records are copied into Canada.
3. Real intake remains disabled until a separate Canadian release authorization.
4. Approval alone is not enough to publish a case. `public_profile_enabled` must be explicitly enabled.
5. Map publication requires a second gate, `public_map_enabled`, plus an approved approximate public point.
6. Exact/private coordinates never appear in public views.
7. Indigenous affiliation is public only when the specific affiliation row has `permission_to_publish=true`.
8. Photos are public only when both `permission_confirmed=true` and `use_on_profile=true`.
9. A suppression request must be able to remove a public profile/map without deleting the underlying audit trail.
10. Privacy requests must support access, correction, withdrawal of consent, suppression, and deletion/de-identification review.
11. Source IPs are operational metadata, not permanent case history; the schema gives them a 30-day deletion deadline by default.
12. Administrator actions require authenticated, allowlisted access and AAL2/MFA before privileged APIs are opened.
13. Public and private Canadian data must never be replicated into the Global gateway.
14. Synthetic rehearsal records must be unmistakably labelled synthetic and kept separate from real-person release authorization.

## Before launch

Before real Canadian intake opens, MMIPS should complete a Canada-specific privacy/legal review, Indigenous-led governance/consultation, English/French review, province/territory reporting directory verification, retention schedule, incident-response plan, moderator training, storage-policy review, synthetic load/security/accessibility rehearsal, and documented release approval.
