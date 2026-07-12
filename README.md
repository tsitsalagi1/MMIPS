# MMIPS multiple photos build fix

This patch fixes a TypeScript build error in:

app/api/admin/submissions/[id]/route.ts

The issue was caused by untyped photo-copy arrays in the admin publish route. Vercel/Next.js type checking rejected the build with an implicit `any` error around `publicPath`/`copiedPhotos`.

Upload this folder into the GitHub repo root and commit. Vercel should redeploy automatically.

After deployment, run the multiple photos Supabase migration if you have not already:

supabase/multiple_photos.sql

Then test a fake profile with multiple photos.
