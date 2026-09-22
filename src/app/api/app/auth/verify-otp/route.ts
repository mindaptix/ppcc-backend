import { NextRequest, NextResponse } from "next/server";
import { findMember, normalizeMobile, normalizeOtp, openMemberSession, otpIsConfigured, verifyLoginOtp } from "@/lib/app-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const failures = new Map<string, number[]>();

function tooManyChecks(mobile: string) {
  const now = Date.now();
  const recent = (failures.get(mobile) ?? []).filter((stamp) => now - stamp < 10 * 60 * 1000);
  failures.set(mobile, recent);
  return recent.length >= 5;
}

function noteFailure(mobile: string) {
  const now = Date.now();
  const recent = (failures.get(mobile) ?? []).filter((stamp) => now - stamp < 10 * 60 * 1000);
  failures.set(mobile, [...recent, now]);
}

export async function POST(request: NextRequest) {
  let body: { mobile?: unknown; otp?: unknown; fcm_token?: unknown };
  try {
    body = (await request.json()) as { mobile?: unknown; otp?: unknown; fcm_token?: unknown };
  } catch {
    return NextResponse.json({ error: "Enter the mobile number and OTP." }, { status: 400 });
  }

  const mobile = normalizeMobile(body.mobile);
  const otp = normalizeOtp(body.otp);
  const fcmToken = typeof body.fcm_token === "string" ? body.fcm_token.trim().slice(0, 4096) : "";
  if (!mobile || !otp) return NextResponse.json({ error: "Enter the mobile number and OTP." }, { status: 400 });
  if (tooManyChecks(mobile)) {
    return NextResponse.json({ error: "Too many attempts. Wait a few minutes." }, { status: 429 });
  }

  try {
    const member = await findMember(mobile);
    if (!member) return NextResponse.json({ error: "This number cannot sign in." }, { status: 403 });
    if (!otpIsConfigured()) return NextResponse.json({ error: "OTP sending is not configured." }, { status: 503 });
    const verified = await verifyLoginOtp(mobile, otp);
    if (!verified) {
      noteFailure(mobile);
      return NextResponse.json({ error: "OTP is incorrect." }, { status: 401 });
    }
    const token = await openMemberSession(member.id, fcmToken);
    return NextResponse.json({
      token,
      is_new_user: false,
      user: member,
    });
  } catch {
    return NextResponse.json({ error: "Could not sign in." }, { status: 503 });
  }
}
