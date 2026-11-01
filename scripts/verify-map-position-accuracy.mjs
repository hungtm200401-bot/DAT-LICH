import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

// Synthetic coordinates only. This suite runs the actual MapLibre projection,
// marker and worker against local vector tiles and the production CSS cascade.
const pin = { lat: 10.750123456789, lon: 106.700987654321, accuracy: null, mode: 'pin' };
const gps = { lat: pin.lat + .00123, lon: pin.lon - .00234, accuracy: 6500, mode: 'gps' };
const varint = value => { const bytes = []; do { const byte = value % 128; value = Math.floor(value / 128); bytes.push(byte | (value ? 128 : 0)); } while (value); return bytes; };
const field = (number, wire, value) => [...varint(number * 8 + wire), ...(wire === 2 ? [...varint(value.length), ...value] : varint(value))];
const geometry = [9, 0, 0, 26, 8192, 0, 0, 8192, 8191, 0, 15].flatMap(varint);
const feature = [...field(1, 0, 1), ...field(3, 0, 3), ...field(4, 2, geometry)];
const layer = [...field(1, 2, [...Buffer.from('land')]), ...field(2, 2, feature), ...field(5, 0, 4096), ...field(15, 0, 2)];
const vectorTile = Buffer.from(field(3, 2, layer));
const publicRoot = new URL('../public/', import.meta.url);
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/couture.css"><link rel="stylesheet" href="/location-experience.css"><link rel="stylesheet" href="/vendor/maplibre/maplibre-gl.css"><style>body{margin:0}.location-map-panel{width:min(640px,100vw)}</style></head><body class="couture"><section class="location-map-panel"><div class="location-map-heading"><h3>Position fixture</h3><button data-map-expand>Expand</button></div><div class="location-map-viewport"><div class="location-map-canvas" data-location-map-canvas></div><div class="location-map-tools"><button data-map-recenter>Recenter</button></div><p class="location-map-loading" data-map-loading></p></div><p data-map-coordinates></p><p data-location-pin-status></p><button data-location-use-pin disabled>Use point</button></section></body></html>`;
let origin;
const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname === '/') { response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(html); return; }
    if (pathname === '/style') {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ version: 8, sources: { openmaptiles: { type: 'vector', maxzoom: 14, tiles: [origin + '/tile/{z}/{x}/{y}.pbf'] } }, layers: [{ id: 'land', type: 'fill', source: 'openmaptiles', 'source-layer': 'land', paint: { 'fill-color': '#b7cfa8' } }] })); return;
    }
    if (pathname.startsWith('/tile/')) { response.setHeader('Content-Type', 'application/x-protobuf'); response.end(vectorTile); return; }
    const target = new URL('.' + pathname, publicRoot);
    if (!fileURLToPath(target).startsWith(fileURLToPath(publicRoot))) { response.writeHead(403); response.end(); return; }
    const bytes = await readFile(target);
    response.setHeader('Content-Type', pathname.endsWith('.css') ? 'text/css' : /\.m?js$/.test(pathname) ? 'application/javascript' : 'application/octet-stream'); response.end(bytes);
  } catch { response.writeHead(404); response.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const failures = [], measurements = [];
const check = (condition, message, detail) => { if (!condition) failures.push({ message, detail }); };
const frame = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
const ready = page => page.waitForFunction(() => { const state = window.__accuracyQA; return state.map?.isStyleLoaded() && state.map?.areTilesLoaded() && document.querySelector('[data-map-loading]').hidden; });

async function mount(page, point, devicePoint = null) {
  await page.evaluate(async ({ point, devicePoint }) => {
    const gl = await import('/vendor/maplibre/maplibre-gl.mjs');
    gl.setWorkerUrl('/vendor/maplibre/maplibre-gl-worker.mjs'); gl.setWorkerCount(1);
    const state = window.__accuracyQA ||= { confirmations: [] };
    state.cleanup?.();
    class FixtureMap extends gl.Map {
      constructor(options) { super({ ...options, style: '/style' }); state.map = this; }
      setStyle(_style, options) { return super.setStyle('/style', options); }
    }
    window.maplibregl = { ...gl, Map: FixtureMap };
    const vectorModule = await import('/location-vector-map.js');
    state.cleanup = await vectorModule.mountVectorLocationMap(document.querySelector('section'), point, value => state.confirmations.push(value), { devicePoint });
  }, { point, devicePoint });
  await ready(page); await frame(page);
}

async function measureTip(page, expected, label) {
  const result = await page.evaluate(expected => {
    const map = window.__accuracyQA.map;
    const marker = document.querySelector('.location-map-marker'), shape = marker.querySelector('svg,span') || marker;
    const rect = shape.getBoundingClientRect(), canvas = map.getCanvas().getBoundingClientRect();
    const projected = map.project([expected.lon, expected.lat]);
    let screenTip;
    if (shape instanceof SVGSVGElement) {
      const point = shape.createSVGPoint(); point.x = 15; point.y = 38;
      screenTip = point.matrixTransform(shape.getScreenCTM());
    } else screenTip = { x: rect.left + rect.width / 2, y: rect.bottom };
    const tip = { x: screenTip.x - canvas.left, y: screenTip.y - canvas.top };
    return { dx: tip.x - projected.x, dy: tip.y - projected.y, projected: { x: projected.x, y: projected.y }, tip, boxSizing: getComputedStyle(marker).boxSizing, shapeBoxSizing: getComputedStyle(shape).boxSizing };
  }, expected);
  measurements.push({ label, ...result });
  check(Math.abs(result.dx) <= .75 && Math.abs(result.dy) <= .75, `${label}: visible sharp pin tip aligns with MapLibre projection within pixel rounding`, result);
}

async function checkGPS(page, expected, label) {
  const result = await page.evaluate(expected => {
    const map = window.__accuracyQA.map, data = map.getSource('location-device-position').serialize().data;
    const point = data.features.find(feature => feature.properties.kind === 'device');
    const ring = data.features.find(feature => feature.properties.kind === 'accuracy');
    const radians = value => value * Math.PI / 180;
    const distances = ring?.geometry.coordinates[0].map(([lon, lat]) => {
      const value = Math.sin(radians(lat - expected.lat) / 2) ** 2 + Math.cos(radians(lat)) * Math.cos(radians(expected.lat)) * Math.sin(radians(lon - expected.lon) / 2) ** 2;
      return 6371008.8 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
    }) || [];
    return { coordinates: point?.geometry.coordinates, count: data.features.length, distances, rendered: map.queryRenderedFeatures().some(feature => feature.layer.id === 'location-device-position-dot') };
  }, expected);
  check(JSON.stringify(result.coordinates) === JSON.stringify([expected.lon, expected.lat]), `${label}: GPS dot retains longitude/latitude ordering and full precision`, result.coordinates);
  check(result.distances.length === 65 && result.distances.every(distance => Math.abs(distance - expected.accuracy) < .05), `${label}: every accuracy-ring point has the reported radius in metres`, { count: result.distances.length, min: Math.min(...result.distances), max: Math.max(...result.distances) });
  check(result.count === 2, `${label}: there is one current dot and one current accuracy ring`, result.count);
  check(result.rendered, `${label}: the current GPS dot renders in the map`, result.rendered);
}

try {
  for (const viewport of [{ width: 1100, height: 900 }, { width: 390, height: 844 }]) {
    const mobile = viewport.width < 700;
    const context = await browser.newContext({ viewport, deviceScaleFactor: mobile ? 3 : 1, isMobile: mobile, hasTouch: mobile });
    const errors = [], remote = [];
    await context.route('**/*', route => {
      if (new URL(route.request().url()).origin === origin) return route.continue();
      remote.push(route.request().url()); return route.abort();
    });
    const page = await context.newPage(); page.setDefaultTimeout(15000); page.on('pageerror', error => errors.push(error.message));
    try {
      await page.goto(origin); await mount(page, pin);
      await measureTip(page, pin, `${viewport.width}px initial pin`);
      await page.locator('[data-location-use-pin]').click();
      assert.deepEqual(await page.evaluate(() => window.__accuracyQA.confirmations.at(-1)), pin);
      const box = await page.locator('.maplibregl-canvas').boundingBox();
      const screen = { x: Math.round(box.width * .62), y: Math.round(box.height * .63) };
      await page.evaluate(() => {
        const state = window.__accuracyQA;
        state.map.once('click', event => {
          const inverse = state.map.unproject(event.point);
          state.pointer = { lat: event.lngLat.lat, lon: event.lngLat.lng, inverse: { lat: inverse.lat, lon: inverse.lng } };
        });
      });
      await page.locator('.maplibregl-canvas').click({ position: screen }); await ready(page); await frame(page);
      const expected = await page.evaluate(() => window.__accuracyQA.pointer);
      await measureTip(page, expected, `${viewport.width}px pointer-selected pin`);
      await page.locator('[data-location-use-pin]').click();
      const clicked = await page.evaluate(() => window.__accuracyQA.confirmations.at(-1));
      check(Math.abs(clicked.lat - expected.lat) < 1e-10 && Math.abs(clicked.lon - expected.lon) < 1e-10 && Math.abs(expected.inverse.lat - expected.lat) < 1e-10 && Math.abs(expected.inverse.lon - expected.lon) < 1e-10, 'Pointer selection is inverse projection without coordinate offset or rounding', { clicked, expected });

      await mount(page, gps, gps); await checkGPS(page, gps, `${viewport.width}px initial coarse GPS`);
      check(await page.locator('[data-location-use-pin]').isDisabled(), 'Untouched coarse GPS cannot be relabelled as a precise manually selected pin', gps);
      const beforeBypass = await page.evaluate(() => window.__accuracyQA.confirmations.length);
      await page.evaluate(() => { const button = document.querySelector('[data-location-use-pin]'); button.disabled = false; button.click(); });
      check(await page.evaluate(() => window.__accuracyQA.confirmations.length) === beforeBypass, 'Coarse GPS confirmation guard also prevents a programmatic disabled-button bypass', gps);
      check(await page.locator('.location-map-marker').count() === 0, 'Coarse GPS shows the blue device dot and uncertainty ring without a false precise service pin', gps);
      await page.locator('.maplibregl-canvas').click({ position: screen }); await ready(page); await frame(page);
      await page.locator('[data-location-use-pin]').click();
      const corrected = await page.evaluate(() => window.__accuracyQA.confirmations.at(-1));
      check(corrected.mode === 'pin' && corrected.accuracy === null, 'An explicit map click creates a manual service pin', corrected);
      await measureTip(page, corrected, `${viewport.width}px corrected coarse GPS pin`);
      await checkGPS(page, gps, `${viewport.width}px GPS source retained after pin correction`);
      const nextGPS = { ...gps, lat: gps.lat + .001, lon: gps.lon - .001, accuracy: 2300 };
      await page.evaluate(point => window.__accuracyQA.cleanup.update({ point, devicePoint: point, forceCenter: true }), nextGPS);
      await ready(page); await frame(page); await checkGPS(page, nextGPS, `${viewport.width}px refreshed GPS`);
      const center = await page.evaluate(() => window.__accuracyQA.map.getCenter().toArray());
      check(Math.abs(center[0] - nextGPS.lon) < 1e-9 && Math.abs(center[1] - nextGPS.lat) < 1e-6, 'New GPS fix recenters to the new coordinate', center);
      await page.evaluate(point => {
        const state = window.__accuracyQA; state.map.jumpTo({ center: [point.lon + .02, point.lat + .02] });
        state.cleanup.update({ point, devicePoint: point, forceCenter: true });
      }, nextGPS);
      await ready(page); await frame(page);
      const repeated = await page.evaluate(() => window.__accuracyQA.map.getCenter().toArray());
      check(Math.abs(repeated[0] - nextGPS.lon) < 1e-9 && Math.abs(repeated[1] - nextGPS.lat) < 1e-6, 'Repeated identical GPS fix still returns from a panned view', repeated);
      const precise = { ...gps, accuracy: 19 };
      await mount(page, precise, precise); await checkGPS(page, precise, `${viewport.width}px precise GPS`);
      await page.locator('[data-location-use-pin]').click();
      const confirmedGPS = await page.evaluate(() => window.__accuracyQA.confirmations.at(-1));
      check(confirmedGPS.lat === precise.lat && confirmedGPS.lon === precise.lon && confirmedGPS.mode === 'gps' && confirmedGPS.accuracy === precise.accuracy, 'Confirming untouched precise GPS preserves its source mode and measured uncertainty', confirmedGPS);
      const unknown = { ...gps, accuracy: null };
      await mount(page, unknown, unknown);
      check(await page.locator('[data-location-use-pin]').isDisabled() && await page.locator('.location-map-marker').count() === 0, 'GPS with unknown uncertainty also requires explicit manual point selection', unknown);
      check(errors.length === 0, 'No uncaught browser errors', errors);
      check(remote.length === 0, 'All position checks use offline fixtures', remote);
    } finally { await context.close(); }
  }
  console.log('Map position measurements:', JSON.stringify(measurements));
  if (failures.length) console.error('Map position failures:', JSON.stringify(failures));
  if (!process.argv.includes('--report-only')) assert.equal(failures.length, 0, `${failures.length} map position checks failed`);
  else console.log(`Baseline report: ${failures.length} failures.`);
  if (!failures.length) console.log('PASS production CSS pin tip, actual MapLibre inverse projection, GPS coordinates/radius, coarse-fix confirmation gate, refreshed and repeated GPS on desktop/mobile.');
} finally {
  await browser.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
}
