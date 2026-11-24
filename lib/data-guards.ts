import { env } from "cloudflare:workers";

export const protectionSettings = env as unknown as {
  DB: D1Database;
  ADMIN_TOKEN?: string;
  HOAN_LOCAL_DEV?: string;
};

const rateRules = {
  "admin-login": { count: 8, duration: 15 * 60 },
  "admin-push-test": { count: 4, duration: 60 },
  "admin-native-push-test": { count: 4, duration: 60 },
  "appointment-access": { count: 18, duration: 5 * 60 },
  "appointment-create": { count: 12, duration: 10 * 60 },
  "availability": { count: 90, duration: 60 },
  "booking-otp-send": { count: 8, duration: 10 * 60 },
  "booking-otp-number": { count: 3, duration: 15 * 60 },
  "booking-otp-total": { count: 60, duration: 60 * 60 },
  "booking-otp-check": { count: 20, duration: 10 * 60 },
  "booking-google-start": { count: 18, duration: 5 * 60 },
  "booking-google-check": { count: 24, duration: 5 * 60 },
};

export async function keyedHash(secret: string, value: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const result = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
  return Array.from(result, byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function limitSensitiveRequest(request: Request, scope: keyof typeof rateRules, identity?: string): Promise<Response | null> {
  const { count, duration } = rateRules[scope];
  const now = Math.floor(Date.now() / 1000);
  const secret = protectionSettings.ADMIN_TOKEN;
  const address = protectionSettings.HOAN_LOCAL_DEV === "1" ? "local" : request.headers.get("CF-Connecting-IP") || "unknown";
  const hash = secret ? await keyedHash(secret, "rate:" + (identity ?? address)) : "unconfigured";
  const expires = (Math.floor(now / duration) + 1) * duration;
  const accepted = await protectionSettings.DB.prepare(`
    INSERT INTO sensitive_request_limits (scope, client_hash, window_end, attempts)
    VALUES (?, ?, ?, 1)
    ON CONFLICT (scope, client_hash) DO UPDATE SET
      attempts = CASE WHEN window_end <= ? THEN 1 ELSE attempts + 1 END,
      window_end = excluded.window_end
    WHERE window_end <= ? OR attempts < ?
    RETURNING attempts
  `).bind(scope, hash, expires, now, now, count).first();

  if (accepted) {
    if (Math.random() < 0.02) {
      await protectionSettings.DB.prepare("DELETE FROM sensitive_request_limits WHERE window_end < ?").bind(now - 86400).run();
    }
    return null;
  }
  return Response.json({ error: "Bạn đã thực hiện nhiều yêu cầu. Vui lòng thử lại sau." }, {
    status: 429,
    headers: { "Cache-Control": "no-store", "Retry-After": String(expires - now) },
  });
}

export async function readBoundedObject(request: Request, limit: number): Promise<Record<string, unknown>> {
  if (!request.body || Number(request.headers.get("Content-Length")) > limit) throw new Error("INVALID_REQUEST");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let length = 0;
  let text = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        await reader.cancel();
        throw new Error("INVALID_REQUEST");
      }
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
  const parsed = JSON.parse(text + decoder.decode());
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("INVALID_REQUEST");
  return parsed as Record<string, unknown>;
}
