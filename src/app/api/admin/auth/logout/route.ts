import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { adminCookie, hashToken } from "@/lib/admin-session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(adminCookie)?.value;
  if (token && process.env.DATABASE_URL) {
    try {
      await db().query(`DELETE FROM admin_sessions WHERE token_hash = $1`, [hashToken(token)]);
    } catch {
      // Still clear the cookie if the database is down.
    }
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminCookie, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
