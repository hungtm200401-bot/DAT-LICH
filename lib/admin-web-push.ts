import { env } from "cloudflare:workers";
import { encryptNotification, vapidHeaders, type PushSubscription, type VapidKeys } from "@block65/webcrypto-web-push";
import { keyedHash, protectionSettings } from "./data-guards";
import { workReminders } from "./work-reminders";

const pushEnv = env as { HOAN_WEB_PUSH_CONFIG?: string };
const bookingLifetime = 24 * 60 * 60 * 1000;
const day = 24 * 60 * 60 * 1000;
const claimLimit = 8;
const maxAttempts = 8;
type PushConfig = { publicKey: string; privateKey: string; subject: string };
type Kind = "booking" | "reminder";
type Job = {
  subscription_id: string;
  event_key: string;
  kind: Kind;
  appointment_code: string;
  starts_at: number | null;
  expires_at: number;
  attempts: number;
};
export type PushDestination = { id: string; endpoint: string; p256dh: string; auth: string; updated_at: number };
const authByOrigin = new Map<string, { key: string; validUntil: number; header: string }>();

function bytes(value: unknown, length: number) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value) || value.length !== Math.ceil(length * 8 / 6)) return null;
  const decoded = Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), character => character.charCodeAt(0));
  return decoded.byteLength === length ? decoded : null;
}

export function adminPushConfig(): PushConfig | null {
  try {
    if (!protectionSettings.ADMIN_TOKEN) return null;
    const value = JSON.parse(pushEnv.HOAN_WEB_PUSH_CONFIG || "null");
    if (bytes(value?.publicKey, 65)?.[0] !== 4 || !bytes(value.privateKey, 32)) return null;
    const subject = new URL(value.subject);
    if (subject.protocol !== "https:" && subject.protocol !== "mailto:") return null;
    return { publicKey: value.publicKey, privateKey: value.privateKey, subject: subject.href };
  } catch {
    return null;
  }
}

export function pushGeneration(config: PushConfig) {
  return keyedHash(protectionSettings.ADMIN_TOKEN!, "admin-push:" + config.publicKey);
}

function pushEndpoint(value: unknown) {
  if (typeof value !== "string" || value.length > 2048 || /[\s\\]/.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.port || url.username || url.password || url.hash || url.pathname === "/") return null;
    const apple = url.hostname.endsWith(".push.apple.com");
    const chrome = url.hostname === "fcm.googleapis.com" && /^\/(?:wp|fcm\/send)\/[^/]+/.test(url.pathname);
    const firefox = url.hostname === "updates.push.services.mozilla.com" && /^\/wpush\/v2\/[^/]+/.test(url.pathname);
    return apple || chrome || firefox ? url : null;
  } catch {
    return null;
  }
}

export async function readPushSubscription(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const data = value as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  const endpoint = pushEndpoint(data.endpoint);
  const p256dh = data.keys?.p256dh;
  const auth = data.keys?.auth;
  const point = bytes(p256dh, 65);
  if (!endpoint || point?.[0] !== 4 || !bytes(auth, 16)) return null;
  try {
    await crypto.subtle.importKey("raw", point, { name: "ECDH", namedCurve: "P-256" }, false, []);
    return { endpoint: endpoint.href, p256dh: p256dh as string, auth: auth as string };
  } catch {
    return null;
  }
}

async function authorization(subscription: PushSubscription, origin: string, config: VapidKeys) {
  const cached = authByOrigin.get(origin);
  if (cached && cached.key === config.publicKey && cached.validUntil > Date.now()) return cached.header;
  const { headers } = await vapidHeaders(subscription, config);
  authByOrigin.set(origin, { key: config.publicKey!, validUntil: Date.now() + 6 * 60 * 60 * 1000, header: headers.authorization });
  return headers.authorization;
}

async function topic(eventKey: string) {
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(eventKey)));
  return btoa(String.fromCharCode(...hash.slice(0, 20))).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export async function sendAdminPush(
  device: PushDestination, config: PushConfig, kind: Kind | "test", code: string,
  eventKey: string, expiresAt: number,
) {
  const endpoint = pushEndpoint(device.endpoint);
  if (!endpoint) return 410;
  const subscription = { endpoint: endpoint.href, keys: { p256dh: device.p256dh, auth: device.auth }, expirationTime: null };
  const body = await encryptNotification(subscription, new TextEncoder().encode(JSON.stringify({ kind, code })));
  const response = await fetch(endpoint, {
    method: "POST", redirect: "manual", signal: AbortSignal.timeout(8_000), body,
    headers: {
      Authorization: await authorization(subscription, endpoint.origin, config),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: String(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))),
      Urgency: kind === "reminder" ? "normal" : "high",
      Topic: await topic(eventKey),
    },
  });
  void response.body?.cancel().catch(() => {});
  return response.status;
}

export async function removeGonePushDevice(device: PushDestination) {
  await protectionSettings.DB.prepare("DELETE FROM admin_push_subscriptions WHERE id = ? AND updated_at = ?")
    .bind(device.id, device.updated_at).run();
}

const validCode = (code: string) => /^[A-Z0-9-]{3,80}$/.test(code);

function pushJob(generation: string, kind: Kind, code: string, at: number, startsAt: number | null = null) {
  const eventKey = kind === "booking" ? "booking:" + code : "reminder:" + code + ":" + startsAt;
  return protectionSettings.DB.prepare(
    "INSERT OR IGNORE INTO admin_push_jobs (subscription_id, event_key, kind, appointment_code, starts_at, next_attempt_at, expires_at) " +
    "SELECT id, ?, ?, ?, ?, ?, ? FROM admin_push_subscriptions WHERE generation = ? AND (? = 'reminder' OR created_at <= ?)"
  ).bind(eventKey, kind, code, startsAt, at, startsAt ?? at + bookingLifetime, generation, kind, at);
}

async function claimJobs(generation: string, now: number) {
  const { results } = await protectionSettings.DB.prepare(
    "UPDATE admin_push_jobs SET attempts = attempts + 1, next_attempt_at = ? WHERE rowid IN (" +
      "SELECT j.rowid FROM admin_push_jobs j JOIN admin_push_subscriptions d ON d.id = j.subscription_id " +
      "WHERE j.done = 0 AND j.next_attempt_at <= ? AND j.expires_at > ? AND d.generation = ? " +
      "ORDER BY j.next_attempt_at, j.rowid LIMIT ?) " +
    "RETURNING subscription_id, event_key, kind, appointment_code, starts_at, expires_at, attempts"
  ).bind(now + 45_000, now, now, generation, claimLimit).all<Job>();
  return results;
}

async function deliverJob(job: Job, config: PushConfig, generation: string) {
  const db = protectionSettings.DB;
  const device = await db.prepare(
    "SELECT id, endpoint, p256dh, auth, updated_at FROM admin_push_subscriptions WHERE id = ? AND generation = ?"
  ).bind(job.subscription_id, generation).first<PushDestination>();
  if (!device) return;
  const booking = await db.prepare(
    "SELECT code, date, time, status, archived_at AS archivedAt FROM appointments WHERE code = ? AND archived_at IS NULL"
  ).bind(job.appointment_code).first<{ code: string; date: string; time: string; status: string; archivedAt: null }>();

  let status = 204;
  if (booking && booking.status !== "cancelled" && job.expires_at > Date.now() &&
      (job.kind === "booking" || workReminders([booking])[0]?.startsAt === job.starts_at)) {
    try {
      status = await sendAdminPush(device, config, job.kind, job.appointment_code, job.event_key, job.expires_at);
    } catch {
      status = 503;
    }
  }
  if (status === 404 || status === 410) {
    await removeGonePushDevice(device);
    return;
  }

  const retry = (status === 429 || status >= 500) && job.attempts < maxAttempts;
  if (status >= 300 && !retry) console.warn("HOAN Web Push delivery stopped", status);
  await db.prepare(
    "UPDATE admin_push_jobs SET done = ?, next_attempt_at = ? WHERE subscription_id = ? AND event_key = ? AND attempts = ?"
  ).bind(retry ? 0 : 1, Date.now() + 60_000 * 2 ** (job.attempts - 1), job.subscription_id, job.event_key, job.attempts).run();
}

async function drainPushJobs(config: PushConfig, generation: string) {
  const jobs = await claimJobs(generation, Date.now());
  await Promise.all(jobs.map(job => deliverJob(job, config, generation)));
}

export async function pushNewBooking(code: string, createdAt: string) {
  const config = adminPushConfig();
  const created = Date.parse(createdAt);
  if (!config || !validCode(code) || !Number.isFinite(created)) return;
  const generation = await pushGeneration(config);
  await pushJob(generation, "booking", code, created).run();
  await drainPushJobs(config, generation);
}

export async function retryAdminPushAndRemind() {
  const config = adminPushConfig();
  if (!config) return;
  const generation = await pushGeneration(config);
  const db = protectionSettings.DB;
  const now = Date.now();
  await db.prepare("DELETE FROM admin_push_jobs WHERE expires_at <= ?").bind(now).run();
  if (!await db.prepare("SELECT 1 FROM admin_push_subscriptions WHERE generation = ? LIMIT 1").bind(generation).first()) return;

  // The creation notice is committed together with the booking. Recover
  // events even if the request's background task was interrupted.
  const recent = new Date(now - bookingLifetime).toISOString();
  await db.prepare(
    "WITH events AS (" +
      "SELECT CASE WHEN json_valid(value) THEN json_extract(value, '$.entityId') END AS code, " +
        "CASE WHEN json_valid(value) THEN ROUND(unixepoch(json_extract(value, '$.createdAt'), 'subsec') * 1000) END AS created " +
      "FROM site_content WHERE key LIKE 'notification:%' AND updated_at >= ? " +
        "AND CASE WHEN json_valid(value) THEN json_extract(value, '$.type') END = 'appointment.created'" +
    ") INSERT OR IGNORE INTO admin_push_jobs " +
      "(subscription_id, event_key, kind, appointment_code, starts_at, next_attempt_at, expires_at) " +
    "SELECT d.id, 'booking:' || e.code, 'booking', e.code, NULL, e.created, e.created + ? " +
    "FROM events e JOIN appointments a ON a.code = e.code AND a.archived_at IS NULL " +
      "JOIN admin_push_subscriptions d ON d.generation = ? AND d.created_at <= e.created " +
    "WHERE e.created > ? AND a.status != 'cancelled'"
  ).bind(recent, bookingLifetime, generation, now - bookingLifetime).run();

  const inVietnam = (date: number) => new Date(date + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { results: upcoming } = await db.prepare(
    "SELECT code, date, time, status, archived_at AS archivedAt FROM appointments " +
    "WHERE archived_at IS NULL AND status = 'confirmed' AND date BETWEEN ? AND ?"
  ).bind(inVietnam(now), inVietnam(now + day)).all<{ code: string; date: string; time: string; status: string; archivedAt: null }>();
  const due = workReminders(upcoming, now).filter(row => row.remindAt <= now && validCode(row.code));
  if (due.length) await db.batch(due.map(row => pushJob(generation, "reminder", row.code, now, row.startsAt)));
  await drainPushJobs(config, generation);
}
