import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { unstable_splitSqlQuery } from 'wrangler';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';
import { locationAddressSignature } from '../public/location-utils.js';

// Use a fresh local D1 namespace, disposable admin key and synthetic records.
const modulesRoot = resolve('dist/server');
const files = (await readdir(modulesRoot, { recursive: true })).filter(name => name.endsWith('.js'));
const modules = ['index.js', ...files.filter(name => name !== 'index.js')]
  .map(name => ({ type: 'ESModule', path: resolve(modulesRoot, name) }));
const adminKey = randomUUID() + randomUUID();
const worker = new Miniflare(convertV4MiniflareOptions({
  name: 'hoan-verify-business-data',
  modules, modulesRoot,
  host: '127.0.0.1', port: 0, logRequests: false,
  compatibilityDate: '2024-09-23', compatibilityFlags: ['nodejs_compat', 'enable_weak_ref'],
  bindings: { HOAN_LOCAL_DEV: '1', ADMIN_TOKEN: adminKey },
  d1Databases: { DB: randomUUID() },
  r2Buckets: { BUCKET: randomUUID() },
  assets: { directory: resolve('dist/client'), binding: 'ASSETS', routerConfig: { has_user_worker: true } },
  outboundService: () => new Response('External network disabled in verification', { status: 502 }),
}));

let browser;
try {
  const base = (await worker.ready).origin;
  const db = await worker.getD1Database('DB');
  const migrate = async file => {
    const sql = await readFile(resolve('dist/.openai/drizzle', file), 'utf8');
    await db.batch(unstable_splitSqlQuery(sql).map(query => db.prepare(query)));
  };
  const vietnamDay = offset => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' })
    .format(new Date(Date.now() + offset * 86400000));
  const date = vietnamDay(5);
  const legacyCode = 'HMA-090926-BQ0';
  const phone = '0900001101';
  const bookingEmail = 'khach@example.test';
  const migrations = (await readdir('dist/.openai/drizzle')).filter(file => /^\d+.*\.sql$/.test(file)).sort();
  for (const file of migrations.filter(file => file < '0006')) await migrate(file);
  await db.prepare("INSERT INTO appointments(code, customer, phone, service_id, date, time, total, deposit) VALUES (?, 'Synthetic legacy client', ?, 'personal', ?, '07:00', 450000, 0)")
    .bind(legacyCode, phone, vietnamDay(-30)).run();
  for (const file of migrations.filter(file => file >= '0006')) await migrate(file);

  let adminCookie = '';
  async function request(path, { body, method = body ? 'POST' : 'GET', admin = false } = {}) {
    const headers = body ? { 'Content-Type': 'application/json', Origin: base } : {};
    if (admin && adminCookie) headers.Cookie = adminCookie;
    const response = await fetch(base + path, {
      method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(10_000),
    });
    return { response, json: await response.json() };
  }
  const mutate = (body, admin = false) => request('/api/data', { body, admin });
  const availability = date => request('/api/data?' + new URLSearchParams({ availability: date, service: 'personal' }));
  const booking = (time, extra = {}) => ({
    action: 'createAppointment', customer: 'Synthetic client', phone, email: bookingEmail, serviceId: 'personal', date, time, ...extra,
  });
  async function success(result, status = 200) {
    assert.equal(result.response.status, status, result.json.error);
    return result.json;
  }

  assert.equal((await request('/api/data?admin=1')).response.status, 401);
  const publicData = await success(await request('/api/data'));
  assert.deepEqual(Object.keys(publicData).sort(), ['brand', 'serverTime', 'services', 'settings']);
  assert.equal((await request('/api/visits')).response.status, 401);
  const emptyKey = await request('/api/admin-session', { body: { key: '' } });
  assert.equal(emptyKey.response.status, 400);
  assert.ok(emptyKey.json.fieldErrors.token);
  const login = await request('/api/admin-session', { body: { key: adminKey } });
  await success(login);
  const setCookie = login.response.headers.get('Set-Cookie');
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  assert.match(setCookie, /Max-Age=28800/i);
  adminCookie = setCookie.split(';')[0];
  await success(await request('/api/admin-session', { admin: true }));
  const state = await success(await request('/api/data?admin=1', { admin: true }));
  assert.ok(state.appointments.some(row => row.code === legacyCode), 'Existing appointments survive migration and initialization');

  const settings = { bookingWindow: '60', scheduleOpen: true, deposit: '200000', bankName: 'Test Bank', bankAccount: '9999900000', bankOwner: 'TEST OWNER' };
  await success(await mutate({ action: 'saveContent', key: 'settings', value: settings }, true));
  const safePublic = await success(await request('/api/data', { admin: true }));
  assert.equal(safePublic.settings.bankAccount, undefined);
  assert.equal(safePublic.appointments, undefined);
  const badRange = await mutate({ action: 'setScheduleSlot', date, time: '12:00', endTime: '11:00', status: 'blocked' }, true);
  assert.equal(badRange.response.status, 400);
  assert.ok(badRange.json.fieldErrors.endTime);
  const blocked = await success(await mutate({ action: 'setScheduleSlot', date, time: '12:00', endTime: '13:30', status: 'break', note: 'private fixture note' }, true));
  assert.equal(blocked.slot.endTime, '13:30');
  assert.equal(blocked.slot.status, 'break');
  const blankContact = await mutate({ action: 'createRequest', name: '', phone: '', subject: '', message: '' });
  assert.equal(blankContact.response.status, 400);
  assert.deepEqual(Object.keys(blankContact.json.fieldErrors).sort(), ['message', 'name', 'phone', 'subject']);
  const countMessages = () => db.prepare("SELECT COUNT(*) AS count FROM site_content WHERE key GLOB 'request:*' OR key GLOB 'notification:*'").first();
  const messagesBefore = await countMessages();
  const obsoleteRecovery = await mutate({ action: 'createRequest', purpose: 'booking-code-recovery', name: 'Synthetic client', phone });
  assert.equal(obsoleteRecovery.response.status, 410);
  assert.deepEqual(await countMessages(), messagesBefore);
  const unconfiguredSms = await mutate({ action: 'startBookingOtp', purpose: 'recovery', phone });
  assert.equal(unconfiguredSms.response.status, 503);
  assert.equal(unconfiguredSms.json.code, 'BOOKING_SMS_NOT_CONFIGURED');

  for (const [email, message] of [
    [undefined, 'Vui lòng nhập địa chỉ email.'],
    ['sai-email', 'Nhập email hợp lệ, ví dụ ten@domain.com.'],
  ]) {
    const invalid = await mutate(booking('10:00', { email }));
    assert.equal(invalid.response.status, 400);
    assert.deepEqual(invalid.json.fieldErrors, { email: message });
  }
  const point = { lat: 21.100123456789, lon: 105.500987654321, accuracy: 12, mode: 'gps' };
  const verifiedLocation = {
    form: 'booking-info', consent: true, style: 'Tự nhiên', locationType: 'client',
    city: 'Thành phố Hà Nội', provinceCode: 1, ward: 'Phường Tùng Thiện', wardCode: 9604,
    address: '14 Đường kiểm thử', locationNote: 'Cổng bên phải',
    locationCoordinates: point, locationDeviceCoordinates: point,
    locationCapturedAt: new Date(Date.now() - 5000).toISOString(), locationConfirmedAt: new Date().toISOString(),
    locationRegion: { provinceCode: 1, wardCode: 9604 },
  };
  verifiedLocation.locationAddressSignature = locationAddressSignature(verifiedLocation);
  const simultaneous = await Promise.all([
    mutate(booking('10:00', verifiedLocation)),
    mutate(booking('10:00', { ...verifiedLocation, phone: '0900001102' })),
  ]);
  assert.deepEqual(simultaneous.map(result => result.response.status).sort(), [201, 409]);
  const first = simultaneous.find(result => result.response.status === 201).json.appointment;
  assert.match(first.code, /^HMA-\d{6}-[0-9A-F]{12}$/);
  assert.equal(first.email, bookingEmail);
  const counts = await db.prepare("SELECT (SELECT COUNT(*) FROM appointments WHERE date = ?) AS appointments, (SELECT COUNT(*) FROM customers) AS customers, (SELECT COUNT(*) FROM site_content WHERE key GLOB 'booking:*') AS details")
    .bind(date).first();
  assert.deepEqual(counts, { appointments: 1, customers: 1, details: 1 });
  const hours = await success(await availability(date));
  assert.deepEqual(Object.keys(hours), ['times']);
  assert.ok(hours.times.includes('11:00'));
  assert.ok(!hours.times.includes('10:00') && !hours.times.includes('12:00') && !hours.times.includes('13:00'));

  const lookup = { action: 'lookupBooking', code: first.code, phone: first.phone };
  assert.equal((await mutate({ ...lookup, phone: '0900001199' })).response.status, 404);
  const formattedPhone = `(${first.phone.slice(0, 4)}) ${first.phone.slice(4, 7)}-${first.phone.slice(7)}`;
  const verified = await success(await mutate({ ...lookup, phone: formattedPhone }));
  assert.equal(verified.appointment.code, first.code);
  assert.equal(verified.paymentInstructions.bankAccount, settings.bankAccount);
  assert.deepEqual(verified.bookingDetails.locationCoordinates, point);
  assert.deepEqual(verified.bookingDetails.locationDeviceCoordinates, point);
  assert.equal(verified.bookingDetails.locationCapturedAt, verifiedLocation.locationCapturedAt);
  assert.equal(verified.bookingDetails.travelFee, 50000);
  await db.prepare("UPDATE sensitive_request_limits SET attempts = 100 WHERE scope = 'appointment-access'").run();
  assert.equal((await mutate(lookup)).response.status, 429);
  await db.prepare("UPDATE sensitive_request_limits SET window_end = 0 WHERE scope = 'appointment-access'").run();
  await success(await mutate(lookup));
  await success(await mutate({ action: 'reportPayment', code: first.code, phone: first.phone }));
  assert.equal((await mutate({ action: 'archiveAppointment', code: first.code }, true)).response.status, 409);
  const payment = {
    action: 'recordPayment', code: first.code, kind: 'deposit', amount: 200000,
    method: 'cash', occurredAt: new Date(Date.now() - 5000).toISOString(), idempotencyKey: randomUUID(),
  };
  await success(await mutate(payment, true), 201);
  await success(await mutate(payment, true));
  const invalidPayment = await mutate({ ...payment, amount: '', idempotencyKey: randomUUID() }, true);
  assert.equal(invalidPayment.response.status, 400);
  assert.ok(invalidPayment.json.fieldErrors.amount);
  const paid = await success(await mutate(lookup));
  assert.equal(paid.paymentHistory.length, 1);
  assert.equal(paid.appointment.deposit, 200000);
  assert.equal((await mutate({ action: 'archiveAppointment', code: first.code }, true)).response.status, 409);

  const editedAddress = { ...verifiedLocation, address: '99 Địa chỉ đã sửa', phone: first.phone, customer: 'Alternate entered name' };
  const second = (await success(await mutate(booking('14:00', editedAddress)), 201)).appointment;
  const edited = await success(await mutate({ ...lookup, code: second.code }));
  assert.equal(edited.appointment.address, editedAddress.address);
  assert.equal(edited.bookingDetails.locationCoordinates, null);
  assert.equal(edited.bookingDetails.locationDeviceCoordinates, null);
  const customer = await db.prepare('SELECT name, visits FROM customers WHERE phone = ?').bind(first.phone).first();
  assert.deepEqual(customer, { name: first.customer, visits: 2 });
  await success(await mutate({ action: 'archiveAppointment', code: second.code }, true));
  assert.equal((await mutate({ action: 'lookupBooking', code: second.code, phone: first.phone })).response.status, 404);
  assert.ok((await success(await request('/api/data?admin=1&view=archive', { admin: true }))).appointments.some(row => row.code === second.code));
  await success(await mutate({ action: 'setScheduleSlot', date, time: '14:00', status: 'blocked' }, true));
  assert.equal((await mutate({ action: 'restoreAppointment', code: second.code }, true)).response.status, 409);
  await success(await mutate({ action: 'setScheduleSlot', date, time: '14:00', status: 'available' }, true));
  await success(await mutate({ action: 'restoreAppointment', code: second.code }, true));
  assert.equal((await db.prepare("SELECT COUNT(*) AS count FROM protected_record_history WHERE entity_key = ?").bind(second.code).first()).count, 2);
  assert.ok(await db.prepare("SELECT key FROM site_content WHERE key = ?").bind('booking:' + second.code).first());
  assert.equal((await db.prepare("SELECT COUNT(*) AS count FROM payment_transactions WHERE appointment_code = ?").bind(first.code).first()).count, 1);

  const manual = await success(await mutate(booking('16:00', {
    date: vietnamDay(6), locationType: 'artist', email: undefined,
  }), true), 201);
  assert.equal(manual.appointment.email, '');
  await success(await request('/api/admin-session', { method: 'DELETE', admin: true }));
  assert.equal((await request('/api/data?admin=1', { admin: true })).response.status, 401);
  assert.equal((await request('/api/admin-session', { admin: true })).response.status, 401);
  console.log('PASS Worker: confirmed GPS readback, edited address drops GPS, required email, availability, private lookup, payments and archive/restore.');

  browser = await chromium.launch({ channel: 'msedge', headless: true });
  await mkdir('outputs/admin-login', { recursive: true });
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await db.prepare("DELETE FROM sensitive_request_limits WHERE scope = 'appointment-create'").run();
    const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
    await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    await context.addInitScript(({ date, time }) => {
      localStorage.setItem('hoanAnalyticsConsent', 'no');
      localStorage.setItem('hoanMakeupDraft', JSON.stringify({ booking: { date, time, serviceId: 'personal', locationType: 'artist' } }));
    }, { date, time: viewport.width > 800 ? '16:00' : '18:00' });
    const page = await context.newPage();
    page.setDefaultTimeout(12_000);
    await page.goto(base + '/#/booking/time');
    await page.locator('.ct-time-slots [data-time="11:00"]').waitFor();
    assert.equal(await page.locator('.ct-time-slots [data-time="10:00"], .ct-time-slots [data-time="12:00"], .ct-time-slots [data-time="13:00"]').count(), 0);
    assert.equal(await page.evaluate(() => window.state.appointments.length + window.state.scheduleSlots.length), 0);

    await page.goto(base + '/#/booking/info');
    const info = page.locator('form[data-form="info"]');
    const bookingEmailInput = info.locator('[name="email"]');
    await info.locator('[name="name"]').fill('Khách kiểm tra email');
    await info.locator('[name="phone"]').fill('0900001105');
    await info.locator('[name="consent"]').check();
    assert.equal(await bookingEmailInput.getAttribute('required'), '');
    const continueBooking = page.locator('[data-action="ct-next"]');
    const bookingResponse = () => page.waitForResponse(response => response.url().endsWith('/api/data') && response.request().postDataJSON()?.action === 'createAppointment');
    for (const value of ['', 'sai-email']) {
      await bookingEmailInput.fill(value);
      const pending = bookingResponse();
      await continueBooking.click();
      const result = await pending;
      assert.equal(result.status(), 400);
      const error = (await result.json()).fieldErrors.email;
      await info.locator('.server-field-feedback').filter({ hasText: error }).waitFor();
      assert.equal(await bookingEmailInput.getAttribute('aria-invalid'), 'true');
      assert.equal(await info.locator('[name="name"]').inputValue(), 'Khách kiểm tra email');
    }
    await bookingEmailInput.fill(bookingEmail);
    const pending = bookingResponse();
    await continueBooking.click();
    const created = await pending;
    assert.equal(created.status(), 201, (await created.json()).error);
    assert.equal((await created.json()).appointment.email, bookingEmail);
    await page.waitForURL(base + '/#/booking/deposit');

    await page.goto(base + '/#/lookup');
    await page.getByRole('link', { name: 'Quên mã lịch hẹn?' }).click();
    await page.waitForURL(base + '/#/lookup/recover');
    const recovery = page.locator('form[data-form="booking-google-email"]');
    const email = recovery.locator('[name="email"]');
    await email.fill('test@example.test');
    assert.equal(await page.locator('main [name="phone"], [data-sms-unavailable], main a[href="#/lookup/recover/sms"]').count(), 0);
    const googleStart = page.waitForResponse(response => response.url().endsWith('/api/data') && response.request().postDataJSON()?.action === 'startBookingGoogle');
    await recovery.locator('[type="submit"]').click();
    const unavailable = await googleStart;
    assert.equal(unavailable.status(), 503);
    await recovery.getByRole('alert').filter({ hasText: (await unavailable.json()).error }).waitFor();
    assert.equal(await email.inputValue(), 'test@example.test');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);

    await page.goto(base + '/#/admin/appointments');
    await page.locator('#admin-access-key').waitFor();
    await page.locator('.security-login-cover img').evaluate(img => img.decode());
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.screenshot({ path: 'outputs/admin-login/' + (viewport.width > 800 ? 'desktop' : 'mobile') + '.png' });
    const submit = page.locator('[data-form="admin-login"] [type="submit"]');
    const emptyLogin = page.waitForResponse(response => response.url().endsWith('/api/admin-session') && response.request().method() === 'POST');
    await submit.click();
    const rejected = await emptyLogin;
    assert.equal(rejected.status(), 400);
    const loginError = (await rejected.json()).fieldErrors.token;
    await page.locator('.security-login .server-field-feedback').waitFor();
    assert.equal(await page.locator('.security-login .server-field-feedback').innerText(), loginError);
    assert.equal(await page.locator('#admin-access-key').getAttribute('aria-invalid'), 'true');
    await page.locator('#admin-access-key').fill('fixture-input');
    await page.locator('[data-login-toggle]').click();
    assert.equal(await page.locator('#admin-access-key').getAttribute('type'), 'text');
    await page.locator('[data-login-toggle]').click();
    assert.equal(await page.locator('#admin-access-key').getAttribute('type'), 'password');
    await page.locator('#admin-access-key').fill(adminKey);
    const loginResponse = page.waitForResponse(response => response.url().endsWith('/api/admin-session') && response.request().method() === 'POST', { timeout: 10_000 });
    await page.locator('[data-form="admin-login"] [type="submit"]').click();
    assert.equal((await loginResponse).status(), 200);
    try {
      await page.locator('[data-action="appointment-archive"]').first().waitFor({ timeout: 10_000 });
    } catch (error) {
      console.error('Login screen', { width: viewport.width, route: new URL(page.url()).hash, message: await page.locator('[data-login-status]').textContent({ timeout: 1000 }).catch(() => ''), authorized: await page.evaluate(() => window.state?.adminAuthorized) });
      throw error;
    }
    assert.equal(await page.evaluate(() => window.state.adminAuthorized), true);
    assert.equal(await page.evaluate(() => localStorage.getItem('hoanAdminToken') || sessionStorage.getItem('hoanAdminToken')), null);
    assert.ok((await context.cookies()).some(cookie => cookie.name === 'hoan_admin_local' && cookie.httpOnly));
    if (viewport.width > 800) {
      await page.locator('[data-action="admin-delete-appointment"][data-code="' + second.code + '"]').first().click();
      await page.locator('.modal [data-action="modal-confirm"]').click();
      await page.locator('[data-action="admin-delete-appointment"][data-code="' + second.code + '"]').waitFor({ state: 'detached' });
    }
    await page.locator('[data-action="appointment-archive"]').first().click();
    await page.locator('[data-appointment-archive] .toolbar').waitFor();
    if (viewport.width > 800) {
      await page.locator('[data-action="restore-archived-appointment"][data-code="' + second.code + '"]').click();
      await page.locator('[data-action="admin-delete-appointment"][data-code="' + second.code + '"]').waitFor();
    }
    const signedOut = page.waitForResponse(response => response.url().endsWith('/api/admin-session') && response.request().method() === 'DELETE');
    await page.evaluate(() => document.dispatchEvent(new Event('hoan:admin-logout')));
    assert.equal((await signedOut).status(), 200);
    await page.locator('#admin-access-key').waitFor();
    assert.equal(await page.evaluate(() => window.state.customers.length + window.state.paymentTransactions.length), 0);

    await page.goto(base + '/#/lookup');
    const lookupForm = page.locator('[data-form="lookup"]');
    await lookupForm.waitFor();
    const emptyLookup = page.waitForResponse(response => response.url().endsWith('/api/data') && response.request().postDataJSON()?.action === 'lookupBooking');
    await lookupForm.locator('button').click();
    const lookupResponse = await emptyLookup;
    assert.equal(lookupResponse.status(), 400);
    const codeError = (await lookupResponse.json()).fieldErrors.code;
    await lookupForm.getByText(codeError, { exact: true }).waitFor();
    assert.equal(await lookupForm.locator('[name="code"]').getAttribute('aria-invalid'), 'true');

    await page.evaluate(code => localStorage.setItem('hoanLastBookingCode', code), first.code);
    await page.reload();
    await page.getByRole('link', { name: 'Quên mã lịch hẹn?' }).click();
    await page.getByRole('link', { name: 'Mở lịch đã lưu', exact: true }).click();
    const recent = page.locator('[data-form="lookup-recent"]');
    await recent.waitFor();
    assert.equal(await recent.locator('[name="code"]').count(), 0);
    assert.ok(!(await page.locator('main').innerText()).includes(first.code));
    await recent.locator('[name="phone"]').fill('0900001199');
    const wrongPhone = page.waitForResponse(response => response.url().endsWith('/api/data') && response.request().postDataJSON()?.action === 'lookupBooking');
    await recent.locator('[type="submit"]').click();
    const mismatch = await wrongPhone;
    assert.equal(mismatch.status(), 404);
    await recent.getByRole('alert').filter({ hasText: (await mismatch.json()).error }).waitFor();
    await recent.locator('[name="phone"]').fill(first.phone);
    await recent.locator('[type="submit"]').click();
    await page.waitForURL(base + '/#/booking/' + first.code);
    await page.getByText(first.code, { exact: true }).first().waitFor();
    await context.close();
  }
  console.log('PASS Edge desktop/mobile: required booking email and inline backend errors, recovery, sign-in, archive/restore and sign-out.');

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  const app = await browser.newContext({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' });
  const pages = await Promise.all([desktop, app].map(async context => {
    await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
    await context.addInitScript(() => localStorage.setItem('hoanAnalyticsConsent', 'no'));
    const login = await context.request.post(base + '/api/admin-session', { headers: { Origin: base }, data: { key: adminKey } });
    assert.equal(login.status(), 200);
    const page = await context.newPage();
    page.setDefaultTimeout(12_000);
    await page.goto(base + '/#/admin');
    await page.locator('.overview-dashboard').waitFor();
    return page;
  }));
  const [webPage, appPage] = pages;
  const openMenu = () => appPage.getByRole('link', { name: 'Tất cả chức năng' }).click();
  const normalizeAdminLink = href => href.replace(/\/$/, '');
  const desktopLinks = (await webPage.locator('.admin-sidebar .admin-link').evaluateAll(links => links.map(link => link.getAttribute('href')))).map(normalizeAdminLink);
  for (const width of [375, 440]) {
    await appPage.setViewportSize({ width, height: width === 375 ? 667 : 956 });
    await openMenu();
    await appPage.locator('.ma-workspace-menu').waitFor();
    const menuLinks = await appPage.locator('.ma-workspace-menu a').evaluateAll(links => links.map(link => link.getAttribute('href')));
    assert.deepEqual(menuLinks.map(normalizeAdminLink), desktopLinks);
    for (const href of menuLinks.filter(link => link !== '#/admin')) {
      await appPage.locator('.ma-workspace-menu a[href="' + href + '"]').click();
      const section = href.slice('#/admin/'.length);
      await appPage.locator('#main.admin-content[data-admin-page="' + section + '"]').waitFor();
      assert.doesNotMatch(await appPage.locator('#main').innerText(), /bố cục quản trị rút gọn/);
      assert.equal(await appPage.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, href + ' at ' + width);
      await openMenu();
    }
    await appPage.locator('.ma-workspace-menu a[href="#/admin"]').click();
    await appPage.locator('.ma-app .overview-dashboard').waitFor();
  }

  await openMenu();
  await appPage.locator('#admin-global-search').fill(first.code);
  await appPage.locator('#admin-global-search').press('Enter');
  await appPage.locator('.overview-search-results').getByText(first.code, { exact: false }).first().waitFor();
  await appPage.getByRole('dialog').getByRole('button', { name: 'Đóng', exact: true }).click();
  await appPage.getByRole('dialog').waitFor({ state: 'detached' });

  await webPage.goto(base + '/#/admin/customers');
  await webPage.locator('[data-action="add-customer"]').waitFor();
  await appPage.locator('.ma-bottom [href="#/admin/customers"]').click();
  await appPage.locator('[data-action="add-customer"]').click();
  const confirm = appPage.locator('.modal [data-action="modal-confirm"]');
  await confirm.click();
  await appPage.locator('#modal-customer-phone[aria-invalid="true"]').waitFor();
  await appPage.locator('#modal-customer-name').fill('Khách kiểm tra đồng bộ');
  await appPage.locator('#modal-customer-phone').fill('0900002201');
  await confirm.click();
  const appCustomer = appPage.getByText('Khách kiểm tra đồng bộ', { exact: true });
  await appCustomer.waitFor();

  await webPage.bringToFront();
  await webPage.evaluate(() => window.dispatchEvent(new Event('focus')));
  const webCustomer = webPage.locator('tbody tr').filter({ hasText: 'Khách kiểm tra đồng bộ' });
  await webCustomer.locator('[data-action="edit-customer"]').click();
  await webPage.locator('#modal-customer-name').fill('Khách đã cập nhật từ web');
  await webPage.locator('.modal [data-action="modal-confirm"]').click();
  await webPage.getByText('Khách đã cập nhật từ web', { exact: true }).waitFor();

  await appPage.bringToFront();
  await appPage.evaluate(() => window.dispatchEvent(new Event('focus')));
  await appPage.getByText('Khách đã cập nhật từ web', { exact: true }).waitFor();
  const exportFile = appPage.waitForEvent('download');
  await appPage.locator('[data-action="export-customers"]').click();
  assert.match((await exportFile).suggestedFilename(), /\.csv$/i);
  assert.equal((await mutate({ action: 'saveCustomer', name: 'Ẩn danh', phone: '0900002299' })).response.status, 401);
  await Promise.all([desktop.close(), app.close()]);
  console.log('PASS desktop and iPhone-sized admin: shared menu, all 16 routes, customer changes across sessions, server errors, CSV export and authorization.');
} finally {
  await browser?.close();
  await worker.dispose();
}
