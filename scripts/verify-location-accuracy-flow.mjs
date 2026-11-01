import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

const upstream = process.env.TEST_BASE_URL || 'http://localhost:5173';
const directory = JSON.parse(await readFile(new URL('../public/data/vietnam-administrative-latest.json', import.meta.url), 'utf8'));
const province = directory.find(item => item.code === 1), ward = province.wards.find(item => item.code === 9604);
const initialGPS = { lat: 21.1, lon: 105.5, accuracy: 12, mode: 'gps' };
const coarseGPS = { lat: 21.115123456, lon: 105.501987654, accuracy: 5000, mode: 'gps' };
const autoAddress = '12 Đường kiểm thử tự động', manualAddress = 'Cổng do khách tự nhập';
const houseParts = { houseNumber: '12', road: 'Đường kiểm thử tự động', hamlet: 'Thôn Kiểm Thử', neighbourhood: '', residential: '', suburb: '', building: '', postcode: '', ward: ward.name, province: province.name, country: 'Việt Nam' };
const houseAddress = autoAddress + ', ' + houseParts.hamlet;
const streetAddress = houseParts.road + ', ' + houseParts.hamlet;
const houseProfile = { address: houseAddress, addressParts: houseParts, addressPrecision: 'house', missingParts: [], featureDistanceMeters: 2, addressDistance: 2, city: province.name, ward: ward.name, countryCode: 'vn' };
const streetProfile = { ...houseProfile, address: streetAddress, addressParts: { ...houseParts, houseNumber: '' }, addressPrecision: 'street', missingParts: ['houseNumber'] };
const distantHouseProfile = { ...houseProfile, featureDistanceMeters: 45, addressDistance: 45 };
const service = { id: 'party', name: 'Dịch vụ kiểm thử', price: 650000, duration: 90, enabled: true };
const writes = [], lookups = [], errors = [], remote = [];
const snapshot = { services: [service], appointments: [], customers: [], scheduleSlots: [], bookingDetails: {}, notifications: [], requests: [], brand: {}, settings: { deposit: 200000, travelFee: 50000, bookingWindow: 60, scheduleOpen: true } };
const boundary = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { code: ward.code }, bbox: [105.35, 20.95, 105.65, 21.25], geometry: { type: 'Polygon', coordinates: [[[105.35, 20.95], [105.65, 20.95], [105.65, 21.25], [105.35, 21.25], [105.35, 20.95]]] } }] };
const proxy = createServer(async (request, response) => {
  const json = (data, status = 200) => { response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); response.end(JSON.stringify(data)); };
  try {
    const path = new URL(request.url, 'http://localhost').pathname;
    if (path === '/data/administrative-boundaries/index.json') return json({ provinces: [{ code: province.code, bbox: [105, 20, 106, 22] }] });
    if (path === '/data/administrative-boundaries/wards-01.json.gz') return json(boundary);
    if (path.startsWith('/api/')) {
      if (path === '/api/data') {
        if (request.method === 'GET') return json(snapshot);
        const chunks = []; for await (const chunk of request) chunks.push(chunk);
        const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (payload.action === 'reverseGeocode') { lookups.push(payload); return json({ address: autoAddress, addressDistance: 2, city: province.name, ward: ward.name, countryCode: 'vn' }); }
        writes.push(payload); return json({ error: 'Real writes are blocked by the location accuracy fixture.' }, 400);
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
  } catch (error) { response.writeHead(502); response.end(String(error)); }
});
await new Promise(resolve => proxy.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${proxy.address().port}`;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const seed = extra => ({ serviceId: 'party', date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), time: '10:00', city: '', ward: '', address: '', locationNote: '', ...extra });
const booking = page => page.evaluate(() => structuredClone(window.state.booking));
const settled = page => page.waitForFunction(() => !window.state.booking.isDetectingLocation);
const frame = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

async function prepare(extra = {}, addressProfile = null) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce', serviceWorkers: 'block', permissions: ['geolocation'] });
  await context.addInitScript(booking => {
    localStorage.setItem('hoanAnalyticsConsent', 'no');
    localStorage.setItem('hoanMakeupDraft', JSON.stringify({ booking }));
    window.maplibregl = { supported: () => false };
    const state = window.__geoQA = { requests: [], watches: [], cleared: [], maps: [] };
    let leaflet;
    Object.defineProperty(window, 'L', { configurable: true, get() { return leaflet; }, set(value) {
      const create = value.map; value.map = function (...args) { const map = create.apply(this, args); state.maps.push(map); return map; }; leaflet = value;
    } });
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
      getCurrentPosition(success, error, options) { state.requests.push({ success, error, options }); },
      watchPosition(success, error, options) { const id = state.watches.length; state.watches.push({ success, error, options }); return id; },
      clearWatch(id) { state.cleared.push(id); },
    } });
  }, seed(extra));
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === base) return route.continue();
    if (url.hostname === 'tile.openstreetmap.org') return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#eef0e9"/></svg>' });
    // Vite's development websocket remains local; every external request is blocked.
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return route.continue();
    remote.push(url.href); return route.abort();
  });
  if (addressProfile) await context.route('**/api/data', route => {
    const request = route.request();
    if (request.method() !== 'POST') return route.fallback();
    const payload = request.postDataJSON();
    if (payload.action !== 'reverseGeocode') return route.fallback();
    lookups.push(payload); return route.fulfill({ json: addressProfile });
  });
  const page = await context.newPage(); page.setDefaultTimeout(15000); page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date() });
  await page.goto(base + '/?location-accuracy-flow=1#/booking/location');
  await page.locator('#booking-city:not([disabled])').waitFor();
  await page.locator('[data-location-map-canvas].leaflet-container').waitFor();
  await frame(page);
  return { page, context };
}

async function emit(page, kind, index, point = null, error = null) {
  return page.evaluate(({ kind, index, point, error }) => {
    const callback = window.__geoQA[kind][index];
    if (!callback) throw new Error(`Missing ${kind} callback ${index}`);
    if (error) { callback.error(error); return null; }
    const timestamp = Date.now();
    callback.success({ coords: { latitude: point.lat, longitude: point.lon, accuracy: point.accuracy }, timestamp });
    return timestamp;
  }, { kind, index, point, error });
}

async function beginGPS(page) {
  const index = await page.evaluate(() => window.__geoQA.requests.length);
  await page.locator('[data-location-detect]').click();
  await page.waitForFunction(index => window.__geoQA.requests.length > index, index);
  const value = await booking(page);
  assert.equal(value.locationCoordinates, null, 'A new GPS request immediately clears the previous service point');
  assert.equal(value.locationConfirmedAt, '', 'The previous confirmation is cleared immediately');
  assert.equal(await page.locator('[data-location-use-pin]').isDisabled(), true, 'The previous map point cannot be confirmed during the new request');
  return index;
}

async function selectPendingPin(page) {
  await page.locator('[data-location-map-canvas]').click({ position: { x: 280, y: 235 } });
  await page.waitForFunction(() => window.state.booking.locationCoordinates?.mode === 'pin' && !window.state.booking.locationConfirmedAt && !window.state.booking.isDetectingLocation);
  const value = await booking(page);
  assert.equal(value.locationRegion, null, 'A new map selection immediately revokes the old administrative confirmation');
  return value;
}

async function choosePin(page) {
  await selectPendingPin(page);
  await page.locator('[data-location-use-pin]:not([disabled])').waitFor();
  await page.locator('[data-location-use-pin]').click();
  await page.waitForFunction(() => Boolean(window.state.booking.locationConfirmedAt) && !window.state.booking.isDetectingLocation);
  const value = await booking(page);
  assert.equal(value.locationCoordinates.mode, 'pin');
  assert.equal(value.locationCoordinates.accuracy, null);
  return value;
}

async function confirmSelectedPin(page) {
  await page.locator('[data-location-use-pin]:not([disabled])').click();
  await page.waitForFunction(() => Boolean(window.state.booking.locationConfirmedAt) && !window.state.booking.isDetectingLocation);
  return booking(page);
}

async function acceptedGPS(page) {
  await page.waitForFunction(() => Boolean(window.state.booking.locationConfirmedAt) && !window.state.booking.isDetectingLocation);
  const value = await booking(page);
  assert.equal(value.locationCoordinates.mode, 'gps', 'Automatic acceptance keeps device provenance');
  assert.equal(await page.locator('[data-location-use-pin]').isVisible(), false, 'Accepted GPS needs no extra confirmation control');
  return value;
}

async function detectFixture(page, point = initialGPS) {
  const watchIndex = await page.evaluate(() => window.__geoQA.watches.length);
  const index = await beginGPS(page);
  await emit(page, 'requests', index, point);
  if (point.accuracy > 30) {
    await page.waitForFunction(index => window.__geoQA.watches.length > index, watchIndex);
    await page.clock.fastForward(18001);
  }
  await settled(page);
  return booking(page);
}

async function assertAddressPreview(page, address, label) {
  assert.equal(await page.locator('[data-location-address-preview]').isVisible(), true, label + ': full address preview is visible');
  assert.equal(await page.locator('[data-location-full-address]').innerText(), [address, ward.name, province.name].join(', '), label + ': preview includes street details, ward and province');
  assert.equal(await page.locator('#booking-address').inputValue(), address, label + ': the detected street details remain editable');
}

async function fullAddressChecks() {
  const house = await prepare({}, houseProfile);
  try {
    const detected = await detectFixture(house.page);
    assert.equal(detected.address, houseAddress, 'A nearby house fixture preserves its house number, road and hamlet');
    assert.equal(detected.locationAddressDetails?.precision, 'house');
    assert.equal(detected.locationAddressDetails?.parts.houseNumber, houseParts.houseNumber);
    assert.equal(detected.locationAddressDetails?.parts.road, houseParts.road);
    assert.equal(detected.locationAddressDetails?.parts.hamlet, houseParts.hamlet);
    assert.deepEqual(detected.locationAddressDetails?.missingParts, []);
    assert.equal(detected.locationAddressDetails?.featureDistanceMeters, 2);
    await assertAddressPreview(house.page, houseAddress, 'Nearby house');
    assert.equal(await house.page.locator('[data-location-address-hint]').isVisible(), true, 'A detected house asks the customer to verify house details');
    const confirmed = await acceptedGPS(house.page);
    const manualHouse = '14 Ngách kiểm thử, ' + houseParts.hamlet;
    await house.page.locator('#booking-address').fill(manualHouse);
    await assertAddressPreview(house.page, manualHouse, 'Manual correction');
    assert.equal(await house.page.locator('[data-location-address-hint]').isVisible(), false, 'Automatic guidance clears as soon as the customer replaces the detected house');
    const apartment = 'Căn 201, tầng 2, cổng bên phải';
    await house.page.locator('#booking-location-note').fill(apartment);
    const edited = await booking(house.page);
    assert.deepEqual(edited.locationCoordinates, confirmed.locationCoordinates, 'Editing a house address preserves the confirmed map point');
    assert.deepEqual(edited.locationDeviceCoordinates, confirmed.locationDeviceCoordinates);
    assert.equal(edited.locationCapturedAt, confirmed.locationCapturedAt);
    assert.equal(edited.locationConfirmedAt, confirmed.locationConfirmedAt);
    assert.equal(edited.locationNote, apartment, 'Apartment and floor details stay in the saved location note');
    assert.equal(await house.page.evaluate(() => JSON.parse(localStorage.getItem('hoanMakeupDraft')).booking.locationNote), apartment, 'The apartment and floor note is persisted in the booking draft');
    assert.equal(edited.address, manualHouse);
    await assertAddressPreview(house.page, manualHouse, 'Apartment note edit');
  } finally { await house.context.close(); }

  for (const [label, profile] of [['Missing house', streetProfile], ['Distant house feature', distantHouseProfile]]) {
    const fixture = await prepare({}, profile);
    try {
      const detected = await detectFixture(fixture.page);
      assert.equal(detected.address, streetAddress, label + ': a house number is never invented from street or distant feature data');
      assert.equal(detected.locationAddressDetails?.precision, 'street');
      assert.equal(detected.locationAddressDetails?.parts.houseNumber, '', label + ': stripped house metadata cannot be reused as an exact address');
      assert.ok(detected.locationAddressDetails?.missingParts.includes('houseNumber'), label + ': missing house metadata is explicit');
      await assertAddressPreview(fixture.page, streetAddress, label);
      const hint = fixture.page.locator('[data-location-address-hint]');
      assert.equal(await hint.isVisible(), true, label + ': missing house guidance is visible');
      assert.match(await hint.innerText(), /số nhà/, label + ': guidance asks for the missing house number');
    } finally { await fixture.context.close(); }
  }

  const imprecise = await prepare({}, houseProfile);
  try {
    await detectFixture(imprecise.page);
    await acceptedGPS(imprecise.page);
    const retry = await beginGPS(imprecise.page);
    const cleared = await booking(imprecise.page);
    assert.equal(cleared.address, '', 'Changing the location source clears the old automatically detected house');
    assert.equal(cleared.locationAddressDetails, null, 'Old house metadata cannot survive a new source request');
    assert.equal(await imprecise.page.locator('[data-location-address-preview]').isVisible(), false, 'The old house preview clears before another position arrives');
    const watchIndex = await imprecise.page.evaluate(() => window.__geoQA.watches.length);
    const broadGPS = { ...initialGPS, accuracy: 80 };
    await emit(imprecise.page, 'requests', retry, broadGPS);
    await imprecise.page.waitForFunction(index => window.__geoQA.watches.length > index, watchIndex);
    await imprecise.page.clock.fastForward(18001); await settled(imprecise.page);
    const broad = await booking(imprecise.page);
    assert.equal(broad.address, streetAddress, 'An 80m device fix withholds a nearby provider house number');
    assert.deepEqual(broad.locationCoordinates, broadGPS);
    assert.equal(broad.locationAddressDetails?.precision, 'street');
    assert.equal(broad.locationAddressDetails?.parts.houseNumber, '');
    assert.ok(broad.locationAddressDetails?.missingParts.includes('houseNumber'));
    await assertAddressPreview(imprecise.page, streetAddress, '80m device fix');
    assert.equal(await imprecise.page.locator('[data-location-address-hint]').isVisible(), true);
    const selected = await selectPendingPin(imprecise.page);
    assert.equal(selected.address, '', 'Selecting a service pin clears the previous automatic street details immediately');
    assert.equal(selected.locationAddressDetails, null);
    const chosen = await confirmSelectedPin(imprecise.page);
    assert.equal(chosen.locationCoordinates.mode, 'pin');
    assert.equal(chosen.locationCoordinates.accuracy, null);
    assert.deepEqual(chosen.locationDeviceCoordinates, broadGPS, 'A manually selected house preserves the original 80m GPS measurement');
    assert.equal(chosen.locationCapturedAt, broad.locationCapturedAt);
    assert.equal(chosen.address, houseAddress, 'An explicitly selected pin may use the same nearby house feature');
    assert.equal(chosen.locationAddressDetails?.precision, 'house');
    assert.equal(chosen.locationAddressDetails?.parts.houseNumber, houseParts.houseNumber);
    await assertAddressPreview(imprecise.page, houseAddress, 'Confirmed house pin');
  } finally { await imprecise.context.close(); }
}

try {
  const { page, context } = await prepare();
  try {
    const first = await beginGPS(page);
    const measuredAt = await emit(page, 'requests', first, initialGPS); await settled(page);
    const automatic = await booking(page);
    assert.deepEqual(automatic.locationCoordinates, initialGPS);
    assert.deepEqual(automatic.locationDeviceCoordinates, initialGPS);
    assert.equal(automatic.locationCapturedAt, new Date(measuredAt).toISOString(), 'The saved GPS time is the actual fixture measurement timestamp');
    assert.equal(automatic.address, autoAddress);
    assert.equal(automatic.city, province.name); assert.equal(automatic.ward, ward.name);
    assert.ok(automatic.locationConfirmedAt, 'Reliable GPS is accepted automatically after address resolution');
    assert.equal(await page.locator('[data-location-use-pin]').isVisible(), false, 'Reliable GPS has no redundant confirmation button');
    await page.locator('[data-action="ct-next"]').click();
    await page.waitForURL(/#\/booking\/info$/);
    assert.deepEqual(await booking(page), automatic, 'Proceeding without another confirmation preserves the accepted GPS');
    await page.evaluate(() => { location.hash = '#/booking/location'; });
    await page.locator('[data-location-map-canvas].leaflet-container').waitFor();
    const confirmed = await acceptedGPS(page);
    assert.deepEqual(confirmed.locationCoordinates, initialGPS, 'Automatic acceptance preserves GPS source and accuracy');
    assert.equal(confirmed.locationCapturedAt, automatic.locationCapturedAt);
    assert.equal(confirmed.locationVerificationVersion, 1);

    const retry = await beginGPS(page);
    const pending = await booking(page);
    assert.equal(pending.city, ''); assert.equal(pending.ward, ''); assert.equal(pending.address, '', 'Stale automatically filled address is removed');
    assert.equal(pending.locationDeviceCoordinates, null);
    const beforeCoarse = lookups.length;
    await emit(page, 'requests', retry, coarseGPS);
    await page.waitForFunction(() => window.state.booking.isDetectingLocation && window.state.booking.locationCoordinates?.accuracy === 5000 && window.__geoQA.watches.length > 0);
    assert.equal((await booking(page)).locationStage, 'refining');
    assert.equal(await page.locator('[data-location-progress]').isVisible(), true);
    assert.match(await page.locator('[data-location-stage-detail]').innerText(), /5000 m/);
    assert.equal(await page.locator('.location-map-marker').count(), 0);
    assert.equal(await page.locator('[data-location-use-pin]').isDisabled(), true);
    await page.locator('[data-action="ct-next"]').click();
    assert.match(page.url(), /#\/booking\/location$/);
    assert.equal((await booking(page)).isDetectingLocation, true, 'Next cannot silently stop an active sample');
    await page.clock.fastForward(18001); await settled(page);
    const coarse = await booking(page);
    assert.deepEqual(coarse.locationCoordinates, coarseGPS);
    assert.equal(coarse.locationConfirmedAt, ''); assert.equal(coarse.locationRegion, null);
    assert.equal(lookups.length, beforeCoarse, 'Coarse GPS does not request a fabricated street address');
    assert.match(await page.locator('[data-location-status]').innerText(), /sai số khoảng 5 km/);

    // Typing an address is independent from an automatically filled address.
    await page.locator('#booking-city').fill(province.name);
    await page.locator('[data-location-choice="city"]').filter({ hasText: province.name }).first().click();
    await page.locator('#booking-ward').fill(ward.name);
    await page.locator('[data-location-choice="ward"]').filter({ hasText: ward.name }).first().click();
    await page.locator('#booking-address').fill(manualAddress);
    const manualRetry = await beginGPS(page);
    assert.equal((await booking(page)).address, manualAddress);
    await emit(page, 'requests', manualRetry, coarseGPS);
    await page.waitForFunction(() => window.__geoQA.watches.length === 2);
    await page.clock.fastForward(18001); await settled(page);
    assert.equal((await booking(page)).address, manualAddress, 'Retrying coarse GPS preserves a manually typed address');
    assert.equal(await page.locator('#booking-address').inputValue(), manualAddress);
    await page.locator('[data-action="ct-next"]').click();
    assert.match(page.url(), /#\/booking\/location$/);
    assert.match(await page.locator('[data-location-form-error]').innerText(), /chưa được xác nhận/);

    // A manual correction cancels the watch; late hardware callbacks cannot
    // overwrite a confirmed destination or its original device measurement.
    const correctionRequest = await beginGPS(page);
    await emit(page, 'requests', correctionRequest, coarseGPS);
    await page.waitForFunction(() => window.__geoQA.watches.length === 3);
    const pendingCorrection = await selectPendingPin(page);
    assert.deepEqual(pendingCorrection.locationDeviceCoordinates, coarseGPS);
    assert.ok(await page.evaluate(() => window.__geoQA.cleared.includes(2)), 'Selecting a point immediately cancels the outstanding GPS watch');
    await emit(page, 'watches', 2, { ...initialGPS, lat: 21.1002, accuracy: 5 }); await frame(page);
    assert.deepEqual((await booking(page)).locationCoordinates, pendingCorrection.locationCoordinates, 'A late watch reply cannot overwrite an unconfirmed manual correction');
    assert.equal((await booking(page)).locationConfirmedAt, '');
    const corrected = await confirmSelectedPin(page);
    assert.deepEqual(corrected.locationCoordinates, pendingCorrection.locationCoordinates);
    assert.deepEqual(corrected.locationDeviceCoordinates, coarseGPS);
    const correctedTimestamp = corrected.locationCapturedAt;
    assert.ok(await page.evaluate(() => window.__geoQA.cleared.includes(2)));
    await emit(page, 'watches', 2, { ...initialGPS, lat: 21.1002, accuracy: 5 }); await frame(page);
    assert.deepEqual((await booking(page)).locationCoordinates, corrected.locationCoordinates);
    assert.equal((await booking(page)).locationCapturedAt, correctedTimestamp);

    const marker = page.locator('.booking-location .location-map-marker');
    await marker.focus(); await marker.press('ArrowRight');
    const moved = await booking(page);
    assert.notEqual(moved.locationCoordinates.lon, corrected.locationCoordinates.lon, 'Keyboard adjustment immediately changes the booking point');
    assert.equal(moved.locationConfirmedAt, '', 'Adjusting a previously confirmed service pin immediately revokes its confirmation');
    assert.equal(moved.locationRegion, null);
    await page.locator('[data-action="ct-next"]').click();
    assert.match(page.url(), /#\/booking\/location$/, 'Next cannot submit the previous confirmed point after a manual move');
    const confirmedMove = await confirmSelectedPin(page);
    assert.deepEqual(confirmedMove.locationCoordinates, moved.locationCoordinates);

    const cancelledRequest = await beginGPS(page);
    await page.locator('[data-location-cancel]').click();
    assert.equal((await booking(page)).locationCoordinates, null);
    const afterCancel = await choosePin(page);
    await emit(page, 'requests', cancelledRequest, { ...initialGPS, lat: 21.1003 }); await frame(page);
    assert.deepEqual((await booking(page)).locationCoordinates, afterCancel.locationCoordinates, 'A late getCurrentPosition reply cannot overwrite the post-cancel pin');
    const deniedRequest = await beginGPS(page);
    await emit(page, 'requests', deniedRequest, null, { code: 1, message: 'Fixture permission denied' }); await settled(page);
    assert.equal((await booking(page)).locationCoordinates, null, 'Permission denial cannot restore the previous service pin');
    assert.equal((await booking(page)).locationConfirmedAt, '');
    assert.equal(await page.locator('[data-location-use-pin]').isDisabled(), true);
    assert.match(await page.locator('[data-location-status]').innerText(), /Quyền định vị đang bị chặn/);

    const beforeSamplingDeny = await choosePin(page);
    const watchIndex = await page.evaluate(() => window.__geoQA.watches.length);
    const samplingDeniedRequest = await beginGPS(page);
    await emit(page, 'requests', samplingDeniedRequest, coarseGPS);
    await page.waitForFunction(index => window.__geoQA.watches.length > index, watchIndex);
    await emit(page, 'watches', watchIndex, null, { code: 1, message: 'Fixture watch permission revoked' }); await settled(page);
    const afterSamplingDeny = await booking(page);
    assert.notDeepEqual(afterSamplingDeny.locationCoordinates, beforeSamplingDeny.locationCoordinates, 'A permission failure during sampling cannot restore the previous destination');
    assert.equal(afterSamplingDeny.locationConfirmedAt, ''); assert.equal(afterSamplingDeny.locationRegion, null);
    assert.equal(await page.locator('[data-location-use-pin]').isDisabled(), true);
    await emit(page, 'watches', watchIndex, initialGPS); await frame(page);
    assert.deepEqual((await booking(page)).locationCoordinates, afterSamplingDeny.locationCoordinates, 'A late sample after permission revocation is ignored');
  } finally { await context.close(); }

  await fullAddressChecks();

  const legacyPoint = { ...coarseGPS, mode: 'pin', accuracy: null };
  const saved = { city: province.name, provinceCode: province.code, ward: ward.name, wardCode: ward.code, address: autoAddress, locationSource: 'administrative-boundaries', locationAutofill: { city: province.name, ward: ward.name, address: autoAddress }, locationCoordinates: legacyPoint, locationDeviceCoordinates: coarseGPS, locationCapturedAt: new Date().toISOString(), locationConfirmedAt: new Date().toISOString(), locationRegion: { provinceCode: province.code, wardCode: ward.code } };
  const legacy = await prepare(saved);
  try {
    const restored = await booking(legacy.page);
    assert.equal(restored.locationCoordinates, null, 'An old coarse GPS point relabelled as a pin is discarded');
    assert.equal(restored.locationDeviceCoordinates, null);
    assert.equal(restored.city, ''); assert.equal(restored.ward, ''); assert.equal(restored.address, '');
    assert.equal(restored.locationConfirmedAt, '');
  } finally { await legacy.context.close(); }
  const verified = await prepare({ ...saved, locationVerificationVersion: 1 });
  try { assert.equal((await booking(verified.page)).locationCoordinates, null, 'A fresh document discards even an explicitly verified manual pin; the customer must choose a current point'); }
  finally { await verified.context.close(); }
  assert.deepEqual(writes, [], 'No real API mutations occur during GPS accuracy regressions');
  assert.deepEqual(errors, [], 'No uncaught browser errors during retries, cancellation or restore');
  console.log('PASS controller accurate GPS confirmation/provenance; stale autofill and point clearing; coarse confirmation rejection; nearby house/road/hamlet preview; missing-house and feature-distance guidance; 80m GPS withholds house until manual pin selection; live manual address/room edits preserve confirmed point; late callback isolation; cancellation/get/watch denial; fresh documents discard legacy and verified pins. Local fixtures only; no real GPS accuracy claim.');
} catch (error) {
  console.error('Location accuracy diagnostic:', JSON.stringify({ errors, writes, lookups, blockedExternal: remote })); throw error;
} finally { await browser.close(); proxy.closeAllConnections(); await new Promise(resolve => proxy.close(resolve)); }
