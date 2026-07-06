# MMIPS language-neutral public wording update

This update reduces public-facing use of the word “case” so visitors do not confuse MMIPS with law enforcement, a court, or an official missing-person database.

## Main wording changes

- “Search Cases” → “Search Profiles”
- “Submit Case” → “Submit Information”
- “case page” → “public profile”
- “case link” → “public profile link”
- “case summary” → “public summary”
- “public case flyer” → “public awareness flyer”

The phrase “agency report/case number” remains where it refers to an official law-enforcement or NamUs-style identifier.

## Route changes

New public routes:

- `/profiles`
- `/profiles/[slug]`
- `/profiles/[slug]/flyer`

Old routes remain as redirects for compatibility:

- `/cases` → `/profiles`
- `/cases/[slug]` → `/profiles/[slug]`
- `/cases/[slug]/flyer` → `/profiles/[slug]/flyer`

## Email/flyer sharing

The Gmail/email share text now says “MMIPS public profile” and includes links to the public profile and printable flyer.

## Upload

Upload these files into the GitHub repo root and commit. Vercel should redeploy automatically.
