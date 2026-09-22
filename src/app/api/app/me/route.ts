import { NextRequest, NextResponse } from "next/server";
import { getAppUser } from "@/lib/app-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getAppUser(request);
    if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    return NextResponse.json({ user: session.user });
  } catch {
    return NextResponse.json({ error: "Could not load the profile." }, { status: 503 });
  }
}
