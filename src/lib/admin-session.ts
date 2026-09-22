import "server-only";
import { createHash, randomBytes } from "node:crypto";
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

export async function getAdminSession() {
  try {
    const token = (await cookies()).get(adminCookie)?.value;
    if (!process.env.DATABASE_URL || !token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
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
