import { env } from 'cloudflare:workers';
import { importPKCS8, SignJWT } from 'jose';
import { keyedHash, protectionSettings } from './data-guards';

const apnsEnv = env as { HOAN_APNS_CONFIG?: string };
const lifetime = 24 * 60 * 60 * 1000;
const validCode = (code: string) => /^[A-Z0-9-]{3,80}$/.test(code);
export type NativePushConfig = {
  teamId: string; keyId: string; bundleId: string; environment: 'development' | 'production'; privateKey: string;
};
export type NativeInstallation = { id: string; device_token: string; environment: string; updated_at: number };
type Job = { installation_id: string; event_key: string; appointment_code: string; expires_at: number; attempts: number };
let providerCache: { config: string; token: string; validUntil: number } | undefined;
let providerPending: { config: string; promise: Promise<string> } | undefined;

export function nativePushConfig(): NativePushConfig | null {
  try {
    if (!protectionSettings.ADMIN_TOKEN) return null;
    const value = JSON.parse(apnsEnv.HOAN_APNS_CONFIG || 'null');
    if (!value || !/^[A-Z0-9]{10}$/.test(value.teamId) || !/^[A-Z0-9]{10}$/.test(value.keyId) ||
        typeof value.bundleId !== 'string' || value.bundleId.length > 255 || !/^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(value.bundleId) ||
        !['development', 'production'].includes(value.environment) || typeof value.privateKey !== 'string' ||
        value.privateKey.length > 4096 || !value.privateKey.includes('-----BEGIN PRIVATE KEY-----')) return null;
    return { teamId: value.teamId, keyId: value.keyId, bundleId: value.bundleId, environment: value.environment, privateKey: value.privateKey };
  } catch { return null; }
}

export function nativePushGeneration(config: NativePushConfig) {
  // Rotating a provider signing key must not strand opted-in iPhones that are offline.
  return keyedHash(protectionSettings.ADMIN_TOKEN!, 'native-push:' + JSON.stringify({ teamId: config.teamId, bundleId: config.bundleId, environment: config.environment }));
}

export function validNativeToken(value: unknown): value is string {
  return typeof value === 'string' && value.length % 2 === 0 && /^[a-fA-F0-9]{64,512}$/.test(value);
}

async function providerToken(config: NativePushConfig) {
  const cacheKey = JSON.stringify(config);
  if (providerCache?.config === cacheKey && providerCache.validUntil > Date.now()) return providerCache.token;
  if (providerPending?.config === cacheKey) return providerPending.promise;
  const promise = (async () => {
    const key = await importPKCS8(config.privateKey, 'ES256');
    const token = await new SignJWT({}).setProtectedHeader({ alg: 'ES256', kid: config.keyId })
      .setIssuer(config.teamId).setIssuedAt().sign(key);
    providerCache = { config: cacheKey, token, validUntil: Date.now() + 40 * 60_000 };
    return token;
  })();
  providerPending = { config: cacheKey, promise };
  try { return await promise; }
  finally { if (providerPending?.promise === promise) providerPending = undefined; }
}

export async function sendNativePush(device: NativeInstallation, config: NativePushConfig, code: string, event: string, expires: number) {
  if (!validNativeToken(device.device_token) || device.environment !== config.environment) return { status: 400, reason: 'BadDeviceToken', timestamp: 0 };
  const host = config.environment === 'production' ? 'api.push.apple.com' : 'api.sandbox.push.apple.com';
  const collapse = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(event));
  const collapseId = Array.from(new Uint8Array(collapse), byte => byte.toString(16).padStart(2, '0')).join('');
  const authorization = await providerToken(config);
  const response = await fetch(`https://${host}/3/device/${device.device_token}`, {
    method: 'POST', redirect: 'manual', signal: AbortSignal.timeout(8_000),
    headers: {
      authorization: 'bearer ' + authorization, 'content-type': 'application/json',
      'apns-topic': config.bundleId, 'apns-push-type': 'alert', 'apns-priority': '10',
      'apns-expiration': String(Math.floor(expires / 1000)), 'apns-collapse-id': collapseId, 'apns-id': crypto.randomUUID(),
    },
    body: JSON.stringify({ aps: { alert: { title: code ? 'HOÀN · Có lịch đặt mới' : 'HOÀN · Thông báo thử', body: code ? 'Mở ứng dụng để xem và duyệt lịch.' : 'iPhone đã nhận thông báo từ máy chủ HOÀN.' }, sound: 'default' }, kind: code ? 'booking' : 'test', code }),
  });
  const raw: unknown = response.status === 200 ? {} : await response.json().catch(() => ({}));
  const error = raw && typeof raw === 'object' ? raw as { reason?: unknown; timestamp?: unknown } : {};
  const reason = typeof error.reason === 'string' && /^[A-Za-z0-9]{1,80}$/.test(error.reason) ? error.reason : '';
  if (reason === 'ExpiredProviderToken' && providerCache?.token === authorization) providerCache = undefined;
  return { status: response.status, reason, timestamp: typeof error.timestamp === 'number' ? error.timestamp : 0 };
}

export async function removeNativeInstallation(device: NativeInstallation, invalidatedAt = 0) {
  if (invalidatedAt && device.updated_at > invalidatedAt) return;
  await protectionSettings.DB.prepare('DELETE FROM admin_apns_installations WHERE id=? AND device_token=? AND updated_at=?')
    .bind(device.id, device.device_token, device.updated_at).run();
}

function enqueue(generation: string, code: string, created: number) {
  return protectionSettings.DB.prepare(
    'INSERT OR IGNORE INTO admin_apns_jobs (installation_id,event_key,appointment_code,next_attempt_at,expires_at) ' +
    'SELECT id,?,?,?,? FROM admin_apns_installations WHERE generation=? AND created_at<=?'
  ).bind('booking:' + code, code, created, created + lifetime, generation, created);
}

async function deliver(job: Job, config: NativePushConfig, generation: string) {
  const db = protectionSettings.DB;
  const device = await db.prepare('SELECT id,device_token,environment,updated_at FROM admin_apns_installations WHERE id=? AND generation=?')
    .bind(job.installation_id, generation).first<NativeInstallation>();
  if (!device) return;
  const booking = await db.prepare("SELECT code FROM appointments WHERE code=? AND archived_at IS NULL AND status!='cancelled'").bind(job.appointment_code).first();
  let result = { status: 204, reason: '', timestamp: 0 };
  if (booking && job.expires_at > Date.now()) {
    try { result = await sendNativePush(device, config, job.appointment_code, job.event_key, job.expires_at); }
    catch { result = { status: 503, reason: 'TransportError', timestamp: 0 }; }
  }
  if (result.status === 410 || (result.status === 400 && result.reason === 'BadDeviceToken')) await removeNativeInstallation(device, result.timestamp);
  const retry = (result.status === 429 || result.status >= 500 || result.reason === 'ExpiredProviderToken') && job.attempts < 8;
  const delay = (result.status >= 500 || result.reason === 'ExpiredProviderToken' ? 15 * 60_000 : 60_000) * 2 ** (job.attempts - 1);
  await db.prepare('UPDATE admin_apns_jobs SET done=?,next_attempt_at=?,last_status=?,last_reason=? WHERE installation_id=? AND event_key=? AND attempts=?')
    .bind(retry ? 0 : 1, Date.now() + delay, result.status, result.reason, job.installation_id, job.event_key, job.attempts).run();
}

async function drain(config: NativePushConfig, generation: string) {
  const now = Date.now();
  const { results } = await protectionSettings.DB.prepare(
    'UPDATE admin_apns_jobs SET attempts=attempts+1,next_attempt_at=? WHERE rowid IN (' +
    'SELECT j.rowid FROM admin_apns_jobs j JOIN admin_apns_installations d ON d.id=j.installation_id ' +
    'WHERE j.done=0 AND j.next_attempt_at<=? AND j.expires_at>? AND d.generation=? ORDER BY j.next_attempt_at,j.rowid LIMIT 8) ' +
    'RETURNING installation_id,event_key,appointment_code,expires_at,attempts'
  ).bind(now + 45_000, now, now, generation).all<Job>();
  await Promise.all(results.map(job => deliver(job, config, generation)));
}

export async function pushNewNativeBooking(code: string, createdAt: string) {
  const config = nativePushConfig();
  const created = Date.parse(createdAt);
  if (!config || !validCode(code) || !Number.isFinite(created)) return;
  const generation = await nativePushGeneration(config);
  await enqueue(generation, code, created).run();
  await drain(config, generation);
}

export async function retryNativePush() {
  const config = nativePushConfig();
  if (!config) return;
  const db = protectionSettings.DB;
  const now = Date.now();
  const generation = await nativePushGeneration(config);
  await db.prepare('DELETE FROM admin_apns_jobs WHERE expires_at<=?').bind(now).run();
  if (!await db.prepare('SELECT id FROM admin_apns_installations WHERE generation=? LIMIT 1').bind(generation).first()) return;
  await db.prepare(
    "WITH events AS (SELECT CASE WHEN json_valid(value) THEN json_extract(value,'$.entityId') END AS code," +
    "CASE WHEN json_valid(value) THEN ROUND(unixepoch(json_extract(value,'$.createdAt'),'subsec')*1000) END AS created " +
    "FROM site_content WHERE key LIKE 'notification:%' AND updated_at>=? " +
    "AND CASE WHEN json_valid(value) THEN json_extract(value,'$.type') END='appointment.created') " +
    'INSERT OR IGNORE INTO admin_apns_jobs (installation_id,event_key,appointment_code,next_attempt_at,expires_at) ' +
    "SELECT d.id,'booking:'||e.code,e.code,e.created,e.created+? FROM events e " +
    "JOIN appointments a ON a.code=e.code AND a.archived_at IS NULL AND a.status!='cancelled' " +
    'JOIN admin_apns_installations d ON d.generation=? AND d.created_at<=e.created ' +
    "WHERE e.created>? AND length(e.code) BETWEEN 3 AND 80 AND e.code NOT GLOB '*[^A-Z0-9-]*'"
  ).bind(new Date(now - lifetime).toISOString(), lifetime, generation, now - lifetime).run();
  await drain(config, generation);
}
