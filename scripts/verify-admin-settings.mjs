import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5174';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
await mkdir('outputs/admin-settings', { recursive: true });
try {
  for (const width of [1440, 1024, 768, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    const data = { services: [], appointments: [], customers: [], requests: [], notifications: [], scheduleSlots: [], paymentTransactions: [], bookingDetails: {}, settings: { bookingWindow: '60', deposit: '200000', travelFee: '50000', bankName: '', bankCode: '', bankAccount: '', bankOwner: '', scheduleOpen: true }, brand: { phone: '', email: '' } };
    const writes = [], errors = [];
    let failSave = false;
    await context.addInitScript(() => { localStorage.setItem('hoanAnalyticsConsent', 'no'); localStorage.setItem('hoanAdminToken', 'fixture-token'); });
    await context.route('**/api/**', async route => {
      const request = route.request(), url = new URL(request.url());
      if (url.pathname === '/api/data') {
        if (request.method() === 'GET') return route.fulfill({ json: data });
        const body = request.postDataJSON(); writes.push(body);
        assert.equal(body.action, 'saveContent');
        assert.ok(['settings', 'brand'].includes(body.key));
        if (failSave) return route.fulfill({ status: 503, json: { error: 'Không thể lưu thử nghiệm' } });
        data[body.key] = body.value;
        return route.fulfill({ json: { ok: true } });
      }
      if (url.pathname === '/api/uploads') {
        if (request.method() === 'POST') return route.fulfill({ json: { paths: ['/api/uploads?key=references%2Fsettings-fixture.png'] } });
        return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect x="10" y="10" width="130" height="130" fill="white" stroke="black"/><text x="20" y="80" font-size="12">QR TEST FIXTURE</text></svg>' });
      }
      return route.fulfill({ json: {} });
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    let loads = 0;
    const load = async () => {
      await page.goto(base + '/?settings-qa=' + (++loads) + '#/admin/settings');
      await page.waitForFunction(() => window.state?.backendReady && window.HoanSettingsView);
      await page.locator('#setting-bookingWindow').waitFor();
      await page.waitForLoadState('networkidle');
    };
    const fit = async () => {
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'viewport fits at ' + width);
      assert.deepEqual(await page.locator('.settings-workspace input:not([type=file])').evaluateAll(inputs => inputs.filter(el => el.scrollWidth > el.clientWidth + 2).map(el => el.name)), [], 'inputs fit');
    };
    await load();
    assert.equal(writes.length, 0);
    assert.equal(await page.locator('.settings-workspace form').count(), 2);
    assert.equal(await page.locator('[data-settings-jump]').count(), 4);
    assert.equal(await page.locator('.settings-qr-empty').count(), 1);
    await fit();
    if ([1440, 390].includes(width)) await page.screenshot({ path: `outputs/admin-settings/${width === 1440 ? 'desktop' : 'mobile'}.png`, fullPage: true, animations: 'disabled' });
    await page.locator('[data-settings-jump=address]').click();
    assert.equal(await page.locator('#settings-address').evaluate(el => el.open), true);
    assert.equal(await page.evaluate(() => location.hash), '#/admin/settings', 'section jumps preserve admin route');
    await page.locator('[data-settings-jump=bank]').click();
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'setting-bankName');
    await page.getByLabel('Ngân hàng', { exact: true }).fill('Ngân hàng thử');
    await page.getByLabel('Mã ngân hàng VietQR', { exact: true }).fill('MB');
    await page.getByLabel('Số tài khoản', { exact: true }).fill('0012345678');
    await page.getByLabel('Chủ tài khoản', { exact: true }).fill('NGUOI DUNG THU');
    assert.match(await page.locator('.settings-state').innerText(), /Đã nhập đủ/);
    await page.getByLabel('Mức cọc tiêu chuẩn', { exact: true }).fill('250000');
    const saved = page.waitForResponse(r => r.url().includes('/api/data') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Lưu thiết lập', exact: true }).click();
    await saved;
    assert.equal(writes.at(-1).value.bankAccount, '0012345678');
    assert.equal(writes.at(-1).value.deposit, '250000');
    assert.equal(writes.at(-1).value.scheduleOpen, true, 'unrelated settings retained');
    assert.equal(writes.at(-1).key, 'settings');
    await page.getByLabel('Số điện thoại / Zalo', { exact: true }).fill('0987000000');
    await page.getByLabel('Email', { exact: true }).fill('fixture@example.com');
    const contactSaved = page.waitForResponse(r => r.url().includes('/api/data') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Lưu thông tin liên hệ', exact: true }).click();
    await contactSaved;
    assert.equal(writes.at(-1).key, 'brand');
    assert.equal(writes.at(-1).value.email, 'fixture@example.com');
    await load();
    assert.equal(await page.getByLabel('Số tài khoản', { exact: true }).inputValue(), '0012345678');
    assert.equal(await page.getByLabel('Số điện thoại / Zalo', { exact: true }).inputValue(), '0987000000');
    assert.equal(await page.getByLabel('Email', { exact: true }).inputValue(), 'fixture@example.com');
    assert.match(await page.locator('.settings-state').innerText(), /Đã nhập đủ/);
    failSave = true;
    await page.getByLabel('Mức cọc tiêu chuẩn', { exact: true }).fill('300000');
    await page.getByRole('button', { name: 'Lưu thiết lập', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#toast')?.textContent.includes('Không thể lưu thử nghiệm'));
    assert.equal(data.settings.deposit, '250000');
    failSave = false;
    await page.getByRole('button', { name: 'Lưu thiết lập', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('#toast')?.textContent === 'Đã lưu cài đặt');
    assert.equal(data.settings.deposit, '300000');
    await page.locator('[data-payment-qr]').setInputFiles({ name: 'fixture.png', mimeType: 'image/png', buffer: Buffer.from('fixture-image') });
    await page.locator('.settings-qr-preview img').waitFor();
    assert.equal(data.settings.paymentQrUrl, '/api/uploads?key=references%2Fsettings-fixture.png');
    assert.equal(await page.locator('.settings-qr-empty').count(), 0);
    await fit();
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('PASS settings: five viewport sizes, section navigation, empty/loaded QR and upload, settings and contact save/reload, bank leading zero, preserved unrelated settings, save failure/retry; mocked API only.');
} finally { await browser.close(); }
