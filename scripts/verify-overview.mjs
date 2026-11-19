import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';
import { buildOverview, vietnamDay } from '../public/overview-utils.js';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
const today = vietnamDay(), previous = new Date(today + 'T12:00:00+07:00'); previous.setUTCDate(previous.getUTCDate() - 1);
const yesterday = vietnamDay(previous), next = new Date(previous); next.setUTCDate(next.getUTCDate() + 2); const tomorrow = vietnamDay(next);
const appointment = (code, date, time, status, serviceId, deposit, paymentStatus = 'unverified') => ({ code, customer: 'Khách thử ' + code, phone: '0900000000', date, time, status, serviceId, deposit, total: 700000, paymentStatus, refundStatus: 'none', address: 'Địa chỉ kiểm thử', finance: { netReceived: deposit, received: deposit, refunded: 0, remaining: 700000 - deposit } });
const business = {
  services: [{ id: 'party', name: 'Trang điểm dự tiệc', duration: 90, price: 650000, enabled: true }, { id: 'personal', name: 'Trang điểm cá nhân', duration: 60, price: 450000, enabled: true }],
  appointments: [appointment('B-LATE', today, '14:00', 'pending', 'personal', 0, 'pending_verification'), appointment('A-EARLY', today, '08:00', 'confirmed', 'party', 550000, 'received'), appointment('C-CANCEL', today, '09:00', 'cancelled', 'party', 50000), appointment('D-NEXT', tomorrow, '10:00', 'completed', 'party', 0), appointment('E-OLD', yesterday, '11:00', 'completed', 'old-service', 0)],
  paymentTransactions: [
    { id: 'tx1', appointmentCode: 'A-EARLY', kind: 'deposit', amount: 200000, method: 'bank', reference: 'TEST-1', occurredAt: yesterday + 'T09:00:00+07:00', createdAt: yesterday + 'T09:00:00+07:00' },
    { id: 'tx2', appointmentCode: 'A-EARLY', kind: 'balance', amount: 400000, method: 'cash', reference: '', occurredAt: today + 'T08:00:00+07:00', createdAt: today + 'T08:00:00+07:00' },
    { id: 'tx3', appointmentCode: 'A-EARLY', kind: 'refund', amount: 50000, method: 'cash', reference: '', occurredAt: today + 'T08:01:00+07:00', createdAt: today + 'T08:01:00+07:00' },
    { id: 'tx4', appointmentCode: 'C-CANCEL', kind: 'opening', amount: 50000, method: 'legacy', occurredAt: today + 'T08:01:00+07:00', createdAt: today + 'T08:01:00+07:00' },
  ],
  requests: [{ id: 'r1', code: 'B-LATE', name: 'Khách đổi lịch', phone: '0900000000', subject: 'Yêu cầu đổi lịch', status: 'pending', createdAt: new Date().toISOString() }, { id: 'r2', code: 'A-EARLY', name: 'Khách đang xử lý', subject: 'Đổi ngày', status: 'in_progress', createdAt: new Date().toISOString() }, { id: 'r3', code: 'A-EARLY', name: 'Đã xong', subject: 'Đổi lịch', status: 'resolved' }, { id: 'r4', name: 'Tư vấn khác', subject: 'Tư vấn dịch vụ', status: 'pending' }],
  notifications: [{ id: 'n1', title: 'Yêu cầu đổi lịch mới', message: 'Khách muốn chuyển ngày hẹn', entityType: 'request', entityId: 'r1', status: 'unread', createdAt: new Date().toISOString() }, { id: 'n2', title: 'Đã xem sự kiện', message: 'Thông báo cũ', entityType: 'appointment', entityId: 'A-EARLY', status: 'read', createdAt: yesterday + 'T08:00:00+07:00' }],
  customers: [{ id: 'customer1', name: 'Khách thử A-EARLY', phone: '0900000000', visits: 1 }], scheduleSlots: [], bookingDetails: {}, brand: {}, settings: { deposit: 200000, travelFee: 50000, scheduleOpen: true },
};
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true, reducedMotion: 'reduce' });
await context.addInitScript(() => { localStorage.setItem('hoanAnalyticsConsent', 'no'); localStorage.setItem('hoanAdminToken', 'fixture-token'); });
let fail = false, gets = 0, slow = false; const writes = [];
await context.route('**/api/data*', async route => {
  if (route.request().method() !== 'GET') { writes.push(route.request().postDataJSON()); return route.fulfill({ json: { ok: true } }); }
  gets++; if (slow) await new Promise(resolve => setTimeout(resolve, 250));
  return route.fulfill(fail ? { status: 503, json: { error: 'Lỗi kết nối kiểm thử' } } : { json: business });
});
await context.route('**/api/site-content*', route => route.fulfill({ json: { pages: {}, drafts: {} } }));
await context.route('**/api/cms-resources*', route => route.fulfill({ json: { shared: { value: { albums: [], testimonials: [] }, revision: '' }, media: { value: [], revision: '' }, templates: { value: [], revision: '' } } }));
const page = await context.newPage(), errors = []; page.on('pageerror', error => errors.push(error.message));
const money = value => new Intl.NumberFormat('vi-VN').format(value) + 'đ';
const ready = () => page.locator('.overview-stat strong').first().waitFor();
const home = async () => { await page.goto(base + '/#/admin'); await ready(); await page.waitForFunction(() => window.state?.backendReady); };
const assertCards = async () => {
  const model = buildOverview(business);
  assert.deepEqual(await page.locator('.overview-stat strong').allTextContents(), ['2', '1', money(model.monthNet)]);
};
try {
  await mkdir('outputs/overview', { recursive: true });
  await home(); await assertCards();
  await page.locator('link[rel="stylesheet"][href="/admin-overview.css?v=2.1"]').waitFor({ state: 'attached' });
  assert.equal(await page.locator('.overview-booking').count(), 2);
  assert.match(await page.locator('.overview-booking').first().innerText(), /Khách thử A-EARLY/);
  assert.equal(await page.locator('.overview-cash-table,.overview-services').count(), 0);
  assert.equal(await page.locator('.overview-bar-day').count(), 7);
  assert.equal(await page.locator('.overview-event').count(), 4);
  assert.ok((await page.locator('.overview-week-net').innerText()).includes(money(buildOverview(business).weekNet)));
  assert.equal(await page.locator('.overview-task').count(), 3);
  assert.equal(await page.locator('[data-overview="export"]').isVisible(), false);
  assert.match(await page.locator('.overview-bottom-links a').first().getAttribute('href'), /admin\/reports/);
  await page.screenshot({ path: 'outputs/overview/desktop.png', fullPage: true });
  await page.locator('.overview-booking').first().click();
  await page.locator('.modal').waitFor(); await page.locator('.modal [data-action="close-modal"]').first().click();
  await page.locator('#admin-global-search').fill('Khách thử A'); await page.locator('#admin-global-search').press('Enter');
  assert.match(await page.locator('.overview-search-results').innerText(), /Khách hàng/);
  await page.locator('.modal [data-action="close-modal"]').last().click();
  await page.locator('#admin-global-search').fill('TEST-1'); await page.locator('#admin-global-search').press('Enter');
  await page.locator('.overview-search-result').first().click();
  await page.locator('[data-finance-search]').waitFor(); assert.equal(await page.locator('[data-finance-search]').inputValue(), 'TEST-1');
  assert.match(await page.locator('#finance-admin').innerText(), /TEST-1/);
  await home();

  await page.locator('.overview-stat').first().click();
  await page.locator('#appointment-date').waitFor({state:'attached'}); assert.equal(await page.locator('#appointment-date').inputValue(), today);
  assert.equal(await page.locator('#appointments-table tbody tr').count(), 2);
  await page.locator('#appointment-status').selectOption('cancelled');
  assert.match(await page.locator('#appointments-table').innerText(), /C-CANCEL/);
  await page.locator('#appointment-status').selectOption('all');
  await page.locator('[data-vn-date-for="appointment-date"]').fill(tomorrow.split('-').reverse().join('/')); await page.locator('[data-vn-date-for="appointment-date"]').dispatchEvent('change');
  assert.match(await page.locator('#appointments-table').innerText(), /D-NEXT/);
  await page.locator('[data-action="reset-appointment-filter"]').click();
  assert.equal(await page.locator('#appointment-date').inputValue(), '');
  await page.locator('#appointment-service').selectOption('personal'); assert.equal(await page.locator('#appointments-table tbody tr').count(), 1);
  await page.locator('#appointment-search').fill('not found'); assert.match(await page.locator('#appointments-table').innerText(), /Chưa có lịch hẹn/);

  await home(); await page.locator('.overview-stat').nth(1).click();
  assert.equal(await page.locator('#appointment-status').inputValue(), 'pending');
  assert.equal(await page.locator('#appointments-table tbody tr').count(), 1);
  await home(); await page.locator('.overview-stat').nth(2).click();
  await page.locator('[data-finance-month]').waitFor(); assert.equal(await page.locator('[data-finance-month]').inputValue(), today.slice(0, 7));
  assert.equal(await page.locator('[data-finance-search]').inputValue(), '');
  await home(); await page.locator('.overview-task').nth(0).click();
  assert.equal(await page.locator('[data-finance-status]').inputValue(), 'pending');
  assert.equal(await page.locator('.finance-booking').count(), 1);
  await home(); await page.locator('.overview-task').nth(1).click();
  await page.locator('#req-status-filter').waitFor(); assert.equal(await page.locator('#req-status-filter').inputValue(), 'open');
  assert.equal(await page.locator('#req-type-filter').inputValue(), 'reschedule');
  assert.equal(await page.locator('#requests-table-body tr').count(), 2);
  await home(); await page.locator('.overview-task').nth(2).click(); assert.equal(await page.locator('[data-finance-status]').inputValue(), 'refund');
  assert.equal(await page.locator('.finance-booking').count(), 1);
  await home(); await page.locator('[data-action="new-appointment"]').click(); await page.locator('#modal-customer').waitFor(); await page.locator('.modal [data-action="close-modal"]').first().click();

  await home();
  const before = gets; slow = true;
  await page.locator('[data-overview="refresh"]').click();
  assert.equal(await page.locator('[data-overview="refresh"]').isDisabled(), true);
  await page.waitForFunction(() => !document.querySelector('[data-overview="refresh"]')?.disabled);
  slow = false; assert.equal(gets, before + 1);
  fail = true; await page.locator('[data-overview="refresh"]').click(); await page.locator('.overview-alert').waitFor();
  await assertCards(); assert.match(await page.locator('.overview-alert').innerText(), /lần tải gần nhất/);
  fail = false; await page.locator('[data-overview="refresh"]').click(); await page.locator('.overview-alert').waitFor({ state: 'detached' });
  await page.locator('.overview-more summary').click();
  const downloadEvent = page.waitForEvent('download'); await page.locator('[data-overview="export"]').click(); const download = await downloadEvent;
  assert.match(download.suggestedFilename(), /hoan-tong-quan/);
  const csv = await readFile(await download.path(), 'utf8'); assert.match(csv, /Thu ròng tháng/); assert.match(csv, /Tiền hoàn/); assert.match(csv, /Dịch vụ cũ/);

  await page.setViewportSize({ width: 390, height: 844 }); await home(); await assertCards();
  assert.equal(await page.locator('.ma-app').count(), 1);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  await page.screenshot({ path: 'outputs/overview/mobile.png', fullPage: true, style:'.toast{visibility:hidden!important}' });
  await page.locator('.overview-stat').first().click(); await page.locator('.ma-booking-card').first().waitFor();
  assert.match(await page.locator('.ma-main').innerText(), /Khách thử A-EARLY/);
  assert.doesNotMatch(await page.locator('.ma-main').innerText(), /Khách thử C-CANCEL|Khách thử D-NEXT/);
  await home(); await page.locator('.overview-task').nth(1).click();
  assert.match(await page.locator('.ma-main').innerText(), /Khách đổi lịch/); assert.match(await page.locator('.ma-main').innerText(), /Khách đang xử lý/);
  assert.doesNotMatch(await page.locator('.ma-main').innerText(), /Đã xong|Tư vấn khác/);
  await page.locator('[data-ma-form="support-search"] input').fill('Khách đổi');
  await page.locator('[data-ma-form="support-search"] input').press('Enter');
  assert.doesNotMatch(await page.locator('.ma-main').innerText(), /Khách đang xử lý/);
  await page.locator('[data-ma-form="support-search"] input').fill('');
  await page.locator('[data-ma-form="support-search"] input').press('Enter');
  await page.getByText('Khách đang xử lý', { exact: true }).waitFor();
  await page.locator('.ma-segments a').nth(1).click();
  await page.getByText('Đã xong', { exact: true }).waitFor();
  assert.match(await page.locator('.ma-main').innerText(), /Đã xong/);
  assert.match(page.url(), /type=reschedule/);
  await home(); await page.locator('.overview-booking').first().click(); assert.match(page.url(), /admin\/appointments\/A-EARLY/);

  // Keep long days compact while retaining a link to the complete day.
  for (let index = 0; index < 6; index++) business.appointments.push(appointment('EXTRA-' + index, today, '15:00', 'confirmed', 'party', 0));
  await home(); await page.locator('[data-overview="refresh"]').click();
  await page.waitForFunction(() => document.querySelector('.overview-stat strong')?.textContent === '8');
  assert.equal(await page.locator('.overview-booking').count(), 5);
  assert.match(await page.locator('.overview-today footer').innerText(), /Xem đủ 8 lịch/);

  // The same browser renders genuine empty state and initial network failure.
  business.appointments = []; business.paymentTransactions = []; business.requests = []; business.notifications = [];
  await home(); await page.locator('[data-overview="refresh"]').click();
  await page.waitForFunction(() => window.state?.appointments.length === 0);
  assert.match(await page.locator('.overview-today').innerText(), /chưa có lịch hẹn/);
  assert.match(await page.locator('.overview-pending').innerText(), /Chưa có yêu cầu cần xử lý/);
  assert.equal(await page.locator('.overview-task').count(), 0);
  await page.setViewportSize({ width: 1920, height: 1080 }); await home();
  const emptyLayout = await page.locator('#overview-dashboard').evaluate(root => {
    const stats = [...root.querySelectorAll('.overview-stat')].map(node => node.getBoundingClientRect());
    const panels = [...root.querySelectorAll('.overview-panel')].map(node => node.getBoundingClientRect());
    return { width: root.getBoundingClientRect().width, statsAligned: stats.every(rect => Math.abs(rect.top - stats[0].top) < 1), panelsAligned: Math.abs(panels[0].top - panels[1].top) < 1 && Math.abs(panels[0].bottom - panels[1].bottom) < 1, version: root.dataset.overviewVersion };
  });
  assert.equal(emptyLayout.statsAligned, true); assert.equal(emptyLayout.panelsAligned, true);
  assert.ok(emptyLayout.width <= 1280); assert.equal(emptyLayout.version, 'workspace-4');
  assert.equal(await page.locator('.overview-bar-day,.overview-event').count(),0);
  assert.match(await page.locator('.overview-cash-chart').innerText(),/Chưa có thu chi/);
  assert.match(await page.locator('.overview-activity').innerText(),/Chưa có hoạt động/);
  await page.screenshot({ path: 'outputs/overview/desktop-empty-wide.png', fullPage: true });
  fail = true; await page.reload(); await ready(); await page.locator('.overview-alert').waitFor();
  assert.deepEqual(await page.locator('.overview-stat strong').allTextContents(), ['—', '—', '—']);
  assert.equal(await page.locator('[data-overview="export"]').isDisabled(), true);
  fail = false; await page.locator('[data-overview="refresh"]').click(); await page.locator('.overview-alert').waitFor({ state: 'detached' });
  assert.deepEqual(writes, [], 'Overview navigation, refresh and export must not mutate business data');
  assert.deepEqual(errors, []);
  console.log('PASS compact overview: three KPIs, five-booking limit, actionable queues, search, filters, optional CSV, refresh/error recovery, empty states, desktop/mobile layout and no business writes.');
} catch (error) {
  await page.screenshot({ path: 'outputs/overview/failure.png', fullPage: true }); console.error('Browser errors:', errors); throw error;
} finally { await browser.close(); }
