import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { punjabDistricts } from "./portal-data";
import { db } from "./db";

const mobilePattern = /^[6-9]\d{9}$/;
const sessionDays = 30;
const sends = new Map<string, number[]>();

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
  if (typeof value !== "string" || !/^\d{4,8}$/.test(value)) return "";
  return value;
}

export function otpIsConfigured() {
  return Boolean(process.env.MSG91_AUTH_KEY?.trim() && process.env.MSG91_TEMPLATE_ID?.trim());
}

function msg91() {
  const authkey = process.env.MSG91_AUTH_KEY?.trim() ?? "";
  const templateId = process.env.MSG91_TEMPLATE_ID?.trim() ?? "";
  if (!authkey || !templateId) return null;
  return { authkey, templateId };
}

export function tooManyOtpSends(mobile: string) {
  const now = Date.now();
  const recent = (sends.get(mobile) ?? []).filter((stamp) => now - stamp < 10 * 60 * 1000);
  if (recent.length >= 3) {
    sends.set(mobile, recent);
    return true;
  }
  sends.set(mobile, [...recent, now]);
  return false;
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

export async function sendLoginOtp(mobile: string) {
  const config = msg91();
  if (!config) return { ok: false as const, error: "OTP sending is not configured." };
  const url = new URL("https://control.msg91.com/api/v5/otp");
  url.searchParams.set("template_id", config.templateId);
  url.searchParams.set("mobile", `91${mobile}`);
  url.searchParams.set("otp_length", "6");
  url.searchParams.set("otp_expiry", "10");
  const response = await fetch(url, {
    method: "POST",
    headers: { authkey: config.authkey, accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  const payload = (await response.json().catch(() => null)) as { type?: string } | null;
  if (response.ok && payload?.type === "success") return { ok: true as const };
  return { ok: false as const, error: "Could not send the OTP." };
}

export async function verifyLoginOtp(mobile: string, otp: string) {
  const authkey = process.env.MSG91_AUTH_KEY?.trim() ?? "";
  if (!authkey) return false;
  const url = new URL("https://control.msg91.com/api/v5/otp/verify");
  url.searchParams.set("mobile", `91${mobile}`);
  url.searchParams.set("otp", otp);
  const response = await fetch(url, {
    headers: { authkey, accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  const payload = (await response.json().catch(() => null)) as { type?: string; message?: string } | null;
  return Boolean(response.ok && (payload?.type === "success" || payload?.message === "OTP verified success"));
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
