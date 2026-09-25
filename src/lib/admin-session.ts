import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";

export const adminCookie = "ppcc_admin";
export const sessionSeconds = 60 * 60 * 8;

export function newSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function staticAdminEmail() {
  return process.env.PORTAL_ADMIN_EMAIL?.trim().toLowerCase() ?? "";
}

export function matchesStaticAdmin(email: string, password: string) {
  const expectedEmail = staticAdminEmail();
  const expectedPassword = process.env.PORTAL_ADMIN_PASSWORD ?? "";
  if (!expectedEmail.includes("@") || expectedPassword.length < 12) return false;
  const emailMatch = email.length === expectedEmail.length
    && timingSafeEqual(Buffer.from(email), Buffer.from(expectedEmail));
  const passwordMatch = password.length === expectedPassword.length
    && timingSafeEqual(Buffer.from(password), Buffer.from(expectedPassword));
  return emailMatch && passwordMatch;
}

export function staticSessionToken() {
  const exp = Math.floor(Date.now() / 1000) + sessionSeconds;
  const payload = Buffer.from(JSON.stringify({ email: staticAdminEmail(), exp })).toString("base64url");
  const signature = createHmac("sha256", process.env.PORTAL_ADMIN_PASSWORD ?? "").update(payload).digest("base64url");
  return `s.${payload}.${signature}`;
}

function readStaticSession(token: string) {
  const [prefix, payload, signature] = token.split(".");
  if (prefix !== "s" || !payload || !signature || token.split(".").length !== 3) return null;
  const expected = createHmac("sha256", process.env.PORTAL_ADMIN_PASSWORD ?? "").update(payload).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    const body = JSON.parse(Buffer.from(payload, "base64url").toString()) as { email?: string; exp?: number };
    if (body.email !== staticAdminEmail() || typeof body.exp !== "number" || body.exp < Math.floor(Date.now() / 1000)) return null;
    return { id: "static-admin", username: body.email };
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  try {
    const token = (await cookies()).get(adminCookie)?.value;
    if (!token) return null;
    const staticSession = readStaticSession(token);
    if (staticSession) return staticSession;
    if (!process.env.DATABASE_URL || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
    const result = await db().query<{ id: string; username: string }>(
      `SELECT a.id, COALESCE(a.email, a.username) AS username
       FROM admin_sessions s
       JOIN admins a ON a.id = s.admin_id
       WHERE s.token_hash = $1 AND s.expires_at > now()`,
      [hashToken(token)],
    );
    return result.rows[0] ?? null;
  } catch {
    return null;
  }
}
