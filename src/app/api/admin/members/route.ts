import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { normalizeMobile } from "@/lib/app-auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return origin === new URL(process.env.APP_URL || request.nextUrl.origin).origin;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  let body: { mobile?: unknown };
  try {
    body = (await request.json()) as { mobile?: unknown };
  } catch {
    return NextResponse.json({ error: "Enter a valid mobile number." }, { status: 400 });
  }

  const mobile = normalizeMobile(body.mobile);
  if (!mobile) return NextResponse.json({ error: "Enter a 10-digit Indian mobile number." }, { status: 400 });

  try {
    const inserted = await db().query(
      `INSERT INTO members (mobile) VALUES ($1)
       ON CONFLICT (mobile) DO NOTHING
       RETURNING mobile`,
      [mobile],
    );
    if (!inserted.rowCount) return NextResponse.json({ error: "This number is already saved." }, { status: 409 });
    return NextResponse.json({ ok: true, mobile });
  } catch {
    return NextResponse.json({ error: "Could not save the number." }, { status: 503 });
  }
}
