/**
 * Storage abstraction layer.
 * Currently uses local filesystem (public/uploads/).
 * To migrate to S3/R2 in production, swap the implementation
 * of `saveFile` and `deleteFile` below — no other code changes needed.
 */

import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const PUBLIC_PREFIX = "/uploads";

// Ensure upload directory exists
async function ensureDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch {
    // already exists
  }
}

/**
 * Save an uploaded file to storage.
 * Returns the public URL to access the file.
 *
 * --- PRODUCTION MIGRATION GUIDE ---
 * Replace this function body with:
 *   1. S3: `await s3Client.putObject({ Bucket, Key, Body: buffer })`
 *   2. R2: `await r2.put(key, buffer)`
 *   3. Return the CDN URL instead of local path
 */
export async function saveFile(
  buffer: Buffer,
  fileName: string
): Promise<string> {
  await ensureDir();

  // Generate unique filename to avoid collisions
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
  const uniqueName = `${base}_${Date.now()}${ext}`;

  const filePath = path.join(UPLOAD_DIR, uniqueName);
  await fs.writeFile(filePath, buffer);

  return `${PUBLIC_PREFIX}/${uniqueName}`;
}

/**
 * Delete a file from storage.
 *
 * --- PRODUCTION MIGRATION GUIDE ---
 * Replace with: `await s3Client.deleteObject({ Bucket, Key })`
 */
export async function deleteFile(publicUrl: string): Promise<void> {
  if (!publicUrl.startsWith(PUBLIC_PREFIX)) return;

  const fileName = publicUrl.replace(`${PUBLIC_PREFIX}/`, "");
  const filePath = path.join(UPLOAD_DIR, fileName);

  try {
    await fs.unlink(filePath);
  } catch {
    // File may not exist
  }
}

/**
 * Accepted file types and max size
 */
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
