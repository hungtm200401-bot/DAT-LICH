import assert from 'node:assert/strict';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.addInitScript(() => localStorage.setItem('hoanAnalyticsConsent', 'no'));
const page = await context.newPage();
try {
  await page.goto('http://127.0.0.1:5173/#/');
  await page.locator('.visit-preferences').waitFor();
  const borders = await page.locator('.couture-footer nav a').evaluateAll(nodes => nodes.map(node => [getComputedStyle(node).borderLeftWidth, getComputedStyle(node).borderRightWidth]));
  assert.ok(borders.every(([left,right]) => left === '0px' && right === '0px'), 'links must not add a second separator');
  assert.equal(await page.locator('.footer-sep').count(), 3);
  await page.goto('http://127.0.0.1:5173/#/admin/content');
  await page.locator('#cms-page-select').waitFor();
  await page.selectOption('#cms-page-select','/');
  await page.locator('[data-cms-field="txt-h1-1"]').waitFor();
  assert.doesNotMatch(await page.locator('#main').innerText(), /[\p{Extended_Pictographic}]/u, 'no decorative emoji in content editor');
  await page.evaluate(() => window.scrollTo(0,0));
  await page.screenshot({path:'outputs/content-refined.png'});
  await page.goto('http://127.0.0.1:5173/#/admin/visitors');
  await page.locator('.visit-table').waitFor();
  assert.doesNotMatch(await page.locator('#main').innerText(), /[\p{Extended_Pictographic}]/u);
  await page.evaluate(() => window.scrollTo(0,0));
  await page.screenshot({path:'outputs/visitors-refined.png'});
  console.log('PASS one footer separator, no emoji, content and visitors layout');
} finally { await browser.close(); }
