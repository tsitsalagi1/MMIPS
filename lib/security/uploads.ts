export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_UPLOAD_COUNT = 5;

export const ALLOWED_IMAGE_SIGNATURES = {
  jpg: { mime: "image/jpeg", extensions: ["jpg", "jpeg"] },
  png: { mime: "image/png", extensions: ["png"] },
  webp: { mime: "image/webp", extensions: ["webp"] }
} as const;

export type AllowedImageExtension = keyof typeof ALLOWED_IMAGE_SIGNATURES;

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

export async function validateImageFile(file: File) {
  if (file.size <= 0) throw new Error("Photo uploads must not be empty.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Each photo upload must be 5 MB or smaller.");
  const extension = normalizedImageExtension(file.name, file.type);
  if (!extension) throw new Error("Photo uploads must be JPG, PNG, or WebP images with a matching extension.");

  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const matches =
    (extension === "jpg" && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) ||
    (extension === "png" && header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47 && header[4] === 0x0d && header[5] === 0x0a && header[6] === 0x1a && header[7] === 0x0a) ||
    (extension === "webp" && header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 && header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50);

  if (!matches) throw new Error("Photo upload content did not match the declared image type.");
  return { extension, contentType: ALLOWED_IMAGE_SIGNATURES[extension].mime };
}
