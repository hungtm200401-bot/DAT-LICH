import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';
import {summarizePayments} from '../public/finance-utils.js';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173';
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
const initial=await(await context.request.get(base+'/api/data')).json();
const business={...initial,appointments:[{code:'FINANCE-FIXTURE',customer:'Khách kiểm thử',phone:'0900000000',serviceId:'party',date:'2026-12-01',time:'09:00',address:'Địa chỉ kiểm thử',status:'pending',paymentStatus:'pending_verification',refundStatus:'none',total:700000,deposit:0,createdAt:new Date().toISOString()}],paymentTransactions:[],customers:[],notifications:[],requests:[],bookingDetails:{'FINANCE-FIXTURE':{depositRequired:200000}},settings:{...initial.settings,deposit:200000}};
const writes=[];
let dropCommittedResponse=false;
await context.addInitScript(()=>{localStorage.setItem('hoanAnalyticsConsent','no');localStorage.setItem('hoanAdminToken','fixture-token');});
await context.route('**/api/data*',async route=>{
  if(route.request().method()==='GET')return route.fulfill({json:business});
  const payload=route.request().postDataJSON();writes.push(payload);
  if(payload.action!=='recordPayment')return route.fulfill({json:{ok:true}});
  const existing=business.paymentTransactions.find(row=>row.idempotencyKey===payload.idempotencyKey);
  if(existing)return route.fulfill({json:{transaction:existing,appointment:business.appointments[0],replayed:true}});
  const appointment=business.appointments[0],s=summarizePayments(appointment,business.paymentTransactions);
  if(payload.kind==='refund'&&payload.amount>s.netReceived)return route.fulfill({status:409,json:{error:'Khoản hoàn vượt số tiền thực còn giữ của lịch này.'}});
  if(payload.kind!=='refund'&&payload.amount>s.remaining)return route.fulfill({status:409,json:{error:'Số tiền thu vượt phần còn phải thanh toán.'}});
  if(business.paymentTransactions.some(row=>row.reference===payload.reference&&payload.method==='bank'))return route.fulfill({status:409,json:{error:'Mã giao dịch ngân hàng đã được ghi nhận.'}});
  const transaction={id:'TEST-'+writes.length,appointmentCode:payload.code,...payload,createdAt:new Date().toISOString()};business.paymentTransactions.unshift(transaction);
  appointment.finance=summarizePayments(appointment,business.paymentTransactions);appointment.deposit=appointment.finance.netReceived;appointment.paymentStatus=appointment.deposit>0?'received':'unverified';if(payload.confirmAppointment&&appointment.deposit>=200000)appointment.status='confirmed';if(payload.kind==='refund')appointment.refundStatus=appointment.deposit>0?'partial':'paid';
  if(dropCommittedResponse){dropCommittedResponse=false;return route.abort('failed');}
  await route.fulfill({json:{transaction,appointment}});
});
await context.route('**/api/site-content*',route=>route.fulfill({json:{pages:{},drafts:{}}}));
await context.route('**/api/cms-resources*',route=>route.fulfill({json:{shared:{value:{albums:[],testimonials:[]},revision:''},media:{value:[],revision:''},templates:{value:[],revision:''}}}));
const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
try{
  await mkdir('outputs/finance',{recursive:true});
  await page.goto(base+'/#/admin/payments');await page.locator('#finance-admin').waitFor();await page.waitForFunction(()=>Boolean(window.HoanFinanceAdmin));
  await page.locator('[data-finance-search]').fill('khach');assert.equal(await page.locator('.finance-appointments tbody tr').count(),1);await page.locator('[data-finance-search]').fill('not-found');assert.match(await page.locator('.finance-appointments tbody').innerText(),/Không có lịch/);await page.locator('[data-finance-search]').fill('');
  await page.locator('[data-finance="record"][data-code]').first().click();
  const form=page.locator('.finance-dialog form');await form.waitFor();
  assert.equal(await form.locator('[name="amount"]').inputValue(),'200000');
  await form.locator('[type="submit"]').click();assert.equal(writes.length,0,'missing bank reference must be blocked');
  await form.locator('[name="reference"]').fill('BANK-FIXTURE-1');await form.locator('[type="submit"]').click();await page.locator('.finance-dialog').waitFor({state:'detached'});
  assert.equal(business.appointments[0].deposit,200000);assert.equal(business.appointments[0].status,'confirmed');
  await page.locator('[data-finance="record"][data-kind="balance"]').click();assert.equal(await form.locator('[name="amount"]').inputValue(),'500000');await form.locator('[name="reference"]').fill('BANK-FIXTURE-1');await form.locator('[type="submit"]').click();await page.locator('.finance-form-error:not([hidden])').waitFor();assert.match(await page.locator('.finance-form-error').innerText(),/đã được ghi nhận/);assert.equal(business.paymentTransactions.length,1);
  await form.locator('[name="reference"]').fill('BANK-FIXTURE-2');await form.locator('[type="submit"]').click();await page.locator('.finance-dialog').waitFor({state:'detached'});assert.equal(business.appointments[0].deposit,700000);
  await page.locator('[data-finance="record"][data-kind="refund"]').click();await form.locator('[name="amount"]').fill('700001');await form.locator('[name="reference"]').fill('BANK-FIXTURE-3');await form.locator('[name="note"]').fill('Hoàn một phần theo thỏa thuận kiểm thử');await form.locator('[type="submit"]').click();await page.locator('.finance-form-error:not([hidden])').waitFor();assert.match(await page.locator('.finance-form-error').innerText(),/vượt số tiền/);assert.equal(business.paymentTransactions.length,2);
  await form.locator('[name="amount"]').fill('50000');await form.locator('[type="submit"]').click();await page.locator('.finance-dialog').waitFor({state:'detached'});assert.equal(business.appointments[0].deposit,650000);assert.equal(business.appointments[0].finance.refunded,50000);
  // The bank has accepted money but the response is lost. Reopening must retry
  // the original immutable request rather than create a second cash entry.
  await page.locator('[data-finance="record"][data-kind="balance"]').click();await form.locator('[name="method"]').selectOption('cash');dropCommittedResponse=true;await form.locator('[type="submit"]').click();await page.locator('.finance-form-error:not([hidden])').waitFor();assert.equal(business.paymentTransactions.length,4);assert.equal(await form.locator('[name="amount"]').isDisabled(),true);const retryKey=writes.at(-1).idempotencyKey;
  await page.locator('.finance-close').click();await page.locator('.finance-toolbar [data-finance="record"]').click();assert.equal(await form.locator('[name="amount"]').inputValue(),'50000');assert.equal(await form.locator('[name="amount"]').isDisabled(),true);await form.locator('[type="submit"]').click();await page.locator('.finance-dialog').waitFor({state:'detached'});assert.equal(writes.at(-1).idempotencyKey,retryKey);assert.equal(business.paymentTransactions.length,4);
  const downloadPromise=page.waitForEvent('download');await page.locator('[data-finance="export"]').click();const download=await downloadPromise;assert.match(download.suggestedFilename(),/hoan-so-thu-hoan/);await download.saveAs('outputs/finance/fixture-ledger.csv');
  await page.screenshot({path:'outputs/finance/desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.locator('.ma-app #finance-admin').waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'mobile must not overflow horizontally');
  await page.locator('[data-finance="record"][data-kind="refund"]').click();assert.equal(await page.locator('.finance-dialog').evaluate(node=>node.scrollWidth>node.clientWidth+1),false);await page.screenshot({path:'outputs/finance/mobile-dialog.png',fullPage:true});await page.locator('.finance-close').click();
  await page.goto(base+'/#/admin/payments/FINANCE-FIXTURE');await page.locator('[data-ma-action="finance-record"]').first().waitFor();assert.match(await page.locator('.ma-details').innerText(),/700.000/);assert.equal(await page.locator('[data-ma-form="reconcile"]').count(),0);
  assert.equal(errors.length,0,errors.join('\n'));console.log('PASS: deposit + balance + partial refund; duplicate/overrefund/required checks; lost response cash retry after reopen; filters + CSV; desktop/mobile. All business writes mocked.');
}finally{await browser.close();}
