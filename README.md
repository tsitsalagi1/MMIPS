# MMIPS logo/icon update

This package replaces the simple “M” brand mark with a custom red handprint icon inspired by MMIP/MMIW awareness imagery, with **MMIPS** in white letters inside the palm.

## Files included

- `public/mmips-hand-icon.svg` — square SVG hand icon for nav/social use
- `public/mmips-logo.svg` — wider logo/social image
- `public/mmips-hand-icon-192.png` — browser/app icon
- `public/mmips-hand-icon-512.png` — browser/app icon
- `public/apple-icon.png` — Apple touch icon
- `app/favicon.ico` — favicon for browser tabs
- `app/icon.svg` — Next.js app icon
- `app/icon.png` — Next.js PNG app icon fallback
- `app/apple-icon.png` — Next.js apple icon
- `app/layout.tsx` — updates metadata and navbar logo
- `app/globals.css` — adds `.brand-icon` styling

## Install

Upload these files to the root of the GitHub repo `tsitsalagi1/MMIPS`, commit changes, and let Vercel redeploy.

After deployment, hard refresh `mmips.com` and check the browser tab icon. Favicons can be cached by browsers, so the tab icon may take a little longer to update than the navbar logo.


## Logo assets

This update uses two logo versions:

- `public/mmips-hand-transparent.png` for the site header, favicon/icon usage, and dark backgrounds.
- `public/mmips-hand-white-bg.png` and `public/mmips-og-white-bg.png` for white-background previews and social sharing.

Next.js app icons are also updated in `/app` so browser tabs and mobile home-screen icons use the new clean red handprint mark.

## Homepage calming refresh

This update removes the public demo case from the homepage, improves the alignment of the informational cards, and softens the homepage language for families and people using the site while distressed. The public cases page now shows an empty-state message when no approved cases are published instead of showing the demo fallback.

## Photo/flyer upload update

This update adds one optional image upload to the submit form. The image is stored in a private Supabase Storage bucket while the submission is pending review. If an admin approves the case, the image is copied into the public case-photo bucket and displayed on the public case card/page.

Run this in Supabase SQL Editor before testing uploads:

```sql
-- use the included file
supabase/photo_uploads.sql
```

Safety rules:

- Only JPG, PNG, WebP, or GIF images are accepted.
- Maximum upload size is 5 MB.
- Submitters must confirm they have permission to share an uploaded image.
- Pending images are not public.
- Admins should approve only family/authorized, non-graphic, safe images.

## Flyer and email/share update

This update adds a printable public flyer page at `/cases/[slug]/flyer` for each approved case, adds a `Print flyer` link to public case pages, and improves case sharing buttons.

Email sharing now includes both a standard `mailto:` link and an `Open in Gmail` fallback. The standard email link depends on the visitor having a default email app configured in their browser/operating system; the Gmail link opens Gmail in a new tab for users who use Gmail in the browser.

The flyer page uses browser printing. Users can print to paper or use the browser's “Save as PDF” option.


## Flyer link visibility fix

The printable flyer now includes a larger, bordered online case-link callout. The URL is rendered as a real HTML anchor (`<a href="...">`) so browser-generated PDFs such as Chrome “Save as PDF” are more likely to preserve the clickable link. The full URL remains visible for printed flyers and can be typed manually if the PDF viewer/printer does not preserve links.

## Profile sharing / flyer export update

This update adds practical sharing tools to public profiles:

- Public profile flyer page includes **Print / save PDF** and **Download JPEG flyer** buttons.
- The JPEG export is generated in the browser with a canvas so families can save a shareable image without an outside service.
- Public profile share box includes **Copy email body with image**, which copies a rich HTML email body containing the approved image and clickable links when the browser supports rich clipboard data. It falls back to plain text links.
- Gmail/mail buttons still open a compose window with profile and flyer links, because browser-initiated Gmail/mailto links cannot reliably attach or embed a flyer image automatically.

Use this as a user-safe path: users can click **Copy email body with image**, open Gmail, and paste into the message body.


## Profile share/export merged fix
This update restores the public profile share tools after the public wording change from cases to profiles. Public profile pages now show Print/save PDF flyer, Download JPEG flyer, Copy email body with image, Email with links, and Open Gmail with links. The flyer route remains `/profiles/[slug]/flyer` and the old `/cases` routes can continue to redirect.

## Mission-language and footer alignment update

This update removes the public-facing phrase "accountability tool/platform/project" and replaces it with calmer family-support/public-awareness language. It also improves footer alignment and removes "reviewed" language from the printable public awareness flyer, since published profiles are already expected to have been approved before publication.

Changed areas:
- Footer mission text and link/contact alignment
- Safety notice wording
- Public profile flyer heading
- PDF/JPEG flyer export heading
- Public profile checklist heading
- General public-facing mission language
