import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const pages = {}, drafts = {}, history = {};
const errors = [];

await context.route('**/api/site-content*', async route => {
  const request = route.request();
  const url = new URL(request.url());
  if (request.method() === 'GET') {
    const historyPath = url.searchParams.get('history');
    if (historyPath !== null) return route.fulfill({ json: { history: history[historyPath] || [] } });
    return route.fulfill({ json: { pages, ...(url.searchParams.get('admin') === '1' ? { drafts } : {}) } });
  }
  const payload = request.postDataJSON();
  if (payload.action === 'draft') {
    drafts[payload.path] = { fields: payload.fields, baseRevision: payload.revision || '', updatedAt: new Date().toISOString() };
    return route.fulfill({ json: { draft: drafts[payload.path] } });
  }
  if (pages[payload.path]) (history[payload.path] ||= []).unshift(pages[payload.path]);
  pages[payload.path] = { fields: payload.fields, revision: crypto.randomUUID(), updatedAt: new Date().toISOString() };
  delete drafts[payload.path];
  return route.fulfill({ json: { page: pages[payload.path] } });
});

const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));

try {
  await mkdir('outputs/content-builder', { recursive: true });
  await page.goto(base + '/#/admin/content-pages');
  await page.locator('#cms-real-preview').waitFor();
  await page.getByText('Chọn trang cần sửa', { exact: true }).waitFor();
  await page.getByText('Chọn nội dung cần sửa', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Đăng lên website' }).waitFor();
  await page.waitForFunction(() => document.querySelectorAll('.studio-page-group').length >= 5);
  assert.ok(await page.locator('.studio-page-group').count() >= 5, 'Public pages should be grouped for easier navigation');
  const preview = page.frameLocator('#cms-real-preview');
  await preview.locator('#main').waitFor();
  await page.locator('[data-action="open-block-picker"]').first().click();
  await page.screenshot({ path: 'outputs/content-builder/templates.png' });
  await page.locator('[data-action="choose-block-template"][data-type="split"]').click();
  await page.locator('.cms-block-editor').waitFor();

  const title = 'Section kiểm thử chuyên nghiệp';
  await page.locator('[data-block-field="title"]').fill(title);
  await preview.locator('section.cms-content-split h2').waitFor();
  assert.equal(await preview.locator('section.cms-content-split h2').innerText(), title);

  await page.locator('[data-block-setting="theme"]').selectOption('wine');
  await preview.locator('section.cms-content-split.cms-theme-wine').waitFor();
  assert.equal(await page.locator('.cms-block-editor').evaluate(element => element.scrollWidth > element.clientWidth), false);
  await page.screenshot({ path: 'outputs/content-builder/block-editor.png' });
  await page.locator('button[data-action="close-block-modal"]').last().click();
  assert.equal(await page.locator('.cms-block-row').count(), 1);

  await page.locator('[data-cms-device="mobile"]').click();
  const frameWidth = await page.locator('#cms-real-preview').evaluate(element => Math.round(element.getBoundingClientRect().width));
  assert.equal(frameWidth, 390);

  await preview.locator('section.cms-content-split').click();
  await page.locator('.cms-block-editor').waitFor();
  await page.locator('button[data-action="close-block-modal"]').last().click();
  await page.locator('[data-action="duplicate-cms-block"]').click();
  assert.equal(await page.locator('.cms-block-row').count(), 2);
  await page.locator('[data-action="toggle-cms-block"]').last().click();
  assert.equal(await preview.locator('section.cms-content-split').count(), 1);

  await page.locator('.studio-more summary').click();
  await page.locator('[data-action="save-cms-draft"]').click();
  await page.waitForFunction(() => document.querySelector('#cms-status')?.textContent.includes('Bản nháp đã tự lưu'));
  assert.ok(drafts['/']);
  assert.equal(pages['/'], undefined, 'Saving a draft must not publish content');

  await page.locator('#cms-page-form').evaluate(form => form.requestSubmit());
  await page.waitForFunction(() => document.querySelector('#cms-status')?.textContent.includes('Đã đăng'));
  assert.ok(pages['/']);
  assert.equal(drafts['/'], undefined);

  const publicPage = await context.newPage();
  publicPage.on('pageerror', error => errors.push(error.message));
  await publicPage.goto(base + '/#/');
  await publicPage.locator('section.cms-content-split').waitFor();
  assert.equal(await publicPage.locator('section.cms-content-split').count(), 1);
  await publicPage.close();

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: 'outputs/content-builder/editor.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('PASS content templates, live editing, controlled styles, mobile preview, draft and publish');
} finally {
  await browser.close();
}
