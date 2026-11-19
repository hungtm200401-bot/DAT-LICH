import assert from 'node:assert/strict';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } });
    const writes = [], googleRequests = [];
    await context.addInitScript(() => { localStorage.setItem('hoanAnalyticsConsent', 'no'); localStorage.setItem('hoanAdminToken', 'fixture-token'); });
    await context.route('**/api/**', route => {
      if (route.request().method() !== 'GET') { writes.push(route.request().url()); return route.fulfill({ json: {} }); }
      return route.fulfill({ json: { services: [], appointments: [], customers: [], requests: [], notifications: [], scheduleSlots: [], paymentTransactions: [], bookingDetails: {}, settings: { mapProvider: 'google', googleMapsBrowserKey: 'legacy-unused-key' }, brand: {} } });
    });
    const page = await context.newPage();
    page.on('request', request => { if (/maps\.googleapis\.com|maps\.gstatic\.com/.test(request.url())) googleRequests.push('Google SDK'); });
    await page.goto(base + '/#/admin/settings');
    const panel = page.locator('[data-maps-settings]'); await panel.waitFor();
    assert.match(await panel.innerText(), /OpenFreeMap/); assert.equal(await panel.locator('input').count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    assert.deepEqual(googleRequests, []); assert.deepEqual(writes, []); await context.close();
  }
  const response = await fetch(base + '/api/maps-config');
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { provider: 'openfreemap', searchProvider: 'photon' });
  console.log('PASS maps settings: OpenFreeMap replaces legacy Google controls on desktop/mobile; credential-free public config; no business writes or Google requests.');
} finally { await browser.close(); }
