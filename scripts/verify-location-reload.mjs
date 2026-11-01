import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

// All coordinates, callbacks, address responses and appointment records below
// are local fixtures. The operating system's GPS and real APIs are never used.
const upstream = process.env.TEST_BASE_URL || 'http://localhost:5173';
const directory = JSON.parse(await readFile(new URL('../public/data/vietnam-administrative-latest.json', import.meta.url), 'utf8'));
const province = directory.find(item => item.code === 1), ward = province.wards.find(item => item.code === 9604);
const freshPoint = { lat: 21.1, lon: 105.5, accuracy: 12, mode: 'gps' };
const oldPoint = { lat: 21.18, lon: 105.58, accuracy: null, mode: 'pin' };
const oldDevicePoint = { lat: 21.1701, lon: 105.5701, accuracy: 80, mode: 'gps' };
const autoAddress = '12 Đường gợi ý cũ', freshAddress = '18 Đường gợi ý mới', manualAddress = 'Cổng do khách tự nhập';
const future = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
const recordedAt = new Date(Date.now() - 10000).toISOString();
const oldDraft = {
  serviceId: 'party', date: future, time: '10:00', locationType: 'client',
  name: 'Khách kiểm thử tải lại', phone: '0900000000', email: 'fixture@example.test',
  locationNote: 'Tầng 2, cổng bên phải', city: province.name, provinceCode: province.code,
  ward: ward.name, wardCode: ward.code, address: autoAddress,
  detectedAddress: [autoAddress, ward.name, province.name].join(', '),
  locationCoordinates: oldPoint, locationDeviceCoordinates: oldDevicePoint,
  locationCapturedAt: recordedAt, locationConfirmedAt: recordedAt,
  locationVerificationVersion: 1, locationRegion: { provinceCode: province.code, wardCode: ward.code },
  locationSource: 'administrative-boundaries',
  locationAutofill: { city: province.name, ward: ward.name, address: autoAddress },
  locationAddressDetails: { precision: 'house', parts: { houseNumber: '12', road: 'Đường gợi ý cũ' }, missingParts: [] },
  isDetectingLocation: true, locationStage: 'address', locationError: 'Old error', locationMessage: 'Old progress'
};
const appointment = { code: 'TEST-RELOAD-HISTORY', customer: oldDraft.name, phone: oldDraft.phone, email: oldDraft.email, serviceId: 'party', date: future, time: '10:00', address: autoAddress, ward: ward.name, status: 'confirmed', paymentStatus: 'unverified', total: 700000, deposit: 0, createdAt: recordedAt, updatedAt: recordedAt };
const bookedDetails = { city: province.name, locationCoordinates: oldPoint, locationDeviceCoordinates: oldDevicePoint, locationCapturedAt: recordedAt, locationConfirmedAt: recordedAt, locationNote: oldDraft.locationNote };
const snapshot = { services: [{ id: 'party', name: 'Dịch vụ kiểm thử', price: 650000, duration: 90, enabled: true }], appointments: [appointment], customers: [{ id: 1, name: appointment.customer, phone: appointment.phone, email: appointment.email, visits: 1, spent: 0 }], scheduleSlots: [], bookingDetails: { [appointment.code]: bookedDetails }, notifications: [], requests: [], brand: {}, settings: { deposit: 200000, travelFee: 50000, bookingWindow: 60, scheduleOpen: true } };
const boundary = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { code: ward.code }, bbox: [105.35, 20.95, 105.65, 21.25], geometry: { type: 'Polygon', coordinates: [[[105.35, 20.95], [105.65, 20.95], [105.65, 21.25], [105.35, 21.25], [105.35, 20.95]]] } }] };
const writes = [], errors = [], external = [], lookups = [];
const server = createServer(async (request, response) => {
  const json = (value, status = 200) => { response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); response.end(JSON.stringify(value)); };
  try {
    const path = new URL(request.url, 'http://localhost').pathname;
    if (path === '/__fixture_peer') { response.writeHead(200, { 'Content-Type': 'text/html' }); response.end('<!doctype html><title>Location reload fixture peer</title>'); return; }
    if (path === '/data/vietnam-administrative-latest.json') return json(directory);
    if (path === '/data/administrative-boundaries/index.json') return json({ provinces: [{ code: province.code, bbox: [105, 20, 106, 22] }] });
    if (path === '/data/administrative-boundaries/wards-01.json.gz') return json(boundary);
    if (path.startsWith('/api/')) {
      if (path === '/api/data') {
        if (request.method === 'GET') return json(snapshot);
        const chunks = []; for await (const chunk of request) chunks.push(chunk);
        const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (payload.action === 'reverseGeocode') { lookups.push(payload); return json({ address: freshAddress, addressDistance: 2, city: province.name, ward: ward.name, countryCode: 'vn' }); }
        writes.push(payload); return json({ error: 'API writes are blocked by the reload fixture.' }, 400);
      }
      if (path === '/api/site-content') return json({ pages: {}, drafts: {} });
      if (path === '/api/cms-resources') return json({ shared: { value: { albums: [], testimonials: [] }, revision: '' }, media: { value: [], revision: '' }, templates: { value: [], revision: '' } });
      if (request.method !== 'GET') writes.push({ path, method: request.method });
      return json({});
    }
    if (path === '/sw.js') { response.writeHead(200, { 'Content-Type': 'application/javascript' }); response.end('self.addEventListener("install",()=>self.skipWaiting()); self.addEventListener("activate",event=>event.waitUntil(self.registration.unregister()));'); return; }
    const result = await fetch(upstream + request.url);
    const headers = Object.fromEntries(result.headers); delete headers['content-encoding']; delete headers['content-length']; delete headers['transfer-encoding'];
    response.writeHead(result.status, headers); response.end(Buffer.from(await result.arrayBuffer()));
  } catch (error) { if (!response.headersSent) response.writeHead(502); response.end(String(error)); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const booking = page => page.evaluate(() => structuredClone(window.state.booking));
const nativeCounts = page => page.evaluate(() => ({ requests: window.__reloadQA.requests.length, watches: window.__reloadQA.watches.length }));
const frame = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };
const gate = () => ({ controller: deferred(), directory: deferred(), controllerRequested: deferred(), directoryRequested: deferred() });

async function prepare(extra = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce', serviceWorkers: 'block', permissions: ['geolocation'] });
  await context.addInitScript(seed => {
    if (!localStorage.getItem('location-reload-fixture-seeded')) {
      localStorage.setItem('hoanAnalyticsConsent', 'no');
      localStorage.setItem('hoanMakeupDraft', JSON.stringify({ booking: seed }));
      localStorage.setItem('location-reload-fixture-seeded', '1');
    }
    window.maplibregl = { supported: () => false };
    const qa = window.__reloadQA = { requests: [], watches: [], cleared: [], clicks: [], storageEvents: [] };
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
      getCurrentPosition(success, error, options) { qa.requests.push({ success, error, options }); },
      watchPosition(success, error, options) { const id = qa.watches.length; qa.watches.push({ success, error, options }); return id; },
      clearWatch(id) { qa.cleared.push(id); }
    } });
    document.addEventListener('click', event => { if (event.target.closest('[data-location-detect]')) qa.clicks.push({ trusted: event.isTrusted }); }, true);
    window.addEventListener('storage', event => qa.storageEvents.push({ key: event.key, url: event.url }));
  }, { ...oldDraft, ...extra });
  const fixture = { context, page: null, currentGate: gate() };
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === base) {
      const current = fixture.currentGate;
      if (url.pathname === '/booking-location.js') { current.controllerRequested.resolve(); await current.controller.promise; }
      if (url.pathname === '/data/vietnam-administrative-latest.json') { current.directoryRequested.resolve(); await current.directory.promise; }
      return route.continue().catch(() => {});
    }
    if (url.hostname === 'tile.openstreetmap.org') return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#eef0e9"/></svg>' });
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return route.continue();
    external.push(url.href); return route.abort();
  });
  fixture.page = await context.newPage(); fixture.page.setDefaultTimeout(15000);
  fixture.page.on('pageerror', error => errors.push(error.message));
  fixture.close = async () => { fixture.currentGate.controller.resolve(); fixture.currentGate.directory.resolve(); await context.close(); };
  return fixture;
}

function assertCleared(value, label) {
  for (const field of ['locationCoordinates', 'locationDeviceCoordinates', 'locationRegion', 'locationAutofill', 'locationAddressDetails']) assert.equal(value[field], null, label + ': ' + field + ' is discarded');
  for (const field of ['locationCapturedAt', 'locationConfirmedAt', 'locationSource', 'detectedAddress', 'locationError', 'locationMessage']) assert.equal(value[field], '', label + ': ' + field + ' is empty');
  assert.equal(value.isDetectingLocation, false, label + ': an old native request never resumes');
  assert.ok(!value.locationStage || value.locationStage === 'idle', label + ': no previous stage is restored');
  assert.ok(!value.locationVerificationVersion, label + ': old verification is revoked');
  for (const field of ['serviceId', 'date', 'time', 'name', 'phone', 'email', 'locationNote']) assert.equal(value[field], oldDraft[field], label + ': customer ' + field + ' is retained');
}

async function assertEmptyUI(page, label) {
  assert.equal(await page.locator('.booking-location .location-map-marker, .booking-location .location-device-marker, .booking-location .location-accuracy-circle').count(), 0, label + ': no old destination, device marker or accuracy circle');
  assert.equal(await page.locator('[data-location-coordinate-summary]').isVisible(), false, label + ': old coordinates are hidden');
  assert.equal(await page.locator('[data-location-map]').isVisible(), false, label + ': old map link is hidden');
  assert.equal(await page.locator('.booking-location a[href*="21.18"], .booking-location a[href*="105.58"]').count(), 0, label + ': no old map or directions URL survives');
  assert.equal(await page.locator('[data-location-use-pin]').isDisabled(), true, label + ': no previous point can be confirmed');
  assert.equal(await page.locator('[data-location-progress]').isVisible(), false, label + ': no previous progress resumes');
  assert.equal(await page.locator('[data-location-spinner]').isVisible(), false, label + ': no previous spinner resumes');
  assert.equal(await page.locator('[data-location-status]').isVisible(), false, label + ': previous result is not presented as current');
  assert.deepEqual(await nativeCounts(page), { requests: 0, watches: 0 }, label + ': page load never requests native GPS');
}

async function inspectFreshDocument(fixture, navigation, manual = false) {
  const { page } = fixture, current = fixture.currentGate;
  await navigation();
  await current.controllerRequested.promise;
  await page.waitForFunction(() => Boolean(window.state?.booking));
  const early = await booking(page);
  assertCleared(early, 'Before the asynchronous controller import');
  assert.equal(early.address, manual ? manualAddress : '', 'Only customer-entered street details survive initial app boot');
  assert.equal(early.city, manual ? province.name : '', 'Only customer-entered province survives initial app boot');
  assert.equal(early.ward, manual ? ward.name : '', 'Only customer-entered ward survives initial app boot');
  assert.deepEqual(await nativeCounts(page), { requests: 0, watches: 0 });
  current.controller.resolve();
  await current.directoryRequested.promise;
  await page.locator('.booking-location').waitFor(); await frame(page);
  assertCleared(await booking(page), 'While the administrative directory is still pending');
  await assertEmptyUI(page, 'Pending directory');
  assert.equal(await page.locator('#booking-address').inputValue(), manual ? manualAddress : '');
  current.directory.resolve();
  await page.locator('#booking-city:not([disabled])').waitFor();
  await page.locator('[data-location-map-canvas].leaflet-container').waitFor(); await frame(page);
  assertCleared(await booking(page), 'After the location controller is ready');
  await assertEmptyUI(page, 'Ready after a fresh document');
  assert.equal(await page.locator('[data-location-detect]').isDisabled(), false);
  assert.equal(await page.locator('[data-location-detect]').getAttribute('aria-busy'), 'false');
  assert.equal(await page.locator('[data-location-address-hint]').isVisible(), false, 'Old address precision hints are removed');
}

async function freshGPSAndBackgroundSync(fixture) {
  const { page, context } = fixture;
  await page.locator('[data-location-detect]').click();
  await page.waitForFunction(() => window.__reloadQA.requests.length === 1);
  assert.deepEqual(await page.evaluate(() => window.__reloadQA.clicks), [{ trusted: true }], 'One physical click starts the new device request');
  const captured = await page.evaluate(point => {
    const timestamp = Date.now();
    window.__reloadQA.requests[0].success({ coords: { latitude: point.lat, longitude: point.lon, accuracy: point.accuracy }, timestamp });
    return new Date(timestamp).toISOString();
  }, freshPoint);
  await page.waitForFunction(() => !window.state.booking.isDetectingLocation && window.state.booking.locationCoordinates?.mode === 'gps');
  const measured = await booking(page);
  assert.deepEqual(measured.locationCoordinates, freshPoint, 'One click after reload returns the fresh synthetic point');
  assert.deepEqual(measured.locationDeviceCoordinates, freshPoint);
  assert.equal(measured.locationCapturedAt, captured);
  assert.notEqual(measured.locationCapturedAt, recordedAt);
  assert.ok(measured.locationConfirmedAt, 'The fresh reliable GPS result is accepted without a second click');
  assert.equal(measured.address, freshAddress);
  assert.equal(await page.locator('[data-location-use-pin]').isVisible(), false, 'The redundant confirmation button is hidden');
  await page.waitForFunction(() => Boolean(window.state.booking.locationConfirmedAt) && !window.state.booking.isDetectingLocation);
  const confirmed = await booking(page);
  await page.evaluate(() => { window.__liveReloadBooking = window.state.booking; window.dispatchEvent(new HashChangeEvent('hashchange')); });
  await frame(page);
  assert.deepEqual(await booking(page), confirmed, 'A same-page hash rerender preserves the newly confirmed point');
  const peer = await context.newPage(); await peer.goto(base + '/__fixture_peer');
  const events = await page.evaluate(() => window.__reloadQA.storageEvents.length);
  await peer.evaluate(() => localStorage.setItem('hoanDepositSyncTrigger', 'reload-fixture-' + Date.now()));
  await page.waitForFunction(before => window.__reloadQA.storageEvents.length > before, events); await frame(page);
  assert.equal(await page.evaluate(() => window.__liveReloadBooking === window.state.booking), true, 'A genuine peer storage event retains the active booking object');
  assert.deepEqual(await booking(page), confirmed, 'Peer synchronization preserves new in-memory coordinates and confirmation');
  assert.deepEqual(await nativeCounts(page), { requests: 1, watches: 0 }, 'Only the physical click accesses native GPS');
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('hoanMakeupDraft')).booking);
  assert.deepEqual(persisted.locationCoordinates, freshPoint, 'The second reload receives a genuinely persisted fresh point');
  assert.equal(persisted.locationConfirmedAt, confirmed.locationConfirmedAt);
  await peer.close();
}

async function assertBookedHistoryUnchanged(fixture) {
  const { page } = fixture;
  await page.evaluate(() => localStorage.setItem('hoanAdminToken', 'reload-fixture-admin'));
  await page.goto(base + '/?location-reload=admin#/admin/appointments');
  await page.waitForFunction(code => Boolean(window.HoanAdminLocations) && Boolean(window.state?.bookingDetails?.[code]), appointment.code);
  assert.deepEqual(await page.evaluate(code => structuredClone(window.state.bookingDetails[code]), appointment.code), bookedDetails, 'Reloading an unsubmitted draft leaves booked server coordinates and timestamps intact');
  await page.locator(`[data-admin-open-location="${appointment.code}"]`).click();
  const panel = page.locator(`.modal [data-admin-location-panel="${appointment.code}"]`);
  await panel.locator('.leaflet-container').waitFor();
  assert.match(await panel.locator('.admin-location-facts').innerText(), /GPS thiết bị ban đầu/);
  assert.match(await panel.locator('.admin-location-facts').innerText(), /21\.180000, 105\.580000/);
  const directions = new URL(await panel.locator('.admin-location-actions a').first().getAttribute('href'));
  assert.equal(directions.searchParams.get('destination'), oldPoint.lat + ',' + oldPoint.lon, 'Admin directions still target the existing booked destination');
  assert.deepEqual(snapshot.bookingDetails[appointment.code], bookedDetails);
}

try {
  const fixture = await prepare();
  try {
    await inspectFreshDocument(fixture, () => fixture.page.goto(base + '/?location-reload=1#/booking/location', { waitUntil: 'domcontentloaded' }));
    await freshGPSAndBackgroundSync(fixture);
    fixture.currentGate = gate();
    await inspectFreshDocument(fixture, () => fixture.page.reload({ waitUntil: 'domcontentloaded' }));
    await assertBookedHistoryUnchanged(fixture);
  } finally { await fixture.close(); }
  const manual = await prepare({ address: manualAddress, locationAutofill: { city: 'Tỉnh gợi ý cũ', ward: 'Xã gợi ý cũ', address: autoAddress } });
  try {
    await inspectFreshDocument(manual, () => manual.page.goto(base + '/?location-reload=manual#/booking/location', { waitUntil: 'domcontentloaded' }), true);
    assert.equal(await manual.page.locator('[data-location-address-preview]').isVisible(), true, 'Customer-entered address remains visible after old location metadata clears');
  } finally { await manual.close(); }
  assert.deepEqual(writes, [], 'No real API writes occur during document reload regressions');
  assert.deepEqual(errors, [], 'No uncaught browser errors occur during document reload regressions');
  console.log('PASS initial app boot and a second full reload discard confirmed pins, original GPS, provenance, timestamps, stale progress and derived addresses before async location loading; customer-entered fields survive; one physical click gets a fresh synthetic point; hash rerender and real peer storage preserve it; existing booked locations and admin directions remain intact. Local fixtures only; no real GPS or API writes.');
} catch (error) {
  console.error('Location reload diagnostic:', JSON.stringify({ errors, writes, lookups, blockedExternal: external })); throw error;
} finally { await browser.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
