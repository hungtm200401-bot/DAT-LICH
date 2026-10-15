import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

async function capture() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  await context.addInitScript(() => {
    localStorage.setItem('hoanAnalyticsConsent', 'no');
  });
  const page = await context.newPage();

  console.log('1. Capturing tab Cá nhân (now with 3 full cards, no empty space)...');
  await page.goto('http://127.0.0.1:5173/#/services?filter=personal');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'outputs/new_services_filter_personal_full.png' });

  console.log('2. Capturing tab Dự tiệc (3 full cards)...');
  await page.goto('http://127.0.0.1:5173/#/services?filter=party');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'outputs/new_services_filter_party_full.png' });

  console.log('3. Capturing tab Cô dâu (3 full cards)...');
  await page.goto('http://127.0.0.1:5173/#/services?filter=bridal');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'outputs/new_services_filter_bridal_full.png' });

  console.log('4. Capturing tab Tất cả (4 main services)...');
  await page.goto('http://127.0.0.1:5173/#/services?filter=all');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'outputs/new_services_filter_all.png' });

  console.log('5. Capturing detail page when clicking Xem chi tiết (matches Image 2)...');
  await page.goto('http://127.0.0.1:5173/#/services/personal/port-personal-1');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'outputs/new_service_detail_matching_sample.png' });

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
