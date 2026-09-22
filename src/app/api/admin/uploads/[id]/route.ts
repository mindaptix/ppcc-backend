import { Readable } from "node:stream";
import { stat } from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";
import { openStoredFile, storedFilePath } from "@/lib/save-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  try {
    const result = await db().query<{
      original_name: string;
      stored_name: string;
      mime: string;
      byte_size: string;
      kind: string;
    }>(
      `SELECT original_name, stored_name, mime, byte_size::text, kind FROM uploads WHERE id = $1`,
      [id],
    );
    const row = result.rows[0];
    const fullPath = row ? storedFilePath(row.stored_name) : null;
    if (!row || !fullPath) return NextResponse.json({ error: "File not found." }, { status: 404 });
    await stat(fullPath);
    const stream = openStoredFile(row.stored_name);
    if (!stream) return NextResponse.json({ error: "File not found." }, { status: 404 });

    const inline = row.kind === "image" || row.kind === "video";
    const ascii = row.original_name.replace(/[^\x20-\x7E]+/g, "_").replace(/"/g, "");
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Content-Type": row.mime,
        "Content-Length": row.byte_size,
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(row.original_name)}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }
}
