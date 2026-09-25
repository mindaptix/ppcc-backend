import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { punjabDistricts } from "./portal-data";
import { db } from "./db";

const mobilePattern = /^[6-9]\d{9}$/;
const sessionDays = 30;

export type AppUser = {
  id: string;
  name: string | null;
  mobile: string;
  email: string | null;
  district: string | null;
  constituency: string | null;
  role: string | null;
};

export function normalizeMobile(value: unknown) {
  if (typeof value !== "string") return "";
  const digits = value.replace(/\D/g, "");
  const mobile = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  return mobilePattern.test(mobile) ? mobile : "";
}

export function normalizeOtp(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}$/.test(value)) return "";
  return value;
}

export function otpIsConfigured() {
  return Boolean(process.env.MSG91_WIDGET_ID?.trim() && process.env.MSG91_WIDGET_TOKEN?.trim()
    && process.env.MSG91_WHATSAPP_ONLY === "true");
}

async function widgetRequest(method: string, body: Record<string, string>) {
  const response = await fetch(`https://control.msg91.com/api/v5/widget/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ widgetId: process.env.MSG91_WIDGET_ID?.trim(),
      tokenAuth: process.env.MSG91_WIDGET_TOKEN?.trim(), ...body }),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  return response.ok && payload?.type === "success" ? payload : null;
}

export async function tooManyOtpSends(mobile: string) {
  const result = await db().query(
    `INSERT INTO member_otp_send_limits (mobile, sends, window_start, last_sent_at)
     VALUES ($1, 1, now(), now())
     ON CONFLICT (mobile) DO UPDATE SET
       sends = CASE WHEN member_otp_send_limits.window_start < now() - interval '10 minutes'
         THEN 1 ELSE member_otp_send_limits.sends + 1 END,
       window_start = CASE WHEN member_otp_send_limits.window_start < now() - interval '10 minutes'
         THEN now() ELSE member_otp_send_limits.window_start END,
       last_sent_at = now()
     WHERE member_otp_send_limits.last_sent_at < now() - interval '60 seconds'
       AND (member_otp_send_limits.sends < 3 OR member_otp_send_limits.window_start < now() - interval '10 minutes')
     RETURNING mobile`, [mobile],
  );
  return !result.rowCount;
}

export async function findMember(mobile: string) {
  const result = await db().query<AppUser>(
    `SELECT id, name, mobile, email, district, constituency, role
     FROM members
     WHERE mobile = $1`,
    [mobile],
  );
  return result.rows[0] ?? null;
}

export async function sendLoginOtp(mobile: string, previousReqId = "") {
  if (!otpIsConfigured()) return { ok: false as const, error: "WhatsApp OTP is not configured." };
  if (previousReqId) {
    // Claim the resend before calling the provider to enforce a shared cooldown.
    const claim = await db().query(
      `UPDATE member_otp_challenges SET last_sent_at = now()
       WHERE mobile = $1 AND req_id = $2 AND expires_at > now()
       AND last_sent_at < now() - interval '60 seconds' RETURNING req_id`,
      [mobile, previousReqId],
    );
    if (!claim.rowCount) return { ok: false as const, error: "Wait 60 seconds or request a new OTP." };
    const payload = await widgetRequest("retryOtp", { reqId: previousReqId, retryChannel: "12" });
    if (!payload) return { ok: false as const, error: "Could not resend the WhatsApp OTP." };
    return { ok: true as const, reqId: previousReqId };
  }
  // Initial delivery uses the WhatsApp-only widget configured in MSG91.
  const payload = await widgetRequest("sendOtpMobile", { identifier: `91${mobile}` });
  const reqId = payload?.reqId ?? payload?.message;
  if (typeof reqId !== "string" || !reqId) return { ok: false as const, error: "Could not send the WhatsApp OTP." };
  await db().query(
    `INSERT INTO member_otp_challenges (mobile, req_id, expires_at)
     VALUES ($1, $2, now() + interval '10 minutes')
     ON CONFLICT (mobile) DO UPDATE SET req_id = EXCLUDED.req_id,
     expires_at = EXCLUDED.expires_at, attempts = 0, last_sent_at = now()`,
    [mobile, reqId],
  );
  return { ok: true as const, reqId };
}

export async function verifyLoginOtp(mobile: string, otp: string, reqId: string) {
  if (!otpIsConfigured()) return false;
  // Bind provider request IDs to the number we sent to, across server instances.
  const claim = await db().query(
    `UPDATE member_otp_challenges SET attempts = attempts + 1
     WHERE mobile = $1 AND req_id = $2 AND expires_at > now() AND attempts < 5
     RETURNING req_id`, [mobile, reqId],
  );
  if (!claim.rowCount) return false;
  const payload = await widgetRequest("verifyOtp", { reqId, otp });
  if (!payload) return false;
  const consumed = await db().query(
    `DELETE FROM member_otp_challenges WHERE mobile = $1 AND req_id = $2 AND expires_at > now()
     RETURNING req_id`, [mobile, reqId],
  );
  return Boolean(consumed.rowCount);
}

export async function getAppUser(request: NextRequest) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const result = await db().query<AppUser & { session_id: string }>(
    `SELECT m.id, m.name, m.mobile, m.email, m.district, m.constituency, m.role, s.id AS session_id
     FROM member_sessions s
     JOIN members m ON m.id = s.member_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [tokenHash],
  );
  const row = result.rows[0];
  if (!row) return null;
  return { tokenHash, sessionId: row.session_id, user: publicUser(row) };
}

function publicUser(row: AppUser): AppUser {
  return {
    id: row.id,
    name: row.name,
    mobile: row.mobile,
    email: row.email,
    district: row.district,
    constituency: row.constituency,
    role: row.role,
  };
}

export function cleanProfileText(value: unknown, max: number) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") return false as const;
  const cleaned = value.replace(/[\u0000-\u001f]/g, "").trim();
  if (!cleaned || cleaned.length > max) return false as const;
  return cleaned;
}

export function cleanProfileEmail(value: unknown) {
  const text = cleanProfileText(value, 254);
  if (text === undefined || text === null || text === false) return text;
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(text) ? text.toLowerCase() : (false as const);
}

export function cleanDistrict(value: unknown) {
  const text = cleanProfileText(value, 80);
  if (text === undefined || text === null || text === false) return text;
  return (punjabDistricts as readonly string[]).includes(text) ? text : (false as const);
}

export async function openMemberSession(memberId: string, fcmToken: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await db().query(
    `INSERT INTO member_sessions (member_id, token_hash, fcm_token, expires_at)
     VALUES ($1, $2, NULLIF($3, ''), now() + ($4 * interval '1 day'))`,
    [memberId, tokenHash, fcmToken, sessionDays],
  );
  return token;
}
