import assert from 'node:assert/strict';
import { createDecipheriv, createECDH, hkdfSync, randomBytes, randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { runInNewContext } from 'node:vm';
import { importJWK, jwtVerify } from 'jose';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { unstable_splitSqlQuery } from 'wrangler';

const pushEndpoint = 'https://web.push.apple.com/synthetic-installation';
const vapid = createECDH('prime256v1');
const vapidPoint = vapid.generateKeys();
const privateKey = vapid.getPrivateKey();
const config = {
  publicKey: vapidPoint.toString('base64url'),
  privateKey: Buffer.concat([Buffer.alloc(32 - privateKey.length), privateKey]).toString('base64url'),
  subject: 'https://example.test/',
};
const device = createECDH('prime256v1');
const devicePoint = device.generateKeys();
const deviceAuth = randomBytes(16);
const subscription = {
  endpoint: pushEndpoint, keys: { p256dh: devicePoint.toString('base64url'), auth: deviceAuth.toString('base64url') },
};
const verifyKey = await importJWK({
  kty: 'EC', crv: 'P-256', x: vapidPoint.subarray(1, 33).toString('base64url'), y: vapidPoint.subarray(33).toString('base64url'),
}, 'ES256');

// The simulated push service verifies the same encrypted envelope an iPhone receives.
function decryptPush(encrypted) {
  assert.equal(encrypted[20], 65);
  const salt = encrypted.subarray(0, 16);
  const senderPoint = encrypted.subarray(21, 86);
  const info = Buffer.concat([Buffer.from('WebPush: info\0'), devicePoint, senderPoint]);
  const ikm = hkdfSync('sha256', device.computeSecret(senderPoint), deviceAuth, info, 32);
  const key = hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
  const nonce = hkdfSync('sha256', ikm, salt, Buffer.from('Content-Encoding: nonce\0'), 12);
  const decipher = createDecipheriv('aes-128-gcm', Buffer.from(key), Buffer.from(nonce));
  decipher.setAuthTag(encrypted.subarray(-16));
  const padded = Buffer.concat([decipher.update(encrypted.subarray(86, -16)), decipher.final()]);
  const delimiter = padded.findLastIndex(byte => byte !== 0);
  assert.equal(padded[delimiter], 2);
  return JSON.parse(padded.subarray(0, delimiter).toString('utf8'));
}

const modulesRoot = resolve('dist/server');
const modules = (await readdir(modulesRoot, { recursive: true })).filter(name => name.endsWith('.js') && name !== 'index.js');
const adminKey = randomUUID() + randomUUID();
const deliveries = [];
let providerStatus = 201;
const mf = new Miniflare(convertV4MiniflareOptions({
  name: 'hoan-verify-admin-push', modulesRoot, host: '127.0.0.1', port: 0, logRequests: false,
  modules: ['index.js', ...modules].map(path => ({ type: 'ESModule', path: resolve(modulesRoot, path) })),
  compatibilityDate: '2024-09-23', compatibilityFlags: ['nodejs_compat', 'enable_weak_ref'],
  bindings: { HOAN_LOCAL_DEV: '1', ADMIN_TOKEN: adminKey, HOAN_WEB_PUSH_CONFIG: JSON.stringify(config) },
  d1Databases: { DB: randomUUID() },
  assets: { directory: resolve('dist/client'), binding: 'ASSETS', routerConfig: { has_user_worker: true } },
  async outboundService(request) {
    assert.equal(request.url, pushEndpoint);
    assert.equal(request.method, 'POST');
    assert.equal(request.headers.get('content-encoding'), 'aes128gcm');
    assert.ok(Number(request.headers.get('ttl')) > 0);
    const token = request.headers.get('authorization').match(/^vapid t=([^,]+), k=(.+)$/);
    assert.equal(token?.[2], config.publicKey);
    const { payload } = await jwtVerify(token[1], verifyKey, { audience: new URL(pushEndpoint).origin });
    assert.equal(payload.sub, config.subject);
    deliveries.push({
      data: decryptPush(Buffer.from(await request.arrayBuffer())),
      topic: request.headers.get('topic'), status: providerStatus,
    });
    return new Response(null, { status: providerStatus });
  },
}));

let bookingCode;
try {
  const base = (await mf.ready).origin;
  const db = await mf.getD1Database('DB');
  const migrations = (await readdir('dist/.openai/drizzle')).filter(file => /^\d+.*\.sql$/.test(file)).sort();
  for (const file of migrations) {
    const sql = await readFile(resolve('dist/.openai/drizzle', file), 'utf8');
    await db.batch(unstable_splitSqlQuery(sql).map(query => db.prepare(query)));
  }

  const cookies = new Map();
  async function request(path, { method = 'GET', body, authenticated = true, origin = base, status = 200 } = {}) {
    const headers = { Origin: origin };
    if (authenticated) headers.Cookie = [...cookies.values()].join('; ');
    if (body) headers['Content-Type'] = 'application/json';
    const response = await fetch(base + path, {
      method, headers, body: body && JSON.stringify(body), signal: AbortSignal.timeout(10_000),
    });
    const json = await response.json();
    assert.equal(response.status, status, JSON.stringify(json));
    for (const header of response.headers.getSetCookie()) {
      const pair = header.split(';')[0];
      cookies.set(pair.split('=')[0], pair);
    }
    return json;
  }
  const push = (body, options) => request('/api/admin-push', { method: 'POST', body, ...options });
  const count = async table => (await db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).first()).count;
  const worker = await mf.getWorker();
  const tick = async () => assert.equal((await worker.scheduled({ cron: '* * * * *' })).outcome, 'ok');
  async function waitForJob(key, done) {
    for (let attempt = 0; attempt < 80; attempt++) {
      const job = await db.prepare('SELECT attempts, done, next_attempt_at FROM admin_push_jobs WHERE event_key = ?').bind(key).first();
      if (job?.attempts > 0 && job.done === done && (done || job.next_attempt_at > Date.now() + 45_000)) return job;
      await delay(50);
    }
    assert.fail(`Timed out waiting for ${key}`);
  }

  const enroll = { action: 'subscribe', subscription, publicKey: config.publicKey };
  await request('/api/admin-push', { status: 401 });
  await push(enroll, { status: 401 });
  await request('/api/admin-session', { method: 'POST', body: { key: adminKey } });
  assert.deepEqual(await request('/api/admin-push'), { available: true, enabled: false, publicKey: config.publicKey });
  await push(enroll, { origin: 'https://other.example.test', status: 401 });
  await push({ ...enroll, subscription: { ...subscription, endpoint: 'https://other.example.test/push' } }, { status: 400 });
  await push(enroll, { status: 201 });
  await push(enroll, { status: 201 });
  assert.equal(await count('admin_push_subscriptions'), 1);
  assert.ok(cookies.has('hoan_push_local'));
  assert.equal((await request('/api/admin-push')).enabled, true);
  await push({ action: 'test' });
  assert.deepEqual(deliveries.map(item => item.data), [{ kind: 'test', code: '' }]);

  const vietnamTime = timestamp => new Date(timestamp + 7 * 3_600_000).toISOString().slice(0, 16).split('T');
  const [date] = vietnamTime(Date.now() + 2 * 86_400_000);
  const book = async time => (await request('/api/data', { method: 'POST', authenticated: false, status: 201, body: {
    action: 'createAppointment', customer: 'Synthetic push client', phone: '0900001101', email: 'push@example.test',
    serviceId: 'personal', date, time,
  } })).appointment.code;
  bookingCode = await book('10:00');
  await waitForJob('booking:' + bookingCode, 1);
  assert.deepEqual(deliveries.at(-1).data, { kind: 'booking', code: bookingCode });
  await tick();
  assert.equal(deliveries.length, 2, 'Cron does not resend the delivered booking');

  providerStatus = 503;
  const retryCode = await book('11:00');
  const retryKey = 'booking:' + retryCode;
  await waitForJob(retryKey, 0);
  const failed = deliveries.at(-1);
  assert.equal(failed.status, 503);
  // Simulate the next retry interval without waiting for a real minute.
  await db.prepare('UPDATE admin_push_jobs SET next_attempt_at = 0 WHERE event_key = ?').bind(retryKey).run();
  providerStatus = 201;
  await tick();
  assert.equal((await waitForJob(retryKey, 1)).attempts, 2);
  assert.deepEqual(deliveries.at(-1), { ...failed, status: 201 });

  const [reminderDate, reminderTime] = vietnamTime(Date.now() + 23 * 3_600_000 + 50 * 60_000);
  const changed = (code, date, time, status) => db.prepare('UPDATE appointments SET date = ?, time = ?, status = ? WHERE code = ?')
    .bind(date, time, status, code).run();
  await changed(bookingCode, reminderDate, reminderTime, 'confirmed');
  await tick();
  assert.deepEqual(deliveries.at(-1).data, { kind: 'reminder', code: bookingCode });
  await tick();
  assert.equal(deliveries.length, 5, 'The same work time receives one reminder');

  const [newDate, newTime] = vietnamTime(Date.now() + 23 * 3_600_000 + 55 * 60_000);
  await changed(bookingCode, newDate, newTime, 'confirmed');
  providerStatus = 503;
  await tick();
  assert.equal(deliveries.length, 6, 'A changed work time has its own reminder');
  assert.notEqual(deliveries[4].topic, deliveries[5].topic);
  await changed(bookingCode, newDate, newTime, 'cancelled');
  await db.prepare("UPDATE admin_push_jobs SET next_attempt_at = 0 WHERE kind = 'reminder' AND done = 0").run();
  providerStatus = 201;
  await tick();
  assert.equal(deliveries.length, 6, 'Cancellation stops reminder retries');

  const missedCode = 'HMA-COMMITTED-001';
  const createdAt = new Date().toISOString();
  await db.batch([
    db.prepare("INSERT INTO appointments (code, customer, phone, service_id, date, time, total, deposit) VALUES (?, 'Synthetic fallback', '0900001102', 'personal', ?, '14:00', 450000, 0)")
      .bind(missedCode, date),
    db.prepare('INSERT INTO site_content (key, value, updated_at) VALUES (?, ?, ?)')
      .bind('notification:synthetic-fallback', JSON.stringify({ type: 'appointment.created', entityId: missedCode, createdAt }), createdAt),
  ]);
  await tick();
  assert.deepEqual(deliveries.at(-1).data, { kind: 'booking', code: missedCode });
  await tick();
  assert.equal(deliveries.length, 7, 'Cron recovers a committed event once when the request task was interrupted');

  // An expired login session cannot sign requests. The installation cookie can
  // still revoke notifications when its owner explicitly logs out.
  await db.prepare('UPDATE admin_sessions SET expires_at = 0').run();
  await push({ action: 'test' }, { status: 401 });
  cookies.delete('hoan_admin_local');
  await request('/api/admin-session', { method: 'DELETE' });
  assert.equal(await count('admin_push_subscriptions'), 0);
  assert.equal(await count('admin_push_jobs'), 0);

  if (process.argv.includes('--browser')) {
    const { chromium } = await import('../.sites-runtime/browser-tests/node_modules/playwright/index.mjs');
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    try {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      await context.addInitScript(({ subscription, keyBytes }) => {
        Object.defineProperty(navigator, 'standalone', { value: true });
        localStorage.setItem('hoanAnalyticsConsent', 'no');
        let registered = null;
        let permission = 'default';
        Object.defineProperty(Notification, 'permission', { get: () => permission });
        PushManager.prototype.getSubscription = async () => registered;
        PushManager.prototype.subscribe = async options => {
          if (!navigator.userActivation.isActive || !options.userVisibleOnly || String(options.applicationServerKey) !== keyBytes) {
            throw new Error('Subscription requires the tap and the configured public key');
          }
          permission = 'granted';
          registered = {
            options,
            toJSON: () => subscription,
            unsubscribe: async () => { registered = null; return true; },
          };
          return registered;
        };
      }, { subscription, keyBytes: String(new Uint8Array(vapidPoint)) });
      const login = await context.request.post(base + '/api/admin-session', { headers: { Origin: base }, data: { key: adminKey } });
      assert.equal(login.status(), 200);
      const page = await context.newPage();
      page.setDefaultTimeout(15_000);
      await page.goto(base + '/#/admin');
      await page.locator('[data-admin-push-action="enable"]').click();
      const sent = page.waitForResponse(response => response.url().endsWith('/api/admin-push') &&
        response.request().postDataJSON()?.action === 'test');
      await page.locator('[data-admin-push-action="test"]').click();
      assert.equal((await sent).status(), 200);
      assert.deepEqual(deliveries.at(-1).data, { kind: 'test', code: '' });
      assert.deepEqual(await page.locator('.ma-quick-bottom a').allTextContents(), ['Lịch làm', 'Duyệt lịch', 'Duyệt cọc', 'Khách']);
      await page.locator('[data-admin-push-action="disable"]').click();
      await page.locator('[data-admin-push-action="enable"]').waitFor();
      assert.equal(await count('admin_push_subscriptions'), 0);
      console.log('Verified Home Screen layout and push controls in a browser with a simulated device subscription.');
    } finally {
      await browser.close();
    }
  }
} finally {
  await mf.dispose();
}

const handlers = new Map();
const origin = 'https://example.test';
let notice;
let opened;
let refreshed = false;
const client = {
  url: origin + '/#/admin',
  postMessage(message) { refreshed = message.type === 'hoan:admin-push'; },
  navigate(url) { opened = url; return Promise.resolve(this); },
  focus() { return Promise.resolve(); },
};
runInNewContext(await readFile('dist/client/sw.js', 'utf8'), {
  URL,
  self: {
    location: { origin },
    addEventListener(name, handler) { handlers.set(name, handler); },
    registration: { async showNotification(title, options) { notice = { title, ...options }; } },
    clients: { async matchAll() { return [client]; } },
  },
});
async function emit(name, props) {
  let task;
  handlers.get(name)({ ...props, waitUntil: promise => { task = promise; } });
  await task;
}
await emit('push', { data: { json: () => ({ kind: 'booking', code: bookingCode }) } });
assert.equal(notice.title, 'Có lịch đặt mới');
assert.ok(refreshed);
await emit('notificationclick', { notification: { ...notice, close() {} } });
assert.equal(opened, origin + '/#/admin/appointments?code=' + bookingCode);
console.log('Verified encrypted Web Push, booking delivery, retry, work reminders, logout and the service worker deep link.');
