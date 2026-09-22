import { NextRequest, NextResponse } from "next/server";
import { getAppUser } from "@/lib/app-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getAppUser(request);
    if (session) await db().query(`DELETE FROM member_sessions WHERE id = $1`, [session.sessionId]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not sign out." }, { status: 503 });
  }
}
