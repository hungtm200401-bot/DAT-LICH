import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

const base = process.env.TEST_BASE_URL || 'http://localhost:5173';
await mkdir('outputs/image-editor', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
await context.addInitScript(() => localStorage.setItem('hoanAnalyticsConsent', 'no'));
// Keep the user's content intact while exercising save, reload and public rendering.
const pages = {};
let saves = 0, rejectSave = false;
await context.route('**/api/site-content', async route => {
  if (route.request().method() === 'POST') {
    if (rejectSave) return route.fulfill({ status: 409, json: { error: 'Nội dung vừa thay đổi. Vui lòng tải lại.' } });
    const { path, fields } = route.request().postDataJSON();
    pages[path] = { fields, revision: String(++saves), updatedAt: new Date().toISOString() };
    return route.fulfill({ json: { page: pages[path] } });
  }
  return route.fulfill({ json: { pages } });
});
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
let preview;
async function openAdmin() {
  await page.goto(base + '/#/admin/content');
  await page.locator('#cms-real-preview').waitFor();
  await page.waitForLoadState('networkidle');
  preview = await (await page.locator('#cms-real-preview').elementHandle()).contentFrame();
  await preview.waitForSelector('img[data-cms-key="img-4"]');
  await preview.locator('img[data-cms-key]').evaluateAll(images => Promise.all(images.map(image => image.decode())));
}
const img = key => preview.locator(`img[data-cms-key="${key}"]`);
const position = target => target.evaluate(el => getComputedStyle(el).objectPosition);
const scroll = () => page.evaluate(() => ({ parent: scrollY, frame: document.querySelector('#cms-real-preview').contentWindow.scrollY }));
async function settle() { await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); }
async function sameScroll(before) {
  await settle();
  const after = await scroll();
  assert.ok(Math.abs(after.parent - before.parent) < 2, `Parent scroll moved: ${JSON.stringify({ before, after })}`);
  assert.ok(Math.abs(after.frame - before.frame) < 2, `Frame scroll moved: ${JSON.stringify({ before, after })}`);
}
async function openImage(key) {
  await img(key).evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await settle();
  await page.mouse.move(0, 0);
  const before = await scroll();
  await img(key).click();
  await page.locator('.cms-image-dialog[open]').waitFor();
  await page.waitForFunction(() => !document.querySelector('[data-image-apply]').disabled);
  await sameScroll(before);
  return before;
}
async function move(target, dx, dy) {
  const box = await target.boundingBox();
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 8 }); await page.mouse.up();
  await settle();
}
async function setAxis(axis, value) {
  await page.locator(`#focal-slider-${axis}`).fill(String(value));
  await page.locator(`#focal-slider-${axis}`).dispatchEvent('input');
  await settle();
}
async function geometry(target) {
  return target.evaluate(async el => (await import('/image-editor.js')).imageGeometry(el));
}
try {
  await openAdmin();
  const originalFourth = await position(img('img-4'));
  const before = await openImage('img-4');
  assert.ok(before.frame > 400, 'The regression must edit an image below the fold.');
  const liveGeometry = await geometry(img('img-4'));
  const modalImage = page.locator('#cms-focal-target-img');
  const modalGeometry = await geometry(modalImage);
  assert.ok(Math.abs(liveGeometry.width / liveGeometry.height - modalGeometry.width / modalGeometry.height) < 0.003, 'Editor must use the exact live aspect ratio.');
  assert.equal(await position(modalImage), originalFourth, 'Opening must preserve stylesheet position.');
  await setAxis('y', 60);
  const start = await position(modalImage);
  await move(page.locator('.cms-image-frame'), 0, 24);
  const moved = await position(modalImage);
  const expectedY = 60 + 24 / modalGeometry.travelY * 100;
  assert.ok(Math.abs(parseFloat(moved.split(' ')[1]) - expectedY) < 0.15, 'The image must track the pointer in pixels.');
  assert.notEqual(moved, start);
  assert.equal(await position(img('img-4')), moved, 'Draft must match the editor, including stylesheet !important overrides.');
  await sameScroll(before);
  await page.locator('[data-image-apply]').click();
  await sameScroll(before);
  assert.equal(await position(img('img-4')), moved);
  assert.equal(await position(img('img-2')), '50% 32%', 'Editing one image must not move another.');
  await openImage('img-4');
  await setAxis('y', 90);
  await page.locator('[data-image-close]').last().click();
  await settle();
  assert.equal(await position(img('img-4')), moved, 'Cancel must restore the pre-dialog draft.');
  console.log('PASS exact aspect, CSS defaults, drag distance, draft parity, cancel and scroll retention');

  await openImage('img-3');
  const detailGeometry = await geometry(modalImage);
  assert.equal(detailGeometry.transform, (await geometry(img('img-3'))).transform, 'Built-in detail zoom must match.');
  await page.screenshot({ path: 'outputs/image-editor/desktop-detail.png' });
  await page.keyboard.press('Escape');
  await settle();
  const detailBefore = await position(img('img-3'));
  await openImage('img-3');
  await page.locator('[data-image-tab="library"]').click();
  await page.locator('[data-image-source="/assets/natural.png"]').click();
  await page.waitForFunction(() => document.querySelector('#cms-focal-target-img')?.getAttribute('src') === '/assets/natural.png' && !document.querySelector('[data-image-apply]').disabled);
  assert.equal(await modalImage.getAttribute('src'), '/assets/natural.png');
  await page.keyboard.press('Escape');
  await settle();
  await preview.waitForFunction(() => document.querySelector('img[data-cms-key="img-3"]').getAttribute('src') === '/assets/bridal-new.png', null, { timeout: 5000 });
  assert.equal(await img('img-3').getAttribute('src'), '/assets/bridal-new.png');
  assert.equal(await position(img('img-3')), detailBefore);
  console.log('PASS detail transform, replacement preview and Escape rollback');

  await img('img-4').scrollIntoViewIfNeeded();
  const directScroll = await scroll();
  const beforeDirect = await position(img('img-4'));
  await move(img('img-4'), 0, -20);
  assert.equal(await page.locator('.cms-image-dialog[open]').count(), 0, 'Direct drag must not open a dialog.');
  assert.notEqual(await position(img('img-4')), beforeDirect);
  await sameScroll(directScroll);
  const savedPosition = await position(img('img-4'));
  rejectSave = true;
  await page.locator('#cms-page-form').evaluate(el => el.requestSubmit());
  await page.waitForFunction(() => document.querySelector('#cms-status').textContent.includes('Vui lòng tải lại'));
  assert.equal(await position(img('img-4')), savedPosition, 'Failed save must keep the draft.');
  rejectSave = false;
  await page.locator('#cms-page-form').evaluate(el => el.requestSubmit());
  await page.waitForFunction(() => document.querySelector('#cms-status').textContent.includes('Đã lưu lúc'));
  await sameScroll(directScroll);
  assert.equal(pages['/'].fields['pos-4'], savedPosition);
  const liveWidth = await page.locator('#cms-real-preview').evaluate(el => el.clientWidth);
  const liveShot = await img('img-4').screenshot();
  await openAdmin();
  assert.equal(await position(img('img-4')), savedPosition, 'Reload must retain the exact value, not just any position.');
  const publicPage = await context.newPage();
  await publicPage.setViewportSize({ width: liveWidth, height: 1000 });
  await publicPage.goto(base + '/#/');
  await publicPage.locator('.ct-evening img').first().waitFor();
  await publicPage.waitForFunction(expected => getComputedStyle(document.querySelector('.ct-evening img')).objectPosition === expected, savedPosition);
  await publicPage.waitForTimeout(300);
  await publicPage.locator('.ct-evening img').first().scrollIntoViewIfNeeded();
  await publicPage.mouse.move(0, 0);
  const publicShot = await publicPage.locator('.ct-evening img').first().screenshot();
  const pixelDiff = await publicPage.evaluate(async ([a, b]) => {
    async function pixels(data) {
      const bitmap = await createImageBitmap(await (await fetch('data:image/png;base64,' + data)).blob());
      const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height;
      const context = canvas.getContext('2d'); context.drawImage(bitmap, 0, 0); return { width: canvas.width, height: canvas.height, data: context.getImageData(0, 0, canvas.width, canvas.height).data };
    }
    const x = await pixels(a), y = await pixels(b);
    if (x.width !== y.width || x.height !== y.height) return { sizeMismatch: [x.width, x.height, y.width, y.height] };
    let mismatch = 0, count = 0;
    for (let row = 3; row < x.height - 3; row++) for (let col = 3; col < x.width - 3; col++) {
      const index = (row * x.width + col) * 4; count++;
      if ([0, 1, 2].some(offset => Math.abs(x.data[index + offset] - y.data[index + offset]) > 12)) mismatch++;
    }
    return { ratio: mismatch / count };
  }, [liveShot.toString('base64'), publicShot.toString('base64')]);
  assert.ok(pixelDiff.ratio < 0.025, `Saved/public pixels must match preview: ${JSON.stringify(pixelDiff)}`);
  await publicPage.close();
  console.log('PASS direct drag, failed save, successful save, exact reload and public pixel parity', pixelDiff);

  await openImage('img-2');
  await page.screenshot({ path: 'outputs/image-editor/desktop-editor.png' });
  await page.locator('[data-image-tab="library"]').click();
  await page.screenshot({ path: 'outputs/image-editor/desktop-library.png' });
  await page.locator('#cms-image-url').fill('javascript:alert(1)');
  await page.locator('.cms-image-url button').click();
  assert.ok((await page.locator('.cms-image-message').innerText()).includes('không hợp lệ'));
  await page.keyboard.press('Escape');

  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await openAdmin();
    await openImage('img-4');
    assert.equal(await page.locator('.cms-image-dialog').evaluate(el => el.scrollWidth > el.clientWidth), false);
    assert.equal(await page.locator('.cms-image-body').evaluate(el => el.scrollWidth > el.clientWidth), false);
    const bounds = await page.locator('[data-image-apply]').boundingBox();
    assert.ok(bounds.y + bounds.height < 844 && bounds.x >= 0 && bounds.x + bounds.width <= width, 'Apply must be visible on small screens.');
    await page.screenshot({ path: `outputs/image-editor/editor-${width}.png` });
    await page.keyboard.press('Escape');
  }
  assert.deepEqual(errors, []);
  console.log('PASS mobile/tablet layout, accessible actions and no browser errors');
} finally {
  await browser.close();
}
