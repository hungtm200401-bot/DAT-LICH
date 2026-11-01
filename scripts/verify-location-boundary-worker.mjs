import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

const base = process.env.PREVIEW_URL || 'http://localhost:5173';
const largest = JSON.parse(gunzipSync(await readFile(new URL('../public/data/administrative-boundaries/wards-68.json.gz', import.meta.url))));
const feature = largest.features[0];
const expectedBounds = [[feature.bbox[1], feature.bbox[0]], [feature.bbox[3], feature.bbox[2]]];
const cacheFixtures = await Promise.all([1, 52, 66, 68].map(async provinceCode => {
  const filename = `wards-${String(provinceCode).padStart(2, '0')}.json.gz`;
  const data = JSON.parse(gunzipSync(await readFile(new URL(`../public/data/administrative-boundaries/${filename}`, import.meta.url))));
  return { provinceCode, wardCode: data.features[0].properties.code, filename };
}));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [];

async function setup(workerMode) {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const requests = [];
  context.on('request', request => {
    if (request.url().includes('/data/administrative-boundaries/')) requests.push(new URL(request.url()).pathname.split('/').at(-1));
  });
  await context.route('**/__boundary_worker_test', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Boundary worker fixture</title><button>Address controls remain usable</button>' }));
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const session = await context.newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto(`${base}/__boundary_worker_test`);
  await page.evaluate(async mode => {
    window.__workerCount = 0;
    if (mode === 'disabled') window.Worker = undefined;
    else if (mode === 'blocked') window.Worker = class { constructor() { throw new DOMException('Blocked by browser policy', 'SecurityError'); } };
    else {
      const NativeWorker = window.Worker;
      window.Worker = class extends NativeWorker {
        constructor(...args) { super(...args); window.__workerCount++; }
      };
    }
    window.__boundaries = await import('/location-boundaries.js?worker-performance-verification=1');
    window.__directory = await (await fetch('/data/vietnam-administrative-latest.json')).json();
  }, workerMode);
  return { context, page, requests };
}

async function profile(page) {
  return page.evaluate(async code => {
    const tasks = [];
    const observer = new PerformanceObserver(list => tasks.push(...list.getEntries().map(entry => ({ start: entry.startTime, duration: entry.duration }))));
    observer.observe({ entryTypes: ['longtask'] });
    const start = performance.now();
    const bounds = await window.__boundaries.administrativeMapBounds(68, code);
    const elapsed = performance.now() - start;
    await new Promise(resolve => setTimeout(resolve, 80));
    observer.disconnect();
    return { bounds, elapsed: Math.round(elapsed), longTasks: tasks.filter(task => task.start >= start).map(task => Math.round(task.duration)), workers: window.__workerCount };
  }, feature.properties.code);
}

async function locateFixtures(page) {
  return page.evaluate(async () => {
    const directory = window.__directory.provinces || window.__directory;
    const results = [];
    for (const point of [
      { lat: 21.1, lon: 105.5, accuracy: 5, mode: 'gps' },
      { lat: 21.1, lon: 105.5, accuracy: 5000, mode: 'gps' },
      { lat: 21.1, lon: 105.5, accuracy: null, mode: 'pin' },
      { lat: 0, lon: 0, accuracy: 5, mode: 'gps' }
    ]) results.push(await window.__boundaries.locateAdministrativeArea(directory, point));
    return results;
  });
}

try {
  const enabled = await setup('enabled');
  const disabled = await setup('disabled');
  const workerProfile = await profile(enabled.page);
  const fallbackProfile = await profile(disabled.page);
  assert.deepEqual(workerProfile.bounds, expectedBounds);
  assert.deepEqual(fallbackProfile.bounds, expectedBounds);
  assert.equal(workerProfile.workers, 1, 'One lazy worker handles boundary geometry');
  assert.equal(fallbackProfile.workers, 0);
  const workerResults = await locateFixtures(enabled.page);
  const fallbackResults = await locateFixtures(disabled.page);
  assert.deepEqual(workerResults, fallbackResults, 'Worker retains exact containment, edge distance, accuracy and canonical directory result');
  assert.equal(workerResults[0].provinceCode, 1);
  assert.equal(workerResults[1].reliable, false);
  assert.equal(workerResults[2].reliable, true);
  assert.equal(workerResults[3], null);
  const cancelResult = await enabled.page.evaluate(async code => {
    const module = window.__boundaries;
    const alreadyAborted = new AbortController();
    alreadyAborted.abort();
    const first = await module.administrativeMapBounds(1, 0, { signal: alreadyAborted.signal }).catch(error => error.name);
    const active = new AbortController();
    const cancelled = module.administrativeMapBounds(52, 0, { signal: active.signal }).catch(error => error.name);
    active.abort();
    const second = await cancelled;
    const retained = await module.administrativeMapBounds(68, code);
    return { first, second, retained, workers: window.__workerCount };
  }, feature.properties.code);
  assert.equal(cancelResult.first, 'AbortError');
  assert.equal(cancelResult.second, 'AbortError');
  assert.deepEqual(cancelResult.retained, expectedBounds, 'Cancelling one request does not discard the reusable worker or cached geometry');
  assert.equal(cancelResult.workers, 1, 'Bounds and coordinates share the worker');

  const blocked = await setup('blocked');
  assert.deepEqual((await profile(blocked.page)).bounds, expectedBounds, 'Browser worker restrictions fall back to the exact geometry path');
  const cache = await setup('enabled');
  await cache.page.evaluate(async fixtures => {
    const bounds = fixture => window.__boundaries.administrativeMapBounds(fixture.provinceCode, fixture.wardCode);
    await Promise.all([bounds(fixtures[0]), bounds(fixtures[0])]);
    await bounds(fixtures[1]);
    await bounds(fixtures[2]);
    await bounds(fixtures[0]); // Keep Hanoi recent before a fourth province arrives.
    await bounds(fixtures[3]);
    await bounds(fixtures[2]);
    await bounds(fixtures[1]); // The least recently used province must be read again.
  }, cacheFixtures);
  assert.equal(cache.requests.filter(name => name === 'index.json').length, 1, 'Small province index remains cached');
  assert.equal(cache.requests.filter(name => name === cacheFixtures[0].filename).length, 1, 'Concurrent reads deduplicate and recent data remain cached');
  assert.equal(cache.requests.filter(name => name === cacheFixtures[1].filename).length, 2, 'Only the three most recent parsed province files are retained');
  assert.equal(cache.requests.filter(name => name === cacheFixtures[2].filename).length, 1);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed: 'Boundary worker parity, reuse, cancellation, fallback, bounded LRU cache and no browser errors', cpuSlowdown: 4, worker: workerProfile, mainThreadFallback: fallbackProfile }));
  await Promise.all([enabled.context.close(), disabled.context.close(), blocked.context.close(), cache.context.close()]);
} finally {
  await browser.close();
}
