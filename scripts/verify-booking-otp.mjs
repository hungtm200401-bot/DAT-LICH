import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { unstable_splitSqlQuery } from 'wrangler';

// This worker uses its own in-memory D1 and an outbound Verify fixture. It cannot send SMS.
const preview = process.argv.includes('--preview');
const fixturePhone = '0900000147';
const fixtureOtp = '736518';
const serviceSid = 'VA' + randomBytes(16).toString('hex');
const providerKey = 'SK' + randomBytes(16).toString('hex');
const providerSecret = randomUUID();
const adminKey = randomUUID() + randomUUID();
const verifications = new Map();
let sends = 0;
let lastReceiver = '';

async function verifyFixture(request) {
  const url = new URL(request.url);
  if (url.origin !== 'https://verify.twilio.com') return new Response('Outbound network disabled', { status: 502 });
  assert.equal(request.headers.get('Authorization'), 'Basic ' + btoa(providerKey + ':' + providerSecret));
  const form = new URLSearchParams(await request.text());
  if (url.pathname === `/v2/Services/${serviceSid}/Verifications`) {
    assert.equal(form.get('Channel'), 'sms');
    const to = form.get('To');
    if (to === '+84900000148') return Response.json({ message: 'Fixture provider unavailable' }, { status: 503 });
    if (to === '+12025550149') return Response.json({ code: 60605, message: 'Fixture destination unavailable' }, { status: 403 });
    assert.match(to, /^\+[1-9]\d{6,14}$/);
    const sid = 'VE' + randomBytes(16).toString('hex');
    const row = { sid, to, service_sid: serviceSid, status: 'pending' };
    verifications.set(sid, row);
    lastReceiver = to;
    sends++;
    return Response.json(row, { status: 201 });
  }
  if (url.pathname === `/v2/Services/${serviceSid}/VerificationCheck`) {
    const sid = form.get('VerificationSid');
    const row = verifications.get(sid);
    if (!row) return new Response(null, { status: 404 });
    if (form.get('Code') !== fixtureOtp) return Response.json(row);
    verifications.delete(sid);
    return Response.json({ ...row, status: 'approved' });
  }
  return new Response(null, { status: 404 });
}

const modulesRoot = resolve('dist/server');
const compiled = (await readdir(modulesRoot, { recursive: true })).filter(name => name.endsWith('.js'));
const modules = ['index.js', ...compiled.filter(name => name !== 'index.js')]
  .map(name => ({ type: 'ESModule', path: resolve(modulesRoot, name) }));
const worker = new Miniflare(convertV4MiniflareOptions({
  name: 'hoan-fixture-booking-otp', modules, modulesRoot, host: '127.0.0.1', port: preview ? 5188 : 0,
  logRequests: false, compatibilityDate: '2024-09-23', compatibilityFlags: ['nodejs_compat', 'enable_weak_ref'],
  bindings: { HOAN_LOCAL_DEV: '1', ADMIN_TOKEN: adminKey, TWILIO_API_KEY_SID: providerKey,
    TWILIO_API_KEY_SECRET: providerSecret, TWILIO_VERIFY_SERVICE_SID: serviceSid },
  d1Databases: { DB: randomUUID() }, r2Buckets: { BUCKET: randomUUID() },
  assets: { directory: resolve('dist/client'), binding: 'ASSETS', routerConfig: { has_user_worker: true } },
  outboundService: verifyFixture,
}));

let browser;
try {
  const base = (await worker.ready).origin;
  const db = await worker.getD1Database('DB');
  const migrations = (await readdir('dist/.openai/drizzle')).filter(file => /^\d+.*\.sql$/.test(file)).sort();
  for (const file of migrations) {
    const sql = await readFile(resolve('dist/.openai/drizzle', file), 'utf8');
    await db.batch(unstable_splitSqlQuery(sql).map(query => db.prepare(query)));
  }
  const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(Date.now() + 4 * 86400_000));
  const post = async body => {
    const response = await fetch(base + '/api/data', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify(body),
      signal: AbortSignal.timeout(12_000),
    });
    assert.match(response.headers.get('Cache-Control') || '', /no-store/);
    return { status: response.status, ...await response.json() };
  };
  const begin = (purpose, phone = fixturePhone) => post({ action: 'startBookingOtp', purpose, phone });
  const check = (purpose, ticket, otp = fixtureOtp) => post({ action: 'verifyBookingOtp', purpose, ticket, otp });
  const booking = (time, phoneProof, phone = fixturePhone) => post({
    action: 'createAppointment', form: 'booking-info', customer: 'Khách đặt lịch mẫu', phone, email: 'khach@example.test', phoneProof,
    serviceId: 'personal', date: day, time, locationType: 'artist', style: 'Tự nhiên · Trong trẻo', consent: true,
  });
  async function approval(phone = fixturePhone) {
    const start = await begin('booking', phone);
    assert.equal(start.status, 200, start.error);
    const verified = await check('booking', start.ticket);
    assert.equal(verified.status, 200, verified.error);
    assert.equal(start.ticket, verified.proof);
    return verified.proof;
  }
  const resetSmsRate = () => db.prepare("DELETE FROM sensitive_request_limits WHERE scope LIKE 'booking-otp-%'").run();

  assert.equal((await booking('09:00')).status, 428);
  const proof = await approval();
  assert.equal((await booking('09:00', proof, '0900000149')).status, 428);
  const concurrent = await Promise.all([booking('09:00', proof), booking('10:00', proof)]);
  assert.deepEqual(concurrent.map(result => result.status).sort(), [201, 428]);
  const first = concurrent.find(result => result.status === 201).appointment;
  const second = await booking('14:00', await approval());
  assert.equal(second.status, 201, second.error);
  const expectedCodes = [first.code, second.appointment.code].sort();
  const legacyCode = 'HMA-010100-TESTLEGACY';
  await db.prepare(`INSERT INTO appointments(code, customer, phone, service_id, date, time, total)
    VALUES (?, 'Lịch mẫu chưa xác minh', ?, 'personal', ?, '16:00', 450000)`).bind(legacyCode, fixturePhone, day).run();

  if (preview) {
    await resetSmsRate();
    console.log(`Bản thử OTP cục bộ: ${base}/#/lookup/recover/sms`);
    console.log(`Số mẫu: ${fixturePhone} · OTP mẫu: ${fixtureOtp}. Chỉ dùng dữ liệu thử.`);
    await new Promise(resolve => { process.once('SIGINT', resolve); process.once('SIGTERM', resolve); });
  } else {
    const start = await begin('recovery', '(0900) 000-147');
    assert.equal(start.status, 200, start.error);
    assert.deepEqual(Object.keys(start).sort(), ['expiresIn', 'phoneLabel', 'status', 'ticket']);
    const wrong = await check('recovery', start.ticket, '100000');
    assert.equal(wrong.status, 400);
    assert.ok(wrong.fieldErrors.otp);
    const result = await check('recovery', start.ticket);
    assert.equal(result.status, 200, result.error);
    assert.deepEqual(result.bookings.map(row => row.code).sort(), expectedCodes);
    assert.deepEqual(Object.keys(result.bookings[0]).sort(), ['code', 'date', 'service', 'time']);
    assert.equal((await check('recovery', start.ticket)).status, 410);
    const sentBeforeLimit = sends;
    assert.equal((await begin('recovery', '0084 900 000 147')).status, 429);
    assert.equal(sends, sentBeforeLimit);
    const noMatch = await begin('recovery', '0900000149');
    assert.equal(noMatch.status, 200);
    assert.deepEqual((await check('recovery', noMatch.ticket)).bookings, []);
    const old = await begin('recovery', '0900000149');
    await db.prepare("UPDATE booking_sms_challenges SET expires_at = 0 WHERE purpose = 'recovery'").run();
    assert.equal((await check('recovery', old.ticket)).status, 410);
    assert.equal((await begin('recovery', '0900000148')).status, 503);
    assert.equal((await post({ action: 'lookupBooking', code: legacyCode, phone: fixturePhone })).status, 200);
    assert.equal((await post({ action: 'lookupBooking', code: first.code, phone: '+84900000147' })).status, 200);
    const invalidLocal = await begin('recovery', '+84 24 1234 5678');
    assert.equal(invalidLocal.status, 400);
    assert.ok(invalidLocal.fieldErrors.phone);

    await resetSmsRate();
    for (const [input, destination] of [
      ['(032) 000 0147', '+84320000147'], ['+84 (0)56 000 0147', '+84560000147'],
      ['0084 70 000 0147', '+84700000147'], ['084–000–0147', '+84840000147'],
    ]) {
      assert.equal((await begin('recovery', input)).status, 200, input);
      assert.equal(lastReceiver, destination);
    }
    const internationalPhone = '+44 7700 900123';
    const international = await booking('17:00', await approval(internationalPhone), internationalPhone);
    assert.equal(international.status, 201, international.error);
    const internationalLookup = await begin('recovery', '00 44 (7700) 900-123');
    assert.equal(internationalLookup.status, 200, internationalLookup.error);
    assert.equal(lastReceiver, '+447700900123');
    assert.deepEqual((await check('recovery', internationalLookup.ticket)).bookings.map(row => row.code), [international.appointment.code]);
    const deniedDestination = await begin('recovery', '+1 (202) 555-0149');
    assert.equal(deniedDestination.status, 422);
    assert.ok(deniedDestination.fieldErrors.phone);
    console.log('PASS Worker: verified booking binding, atomic proof consumption, expired and reused OTP, rate limits, provider errors and scoped results.');

    const { chromium } = await import('../.sites-runtime/browser-tests/node_modules/playwright/index.mjs');
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    await mkdir('outputs/booking-otp', { recursive: true });
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      await resetSmsRate();
      const view = viewport.width > 800 ? 'desktop' : 'mobile';
      const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
      await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
      await context.addInitScript(() => localStorage.setItem('hoanAnalyticsConsent', 'no'));
      const page = await context.newPage();
      page.setDefaultTimeout(12_000);
      await page.goto(base + '/#/lookup');
      await page.getByRole('link', { name: 'Quên mã lịch hẹn?' }).click();
      await page.waitForURL(base + '/#/lookup/recover');
      await page.getByRole('link', { name: 'Xác minh bằng SMS' }).click();
      await page.waitForURL(base + '/#/lookup/recover/sms');
      await page.getByLabel('Số điện thoại đặt lịch').fill(view === 'mobile' ? '+84 (0)900–000–147' : '0084 900 000 147');
      await page.getByRole('button', { name: 'Gửi mã OTP' }).click();
      const otp = page.locator('[name="otp"]');
      await otp.waitFor();
      await page.screenshot({ path: `outputs/booking-otp/${view}-otp.png` });
      await otp.fill(fixtureOtp);
      await page.getByRole('button', { name: 'Xác minh và xem mã lịch' }).click();
      await page.getByRole('heading', { name: 'Mã lịch hẹn của bạn' }).waitFor();
      assert.deepEqual((await page.locator('.ct-sms-code-row strong').allTextContents()).sort(), expectedCodes);
      assert.equal(await page.getByRole('button', { name: 'Sao chép mã' }).count(), 2);
      assert.equal(await page.getByRole('link', { name: 'Liên hệ Hoàn' }).count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await page.screenshot({ path: `outputs/booking-otp/${view}-result.png` });

      if (view === 'mobile') {
        await page.evaluate(date => localStorage.setItem('hoanMakeupDraft', JSON.stringify({ booking: {
          date, time: '18:00', serviceId: 'personal', locationType: 'artist',
        } })), day);
        await page.goto(base + '/#/booking/info');
        await page.reload();
        const info = page.locator('form[data-form="info"]');
        await info.locator('[name="name"]').fill('Khách mẫu xác minh khi đặt');
        await info.locator('[name="phone"]').fill('0900000154');
        await info.locator('[name="email"]').fill('khach@example.test');
        await info.locator('[name="consent"]').check();
        await page.locator('[data-action="ct-next"]').click();
        await page.waitForURL(base + '/#/booking/verify-phone');
        await page.getByRole('button', { name: 'Gửi mã OTP' }).click();
        await page.locator('[name="otp"]').fill(fixtureOtp);
        await page.getByRole('button', { name: 'Xác minh số điện thoại' }).click();
        await page.waitForURL(base + '/#/booking/deposit');
        const code = await page.evaluate(() => window.state.booking.code);
        assert.equal((await db.prepare('SELECT phone FROM booking_verified_phones WHERE appointment_code = ?').bind(code).first()).phone, '+84900000154');
      }
      await context.close();
    }
    await db.prepare("UPDATE appointments SET phone = '0900000151' WHERE code = ?").bind(first.code).run();
    const afterEdit = await begin('recovery');
    assert.deepEqual((await check('recovery', afterEdit.ticket)).bookings.map(row => row.code), [second.appointment.code]);
    console.log('PASS Edge desktop/mobile: send, OTP entry, immediate booking codes and verified checkout. Phone changes revoke their previous binding.');
  }
} finally {
  await browser?.close();
  await worker.dispose();
}
