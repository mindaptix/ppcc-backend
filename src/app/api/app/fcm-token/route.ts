import { NextRequest, NextResponse } from "next/server";
import { getAppUser } from "@/lib/app-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { fcm_token?: unknown };
  try {
    body = (await request.json()) as { fcm_token?: unknown };
  } catch {
    return NextResponse.json({ error: "FCM token is required." }, { status: 400 });
  }

  const fcmToken = typeof body.fcm_token === "string" ? body.fcm_token.trim() : "";
  if (!fcmToken || fcmToken.length > 4096) {
    return NextResponse.json({ error: "FCM token is required." }, { status: 400 });
  }

  try {
    const session = await getAppUser(request);
    if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    await db().query(`UPDATE member_sessions SET fcm_token = $1 WHERE id = $2`, [fcmToken, session.sessionId]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not save the FCM token." }, { status: 503 });
  }
}
