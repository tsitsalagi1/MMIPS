import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const recovery = fs.readFileSync("components/AdminPasswordRecovery.tsx", "utf8");
const recoveryPage = fs.readFileSync("app/admin/reset-password/page.tsx", "utf8");
const adminPage = fs.readFileSync("app/admin/page.tsx", "utf8");

test("admin password recovery is shared by U.S. and Canada deployments", () => {
  assert.match(recoveryPage, /mmipsSiteMode\(\)/);
  assert.match(recoveryPage, /MMIPS Canada/);
  assert.match(recoveryPage, /MMIPS United States/);
  assert.match(adminPage, /\/admin\/reset-password/);
});

test("password reset email returns to the same country hostname", () => {
  assert.match(recovery, /window\.location\.origin/);
  assert.match(recovery, /\/admin\/reset-password/);
  assert.match(recovery, /resetPasswordForEmail/);
});

test("recovery completion supports Supabase recovery sessions and updates password", () => {
  assert.match(recovery, /PASSWORD_RECOVERY/);
  assert.match(recovery, /exchangeCodeForSession/);
  assert.match(recovery, /updateUser\(\{ password: newPassword \}\)/);
  assert.match(recovery, /signOut\(\)/);
  assert.match(recovery, /at least 14 characters/);
});

test("reset request avoids account enumeration", () => {
  assert.match(recovery, /If that email belongs to an authorized/);
  assert.doesNotMatch(recovery, /User not found|email is registered|account exists for/);
});
