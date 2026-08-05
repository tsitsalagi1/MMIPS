import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(path, "utf8");
function routeFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = `${dir}/${entry}`;
    if (statSync(path).isDirectory()) return routeFiles(path);
    return path.endsWith("/route.ts") ? [path] : [];
  });
}

test("security static contract: public data loaders do not use SELECT star or expose exact coordinates", () => {
  const source = read("lib/cases.ts");
  assert.equal(source.includes('select("*, persons(*), case_verifications(*), profile_photos(*)")'), false);
  assert.equal(source.includes("row.latitude ? Number(row.latitude)"), false);
  assert.equal(source.includes("row.longitude ? Number(row.longitude)"), false);
  assert.match(source, /latitude:\s*undefined/);
  assert.match(source, /longitude:\s*undefined/);
});

test("security static contract: admin API routes call requireAdmin before data access", () => {
  for (const file of routeFiles("app/api/admin")) {
    const source = read(file);
    assert.match(source, /requireAdmin\(request\)/, `${file} must call requireAdmin(request)`);
    const firstRequireAdmin = source.indexOf("requireAdmin(request)");
    const firstFrom = source.indexOf(".from(");
    assert.ok(firstFrom === -1 || firstRequireAdmin < firstFrom, `${file} must authorize before database access`);
  }
});

test("security static contract: service-role keys stay out of browser/client components", () => {
  const clientFiles = ["lib/supabase/browser.ts", "app/admin/AdminDashboard.tsx", "components/PhotoPermissionUpload.tsx"];
  for (const file of clientFiles) {
    const source = read(file);
    assert.equal(source.includes("SUPABASE_SERVICE_ROLE_KEY"), false, `${file} must not read service-role keys`);
    assert.equal(source.includes("createServiceSupabaseClient"), false, `${file} must not import service-role helpers`);
  }
});

test("security static contract: public routes and admin 500s do not return raw error.message", () => {
  for (const file of routeFiles("app/api")) {
    const source = read(file);
    assert.equal(source.includes("error.message"), false, `${file} must not return raw Error.message`);
    assert.doesNotMatch(source, /NextResponse\.json\(\{ ok: false, message \}/, `${file} must use explicit safe error response`);
  }
  assert.match(read("app/api/corrections/route.ts"), /Correction%20request%20could%20not%20be%20processed/);
  assert.match(read("lib/security/api-errors.ts"), /safeApiError/);
});

test("security static contract: public submission route uses upload validator and generic errors", () => {
  const source = read("app/api/submissions/route.ts");
  assert.match(source, /validateImageFile/);
  assert.match(source, /generatedPrivatePhotoPath/);
  assert.match(source, /upsert: false/);
  assert.equal(source.includes("error.message"), false);
});

test("security static contract: Version 1 accepts JPEG PNG and WebP only", () => {
  const uploadSource = read("lib/security/uploads.ts");
  const componentSource = read("components/PhotoPermissionUpload.tsx");
  assert.match(uploadSource, /image\/jpeg/);
  assert.match(uploadSource, /image\/png/);
  assert.match(uploadSource, /image\/webp/);
  assert.equal(uploadSource.includes("image/gif"), false);
  assert.equal(componentSource.includes("image/gif"), false);
  assert.match(componentSource, /JPG, PNG, or WebP/);
});

test("security static contract: security headers are configured without full CSP or HSTS preload", () => {
  const source = read("next.config.ts");
  for (const header of ["X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy", "X-Frame-Options"]) {
    assert.match(source, new RegExp(header));
  }
  assert.match(source, /Cache-Control/);
  assert.equal(source.includes("Content-Security-Policy"), false);
  assert.equal(source.includes("Strict-Transport-Security"), false);
});

test("security static contract: storage migration does not directly mutate storage.buckets", () => {
  const sql = read("supabase/security_hardening_20260805.sql");
  assert.match(sql, /STATIC REVIEW ONLY/);
  assert.doesNotMatch(sql, /insert\s+into\s+storage\.buckets/i);
  assert.doesNotMatch(sql, /update\s+storage\.buckets/i);
  assert.doesNotMatch(sql, /delete\s+from\s+storage\.buckets/i);
  assert.match(read("docs/STORAGE_CONFIGURATION_RUNBOOK.md"), /Supabase Storage API or dashboard/);
});

test("security static contract: audit log SQL remains RLS-protected without public policies", () => {
  const sql = read("supabase/schema.sql") + "\n" + read("supabase/security_hardening_20260805.sql");
  assert.match(sql, /alter table audit_log enable row level security/i);
  assert.doesNotMatch(sql, /create policy[^;]+audit_log[^;]+for\s+select[^;]+true/i);
  assert.match(sql, /revoke all on audit_log from anon, authenticated/i);
});
