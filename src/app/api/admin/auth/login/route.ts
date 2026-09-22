import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { adminCookie, hashToken, newSessionToken, sessionSeconds } from "@/lib/admin-session";

export const runtime = "nodejs";

let dummyHash = "";
const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const expected = process.env.APP_URL || request.nextUrl.origin;
    return origin === new URL(expected).origin;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database is not connected." }, { status: 503 });
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = (await request.json()) as { email?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!emailPattern.test(email) || email.length > 254 || password.length < 12 || password.length > 128) {
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  try {
    const pool = db();
    await pool.query(`DELETE FROM login_attempts WHERE attempted_at < now() - interval '2 days'`);
    const recent = await pool.query<{ count: string }>(
      `SELECT count(*)::text AS count
       FROM login_attempts
       WHERE username = $1 AND success = false AND attempted_at > now() - interval '15 minutes'`,
      [email],
    );
    if (Number(recent.rows[0]?.count ?? 0) >= 5) {
      return NextResponse.json({ error: "Too many attempts. Wait 15 minutes and try again." }, { status: 429 });
    }

    const admin = await pool.query<{ id: string; password_hash: string }>(
      `SELECT id, password_hash FROM admins WHERE lower(email) = $1`,
      [email],
    );
    const row = admin.rows[0];
    dummyHash ||= await hashPassword("not-a-real-admin-password!!");
    const valid = await verifyPassword(password, row?.password_hash ?? dummyHash);
    const success = Boolean(row) && valid;
    await pool.query(`INSERT INTO login_attempts (username, success) VALUES ($1, $2)`, [email, success]);
    if (!success) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }

    const token = newSessionToken();
    await pool.query(
      `INSERT INTO admin_sessions (admin_id, token_hash, expires_at)
       VALUES ($1, $2, now() + ($3 * interval '1 second'))`,
      [row.id, hashToken(token), sessionSeconds],
    );
    const response = NextResponse.json({ ok: true });
    response.cookies.set(adminCookie, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: sessionSeconds,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Database is not connected." }, { status: 503 });
  }
}
