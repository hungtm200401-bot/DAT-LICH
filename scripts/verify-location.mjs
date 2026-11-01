import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
const directory = JSON.parse(await readFile('public/data/vietnam-administrative-latest.json', 'utf8'));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [];
await mkdir('outputs/booking-location', { recursive: true });
async function context(options = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', ...options });
  await ctx.addInitScript(() => { window.maplibregl = { supported: () => false }; });
  await ctx.addInitScript(() => { try { localStorage.removeItem('hoanMakeupDraft'); localStorage.setItem('hoanAnalyticsConsent', 'no'); } catch {} });
  ctx.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  return ctx;
}
async function open(ctx) {
  const page = await ctx.newPage();
  await page.goto(base + '/?v=158#/booking/location');
  await page.locator('#booking-city:not([disabled])').waitFor();
  return page;
}
async function choose(page, field, query, name) {
  await page.locator(`#booking-${field}`).fill(query);
  await page.locator(`#location-${field}-options`).getByRole('option', { name, exact: true }).click();
  assert.equal(await page.locator(`#booking-${field}`).inputValue(), name);
}
async function status(page, pattern) {
  await page.locator('[data-location-status]').filter({ hasText: pattern }).waitFor();
  assert.equal(await page.locator('[data-location-detect]').isEnabled(), true);
}
try {
  const ctx = await context({ geolocation: { latitude: 21.1, longitude: 105.5, accuracy: 30 } });
  await ctx.grantPermissions(['geolocation'], { origin: base });
  let mode = 'partial', reverseRequests = 0, release, started;
  await ctx.route('**/api/data', async route => {
    if (route.request().method() !== 'POST' || route.request().postDataJSON()?.action !== 'reverseGeocode') return route.continue();
    reverseRequests++;
    assert.equal(route.request().postDataJSON().lat, 21.1);
    if (mode === 'fallback') return route.fulfill({ status: 503, json: { error: 'Offline' } });
    if (mode === 'slow') await new Promise(resolve => { release = resolve; started(); });
    return route.fulfill({ json: { address: mode === 'partial' ? '' : '12 Đường A', addressDistance: 5, city: 'Thành phố Hà Nội', ward: mode === 'partial' ? 'Xã Phúc Thọ' : 'Phường Tùng Thiện', countryCode: 'vn' } });
  });
  await ctx.route('https://api.bigdatacloud.net/**', route => route.fulfill({ json: { city: 'Phúc Thọ', principalSubdivision: 'Hà Nội', locality: 'Phúc Thọ', countryCode: 'VN' } }));
  const page = await open(ctx);
  assert.equal(await page.locator('#booking-city').inputValue(), '');
  assert.equal(await page.locator('#booking-ward').isDisabled(), true);
  assert.equal(await page.locator('.booking-location svg, .mockup-gps-tag, .mockup-location-count, [name="district"]').count(), 0);
  await page.screenshot({ path: 'outputs/booking-location/desktop.png', fullPage: true });
  await page.locator('#booking-city').focus();
  assert.equal(await page.locator('#location-city-options [role="option"]').count(), 34);
  for (const province of directory) {
    await choose(page, 'city', province.name, province.name);
    await page.locator('#booking-ward').focus();
    assert.equal(await page.locator('#location-ward-options [role="option"]').count(), province.wards.length, province.name);
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('End'); await page.keyboard.press('Enter');
    assert.equal(await page.locator('#booking-ward').inputValue(), province.wards.at(-1).name);
  }
  await choose(page, 'city', 'ha noi', 'Thành phố Hà Nội');
  assert.equal(await page.locator('#booking-ward').inputValue(), '');
  await choose(page, 'ward', 'phuc tho', 'Xã Phúc Thọ');
  await choose(page, 'ward', 'phung thuong', 'Xã Phúc Thọ');
  await page.locator('#booking-city').fill('Phúc Thọ');
  await page.locator('[data-action="ct-next"]').click();
  assert.ok(page.url().includes('#/booking/location'));
  assert.equal(await page.locator('#booking-city').getAttribute('aria-invalid'), 'true');
  await page.locator('#booking-city').press('Escape');
  await page.locator('[data-location-detect]').click();
  await status(page, /Nhập số nhà/);
  assert.equal(await page.locator('#booking-city').inputValue(), 'Thành phố Hà Nội');
  assert.equal(await page.locator('#booking-ward').inputValue(), 'Phường Tùng Thiện');
  assert.equal(await page.locator('#booking-address').inputValue(), '');
  assert.equal(await page.locator('[data-location-status]').evaluate(node => node.classList.contains('is-error')), false);
  assert.ok((await page.locator('[data-location-map]').getAttribute('href')).includes('21.1%2C105.5'));
  mode = 'complete';
  await page.locator('[data-location-detect]').click(); await status(page, /Đã điền địa chỉ/);
  assert.equal(await page.locator('#booking-address').inputValue(), '12 Đường A');
  await page.screenshot({ path: 'outputs/booking-location/gps-filled.png', fullPage: true });
  await page.locator('#booking-address').fill('14 Đường A');
  assert.equal(await page.locator('[data-location-status]').isVisible(), false);
  await page.locator('#booking-location-note').fill('Tầng 2');
  await page.locator('[data-action="ct-next"]').click(); await page.waitForURL(/#\/booking\/info$/);
  assert.equal(await page.evaluate(() => window.state.booking.city), 'Thành phố Hà Nội');
  assert.equal(await page.evaluate(() => window.state.booking.address), '14 Đường A');
  await page.locator('[data-action="booking-back"]').click(); await page.waitForURL(/#\/booking\/location$/);
  assert.equal(await page.locator('#booking-location-note').inputValue(), 'Tầng 2');
  mode = 'fallback';
  await page.locator('[data-location-detect]').click(); await status(page, /Đã giữ địa chỉ/);
  assert.equal(await page.locator('#booking-address').inputValue(), '14 Đường A');
  assert.equal(await page.locator('#booking-city').inputValue(), 'Thành phố Hà Nội');
  mode = 'slow';
  const pending = new Promise(resolve => { started = resolve; });
  await page.locator('[data-location-detect]').click();
  await page.locator('[data-location-status]').filter({ hasText: /Đang đối chiếu địa chỉ/ }).waitFor();
  await pending;
  await page.locator('#booking-address').fill('Địa chỉ nhập trong lúc định vị');
  if (release) release();
  await page.waitForFunction(() => !window.state.booking.isDetectingLocation);
  assert.equal(await page.locator('#booking-address').inputValue(), 'Địa chỉ nhập trong lúc định vị');
  assert.equal(await page.locator('[data-location-map]').isVisible(), false);
  assert.ok(reverseRequests >= 4);
  for (const width of [1024, 700, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `overflow ${width}`);
    if (width === 390) {
      await page.evaluate(() => document.activeElement.blur());
      await page.screenshot({ path: 'outputs/booking-location/mobile.png', fullPage: true });
      await choose(page, 'city', 'ho chi minh', 'Thành phố Hồ Chí Minh'); await choose(page, 'ward', 'ben thanh', 'Phường Bến Thành');
    }
  }
  await ctx.close();
  for (const code of [1, 3]) {
    const denied = await context({ viewport: { width: 390, height: 844 } });
    await denied.addInitScript(code => Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition(_success, reject) { reject({ code }); } } }), code);
    let requests = 0;
    await denied.route('**/api/data', route => {
      if (route.request().method() === 'POST' && route.request().postDataJSON()?.action === 'reverseGeocode') requests++;
      return route.continue();
    });
    const deniedPage = await open(denied);
    await deniedPage.locator('[data-location-detect]').click();
    await status(deniedPage, code === 1 ? /Quyền định vị đang bị chặn/ : /chưa cung cấp tọa độ/);
    assert.equal(requests, 0); assert.equal(await deniedPage.locator('#booking-city').inputValue(), '');
    await choose(deniedPage, 'city', 'ha noi', 'Thành phố Hà Nội'); await choose(deniedPage, 'ward', 'phuc tho', 'Xã Phúc Thọ');
    await deniedPage.locator('#booking-address').fill('Thôn A');
    await deniedPage.locator('[data-action="ct-next"]').click(); await deniedPage.waitForURL(/#\/booking\/info$/);
    await denied.close();
  }
  const failed = await context(); let failDirectory = true;
  await failed.route('**/data/vietnam-administrative-latest.json', route => failDirectory ? route.fulfill({ status: 503, body: '' }) : route.continue());
  const failedPage = await failed.newPage(); await failedPage.goto(base + '/?v=158#/booking/location');
  await failedPage.locator('[data-location-retry]').waitFor(); await failedPage.locator('[data-action="ct-next"]').click();
  assert.ok(failedPage.url().includes('#/booking/location'));
  failDirectory = false; await failedPage.locator('[data-location-retry]').click(); await failedPage.locator('#booking-city:not([disabled])').waitFor();
  await failed.close();
  const slow = await context({ viewport: { width: 390, height: 844 } });
  let releaseDirectory;
  const directoryRequested = new Promise(resolve => {
    slow.route('**/data/vietnam-administrative-latest.json', route => new Promise(done => {
      releaseDirectory = async () => { await route.continue(); done(); };
      resolve();
    }));
  });
  const slowPage = await slow.newPage(); await slowPage.goto(base + '/?v=159#/booking/location', {waitUntil:'domcontentloaded'});
  await directoryRequested;
  await slowPage.locator('#booking-address').fill('Nội dung giữ lại khi danh sách đang tải');
  const scrollBefore = await slowPage.evaluate(() => scrollY);
  await releaseDirectory();
  await slowPage.locator('#booking-city:not([disabled])').waitFor();
  assert.equal(await slowPage.locator('#booking-address').inputValue(), 'Nội dung giữ lại khi danh sách đang tải');
  assert.equal(await slowPage.evaluate(() => document.activeElement?.id), 'booking-address');
  assert.ok(Math.abs(await slowPage.evaluate(() => scrollY) - scrollBefore) < 2);
  await slow.close();
  const touch = await context({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const touchPage = await open(touch);
  await touchPage.locator('#booking-city').tap(); await touchPage.locator('#booking-city').fill('ha noi');
  await touchPage.getByRole('option', { name: 'Thành phố Hà Nội', exact: true }).tap();
  await touchPage.locator('#booking-ward').tap(); await touchPage.locator('#booking-ward').fill('phuc tho');
  await touchPage.getByRole('option', { name: 'Xã Phúc Thọ', exact: true }).tap();
  await touchPage.locator('#booking-address').fill('Thôn A'); await touchPage.locator('[data-action="ct-next"]').tap();
  await touchPage.waitForURL(/#\/booking\/info$/); await touch.close();
  const invalid = await fetch(base + '/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reverseGeocode', lat: 100, lon: 105 }) });
  assert.equal(invalid.status, 400); assert.deepEqual(errors, []);
  console.log('PASS all 34 provinces and 3321 wards without truncation; keyboard/search; dependent fields/validation; GPS full/partial/fallback/denied/timeout/stale response; manual edits and booking continuation; directory retry; 4 responsive widths; API coordinates; no browser errors.');
} finally { await browser.close(); }
