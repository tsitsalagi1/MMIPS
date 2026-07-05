# MMIPS submit redirect fix

This small patch fixes the public submission UX.

Before this patch, the form successfully saved submissions but the browser landed on `/api/submissions` and displayed raw JSON.

After this patch:

- `POST /api/submissions` saves the submission and redirects to `/submit/received`.
- `GET /api/submissions` redirects back to `/submit`.
- `/submit/received` shows a plain-language confirmation page.
- `/submit?error=...` shows a visible submission error message.

Upload these files to the root of the GitHub repo, commit, then redeploy Vercel.
