import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { unstable_splitSqlQuery } from 'wrangler';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

// Use isolated records and a signed test identity. Requests never reach Google.
const audience = 'hoan-booking-fixture.apps.googleusercontent.com';
const alice = 'google-fixture-first';
const bob = 'google-fixture-second';
const emails = { [alice]: 'lan@example.test', [bob]: 'mai@example.test' };
const kid = 'hoan-test-key';
const { publicKey, privateKey } = await generateKeyPair('RS256');
const jwk = { ...await exportJWK(publicKey), alg: 'RS256', use: 'sig', kid };
function credential(ticket, subject, email = emails[subject], verified = true) {
  return new SignJWT({ nonce: ticket, email, email_verified: verified })
    .setProtectedHeader({ alg: 'RS256', kid }).setIssuer('https://accounts.google.com')
    .setAudience(audience).setSubject(subject).setIssuedAt().setExpirationTime('5m').sign(privateKey);
}

const modulesRoot = resolve('dist/server');
const files = (await readdir(modulesRoot, { recursive: true })).filter(name => name.endsWith('.js'));
const modules = ['index.js', ...files.filter(name => name !== 'index.js')]
  .map(name => ({ type: 'ESModule', path: resolve(modulesRoot, name) }));
const worker = new Miniflare(convertV4MiniflareOptions({
  name: 'hoan-fixture-booking-google', modules, modulesRoot, host: '127.0.0.1', port: 0,
  logRequests: false, compatibilityDate: '2024-09-23', compatibilityFlags: ['nodejs_compat', 'enable_weak_ref'],
  bindings: { HOAN_LOCAL_DEV: '1', ADMIN_TOKEN: randomUUID() + randomUUID(), GOOGLE_CLIENT_ID: audience },
  d1Databases: { DB: randomUUID() }, r2Buckets: { BUCKET: randomUUID() },
  assets: { directory: resolve('dist/client'), binding: 'ASSETS', routerConfig: { has_user_worker: true } },
  outboundService: request => request.url === 'https://www.googleapis.com/oauth2/v3/certs'
    ? Response.json({ keys: [jwk] }) : new Response('Outbound network disabled', { status: 502 }),
}));

let browser;
try {
  const base = (await worker.ready).origin;
  const db = await worker.getD1Database('DB');
  for (const migration of (await readdir('dist/.openai/drizzle')).filter(file => /^\d+.*\.sql$/.test(file)).sort()) {
    const sql = await readFile(resolve('dist/.openai/drizzle', migration), 'utf8');
    await db.batch(unstable_splitSqlQuery(sql).map(query => db.prepare(query)));
  }
  const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(Date.now() + 4 * 86400_000));
  async function post(body) {
    const res = await fetch(base + '/api/data', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify(body),
      signal: AbortSignal.timeout(12_000),
    });
    assert.match(res.headers.get('Cache-Control') || '', /no-store/);
    return { status: res.status, ...await res.json() };
  }
  async function booking(time, phone) {
    const result = await post({ action: 'createAppointment', form: 'booking-info', serviceId: 'personal', date: day, time,
      phone, email: 'khach@example.test', customer: 'Khách kiểm tra', locationType: 'artist', style: 'Tự nhiên', consent: true });
    assert.equal(result.status, 201, result.error);
    return result.appointment;
  }
  const start = (purpose, fields = {}) => post({ action: 'startBookingGoogle', purpose, ...fields });
  const finish = async (ticket, subject, { email, nonce = ticket, assertedEmail, verified } = {}) => post({
    action: 'finishBookingGoogle', ticket, email, credential: await credential(nonce, subject, assertedEmail, verified),
  });
  async function link(appointment, subject) {
    const opened = await start('link', { code: appointment.code, phone: appointment.phone });
    assert.equal(opened.status, 200, opened.error);
    assert.equal(opened.clientId, audience);
    const confirmed = await finish(opened.ticket, subject);
    return { ...confirmed, ticket: opened.ticket };
  }
  async function recover(subject) {
    const email = emails[subject];
    const opened = await start('recovery', { email });
    assert.equal(opened.status, 200, opened.error);
    return finish(opened.ticket, subject, { email });
  }

  const first = await booking('09:00', '0900000147');
  const second = await booking('14:00', '0900000149');
  const invalidLink = await start('link', { code: first.code, phone: second.phone });
  assert.equal(invalidLink.status, 404);
  const linked = await link(first, alice);
  assert.equal(linked.status, 200, linked.error);
  assert.equal(linked.linked, true);
  assert.equal((await finish(linked.ticket, alice)).status, 410);
  assert.equal((await link(first, bob)).status, 409);
  assert.equal((await link(second, bob)).status, 200);
  const firstRecovery = await recover(alice);
  assert.deepEqual(firstRecovery.bookings.map(row => row.code), [first.code]);
  assert.deepEqual(Object.keys(firstRecovery.bookings[0]).sort(), ['code', 'date', 'service', 'time']);
  assert.deepEqual((await recover(bob)).bookings.map(row => row.code), [second.code]);
  assert.equal((await start('recovery')).fieldErrors.email, 'Vui lòng nhập địa chỉ email.');
  assert.equal((await start('recovery', { email: 'incorrect' })).fieldErrors.email, 'Nhập địa chỉ email hợp lệ.');
  const email = emails[alice];
  const challenge = await start('recovery', { email: ' ' + email.toUpperCase() + ' ' });
  assert.equal(challenge.status, 200);
  assert.equal((await finish(challenge.ticket, alice)).status, 410);
  assert.equal((await finish(challenge.ticket, bob, { email: emails[bob] })).status, 410);
  assert.equal((await finish(challenge.ticket, bob, { email })).status, 401);
  assert.equal((await finish(challenge.ticket, alice, { email, verified: false })).status, 401);
  assert.equal((await finish(challenge.ticket, alice, { email, nonce: randomUUID() })).status, 401);
  const reusedAddress = await finish(challenge.ticket, bob, { email, assertedEmail: email });
  assert.deepEqual(reusedAddress.bookings.map(row => row.code), [second.code]);
  const expiring = await start('recovery', { email });
  await db.prepare("UPDATE booking_google_challenges SET expires_at = 0 WHERE purpose = 'recovery'").run();
  assert.equal((await finish(expiring.ticket, alice, { email })).status, 410);
  console.log('PASS Worker email validation, signed identity checks, one-time challenge and isolated booking lists.');

  const identityFixture = `window.google = { accounts: { id: {
    initialize(options) { this.options = options; },
    renderButton(root) {
      const options = this.options;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Tiếp tục bằng Google';
      button.onclick = async () => options.callback({credential: await window.fixtureGoogleCredential(options.nonce, options.client_id, options.login_hint)});
      root.append(button);
    }
  } } };`;
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  await mkdir('outputs/booking-google', { recursive: true });
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const view = viewport.width > 800 ? 'desktop' : 'mobile';
    const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
    await context.addInitScript(() => localStorage.setItem('hoanAnalyticsConsent', 'no'));
    const hints = [];
    await context.exposeBinding('fixtureGoogleCredential', (_, ticket, clientId, hint) => {
      assert.equal(clientId, audience);
      hints.push(hint);
      return credential(ticket, alice);
    });
    let scriptLoads = 0;
    await context.route('**/*', route => {
      const url = route.request().url();
      if (url === 'https://accounts.google.com/gsi/client') {
        scriptLoads++;
        return route.fulfill({ contentType: 'application/javascript', body: identityFixture });
      }
      return new URL(url).origin === base ? route.continue() : route.abort();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(12_000);
    await page.goto(base + '/#/lookup');
    if (viewport.width > 800) {
      const form = page.locator('form[data-form="lookup"]');
      await form.locator('[name="code"]').fill(first.code);
      await form.locator('[name="phone"]').fill(first.phone);
      await form.locator('[type="submit"]').click();
      await page.getByRole('button', { name: 'Lưu lịch bằng Google' }).click();
      await page.waitForURL(base + '/#/lookup/google/link');
      await page.getByRole('button', { name: 'Tiếp tục bằng Google' }).click();
      await page.getByRole('heading', { name: 'Đã lưu lịch với Google' }).waitFor();
      await page.goto(base + '/#/lookup');
    } else {
      assert.equal(await page.evaluate(() => localStorage.getItem('hoanLastBookingCode')), null);
    }
    await page.getByRole('link', { name: 'Quên mã lịch hẹn?' }).click();
    await page.waitForURL(base + '/#/lookup/recover');
    const field = page.getByLabel('Địa chỉ email');
    const next = page.getByRole('button', { name: 'Tiếp tục', exact: true });
    await field.waitFor();
    assert.equal(await page.getByRole('link', { name: 'Xác minh bằng SMS' }).count(), 0);
    assert.equal(await page.locator('main [name="phone"]').count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.screenshot({ path: `outputs/booking-google/${view}-email.png` });
    await next.click();
    await page.getByText('Vui lòng nhập địa chỉ email.', { exact: true }).waitFor();
    assert.equal(await field.getAttribute('aria-invalid'), 'true');
    assert.equal(scriptLoads, view === 'desktop' ? 1 : 0);
    if (view === 'desktop') {
      await field.fill(emails[bob]);
      await next.click();
      await page.getByRole('heading', { name: 'Xác minh tài khoản Google' }).waitFor();
      await page.getByRole('button', { name: 'Tiếp tục bằng Google' }).click();
      await page.getByText('Hãy chọn tài khoản Google có email trùng với địa chỉ bạn đã nhập.', { exact: true }).waitFor();
      assert.equal(hints.at(-1), emails[bob]);
      await page.getByRole('button', { name: 'Đổi email' }).click();
      assert.equal(await field.inputValue(), emails[bob]);
    }
    await field.fill(email);
    await next.click();
    await page.getByRole('heading', { name: 'Xác minh tài khoản Google' }).waitFor();
    await page.locator('.ct-email-recovery-address').getByText(email, { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Tiếp tục bằng Google' }).click();
    assert.equal(hints.at(-1), email);
    await page.getByRole('heading', { name: 'Mã lịch hẹn của bạn' }).waitFor();
    assert.deepEqual(await page.locator('.ct-sms-code-row strong').allTextContents(), [first.code]);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.screenshot({ path: `outputs/booking-google/${view}-codes.png` });
    await context.close();
  }
  await db.prepare("UPDATE appointments SET phone = '0900000151' WHERE code = ?").bind(first.code).run();
  assert.deepEqual((await recover(alice)).bookings, []);
  console.log('PASS Edge desktop/mobile email entry, Google verification, change email and recover a linked booking.');
} finally {
  await browser?.close();
  await worker.dispose();
}
