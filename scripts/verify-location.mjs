import assert from 'node:assert/strict';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5180';
const browser = await chromium.launch({ channel: 'chrome', headless: true });

try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    geolocation: { latitude: 10.9042, longitude: 106.7694 },
  });
  await context.grantPermissions(['geolocation'], { origin: base });
  await context.addInitScript(() => localStorage.removeItem('hoanMakeupDraft'));
  let reverseRequests = 0;
  await context.route('**/api/data', async route => {
    if (route.request().method() === 'POST' && route.request().postDataJSON()?.action === 'reverseGeocode') {
      reverseRequests++;
      return route.fulfill({ json: {
        fullAddress: '123 Đường A, Phường Tân Đông Hiệp, Dĩ An, Bình Dương',
        address: '123 Đường A',
        city: 'Bình Dương',
        district: 'Dĩ An',
        ward: 'Phường Tân Đông Hiệp',
      } });
    }
    return route.continue();
  });

  const page = await context.newPage();
  await page.goto(base + '/#/booking/location');
  await page.getByText('34 mục', { exact: true }).waitFor();
  await page.waitForLoadState('networkidle');
  await page.locator('[name="city"]').fill('ho chi minh');
  await page.locator('[name="city"]').dispatchEvent('change');
  assert.equal(await page.locator('[name="city"]').inputValue(), 'Thành phố Hồ Chí Minh');
  await page.locator('[name="ward"]').fill('tan dong hiep');
  await page.locator('[name="ward"]').dispatchEvent('change');
  assert.equal(await page.locator('[name="ward"]').inputValue(), 'Phường Tân Đông Hiệp');

  await page.locator('[data-action="detect-location"]').click();
  await page.getByText('ĐÃ XÁC ĐỊNH', { exact: true }).waitFor();
  assert.equal(reverseRequests, 1);
  assert.equal(await page.locator('[name="address"]').inputValue(), '123 Đường A');
  assert.equal(await page.locator('[name="city"]').inputValue(), 'Thành phố Hồ Chí Minh');
  assert.equal(await page.locator('[name="district"]').inputValue(), 'Thành phố Dĩ An');
  assert.equal(await page.locator('[name="ward"]').inputValue(), 'Phường Tân Đông Hiệp');

  await page.locator('[name="address"]').fill('125 Đường A');
  await page.getByText('NHẬP THỦ CÔNG', { exact: true }).waitFor();
  assert.equal(await page.getByText('ĐÃ XÁC ĐỊNH', { exact: true }).count(), 0);
  await context.close();

  const deniedContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await deniedContext.addInitScript(() => {
    localStorage.removeItem('hoanMakeupDraft');
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition(_success, error) { error({ code: 1, message: 'Permission denied' }); } },
    });
  });
  let deniedReverseRequests = 0;
  await deniedContext.route('**/api/data', async route => {
    if (route.request().method() === 'POST' && route.request().postDataJSON()?.action === 'reverseGeocode') {
      deniedReverseRequests++;
      return route.fulfill({ json: { city: 'Sai vị trí' } });
    }
    return route.continue();
  });
  const deniedPage = await deniedContext.newPage();
  await deniedPage.goto(base + '/#/booking/location');
  await deniedPage.locator('[data-action="detect-location"]').click();
  await deniedPage.locator('.mockup-location-error').getByText(/Quyền định vị đang bị chặn/).waitFor();
  assert.equal(deniedReverseRequests, 0, 'Permission denial must not fall back to an inaccurate IP address.');
  assert.equal(await deniedPage.getByText('ĐANG XÁC ĐỊNH...', { exact: true }).count(), 0);
  await deniedContext.close();

  const slowContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await slowContext.addInitScript(() => localStorage.removeItem('hoanMakeupDraft'));
  for (const url of ['**/data/vietnam-administrative-latest.json', '**/data/vietnam-legacy-districts.json']) {
    await slowContext.route(url, async route => {
      await new Promise(resolve => setTimeout(resolve, 900));
      await route.continue();
    });
  }
  await slowContext.route('**/api/data', async route => {
    await new Promise(resolve => setTimeout(resolve, 1400));
    await route.continue();
  });
  const slowPage = await slowContext.newPage();
  await slowPage.goto(base + '/#/booking/location', { waitUntil: 'domcontentloaded' });
  await slowPage.waitForTimeout(250);
  await slowPage.evaluate(() => {
    window.scrollTo(0, 650);
    document.querySelector('[name="address"]')?.focus();
  });
  const scrollBefore = await slowPage.evaluate(() => window.scrollY);
  assert.ok(scrollBefore > 0, 'The mobile page must be scrollable for the jump regression check.');
  await slowPage.waitForTimeout(1800);
  assert.equal(await slowPage.evaluate(() => document.activeElement?.getAttribute('name')), 'address');
  assert.equal(await slowPage.evaluate(() => window.scrollY), scrollBefore);
  await slowContext.close();

  console.log('PASS searchable locations, GPS handling, manual reset, and no background-render scroll jump');
} finally {
  await browser.close();
}
