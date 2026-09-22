import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const sessionCookie = "ppcc_push_admin";
export const sessionLifetime = 60 * 60 * 8;

export function equalSecret(value: string, expected: string) {
  return timingSafeEqual(createHash("sha256").update(value).digest(), createHash("sha256").update(expected).digest());
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(`ppcc-push-admin:${value}`).digest("hex");
}

export function createSession(secret: string, now = Date.now()) {
  const expiry = String(Math.floor(now / 1000) + sessionLifetime);
  return `${expiry}.${sign(expiry, secret)}`;
}

export function validSession(token: string | undefined, secret: string, now = Date.now()) {
  if (!token || secret.length < 32) return false;
  const parts = token.split(".");
  if (parts.length !== 2 || !/^\d{10}$/.test(parts[0]) || !/^[a-f0-9]{64}$/.test(parts[1])) return false;
  const expiry = Number(parts[0]);
  const current = Math.floor(now / 1000);
  return expiry > current && expiry <= current + sessionLifetime && equalSecret(parts[1], sign(parts[0], secret));
}
