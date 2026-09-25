import { NextRequest, NextResponse } from "next/server";
import { findMember, normalizeMobile, sendLoginOtp, tooManyOtpSends } from "@/lib/app-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { mobile?: unknown; reqId?: unknown };
  try {
    body = (await request.json()) as { mobile?: unknown; reqId?: unknown };
  } catch {
    return NextResponse.json({ error: "Enter a valid mobile number." }, { status: 400 });
  }

  if (!body || typeof body !== "object") return NextResponse.json({ error: "Enter a valid mobile number." }, { status: 400 });
  if (body.reqId !== undefined && (typeof body.reqId !== "string" || !body.reqId || body.reqId.length > 200)) return NextResponse.json({ error: "Invalid OTP request." }, { status: 400 });
  const mobile = normalizeMobile(body.mobile);
  if (!mobile) return NextResponse.json({ error: "Enter a valid mobile number." }, { status: 400 });

  try {
    const member = await findMember(mobile);
    if (!member) return NextResponse.json({ error: "You don't have permission to sign in." }, { status: 403 });
    if (await tooManyOtpSends(mobile)) {
      return NextResponse.json({ error: "Too many OTP requests. Wait a few minutes." }, { status: 429 });
    }
    const sent = await sendLoginOtp(mobile, typeof body.reqId === "string" ? body.reqId : "");
    if (!sent.ok) return NextResponse.json({ error: sent.error }, { status: sent.error.includes("not configured") ? 503 : 502 });
    return NextResponse.json({ ok: true, reqId: sent.reqId, channel: "whatsapp", otp_length: 4 });
  } catch {
    return NextResponse.json({ error: "Could not send the OTP." }, { status: 503 });
  }
}
