# MMIPS Starter

MMIPS = Missing & Murdered Indigenous People Search.

This starter is a Next.js project for a legally safer MVP: public awareness, case search, case pages, approximate map placeholder, case-submission review form, resource pages, starter Terms/Privacy text, Supabase schema, and a protected admin review workflow.

## What this starter does

- Public home page
- Case search page
- Public case detail page
- Submit-a-case form with safety confirmations
- API route for submissions
- Supabase storage of private submissions
- Admin login page using Supabase Auth
- Admin queue for pending submissions
- Approve + publish, needs-more-info, and reject actions
- Audit log entries for admin actions
- Published case pages from approved Supabase records
- Map placeholder with privacy warnings
- Alerts placeholder
- Starter Terms and Privacy pages
- Supabase schema with RLS policies for published cases

## What this starter does NOT do yet

- It does not replace 911, police reports, NamUs, NCIC, tribal police, BIA MMU, FBI, or local law enforcement.
- It does not publish submissions automatically.
- It does not include SMS alerts yet.
- It does not include file uploads yet.
- It does not include full case editing after publication yet.
- It does not include rate limiting / bot protection yet.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL Editor.
3. Run `supabase/schema.sql`.
4. Add these environment variables to `.env.local` and Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://mmips.com
ADMIN_EMAILS=your-admin-email@example.com
```

The submission and admin routes use the service-role key server-side only. Never expose the service-role key in browser code or GitHub.

## Admin setup

1. In Supabase, create an Auth user for the admin reviewer.
2. In Vercel, set `ADMIN_EMAILS` to the exact admin email address. Use commas for multiple admins.
3. Redeploy Vercel after adding or changing environment variables.
4. Visit `/admin`, sign in, review pending submissions, and approve only after verification/safety checks.

## First launch checklist

- Replace placeholder demo case.
- Add attorney-reviewed Terms and Privacy Policy.
- Add correction/removal email.
- Confirm `/admin` only allows emails listed in `ADMIN_EMAILS`.
- Add private moderation workflow before publishing any real case.
- Add upload handling with photo permission language.
- Add rate limiting / spam protection to the submission route.
- Add backups and admin audit logging review process.
- Keep SMS disabled until consent/opt-out workflow is complete.

## Recommended phases

1. MVP: case registry, submit form, admin review, public case pages.
2. Map: safe, approximate city/county/reservation-level points.
3. Email alerts.
4. SMS alerts with opt-in/STOP compliance.
5. Partner portal for verified family/tribal advocates.
