import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const proxy = fs.readFileSync("proxy.ts", "utf8");

test("Canada exposes the complete locked alert and admin recovery page flow", () => {
  assert.match(proxy, /pathname === "\/alerts"/);
  assert.match(proxy, /pathname\.startsWith\("\/alerts\/"\)/);
  assert.match(proxy, /pathname\.startsWith\("\/admin\/"\)/);
});

test("Canada permits only the alert APIs required for signup lock, unsubscribe, moderation and relay", () => {
  for (const route of [
    "/api/admin/alerts/urgent",
    "/api/federation/alerts/relay",
    "/api/alerts/subscribe",
    "/api/alerts/confirm",
    "/api/alerts/unsubscribe"
  ]) {
    assert.match(proxy, new RegExp(`pathname === "${route.replaceAll("/", "\\/")}"`));
  }
  assert.match(proxy, /pathname\.startsWith\("\/api\/admin\/canada\/"\)/);
});
