import { NextResponse } from "next/server";
import { staticNotices } from "@/lib/static-portal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    notices: staticNotices.map((notice) => ({
      id: notice.id,
      title: notice.title,
      body: notice.body,
      district: notice.district,
      date: notice.date,
      status: notice.status,
      mobiles: notice.mobiles,
    })),
  });
}
