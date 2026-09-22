import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { makeBroadcastMessage, parseBroadcast } from "@/lib/push-contract";
import { isPushAdmin, isSameOrigin, messaging, pushConfig, readSmallJson } from "@/lib/push-server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  if (!isPushAdmin(request)) return NextResponse.json({ error: "Unlock sending with your admin access code." }, { status: 401 });
  const config = pushConfig();
  if (!config) return NextResponse.json({ error: "Firebase setup is incomplete." }, { status: 503 });
  let draft;
  try { draft = parseBroadcast(await readSmallJson(request)); }
  catch (error) { return NextResponse.json({ error: error instanceof SyntaxError ? "Invalid JSON." : error instanceof Error ? error.message : "Invalid notification." }, { status: 422 }); }
  const id = randomUUID();
  try {
    const messageId = await messaging().send(makeBroadcastMessage(draft, config.topic, id));
    return NextResponse.json({ id, message_id: messageId, status: "accepted", message: "Firebase accepted this notification for subscribed app devices. This is not a delivery count." }, { status: 202 });
  } catch {
    // A timeout may occur after FCM accepted a message; never automatically retry.
    return NextResponse.json({ error: "Could not confirm Firebase acceptance. Check Firebase before sending again to avoid duplicates." }, { status: 502 });
  }
}
