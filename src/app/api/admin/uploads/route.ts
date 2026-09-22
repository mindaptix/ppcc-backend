import { createWriteStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable, type Readable as NodeReadable } from "node:stream";
import { pipeline } from "node:stream/promises";
import Busboy from "busboy";
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";
import {
  classifyFile,
  ensureUploadDirs,
  isAllowedDistrict,
  moveIntoStore,
  removeFile,
  tempPath,
  uploadDir,
} from "@/lib/save-upload";
import { videoMaxBytes } from "@/lib/upload-rules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const recentUploads = new Map<string, number[]>();

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return origin === new URL(process.env.APP_URL || request.nextUrl.origin).origin;
  } catch {
    return false;
  }
}

function tooMany(adminId: string, count: number) {
  const now = Date.now();
  const stamps = (recentUploads.get(adminId) ?? []).filter((stamp) => now - stamp < 10 * 60 * 1000);
  if (stamps.length + count > 40) return true;
  recentUploads.set(adminId, [...stamps, ...Array.from({ length: count }, () => now)]);
  return false;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const result = await db().query(
      `SELECT id, district, original_name, byte_size, kind, created_at
       FROM uploads
       ORDER BY created_at DESC
       LIMIT 200`,
    );
    return NextResponse.json({ files: result.rows });
  } catch {
    return NextResponse.json({ error: "Could not load saved files." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data") || !request.body) {
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  }

  await ensureUploadDirs();
  const incoming: { path: string; name: string; limited: boolean }[] = [];
  let district = "";
  let tooManyFiles = false;

  try {
    await new Promise<void>((resolve, reject) => {
      const parser = Busboy({
        headers: { "content-type": contentType },
        limits: { files: 10, fileSize: videoMaxBytes, fields: 4, fieldSize: 200, parts: 14 },
      });
      const writes: Promise<void>[] = [];

      parser.on("field", (name, value) => {
        if (name === "district") district = value.slice(0, 80);
      });
      parser.on("filesLimit", () => {
        tooManyFiles = true;
      });
      parser.on("file", (_name, stream, info) => {
        const destination = tempPath();
        let limited = false;
        stream.on("limit", () => {
          limited = true;
        });
        writes.push(
          pipeline(stream as NodeReadable, createWriteStream(destination, { flags: "wx" }))
            .then(() => {
              incoming.push({ path: destination, name: info.filename || "file", limited });
            })
            .catch((error: unknown) => {
              void removeFile(destination);
              throw error;
            }),
        );
      });
      parser.on("error", reject);
      parser.on("close", () => {
        Promise.all(writes).then(() => resolve(), reject);
      });
      const body = request.body;
      if (!body) throw new Error("empty");
      Readable.fromWeb(body as import("node:stream/web").ReadableStream<Uint8Array>).pipe(parser);
    });
  } catch {
    await Promise.all(incoming.map((file) => removeFile(file.path)));
    return NextResponse.json({ error: "Could not read the upload." }, { status: 400 });
  }

  if (tooManyFiles) {
    await Promise.all(incoming.map((file) => removeFile(file.path)));
    return NextResponse.json({ error: "Upload up to 10 files at a time." }, { status: 400 });
  }
  if (!isAllowedDistrict(district)) {
    await Promise.all(incoming.map((file) => removeFile(file.path)));
    return NextResponse.json({ error: "Choose a district before uploading." }, { status: 422 });
  }
  if (!incoming.length) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  if (tooMany(session.id, incoming.length)) {
    await Promise.all(incoming.map((file) => removeFile(file.path)));
    return NextResponse.json({ error: "Too many uploads. Wait a few minutes and try again." }, { status: 429 });
  }

  const saved = [];
  const errors: string[] = [];
  for (const file of incoming) {
    if (file.limited) {
      await removeFile(file.path);
      errors.push(`${file.name} is over the size limit.`);
      continue;
    }
    const info = await stat(file.path);
    const classified = await classifyFile(file.path, file.name, info.size);
    if (!classified) {
      await removeFile(file.path);
      errors.push(`${file.name} is not an allowed image, video, PDF, Word, Excel, or PowerPoint file.`);
      continue;
    }
    const storedName = await moveIntoStore(file.path);
    try {
      const inserted = await db().query(
        `INSERT INTO uploads (admin_id, district, original_name, stored_name, mime, byte_size, kind)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, district, original_name, byte_size, kind, created_at`,
        [session.id, district, classified.originalName, storedName, classified.mime, info.size, classified.kind],
      );
      saved.push(inserted.rows[0]);
    } catch {
      await removeFile(path.join(uploadDir, storedName));
      errors.push(`${file.name} could not be saved.`);
    }
  }

  if (!saved.length && errors.length) {
    return NextResponse.json({ files: saved, errors }, { status: 422 });
  }
  return NextResponse.json({ files: saved, errors });
}
