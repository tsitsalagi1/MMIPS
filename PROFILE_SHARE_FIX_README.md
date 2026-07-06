# MMIPS profile share/export merged fix

This patch restores the share/export tools after changing public wording from case pages to public profiles.

Upload these files into the GitHub repo root and commit:

- components/ShareButtons.tsx
- components/FlyerActions.tsx
- app/profiles/[slug]/page.tsx
- app/profiles/[slug]/flyer/page.tsx
- app/globals.css
- README.md

After Vercel redeploys, check a public profile. The share panel should show:

- Print / save PDF flyer
- Download JPEG flyer
- Copy email body with image
- Email with links
- Open Gmail with links
- Facebook
- X

The flyer page should also retain Print / save PDF and Download JPEG flyer buttons.
