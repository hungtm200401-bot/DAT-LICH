import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

// Full application regression with native geolocation callbacks controlled by the
// fixture. It never asks the operating system for the user's actual location.
const upstream = process.env.TEST_BASE_URL || 'http://localhost:5173';
const expectedBuild = JSON.parse(await readFile(new URL('../public/app-version.json', import.meta.url), 'utf8')).build;
const directory = JSON.parse(await readFile(new URL('../public/data/vietnam-administrative-latest.json', import.meta.url), 'utf8'));
const province = directory.find(item => item.code === 1), ward = province.wards.find(item => item.code === 9604);
const point = { lat: 21.1, lon: 105.5, accuracy: 12, mode: 'gps' };
const roughPoint = { ...point, accuracy: 90 };
const address = '12 Đường kiểm thử';
const writes = [], errors = [], external = [];
const snapshot = { services: [{ id: 'party', name: 'Trang điểm kiểm thử', price: 650000, duration: 90, enabled: true }], appointments: [], customers: [], scheduleSlots: [], bookingDetails: {}, notifications: [], requests: [], brand: {}, settings: { deposit: 200000, travelFee: 50000, bookingWindow: 60, scheduleOpen: true } };
const boundary = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { code: ward.code }, bbox: [105.35, 20.95, 105.65, 21.25], geometry: { type: 'Polygon', coordinates: [[[105.35, 20.95], [105.65, 20.95], [105.65, 21.25], [105.35, 21.25], [105.35, 20.95]]] } }] };
const profile = { address, addressDistance: 2, city: province.name, ward: ward.name, countryCode: 'vn' };
const server = createServer(async (request, response) => {
  const json = data => { response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); response.end(JSON.stringify(data)); };
  try {
    const path = new URL(request.url, 'http://localhost').pathname;
    if (path === '/__fixture_peer') { response.writeHead(200, { 'Content-Type': 'text/html' }); response.end('<!doctype html><title>Read-only location fixture peer</title>'); return; }
    if (path === '/data/administrative-boundaries/index.json') return json({ provinces: [{ code: province.code, bbox: [105, 20, 106, 22] }] });
    if (path === '/data/administrative-boundaries/wards-01.json.gz') return json(boundary);
    if (path.startsWith('/api/')) {
      if (path === '/api/data' && request.method === 'GET') return json(snapshot);
      if (path === '/api/site-content') return json({ pages: {}, drafts: {} });
      if (path === '/api/cms-resources') return json({ shared: { value: { albums: [], testimonials: [] }, revision: '' }, media: { value: [], revision: '' }, templates: { value: [], revision: '' } });
      if (request.method !== 'GET') { const chunks = []; for await (const chunk of request) chunks.push(chunk); writes.push({ path, method: request.method, body: Buffer.concat(chunks).toString('utf8') }); }
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
const frame = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const state = page => page.evaluate(() => structuredClone(window.state.booking));
const nativeCounts = page => page.evaluate(() => ({ requests: window.__loadingQA.requests.length, watches: window.__loadingQA.watches.length }));

async function prepare() {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce', serviceWorkers: 'block', permissions: ['geolocation'] });
  await context.addInitScript(() => {
    if (!localStorage.getItem('hoanMakeupDraft')) {
      localStorage.setItem('hoanAnalyticsConsent', 'no');
      localStorage.setItem('hoanMakeupDraft', JSON.stringify({ booking: { serviceId: 'party', date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), time: '10:00', city: '', ward: '', address: '', locationNote: '' } }));
    }
    window.maplibregl = { supported: () => false };
    const qa = window.__loadingQA = { requests: [], watches: [], cleared: [], clicks: [], storageEvents: [] };
    const ui = () => {
      const button = document.querySelector('[data-location-detect]'), progress = document.querySelector('[data-location-progress]'), spinner = document.querySelector('[data-location-spinner]');
      return { busy: window.state?.booking.isDetectingLocation, disabled: button?.disabled, ariaBusy: button?.getAttribute('aria-busy'), progress: Boolean(progress && !progress.hidden && progress.getClientRects().length), spinner: Boolean(spinner && !spinner.hidden && spinner.getClientRects().length) };
    };
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
      getCurrentPosition(success, error, options) { qa.requests.push({ success, error, options, ui: ui() }); },
      watchPosition(success, error, options) { const id = qa.watches.length; qa.watches.push({ success, error, options, ui: ui() }); return id; },
      clearWatch(id) { qa.cleared.push(id); }
    } });
    window.addEventListener('storage', event => qa.storageEvents.push(event.key));
  });
  let releaseAddress;
  const addressGate = new Promise(resolve => { releaseAddress = resolve; });
  let addressReceived;
  const addressRequested = new Promise(resolve => { addressReceived = resolve; });
  const lookups = [];
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin === base) {
      if (url.pathname === '/api/data' && request.method() === 'POST') {
        const payload = request.postDataJSON();
        if (payload.action === 'reverseGeocode') { lookups.push(payload); addressReceived(); await addressGate; await route.fulfill({ json: profile }).catch(() => {}); return; }
      }
      return route.continue();
    }
    if (url.hostname === 'tile.openstreetmap.org') return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#eef0e9"/></svg>' });
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return route.continue();
    external.push(url.href); return route.abort();
  });
  const page = await context.newPage(); page.setDefaultTimeout(15000); page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date() });
  await page.goto(base + '/?location-loading-flow=1#/booking/location');
  await page.locator('#booking-city:not([disabled])').waitFor();
  await page.locator('[data-location-map-canvas].leaflet-container').waitFor();
  await frame(page);
  await page.evaluate(() => document.addEventListener('click', event => {
    if (event.target.closest('[data-location-detect]')) window.__loadingQA.clicks.push({ trusted: event.isTrusted, busy: window.state.booking.isDetectingLocation, disabled: document.querySelector('[data-location-detect]').disabled, ariaBusy: document.querySelector('[data-location-detect]').getAttribute('aria-busy'), progress: Boolean(document.querySelector('[data-location-progress]')?.getClientRects().length), spinner: Boolean(document.querySelector('[data-location-spinner]')?.getClientRects().length) });
  }));
  return { page, context, lookups, releaseAddress, addressRequested, async close() { releaseAddress(); await context.close(); } };
}

async function emit(page, kind, index, value = point, code = null) {
  await page.evaluate(({ kind, index, value, code }) => {
    const callback = window.__loadingQA[kind][index];
    if (!callback) throw new Error(`Missing ${kind} callback ${index}`);
    if (code !== null) callback.error({ code, message: 'Controlled fixture error' });
    else callback.success({ coords: { latitude: value.lat, longitude: value.lon, accuracy: value.accuracy }, timestamp: Date.now() });
  }, { kind, index, value, code });
}

async function assertBusy(page, expectedStage, label) {
  assert.equal((await state(page)).isDetectingLocation, true, label + ': request remains busy');
  assert.equal(await page.locator('[data-location-detect]').isDisabled(), true, label + ': button stays disabled');
  assert.equal(await page.locator('[data-location-detect]').getAttribute('aria-busy'), 'true', label + ': button exposes aria-busy');
  assert.equal(await page.locator('[data-location-progress]').isVisible(), true, label + ': progress is visible');
  assert.equal(await page.locator('[data-location-spinner]').isVisible(), true, label + ': spinner is visible');
  assert.equal(await page.locator('[data-location-use-pin]').isDisabled(), true, label + ': confirmation waits for the active operation');
  assert.ok((await page.locator('[data-location-progress] [data-location-stage]').innerText()).trim(), label + ': stage text is visible');
  if (expectedStage) assert.equal((await state(page)).locationStage, expectedStage, label + ': stage matches the active work');
}

async function begin(page, strict = true) {
  const counts = await nativeCounts(page);
  await page.locator('[data-location-detect]').click();
  await page.waitForFunction(before => window.__loadingQA.requests.length > before, counts.requests);
  if (strict) {
    const click = await page.evaluate(() => window.__loadingQA.clicks.find(item => item.trusted));
    assert.deepEqual(click, { trusted: true, busy: true, disabled: true, ariaBusy: 'true', progress: true, spinner: true }, 'The first physical click synchronously paints the busy controls');
    const nativeStart = await page.evaluate(index => window.__loadingQA.requests[index].ui, counts.requests);
    assert.deepEqual(nativeStart, { busy: true, disabled: true, ariaBusy: 'true', progress: true, spinner: true }, 'Loading is visible before requesting the native device location');
    await assertBusy(page, 'locating', 'Awaiting native permission/fix');
  }
  return counts.requests;
}

async function repeatClicks(page) {
  const counts = await nativeCounts(page);
  await page.evaluate(() => {
    for (let index = 0; index < 10; index++) document.querySelector('[data-location-detect]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  assert.deepEqual(await nativeCounts(page), counts, 'Ten rapid synthetic clicks cannot start another sampler');
}

async function rerender(page, stage) {
  const counts = await nativeCounts(page);
  await page.evaluate(() => window.dispatchEvent(new HashChangeEvent('hashchange')));
  await frame(page);
  await assertBusy(page, stage, 'Same-route background rerender');
  assert.deepEqual(await nativeCounts(page), counts, 'Background rerender cannot start another sampler');
}

async function synchronizePeer(fixture, expectedStage, strict = true) {
  // This is a genuine same-origin storage event from another tab. A synthetic
  // event would omit the object replacement that previously lost the request.
  const { page, context } = fixture;
  await page.evaluate(() => { window.__activeLoadingBooking = window.state.booking; });
  const peer = await context.newPage();
  await peer.goto(base + '/__fixture_peer');
  const beforeEvents = await page.evaluate(() => window.__loadingQA.storageEvents.length);
  await peer.evaluate(() => localStorage.setItem('hoanDepositSyncTrigger', 'fixture-' + Date.now()));
  await page.waitForFunction(before => window.__loadingQA.storageEvents.length > before, beforeEvents);
  await frame(page);
  const diagnostic = await page.evaluate(() => ({ sameBooking: window.__activeLoadingBooking === window.state.booking, busy: window.state.booking.isDetectingLocation, counts: { requests: window.__loadingQA.requests.length, watches: window.__loadingQA.watches.length }, stage: window.state.booking.locationStage }));
  if (!strict) return diagnostic;
  assert.equal(diagnostic.sameBooking, true, 'A background tab sync preserves the active booking object');
  await assertBusy(page, expectedStage, 'Sibling-tab background synchronization');
  await repeatClicks(page);
  await peer.close();
}

async function loadingLifecycle() {
  const fixture = await prepare(), { page } = fixture;
  try {
    // Freeze this admin tab's view of the initially empty customer draft. A
    // later ordinary admin preference save must preserve the latest draft even
    // when that tab has missed browser storage notifications.
    const adminPeer = await fixture.context.newPage();
    await adminPeer.addInitScript(() => window.addEventListener('storage', event => event.stopImmediatePropagation(), true));
    await adminPeer.goto(base + '/?location-loading-admin-peer=1#/admin/schedule');
    await adminPeer.locator('[data-action="week-next"]').waitFor();
    const index = await begin(page);
    await repeatClicks(page);
    await rerender(page, 'locating');
    await synchronizePeer(fixture, 'locating');
    // Keep waiting past permission prompt rendering without fast-forwarding the
    // deadline: no provider answer must mean visible progress, never idle UI.
    await page.clock.runFor(250);
    await assertBusy(page, 'locating', 'Waiting for permission or a native fix');
    await emit(page, 'requests', index, null, 2);
    await page.waitForFunction(() => window.__loadingQA.requests.length === 2 && window.__loadingQA.watches.length > 0);
    await assertBusy(page, 'retrying', 'Automatic fallback after a native device error');
    await repeatClicks(page);
    await rerender(page, 'retrying');
    await synchronizePeer(fixture, 'retrying');
    await emit(page, 'requests', index + 1, roughPoint);
    await page.waitForFunction(() => window.state.booking.locationCoordinates?.accuracy === 90);
    await assertBusy(page, 'refining', 'Improving a rough native fix');
    await repeatClicks(page);
    await rerender(page, 'refining');
    await synchronizePeer(fixture, 'refining');
    const after = await nativeCounts(page);
    assert.ok(after.watches > 0, 'A rough fix keeps a native watch while refining');
    await emit(page, 'watches', after.watches - 1, point);
    await page.waitForFunction(() => window.state.booking.locationStage === 'address');
    await fixture.addressRequested;
    await assertBusy(page, 'address', 'Delayed address lookup');
    assert.equal(fixture.lookups.length, 1, 'One address lookup follows one sampler');
    await repeatClicks(page);
    await rerender(page, 'address');
    await synchronizePeer(fixture, 'address');
    fixture.releaseAddress();
    await page.waitForFunction(() => !window.state.booking.isDetectingLocation);
    const complete = await state(page);
    assert.equal(complete.locationStage, 'resolved');
    assert.equal(complete.address, address);
    assert.deepEqual(complete.locationCoordinates, point);
    assert.equal(await page.locator('[data-location-detect]').isDisabled(), false);
    assert.equal(await page.locator('[data-location-detect]').getAttribute('aria-busy'), 'false');
    assert.equal(await page.locator('[data-location-progress]').isVisible(), false);
    assert.equal(await page.locator('[data-location-spinner]').isVisible(), false);
    assert.equal(await page.locator('[data-location-status]').isVisible(), true, 'The result is explained in the page');

    await page.waitForFunction(() => Boolean(window.state.booking.locationConfirmedAt) && !window.state.booking.isDetectingLocation);
    assert.equal(await page.locator('[data-location-use-pin]').isVisible(), false, 'Reliable resolved GPS is accepted without another confirmation');
    await page.locator('#booking-address').fill('14 Ngõ khách tự nhập');
    await page.locator('#booking-location-note').fill('Tầng 2, cổng bên phải');
    const confirmed = await state(page);
    await page.evaluate(() => { window.__activeLoadingBooking = window.state.booking; });
    const peer = await fixture.context.newPage(); await peer.goto(base + '/__fixture_peer');
    const events = await page.evaluate(() => window.__loadingQA.storageEvents.length);
    await peer.evaluate(() => localStorage.setItem('hoanDepositSyncTrigger', 'confirmed-fixture-' + Date.now()));
    await page.waitForFunction(before => window.__loadingQA.storageEvents.length > before, events); await frame(page);
    assert.equal(await page.evaluate(() => window.__activeLoadingBooking === window.state.booking), true, 'Sibling synchronization retains the confirmed booking object');
    assert.deepEqual(await state(page), confirmed, 'Sibling synchronization preserves the confirmed coordinates and customer address edits');
    assert.equal(await page.locator('#booking-address').inputValue(), confirmed.address);
    assert.equal(await page.locator('#booking-location-note').inputValue(), confirmed.locationNote);
    await peer.close();

    assert.equal(await adminPeer.evaluate(() => window.state.booking.locationCoordinates || null), null, 'Admin fixture retains its stale initial customer draft');
    const beforeAdminSave = await page.evaluate(() => window.__loadingQA.storageEvents.length);
    await adminPeer.locator('[data-action="week-next"]').click();
    await page.waitForFunction(before => window.__loadingQA.storageEvents.length > before, beforeAdminSave); await frame(page);
    const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('hoanMakeupDraft')).booking);
    const savedConfirmed = { ...confirmed, isDetectingLocation: false }; delete savedConfirmed.locationStage;
    assert.deepEqual(persisted, savedConfirmed, 'A stale admin tab preference save preserves the latest customer booking in storage');
    assert.deepEqual(await state(page), confirmed, 'An admin preference change preserves the active confirmed customer booking');
    await adminPeer.close();
  } finally { await fixture.close(); }
}

async function cancelledCallbacks() {
  const fixture = await prepare(), { page } = fixture;
  try {
    const first = await begin(page);
    await page.locator('[data-location-cancel]').click();
    const cancelled = await state(page);
    assert.equal(cancelled.isDetectingLocation, false);
    assert.equal(cancelled.locationStage, 'cancelled');
    assert.equal(await page.locator('[data-location-progress]').isVisible(), false);
    const second = await begin(page);
    await emit(page, 'requests', first, { ...point, lat: 21.2 });
    await frame(page);
    await assertBusy(page, 'locating', 'Late reply from a cancelled request');
    assert.equal((await state(page)).locationCoordinates, null, 'Cancelled native callbacks cannot overwrite a newer request');
    await emit(page, 'requests', second, point);
    await page.waitForFunction(() => window.state.booking.locationStage === 'address');
    await page.locator('[data-location-cancel]').click();
    const cancelledAddress = await state(page);
    fixture.releaseAddress(); await frame(page);
    assert.deepEqual(await state(page), cancelledAddress, 'An aborted address reply cannot change the cancelled booking');
  } finally { await fixture.close(); }
}

async function errorFeedback() {
  for (const [label, code] of [['permission denied', 1], ['device timeout', 3]]) {
    const fixture = await prepare(), { page } = fixture;
    try {
      const index = await begin(page);
      if (code === 1) await emit(page, 'requests', index, null, 1);
      else {
        // Exercise the wrapper's own deadline even when native callbacks never
        // arrive; neither the first fix nor a fallback gets a fake success.
        await page.clock.fastForward(12001);
        await page.waitForFunction(() => window.__loadingQA.requests.length === 2 && window.__loadingQA.watches.length > 0);
        await assertBusy(page, 'retrying', 'Device deadline begins automatic fallback');
        await page.clock.fastForward(18001);
      }
      await page.waitForFunction(() => !window.state.booking.isDetectingLocation);
      const failed = await state(page);
      assert.equal(failed.locationStage, 'failed', label + ': failure stage is explicit');
      assert.equal(await page.locator('[data-location-detect]').isDisabled(), false, label + ': retry is available');
      assert.equal(await page.locator('[data-location-detect]').getAttribute('aria-busy'), 'false');
      assert.equal(await page.locator('[data-location-progress]').isVisible(), false);
      const feedback = page.locator('[data-location-status]');
      assert.equal(await feedback.isVisible(), true, label + ': actionable in-page feedback remains visible');
      assert.match(await feedback.innerText(), /cho phép|cài đặt|bật định vị|chọn địa chỉ|kiểm tra quyền|chọn đúng điểm/i, label + ': feedback explains a next action');
      const counts = await nativeCounts(page);
      await emit(page, 'requests', index, { ...point, lat: 21.2 }); await frame(page);
      assert.deepEqual(await nativeCounts(page), counts, label + ': failure never automatically clicks retry');
      assert.deepEqual(await state(page), failed, label + ': late native success cannot restore a finished request');
    } finally { await fixture.close(); }
  }
}

try {
  if (process.argv.includes('--audit-legacy-reinject')) {
    const fixture = await prepare();
    try {
      const { page } = fixture;
      await page.evaluate(build => {
        window.__originalAppState = window.state;
        delete window.__hoanAppStarted; delete window.__hoanAppBuild;
        sessionStorage.removeItem('hoan-build-reloaded-' + build);
      }, expectedBuild);
      await page.addScriptTag({ url: base + '/app.js?legacy-repeat-initialize=1' });
      assert.equal(await page.evaluate(() => window.__hoanAppBuild), 'legacy', 'Updated script detects an already running legacy application');
      assert.equal(await page.evaluate(() => window.state === window.__originalAppState), true, 'Legacy detection preserves the current state and handlers');
      const before = await nativeCounts(page);
      await begin(page, false); await frame(page);
      assert.equal((await nativeCounts(page)).requests - before.requests, 1, 'Legacy detection does not add another location handler');
      await page.locator('[data-location-cancel]').click();
      let navigationRequests = 0;
      const observeNavigation = request => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) navigationRequests++; };
      page.on('request', observeNavigation);
      const reloaded = page.waitForURL(url => url.searchParams.get('_hoan_update') === expectedBuild);
      await page.addScriptTag({ url: base + '/client-bootstrap.js?legacy-recovery=1' });
      await reloaded;
      await page.locator('#booking-city:not([disabled])').waitFor();
      await page.waitForFunction(build => window.__hoanAppStarted === true && window.__hoanAppBuild === build, expectedBuild);
      assert.equal(navigationRequests, 1, 'Legacy recovery refreshes the document once');
      const freshBefore = await nativeCounts(page);
      await begin(page, false); await assertBusy(page, 'locating', 'Refreshed application'); await repeatClicks(page);
      assert.equal((await nativeCounts(page)).requests - freshBefore.requests, 1, 'The refreshed application starts one sampler per physical click');
      await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await frame(page);
      assert.equal(navigationRequests, 1, 'The current version does not enter a reload loop on focus');
      assert.equal(await page.evaluate(build => sessionStorage.getItem('hoan-build-reloaded-' + build), expectedBuild), '1');
      page.off('request', observeNavigation);
      console.log('Legacy reinjection diagnostic:', JSON.stringify({ navigationRequests, runningBuild: await page.evaluate(() => window.__hoanAppBuild), freshNativeStarts: await nativeCounts(page) }));
    } finally { await fixture.close(); }
  } else if (process.argv.includes('--audit-reinject')) {
    const fixture = await prepare();
    try {
      const { page } = fixture;
      await page.evaluate(() => { window.__originalAppState = window.state; });
      await page.addScriptTag({ url: base + '/app.js?repeat-initialize=1' });
      await page.locator('#booking-city:not([disabled])').waitFor();
      await page.locator('[data-location-detect]:not([disabled])').waitFor();
      await frame(page);
      const before = await nativeCounts(page);
      await begin(page, false); await frame(page);
      const after = await nativeCounts(page);
      const diagnostic = await page.evaluate(() => ({ sameAppState: window.state === window.__originalAppState, busy: window.state.booking.isDetectingLocation, nativeStarts: window.__loadingQA.requests.map(request => request.ui) }));
      console.log('Script reinjection diagnostic:', JSON.stringify({ before, after, ...diagnostic }));
      assert.equal(after.requests - before.requests, 1, 'Reinjecting the app script must not duplicate native location requests from one physical click');
      assert.equal(diagnostic.sameAppState, true, 'Reinjecting the app script must retain the existing application state');
    } finally { await fixture.close(); }
  } else if (process.argv.includes('--audit-storage')) {
    const fixture = await prepare();
    try {
      const index = await begin(fixture.page, false);
      const before = await nativeCounts(fixture.page);
      const afterSync = await synchronizePeer(fixture, null, false);
      await fixture.page.evaluate(() => document.querySelector('[data-location-detect]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
      const afterClick = await nativeCounts(fixture.page);
      console.log('Storage synchronization diagnostic:', JSON.stringify({ before, afterSync, afterClick, originalRequest: index }));
      assert.equal(afterSync.sameBooking, true, 'Storage synchronization must preserve the active booking object');
      assert.equal(afterSync.busy, true, 'Storage synchronization must not silently unlock location detection');
      assert.deepEqual(afterClick, before, 'A background sync must not allow a second sampler');
    } finally { await fixture.close(); }
  } else {
    await loadingLifecycle();
    await cancelledCallbacks();
    await errorFeedback();
  }
  assert.deepEqual(writes, [], 'No real API writes during full-app loading regressions');
  assert.deepEqual(errors, [], 'No uncaught application errors during loading regressions');
  if (process.argv.includes('--audit-legacy-reinject')) console.log('PASS legacy script detection retains the original handler; version recovery reloads once; the fresh app starts one sampler and does not reload on focus. Controlled local fixtures only.');
  else if (process.argv.includes('--audit-reinject')) console.log('PASS script reinjection preserves application state and starts one native sampler from one physical click. Controlled local fixtures only.');
  else if (process.argv.includes('--audit-storage')) console.log('PASS sibling-tab storage synchronization preserves the active booking and prevents duplicate native samplers. Controlled local fixtures only.');
  else console.log('PASS first physical click has synchronous loading/spinner; rapid clicks share one sampler; permission/fix/refinement/address stages stay busy; same-route and cross-tab refresh preserve the active request; cancellation and late callbacks are isolated; denial/timeout retain actionable in-page feedback. Controlled local fixtures only.');
} catch (error) {
  console.error('Location loading diagnostic:', JSON.stringify({ errors, writes, blockedExternal: external })); throw error;
} finally { await browser.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
