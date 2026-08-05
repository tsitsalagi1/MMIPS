import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_COUNT, generatedPrivatePhotoPath, normalizedImageExtension, validateImageFile } from "../../.test-dist/lib/security/uploads.js";

test("security unit: upload validation rejects SVG and GIF", async () => {
  const svg = new File(["<svg><script>alert(1)</script></svg>"], "photo.svg", { type: "image/svg+xml" });
  await assert.rejects(() => validateImageFile(svg), /JPG, PNG, or WebP/);

  const gif = new File([Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])], "photo.gif", { type: "image/gif" });
  await assert.rejects(() => validateImageFile(gif), /JPG, PNG, or WebP/);
});

test("security unit: upload validation fails closed on empty, oversized, mismatched, and spoofed files", async () => {
  const empty = new File([new Uint8Array([])], "photo.png", { type: "image/png" });
  await assert.rejects(() => validateImageFile(empty), /must not be empty/);

  const oversized = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "photo.jpg", { type: "image/jpeg" });
  await assert.rejects(() => validateImageFile(oversized), /5 MB or smaller/);

  assert.equal(normalizedImageExtension("photo.jpg", "image/png"), null);
  const spoofed = new File(["not a png"], "photo.png", { type: "image/png" });
  await assert.rejects(() => validateImageFile(spoofed), /did not match/);
});

test("security unit: generated upload paths do not include original filenames or traversal strings", () => {
  const path = generatedPrivatePhotoPath("00000000-0000-0000-0000-000000000000", 0, "jpg");
  assert.match(path, /^submissions\/00000000-0000-0000-0000-000000000000\/0-[0-9a-f-]+\.jpg$/);
  assert.equal(path.includes(".."), false);
  assert.equal(path.includes("family-photo"), false);
  assert.equal(path.includes("/etc/passwd"), false);
});

test("security unit: MIME and extension must agree", () => {
  assert.equal(normalizedImageExtension("photo.png", "image/png"), "png");
  assert.equal(normalizedImageExtension("photo.jpg", "image/png"), null);
  assert.equal(normalizedImageExtension("photo.svg", "image/svg+xml"), null);
  assert.equal(normalizedImageExtension("photo.gif", "image/gif"), null);
  assert.equal(MAX_UPLOAD_COUNT, 5);
});
