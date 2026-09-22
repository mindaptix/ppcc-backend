/** Public broadcast only. Recipient filters must never silently widen. */
export function parseBroadcast(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Enter a title and message.");
  const body = value as Record<string, unknown>;
  if (body.district !== "All Punjab" || body.audience !== "All members") {
    throw new Error("Only All Punjab / All members broadcasts are connected. District and role targeting need member integration.");
  }
  if (!Array.isArray(body.channels) || body.channels.length !== 1 || body.channels[0] !== "Push notification") {
    throw new Error("Select Push notification only. SMS and a saved app inbox are not connected.");
  }
  if (typeof body.title !== "string" || !body.title.trim() || body.title.length > 120 ||
      typeof body.message !== "string" || !body.message.trim() || body.message.length > 3000) {
    throw new Error("Enter a title (up to 120 characters) and a message (up to 3,000 characters).");
  }
  // Topic messages have a 2,048-byte payload limit. Reserve room for metadata.
  if (new TextEncoder().encode(JSON.stringify({ title: body.title.trim(), body: body.message.trim() })).length > 1500) {
    throw new Error("This push message is too long. Shorten it; Punjabi text and emoji use more bytes.");
  }
  return { title: body.title.trim(), message: body.message.trim() };
}

export function makeBroadcastMessage(body: ReturnType<typeof parseBroadcast>, topic: string, id: string) {
  return {
    topic,
    notification: { title: body.title, body: body.message },
    data: { notification_id: id, type: "announcement" },
    android: {
      priority: "high" as const,
      ttl: 24 * 60 * 60 * 1000,
      notification: { channelId: "ppcc_updates", sound: "default", tag: id },
    },
    apns: { payload: { aps: { sound: "default" } } },
  };
}
