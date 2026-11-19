import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

const base = process.env.TEST_BASE_URL || 'http://localhost:5173';
const gps = { lat: 21.100123456789, lon: 105.500987654321, accuracy: 12, mode: 'gps' };
const service = { id: 'party', name: 'Trang điểm dự tiệc', enabled: true, duration: 90, price: 650000 };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
await mkdir('outputs/booking-address', { recursive: true });
let scenarios = 0;

async function setup(mode = 'success', width = 1440) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
  const errors = [], mapRequests = [], writes = [], reverse = [];
  let releaseReverse;
  let notifyReverse;
  let releaseValidation;
  let notifyValidation;
  const reverseStarted = new Promise(resolve => { notifyReverse = resolve; });
  const validationStarted = new Promise(resolve => { notifyValidation = resolve; });
  const future = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const business = { services: [service], appointments: [], customers: [], scheduleSlots: [], requests: [], notifications: [], bookingDetails: {}, paymentTransactions: [], brand: {}, settings: { travelFee: 50000, deposit: 200000, scheduleOpen: true, bookingWindow: 60, mapProvider: 'google', googleMapsBrowserKey: 'legacy-unused-key' } };
  await context.addInitScript(({ mode, future, gps }) => {
    localStorage.setItem('hoanAnalyticsConsent', 'no');
    if (!localStorage.getItem('hoanMakeupDraft')) localStorage.setItem('hoanMakeupDraft', JSON.stringify({ booking: { serviceId: 'party', date: future, time: '10:00', locationType: 'client', address: '', city: '', ward: '' } }));
    window.testGpsCalls = 0; window.testWatchClears = 0;
    Object.defineProperty(navigator, 'permissions', { configurable: true, value: { async query() { return { state: mode === 'prompt' ? 'prompt' : 'granted', addEventListener() {}, removeEventListener() {} }; } } });
    const geolocation = { getCurrentPosition(success, error) {
      window.testGpsCalls++;
      if (mode === 'prompt') return;
      if (mode === 'delayed-native') { window.releaseNativeGps = () => success({ coords: { latitude: gps.lat, longitude: gps.lon, accuracy: gps.accuracy }, timestamp: Date.now() }); return; }
      const coords = { latitude: gps.lat, longitude: gps.lon, accuracy: mode === 'coarse' ? 2500 : gps.accuracy };
      if (mode === 'outside-directory') Object.assign(coords, { latitude: 0, longitude: 0 });
      if (mode === 'refining') Object.assign(coords, { latitude: gps.lat + .0001, accuracy: 85 });
      queueMicrotask(() => mode === 'denied' || mode === 'timeout' ? error({ code: mode === 'denied' ? 1 : 3 }) : success({ coords, timestamp: Date.now() }));
    }, watchPosition(success, error) {
      if (mode === 'refining') {
        window.releasePreciseGps = () => success({ coords: { latitude: gps.lat, longitude: gps.lon, accuracy: gps.accuracy }, timestamp: Date.now() });
      } else queueMicrotask(() => error({ code: mode === 'timeout' ? 3 : 2 }));
      return 1;
    }, clearWatch() { window.testWatchClears++; } };
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: mode === 'unsupported' ? undefined : geolocation });
    if (mode === 'offline') Object.defineProperty(navigator, 'onLine', { get: () => false });
  }, { mode, future, gps });
  await context.route('https://**', route => route.abort());
  let releaseAliases;
  if (mode === 'alias-slow') {
    const aliases = new Promise(resolve => { releaseAliases = resolve; });
    await context.route('**/data/vietnam-ward-aliases.json', async route => {
      await aliases;
      await route.continue().catch(() => {});
    });
  }
  await context.route('**/api/**', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname === '/api/data') {
      if (request.method() === 'GET') {
        if (url.searchParams.has('code')) {
          const appointment = business.appointments.find(item => item.code === url.searchParams.get('code'));
          return route.fulfill({ json: { appointment, bookingDetails: business.bookingDetails[appointment?.code] || {}, paymentInstructions: {}, paymentHistory: [] } });
        }
        return route.fulfill({ json: business });
      }
      const data = request.postDataJSON();
      if (data.action === 'reverseGeocode') {
        reverse.push(data);
        if (mode === 'delayed-reverse') await new Promise(resolve => { releaseReverse = resolve; notifyReverse(); });
        const value = mode === 'reverse-error' ? { error: 'No address' } : { countryCode: mode === 'mismatch' ? 'us' : 'vn', city: 'Thành phố Hà Nội', provinceCode: 1, ward: 'Phường Tùng Thiện', wardCode: 9604, address: '14 Đường kiểm thử', featureDistanceMeters: mode === 'street-only' ? 35 : 1, addressParts: { houseNumber: '14', road: 'Đường kiểm thử', ward: 'Phường Tùng Thiện', province: 'Thành phố Hà Nội' } };
        return route.fulfill({ status: mode === 'reverse-error' ? 503 : 200, json: value }).catch(() => {});
      }
      if (data.action === 'validateBookingLocation') {
        if (mode === 'delayed-validation' && !releaseValidation) {
          await new Promise(resolve => { releaseValidation = resolve; notifyValidation(); });
        }
        return route.fulfill({ json: { ok: true } });
      }
      if (data.action === 'lookupBooking') {
        const appointment = business.appointments.find(item => item.code === data.code && item.phone === data.phone);
        if (!appointment) return route.fulfill({ status: 404, json: { error: 'Không tìm thấy lịch hẹn.' } });
        return route.fulfill({ json: { appointment, bookingDetails: business.bookingDetails[appointment.code], paymentInstructions: {}, paymentHistory: [] } });
      }
      writes.push(data);
      if (data.action === 'createAppointment') {
        const appointment = { ...data, code: 'TEST-ADDRESS-' + width, status: 'pending', total: 700000, deposit: 0, paymentStatus: 'unverified' };
        business.appointments.push(appointment); business.bookingDetails[appointment.code] = { ...data };
        return route.fulfill({ status: 201, json: { appointment } });
      }
      return route.fulfill({ status: 400, json: { error: 'Unexpected fixture write' } });
    }
    if (url.pathname === '/api/site-content') return route.fulfill({ json: { pages: {}, drafts: {} } });
    return route.fulfill({ json: { shared: { value: {}, revision: '' }, media: { value: [], revision: '' }, templates: { value: [], revision: '' } } });
  });
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  if (['prompt', 'timeout', 'coarse'].includes(mode)) await page.clock.install();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !/Failed to load resource/.test(message.text())) errors.push(message.text()); });
  page.on('request', request => {
    if (/maps\.googleapis|maps\.gstatic|tiles\.openfreemap|tile\.openstreetmap|\/vendor\/(maplibre|leaflet)|\/(?:location-(?:map|vector-map|raster-map|search)|google-maps-loader)\.js|\/api\/(?:map-tiles|maps-config|address-search)/.test(request.url())) mapRequests.push(request.url());
  });
  await page.goto(base + '/#/booking/location');
  await page.locator('#booking-city:not([disabled])').waitFor();
  assert.equal(await page.evaluate(() => window.testGpsCalls), 0, 'No automatic location prompt');
  assert.equal(await page.locator('[data-location-map-panel],[data-location-map-canvas],.location-address-search').count(), 0);
  assert.equal(await page.locator('.location-toolbar p').innerText(), 'Vui lòng cung cấp địa chỉ để chuyên viên đến đúng địa điểm.');
  const metrics = await page.locator('[data-location-detect]').evaluate(node => ({ width: node.getBoundingClientRect().width, parent: node.parentElement.getBoundingClientRect().width, radius: getComputedStyle(node).borderRadius }));
  assert.ok(Math.abs(metrics.width - metrics.parent) <= 1); assert.equal(metrics.radius, '999px');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  const waitForRequest = started => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Booking address request did not start')), 15000);
    started.then(() => { clearTimeout(timer); resolve(); });
  });
  return {
    page, context, errors, mapRequests, writes, reverse, waitForReverse: () => waitForRequest(reverseStarted),
    waitForValidation: () => waitForRequest(validationStarted),
    release() { releaseReverse?.(); releaseValidation?.(); },
    async close() {
      this.release(); releaseAliases?.();
      assert.deepEqual(errors, []); assert.deepEqual(mapRequests, []); await context.close(); scenarios++;
    },
  };
}

async function manualAddress(page, address = '99 Địa chỉ nhập tay') {
  await page.locator('#booking-city').fill('Hà Nội');
  await page.locator('[data-location-choice="city"]').filter({ hasText: 'Thành phố Hà Nội' }).click();
  await page.locator('#booking-ward').fill('Tùng Thiện');
  await page.locator('[data-location-choice="ward"]').filter({ hasText: 'Phường Tùng Thiện' }).click();
  await page.locator('#booking-address').fill(address);
}
const gpsDone = page => page.waitForFunction(() => !window.state.booking.isDetectingLocation);
async function completeBooking(test) {
  const { page, writes } = test;
  await page.locator('[data-action="ct-next"]').click(); await page.waitForURL(/#\/booking\/info$/);
  await page.locator('form[data-form="info"] [name="name"]').fill('Khách kiểm thử địa chỉ');
  await page.locator('form[data-form="info"] [name="phone"]').fill('0900000000');
  await page.locator('form[data-form="info"] [name="email"]').fill('khach@example.test');
  await page.locator('form[data-form="info"] [name="consent"]').check();
  await page.locator('[data-action="ct-next"]').click(); await page.waitForURL(/#\/booking\/deposit$/);
  assert.equal(writes.length, 1); assert.equal(writes[0].action, 'createAppointment'); assert.equal(writes[0].travelFee, 50000);
  await page.locator('[data-action="go-step"][data-target="/booking/confirm"]').click();
  await page.locator('[data-action="complete-booking"]').click(); await page.waitForURL(/#\/booking\/success$/);
  assert.equal(writes.length, 1, 'No actual payment confirmation or duplicate booking');
  return writes[0];
}

try {
  for (const width of [1440, 768, 390]) {
    const test = await setup('success', width), { page } = test;
    await manualAddress(page); await page.locator('#booking-location-note').fill('Cổng bên phải, tầng 2');
    await page.evaluate(() => window.scrollTo(0, 0)); await page.screenshot({ path: `outputs/booking-address/manual-${width}.png`, fullPage: true });
    const payload = await completeBooking(test);
    assert.equal(await page.evaluate(() => window.testGpsCalls), 0); assert.equal(payload.locationCoordinates, null); assert.equal(payload.locationDeviceCoordinates, null);
    assert.equal(payload.address, '99 Địa chỉ nhập tay'); assert.equal(payload.locationNote, 'Cổng bên phải, tầng 2'); await test.close();
  }
  {
    const test = await setup(), { page } = test;
    await page.locator('[data-location-detect]').click(); await gpsDone(page);
    assert.equal(await page.locator('#booking-address').inputValue(), '14 Đường kiểm thử');
    assert.deepEqual(await page.evaluate(() => window.state.booking.locationCoordinates), gps);
    assert.equal(await page.evaluate(() => window.state.booking.locationConfirmedAt), '', 'GPS suggestion awaits Tiếp tục');
    await page.locator('#booking-location-note').fill('Tầng 2');
    await page.locator('[data-action="ct-next"]').click(); await page.waitForURL(/#\/booking\/info$/);
    assert.ok(await page.evaluate(() => window.state.booking.locationConfirmedAt));
    await page.evaluate(() => { location.hash = '#/booking/location'; }); await page.locator('#booking-address').waitFor();
    assert.deepEqual(await page.evaluate(() => window.state.booking.locationCoordinates), gps);
    const payload = await completeBooking(test); assert.deepEqual(payload.locationCoordinates, gps); assert.ok(payload.locationAddressSignature); await test.close();
  }
  {
    const test = await setup('alias-slow'), { page } = test;
    await page.locator('[data-location-detect]').click(); await gpsDone(page);
    assert.equal(await page.locator('#booking-address').inputValue(), '14 Đường kiểm thử');
    assert.match(await page.locator('[data-location-accuracy]').innerText(), /±12 m/);
    await page.screenshot({ path: 'outputs/booking-address/location-desktop.png' });
    await test.close();
  }
  {
    const test = await setup('refining'), { page, context } = test;
    const boundaryLoading = context.waitForEvent('request', { predicate: request => new URL(request.url()).pathname.endsWith('/administrative-boundaries/index.json'), timeout: 12000 });
    await page.locator('[data-location-detect]').click();
    await boundaryLoading;
    assert.equal(await page.locator('.booking-location').getAttribute('data-location-stage'), 'refining');
    assert.equal(test.reverse.length, 0);
    await page.evaluate(() => window.releasePreciseGps());
    await gpsDone(page);
    assert.deepEqual(test.reverse, [{ action: 'reverseGeocode', lat: gps.lat, lon: gps.lon }]);
    assert.deepEqual(await page.evaluate(() => window.state.booking.locationCoordinates), gps);
    await test.close();
  }
  {
    const test = await setup('street-only', 390), { page } = test;
    await page.locator('[data-location-detect]').click(); await gpsDone(page);
    assert.equal(await page.locator('#booking-address').inputValue(), 'Đường kiểm thử');
    assert.match(await page.locator('[data-location-status]').innerText(), /bổ sung số nhà/);
    await page.screenshot({ path: 'outputs/booking-address/location-mobile.png' });
    await page.locator('[data-location-manual]').click();
    assert.equal(await page.locator('#booking-address').evaluate(input => input === document.activeElement), true);
    await test.close();
  }
  for (const mode of ['denied', 'unsupported', 'timeout', 'coarse', 'offline', 'reverse-error', 'mismatch', 'outside-directory']) {
    const test = await setup(mode), { page } = test;
    await page.locator('[data-location-detect]').click();
    if (['timeout', 'coarse'].includes(mode)) {
      await page.waitForFunction(() => ['retrying', 'refining'].includes(window.state.booking.locationStage));
      await page.clock.fastForward(18001);
    }
    await gpsDone(page);
    assert.equal(await page.locator('[data-location-detect]').isEnabled(), true);
    assert.ok((await page.locator('[data-location-status]').innerText()).length > 0);
    assert.equal(await page.locator('#booking-address').inputValue(), '');
    if (['coarse', 'denied', 'unsupported', 'offline', 'outside-directory'].includes(mode)) assert.equal(test.reverse.length, 0);
    await manualAddress(page); const payload = await completeBooking(test); assert.equal(payload.locationCoordinates, null); assert.equal(payload.locationDeviceCoordinates, null); await test.close();
  }
  {
    const test = await setup(), { page } = test;
    await page.locator('[data-location-detect]').click(); await gpsDone(page);
    await page.locator('#booking-address').fill('99 Địa chỉ đã sửa');
    assert.equal(await page.evaluate(() => window.state.booking.locationCoordinates), null);
    const payload = await completeBooking(test); assert.equal(payload.address, '99 Địa chỉ đã sửa'); assert.equal(payload.locationCoordinates, null); await test.close();
  }
  {
    const test = await setup(), { page } = test;
    await manualAddress(page, '88 Khách đã chỉnh tay');
    await page.locator('[data-location-detect]').click(); await gpsDone(page);
    assert.equal(await page.locator('#booking-address').inputValue(), '88 Khách đã chỉnh tay');
    assert.equal(await page.evaluate(() => window.state.booking.locationCoordinates), null); await test.close();
  }
  {
    const test = await setup(), { page } = test;
    await page.locator('[data-location-detect]').click(); await gpsDone(page);
    await page.locator('#booking-address').evaluate(input => { input.value = '77 Địa chỉ từ browser autofill'; });
    const payload = await completeBooking(test);
    assert.equal(payload.address, '77 Địa chỉ từ browser autofill'); assert.equal(payload.locationCoordinates, null); await test.close();
  }
  for (const field of ['city', 'ward']) {
    const test = await setup(), { page } = test;
    await page.locator('[data-location-detect]').click(); await gpsDone(page);
    await page.locator('#booking-' + field).fill(field === 'city' ? 'Đà Nẵng' : 'Sơn Tây');
    assert.equal(await page.evaluate(() => window.state.booking.locationCoordinates), null);
    assert.equal(await page.evaluate(() => window.state.booking.locationAddressSignature), '');
    await manualAddress(page); const payload = await completeBooking(test); assert.equal(payload.locationCoordinates, null); await test.close();
  }
  for (const mode of ['delayed-native', 'delayed-reverse']) {
    const test = await setup(mode), { page } = test;
    await page.locator('[data-location-detect]').click();
    if (mode === 'delayed-reverse') await test.waitForReverse();
    await page.locator('#booking-address').fill('77 Nhập khi đang định vị');
    if (mode === 'delayed-native') await page.evaluate(() => window.releaseNativeGps()); else await test.release();
    await page.waitForTimeout(200);
    assert.equal(await page.locator('#booking-address').inputValue(), '77 Nhập khi đang định vị');
    assert.equal(await page.evaluate(() => window.state.booking.locationCoordinates), null); await test.close();
  }
  {
    const test = await setup('delayed-validation'), { page } = test;
    await page.locator('[data-location-detect]').click(); await gpsDone(page);
    await page.locator('[data-action="ct-next"]').click();
    await test.waitForValidation();
    await page.locator('#booking-ward').fill('Sơn Tây');
    test.release();
    await page.locator('[data-location-form-error]').filter({ hasText: 'Địa chỉ vừa thay đổi' }).waitFor();
    assert.equal(new URL(page.url()).hash, '#/booking/location');
    assert.equal(await page.evaluate(() => window.state.booking.locationCoordinates), null);
    await test.close();
  }
  {
    const test = await setup('delayed-native'), { page } = test;
    await page.locator('[data-location-detect]').click(); await page.evaluate(() => { const b = document.querySelector('[data-location-detect]'); b.click(); b.click(); });
    assert.equal(await page.evaluate(() => window.testGpsCalls), 1);
    await page.evaluate(() => { location.hash = '#/support'; }); await page.locator('.support-desk').waitFor();
    await page.evaluate(() => window.releaseNativeGps()); await page.evaluate(() => { location.hash = '#/booking/location'; });
    await page.locator('#booking-address').waitFor(); assert.equal(await page.locator('#booking-address').inputValue(), '');
    assert.equal(await page.evaluate(() => window.state.booking.isDetectingLocation), false); await test.close();
  }
  {
    const test = await setup('prompt'), { page } = test;
    await page.locator('[data-location-detect]').click();
    await page.clock.fastForward(45001); await gpsDone(page);
    assert.match(await page.locator('[data-location-status]').innerText(), /quá thời gian/); await test.close();
  }
  {
    const test = await setup('delayed-native'), { page } = test;
    await page.locator('[data-location-detect]').click(); await page.locator('[data-location-cancel]').click();
    await page.evaluate(() => window.releaseNativeGps());
    await manualAddress(page); const payload = await completeBooking(test); assert.equal(payload.locationCoordinates, null); await test.close();
  }
  {
    const test = await setup(), { page } = test;
    await page.locator('[data-location-detect]').click(); await gpsDone(page);
    await page.reload(); await page.locator('#booking-city:not([disabled])').waitFor();
    assert.equal(await page.locator('#booking-address').inputValue(), '14 Đường kiểm thử');
    assert.equal(await page.evaluate(() => window.state.booking.locationCoordinates), null);
    assert.equal(await page.evaluate(() => window.testGpsCalls), 0); await test.close();
  }
  console.log(`PASS ${scenarios} booking-address browser scenarios: desktop/tablet/mobile manual booking, precise/coarse GPS, denial/unsupported/timeout/offline/mismatch, reverse failure, no overwrite, edit invalidation, late responses, duplicate clicks, watchdog, navigation/reload and zero map requests. GPS and business writes mocked; no physical-device claim.`);
} finally { await browser.close(); }
