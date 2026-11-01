import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

const base = process.env.TEST_BASE_URL || 'http://localhost:5173';
const fixturePoint = { lat: 21.100123456789, lon: 105.500987654321, accuracy: null, mode: 'pin' };
const styleURL = 'https://tiles.openfreemap.org/styles/liberty';
const fixtureStyle = {
  version: 8, name: 'QA vector fixture', sources: { openmaptiles: { type: 'vector', minzoom: 0, maxzoom: 14, tiles: ['qatile://fixture/{z}/{x}/{y}.pbf'], attribution: 'OpenFreeMap | OpenMapTiles | © OpenStreetMap contributors' } },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#f5f0dd' } },
    { id: 'land', type: 'fill', source: 'openmaptiles', 'source-layer': 'land', paint: { 'fill-color': '#b7cfa8' } },
  ],
};
const pointTile = (point, z = 14) => {
  const count = 2 ** z, latitude = point.lat * Math.PI / 180;
  return `${z}/${Math.floor((point.lon + 180) / 360 * count)}/${Math.floor((1 - Math.asinh(Math.tan(latitude)) / Math.PI) / 2 * count)}`;
};
const selectedTile = pointTile(fixturePoint);

// A small, valid vector tile with an actual polygon. Background-only fixtures
// never exercise vector loading or rendering and cannot verify readiness.
const varint = value => { const bytes = []; do { const byte = value % 128; value = Math.floor(value / 128); bytes.push(byte | (value ? 128 : 0)); } while (value); return bytes; };
const field = (number, wire, value) => [...varint(number * 8 + wire), ...(wire === 2 ? [...varint(value.length), ...value] : varint(value))];
const geometry = [9, 0, 0, 26, 8192, 0, 0, 8192, 8191, 0, 15].flatMap(varint);
const feature = [...field(1, 0, 1), ...field(3, 0, 3), ...field(4, 2, geometry)];
const layer = [...field(1, 2, [...Buffer.from('land')]), ...field(2, 2, feature), ...field(5, 0, 4096), ...field(15, 0, 2)];
const vectorTile = Buffer.from(field(3, 2, layer));
const html = '<!doctype html><html><head><meta charset="utf-8"><title>Vector map QA</title></head><body class="couture"></body></html>';
const markup = '<section class="location-map-panel" style="width:640px"><div class="location-map-heading"><h3>Vector map QA</h3><button class="location-map-expand" data-map-expand>Expand</button></div><div class="location-map-viewport"><div class="location-map-canvas" data-location-map-canvas style="height:360px"></div><div class="location-map-tools"><button data-map-recenter>Recenter</button></div><p class="location-map-loading" data-map-loading role="status"></p></div><p data-map-coordinates></p><p data-location-pin-status aria-live="polite"></p><button data-location-use-pin disabled>Use pin</button></section>';
const browser = await chromium.launch({ channel: 'msedge', headless: true });

async function prepare(context, fixture = null) {
  await context.route(`${base}/__vector-map-fixture`, route => route.fulfill({ contentType: 'text/html', body: html }));
  const page = await context.newPage();
  page.setDefaultTimeout(25000);
  await page.goto(`${base}/__vector-map-fixture`);
  await page.addStyleTag({ url: `${base}/location-experience.css` });
  await page.addStyleTag({ url: `${base}/vendor/maplibre/maplibre-gl.css` });
  await page.evaluate(async fixture => {
    const gl = await import('/vendor/maplibre/maplibre-gl.mjs');
    gl.setWorkerUrl('/vendor/maplibre/maplibre-gl-worker.mjs'); gl.setWorkerCount(1);
    const state = window.__vectorQA = { maps: [], removed: new Set(), confirmations: [], events: [], allEvents: [], errors: [] };
    class InstrumentedMap extends gl.Map {
      constructor(options) {
        super(fixture ? { ...options, style: fixture } : options); state.maps.push(this);
        this.on('remove', () => state.removed.add(this));
        this.on('style.load', () => state.allEvents.push({ type: 'style.load' }));
        this.on('sourcedata', event => {
          state.allEvents.push({ source: event.sourceId, type: event.sourceDataType, coord: event.coord, tileState: event.tile?.state });
          if (event.sourceId === 'openmaptiles' && event.coord?.canonical && event.tile?.state === 'loaded') {
            const { z, x, y } = event.coord.canonical; state.events.push({ map: state.maps.indexOf(this), tile: `${z}/${x}/${y}`, loaded: event.isSourceLoaded });
          }
        });
        this.on('error', event => state.errors.push(event.error?.message || 'Map error'));
      }
      setStyle(style, options) { return super.setStyle(fixture || style, options); }
    }
    window.maplibregl = { ...gl, Map: InstrumentedMap };
  }, fixture);
  return page;
}
async function mount(page, options = {}, point = fixturePoint) {
  await page.evaluate(async ({ markup, point, options }) => {
    const state = window.__vectorQA; state.cleanup?.();
    document.body.innerHTML = markup;
    const vectorModule = await import('/location-vector-map.js?vector-qa=1');
    const abort = state.abort = new AbortController();
    state.cleanup = await vectorModule.mountVectorLocationMap(document.querySelector('section'), point, selected => state.confirmations.push(selected), { ...options, signal: abort.signal });
  }, { markup, point, options });
}
const ready = async page => {
  try { await page.waitForFunction(() => !document.querySelector('[data-location-use-pin]').disabled); }
  catch (error) {
    console.error('Readiness diagnostic:', JSON.stringify({ state: await snapshot(page), detail: await page.evaluate(() => ({ events: window.__vectorQA.allEvents, resources: performance.getEntriesByType('resource').map(item => item.name), loaded: window.__vectorQA.maps.at(-1).loaded(), sourceMaxzoom: window.__vectorQA.maps.at(-1).getSource('openmaptiles')?.maxzoom })), ui: await page.locator('section').innerText() }));
    throw error;
  }
};
const snapshot = page => page.evaluate(() => {
  const state = window.__vectorQA, map = state.maps.at(-1), live = map && !state.removed.has(map);
  return { created: state.maps.length, live: state.maps.filter(item => !state.removed.has(item)).length, center: live ? { lat: map.getCenter().lat, lon: map.getCenter().lng } : null, zoom: live ? map.getZoom() : null, confirmations: state.confirmations, events: state.events, errors: state.errors };
});
const pixels = page => page.evaluate(() => new Promise(resolve => {
  const map = window.__vectorQA.maps.at(-1);
  map.once('render', () => {
    const canvas = map.getCanvas(), gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    const pixel = new Uint8Array(4); gl.readPixels(Math.floor(canvas.width / 4), Math.floor(canvas.height / 4), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    resolve({ pixel: [...pixel], width: canvas.width, height: canvas.height, rendered: map.queryRenderedFeatures().map(feature => ({ layer: feature.layer.id, type: feature.layer.type })) });
  });
  map.triggerRepaint();
}));

async function measurePanPerformance(page, context) {
  const baseline = await page.evaluate(async () => {
    const intervals = []; let previous;
    for (let i = 0; i < 11; i++) {
      const timestamp = await new Promise(resolve => requestAnimationFrame(resolve));
      if (previous !== undefined) intervals.push(timestamp - previous);
      previous = timestamp;
    }
    return { intervals, visible: document.visibilityState === 'visible' };
  });
  const quantile = (values, fraction) => [...values].sort((a, b) => a - b)[Math.ceil(values.length * fraction) - 1];
  const session = await context.newCDPSession(page);
  let result;
  try {
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    result = await page.evaluate(async () => {
      const state = window.__vectorQA, map = state.maps.at(-1), createdBefore = state.maps.length, durations = [];
      const originalCenter = map.getCenter().toArray();
      for (let i = 0; i < 20; i++) {
        const start = performance.now();
        await new Promise(resolve => {
          map.once('render', () => { durations.push(performance.now() - start); resolve(); });
          map.panBy([3, 0], { duration: 0 });
        });
      }
      map.jumpTo({ center: originalCenter });
      await new Promise(resolve => map.once('idle', resolve));
      let idleRenders = 0;
      const countRender = () => idleRenders++;
      map.on('render', countRender);
      await new Promise(resolve => setTimeout(resolve, 180));
      map.off('render', countRender);
      return { durations, createdBefore, createdAfter: state.maps.length, idleRenders };
    });
  } finally {
    await session.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await session.detach();
  }
  const baselineP95 = quantile(baseline.intervals, .95), p95 = quantile(result.durations, .95);
  const stable = baseline.visible && baselineP95 < 50;
  assert.equal(result.createdAfter, result.createdBefore, 'Twenty throttled pan frames reuse the original map');
  assert.ok(result.idleRenders <= 2, `An idle map does not run a continuous render loop (${result.idleRenders} renders)`);
  if (stable) assert.ok(p95 < 150, `Pan p95 stays below 150 ms at 4× CPU throttle on a stable runner (${p95.toFixed(1)} ms)`);
  console.log('Vector pan performance:', JSON.stringify({ cpuThrottle: 4, frames: 20, medianMilliseconds: +quantile(result.durations, .5).toFixed(1), p95Milliseconds: +p95.toFixed(1), baselineP95Milliseconds: +baselineP95.toFixed(1), thresholdAsserted: stable, mapInstancesBefore: result.createdBefore, mapInstancesAfter: result.createdAfter, idleRenders: result.idleRenders }));
}

async function mockedChecks() {
  const context = await browser.newContext({ viewport: { width: 1000, height: 850 }, reducedMotion: 'reduce' });
  await context.grantPermissions(['local-network-access']);
  const errors = [], requests = [], held = [];
  const transport = { fail: false, blockSelected: false, hold: false };
  let localStyle;
  const server = createServer(async (request, response) => {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Cache-Control', 'no-store');
    requests.push(request.url);
    if (transport.hold) await new Promise(resolve => held.push(resolve));
    if (response.destroyed) return;
    const match = /^\/qa\/(\d+\/\d+\/\d+)\.pbf$/.exec(request.url);
    if (transport.fail || (transport.blockSelected && match?.[1] === selectedTile)) { response.writeHead(503); response.end('Fixture temporarily unavailable'); return; }
    if (request.url === '/style') { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(localStyle)); return; }
    if (match) { response.setHeader('Content-Type', 'application/x-protobuf'); response.end(vectorTile); return; }
    response.writeHead(404); response.end();
  });
  await new Promise(resolve => server.listen(0, resolve));
  const fixtureBase = `http://localhost:${server.address().port}`;
  localStyle = structuredClone(fixtureStyle);
  localStyle.sources.openmaptiles.tiles = [`${fixtureBase}/qa/{z}/{x}/{y}.pbf`];
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === new URL(base).origin || url.origin === fixtureBase) return route.fallback();
    throw new Error(`Unexpected remote request in isolated QA: ${url}`);
  });
  // A local HTTP server exercises actual worker fetches. Module-worker traffic
  // bypasses Playwright route interception, so fixtures must be real endpoints.
  const page = await prepare(context, `${fixtureBase}/style`); page.on('pageerror', error => errors.push(error.message));
  try {
    await mount(page); await ready(page);
    const first = await snapshot(page);
    assert.ok(first.events.some(event => event.tile === pointTile(fixturePoint, Number(event.tile.split('/')[0]))), 'Readiness requires an actual successful canonical tile covering the selected point');
    const rendered = await pixels(page);
    assert.ok(rendered.rendered.some(feature => feature.layer === 'land'), 'Actual vector polygon renders through MapLibre');
    assert.ok(rendered.pixel[0] < 200 && rendered.pixel[1] > 180 && rendered.pixel[2] > 140 && rendered.pixel[3] === 255, `Canvas contains the vector land fill, not an empty background: ${rendered.pixel}`);
    await measurePanPerformance(page, context); await ready(page);
    await page.locator('[data-location-use-pin]').click();
    assert.deepEqual((await snapshot(page)).confirmations, [fixturePoint], 'Initial confirmation preserves coordinates at full precision');

    // Updating metadata keeps the same map, chosen point and user's current view.
    await page.evaluate(point => {
      const state = window.__vectorQA, map = state.maps.at(-1);
      map.jumpTo({ center: [point.lon + .00003, point.lat + .00002], zoom: 17.5 });
      state.beforeUpdate = { center: map.getCenter().toArray(), zoom: map.getZoom() };
      state.cleanup.update({ point, devicePoint: { lat: point.lat + .00001, lon: point.lon - .00001, accuracy: 15, mode: 'gps' } });
    }, fixturePoint);
    await ready(page);
    assert.equal((await snapshot(page)).created, first.created);
    assert.equal(await page.evaluate(() => { const state = window.__vectorQA, map = state.maps.at(-1); return JSON.stringify(state.beforeUpdate) === JSON.stringify({ center: map.getCenter().toArray(), zoom: map.getZoom() }); }), true);
    await page.locator('[data-location-use-pin]').click();
    assert.deepEqual((await snapshot(page)).confirmations.at(-1), fixturePoint);

    // Use physical pointer and keyboard actions to exercise user interaction.
    const canvas = page.locator('.maplibregl-canvas');
    await canvas.click({ position: { x: 230, y: 150 } }); await ready(page);
    await page.locator('[data-location-use-pin]').click();
    const clicked = (await snapshot(page)).confirmations.at(-1);
    assert.notEqual(clicked.lon, fixturePoint.lon);
    const marker = page.locator('.location-map-marker');
    await marker.focus(); await page.keyboard.press('ArrowRight'); await ready(page);
    await page.locator('[data-location-use-pin]').click();
    const keyboard = (await snapshot(page)).confirmations.at(-1);
    assert.ok(keyboard.lon > clicked.lon, 'Keyboard adjusts the chosen longitude');
    const box = await marker.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 36, box.y + box.height / 2 + 18, { steps: 8 }); await page.mouse.up();
    await ready(page); await page.locator('[data-location-use-pin]').click();
    assert.notEqual((await snapshot(page)).confirmations.at(-1).lon, keyboard.lon, 'Dragging changes the chosen point');

    await page.locator('[data-map-expand]').click();
    assert.equal(await page.locator('section').getAttribute('aria-modal'), 'true');
    await page.evaluate(() => {
      const controls = [...document.querySelector('section').querySelectorAll('a[href],button:not(:disabled),[tabindex="0"]')].filter(node => !node.hidden && node.getClientRects().length);
      controls.at(-1).focus();
    });
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.querySelector('section').contains(document.activeElement)), true, 'Fullscreen focus stays inside the dialog');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('section').getAttribute('aria-modal'), null);
    assert.equal(await page.locator('[data-map-expand]').evaluate(node => node === document.activeElement), true);

    // A rendered neighbour cannot authorize a failed selected-point tile.
    transport.blockSelected = true;
    await mount(page);
    await page.evaluate(() => window.__vectorQA.maps.at(-1).jumpTo({ zoom: 14 }));
    await page.locator('[data-map-retry]').waitFor({ state: 'visible' });
    await page.waitForFunction(() => { const state = window.__vectorQA, index = state.maps.length - 1; return state.events.some(event => event.map === index); });
    const partial = await snapshot(page);
    assert.ok(partial.events.some(event => event.map === partial.created - 1 && event.tile !== pointTile(fixturePoint, Number(event.tile.split('/')[0]))), 'The partial failure actually loaded neighbouring vector tiles');
    assert.equal(await page.locator('[data-location-use-pin]').isDisabled(), true);
    transport.blockSelected = false;
    await page.locator('[data-map-retry]').click(); await ready(page);
    assert.equal((await snapshot(page)).created, partial.created, 'Retry keeps the existing WebGL map');

    transport.fail = true; await mount(page);
    await page.locator('[data-map-retry]').waitFor({ state: 'visible' });
    assert.equal(await page.locator('[data-location-use-pin]').isDisabled(), true, 'Failed style/tile requests cannot confirm a pin');
    const settledRequests = requests.length, failed = await snapshot(page);
    await page.waitForTimeout(500); assert.equal(requests.length, settledRequests, 'Failure settles without an autonomous fetch loop');
    for (let attempt = 0; attempt < 2; attempt++) {
      const before = requests.length;
      await page.evaluate(() => dispatchEvent(new Event('online')));
      await page.waitForFunction(() => !document.querySelector('[data-map-retry]').hidden);
      assert.ok(requests.length > before, 'An online event makes one recovery attempt while failed');
    }
    const exhausted = requests.length;
    await page.evaluate(() => { for (let i = 0; i < 10; i++) dispatchEvent(new Event('online')); });
    await page.waitForTimeout(200);
    assert.equal(requests.length, exhausted, 'Automatic online recovery is bounded after repeated failure');
    transport.fail = false;
    await page.locator('[data-map-retry]').focus(); await page.keyboard.press('Enter'); await ready(page);
    const retried = await snapshot(page);
    assert.equal(retried.created, failed.created); assert.deepEqual(retried.center, failed.center);
    assert.equal(await page.evaluate(() => { const active = document.activeElement; return document.querySelector('section').contains(active) && Boolean(active.getClientRects().length) && !active.hidden; }), true, 'Keyboard retry leaves focus on a visible map control');
    await page.locator('[data-location-use-pin]').click(); assert.deepEqual((await snapshot(page)).confirmations.at(-1), fixturePoint);

    transport.fail = true; await mount(page); await page.locator('[data-map-retry]').waitFor({ state: 'visible' });
    const online = await snapshot(page); transport.fail = false;
    await page.evaluate(() => dispatchEvent(new Event('online'))); await ready(page);
    assert.equal((await snapshot(page)).created, online.created, 'Returning online reuses the existing map');
    const onlineCount = requests.length;
    await page.evaluate(() => { for (let i = 0; i < 10; i++) dispatchEvent(new Event('online')); });
    await page.waitForTimeout(200); assert.equal(requests.length, onlineCount, 'Online events do not refetch a healthy map');

    await mount(page, { readonly: true });
    await page.waitForFunction(() => document.querySelector('[data-map-loading]').hidden);
    assert.equal(await page.locator('[data-location-use-pin]').isDisabled(), true);
    const readonlyCoordinates = await page.locator('[data-map-coordinates]').textContent();
    await canvas.click({ position: { x: 250, y: 140 } });
    await marker.evaluate(node => node.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
    assert.equal(await page.locator('[data-map-coordinates]').textContent(), readonlyCoordinates, 'Readonly map ignores point selection and marker keyboard edits');

    // Late worker/network replies after removal cannot touch a removed map.
    transport.hold = true; await mount(page);
    await page.waitForTimeout(60);
    assert.equal(await page.locator('[data-location-use-pin]').isDisabled(), true);
    await page.evaluate(() => { const state = window.__vectorQA; state.abort.abort(); state.cleanup(); state.cleanup(); state.cleanup.update({}); state.cleanup.resize(); document.querySelector('section').remove(); dispatchEvent(new Event('online')); });
    transport.hold = false; held.splice(0).forEach(resolve => resolve());
    // Allow already-issued HTTP requests to arrive after abort before checking
    // that no recovery listener or timer initiates another attempt.
    await page.waitForTimeout(200);
    const disposedRequests = requests.length;
    await page.waitForTimeout(500);
    assert.equal(requests.length, disposedRequests, 'Cleanup removes recovery listeners and pending-load timers');
    assert.equal((await snapshot(page)).live, 0);
    assert.deepEqual(errors, [], 'Interaction, retry, and cleanup produce no uncaught browser exceptions');
    console.log('PASS real MapLibre mocked vector rendering; canonical selected tile gating; full precision; updates retain view/map; click/drag/keyboard; fullscreen focus/Escape; readonly; bounded failure; manual/online recovery; pending-load cleanup.');
  } catch (error) { console.error('Mocked request diagnostic:', JSON.stringify(requests)); throw error; }
  finally { held.splice(0).forEach(resolve => resolve()); await context.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}

async function networkCheck() {
  // One fixed 640 × 360 viewport. No pan, zoom, prefetch, bulk download or
  // OpenStreetMap raster endpoint; only normal OpenFreeMap viewport traffic.
  const context = await browser.newContext({ viewport: { width: 700, height: 700 }, deviceScaleFactor: 1 });
  const counts = { style: 0, tileJSON: 0, vector: 0, glyph: 0, sprite: 0, other: 0 }, failures = [], errors = [];
  const page = await prepare(context);
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    const url = new URL(request.url()); if (url.origin === new URL(base).origin) return;
    const kind = url.href === styleURL ? 'style' : /\/planet\/?$/.test(url.pathname) ? 'tileJSON' : /\.pbf$/.test(url.pathname) ? (url.pathname.includes('/fonts/') ? 'glyph' : 'vector') : /sprite/.test(url.pathname) ? 'sprite' : 'other';
    counts[kind]++;
  });
  page.on('requestfailed', request => { if (new URL(request.url()).origin !== new URL(base).origin) failures.push({ url: request.url(), error: request.failure()?.errorText }); });
  try {
    // An approximate GPS fix centers one wider fixed viewport, including local
    // labels as well as roads and land at these deliberately rural coordinates.
    const started = performance.now();
    await mount(page, {}, { ...fixturePoint, accuracy: 2000, mode: 'gps' });
    await page.waitForFunction(() => window.__vectorQA.maps.at(-1).loaded() && document.querySelector('[data-map-loading]').hidden, null, { timeout: 45000 });
    const readyMilliseconds = Math.round(performance.now() - started);
    assert.equal(await page.locator('[data-location-use-pin]').isDisabled(), true, 'A loaded map cannot authorize an approximate GPS fix');
    assert.equal(await page.locator('.location-map-marker').count(), 0, 'Approximate GPS remains a device dot without a service pin');
    await mkdir('outputs/vector-map', { recursive: true });
    await page.locator('[data-location-map-canvas]').screenshot({ path: 'outputs/vector-map/real.png' });
    const render = await pixels(page), state = await snapshot(page);
    assert.ok(state.events.some(event => event.tile === pointTile(fixturePoint, Number(event.tile.split('/')[0]))), 'Real source content covers the selected coordinates');
    assert.ok(render.rendered.some(feature => feature.type === 'symbol'), 'Real labels render in the viewport');
    assert.ok(render.rendered.length > 1, 'Real vector map contains rendered geographic features');
    assert.ok(render.pixel[3] > 0, 'Real WebGL canvas renders visible pixels');
    assert.deepEqual(errors, []); assert.deepEqual(state.errors, []);
    console.log('PASS OpenFreeMap actual fixed viewport:', JSON.stringify({ counts, failures, readyMilliseconds, sourceContentEvents: state.events.length, renderedFeatures: render.rendered.length, labels: render.rendered.filter(feature => feature.type === 'symbol').length, canvas: [render.width, render.height], screenshot: 'outputs/vector-map/real.png' }));
  } finally { await context.close(); }
}

try {
  if (!process.argv.includes('--network-only')) await mockedChecks();
  if (process.argv.includes('--network') || process.argv.includes('--network-only')) await networkCheck();
} finally { await browser.close(); }
