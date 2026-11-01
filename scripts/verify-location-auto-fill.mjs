import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

// Native location callbacks, boundaries and address results are synthetic local
// fixtures. This regression never requests the device's actual GPS or writes API data.
const upstream = process.env.TEST_BASE_URL || 'http://localhost:5173';
const directory = JSON.parse(await readFile(new URL('../public/data/vietnam-administrative-latest.json', import.meta.url), 'utf8'));
const province = directory.find(item => item.code === 1), ward = province.wards.find(item => item.code === 9604);
const point = { lat: 21.1, lon: 105.5, accuracy: 12, mode: 'gps' };
const coarsePoint = { ...point, accuracy: 5000 };
const address = '18 Đường kiểm thử tự điền';
const writes = [], lookups = [], errors = [];
const snapshot = {
  services: [{ id: 'party', name: 'Trang điểm kiểm thử', price: 650000, duration: 90, enabled: true }],
  appointments: [], customers: [], scheduleSlots: [], bookingDetails: {}, notifications: [], requests: [], brand: {},
  settings: { deposit: 200000, travelFee: 50000, bookingWindow: 60, scheduleOpen: true }
};
const boundary = { type: 'FeatureCollection', features: [{
  type: 'Feature', properties: { code: ward.code }, bbox: [105.35, 20.95, 105.65, 21.25],
  geometry: { type: 'Polygon', coordinates: [[[105.35, 20.95], [105.65, 20.95], [105.65, 21.25], [105.35, 21.25], [105.35, 20.95]]] }
}] };
const profile = {
  address, addressDistance: 2, featureDistanceMeters: 2, city: province.name, ward: ward.name, countryCode: 'vn',
  addressPrecision: 'house', addressParts: { houseNumber: '18', road: 'Đường kiểm thử tự điền', ward: ward.name, province: province.name }, missingParts: []
};
const server = createServer(async (request, response) => {
  const json = (value, status = 200) => {
    response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify(value));
  };
  try {
    const path = new URL(request.url, 'http://localhost').pathname;
    if (path === '/data/vietnam-administrative-latest.json') return json(directory);
    if (path === '/data/administrative-boundaries/index.json') return json({ provinces: [{ code: province.code, bbox: [105, 20, 106, 22] }] });
    if (path === '/data/administrative-boundaries/wards-01.json.gz') return json(boundary);
    if (path.startsWith('/api/')) {
      if (path === '/api/data') {
        if (request.method === 'GET') return json(snapshot);
        const chunks = []; for await (const chunk of request) chunks.push(chunk);
        const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (payload.action === 'reverseGeocode') { lookups.push(payload); return json(profile); }
        writes.push(payload); return json({ error: 'Writes are blocked in this fixture.' }, 400);
      }
      if (path === '/api/site-content') return json({ pages: {}, drafts: {} });
      if (path === '/api/cms-resources') return json({ shared: { value: { albums: [], testimonials: [] }, revision: '' }, media: { value: [], revision: '' }, templates: { value: [], revision: '' } });
      if (request.method !== 'GET') writes.push({ path, method: request.method });
      return json({});
    }
    if (path === '/sw.js') {
      response.writeHead(200, { 'Content-Type': 'application/javascript' });
      response.end('self.addEventListener("install",()=>self.skipWaiting());self.addEventListener("activate",event=>event.waitUntil(self.registration.unregister()));'); return;
    }
    const result = await fetch(upstream + request.url);
    const headers = Object.fromEntries(result.headers);
    delete headers['content-encoding']; delete headers['content-length']; delete headers['transfer-encoding'];
    response.writeHead(result.status, headers); response.end(Buffer.from(await result.arrayBuffer()));
  } catch (error) { if (!response.headersSent) response.writeHead(502); response.end(String(error)); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const booking = page => page.evaluate(() => structuredClone(window.state.booking));
const frame = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

async function prepare({ permissionPrompt = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce', serviceWorkers: 'block', permissions: ['geolocation'] });
  await context.addInitScript(permissionPrompt => {
    if (!localStorage.getItem('auto-fill-fixture-seeded')) {
      localStorage.setItem('hoanAnalyticsConsent', 'no');
      localStorage.setItem('hoanMakeupDraft', JSON.stringify({ booking: {
        serviceId: 'party', date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), time: '10:00',
        locationType: 'client', city: '', ward: '', address: '', locationNote: 'Tầng 2, cổng bên phải'
      } }));
      localStorage.setItem('auto-fill-fixture-seeded', '1');
    }
    window.maplibregl = { supported: () => false };
    const qa = window.__autoFillQA = { requests: [], watches: [], cleared: [], clicks: [], maps: [] };
    if (permissionPrompt) {
      qa.permission = new EventTarget(); qa.permission.state = 'prompt';
      const permissions = navigator.permissions;
      Object.defineProperty(navigator, 'permissions', { configurable: true, value: {
        query(descriptor) { return descriptor.name === 'geolocation' ? Promise.resolve(qa.permission) : permissions.query(descriptor); }
      } });
    }
    let leaflet;
    Object.defineProperty(window, 'L', { configurable: true, get() { return leaflet; }, set(value) {
      const create = value.map;
      value.map = function (...args) { const map = create.apply(this, args); qa.maps.push(map); return map; };
      leaflet = value;
    } });
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
      getCurrentPosition(success, error, options) { qa.requests.push({ success, error, options }); },
      watchPosition(success, error, options) { const id = qa.watches.length; qa.watches.push({ success, error, options }); return id; },
      clearWatch(id) { qa.cleared.push(id); }
    } });
    document.addEventListener('click', event => {
      if (event.target.closest('[data-location-detect]')) qa.clicks.push({ trusted: event.isTrusted });
    }, true);
  }, permissionPrompt);
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === base || url.hostname === 'localhost' || url.hostname === '127.0.0.1') return route.continue();
    if (url.hostname === 'tile.openstreetmap.org') return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#eef0e9"/></svg>' });
    return route.abort();
  });
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date() });
  await page.goto(base + '/?location-auto-fill=1#/booking/location');
  await page.locator('#booking-city:not([disabled])').waitFor();
  await page.locator('[data-location-map-canvas].leaflet-container').waitFor(); await frame(page);
  return { context, page };
}

async function emit(page, kind, index, value = point, error = null) {
  return page.evaluate(({ kind, index, value, error }) => {
    const callback = window.__autoFillQA[kind][index];
    if (!callback) throw new Error(`Missing ${kind} callback ${index}`);
    if (error) { callback.error(error); return null; }
    const timestamp = Date.now();
    callback.success({ coords: { latitude: value.lat, longitude: value.lon, accuracy: value.accuracy }, timestamp });
    return new Date(timestamp).toISOString();
  }, { kind, index, value, error });
}

async function begin(page) {
  const index = await page.evaluate(() => window.__autoFillQA.requests.length);
  await page.locator('[data-location-detect]').click();
  await page.waitForFunction(index => window.__autoFillQA.requests.length === index + 1, index);
  assert.equal(await page.locator('[data-location-detect]').isDisabled(), true, 'One physical click shows a locked loading button');
  assert.equal(await page.locator('[data-location-spinner]').isVisible(), true, 'The native request has visible progress');
  return index;
}

async function assertAutomaticFields(page, capturedAt, capture = false) {
  await page.waitForFunction(() => Boolean(window.state.booking.locationConfirmedAt) && !window.state.booking.isDetectingLocation);
  const value = await booking(page);
  assert.deepEqual(value.locationCoordinates, point, 'Automatic confirmation preserves the actual device source and accuracy');
  assert.deepEqual(value.locationDeviceCoordinates, point, 'Original GPS is retained for the admin record');
  assert.equal(value.locationCapturedAt, capturedAt);
  assert.ok(Number.isFinite(Date.parse(value.locationConfirmedAt)));
  assert.equal(value.locationSource, 'administrative-boundaries');
  assert.deepEqual(value.locationRegion, { provinceCode: province.code, wardCode: ward.code });
  assert.deepEqual(value.locationAutofill, { city: province.name, ward: ward.name, address });
  assert.equal(await page.locator('#booking-city').inputValue(), province.name, 'Province is filled without another click');
  assert.equal(await page.locator('#booking-ward').inputValue(), ward.name, 'Ward is filled without another click');
  assert.equal(await page.locator('#booking-address').inputValue(), address, 'Street and house are filled without another click');
  assert.equal(await page.locator('#booking-location-note').inputValue(), 'Tầng 2, cổng bên phải', 'Manual building notes survive automatic filling');
  assert.equal(await page.locator('[data-location-use-pin]').isVisible(), false, 'Automatically accepted GPS does not show a redundant confirmation action');
  if (capture) {
    await mkdir('outputs/location-auto-fill', { recursive: true });
    await page.screenshot({ path: 'outputs/location-auto-fill/desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 }); await frame(page);
    assert.equal(await page.locator('[data-location-use-pin]').isVisible(), false, 'Mobile also hides the redundant confirmation action');
    await page.screenshot({ path: 'outputs/location-auto-fill/mobile.png', fullPage: true });
  }
  await page.locator('[data-action="ct-next"]').click();
  await page.waitForURL(/#\/booking\/info$/);
  assert.deepEqual((await booking(page)).locationCoordinates, point, 'Next needs no separate Use Location interaction');
}

try {
  const precise = await prepare();
  try {
    const { page } = precise;
    const index = await begin(page);
    const capturedAt = await emit(page, 'requests', index);
    await assertAutomaticFields(page, capturedAt, true);
    assert.deepEqual(await page.evaluate(() => window.__autoFillQA.clicks), [{ trusted: true }], 'One physical click completes GPS and address acquisition');
    await page.evaluate(() => { location.hash = '#/booking/location'; });
    await page.locator('[data-location-map-canvas].leaflet-container').waitFor();
    await page.reload();
    await page.locator('#booking-city:not([disabled])').waitFor();
    await page.locator('[data-location-map-canvas].leaflet-container').waitFor();
    const cleared = await booking(page);
    assert.equal(cleared.locationCoordinates, null); assert.equal(cleared.locationDeviceCoordinates, null);
    assert.equal(cleared.locationConfirmedAt, '');
    for (const field of ['city', 'ward', 'address']) assert.equal(cleared[field], '', 'Reload removes auto-filled ' + field);
    assert.equal(await page.locator('.booking-location .location-map-marker').count(), 0);
    assert.equal(await page.evaluate(() => window.__autoFillQA.requests.length), 0, 'Reload never starts GPS without a click');
  } finally { await precise.context.close(); }

  const delayedPermission = await prepare({ permissionPrompt: true });
  try {
    const { page } = delayedPermission;
    const index = await begin(page);
    await page.clock.fastForward(35000);
    assert.equal(await page.evaluate(() => window.__autoFillQA.requests.length), 1, 'Waiting for permission cannot time out or start overlapping native requests');
    assert.equal((await booking(page)).isDetectingLocation, true, 'Loading remains active while the customer considers browser permission');
    await page.evaluate(() => {
      const permission = window.__autoFillQA.permission;
      permission.state = 'granted'; permission.dispatchEvent(new Event('change'));
      permission.onchange?.(new Event('change'));
    });
    const capturedAt = await emit(page, 'requests', index);
    await assertAutomaticFields(page, capturedAt);
    assert.equal(await page.evaluate(() => window.__autoFillQA.clicks.length), 1, 'Accepting a delayed browser prompt needs no extra click');
  } finally { await delayedPermission.context.close(); }

  const recovery = await prepare();
  try {
    const { page } = recovery;
    const first = await begin(page);
    await emit(page, 'requests', first, point, { code: 2, message: 'Initial provider unavailable' });
    await page.waitForFunction(() => window.__autoFillQA.requests.length === 2 && window.__autoFillQA.watches.length === 1);
    const capturedAt = await emit(page, 'requests', first + 1);
    await assertAutomaticFields(page, capturedAt);
    assert.equal(await page.evaluate(() => window.__autoFillQA.clicks.length), 1, 'Provider recovery needs no second click');
    assert.deepEqual(await page.evaluate(() => window.__autoFillQA.cleared), [0], 'Recovery cleans up its concurrent watch');

    await page.evaluate(() => { location.hash = '#/booking/location'; });
    await page.locator('[data-location-map-canvas].leaflet-container').waitFor();
    await page.evaluate(() => {
      const map = window.__autoFillQA.maps.at(-1);
      map.fire('click', { latlng: window.L.latLng(21.101, 105.501) });
    });
    const pending = await booking(page);
    assert.equal(pending.locationCoordinates.mode, 'pin');
    assert.equal(pending.locationConfirmedAt, '', 'A customer-adjusted point remains pending until explicit confirmation');
    assert.equal(await page.locator('[data-location-use-pin]').isVisible(), true, 'A manual correction exposes its confirmation action');
    await page.locator('[data-location-use-pin]:not([disabled])').click();
    await page.waitForFunction(() => Boolean(window.state.booking.locationConfirmedAt) && !window.state.booking.isDetectingLocation);
    assert.equal((await booking(page)).locationCoordinates.mode, 'pin', 'Explicit manual selection retains pin provenance');
  } finally { await recovery.context.close(); }

  const lateInitial = await prepare();
  try {
    const { page } = lateInitial;
    const index = await begin(page);
    await page.clock.fastForward(12001);
    await page.waitForFunction(() => window.__autoFillQA.requests.length === 2 && window.__autoFillQA.watches.length === 1);
    const capturedAt = await emit(page, 'requests', index);
    await assertAutomaticFields(page, capturedAt);
    assert.equal(await page.evaluate(() => window.__autoFillQA.clicks.length), 1, 'A valid initial fix received during recovery needs no second click');
    assert.deepEqual(await page.evaluate(() => window.__autoFillQA.cleared), [0]);
  } finally { await lateInitial.context.close(); }

  const coarse = await prepare();
  try {
    const { page } = coarse;
    const index = await begin(page);
    await emit(page, 'requests', index, coarsePoint);
    await page.waitForFunction(() => window.__autoFillQA.watches.length === 1);
    await page.clock.fastForward(18001);
    await page.waitForFunction(() => !window.state.booking.isDetectingLocation);
    const approximate = await booking(page);
    assert.deepEqual(approximate.locationDeviceCoordinates, coarsePoint);
    assert.equal(approximate.locationConfirmedAt, '', 'Coarse GPS never auto-confirms a service destination');
    assert.equal(approximate.locationRegion, null);
    for (const field of ['city', 'ward', 'address']) assert.equal(approximate[field], '', 'Coarse GPS cannot fabricate ' + field);
    assert.equal(await page.locator('[data-location-use-pin]').isDisabled(), true, 'Coarse GPS needs a deliberate map selection');
  } finally { await coarse.context.close(); }
  assert.deepEqual(writes, [], 'No real API writes');
  assert.deepEqual(errors, [], 'No uncaught browser errors');
  assert.ok(lookups.length >= 3, 'Fixtures exercise precise GPS, recovery and manual pin address lookup');
  console.log('PASS one-click precise GPS, delayed permission, late native fix and automatic provider recovery fill address fields and allow Next without a second confirmation; original GPS/timestamps retained; manual pins still require confirmation; coarse GPS is never auto-confirmed; reload removes old location. Local fixtures only; no real GPS or API writes.');
} catch (error) {
  console.error('Automatic location diagnostic:', JSON.stringify({ errors, writes, lookups })); throw error;
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
