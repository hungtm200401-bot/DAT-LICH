import { env } from "cloudflare:workers";

export function sameOrigin(request: Request) {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

// Local development is loopback-only. Public deployments fail closed until
// ADMIN_TOKEN is configured as a Worker secret, never in public site content.
export async function siteAdmin(request: Request) {
  if (!sameOrigin(request)) return false;
  const isLocalDev = (env as unknown as { HOAN_LOCAL_DEV?: string }).HOAN_LOCAL_DEV === "1";
  const hostname = new URL(request.url).hostname;
  const isLocalHost =
    ["localhost", "127.0.0.1", "[::1]", "0.0.0.0", "terminal.local"].includes(hostname)
    || /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)
    || /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)
    || /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname);
  if (isLocalDev && isLocalHost) return true;

  const token = (env as unknown as { ADMIN_TOKEN?: string }).ADMIN_TOKEN;
  if (token) {
    const supplied = request.headers.get("Authorization")?.replace(/^Bearer /, "") || "";
    const digest = async (value: string) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
    const [a, b] = await Promise.all([digest(token), digest(supplied)]);
    return a.reduce((diff, value, index) => diff | (value ^ b[index]), 0) === 0;
  }
  return ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
}

export const privateHeaders = { "Cache-Control": "no-store", "Vary": "Authorization" };
