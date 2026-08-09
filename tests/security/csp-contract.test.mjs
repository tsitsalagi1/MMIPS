import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const config = fs.readFileSync("next.config.ts", "utf8");
const proxy = fs.readFileSync("proxy.ts", "utf8");

test("baseline CSP is deny-by-default and keeps MMIPS framing/form boundaries", () => {
  assert.match(config, /default-src 'self'/);
  assert.match(config, /object-src 'none'/);
  assert.match(config, /base-uri 'self'/);
  assert.match(config, /form-action 'self'/);
  assert.match(config, /frame-ancestors 'none'/);
  assert.match(config, /Content-Security-Policy/);
});

test("baseline CSP explicitly permits only current browser providers and MapLibre worker requirements", () => {
  assert.match(config, /https:\/\/challenges\.cloudflare\.com/);
  assert.match(config, /https:\/\/api\.maptiler\.com/);
  assert.match(config, /https:\/\/borhgkrydfuqgabkhxsr\.supabase\.co/);
  assert.match(config, /wss:\/\/borhgkrydfuqgabkhxsr\.supabase\.co/);
  assert.match(config, /worker-src blob:/);
  assert.match(config, /child-src blob:/);
  assert.match(config, /img-src 'self' data: blob:/);
});

test("production baseline CSP does not enable unsafe-eval unconditionally", () => {
  assert.match(config, /isDev \? " 'unsafe-eval'" : ""/);
  assert.doesNotMatch(config, /script-src 'self' 'unsafe-inline' 'unsafe-eval'/);
});

test("privileged admin HTML uses a per-request nonce and strict-dynamic without unsafe-inline scripts", () => {
  assert.match(proxy, /Buffer\.from\(crypto\.randomUUID\(\)\)\.toString\("base64"\)/);
  assert.match(proxy, /script-src 'self' 'nonce-\$\{nonce\}' 'strict-dynamic'/);
  assert.doesNotMatch(proxy, /script-src[^\n]*unsafe-inline/);
  assert.match(proxy, /requestHeaders\.set\("x-nonce", nonce\)/);
  assert.match(proxy, /requestHeaders\.set\("Content-Security-Policy", csp\)/);
  assert.match(proxy, /response\.headers\.set\("Content-Security-Policy", csp\)/);
  assert.match(proxy, /source: "\/admin\/:path\*"/);
  assert.match(proxy, /Cache-Control", "no-store, private"/);
});
