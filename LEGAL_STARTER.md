# MMIPS Legal/Safety Starter Notes

These are starter notes, not legal advice. Have counsel review before public launch.

## Required public posture

MMIPS is a public-awareness and family-support platform. It is not law enforcement and does not replace 911, police reports, NamUs, NCIC, tribal police, BIA MMU, FBI, or local authorities.

## Publishing rules

Do not publish a case unless all of these are satisfied:

- Family member, authorized advocate, tribal representative, law-enforcement representative, or other authorized submitter consent is documented.
- No public suspect accusations unless supported by official charges or an official public source.
- No exact unsafe private location, shelter location, domestic violence location, trafficking-risk location, or sensitive minor location.
- Public tip contact is official, family-approved, or otherwise verified.
- Public summary uses factual, neutral language.
- Moderator notes document verification steps.

## Correction/removal rules

- Provide an easy correction/removal request form.
- Treat family safety, consent concerns, unsafe locations, and official-contact updates as priority review items.
- Do not automatically change public case pages from public requests; review first.
- Document every change in moderator notes and audit logs.
- When in doubt, temporarily hide unsafe information while reviewing.

## Anti-spam / abuse protection

- Use Cloudflare Turnstile on public intake forms.
- Validate Turnstile server-side before writing to Supabase.
- Keep public comments disabled.
- Keep public tips private or routed to official/family-approved contacts.

## Data safety

- Keep Supabase service-role/secret keys server-side only.
- Use Row Level Security on public tables.
- Public visitors should only see approved/published case records.
- Private submissions, requester information, admin notes, and audit logs should not be public.

## Future documents to finalize

- Terms of Use
- Privacy Policy
- Case Submission Agreement
- Family/Authorized Submitter Consent Policy
- Correction and Removal Policy
- Photo/Flyer Permission Policy
- SMS Consent and Opt-Out Policy
- Moderation Policy
- Law-Enforcement Disclaimer
