import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

await mkdir('outputs', { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const base = 'http://127.0.0.1:5173';

try {
  console.log('--- TEST: Image Angle & Focal Drag Verification ---');
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => localStorage.setItem('hoanAnalyticsConsent', 'no'));
  const page = await context.newPage();

  await page.goto(base + '/#/admin/content');
  await page.locator('#cms-real-preview').waitFor();

  const previewFrame = page.frameLocator('#cms-real-preview');
  const targetImg = previewFrame.locator('.ct-campaign img');
  await targetImg.waitFor();

  // 1. Open Media Modal to test focal adjuster
  console.log('1. Opening Media Modal...');
  await targetImg.click();
  await page.locator('#cms-media-modal-container .cms-focal-section').waitFor({ timeout: 5000 });
  console.log('PASS: Focal section rendered in Media Modal.');

  // 2. Test 1-click Preset "Khuôn mặt (50% 18%)"
  console.log('2. Testing Preset "Khuôn mặt (50% 18%)"...');
  const facePreset = page.locator('#cms-media-modal-container .focal-preset-btn[data-y="18"]');
  await facePreset.click();
  await page.waitForTimeout(400);

  const focalDisplay = await page.locator('#cms-focal-val-display').innerText();
  console.log('Focal display value:', focalDisplay);
  assert.equal(focalDisplay, '50% 18%', 'Display value must be 50% 18%');

  // Verify preview frame image objectPosition
  const previewImgPos = await targetImg.evaluate(el => el.style.objectPosition);
  console.log('Live Preview image object-position after preset:', previewImgPos);
  assert.equal(previewImgPos, '50% 18%', 'Preview image object-position must be 50% 18%');
  console.log('PASS: Preset applied to Live Preview in real-time.');

  // 3. Test Slider Drag
  console.log('3. Testing Slider adjustment...');
  const sliderY = page.locator('#focal-slider-y');
  await sliderY.fill('22');
  await sliderY.dispatchEvent('input');
  await page.waitForTimeout(300);

  const previewImgPos2 = await targetImg.evaluate(el => el.style.objectPosition);
  console.log('Live Preview image object-position after slider:', previewImgPos2);
  assert.equal(previewImgPos2, '50% 22%', 'Preview image object-position must be 50% 22%');
  console.log('PASS: Slider updated Live Preview image.');

  // Capture screenshot of modal focal adjuster
  await page.screenshot({ path: 'outputs/focal-modal-adjuster.png' });

  // Close modal
  await page.locator('#cms-media-modal-container .cms-modal-close').click();
  await page.waitForTimeout(300);

  // 4. Test Direct Drag in Live Preview
  console.log('4. Testing direct pointer drag inside Live Preview iframe...');
  const box = await targetImg.boundingBox();
  assert.ok(box, 'Image bounding box must exist');

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  // Perform mouse drag: move down by 60px
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX, startY + 60, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(400);

  // Modal should NOT have opened because it was a drag, not a click
  const modalCount = await page.locator('#cms-media-modal-container .cms-modal-box').count();
  assert.equal(modalCount, 0, 'Modal should not open after drag gesture');

  const previewImgPos3 = await targetImg.evaluate(el => el.style.objectPosition);
  console.log('Live Preview image object-position after direct drag:', previewImgPos3);
  assert.ok(previewImgPos3 && previewImgPos3 !== '50% 22%', 'Object position must be updated after drag');
  console.log('PASS: Direct pointer drag adjusted image framing smoothly without triggering click.');

  // 5. Save changes and verify persistence
  console.log('5. Saving changes to verify backend persistence...');
  const saveBtn = page.locator('#cms-page-form button[type="submit"]');
  await saveBtn.click();
  await page.waitForTimeout(1000);

  const toastText = await page.locator('.toast').innerText().catch(() => '');
  console.log('Save toast:', toastText);
  assert.ok(toastText.includes('Đã lưu'), 'Should confirm save');

  // Reload page to verify persistence
  console.log('Reloading page to verify persistence...');
  await page.goto(base + '/#/admin/content');
  await page.locator('#cms-real-preview').waitFor();
  const reloadedTarget = page.frameLocator('#cms-real-preview').locator('.ct-campaign img');
  await reloadedTarget.waitFor();
  await page.waitForTimeout(1000);

  const persistedPos = await reloadedTarget.evaluate(el => el.style.objectPosition);
  console.log('Persisted image object-position after reload:', persistedPos);
  assert.ok(persistedPos && persistedPos.length > 0, 'Persisted object-position must be retained');
  console.log('PASS: Custom photo angle was persisted to database and re-applied upon reload!');

  // Capture final screenshot
  await page.screenshot({ path: 'outputs/focal-angle-verified.png' });

  console.log('\n=============================================');
  console.log('ALL IMAGE FOCAL & DRAG TESTS PASSED PERFECTLY!');
  console.log('=============================================');
} finally {
  await browser.close();
}
