import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_COUNT, generatedPrivatePhotoPath, normalizedImageExtension, validateImageFile } from "../../.test-dist/lib/security/uploads.js";

function be32(value) {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

function pngFile(width, height, { metadata = false } = {}) {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const ihdr = [
    ...be32(13), 0x49, 0x48, 0x44, 0x52,
    ...be32(width), ...be32(height), 8, 2, 0, 0, 0,
    0, 0, 0, 0
  ];
  const text = metadata ? [
    ...be32(4), 0x74, 0x45, 0x58, 0x74,
    0x47, 0x50, 0x53, 0x00,
    0, 0, 0, 0
  ] : [];
  const iend = [...be32(0), 0x49, 0x45, 0x4e, 0x44, 0, 0, 0, 0];
  return new File([Uint8Array.from([...signature, ...ihdr, ...text, ...iend])], "photo.png", { type: "image/png" });
}

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

test("security unit: metadata-free bounded PNG passes structural privacy inspection", async () => {
  const result = await validateImageFile(pngFile(1200, 800));
  assert.equal(result.extension, "png");
  assert.equal(result.width, 1200);
  assert.equal(result.height, 800);
});

test("security unit: embedded text/EXIF-style metadata is rejected before storage", async () => {
  await assert.rejects(() => validateImageFile(pngFile(1200, 800, { metadata: true })), /embedded metadata/);
});

test("security unit: excessive dimensions or pixel count are rejected", async () => {
  await assert.rejects(() => validateImageFile(pngFile(8001, 100)), /dimensions are too large/);
  await assert.rejects(() => validateImageFile(pngFile(7000, 7000)), /dimensions are too large/);
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
