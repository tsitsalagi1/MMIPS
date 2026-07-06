# MMIPS photo permission submit fix

This update makes the optional photo/flyer permission checkbox more visible and prevents the submit button from being used when a photo is selected but permission has not been confirmed.

Changed files:

- `app/submit/page.tsx`
- `components/PhotoPermissionUpload.tsx`
- `app/globals.css`

The server-side validation remains in place as a backup safety check. The checkbox becomes required only when an image is selected, and the submit button is disabled until permission is checked.
