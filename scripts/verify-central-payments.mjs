import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';
import { summarizePayments } from '../public/finance-utils.js';

// Isolated browser fixtures only: never send a payment to the real business API.
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173';
const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh'}).format(new Date());
const row=(code,customer,status='pending',paymentStatus='unverified',refundStatus='none',total=700000)=>({code,customer,status,paymentStatus,refundStatus,total,phone:'0901234567',serviceId:'party',date:today,time:'09:00',address:'Địa chỉ kiểm thử',deposit:0});
const business={services:[{id:'party',name:'Trang điểm dự tiệc',duration:90,price:700000,enabled:true}],appointments:[row('HOAN-101','Ngọc Anh','pending','pending_verification'),row('HOAN-102','Minh Thư'),row('HOAN-103','Bảo Trâm','confirmed','received'),row('HOAN-104','Khánh Linh','cancelled','received','pending'),row('HOAN-105','Thanh Hằng','completed','received'),row('HOAN-106','Hà My','cancelled','received','rejected'),row('HOAN-107','Không yêu cầu cọc','pending','unverified','none',0),row('HOAN-108','Phương Anh')],paymentTransactions:[],bookingDetails:{'HOAN-102':{depositRequired:300000}},settings:{deposit:200000,scheduleOpen:true},customers:[],requests:[],notifications:[],scheduleSlots:[],brand:{}};
for(const [code,amount] of [['HOAN-102',100000],['HOAN-103',200000],['HOAN-104',200000],['HOAN-105',700000],['HOAN-106',100000]])business.paymentTransactions.push({id:'OPEN-'+code,appointmentCode:code,kind:'opening',amount,method:'legacy',reference:'',occurredAt:new Date().toISOString(),createdAt:new Date().toISOString()});
const sync=a=>{a.finance=summarizePayments(a,business.paymentTransactions);a.deposit=a.finance.netReceived;};business.appointments.forEach(sync);
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1100},acceptDownloads:true,reducedMotion:'reduce'});
await context.addInitScript(()=>{localStorage.setItem('hoanAdminToken','fixture-token');localStorage.setItem('hoanAnalyticsConsent','no');});
let uncertain=false,failRefresh=false;const writes=[],replies=new Map();
await context.route('**/api/**',async route=>{
  const request=route.request(),path=new URL(request.url()).pathname;
  if(path!=='/api/data')return route.fulfill({json:path==='/api/site-content'?{pages:{},drafts:{}}:path==='/api/cms-resources'?{shared:{value:{},revision:''},media:{value:[],revision:''},templates:{value:[],revision:''}}:{}});
  if(request.method()==='GET')return route.fulfill(failRefresh?{status:503,json:{error:'Lỗi làm mới kiểm thử'}}:{json:business});
  const payload=request.postDataJSON();writes.push(payload);
  if(payload.action!=='recordPayment')throw new Error('Unexpected business write: '+payload.action);
  if(replies.has(payload.idempotencyKey))return route.fulfill({json:{...replies.get(payload.idempotencyKey),replayed:true}});
  if(payload.method==='bank'&&business.paymentTransactions.some(t=>t.reference.toLowerCase()===payload.reference.toLowerCase()))return route.fulfill({status:409,json:{error:'Mã giao dịch ngân hàng đã được ghi nhận.'}});
  const a=business.appointments.find(a=>a.code===payload.code),before=summarizePayments(a,business.paymentTransactions);
  if(payload.kind==='refund'?payload.amount>before.netReceived:a.status==='cancelled'||payload.amount>before.remaining)return route.fulfill({status:409,json:{error:'Số tiền không hợp lệ.'}});
  const transaction={...payload,id:'TEST-'+writes.length,appointmentCode:a.code,createdAt:new Date().toISOString()};business.paymentTransactions.unshift(transaction);sync(a);a.paymentStatus=a.deposit>0?'received':'unverified';
  if(payload.kind==='refund')a.refundStatus=a.deposit===0?'paid':'partial';
  else if(payload.confirmAppointment&&a.status==='pending'&&a.deposit>=Math.min(a.total,business.bookingDetails[a.code]?.depositRequired??200000))a.status='confirmed';
  const result={appointment:structuredClone(a),transaction};replies.set(payload.idempotencyKey,result);
  if(uncertain){uncertain=false;return route.fulfill({status:503,json:{error:'Chưa nhận được phản hồi kiểm thử.'}});}
  return route.fulfill({status:201,json:result});
});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
const card=code=>page.locator(`[data-finance-booking="${code}"]`);
const dialog=()=>page.locator('.finance-dialog[open]');
const go=async hash=>{await page.goto(base+'/#'+hash);await page.locator('#finance-admin').waitFor();await page.waitForFunction(()=>window.state?.backendReady&&window.HoanFinanceAdmin);};
const shot=async name=>page.screenshot({path:`outputs/central-payments/${name}.png`,fullPage:!(await dialog().count()),animations:'disabled',style:'.toast{visibility:hidden!important}'});
const open=async(code,kind)=>{await card(code).locator(kind?`[data-kind="${kind}"]:not(:disabled)`:'[data-finance="collect"]:not(:disabled),[data-finance="record"]').first().click();await dialog().waitFor();};
const checkbox=(code,kind)=>card(code).locator(`input[data-finance="collect"][data-kind="${kind}"]`);
const submit=async reference=>{if(reference)await dialog().locator('[name="reference"]').fill(reference);await dialog().locator('[type="submit"]').click();};
const noOverflow=async()=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'page must fit viewport');
try{
  await mkdir('outputs/central-payments',{recursive:true});
  await go('/admin/payments');assert.equal(await page.locator('.finance-booking').count(),4);await noOverflow();await shot('desktop-attention');
  await page.setViewportSize({width:390,height:844});await go('/admin/payments');await noOverflow();await shot('mobile-attention');await page.setViewportSize({width:1440,height:1100});await go('/admin/payments');
  await page.locator('[data-view="all"]').click();assert.equal(await page.locator('.finance-booking').count(),8);assert.match(await card('HOAN-103').innerText(),/Thu còn lại/);assert.equal(await card('HOAN-105').locator('.finance-booking-actions > [data-finance="record"]').count(),0);await shot('desktop-all');
  assert.equal(await checkbox('HOAN-101','deposit').isChecked(),false);assert.equal(await checkbox('HOAN-101','balance').isEnabled(),false);
  assert.equal(await checkbox('HOAN-103','deposit').isChecked(),true);assert.equal(await checkbox('HOAN-103','balance').isChecked(),false);assert.equal(await checkbox('HOAN-103','balance').isEnabled(),true);
  assert.equal(await checkbox('HOAN-105','deposit').isChecked(),true);assert.equal(await checkbox('HOAN-105','balance').isChecked(),true);assert.equal(await checkbox('HOAN-105','balance').isEnabled(),false);
  assert.equal(await card('HOAN-104').locator('[data-finance="collect"]').count(),0,'cancelled bookings retain the refund flow');

  await page.goto(base+'/#/admin/appointments');await page.locator('[data-action="admin-open-payments"]').first().waitFor();assert.equal(await page.locator('[data-action="admin-confirm-deposit"],[data-action="admin-reset-deposit"]').count(),0);
  await page.locator('[data-action="admin-open-payments"][data-code="HOAN-101"]').click();await card('HOAN-101').waitFor();assert.equal(await page.locator('.finance-booking').count(),1);assert.equal(await dialog().count(),0);
  await open('HOAN-101');assert.equal(await checkbox('HOAN-101','deposit').isChecked(),false,'opening a confirmation must not mark a receipt paid');await dialog().locator('.finance-cancel').click();assert.equal(writes.length,0);assert.equal(await checkbox('HOAN-101','deposit').isChecked(),false);
  await open('HOAN-101');assert.equal(await dialog().locator('[name="kind"]').inputValue(),'deposit');assert.equal(await dialog().locator('[name="amount"]').inputValue(),'200000');assert.equal(await dialog().locator('[name="confirmAppointment"]').count(),0);await shot('desktop-deposit-dialog');
  await dialog().locator('[name="amount"]').fill('100000');assert.match(await dialog().locator('.finance-outcome').innerText(),/còn thiếu 100.000/);await submit('BANK-PARTIAL');await dialog().waitFor({state:'detached'});assert.equal(writes.at(-1).confirmAppointment,true);assert.equal(business.appointments[0].status,'pending');assert.match(await card('HOAN-101').innerText(),/Cọc chưa đủ/);
  assert.equal(await checkbox('HOAN-101','deposit').isChecked(),false);assert.equal(await checkbox('HOAN-101','balance').isEnabled(),false);
  await open('HOAN-101');assert.equal(await dialog().locator('[name="amount"]').inputValue(),'100000');await submit('BANK-FULL');await dialog().waitFor({state:'detached'});assert.equal(business.appointments[0].status,'confirmed');assert.match(await card('HOAN-101').innerText(),/Thu còn lại/);
  assert.equal(await checkbox('HOAN-101','deposit').isChecked(),true);assert.equal(await checkbox('HOAN-101','deposit').isEnabled(),false);assert.equal(await checkbox('HOAN-101','balance').isChecked(),false);assert.equal(await checkbox('HOAN-101','balance').isEnabled(),true);

  await go('/admin/payments?q=HOAN-102');await open('HOAN-102');assert.equal(await dialog().locator('[name="amount"]').inputValue(),'200000','booking snapshot of 300k overrides global 200k');await submit('BANK-CUSTOM');await dialog().waitFor({state:'detached'});assert.equal(business.appointments[1].status,'confirmed');
  await go('/admin/payments?q=HOAN-103');await open('HOAN-103');await dialog().locator('[name="method"]').selectOption('cash');assert.equal(await dialog().locator('[name="reference"]').isVisible(),false);assert.equal(await dialog().locator('[name="amount"]').inputValue(),'500000');await submit();await dialog().waitFor({state:'detached'});assert.equal(writes.at(-1).reference,'');assert.equal(writes.at(-1).kind,'balance');assert.match(await card('HOAN-103').innerText(),/Đã thu đủ/);
  assert.equal(await checkbox('HOAN-103','deposit').isChecked(),true);assert.equal(await checkbox('HOAN-103','balance').isChecked(),true);assert.equal(await checkbox('HOAN-103','balance').isEnabled(),false);
  await page.reload();await card('HOAN-103').waitFor();assert.equal(await checkbox('HOAN-103','balance').isChecked(),true,'collection checks survive reload from the real ledger snapshot');

  await go('/admin/payments?q=HOAN-104');await open('HOAN-104');assert.equal(await dialog().locator('#finance-dialog-title').innerText(),'Ghi nhận hoàn tiền');await dialog().locator('[name="amount"]').fill('50000');await dialog().locator('[name="refundNote"]').fill('Hoàn một phần theo thỏa thuận kiểm thử');await submit('BANK-REFUND');await dialog().waitFor({state:'detached'});assert.equal(business.appointments[3].deposit,150000);assert.equal(business.appointments[3].refundStatus,'partial');assert.equal(writes.at(-1).confirmAppointment,false);

  await go('/admin/payments?q=HOAN-108');await open('HOAN-108');await submit('BANK-FULL');await dialog().locator('.finance-form-error').waitFor();assert.match(await dialog().locator('.finance-form-error').innerText(),/đã được ghi nhận/);assert.equal(await dialog().locator('[name="amount"]').isDisabled(),false);
  uncertain=true;const transactionCount=business.paymentTransactions.length;await submit('BANK-UNCERTAIN');await page.waitForFunction(()=>document.querySelector('.finance-dialog [name="amount"]')?.disabled);assert.equal(business.paymentTransactions.length,transactionCount+1);const request=structuredClone(writes.at(-1));await shot('retry-dialog');
  await dialog().locator('.finance-cancel').click();await open('HOAN-108');assert.equal(await dialog().locator('[name="amount"]').isDisabled(),true);await submit();await dialog().waitFor({state:'detached'});assert.deepEqual(writes.at(-1),request);assert.equal(business.paymentTransactions.length,transactionCount+1);assert.equal(business.appointments[7].status,'confirmed');

  await page.locator('[data-finance="clear"]').click();await page.locator('[data-view="ledger"]').click();assert.equal(await page.locator('.data-table tbody tr').count(),business.paymentTransactions.length);const download=page.waitForEvent('download');await page.locator('[data-finance="export"]').click();assert.match((await download).suggestedFilename(),/^hoan-so-thu-hoan-/);await shot('desktop-ledger');
  await page.setViewportSize({width:390,height:844});await go('/admin/payments?status=all');await noOverflow();await shot('mobile-all');
  await page.locator('[data-finance-search]').fill('HOAN-104');assert.equal(await page.locator('.finance-booking').count(),1);await open('HOAN-104');await noOverflow();assert.equal(await dialog().evaluate(el=>el.scrollWidth>el.clientWidth+1),false);assert.equal(await dialog().evaluate(el=>{const r=el.getBoundingClientRect(),footer=el.querySelector('footer').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1&&footer.bottom<=innerHeight+1;}),true,'mobile dialog and submit footer must fit the viewport');await shot('mobile-refund-dialog');await dialog().locator('.finance-cancel').click();

  await page.goto(base+'/#/admin/appointments/HOAN-102');await page.locator('.ma-app').waitFor();assert.equal(await page.locator('[data-ma-action="finance-record"]').count(),0);await page.locator('a[href="#/admin/payments?q=HOAN-102"]').click();await card('HOAN-102').waitFor();assert.equal(await dialog().count(),0);await noOverflow();
  await page.goto(base+'/#/admin/payments/HOAN-104/reconcile');await page.getByText('Mở thanh toán',{exact:true}).waitFor();assert.equal(await page.locator('[data-ma-action="finance-record"]').count(),0);await page.getByText('Mở thanh toán',{exact:true}).click();await card('HOAN-104').waitFor();
  await page.goto(base+'/#/admin/appointments/HOAN-108');await page.waitForFunction(()=>Boolean(window.HoanFinanceAdmin));await page.evaluate(()=>window.HoanFinanceAdmin.open('HOAN-108'));await card('HOAN-108').waitFor();assert.equal(await dialog().count(),0,'legacy external calls navigate, never open a scattered dialog');

  await go('/admin/payments?q=HOAN-104');await open('HOAN-104');await dialog().locator('[name="refundNote"]').fill('Hoàn phần còn lại kiểm thử');failRefresh=true;await submit('BANK-REFUND-REST');await dialog().waitFor({state:'detached'});assert.equal(business.appointments[3].refundStatus,'paid');failRefresh=false;
  await go('/admin/payments');await noOverflow();await shot('mobile-empty');assert.equal(await page.locator('.finance-booking').count(),0);assert.match(await page.locator('.finance-empty-state').innerText(),/Đã xử lý xong/);
  await page.locator('.finance-tabs [data-view="all"]').click();await page.locator('[data-finance-search]').fill('khongtontai');assert.equal(await page.locator('.finance-booking').count(),0);assert.match(await page.locator('.finance-empty-state').innerText(),/Không tìm thấy/);
  business.appointments=[];business.paymentTransactions=[];await go('/admin/payments');await page.locator('[data-finance="refresh"]').click();await page.waitForFunction(()=>window.state?.appointments?.length===0);await page.locator('.finance-workspace-tools [data-finance="record"]').click();assert.equal(await dialog().count(),0);assert.match(await page.locator('#toast').innerText(),/Chưa có lịch hẹn/);
  assert.deepEqual(errors,[]);
  console.log('PASS central payments: desktop/mobile canonical navigation; booking-specific deposits; partial/full receipt with one confirmation; cash; partial/full refunds; duplicate rejection; uncertain close/reopen retry without duplicates; ledger/export; committed receipt survives refresh failure; empty/search states; no page errors or overflow. Isolated fixtures, no real business writes.');
}catch(error){await shot('failure');console.error(errors);throw error;}
finally{await browser.close();}
