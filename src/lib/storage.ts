/**
 * Storage abstraction layer.
 * Uploads are persisted in Postgres so they survive Vercel deployments and do
 * not depend on the server filesystem.
 */

import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

const PUBLIC_PREFIX = "/uploads";
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function getSafeExtension(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext) ? ext : ".bin";
}

function getSafeContentType(contentType: string | undefined, ext: string) {
  if (contentType && ACCEPTED_TYPES.includes(contentType)) return contentType;
  return CONTENT_TYPE_BY_EXTENSION[ext] ?? "application/octet-stream";
}

function getStorageKey(publicUrl: string) {
  if (!publicUrl.startsWith(`${PUBLIC_PREFIX}/`)) return null;
  return path.basename(publicUrl.replace(`${PUBLIC_PREFIX}/`, ""));
}

/**
 * Save an uploaded file to persistent storage.
 * Returns the public URL used by the app to read the file.
 */
export async function saveFile(
  buffer: Buffer,
  fileName: string,
  contentType?: string
): Promise<string> {
  const safeExt = getSafeExtension(fileName);
  const key = `${randomUUID()}${safeExt}`;
  const data = new Uint8Array(buffer.byteLength);
  data.set(buffer);

  await prisma.storedFile.create({
    data: {
      key,
      contentType: getSafeContentType(contentType, safeExt),
      size: buffer.byteLength,
      data,
    },
  });

  return `${PUBLIC_PREFIX}/${key}`;
}

export async function getFile(publicUrlOrKey: string) {
  const key = publicUrlOrKey.startsWith(PUBLIC_PREFIX)
    ? getStorageKey(publicUrlOrKey)
    : path.basename(publicUrlOrKey);

  if (!key) return null;

  return prisma.storedFile.findUnique({
    where: { key },
    select: {
      key: true,
      contentType: true,
      data: true,
      size: true,
      createdAt: true,
    },
  });
}

export async function deleteFile(publicUrl: string): Promise<void> {
  const key = getStorageKey(publicUrl);
  if (!key) return;

  await prisma.storedFile.deleteMany({
    where: { key },
  });
}

/**
 * Accepted file types and max size.
 */
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
