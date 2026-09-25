import type { NextRequest } from "next/server";

export function isAllowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const configured = [process.env.APP_URL, ...(process.env.ALLOWED_ORIGINS || "").split(",")]
    .map((value) => value?.trim())
    .filter(Boolean);

  try {
    return configured.some((value) => origin === new URL(value!).origin);
  } catch {
    return false;
  }
}
