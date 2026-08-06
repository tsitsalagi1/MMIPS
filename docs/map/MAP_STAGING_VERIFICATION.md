# Map staging verification plan

Status: static plan only. Do not run against production or staging containing real data.

After applying the reviewed migration order in an isolated synthetic Supabase project, verify: anon reads only approved visible points linked to approved published cases; rejected, hidden, unpublished, and unapproved records return no point; anon and ordinary authenticated roles cannot select `public_notes`, `approved_by`, `safety_reviewed_at`, `moderator_approved`, or `hidden_at`; exact public column privileges match the migration; no public INSERT/UPDATE/DELETE policy or privilege exists; FORCE RLS cannot be bypassed by table/view access; and a reviewed service-role workflow can insert, approve, hide, and supersede synthetic coarse centroids.

Inspect the API response to confirm no raw coordinates, exact address, moderator evidence, contacts, or photo fields. Verify missing configuration and query failure return an empty usable list. Future renderer staging must separately test JavaScript disabled, WebGL unavailable, style/tile failures, provider attribution, CSP reports, keyboard, screen reader, zoom/reflow, reduced motion, and map/list parity.

Rollback before launch in isolated staging may drop the new policies/table/type. After any deployment, prefer hiding unsafe points and a narrower forward fix; never disable RLS or destructively alter production records.
