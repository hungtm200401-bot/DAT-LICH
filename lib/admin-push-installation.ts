function cookieName(request: Request) {
  return new URL(request.url).protocol === "https:" ? "__Host-hoan_push" : "hoan_push_local";
}

export function pushInstallationSecret(request: Request) {
  const prefix = cookieName(request) + "=";
  const value = request.headers.get("Cookie")?.split(";").map(item => item.trim())
    .find(item => item.startsWith(prefix))?.slice(prefix.length);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : "";
}

export function pushInstallationCookie(request: Request, secret: string, maxAge = 31_536_000) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return cookieName(request) + "=" + secret + "; Path=/; HttpOnly; SameSite=Strict; Max-Age=" + maxAge + secure;
}

function hex(bytes: Uint8Array) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

export function newPushInstallationSecret() {
  return hex(crypto.getRandomValues(new Uint8Array(32)));
}

export async function pushInstallationId(secret: string) {
  if (!secret) return "";
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret))));
}
