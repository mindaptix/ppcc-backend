import { NextRequest, NextResponse } from "next/server";
import { findMember, normalizeMobile, sendLoginOtp, tooManyOtpSends } from "@/lib/app-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { mobile?: unknown };
  try {
    body = (await request.json()) as { mobile?: unknown };
  } catch {
    return NextResponse.json({ error: "Enter a valid mobile number." }, { status: 400 });
  }

  const mobile = normalizeMobile(body.mobile);
  if (!mobile) return NextResponse.json({ error: "Enter a valid mobile number." }, { status: 400 });

  try {
    const member = await findMember(mobile);
    if (!member) return NextResponse.json({ error: "This number cannot sign in." }, { status: 403 });
    if (tooManyOtpSends(mobile)) {
      return NextResponse.json({ error: "Too many OTP requests. Wait a few minutes." }, { status: 429 });
    }
    const sent = await sendLoginOtp(mobile);
    if (!sent.ok) return NextResponse.json({ error: sent.error }, { status: sent.error.includes("not configured") ? 503 : 502 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not send the OTP." }, { status: 503 });
  }
}
