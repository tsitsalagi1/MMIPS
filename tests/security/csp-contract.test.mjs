import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const config = fs.readFileSync("next.config.ts", "utf8");

test("CSP is deny-by-default and keeps MMIPS framing/form boundaries", () => {
  assert.match(config, /default-src 'self'/);
  assert.match(config, /object-src 'none'/);
  assert.match(config, /base-uri 'self'/);
  assert.match(config, /form-action 'self'/);
  assert.match(config, /frame-ancestors 'none'/);
  assert.match(config, /Content-Security-Policy/);
});

test("CSP explicitly permits only current browser providers and MapLibre worker requirements", () => {
  assert.match(config, /https:\/\/challenges\.cloudflare\.com/);
  assert.match(config, /https:\/\/api\.maptiler\.com/);
  assert.match(config, /https:\/\/borhgkrydfuqgabkhxsr\.supabase\.co/);
  assert.match(config, /wss:\/\/borhgkrydfuqgabkhxsr\.supabase\.co/);
  assert.match(config, /worker-src blob:/);
  assert.match(config, /child-src blob:/);
  assert.match(config, /img-src 'self' data: blob:/);
});

test("production CSP does not enable unsafe-eval unconditionally", () => {
  assert.match(config, /isDev \? " 'unsafe-eval'" : ""/);
  assert.doesNotMatch(config, /script-src 'self' 'unsafe-inline' 'unsafe-eval'/);
});
