import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import type { NextRequest } from "next/server";
import { sessionCookie, validSession } from "./push-session";
import { isAllowedOrigin } from "./request-origin";

export function pushConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const adminSecret = process.env.PUSH_ADMIN_SECRET ?? "";
  const topic = process.env.FCM_BROADCAST_TOPIC?.trim();
  const appUrl = process.env.APP_URL?.trim();
  if (!projectId || !clientEmail || !privateKey || adminSecret.length < 32 || !topic || !/^[a-zA-Z0-9_.~%-]{1,100}$/.test(topic)) return null;
  if (process.env.NODE_ENV === "production" && !appUrl?.startsWith("https://")) return null;
  if (appUrl) { try { new URL(appUrl); } catch { return null; } }
  return { projectId, clientEmail, privateKey, adminSecret, topic, appUrl };
}

export function isSameOrigin(request: NextRequest) {
  return isAllowedOrigin(request);
}

export function isPushAdmin(request: NextRequest) {
  return validSession(request.cookies.get(sessionCookie)?.value, process.env.PUSH_ADMIN_SECRET ?? "");
}

export function messaging() {
  const config = pushConfig();
  if (!config) throw new Error("Push notification setup is incomplete.");
  const name = "ppcc-push";
  const app = getApps().find(app => app.name === name) ?? initializeApp({
    credential: cert({ projectId: config.projectId, clientEmail: config.clientEmail, privateKey: config.privateKey }),
    projectId: config.projectId,
  }, name);
  return getMessaging(app);
}

export async function readSmallJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new Error("Use application/json.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Request body is required.");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 16_384) { await reader.cancel(); throw new Error("Request is too large."); }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
