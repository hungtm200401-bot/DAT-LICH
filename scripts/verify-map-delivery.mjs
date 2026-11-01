import assert from 'node:assert/strict';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

const base = process.env.TEST_BASE_URL || 'http://localhost:5173';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const fixturePoint = { lat: 21.100123456789, lon: 105.500987654321, accuracy: null, mode: 'pin' };
const selectedTile = (() => {
  const zoom = 18, count = 2 ** zoom, latitude = fixturePoint.lat * Math.PI / 180;
  return `${zoom}/${Math.floor((fixturePoint.lon + 180) / 360 * count)}/${Math.floor((1 - Math.asinh(Math.tan(latitude)) / Math.PI) / 2 * count)}`;
})();
const tileImage = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e8ece6"/><path d="M0 120H256M110 0V256" stroke="#c8cdc2" stroke-width="3"/></svg>';

// Network diagnosis is opt-in and requests exactly one fixed tile. Map interaction
// scenarios below always intercept tiles; they never pan or prefetch real tiles.
async function networkDiagnostic() {
  const tile = 'https://tile.openstreetmap.org/14/12993/7209.png';
  const report = { tile, server: {}, browser: {} };
  try {
    const start = performance.now();
    const response = await fetch(tile, {
      headers: { 'User-Agent': `HoanMakeupArtist/1.0 (+${base}/)`, Referer: `${base}/` },
      signal: AbortSignal.timeout(10000),
    });
    report.server = { status: response.status, type: response.headers.get('content-type'), bytes: (await response.arrayBuffer()).byteLength, milliseconds: Math.round(performance.now() - start) };
  } catch (error) { report.server = { error: error.message, cause: error.cause?.code }; }
  const page = await browser.newPage();
  try {
    page.on('requestfailed', request => { if (request.url() === tile) report.browser.failure = request.failure()?.errorText; });
    page.on('response', response => { if (response.url() === tile) { report.browser.status = response.status(); report.browser.type = response.headers()['content-type']; } });
    await page.route(`${base}/__map-delivery-network`, route => route.fulfill({ contentType: 'text/html', body: `<!doctype html><title>pending</title><img src="${tile}" onload="document.title='loaded'" onerror="document.title='failed'">` }));
    await page.goto(`${base}/__map-delivery-network`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => ['loaded', 'failed'].includes(document.title), null, { timeout: 15000 }).catch(() => {});
    Object.assign(report.browser, await page.evaluate(() => ({ result: document.title, naturalWidth: document.querySelector('img').naturalWidth })));
  } finally { await page.close(); }
  console.log('Fixed tile network diagnostic:', JSON.stringify(report));
}

try {
  if (process.argv.includes('--network')) await networkDiagnostic();
  const context = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  const errors = [], requests = { direct: 0, proxy: 0 };
  const tileEvents = [];
  const transport = { direct: false, proxy: true, hold: false, holdDirect: false, blockSelected: false };
  const held = [];
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    const kind = url.hostname === 'tile.openstreetmap.org' ? 'direct' : url.pathname === '/api/map-tiles' ? 'proxy' : null;
    if (!kind) return route.fallback();
    requests[kind]++;
    if (transport.hold || (transport.holdDirect && kind === 'direct')) await new Promise(resolve => held.push(resolve));
    const tileKey = kind === 'direct' ? url.pathname.slice(1).replace(/\.png$/, '') : `${url.searchParams.get('z')}/${url.searchParams.get('x')}/${url.searchParams.get('y')}`;
    tileEvents.push({ kind, tileKey, blocked: transport.blockSelected && tileKey === selectedTile });
    if (transport.blockSelected && tileKey === selectedTile) return route.abort('connectionrefused');
    if (!transport[kind]) return route.abort('connectionrefused');
    return route.fulfill({ contentType: 'image/svg+xml', headers: { 'Cache-Control': 'no-store' }, body: tileImage });
  });
  await context.route(`${base}/__map-delivery-fixture`, route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><title>Map delivery fixture</title></head><body></body></html>' }));
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/__map-delivery-fixture`);
  await page.addStyleTag({ url: `${base}/location-experience.css` });
  await page.addStyleTag({ url: `${base}/vendor/leaflet/leaflet.css` });
  await page.addScriptTag({ url: `${base}/vendor/leaflet/leaflet.js` });
  await page.evaluate(() => {
    const create = window.L.map;
    window.__mapDelivery = { maps: [], removed: new Set(), confirmations: [] };
    window.L.map = (...args) => {
      const map = create(...args); window.__mapDelivery.maps.push(map);
      map.on('unload', () => window.__mapDelivery.removed.add(map)); return map;
    };
  });
  const mount = async () => page.evaluate(async point => {
    window.__mapDelivery.cleanup?.();
    document.body.innerHTML = '<section class="location-map-panel" style="width:640px"><div class="location-map-heading"><h3>Map delivery fixture</h3><button data-map-expand>Mở rộng</button></div><div class="location-map-viewport"><div data-location-map-canvas style="height:320px"></div><div class="location-map-tools"><button data-map-recenter>Về điểm đã chọn</button></div><p class="location-map-loading" data-map-loading role="status"></p></div><p data-location-pin-status aria-live="polite"></p><button data-location-use-pin disabled>Dùng vị trí này</button></section>';
    const module = await import('/location-raster-map.js?delivery-test=1');
    const abort = new AbortController(); window.__mapDelivery.abort = abort;
    window.__mapDelivery.cleanup = await module.mountLocationMap(document.querySelector('section'), point, selected => window.__mapDelivery.confirmations.push(selected), { signal: abort.signal });
  }, fixturePoint);
  const confirm = page.locator('[data-location-use-pin]');
  const retry = page.locator('[data-map-retry]');
  const snapshot = () => page.evaluate(() => {
    const state = window.__mapDelivery, map = state.maps.at(-1);
    return { created: state.maps.length, live: state.maps.filter(item => !state.removed.has(item)).length, center: map && !state.removed.has(map) ? { lat: map.getCenter().lat, lon: map.getCenter().lng } : null, confirmations: state.confirmations };
  });

  // The public host can fail even while the application's connection is healthy.
  await mount();
  await confirm.locator('..').waitFor();
  await page.waitForFunction(() => !document.querySelector('[data-location-use-pin]').disabled);
  assert.ok(requests.direct > 0 && requests.proxy > 0, 'A failed direct tile source falls back to the application route');
  const fallback = await snapshot();
  assert.equal(fallback.created, 1, 'Transport fallback keeps the original Leaflet map');
  assert.equal(fallback.live, 1);
  await confirm.click();
  assert.deepEqual((await snapshot()).confirmations, [fixturePoint], 'Fallback preserves the selected coordinates at full precision');

  // A hung direct connection must also recover; browser image errors are not
  // guaranteed to arrive promptly on unstable client networks.
  transport.direct = true; transport.holdDirect = true;
  await mount();
  const stalled = await snapshot();
  assert.equal(await confirm.isDisabled(), true);
  await page.waitForFunction(() => !document.querySelector('[data-location-use-pin]').disabled);
  assert.equal((await snapshot()).created, stalled.created, 'A stalled direct image recovers through the proxy without remounting');
  transport.holdDirect = false;
  held.splice(0).forEach(resolve => resolve());

  // Nearby loaded tiles are insufficient when the actual pin's tile failed.
  transport.direct = true; transport.blockSelected = true;
  await mount();
  await retry.waitFor({ state: 'visible' }).catch(async error => {
    console.log('Partial-load diagnostic:', JSON.stringify({ selectedTile, tileEvents, state: await snapshot(), tiles: await page.locator('.leaflet-tile').evaluateAll(nodes => nodes.map(node => ({ src: node.src, loaded: node.classList.contains('leaflet-tile-loaded') }))) }));
    throw error;
  });
  assert.equal(await page.locator('.leaflet-tile-loaded').count() > 0, true, 'The partial-load case has visible neighbouring tiles');
  assert.equal(await confirm.isDisabled(), true, 'A neighbouring tile cannot authorize confirmation on a blank selected tile');
  await page.evaluate(() => {
    const map = window.__mapDelivery.maps.at(-1);
    const layer = Object.values(map._layers).find(item => item._tiles);
    const tile = Object.values(layer._tiles).find(item => item.el.classList.contains('leaflet-tile-loaded'));
    const size = layer.getTileSize();
    const latlng = map.unproject(window.L.point((tile.coords.x + .5) * size.x, (tile.coords.y + .5) * size.y), tile.coords.z);
    map.fire('click', { latlng });
  });
  assert.equal(await confirm.isDisabled(), false, 'Selecting a loaded neighbouring tile can confirm the new point');
  assert.equal(await page.locator('[data-map-loading]').isHidden(), true, 'Selecting a loaded point clears the previous tile failure overlay');
  await page.evaluate(point => window.__mapDelivery.cleanup.update({ point, forceCenter: true }), fixturePoint);
  assert.equal(await confirm.isDisabled(), true, 'Restoring a point whose own tile failed revokes confirmation');
  transport.blockSelected = false;
  await retry.click();
  await page.waitForFunction(() => !document.querySelector('[data-location-use-pin]').disabled);

  // Both connections unavailable: retries must be explicit/bounded and recovery
  // must not lose the pin or create an extra map instance.
  transport.direct = false; transport.proxy = false;
  await mount();
  await retry.waitFor({ state: 'visible' });
  assert.equal(await confirm.isDisabled(), true, 'A blank map cannot confirm a destination');
  const failedCounts = { ...requests }, failedSnapshot = await snapshot();
  await page.waitForTimeout(400);
  assert.deepEqual(requests, failedCounts, 'Failure settles without a request loop');
  transport.proxy = true;
  await retry.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.querySelector('[data-location-use-pin]').disabled);
  assert.equal((await snapshot()).created, failedSnapshot.created, 'Manual retry reuses the map');
  assert.deepEqual((await snapshot()).center, failedSnapshot.center, 'Manual retry preserves the view and selected point');
  await retry.waitFor({ state: 'hidden' });
  assert.equal(await page.evaluate(() => {
    const active = document.activeElement;
    return Boolean(document.querySelector('.location-map-panel').contains(active) && active.getClientRects().length && !active.hidden);
  }), true, 'Keyboard retry keeps focus on a visible control within the map');

  // Returning online recovers a failed map once, without forcing a new GPS read.
  transport.proxy = false;
  await mount();
  await retry.waitFor({ state: 'visible' });
  const beforeOnline = await snapshot();
  transport.proxy = true;
  await page.evaluate(() => dispatchEvent(new Event('online')));
  await page.waitForFunction(() => !document.querySelector('[data-location-use-pin]').disabled);
  assert.equal((await snapshot()).created, beforeOnline.created, 'Network recovery does not remount the map');

  // Dispose while tiles are pending; late callbacks cannot resurrect transport,
  // write to a detached view, or invoke Leaflet after remove().
  transport.hold = true;
  await mount();
  await page.waitForTimeout(50);
  assert.equal(await confirm.isDisabled(), true, 'No tile success means no confirmation');
  await page.evaluate(() => { window.__mapDelivery.abort.abort(); window.__mapDelivery.cleanup(); document.querySelector('section').remove(); dispatchEvent(new Event('online')); });
  transport.hold = false;
  held.splice(0).forEach(resolve => resolve());
  const afterDispose = { ...requests };
  await page.waitForTimeout(400);
  assert.deepEqual(requests, afterDispose, 'Disposal removes timers and online recovery listeners');
  assert.equal((await snapshot()).live, 0);
  assert.deepEqual(errors, [], 'Tile failure, retries and teardown produce no browser exceptions');
  await context.close();
  console.log('PASS direct tile failure → same-origin fallback; bounded failure; manual and online retry; pin/view preservation; confirmation gated on tile success; pending-load cleanup.');
} finally { await browser.close(); }
