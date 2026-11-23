import { matchesAdminKey, sameOrigin } from './admin-authorization.mjs';
import { keyedHash, protectionSettings } from './data-guards';
import { pushInstallationId, pushInstallationSecret } from './admin-push-installation';
export { sameOrigin } from './admin-authorization.mjs';

const sessionSeconds = 8 * 60 * 60;
export const privateHeaders = { "Cache-Control": "no-store", "Vary": "Cookie" };

export function adminTransport(request: Request) {
  const url = new URL(request.url);
  return url.protocol === "https:" || (
    protectionSettings.HOAN_LOCAL_DEV === "1" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  );
}

function cookieName(request: Request) {
  return new URL(request.url).protocol === "https:" ? "__Host-hoan_admin" : "hoan_admin_local";
}

function sessionValue(request: Request) {
  const prefix = cookieName(request) + "=";
  const value = request.headers.get("Cookie")?.split(";").map(item => item.trim()).find(item => item.startsWith(prefix))?.slice(prefix.length);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : "";
}

function sessionCookie(request: Request, value: string, maxAge: number) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${cookieName(request)}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export async function adminSessionHash(request: Request) {
  const secret = protectionSettings.ADMIN_TOKEN;
  if (!secret || !sameOrigin(request) || !adminTransport(request)) return "";
  const value = sessionValue(request);
  return value ? keyedHash(secret, "admin:" + value) : "";
}

export async function siteAdmin(request: Request) {
  const hash = await adminSessionHash(request);
  if (!hash) return false;
  return Boolean(await protectionSettings.DB.prepare(
    "SELECT token_hash FROM admin_sessions WHERE token_hash = ? AND expires_at > ?",
  ).bind(hash, Date.now()).first());
}

export async function startAdminSession(request: Request, candidate: string) {
  const secret = protectionSettings.ADMIN_TOKEN;
  if (!secret || !adminTransport(request) || !sameOrigin(request) || !candidate || candidate.length > 1024) return null;
  if (!await matchesAdminKey(candidate, secret)) return null;

  const value = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, "0")).join("");
  const hash = await keyedHash(secret, "admin:" + value);
  const previous = sessionValue(request);
  const previousHash = previous ? await keyedHash(secret, "admin:" + previous) : "";
  const now = Date.now();
  await protectionSettings.DB.batch([
    protectionSettings.DB.prepare("DELETE FROM admin_sessions WHERE token_hash = ? OR expires_at <= ?").bind(previousHash, now),
    protectionSettings.DB.prepare("INSERT INTO admin_sessions (token_hash, expires_at) VALUES (?, ?)").bind(hash, now + sessionSeconds * 1000),
  ]);
  return sessionCookie(request, value, sessionSeconds);
}

export async function endAdminSession(request: Request) {
  if (!adminTransport(request) || !sameOrigin(request)) return sessionCookie(request, "", 0);
  const hash = await adminSessionHash(request);
  const installation = await pushInstallationId(pushInstallationSecret(request));
  const db = protectionSettings.DB;
  const writes = [];
  if (hash) writes.push(db.prepare("DELETE FROM admin_sessions WHERE token_hash = ?").bind(hash));
  if (installation) writes.push(db.prepare("DELETE FROM admin_push_subscriptions WHERE id = ?").bind(installation));
  if (writes.length) await db.batch(writes);
  return sessionCookie(request, "", 0);
}
