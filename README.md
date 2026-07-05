# MMIPS Starter

MMIPS = Missing & Murdered Indigenous People Search.

This starter is a Next.js project for a legally safer MVP: public awareness, case search, case pages, approximate map placeholder, case-submission review form, correction/removal request form, resource pages, starter Terms/Privacy text, admin moderation, and Supabase schema.

## What this starter does

- Public home page
- Case search page with approved/published cases
- Public case detail page
- Submit-a-case form with safety confirmations
- Clean submission received page
- Correction/removal request form
- Correction/removal received page
- Cloudflare Turnstile widget support for submission and correction forms
- API routes for submissions and correction/removal requests
- Map placeholder with privacy warnings
- Alerts placeholder
- Admin review dashboard
- Admin review for correction/removal requests
- Starter Terms and Privacy pages
- Supabase schema with RLS policies for published cases

## What this starter does NOT do yet

- It does not replace 911, police reports, NamUs, NCIC, tribal police, BIA MMU, FBI, or local law enforcement.
- It does not include real cases.
- It does not publish submissions automatically.
- It does not include SMS alerts yet.
- It does not include file uploads yet.
- It does not automatically hide/edit public case records when a removal request is marked applied; the admin must make the public case change separately and document it.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/schema.sql`.
4. Add these environment variables to `.env.local` and Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://mmips.com
ADMIN_EMAILS=mmipsearch@gmail.com
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

The submission route uses the service-role key server-side only. Never expose the service-role key in browser code.

## Cloudflare Turnstile setup

1. Cloudflare dashboard → Turnstile → Add widget.
2. Add hostnames: `mmips.com` and `www.mmips.com`.
3. Copy the Site Key to `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in Vercel.
4. Copy the Secret Key to `TURNSTILE_SECRET_KEY` in Vercel.
5. Redeploy Vercel.

Server-side validation is required. The widget alone does not protect the form.

## First launch checklist

- Replace placeholder demo/test cases.
- Add attorney-reviewed Terms and Privacy Policy.
- Keep admin access limited through `ADMIN_EMAILS`.
- Add correction/removal email.
- Test correction/removal request flow.
- Test submission flow with Turnstile enabled.
- Add private moderation workflow before publishing any real case.
- Add upload handling with photo permission language.
- Add backups and admin audit logging.
- Keep SMS disabled until consent/opt-out workflow is complete.

## Recommended phases

1. MVP: case registry, submit form, admin review, correction/removal form, public case pages.
2. Map: safe, approximate city/county/reservation-level points.
3. Email alerts.
4. SMS alerts with opt-in/STOP compliance.
5. Partner portal for verified family/tribal advocates.

## Correction/removal apply workflow update

The admin correction/removal queue now separates two actions:

1. **Review the request**: read the family/authorized-contact correction/removal request and document verification steps in moderator notes.
2. **Apply the public case updates**: edit the linked case fields in the "Case updates to apply" panel, then click **Mark applied + update case**.

Marking a correction request as applied updates the linked `cases` and `persons` rows server-side, then marks the correction request approved/applied and writes an audit-log entry. This keeps correction intake separate from public case mutation and avoids automatically trusting public-submitted text.
