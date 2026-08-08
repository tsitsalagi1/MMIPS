import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const sql = fs.readFileSync("supabase/private_distributed_rate_limits_20260808.sql", "utf8");
const limiter = fs.readFileSync("lib/security/rate-limit.ts", "utf8");
const turnstile = fs.readFileSync("lib/security/turnstile.ts", "utf8");
const submissionRoute = fs.readFileSync("app/api/submissions/route.ts", "utf8");

test("distributed counters live in a non-public schema and persist only keyed hashes", () => {
  assert.match(sql, /create schema if not exists private/);
  assert.match(sql, /revoke all on schema private from anon, authenticated/);
  assert.match(sql, /key_hash text not null/);
  assert.doesNotMatch(sql, /ip_address\s+(text|inet)|email_address\s+text/i);
  assert.match(sql, /extensions\.gen_random_bytes\(32\)/);
  assert.match(sql, /extensions\.digest/);
});

test("rate-limit RPC is service-role only and bounded", () => {
  assert.match(sql, /revoke all on function public\.mmips_consume_rate_limit[^;]+from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.mmips_consume_rate_limit[^;]+to service_role/);
  assert.match(sql, /p_window_seconds > 604800/);
  assert.match(sql, /p_limit > 10000/);
});

test("submission and correction guards rate-limit normalized email and erase raw source IP before persistence", () => {
  assert.match(sql, /submission-email/);
  assert.match(sql, /correction-email/);
  assert.match(sql, /new\.source_ip := null/);
  assert.match(sql, /update public\.submissions set source_ip = null/);
});

test("submission route does not send raw requester IP in its database payload", () => {
  assert.doesNotMatch(submissionRoute, /clientIpFromRequest/);
  assert.doesNotMatch(submissionRoute, /source_ip\s*:/);
});

test("Turnstile-verified public forms use the private distributed IP limiter", () => {
  assert.match(turnstile, /consumeDistributedRateLimit/);
  assert.match(turnstile, /turnstile-ip:/);
  assert.match(turnstile, /limit: 30, windowSeconds: 3600/);
  assert.match(turnstile, /does not transmit the optional visitor IP to Turnstile/);
  assert.match(limiter, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(limiter, /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
});
