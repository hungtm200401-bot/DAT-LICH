import assert from 'node:assert/strict';
import { generateKeyPair, exportPKCS8, jwtVerify } from 'jose';
import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { unstable_splitSqlQuery } from 'wrangler';

const { privateKey, publicKey } = await generateKeyPair('ES256', { extractable: true });
const config = { teamId: 'TESTTEAM01', keyId: 'TESTKEY001', bundleId: 'vn.hoanmakeup.admin', environment: 'production', privateKey: await exportPKCS8(privateKey) };
const adminKey = randomUUID() + randomUUID();
const token = 'ab'.repeat(48); // Apple tokens must not be assumed to be 32 bytes.
const deliveries = [];
let providerStatus = 200;
let providerReason = '';
let responseGate;
const modulesRoot = resolve('dist/server');
const modules = (await readdir(modulesRoot, { recursive: true })).filter(name => name.endsWith('.js') && name !== 'index.js');
const mf = new Miniflare(convertV4MiniflareOptions({
  name: 'hoan-verify-apns', modulesRoot, host: '127.0.0.1', port: 0, logRequests: false,
  modules: ['index.js', ...modules].map(path => ({ type: 'ESModule', path: resolve(modulesRoot, path) })),
  compatibilityDate: '2024-09-23', compatibilityFlags: ['nodejs_compat', 'enable_weak_ref'],
  bindings: { HOAN_LOCAL_DEV: '1', ADMIN_TOKEN: adminKey, HOAN_APNS_CONFIG: JSON.stringify(config) },
  d1Databases: { DB: randomUUID() },
  assets: { directory: resolve('dist/client'), binding: 'ASSETS', routerConfig: { has_user_worker: true } },
  async outboundService(request) {
    assert.equal(new URL(request.url).origin, 'https://api.push.apple.com');
    assert.match(new URL(request.url).pathname, /^\/3\/device\/[a-f0-9]+$/);
    assert.equal(request.method, 'POST');
    assert.equal(request.headers.get('apns-topic'), config.bundleId);
    assert.equal(request.headers.get('apns-push-type'), 'alert');
    assert.equal(request.headers.get('apns-priority'), '10');
    assert.ok(Number(request.headers.get('apns-expiration')) > Date.now() / 1000);
    assert.ok(Buffer.byteLength(request.headers.get('apns-collapse-id')) <= 64);
    const jwt = request.headers.get('authorization').replace(/^bearer /, '');
    const { payload, protectedHeader } = await jwtVerify(jwt, publicKey, { issuer: config.teamId, algorithms: ['ES256'] });
    assert.equal(protectedHeader.kid, config.keyId);
    assert.ok(Math.abs(payload.iat - Date.now() / 1000) < 60);
    const data = await request.json();
    assert.equal(data.aps.sound, 'default');
    assert.ok(!JSON.stringify(data).includes('Synthetic APNs'));
    assert.ok(!JSON.stringify(data).includes('0900002201'));
    deliveries.push({ token: new URL(request.url).pathname.split('/').at(-1), data, jwt });
    const status = providerStatus, reason = providerReason;
    if (responseGate) await responseGate;
    return new Response(status === 200 ? null : JSON.stringify({ reason }), { status });
  },
}));

try {
  const base = (await mf.ready).origin;
  const db = await mf.getD1Database('DB');
  for (const file of (await readdir('dist/.openai/drizzle')).filter(file => /^\d+.*\.sql$/.test(file)).sort()) {
    const sql = await readFile(resolve('dist/.openai/drizzle', file), 'utf8');
    await db.batch(unstable_splitSqlQuery(sql).map(query => db.prepare(query)));
  }
  const cookies = new Map();
  async function request(path, { method = 'GET', body, authenticated = true, origin = base, status = 200 } = {}) {
    const headers = { Origin: origin };
    if (authenticated) headers.Cookie = [...cookies.values()].join('; ');
    if (body) headers['Content-Type'] = 'application/json';
    const response = await fetch(base + path, { method, headers, body: body && JSON.stringify(body), signal: AbortSignal.timeout(15000) });
    const json = await response.json().catch(() => ({}));
    assert.equal(response.status, status, JSON.stringify(json));
    for (const header of response.headers.getSetCookie()) {
      const pair = header.split(';')[0];
      if (/Max-Age=0(?:;|$)/i.test(header)) cookies.delete(pair.split('=')[0]);
      else cookies.set(pair.split('=')[0], pair);
    }
    return json;
  }
  const native = (body, options) => request('/api/admin-native-push', { method: 'POST', body, ...options });
  const count = async table => (await db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first()).count;
  const tick = async () => assert.equal((await (await mf.getWorker()).scheduled({ cron: '* * * * *' })).outcome, 'ok');
  async function waitJob(code, done) {
    for (let attempt = 0; attempt < 100; attempt++) {
      const job = await db.prepare('SELECT * FROM admin_apns_jobs WHERE appointment_code = ?').bind(code).first();
      if (job?.attempts > 0 && job.done === done) return job;
      await delay(50);
    }
    assert.fail('APNs job did not finish: ' + code);
  }

  await request('/api/admin-native-push', { status: 401 });
  await native({ action: 'subscribe', token, environment: 'production' }, { status: 401 });
  await request('/api/admin-session', { method: 'POST', body: { key: adminKey } });
  assert.deepEqual(await request('/api/admin-native-push'), { available: true, enabled: false, environment: 'production' });
  await native({ action: 'subscribe', token, environment: 'production' }, { origin: 'https://other.invalid', status: 401 });
  await native({ action: 'subscribe', token: 'bad-token', environment: 'production' }, { status: 400 });
  await native({ action: 'subscribe', token, environment: 'development' }, { status: 400 });
  await native({ action: 'test' }, { status: 409 });
  const enroll = { action: 'subscribe', token, environment: 'production' };
  await native(enroll, { status: 201 });
  await native(enroll, { status: 201 });
  assert.equal(await count('admin_apns_installations'), 1);
  assert.ok(cookies.has('hoan_native_push_local'));
  assert.equal((await request('/api/admin-native-push')).enabled, true);
  assert.equal((await native({ action: 'test' })).accepted, true);
  assert.equal(deliveries.at(-1).data.kind, 'test');

  const date = new Date(Date.now() + 2 * 86400000 + 7 * 3600000).toISOString().slice(0, 10);
  const book = async time => (await request('/api/data', { method: 'POST', authenticated: false, status: 201, body: {
    action: 'createAppointment', customer: 'Synthetic APNs', phone: '0900002201', email: 'apns@example.invalid', serviceId: 'personal', date, time,
  } })).appointment.code;
  const code = await book('10:00');
  await waitJob(code, 1);
  assert.equal(deliveries.at(-1).data.code, code);
  assert.equal(deliveries.at(-1).data.kind, 'booking');
  assert.equal(deliveries[0].jwt, deliveries[1].jwt, 'Provider JWT is reused');
  let sent = deliveries.length;
  await tick();
  assert.equal(deliveries.length, sent, 'Cron does not duplicate a delivered event');

  providerStatus = 503; providerReason = 'ServiceUnavailable';
  const retryCode = await book('12:00');
  const retry = await waitJob(retryCode, 0);
  assert.equal(retry.last_status, 503);
  assert.ok(retry.next_attempt_at >= Date.now() + 14 * 60000, '5xx waits at least 15 minutes');
  providerStatus = 200;
  await db.prepare('UPDATE admin_apns_jobs SET next_attempt_at=0 WHERE appointment_code=?').bind(retryCode).run();
  await tick();
  assert.equal((await waitJob(retryCode, 1)).attempts, 2);

  // A cancelled appointment must not be sent on retry.
  providerStatus = 429; providerReason = 'TooManyRequests';
  const cancelled = await book('14:00');
  await waitJob(cancelled, 0);
  await db.prepare("UPDATE appointments SET status='cancelled' WHERE code=?").bind(cancelled).run();
  await db.prepare('UPDATE admin_apns_jobs SET next_attempt_at=0 WHERE appointment_code=?').bind(cancelled).run();
  providerStatus = 200; sent = deliveries.length;
  await tick();
  assert.equal(deliveries.length, sent);

  // Recover a committed notice whose original background task was interrupted.
  const fallback = 'HMA-APNS-RECOVERY';
  const now = new Date().toISOString();
  await db.batch([
    db.prepare("INSERT INTO appointments (code,customer,phone,service_id,date,time,total,status) VALUES (?,'Synthetic APNs','0900002201','personal',?,'16:00',450000,'pending')").bind(fallback, date),
    db.prepare('INSERT INTO site_content (key,value,updated_at) VALUES (?,?,?)').bind('notification:apns-fallback', JSON.stringify({ type:'appointment.created', entityId:fallback, createdAt:now }), now),
  ]);
  await tick();
  assert.equal(deliveries.at(-1).data.code, fallback);
  sent = deliveries.length;
  await tick(); assert.equal(deliveries.length, sent);

  // Multiple iPhones get the same event, but disabling one leaves the other active.
  const firstCookies = new Map(cookies);
  cookies.clear();
  await request('/api/admin-session', { method: 'POST', body: { key: adminKey }, authenticated: false });
  await native({ ...enroll, token: 'ee'.repeat(32) }, { status: 201 });
  const secondCookies = new Map(cookies);
  const multi = await book('00:00');
  for (let i = 0; i < 100 && deliveries.filter(item => item.data.code === multi).length < 2; i++) await delay(50);
  assert.equal(deliveries.filter(item => item.data.code === multi).length, 2);
  await request('/api/admin-native-push', { method: 'DELETE' });
  assert.equal(await count('admin_apns_installations'), 1);
  cookies.clear(); for (const [key, value] of firstCookies) cookies.set(key, value);
  assert.notDeepEqual([...firstCookies], [...secondCookies]);

  // Terminal provider errors must not become fake success or delete a committed appointment.
  providerStatus = 403; providerReason = 'InvalidProviderToken';
  const rejected = await book('20:00');
  const rejectedJob = await waitJob(rejected, 1);
  assert.equal(rejectedJob.last_status, 403);
  assert.equal(rejectedJob.last_reason, 'InvalidProviderToken');
  assert.equal(await count('admin_apns_installations'), 1);
  providerStatus = 503; providerReason = 'ServiceUnavailable';
  const exhausted = await book('21:00');
  await waitJob(exhausted, 0);
  await db.prepare('UPDATE admin_apns_jobs SET attempts=7,next_attempt_at=0 WHERE appointment_code=?').bind(exhausted).run();
  await tick();
  assert.equal((await waitJob(exhausted, 1)).attempts, 8);
  providerStatus = 200;

  // A late 410 response for an old token must not delete a newer registration.
  providerStatus = 503;
  const raced = await book('17:00');
  await waitJob(raced, 0);
  await db.prepare('UPDATE admin_apns_jobs SET next_attempt_at=0 WHERE appointment_code=?').bind(raced).run();
  providerStatus = 410; providerReason = 'Unregistered';
  let release;
  responseGate = new Promise(resolve => { release = resolve; });
  sent = deliveries.length;
  const racingTick = tick();
  for (let i = 0; i < 100 && deliveries.length === sent; i++) await delay(50);
  assert.ok(deliveries.length > sent);
  const newer = 'ef'.repeat(32);
  await native({ ...enroll, token: newer }, { status: 201 });
  responseGate = undefined;
  release();
  await racingTick;
  assert.equal((await db.prepare('SELECT device_token FROM admin_apns_installations').first()).device_token, newer);
  providerStatus = 200;

  // Token rotation replaces jobs and only the current token is used.
  const rotated = 'cd'.repeat(32);
  await native({ ...enroll, token: rotated }, { status: 201 });
  assert.equal(await count('admin_apns_jobs'), 0);
  providerStatus = 410; providerReason = 'Unregistered';
  const gone = await book('18:00');
  for (let i = 0; i < 100 && await count('admin_apns_installations'); i++) await delay(50);
  assert.equal(await count('admin_apns_installations'), 0);
  assert.equal(deliveries.at(-1).token, rotated);
  assert.equal((await db.prepare('SELECT code FROM appointments WHERE code=?').bind(gone).first()).code, gone);

  providerStatus = 200;
  await native(enroll, { status: 201 });
  await request('/api/admin-native-push', { method: 'DELETE' });
  assert.equal(await count('admin_apns_installations'), 0);
  await native(enroll, { status: 201 });
  // Expired sessions cannot send tests, but owner logout can still revoke the installation.
  await db.prepare('UPDATE admin_sessions SET expires_at=0').run();
  await native({ action: 'test' }, { status: 401 });
  const afterExpiry = await book('22:00');
  await waitJob(afterExpiry, 1);
  assert.equal(deliveries.at(-1).data.code, afterExpiry, 'Natural login expiry does not disable push');
  // First subscribe may commit before its Set-Cookie response reaches the browser.
  // Logout still has to revoke that device using the registering session.
  cookies.delete('hoan_native_push_local');
  await request('/api/admin-session', { method: 'DELETE' });
  assert.equal(await count('admin_apns_installations'), 0);
  assert.equal(await count('admin_apns_jobs'), 0);
  assert.ok(!cookies.has('hoan_native_push_local'));
  console.log('PASS: native APNs authentication, JWT, booking delivery, recovery, backoff, token rotation, revoke and logout (simulated APNs, isolated D1).');
} finally { await mf.dispose(); }
