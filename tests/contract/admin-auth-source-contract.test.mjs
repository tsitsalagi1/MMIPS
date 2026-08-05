import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";

test("static admin authorization contract rejects missing bearer token before Supabase service access", () => {
  const source = fs.readFileSync("lib/supabase/admin.ts", "utf8");
  const missingTokenIndex = source.indexOf("if (!token)");
  const serviceClientIndex = source.indexOf("const supabase = createServiceSupabaseClient()");
  assert.ok(missingTokenIndex > -1, "missing token branch should exist");
  assert.ok(serviceClientIndex > -1, "service client branch should exist");
  assert.ok(missingTokenIndex < serviceClientIndex, "missing-token rejection must happen before service client creation");
  assert.match(source, /status:\s*401/);
});
