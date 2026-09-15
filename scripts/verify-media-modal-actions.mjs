import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

await mkdir('outputs', { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const base = 'http://127.0.0.1:5173';

try {
  console.log('--- TEST: Comprehensive Media Modal Button & Image Replace Verification ---');
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => localStorage.setItem('hoanAnalyticsConsent', 'no'));
  const page = await context.newPage();

  await page.goto(base + '/#/admin/content');
  await page.locator('#cms-real-preview').waitFor();

  const previewFrame = page.frameLocator('#cms-real-preview');
  const targetImg = previewFrame.locator('.ct-campaign img');
  await targetImg.waitFor();

  const initialSrc = await targetImg.getAttribute('src');
  console.log('Initial image src in Live Preview:', initialSrc);

  // 1. Click image in preview to open Media Modal
  console.log('1. Clicking image in Live Preview to open Media Modal...');
  await targetImg.click();
  await page.locator('#cms-media-modal-container .cms-modal-box').waitFor({ timeout: 5000 });
  console.log('PASS: Media Modal opened.');

  // 2. Test Category Tab click
  console.log('2. Testing Category Tab click ("Cô dâu")...');
  const bridalTab = page.locator('#cms-media-modal-container .modal-tab-btn[data-tab="bridal"]');
  await bridalTab.click();
  const visibleBridal = await page.locator('#cms-media-modal-container .cms-gallery-item:visible').count();
  console.log(`Visible items under "Cô dâu" tab: ${visibleBridal}`);
  assert.ok(visibleBridal > 0, 'Should have visible bridal items');

  const allTab = page.locator('#cms-media-modal-container .modal-tab-btn[data-tab="all"]');
  await allTab.click();
  const visibleAll = await page.locator('#cms-media-modal-container .cms-gallery-item:visible').count();
  console.log(`Visible items under "Tất cả ảnh" tab: ${visibleAll}`);
  assert.ok(visibleAll > visibleBridal, 'All tab should display more items');
  console.log('PASS: Tabs filter photos correctly.');

  // 3. Test Close Button "✕"
  console.log('3. Testing "✕" close button...');
  const closeXBtn = page.locator('#cms-media-modal-container .cms-modal-close');
  await closeXBtn.click();
  await page.waitForTimeout(300);
  assert.equal(await page.locator('#cms-media-modal-container .cms-modal-box').count(), 0, 'Modal must close on clicking "✕" button');
  console.log('PASS: "✕" button closed the modal.');

  // 4. Re-open and test Footer "Đóng" button
  console.log('4. Re-opening modal and testing footer "Đóng" button...');
  await targetImg.click();
  await page.locator('#cms-media-modal-container .cms-modal-box').waitFor({ timeout: 5000 });
  const footerCloseBtn = page.locator('#cms-media-modal-container .cms-modal-footer button[data-action="close-media-modal"]');
  await footerCloseBtn.click();
  await page.waitForTimeout(300);
  assert.equal(await page.locator('#cms-media-modal-container .cms-modal-box').count(), 0, 'Modal must close on clicking footer "Đóng" button');
  console.log('PASS: Footer "Đóng" button closed the modal.');

  // 5. Re-open and test clicking Backdrop Overlay outside modal box
  console.log('5. Re-opening modal and testing clicking backdrop overlay...');
  await targetImg.click();
  await page.locator('#cms-media-modal-container .cms-modal-box').waitFor({ timeout: 5000 });
  // Click at top-left outside the modal box
  await page.mouse.click(10, 10);
  await page.waitForTimeout(300);
  assert.equal(await page.locator('#cms-media-modal-container .cms-modal-box').count(), 0, 'Modal must close on clicking overlay outside box');
  console.log('PASS: Backdrop overlay click closed the modal.');

  // 6. Re-open and SELECT a photo thumbnail to replace the image!
  console.log('6. Re-opening modal and clicking a photo to REPLACE the image...');
  await targetImg.click();
  await page.locator('#cms-media-modal-container .cms-modal-box').waitFor({ timeout: 5000 });

  const chooseSrc = '/assets/evening.png';
  console.log(`Selecting photo thumbnail with src: ${chooseSrc}...`);
  const photoItem = page.locator(`#cms-media-modal-container .cms-gallery-item[data-src="${chooseSrc}"]`);
  await photoItem.click();

  // Modal must close
  await page.waitForTimeout(400);
  assert.equal(await page.locator('#cms-media-modal-container .cms-modal-box').count(), 0, 'Modal must close upon selecting a photo');

  // Verify toast
  const toastText = await page.locator('.toast').innerText().catch(() => '');
  console.log('Toast message displayed:', toastText);
  assert.ok(toastText.includes('thành công') || toastText.includes('Đã chọn'), 'Toast should confirm selection');

  // Verify updated src in Live Preview iframe!
  await page.waitForTimeout(500);
  const updatedSrc = await targetImg.getAttribute('src');
  console.log('Updated image src in Live Preview:', updatedSrc);
  assert.equal(updatedSrc, chooseSrc, `Live Preview image src must be updated to ${chooseSrc}`);
  console.log('PASS: Image was successfully replaced in Live Preview!');

  // Take screenshot of replaced image
  await page.screenshot({ path: 'outputs/verify-image-replaced-in-preview.png' });

  // 7. Test custom URL application
  console.log('7. Testing custom URL input application...');
  await targetImg.click();
  await page.locator('#cms-media-modal-container .cms-modal-box').waitFor({ timeout: 5000 });
  const urlInput = page.locator('#modal-custom-url-input');
  await urlInput.fill('/assets/hero.png');
  const applyUrlBtn = page.locator('#cms-media-modal-container button[data-action="apply-custom-url"]');
  await applyUrlBtn.click();
  await page.waitForTimeout(500);
  assert.equal(await page.locator('#cms-media-modal-container .cms-modal-box').count(), 0, 'Modal must close upon applying custom URL');
  const customSrc = await targetImg.getAttribute('src');
  assert.equal(customSrc, '/assets/hero.png', 'Live preview image src should match custom URL');
  console.log('PASS: Custom URL applied successfully!');

  // 8. Test Text Modal Close "✕" and Save
  console.log('8. Testing Text Modal "✕" close button...');
  const heroH1 = previewFrame.locator('.ct-campaign-copy h1');
  await heroH1.click();
  await page.locator('#cms-text-modal-container .cms-modal-box').waitFor({ timeout: 5000 });
  const textCloseX = page.locator('#cms-text-modal-container .cms-modal-close');
  await textCloseX.click();
  await page.waitForTimeout(300);
  assert.equal(await page.locator('#cms-text-modal-container .cms-modal-box').count(), 0, 'Text modal closed with "✕"');
  console.log('PASS: Text Modal "✕" closed successfully.');

  console.log('\n=============================================');
  console.log('ALL MEDIA & TEXT MODAL TESTS PASSED PERFECTLY!');
  console.log('=============================================');
} finally {
  await browser.close();
}
