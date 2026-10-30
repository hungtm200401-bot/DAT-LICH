import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 1050 }, reducedMotion: 'reduce' });
const business = await (await context.request.get(base + '/api/data')).json();
const services = [
  { id: 'personal', name: 'Trang điểm cá nhân', description: 'Tươi sáng, tự nhiên và phù hợp với phong cách hằng ngày.', enabled: true, price: 450000, duration: 60 },
  { id: 'party', name: 'Trang điểm dự tiệc', description: 'Sắc nét vừa đủ, bền đẹp dưới nhiều điều kiện ánh sáng.', enabled: true, price: 650000, duration: 90 },
  { id: 'photo', name: 'Trang điểm chụp ảnh', description: 'Tối ưu lớp nền, đường nét và màu sắc trước ống kính.', enabled: true, price: 850000, duration: 120 },
  { id: 'bridal', name: 'Trang điểm cô dâu', description: 'Thiết kế diện mạo, thử phong cách và đồng hành trong ngày cưới.', enabled: true, price: 0, duration: 150, contact: true },
  { id: 'paused', name: 'Dịch vụ tạm ngừng', enabled: false, price: 100000, duration: 60 },
];
const portfolio = [
  { id: 'personal-one', serviceId: 'personal', title: 'Trong trẻo tự nhiên', note: 'Lớp nền mỏng nhẹ, tôn nét riêng.', image: 'natural.png' },
  { id: 'personal-two', serviceId: 'personal', title: 'Tone cam đào "tươi sáng" & tự nhiên', note: 'Trẻ trung, rạng rỡ cho dạo phố và công việc.', image: 'campaign.png' },
  { id: 'party-one', serviceId: 'party', title: 'Thanh lịch tiệc tối', note: 'Mắt khói nhẹ, bắt sáng cuốn hút.', image: 'evening.png' },
  { id: 'bridal-one', serviceId: 'bridal', title: 'Cô dâu lễ gia tiên', note: 'Tone hồng đào trong trẻo.', image: 'bridal-new.png' },
];
await context.addInitScript(portfolio => {
  if (!/^https?:$/.test(location.protocol)) return;
  if (!localStorage.getItem('serviceFlowSeed')) {
    localStorage.setItem('hoanMakeupDraft', JSON.stringify({ portfolio }));
    localStorage.setItem('serviceFlowSeed', '1');
  }
  localStorage.setItem('hoanAnalyticsConsent', 'no');
}, portfolio);
let writes = 0;
await context.route('**/api/data*', route => {
  if (route.request().method() !== 'GET') writes++;
  return route.fulfill({ json: { ...business, services, appointments: [], customers: [], requests: [], notifications: [], bookingDetails: {} } });
});
await context.route('**/api/site-content*', route => route.fulfill({ json: { pages: {}, drafts: {} } }));
await context.route('**/api/cms-resources*', route => route.fulfill({ json: { shared: { value: { albums: [], testimonials: [] }, revision: '' }, media: { value: [], revision: '' }, templates: { value: [], revision: '' } } }));
const page = await context.newPage(), errors = [];
page.on('pageerror', error => errors.push(error.message));
const visit = async path => {
  await page.goto(base + '/#' + path);
  await page.locator('#main').waitFor();
  await page.waitForFunction(() => window.state?.backendReady);
};
const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
const shot = name => page.screenshot({ path: 'outputs/service-flow/' + name + '.png', animations: 'disabled' });
try {
  await mkdir('outputs/service-flow', { recursive: true });
  await visit('/services');
  assert.equal(await page.locator('.ct-services-overview article').count(), 4);
  assert.equal(await page.locator('#main .ct-tabs').count(), 0);
  for (const service of services.filter(s => s.enabled)) assert.equal(await page.locator(`.ct-service-discover[href="#/services/${service.id}"]`).count(), 1);
  assert.equal(await page.locator('.ct-services-overview').evaluate(node => getComputedStyle(node).gridTemplateColumns.split(' ').length), 4);
  await noOverflow(); await shot('desktop-overview');

  await page.locator('.ct-service-discover[href="#/services/personal"]').click();
  await page.locator('.ct-service-collection').waitFor();
  assert.equal(await page.locator('.ct-service-style-card').count(), 2);
  assert.equal(await page.locator('#main .ct-tabs').count(), 0);
  assert.equal(await page.locator('.ct-service-style-link[href*="party-one"]').count(), 0);
  assert.equal(await page.locator('.ct-service-bar .ct-service-meta').count(), 0);
  for (const card of await page.locator('.ct-service-style-card').all()) {
    assert.match(await card.locator('.ct-service-style-pricing').innerText(), /Giá dịch vụ\s+450\.000đ\s+Thời lượng\s+60 phút/);
  }
  await shot('desktop-collection');
  await page.locator('.ct-service-style-card').first().screenshot({ path: 'outputs/service-flow/priced-card.png', animations: 'disabled' });
  await page.locator('.ct-service-style-link[href$="/personal-two"]').click();
  await page.locator('.ct-service-look').waitFor();
  assert.equal(await page.evaluate(() => window.scrollY), 0, 'opening a look must show its title and back link immediately');
  assert.equal(await page.locator('#main h1').innerText(), portfolio[1].title);
  assert.match(await page.locator('.ct-service-look-image .fashion-full').getAttribute('src'), /campaign\.png/);
  await shot('desktop-look');
  await page.locator('#main [data-action="choose-service"]').click();
  await page.waitForURL('**/#/booking/time');
  assert.equal(await page.evaluate(() => window.state.booking.serviceId), 'personal');
  assert.equal(await page.evaluate(() => window.state.booking.style), portfolio[1].title);
  // Card price/duration must match what the booking step shows for the chosen look.
  await page.locator('.ct-booking-footer').waitFor();
  assert.match(await page.locator('.ct-booking-footer > div').first().innerText(), /Trang điểm cá nhân\s+·\s+450\.000đ/);
  assert.match(await page.locator('.ct-time-layout').innerText(), /Thời lượng:\s+60 phút/);
  await shot('booking-time-price');
  await visit('/booking/info');
  assert.equal(await page.locator('select[name="style"]').inputValue(), portfolio[1].title);
  await visit('/services/party');
  await page.locator('#main [data-action="choose-service"]').click();
  assert.equal(await page.evaluate(() => window.state.booking.serviceId), 'party');
  assert.equal(await page.evaluate(() => window.state.booking.style), '');

  for (const service of services.filter(s => s.enabled)) {
    await visit('/services?filter=' + service.id);
    assert.equal(await page.locator('#main h1').innerText(), service.name);
    assert.equal(await page.locator('#main .ct-tabs').count(), 0);
    await page.locator('.ct-service-back[href="#/services"]').click();
    await page.locator('.ct-services-overview').waitFor();
  }
  await visit('/services?filter=all');
  assert.equal(await page.locator('.ct-service-card').count(), 4);
  for (const invalid of ['/services/missing', '/services/paused', '/services/personal/party-one', '/services/personal/missing']) {
    await visit(invalid);
    assert.match(await page.locator('#main h1').innerText(), /không khả dụng/);
    assert.equal(await page.locator('#main [data-action="choose-service"]').count(), 0);
  }
  await visit('/services/photo');
  assert.equal(await page.locator('.ct-service-style-card').count(), 0);
  assert.match(await page.locator('.ct-service-empty').innerText(), /đang được cập nhật/);
  assert.equal(await page.locator('#main [data-action="choose-service"]').count(), 1);
  await visit('/services/bridal');
  assert.match(await page.locator('.ct-service-style-pricing').first().innerText(), /Tư vấn riêng/);
  await page.locator('#main [data-action="choose-service"]').click();
  await page.waitForURL('**/#/contact');
  assert.equal(await page.evaluate(() => window.state.booking.serviceId), 'bridal');

  for (const width of [1024, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [path, name] of [['/services', 'overview'], ['/services/personal', 'collection'], ['/services/personal/personal-two', 'look']]) {
      await visit(path); await noOverflow();
      if (width === 390 || width === 1024) await shot(width + '-' + name);
    }
  }
  services.push({ id: 'new-service', name: 'Dịch vụ mới', description: 'Dịch vụ được thêm trong quản trị.', enabled: true, price: 500000, duration: 60 });
  await page.reload();
  await page.waitForFunction(() => window.state?.services.some(s => s.id === 'new-service'));
  await visit('/services');
  assert.equal(await page.locator('.ct-service-card').count(), 5);
  await page.locator('.ct-service-discover[href="#/services/new-service"]').click();
  assert.equal(await page.locator('#main h1').innerText(), 'Dịch vụ mới');
  assert.match(await page.locator('.ct-service-empty').innerText(), /đang được cập nhật/);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(base + '/#/admin/content-pages');
  const preview = page.frameLocator('#cms-real-preview');
  await preview.locator('#main').waitFor();
  await page.locator('#cms-page-select').selectOption('/services');
  await preview.locator('.ct-services-overview').waitFor();
  assert.equal(await preview.locator('.ct-service-card').count(), 5);
  assert.equal(await preview.locator('#main .ct-tabs').count(), 0);
  await shot('admin-service-overview');
  await page.locator('#cms-page-select').selectOption('/services/personal');
  await preview.locator('.ct-service-collection').waitFor();
  assert.equal(await preview.locator('.ct-service-style-card').count(), 2);
  assert.equal(await preview.locator('#main .ct-tabs').count(), 0);
  await shot('admin-service-collection');
  assert.equal(writes, 0, 'browsing and selecting a service must not write business data');
  assert.deepEqual(errors, []);
  console.log('PASS service overview, scoped collections, exact look/booking selection, legacy links, unavailable and empty states, dynamic services, CMS preview, desktop/tablet/mobile layouts; no business writes or browser errors');
} catch (error) {
  await shot('failure'); console.error(errors); throw error;
} finally { await browser.close(); }
