export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_UPLOAD_COUNT = 5;
export const MAX_IMAGE_WIDTH = 8000;
export const MAX_IMAGE_HEIGHT = 8000;
export const MAX_IMAGE_PIXELS = 40_000_000;

export const ALLOWED_IMAGE_SIGNATURES = {
  jpg: { mime: "image/jpeg", extensions: ["jpg", "jpeg"] },
  png: { mime: "image/png", extensions: ["png"] },
  webp: { mime: "image/webp", extensions: ["webp"] }
} as const;

export type AllowedImageExtension = keyof typeof ALLOWED_IMAGE_SIGNATURES;

type ImageInspection = { width: number; height: number; hasUnsafeMetadata: boolean };

const EXTENSION_BY_MIME = new Map<string, AllowedImageExtension>(
  Object.entries(ALLOWED_IMAGE_SIGNATURES).map(([extension, config]) => [config.mime, extension as AllowedImageExtension])
);

export function normalizedImageExtension(fileName: string, mimeType: string): AllowedImageExtension | null {
  const extension = fileName.toLowerCase().split(".").pop()?.replace(/[^a-z0-9]/g, "") || "";
  const expected = EXTENSION_BY_MIME.get(mimeType);
  if (!expected) return null;
  const allowed = ALLOWED_IMAGE_SIGNATURES[expected].extensions;
  return (allowed as readonly string[]).includes(extension) ? expected : null;
}

export function generatedPrivatePhotoPath(submissionId: string, sortOrder: number, extension: AllowedImageExtension) {
  const safeOrder = Number.isInteger(sortOrder) && sortOrder >= 0 ? sortOrder : 0;
  return `submissions/${submissionId}/${safeOrder}-${crypto.randomUUID()}.${extension}`;
}

export function generatedPublicPhotoPath(slug: string, sortOrder: number, extension: AllowedImageExtension) {
  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "profile";
  const safeOrder = Number.isInteger(sortOrder) && sortOrder >= 0 ? sortOrder : 0;
  return `profiles/${safeSlug}/${safeOrder}-${crypto.randomUUID()}.${extension}`;
}

function readU16BE(bytes: Uint8Array, offset: number) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readU24LE(bytes: Uint8Array, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function readU32BE(bytes: Uint8Array, offset: number) {
  return ((bytes[offset] * 0x1000000) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3]) >>> 0;
}

function fourCC(bytes: Uint8Array, offset: number) {
  return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
}

function inspectJpeg(bytes: Uint8Array): ImageInspection | null {
  let width = 0, height = 0, hasUnsafeMetadata = false, offset = 2;
  const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (offset + 3 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) break;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 1 >= bytes.length) break;
    const length = readU16BE(bytes, offset);
    if (length < 2 || offset + length > bytes.length) return null;
    if (marker === 0xe1 || marker === 0xed || marker === 0xfe) hasUnsafeMetadata = true;
    if (sofMarkers.has(marker) && length >= 7) {
      height = readU16BE(bytes, offset + 3);
      width = readU16BE(bytes, offset + 5);
    }
    offset += length;
  }
  return width > 0 && height > 0 ? { width, height, hasUnsafeMetadata } : null;
}

function inspectPng(bytes: Uint8Array): ImageInspection | null {
  let width = 0, height = 0, hasUnsafeMetadata = false, offset = 8;
  const unsafeChunks = new Set(["eXIf", "tEXt", "zTXt", "iTXt"]);
  while (offset + 12 <= bytes.length) {
    const length = readU32BE(bytes, offset);
    const type = fourCC(bytes, offset + 4);
    const dataOffset = offset + 8;
    const next = dataOffset + length + 4;
    if (next > bytes.length) return null;
    if (type === "IHDR" && length >= 8) {
      width = readU32BE(bytes, dataOffset);
      height = readU32BE(bytes, dataOffset + 4);
    }
    if (unsafeChunks.has(type)) hasUnsafeMetadata = true;
    offset = next;
    if (type === "IEND") break;
  }
  return width > 0 && height > 0 ? { width, height, hasUnsafeMetadata } : null;
}

function inspectWebp(bytes: Uint8Array): ImageInspection | null {
  let width = 0, height = 0, hasUnsafeMetadata = false, offset = 12;
  while (offset + 8 <= bytes.length) {
    const type = fourCC(bytes, offset);
    const length = bytes[offset + 4] | (bytes[offset + 5] << 8) | (bytes[offset + 6] << 16) | (bytes[offset + 7] << 24);
    const data = offset + 8;
    if (length < 0 || data + length > bytes.length) return null;
    if (type === "EXIF" || type === "XMP ") hasUnsafeMetadata = true;
    if (type === "VP8X" && length >= 10) {
      width = 1 + readU24LE(bytes, data + 4);
      height = 1 + readU24LE(bytes, data + 7);
    } else if (type === "VP8L" && length >= 5 && bytes[data] === 0x2f) {
      width = 1 + bytes[data + 1] + ((bytes[data + 2] & 0x3f) << 8);
      height = 1 + ((bytes[data + 2] & 0xc0) >> 6) + (bytes[data + 3] << 2) + ((bytes[data + 4] & 0x0f) << 10);
    } else if (type === "VP8 " && length >= 10 && bytes[data + 3] === 0x9d && bytes[data + 4] === 0x01 && bytes[data + 5] === 0x2a) {
      width = (bytes[data + 6] | (bytes[data + 7] << 8)) & 0x3fff;
      height = (bytes[data + 8] | (bytes[data + 9] << 8)) & 0x3fff;
    }
    offset = data + length + (length % 2);
  }
  return width > 0 && height > 0 ? { width, height, hasUnsafeMetadata } : null;
}

function inspectImage(bytes: Uint8Array, extension: AllowedImageExtension) {
  if (extension === "jpg") return inspectJpeg(bytes);
  if (extension === "png") return inspectPng(bytes);
  return inspectWebp(bytes);
}

export async function validateImageFile(file: File) {
  if (file.size <= 0) throw new Error("Photo uploads must not be empty.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Each photo upload must be 5 MB or smaller.");
  const extension = normalizedImageExtension(file.name, file.type);
  if (!extension) throw new Error("Photo uploads must be JPG, PNG, or WebP images with a matching extension.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const matches =
    (extension === "jpg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
    (extension === "png" && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) ||
    (extension === "webp" && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50);

  if (!matches) throw new Error("Photo upload content did not match the declared image type.");
  const inspection = inspectImage(bytes, extension);
  if (!inspection) throw new Error("Photo dimensions or structure could not be safely verified.");
  if (inspection.hasUnsafeMetadata) {
    throw new Error("Photo contains embedded metadata that could expose private information. Export a metadata-free copy and upload that instead.");
  }
  if (inspection.width > MAX_IMAGE_WIDTH || inspection.height > MAX_IMAGE_HEIGHT || inspection.width * inspection.height > MAX_IMAGE_PIXELS) {
    throw new Error("Photo dimensions are too large. Use an image no larger than 8000×8000 pixels and 40 megapixels.");
  }

  return { extension, contentType: ALLOWED_IMAGE_SIGNATURES[extension].mime, width: inspection.width, height: inspection.height };
}
