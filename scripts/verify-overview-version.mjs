import assert from 'node:assert/strict';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';
import { readFile } from 'node:fs/promises';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
const expectedBuild = JSON.parse(await readFile(new URL('../public/app-version.json', import.meta.url), 'utf8')).build;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const snapshot = { services: [], appointments: [], customers: [], requests: [], notifications: [], paymentTransactions: [], scheduleSlots: [], bookingDetails: {}, brand: {}, settings: {} };
const writes = [];
try {
  for (const editing of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    let appRequests = 0;
    await context.route('**/api/**', route => {
      const request = route.request(), path = new URL(request.url()).pathname;
      if (request.method() !== 'GET') { writes.push(path); return route.fulfill({ json: {} }); }
      return route.fulfill({ json: path === '/api/data' ? snapshot : path === '/api/site-content' ? { pages: {}, drafts: {} } : { shared: { value: {}, revision: '' }, media: { value: [], revision: '' }, templates: { value: [], revision: '' } } });
    });
    await context.route('**/app.js?*', route => {
      appRequests++;
      if (appRequests > 1) return route.continue();
      return route.fulfill({ contentType: 'application/javascript', body: `
        window.__hoanAppStarted = true;
        window.__hoanAppBuild = 'location-auto-fill-1';
        window.__legacyOverviewFixture = true;
        document.getElementById('app').innerHTML = '<div id="legacy-overview">Old overview with four cards</div>';
        ${editing ? `document.getElementById('modal-root').innerHTML = '<div class="modal"><input value="unsaved fixture"></div>';` : ''}
      ` });
    });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/#/admin/');
    if (editing) {
      await page.locator('#legacy-overview').waitFor();
      await page.waitForTimeout(200);
      assert.equal(appRequests, 1, 'An open edit form must prevent a version reload');
      assert.equal(await page.locator('.modal input').inputValue(), 'unsaved fixture');
      await page.evaluate(() => { document.getElementById('modal-root').innerHTML = ''; window.dispatchEvent(new Event('focus')); });
    }
    await page.waitForURL(url => url.searchParams.get('_hoan_update') === expectedBuild);
    await page.locator('[data-overview-version="workspace-4"]').waitFor();
    assert.equal(await page.locator('.overview-stat').count(), 3);
    assert.equal(await page.locator('#legacy-overview').count(), 0);
    assert.equal(await page.locator('.overview-cash-chart,.overview-activity').count(), 2);
    assert.equal(await page.evaluate(() => window.__hoanAppBuild), expectedBuild);
    await page.waitForFunction(() => { const node=document.querySelector('.overview-stats'); return node&&getComputedStyle(node).display==='grid'; });
    assert.equal(await page.locator('.overview-stats').evaluate(node => getComputedStyle(node).display), 'grid');
    assert.deepEqual(errors, []);
    await context.close();
  }
  assert.deepEqual(writes, []);
  console.log('PASS overview recovery: legacy admin scripts reload to matching current layout; open edit forms are preserved until closed; no reload loop or business writes.');
} finally { await browser.close(); }
