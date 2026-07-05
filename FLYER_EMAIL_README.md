# MMIPS flyer + email/share update

Upload these changed files into the GitHub repo root and commit.

Changed/new files:

- `app/cases/[slug]/page.tsx`
- `app/cases/[slug]/flyer/page.tsx`
- `components/ShareButtons.tsx`
- `components/FlyerActions.tsx`
- `app/globals.css`
- `README.md`

What it adds:

- A printable flyer route for each approved public case: `/cases/[slug]/flyer`
- A `Print flyer` button in the case sharing box
- A case-page section linking to the printable flyer
- A print-friendly flyer page with public case details, photo, tip contact, verification badges, case URL, and MMIPS legal notice
- Improved email sharing using both standard `mailto:` and an `Open in Gmail` fallback

Notes:

- Standard `mailto:` links only work if the visitor has a default email app configured on their device/browser.
- The Gmail fallback opens a browser Gmail compose window for users who use Gmail.
- The flyer uses the browser print dialog. Users can print or save as PDF from their browser.
