import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

test("admin dashboard route remains dynamic to avoid build-time Supabase browser initialization", () => {
  const page = fs.readFileSync("app/admin/page.tsx", "utf8");
  const dashboard = fs.readFileSync("app/admin/AdminDashboard.tsx", "utf8");
  assert.match(page, /export const dynamic = "force-dynamic"/);
  assert.match(dashboard, /createBrowserSupabaseClient\(\)/);
});
