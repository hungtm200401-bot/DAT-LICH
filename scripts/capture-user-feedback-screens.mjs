import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => localStorage.setItem('hoanAnalyticsConsent', 'no'));
const page = await context.newPage();

try {
  // 1. Content page full-width live preview
  await page.goto('http://127.0.0.1:5173/#/admin/content');
  await page.locator('#cms-real-preview').waitFor();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'outputs/new-full-width-live-preview.png' });

  // 2. Click image in iframe to open media modal
  const frame = page.frameLocator('#cms-real-preview');
  await frame.locator('.ct-campaign img').click();
  await page.locator('#cms-media-modal-container .cms-modal-box').waitFor();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'outputs/new-clean-media-modal-pure-photos.png' });

  // Close media modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // 3. Visitors table
  await page.goto('http://127.0.0.1:5173/#/admin/visitors');
  await page.locator('.visit-table').waitFor();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'outputs/new-visitors-table-perfect.png' });

  // 4. Scroll visitors table down by 800px to capture full table rows
  await page.evaluate(() => window.scrollBy(0, 800));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'outputs/new-visitors-table-rows.png' });

  console.log('Screenshots captured successfully!');
} finally {
  await browser.close();
}
