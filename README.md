# MMIPS admin profile lookup fix

Changed files:
- app/admin/AdminDashboard.tsx
- app/api/admin/profiles/route.ts
- app/globals.css

Fixes:
- Moves public profile lookup controls into the Published profile status/type editor section.
- Keeps public profiles hidden until admin enters at least 2 search characters.
- Prevents the admin profile API from returning large profile lists without a search query.
- Fixes admin search controls layout so the fields do not run off-screen.

No Supabase migration required.
