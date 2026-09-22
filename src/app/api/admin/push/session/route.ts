import { NextRequest, NextResponse } from "next/server";
import { createSession, equalSecret, sessionCookie, sessionLifetime } from "@/lib/push-session";
import { isPushAdmin, isSameOrigin, pushConfig, readSmallJson } from "@/lib/push-server";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  return NextResponse.json({ configured: !!pushConfig(), authenticated: isPushAdmin(request) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  const config = pushConfig();
  if (!config) return NextResponse.json({ error: "Notifications are not connected yet. Ask your administrator to finish Firebase setup." }, { status: 503 });
  let body;
  try { body = await readSmallJson(request) as { secret?: unknown } | null; }
  catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (typeof body?.secret !== "string" || !equalSecret(body.secret, config.adminSecret)) {
    return NextResponse.json({ error: "The admin access code is incorrect." }, { status: 401 });
  }
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(sessionCookie, createSession(config.adminSecret), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/api/admin", maxAge: sessionLifetime,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(sessionCookie, "", { path: "/api/admin", maxAge: 0, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });
  return response;
}
