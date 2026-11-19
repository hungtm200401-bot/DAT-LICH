import assert from 'node:assert/strict';
import { mkdir,readFile } from 'node:fs/promises';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

// Read-only, isolated fixtures. No real booking or transaction is changed.
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173';
const appointment=(code,customer,status='confirmed')=>({code,customer,status,total:700000,phone:'0901234567',serviceId:'party',date:'2026-11-03',time:'09:00',deposit:0,paymentStatus:'unverified',refundStatus:'none'});
const transaction=(id,code,kind,amount,date,reference=id)=>({id,appointmentCode:code,kind,amount,occurredAt:date,createdAt:date,method:kind.startsWith('opening')?'legacy':'bank',reference:kind.startsWith('opening')?'':reference,note:''});
const business={services:[{id:'party',name:'Trang điểm dự tiệc',duration:90,price:700000,enabled:true}],appointments:[appointment('H-101','Đỗ Ngọc Anh'),appointment('H-102','Thu Hà'),appointment('H-103','Minh Thư','pending'),appointment('H-104','Khánh Linh','cancelled'),appointment('H-105','Bảo Trâm')],paymentTransactions:[transaction('A-DEP','H-101','deposit',200000,'2025-10-15T08:00:00Z'),transaction('A-BAL','H-101','balance',500000,'2026-11-03T08:00:00Z'),transaction('B-DEP','H-102','deposit',200000,'2024-12-01T08:00:00Z'),transaction('C-DEP','H-103','deposit',100000,'2025-06-01T08:00:00Z'),transaction('D-DEP','H-104','deposit',200000,'2023-01-01T08:00:00Z'),transaction('D-REF','H-104','refund',100000,'2023-01-02T08:00:00Z'),transaction('E-OPEN','H-105','opening',200000,'2026-11-01T08:00:00Z'),transaction('E-OPEN-REF','H-105','opening_refund',50000,'2026-11-01T08:00:00Z')],bookingDetails:{'H-103':{depositRequired:300000}},settings:{deposit:200000},brand:{},customers:[],notifications:[],requests:[],scheduleSlots:[]};
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1050},reducedMotion:'reduce',acceptDownloads:true});
await context.addInitScript(()=>{localStorage.setItem('hoanAdminToken','history-fixture');localStorage.setItem('hoanAnalyticsConsent','no');});
const writes=[];
await context.route('**/api/**',route=>{
  const request=route.request(),path=new URL(request.url()).pathname;
  if(request.method()!=='GET'){writes.push(path);return route.fulfill({status:405,json:{error:'Read-only history test'}});}
  return route.fulfill({json:path==='/api/data'?business:path==='/api/site-content'?{pages:{},drafts:{}}:path==='/api/cms-resources'?{shared:{value:{},revision:''},media:{value:[],revision:''},templates:{value:[],revision:''}}:{}});
});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
const rows=()=>page.locator('.finance-history-table [data-history-id]');
const kind=value=>page.locator(`[data-finance="history-kind"][data-kind="${value}"]`);
const reset=async()=>{const button=page.locator('.finance-history-filters [data-finance="history-reset"]');if(await button.count())await button.click();};
const go=async hash=>{await page.goto(base+'/#'+hash);await page.waitForFunction(()=>window.state?.backendReady&&window.HoanFinanceAdmin&&window.HoanOverview&&window.HoanAdminLocations);await page.locator('.finance-history').waitFor();};
const fits=async()=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'page fits viewport');
const screenshot=async name=>page.locator('.finance-history').screenshot({path:`outputs/payment-history/${name}.png`,animations:'disabled',style:'.admin-top,.ma-top,.ma-bottom,.back-to-top-btn,.toast{visibility:hidden!important}'});
try{
  await mkdir('outputs/payment-history',{recursive:true});
  await go('/admin/payments?view=ledger');
  assert.equal(await rows().count(),8);assert.equal(await page.locator('[data-history-period]').inputValue(),'all');assert.equal(await page.locator('[data-finance-month]').inputValue(),'');
  assert.match(await page.locator('[data-history-id="B-DEP"]').innerText(),/2024/);assert.match(await page.locator('[data-history-id="D-REF"]').innerText(),/2023/);await fits();await screenshot('desktop-all');
  assert.match(await page.locator('[data-history-id="A-DEP"]').innerText(),/Thu cọc/);assert.match(await page.locator('[data-history-id="A-DEP"]').innerText(),/Đã thanh toán đủ/);
  await kind('deposit').click();assert.equal(await rows().count(),4);await page.locator('[data-history-stage]').selectOption('settled');assert.equal(await rows().count(),1);assert.equal(await rows().first().getAttribute('data-history-id'),'A-DEP');await screenshot('desktop-paid-deposit');
  const download=page.waitForEvent('download');await page.locator('[data-finance="export"]').click();const csv=await readFile(await (await download).path(),'utf8');assert.match(csv,/A-DEP/);assert.match(csv,/Đã thanh toán đủ/);assert.doesNotMatch(csv,/A-BAL|B-DEP|D-REF/);
  await reset();await kind('balance').click();assert.equal(await rows().count(),1);assert.match(await rows().first().innerText(),/500.000/);assert.match(await rows().first().innerText(),/Đã thanh toán đủ/);
  await reset();await page.locator('[data-history-stage]').selectOption('deposited');assert.equal(await rows().count(),1);assert.match(await rows().first().innerText(),/Thu Hà/);
  await reset();await kind('refund').click();assert.equal(await rows().count(),1);assert.match(await rows().first().innerText(),/Lịch đã hủy/);
  await reset();await kind('legacy').click();assert.equal(await rows().count(),2);assert.match(await rows().first().innerText(),/Không rõ ngày giao dịch/);
  assert.match(await page.locator('.finance-history-summary').innerText(),/Tiền thu\s+0đ/,'legacy credit is not new income');
  await reset();await page.locator('[data-history-period]').selectOption('month');await page.locator('[data-finance-month]').fill('2026-11');await page.locator('[data-finance-month]').dispatchEvent('change');assert.equal(await rows().count(),1);assert.equal(await rows().first().getAttribute('data-history-id'),'A-BAL');
  await page.locator('[data-finance-month]').fill('2025-10');await page.locator('[data-finance-month]').dispatchEvent('change');assert.equal(await rows().count(),1);assert.match(await rows().first().innerText(),/Đã thanh toán đủ/,'month filter does not recompute a misleading partial balance');
  await page.locator('[data-history-period]').selectOption('all');assert.equal(await rows().count(),8);
  await page.locator('[data-finance-search]').fill('do ngoc anh');assert.equal(await rows().count(),2);await reset();await page.locator('[data-finance-search]').fill('090123');assert.equal(await rows().count(),8);await reset();await page.locator('[data-finance-search]').fill('A-BAL');assert.equal(await rows().count(),1);await reset();
  await go('/admin/payments?month=2026-11');assert.equal(await rows().count(),1);await page.locator('.finance-tabs [data-view="ledger"]').click();assert.equal(await rows().count(),8);assert.equal(await page.locator('[data-history-period]').inputValue(),'all');
  await go('/admin/payments?view=ledger&kind=deposit&payment=settled');assert.equal(await rows().count(),1);await go('/admin/payments?view=ledger');assert.equal(await rows().count(),8);

  await page.setViewportSize({width:390,height:844});await fits();await kind('deposit').click();assert.equal(await rows().count(),4);
  for(const column of [3,5])assert.equal(await rows().first().locator(`td:nth-child(${column})`).evaluate(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth;}),true,'mobile type and payment status columns must be visible');
  await screenshot('mobile-deposits');
  await rows().first().locator('.finance-history-detail summary').click();assert.match(await rows().first().innerText(),/A-DEP/);await fits();await reset();await page.locator('[data-history-stage]').selectOption('settled');assert.equal(await rows().count(),2);await screenshot('mobile-settled');
  await reset();await page.locator('[data-finance-search]').fill('not-found');assert.equal(await rows().count(),0);assert.match(await page.locator('.finance-history').innerText(),/Không có giao dịch phù hợp/);await page.locator('.finance-history-filters [data-finance="history-reset"]').click();assert.equal(await rows().count(),8);
  for(let i=0;i<125;i++)business.paymentTransactions.push(transaction('BULK-'+i,'H-102','deposit',1000,'2020-01-01T00:00:00Z'));
  await page.locator('[data-finance="refresh"]').click();await page.waitForFunction(()=>document.querySelectorAll('[data-history-id]').length===133);assert.equal(await rows().count(),133,'history must not silently cap records');await fits();
  const firstId=await rows().first().getAttribute('data-history-id');await rows().first().locator('td:nth-child(2) a').click();await page.locator('[data-finance-booking]').waitFor();assert.equal(await page.locator('.finance-dialog[open]').count(),0);assert.ok(firstId);
  business.appointments=[];business.paymentTransactions=[];await go('/admin/payments?view=ledger');await page.locator('[data-finance="refresh"]').click();await page.waitForFunction(()=>window.state?.paymentTransactions?.length===0);assert.equal(await rows().count(),0);assert.match(await page.locator('.finance-history').innerText(),/Chưa có giao dịch được ghi nhận/);
  assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
  console.log('PASS payment history: all years and 133 uncapped rows; distinct deposit/balance/refund/legacy lists; current partial/deposited/settled/cancelled states; booking snapshot; optional month and full-history reset; name/phone/reference search; filtered CSV; responsive desktop/mobile; empty state and navigation. No business writes.');
}catch(error){await page.screenshot({path:'outputs/payment-history/failure.png',fullPage:false});console.error(errors);throw error;}
finally{await browser.close();}
