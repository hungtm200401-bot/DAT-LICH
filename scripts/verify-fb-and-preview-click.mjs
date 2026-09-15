import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

await mkdir('outputs', { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const base = 'http://127.0.0.1:5173';

try {
  // ==========================================
  // TEST 1: LIVE PREVIEW CLICK-TO-EDIT
  // ==========================================
  console.log('--- TEST 1: Live Preview Click-to-Edit ---');
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await adminContext.addInitScript(() => localStorage.setItem('hoanAnalyticsConsent', 'no'));
  const adminPage = await adminContext.newPage();

  await adminPage.goto(base + '/#/admin/content');
  await adminPage.locator('#cms-real-preview').waitFor();

  const previewFrame = adminPage.frameLocator('#cms-real-preview');
  await previewFrame.locator('.ct-campaign img').waitFor();
  await adminPage.waitForFunction(() => document.querySelector('#cms-status')?.textContent && !document.querySelector('#cms-status').textContent.includes('Đang đồng bộ'));
  await previewFrame.locator('img[data-cms-key]').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  await adminPage.waitForTimeout(600);

  // 1A. Click on image -> Media Modal must open
  console.log('Clicking on image in Live Preview...');
  await previewFrame.locator('.ct-campaign img').click();
  await adminPage.locator('#cms-media-modal-container .cms-image-dialog').waitFor({ timeout: 5000 });
  const mediaModalText = await adminPage.locator('#cms-media-modal-container').innerText();
  assert.ok(mediaModalText.includes('Chỉnh sửa ảnh') || mediaModalText.includes('Thay ảnh'), 'Media modal must display photo editor');
  await adminPage.screenshot({ path: 'outputs/verify-preview-image-click.png' });
  console.log('PASS: Media Modal opened upon clicking image.');

  // Close with Escape
  await adminPage.keyboard.press('Escape');
  await adminPage.waitForTimeout(300);
  assert.equal(await adminPage.locator('#cms-media-modal-container .cms-image-dialog').count(), 0, 'Media modal closed with Escape');

  // 1B. Click on text -> Text Modal must open
  console.log('Clicking on text in Live Preview...');
  await previewFrame.locator('.ct-campaign-copy h1').click();
  await adminPage.locator('#cms-text-modal-container .cms-modal-box').waitFor({ timeout: 5000 });
  const textModalContent = await adminPage.locator('#cms-text-modal-container').innerText();
  assert.ok(textModalContent.includes('Chỉnh sửa văn bản trực tiếp'), 'Text modal must display direct text editor');
  await adminPage.screenshot({ path: 'outputs/verify-preview-text-click.png' });
  console.log('PASS: Text Modal opened upon clicking text.');

  // Close with Escape
  await adminPage.keyboard.press('Escape');
  await adminPage.waitForTimeout(300);
  assert.equal(await adminPage.locator('#cms-text-modal-container .cms-modal-box').count(), 0, 'Text modal closed with Escape');

  // ==========================================
  // TEST 2: FACEBOOK URL & NAME AUTO-TRACKING
  // ==========================================
  console.log('\n--- TEST 2: Facebook URL & Name Auto-Tracking ---');
  const visitorContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const visitorPage = await visitorContext.newPage();

  const testFbName = 'Thu Trang Bridal';
  const testFbUrl = 'https://www.facebook.com/thutrang.makeup';

  console.log('Visiting page with Facebook tracking query parameters...');
  await visitorPage.goto(`${base}/#/?fb_name=${encodeURIComponent(testFbName)}&fb_url=${encodeURIComponent(testFbUrl)}`);

  // If consent banner exists, accept
  const acceptBtn = visitorPage.locator('[data-visit-action="accept"]');
  if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptBtn.click();
    console.log('Accepted analytics consent.');
  }

  // Browse to a subpage to trigger events
  await visitorPage.waitForTimeout(1000);
  await visitorPage.evaluate(() => window.location.hash = '#/services');
  await visitorPage.waitForTimeout(1200);

  // Check admin visitors table
  console.log('Opening Admin Visitors to verify tracked profile...');
  await adminPage.goto(base + '/#/admin/visitors');
  await adminPage.locator('.visit-table').waitFor();

  // Wait for session with testFbName to appear
  const maxTries = 10;
  let found = false;
  for (let i = 0; i < maxTries; i++) {
    const tableText = await adminPage.locator('.visit-table').innerText();
    if (tableText.includes(testFbName)) {
      found = true;
      break;
    }
    await adminPage.waitForTimeout(1000);
    await adminPage.reload();
    await adminPage.locator('.visit-table').waitFor();
  }

  assert.ok(found, `Expected visitor table to contain "${testFbName}"`);

  // Verify direct link to Facebook
  const directLink = adminPage.locator('.btn-fb-direct-link').first();
  await directLink.waitFor();
  const directHref = await directLink.getAttribute('href');
  assert.equal(directHref, testFbUrl, `Direct link href must equal "${testFbUrl}"`);
  const linkText = await directLink.innerText();
  assert.ok(linkText.includes('Mở Facebook cá nhân'), 'Button text must say "Mở Facebook cá nhân"');

  // Verify Haute Couture: NO raw emoji/pictographs in #main
  const mainText = await adminPage.locator('#main').innerText();
  assert.doesNotMatch(mainText, /[\p{Extended_Pictographic}]/u, 'No decorative emoji pictographs in admin table');

  await adminPage.screenshot({ path: 'outputs/verify-facebook-visitor-table.png', fullPage: true });
  console.log('PASS: Visitor was recorded with Facebook Name and clickable direct profile link.');

  console.log('\n=============================================');
  console.log('ALL TESTS PASSED WITH 0 ERRORS!');
  console.log('=============================================');
} finally {
  await browser.close();
}
