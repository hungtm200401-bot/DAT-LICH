import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

// Exercise the actual production worker install. Vite serves a retirement worker
// during development, so proxy only /sw.js to its production source for this test.
const base = process.env.TEST_BASE_URL || 'http://localhost:5173';
const worker = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');
const forbidden = /maps\.googleapis|maps\.gstatic|tiles\.openfreemap|tile\.openstreetmap|\/vendor\/(maplibre|leaflet)|\/(?:location-(?:map|vector-map|raster-map|search)|google-maps-loader)\.js|\/api\/(?:map-tiles|maps-config|address-search)/;
const proxy = createServer(async (request, response) => {
  try {
    if (request.url === '/sw.js') { response.writeHead(200, { 'Content-Type': 'application/javascript', 'Service-Worker-Allowed': '/', 'Cache-Control': 'no-store' }); response.end(worker); return; }
    if (request.url === '/__worker-check') { response.writeHead(200, { 'Content-Type': 'text/html' }); response.end('<!doctype html><title>Worker verification</title><p>Isolated service worker test</p>'); return; }
    const upstream = await fetch(base + request.url, { signal: AbortSignal.timeout(15000) });
    const headers = Object.fromEntries(upstream.headers); delete headers['content-encoding']; delete headers['content-length']; delete headers['transfer-encoding'];
    response.writeHead(upstream.status, headers); response.end(Buffer.from(await upstream.arrayBuffer()));
  } catch { response.writeHead(502); response.end('Test proxy unavailable'); }
});
await new Promise(resolve => proxy.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext(), mapRequests = [];
  context.on('request', request => { if (forbidden.test(request.url())) mapRequests.push(request.url()); });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:' + proxy.address().port + '/__worker-check');
  await page.evaluate(async () => { await navigator.serviceWorker.register('/sw.js'); await navigator.serviceWorker.ready; });
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    return (await Promise.all(names.filter(name => name.startsWith('hoan-makeup-')).map(async name => (await (await caches.open(name)).keys()).map(request => request.url)))).flat();
  });
  assert.ok(cached.some(url => url.includes('/booking-location.js')), 'Production worker must actually install/precache');
  assert.deepEqual(cached.filter(url => forbidden.test(url)), []); assert.deepEqual(mapRequests, []);
  await page.evaluate(async () => { await Promise.all((await navigator.serviceWorker.getRegistrations()).map(registration => registration.unregister())); });
  await context.close();
  console.log('PASS production service worker install: normal booking assets cached, zero map SDK/tile/search/config requests or precached map engines. Isolated browser origin only.');
} finally { await browser.close(); proxy.closeAllConnections(); await new Promise(resolve => proxy.close(resolve)); }
