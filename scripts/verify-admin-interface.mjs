import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel:'chrome', headless:true });
const context = await browser.newContext({ viewport:{width:1440,height:1000}, reducedMotion:'reduce' });
const business = await (await context.request.get(base + '/api/data')).json();
business.appointments = []; business.requests = []; business.customers = []; business.notifications = [];
const packs = [{ id:'audit-party', serviceId:'party', title:'Dự tiệc thanh lịch', tag:'Dự tiệc', image:'evening.png', note:'Lớp nền bền màu, điểm nhấn ở mắt.', price:'650.000đ', duration:'90 phút' }];
await context.addInitScript(packs => { if(!localStorage.getItem('adminAuditSeed')) { localStorage.setItem('hoanMakeupDraft', JSON.stringify({portfolio:packs})); localStorage.setItem('adminAuditSeed','1'); } localStorage.setItem('hoanAnalyticsConsent','no'); localStorage.setItem('hoanAdminToken','audit-test-token'); }, packs);
const writes = [];
await context.route('**/api/data*', route => {
  if(route.request().method() === 'GET') return route.fulfill({json:business});
  const data = route.request().postDataJSON(); writes.push(data);
  if(data.action === 'saveService') { const saved = {...data}; const index = business.services.findIndex(item => item.id === data.id); if(index >= 0) business.services[index] = saved; else business.services.push(saved); return route.fulfill({json:{service:saved}}); }
  return route.fulfill({json:{ok:true}});
});
await context.route('**/api/site-content*', route => route.fulfill({json:{pages:{},drafts:{}}}));
await context.route('**/api/cms-resources*', route => route.fulfill({json:{shared:{value:{albums:[],testimonials:[]},revision:''},media:{value:[],revision:''},templates:{value:[],revision:''}}}));
let rejectUpload = true, uploadHeaders;
await context.route('**/api/uploads', route => { uploadHeaders = route.request().headers(); return route.fulfill(rejectUpload ? {status:503,json:{error:'Không tải được ảnh thử nghiệm.'}} : {json:{paths:['/assets/bridal.png']}}); });
const page = await context.newPage(), errors=[]; page.on('pageerror', error => errors.push(error.message));
const shot = name => page.screenshot({path:'outputs/admin-interface/' + name + '.png',animations:'disabled'});
const closeModal = async () => { await page.locator('.modal [data-action="close-modal"]').click(); };
const confirmModal = () => page.locator('.modal [data-action="modal-confirm"]');
try {
  await mkdir('outputs/admin-interface',{recursive:true});
  for(const route of ['','appointments','services','gallery','customers','payments','promotions','content','notifications','reports','permissions','audit','requests','settings']) {
    await page.goto(base + '/#/admin/' + route); await page.locator('.admin-head h1').waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll('link[rel="stylesheet"]')].every(link => link.sheet));
    if(route === 'content') { await page.locator('.studio-workspace-tabs').waitFor(); await page.frameLocator('#cms-real-preview').locator('#main h1').waitFor(); }
    assert.doesNotMatch(await page.locator('.admin-page').innerText(), /LIVE PREVIEW|0ms|Hệ thống ổn định|Khung Mẫu|KHUNG MẪU HIỂN THỊ|📷|🗑|✨|⭐/u, route);
    const heading = await page.locator('.admin-head h1').evaluate(node => ({font:getComputedStyle(node).fontFamily, size:parseFloat(getComputedStyle(node).fontSize)}));
    assert.ok(heading.size <= 30, route + ': heading should fit an admin interface');
    assert.doesNotMatch(heading.font, /Tinos|Georgia|Bodoni/, route + ': admin headings should use the shared sans serif font');
    await shot(route || 'overview');
  }
  await page.goto(base + '/#/admin/services'); await page.locator('[data-action="edit-service"]').first().click();
  assert.equal(await page.locator('.admin-record-form[data-record-kind="service"]').count(),1);
  assert.equal(await page.locator('.modal #modal-card-file-upload').count(),0, 'service form must not offer an image field that is not saved by the service API');
  assert.equal(await page.locator('.modal #card-live-preview-price').count(),0);
  const name = await page.locator('#modal-service-name').inputValue();
  await page.locator('#modal-service-price').fill('0'); await page.locator('#modal-service-duration').fill('0');
  await confirmModal().click(); assert.equal(writes.length,0, 'invalid duration must not be saved');
  await page.locator('#modal-service-duration').fill('75');
  await shot('service-form'); await confirmModal().click(); await page.locator('.modal').waitFor({state:'detached'});
  assert.equal(writes[0].price,0); assert.equal(writes[0].duration,75); assert.equal(writes[0].name,name);
  await page.locator('[data-action="add-service"]').click(); assert.equal(await page.locator('#modal-service-name').inputValue(),''); await closeModal();
  await page.goto(base + '/#/admin/gallery'); await page.locator('[data-action="edit-portfolio-item"]').first().click();
  assert.equal(await page.locator('#modal-port-service').inputValue(),'party','editing an image must preserve its linked service');
  await page.locator('#modal-port-title').fill('Dự tiệc đã chỉnh');
  const fixture={name:'audit.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aB9sAAAAASUVORK5CYII=','base64')};
  await page.locator('#modal-card-file-upload').setInputFiles(fixture);
  await page.waitForFunction(()=>document.querySelector('#card-upload-file-status')?.textContent.includes('Không tải được'));
  assert.equal(await page.locator('#modal-port-img').inputValue(),'evening.png');
  rejectUpload = false; await page.locator('#modal-card-file-upload').setInputFiles(fixture);
  await page.waitForFunction(()=>document.querySelector('#card-upload-file-status')?.textContent.includes('Đã tải ảnh'));
  assert.equal(uploadHeaders.authorization,'Bearer audit-test-token');
  await page.locator('.record-image-library summary').click(); await page.locator('[data-record-image="natural.png"]').click();
  await shot('gallery-form'); await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('.modal').evaluate(node=>node.scrollWidth > node.clientWidth+1),false);
  await shot('gallery-form-mobile'); await confirmModal().click(); await page.locator('.modal').waitFor({state:'detached'});
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('hoanMakeupDraft')).portfolio.find(item=>item.id==='audit-party'));
  assert.equal(saved.serviceId,'party'); assert.equal(saved.title,'Dự tiệc đã chỉnh'); assert.equal(saved.image,'natural.png');
  await page.setViewportSize({width:1440,height:1000}); await page.goto(base+'/#/admin/content'); await page.locator('.studio-workspace-tabs').waitFor();
  await page.locator('[data-studio-view="resources"]').click(); await shot('resources');
  await page.locator('[data-tab="media"]').click(); await page.locator('.cms-library-dialog[open]').waitFor(); await shot('media-library');
  await page.locator('.cms-library-dialog [data-lib="close"]').click();
  await page.locator('[data-studio-view="packs"]').click(); await page.locator('[data-action="edit-pack-item"]').first().click(); await shot('pack-form');
  assert.deepEqual(errors,[]);
  console.log('PASS admin route audit, neutral headings, service save/validation, honest image controls, gallery service link, authenticated uploads/retry, image save and desktop/mobile dialogs');
} catch(error) { await shot('failure'); console.error(errors); throw error; }
finally { await browser.close(); }
