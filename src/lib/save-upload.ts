import "server-only";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, open, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileTypeFromFile } from "file-type";
import { districtOptions } from "./portal-data";
import { displayName, extensionOf, maxBytesForKind, videoMaxBytes, type UploadKind } from "./upload-rules";

const root = path.join(process.cwd(), "storage");
export const uploadDir = path.join(root, "uploads");
const tempDir = path.join(root, "tmp");

const mimeKind: Record<string, UploadKind> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
  "image/heic": "image",
  "image/heif": "image",
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
  "application/pdf": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "document",
  "application/msword": "document",
  "application/vnd.ms-excel": "document",
  "application/vnd.ms-powerpoint": "document",
};

const legacyMime: Record<string, string> = {
  doc: "application/msword",
  xls: "application/vnd.ms-excel",
  ppt: "application/vnd.ms-powerpoint",
};

export function isAllowedDistrict(value: string) {
  return (districtOptions as readonly string[]).includes(value);
}

export async function ensureUploadDirs() {
  await mkdir(uploadDir, { recursive: true });
  await mkdir(tempDir, { recursive: true });
}

export function tempPath() {
  return path.join(tempDir, randomUUID());
}

async function sniffOffice(filePath: string) {
  const info = await stat(filePath);
  const handle = await open(filePath, "r");
  try {
    const take = Math.min(info.size, 256 * 1024);
    const head = Buffer.alloc(take);
    await handle.read(head, 0, take, 0);
    const tailTake = Math.min(info.size, 256 * 1024);
    const tail = Buffer.alloc(tailTake);
    await handle.read(tail, 0, tailTake, Math.max(0, info.size - tailTake));
    const sample = `${head.toString("latin1")}\n${tail.toString("latin1")}`;
    if (sample.includes("word/")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (sample.includes("ppt/")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    if (sample.includes("xl/")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    return "";
  } finally {
    await handle.close();
  }
}

export async function classifyFile(filePath: string, originalName: string, size: number) {
  if (!size || size > videoMaxBytes) return null;
  const detected = await fileTypeFromFile(filePath);
  let mime = detected?.mime ?? "";
  if (mime === "application/zip" || mime === "application/x-zip-compressed" || detected?.ext === "zip") {
    mime = await sniffOffice(filePath);
  }
  if ((mime === "application/x-cfb" || detected?.ext === "cfb") && legacyMime[extensionOf(originalName)]) {
    mime = legacyMime[extensionOf(originalName)];
  }
  const kind = mimeKind[mime];
  if (!kind || size > maxBytesForKind(kind)) return null;
  return { mime, kind, originalName: displayName(originalName) };
}

export async function moveIntoStore(filePath: string) {
  const storedName = randomUUID();
  await rename(filePath, path.join(uploadDir, storedName));
  return storedName;
}

export async function removeFile(filePath: string) {
  await rm(filePath, { force: true });
}

export function storedFilePath(storedName: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storedName)) return null;
  const full = path.resolve(uploadDir, storedName);
  if (path.relative(uploadDir, full).startsWith("..")) return null;
  return full;
}

export function openStoredFile(storedName: string) {
  const full = storedFilePath(storedName);
  if (!full) return null;
  return createReadStream(full);
}
