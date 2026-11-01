import assert from 'node:assert/strict';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

const base = process.env.PREVIEW_URL || 'http://localhost:5173';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
  await context.addInitScript(() => localStorage.setItem('hoanAnalyticsConsent', 'no'));
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/?policy-animation-test=1#/policies`);
  await page.locator('.policy-chapter').first().waitFor();
  await page.waitForTimeout(800);
  // Also allows this focused test to run before the app's module loader is wired.
  const mount = async () => {
    await page.addStyleTag({ url: `${base}/policy-navigation.css` });
    await page.evaluate(async () => {
      window.__policyTestCleanup?.();
      if (!document.querySelector('.policy-nav-enhanced')) {
        const { mountPolicyNavigation } = await import('/policy-navigation.js');
        window.__policyTestCleanup = mountPolicyNavigation();
      }
    });
  };
  await mount();
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  const menu = page.locator('.policy-desktop-contents nav');
  const first = menu.locator('[data-id="booking"]');
  const second = menu.locator('[data-id="deposit"]');
  await first.waitFor();
  await page.waitForTimeout(300);
  const underline = choice => choice.locator('span').evaluate(element => {
    const style = getComputedStyle(element, '::after');
    return { transform: style.transform, duration: style.transitionDuration, decoration: getComputedStyle(element).textDecorationLine };
  });
  assert.equal((await underline(first)).decoration, 'none', 'Active underline comes from the animated menu rule');
  assert.equal((await underline(second)).transform, 'matrix(0, 0, 0, 1, 0, 0)');
  await second.hover();
  await page.waitForTimeout(75);
  const midway = (await underline(second)).transform;
  assert.notEqual(midway, 'matrix(0, 0, 0, 1, 0, 0)', 'Hover underline starts');
  assert.notEqual(midway, 'matrix(1, 0, 0, 1, 0, 0)', 'Hover underline animates instead of jumping');
  await page.waitForTimeout(250);
  assert.equal((await underline(second)).transform, 'matrix(1, 0, 0, 1, 0, 0)');
  await page.mouse.move(1300, 800);

  const marker = menu.locator('.policy-reading-marker');
  const before = await marker.evaluate(element => getComputedStyle(element).transform);
  await page.evaluate(() => {
    const chapter = document.querySelector('#policy-deposit');
    const line = Math.max(parseFloat(getComputedStyle(chapter).scrollMarginTop), document.querySelector('.couture-header').getBoundingClientRect().bottom + 24);
    scrollTo({ top: chapter.getBoundingClientRect().top + scrollY - line + 2, behavior: 'instant' });
  });
  await page.waitForFunction(() => document.querySelector('.policy-desktop-contents [data-id="deposit"]')?.getAttribute('aria-current') === 'location');
  await page.waitForTimeout(50);
  const during = await marker.evaluate(element => getComputedStyle(element).transform);
  await page.waitForTimeout(300);
  const after = await marker.evaluate(element => getComputedStyle(element).transform);
  assert.notEqual(before, after, 'Reading marker follows the new section');
  assert.notEqual(during, after, 'Reading marker moves smoothly');
  assert.equal(await page.locator('.policy-contents [aria-current="location"]').count(), 2, 'Desktop and mobile announce the same reading section');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  await mount();
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  const mobile = page.locator('.policy-mobile-contents');
  await mobile.locator('summary').click();
  await page.waitForTimeout(300);
  assert.equal(await mobile.locator('.policy-reading-marker').evaluate(element => getComputedStyle(element).opacity), '1');
  assert.ok((await mobile.locator('[data-policy-current-label]').innerText()).includes('01'));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'No mobile overflow');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await mobile.locator('.policy-reading-marker').evaluate(element => getComputedStyle(element).transitionDuration), '0s');
  assert.equal((await underline(mobile.locator('[data-id="deposit"]'))).duration, '0s');
  await page.evaluate(() => { window.__policyTestCleanup?.(); window.__policyTestCleanup?.(); });
  assert.deepEqual(errors, []);
  console.log('Policy navigation: hover underline, scroll marker animation, shared reading state, mobile, reduced motion and cleanup passed.');
  await context.close();
} finally {
  await browser.close();
}
