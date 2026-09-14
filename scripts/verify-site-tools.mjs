import assert from 'node:assert/strict';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';
import { mkdir } from 'node:fs/promises';
import { publicPages } from '../public/site-tools.js';

const base = process.env.SITE_TEST_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
const contexts = [];
const context = async () => { const result = await browser.newContext({ viewport: { width: 1440, height: 1000 } }); contexts.push(result); result.on('page', page => page.on('pageerror', error => errors.push(error.message))); return result; };
const read = async path => { const response = await fetch(base + path); assert.equal(response.status, 200, path); return response.json(); };
const post = async (path, data) => fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
const wait = async (fn, label) => { for (let i = 0; i < 60; i++) { if (await fn()) return; await new Promise(resolve => setTimeout(resolve, 150)); } throw new Error('Timeout: ' + label); };
const cmsPath = '/support/preparation';
const oldPage = (await read('/api/site-content')).pages[cmsPath];
let changed = false, visitorContext;
try {
  const adminContext = await context();
  const admin = await adminContext.newPage();
  const baseline = (await read('/api/visits')).summary.total;
  await admin.goto(base + '/#/admin/content-pages');
  await admin.locator('#cms-page-select').waitFor();
  await admin.selectOption('#cms-page-select', cmsPath);
  await admin.locator('[data-cms-field="txt-h1-1"]').waitFor();
  const heading = 'Kiểm thử nội dung — ' + Date.now();
  await admin.locator('[data-cms-field="txt-h1-1"]').fill(heading);
  await wait(() => admin.frameLocator('#cms-real-preview').locator('#main h1').textContent().then(text => text === heading), 'preview reflects draft');
  assert.notEqual((await read('/api/site-content')).pages[cmsPath]?.fields?.['txt-h1-1'], heading, 'draft must not be published');
  await admin.locator('#cms-page-form button[type=submit]').click();
  await wait(async () => (await read('/api/site-content')).pages[cmsPath]?.fields?.['txt-h1-1'] === heading, 'CMS save');
  changed = true;
  const publicContext = await context();
  await publicContext.addInitScript(() => { try { localStorage.setItem('hoanAnalyticsConsent', 'no'); } catch {} });
  const publicPage = await publicContext.newPage();
  await publicPage.goto(base + '/#' + cmsPath);
  await wait(() => publicPage.locator('#main h1').textContent().then(text => text === heading), 'independent browser sees published content');
  const stale = await post('/api/site-content', { path: cmsPath, fields: {}, revision: oldPage?.revision || '' });
  assert.equal(stale.status, 409, 'stale save is rejected');
  const invalid = await post('/api/site-content', { path: '/test', fields: { 'img-1': 'javascript:alert(1)' }, revision: '' });
  assert.equal(invalid.status, 400, 'unsafe image is rejected');
  assert.equal(await publicPage.locator('#visit-consent').count(), 0, 'no statistics popup');
  await publicPage.goto(base + '/#/services');
  await publicPage.locator('.ct-service-grid').waitFor();
  assert.equal((await read('/api/visits')).summary.total, baseline, 'admin, preview and declined visits are excluded');
  console.log('PASS CMS draft, persistence, conflict and consent rejection');

  // Every configured public template must render and expose at least one editable field.
  for (const [path] of publicPages) {
    await admin.selectOption('#cms-page-select', path);
    await wait(async () => await admin.locator('#cms-status').textContent().then(text => /trường liên kết/.test(text)), 'CMS fields ' + path);
    assert.ok(await admin.locator('[data-cms-field]').count(), path);
  }
  console.log('PASS all ' + publicPages.length + ' public CMS templates');

  visitorContext = await context();
  const visitor = await visitorContext.newPage();
  await visitor.goto(base + '/?utm_source=facebook&utm_medium=social&utm_campaign=verification#/' );
  await visitor.locator('.couture-footer').waitFor();
  assert.equal(await visitor.locator('#visit-consent').count(), 0, 'automatic analytics without popup');
  await wait(async () => (await read('/api/visits?source=facebook')).sessions.some(s => s.campaign === 'verification'), 'new Facebook session');
  await visitor.locator('.main-nav a[href="#/services"]').first().click();
  await visitor.locator('.ct-service-grid').waitFor();
  await visitor.locator('[data-visit-action=preferences]').click();
  await visitor.locator('#visit-consent summary').click();
  await visitor.locator('#visit-identity-form [name=name]').fill('Khách kiểm thử');
  await visitor.locator('#visit-identity-form [name=facebookUrl]').fill('https://www.facebook.com/test-profile');
  await visitor.locator('#visit-identity-form [name=purpose]').fill('Xem giá makeup cô dâu');
  await visitor.locator('#visit-identity-form [name=identityConsent]').check();
  await visitor.locator('#visit-identity-form button').click();
  await wait(async () => (await read('/api/visits?source=facebook')).sessions.some(s => s.display_name === 'Khách kiểm thử'), 'voluntary identity');
  const session = (await read('/api/visits?source=facebook')).sessions.find(s => s.campaign === 'verification');
  assert.equal(session.source, 'facebook');
  assert.equal(session.declared_purpose, 'Xem giá makeup cô dâu');
  await wait(async () => (await read('/api/visits?session=' + session.id)).events.some(event => event.type === 'pageview' && event.page === '/services'), 'SPA pageview');
  assert.ok((await read('/api/visits?session=' + session.id)).events.some(event => event.type === 'click'));
  const publicSnapshot = await read('/api/data');
  assert.ok(!JSON.stringify(publicSnapshot).includes(session.id), 'analytics never leaks through public data API');
  const foreign = await fetch(base + '/api/visits', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://example.org' }, body: JSON.stringify({ type: 'start', consent: true, page: '/' }) });
  assert.equal(foreign.status, 403, 'cross-origin write denied');
  await admin.goto(base + '/#/admin/visitors');
  await admin.locator('.visit-table').waitFor();
  await admin.locator(`[data-visit-session="${session.id}"]`).click();
  await admin.locator('.visit-timeline').waitFor();
  assert.ok((await admin.locator('#visit-report').textContent()).includes('Chưa xác minh danh tính'));
  await admin.locator('#visit-share-form [name=website]').fill('https://hoan.example/');
  await admin.locator('#visit-share-form [name=campaign]').fill('makeup-thang-9');
  await admin.locator('#visit-share-form button').click();
  assert.ok((await admin.locator('#visit-share-link').inputValue()).includes('utm_source=facebook'));
  await mkdir('outputs', { recursive: true });
  await admin.screenshot({ path: 'outputs/visitors-desktop.png', fullPage: true });
  await admin.goto(base + '/#/admin/content-pages');
  await admin.locator('#cms-page-select').waitFor();
  await admin.screenshot({ path: 'outputs/content-pages-desktop.png', fullPage: true });
  await visitor.locator('[data-visit-action=decline]').click();
  await wait(async () => !(await read('/api/visits')).sessions.some(s => s.id === session.id), 'revoke removes current session');
  console.log('PASS analytics source, identity consent, SPA events, history, isolation, share link and revoke');
  assert.deepEqual(errors, [], 'browser errors');
} finally {
  if (changed) {
    const latest = (await read('/api/site-content')).pages[cmsPath];
    const response = await post('/api/site-content', { path: cmsPath, fields: oldPage?.fields || {}, revision: latest.revision });
    assert.equal(response.status, 200, 'restore original published content');
  }
  if (visitorContext) await visitorContext.request.post(base + '/api/visits', { data: { type: 'revoke' } });
  await browser.close();
}
