import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const adminBoundary = fs.readFileSync("lib/supabase/admin.ts", "utf8");
const panel = fs.readFileSync("app/admin/AdminMfaPanel.tsx", "utf8");
const page = fs.readFileSync("app/admin/page.tsx", "utf8");

test("admin API boundary requires AAL2 whenever the account has a verified MFA factor", () => {
  assert.match(adminBoundary, /factors\?\.some\(\(factor\) => factor\.status === "verified"\)/);
  assert.match(adminBoundary, /auth\.getClaims\(token\)/);
  assert.match(adminBoundary, /aal !== "aal2"/);
  assert.match(adminBoundary, /admin_mfa_required/);
});

test("admin access-denied audit does not persist the denied email address", () => {
  assert.match(adminBoundary, /Authenticated email is not in the admin allowlist/);
  assert.doesNotMatch(adminBoundary, /Email not allowlisted: \$\{email\}/);
});

test("admin page provides TOTP enrollment and challenge-and-verify flow", () => {
  assert.match(panel, /mfa\.listFactors\(\)/);
  assert.match(panel, /mfa\.getAuthenticatorAssuranceLevel\(\)/);
  assert.match(panel, /mfa\.enroll\(\{ factorType: "totp"/);
  assert.match(panel, /mfa\.challengeAndVerify/);
  assert.match(panel, /data\.totp\.qr_code/);
  assert.match(panel, /data\.totp\.secret/);
  assert.match(panel, /currentLevel === "aal2"/);
  assert.match(page, /AdminMfaPanel/);
});

test("MFA UI warns operators not to expose the enrollment secret", () => {
  assert.match(panel, /Treat it like a password and do not share or save it in screenshots/);
  assert.match(panel, /MFA verified for this admin session/);
});
