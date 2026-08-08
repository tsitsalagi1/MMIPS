import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const submitPage = fs.readFileSync("app/submit/page.tsx", "utf8");
const gate = fs.readFileSync("components/SubmissionReviewGate.tsx", "utf8");
const submissionRoute = fs.readFileSync("app/api/submissions/route.ts", "utf8");
const submissionReceipt = fs.readFileSync("app/submit/received/page.tsx", "utf8");
const correctionRoute = fs.readFileSync("app/api/corrections/route.ts", "utf8");
const correctionReceipt = fs.readFileSync("app/corrections/received/page.tsx", "utf8");
const migration = fs.readFileSync("supabase/add_public_request_references_20260808.sql", "utf8");

test("submission has an explicit review-before-submit gate that invalidates after edits", () => {
  assert.match(submitPage, /SubmissionReviewGate/);
  assert.doesNotMatch(submitPage, />Submit for review<\/button>/);
  assert.match(gate, /Review submission/);
  assert.match(gate, /Confirm and submit for review/);
  assert.match(gate, /form\.reportValidity\(\)/);
  assert.match(gate, /form\.addEventListener\("input", invalidate\)/);
  assert.match(gate, /form\.addEventListener\("change", invalidate\)/);
  assert.match(gate, /Private moderator-only fields are not repeated/);
});

test("receipts use dedicated non-secret public tracking references rather than primary UUIDs", () => {
  assert.match(migration, /submissions add column if not exists public_reference/);
  assert.match(migration, /correction_requests add column if not exists public_reference/);
  assert.match(migration, /unique index if not exists submissions_public_reference_uidx/);
  assert.match(migration, /unique index if not exists correction_requests_public_reference_uidx/);
  assert.match(submissionRoute, /select\("id, public_reference"\)/);
  assert.match(correctionRoute, /select\("id, public_reference"\)/);
  assert.doesNotMatch(submissionRoute, /Reference ID: \$\{submissionRow\.id\}/);
  assert.doesNotMatch(correctionRoute, /Reference ID: \$\{correctionRow\.id\}/);
});

test("receipt pages validate reference format before rendering it", () => {
  assert.match(submissionReceipt, /\^MMIPS-\[A-F0-9\]\{16\}\$/);
  assert.match(correctionReceipt, /\^MMIPS-C-\[A-F0-9\]\{16\}\$/);
  assert.match(submissionReceipt, /tracking label, not a public profile number/);
  assert.match(correctionReceipt, /tracking reference/);
});
