import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173';
const business={services:[{id:'party',name:'Trang điểm dự tiệc',duration:90,price:700000,enabled:true}],appointments:[],customers:[],paymentTransactions:[],requests:[],notifications:[],scheduleSlots:[],bookingDetails:{},brand:{},settings:{deposit:200000}};
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({locale:'en-US',timezoneId:'America/Los_Angeles',viewport:{width:1440,height:1000},reducedMotion:'reduce'});
await context.addInitScript(()=>{localStorage.setItem('hoanAdminToken','fixture-token');localStorage.setItem('hoanAnalyticsConsent','no');});
const writes=[];
await context.route('**/api/**',route=>{
  const req=route.request(),path=new URL(req.url()).pathname;
  if(req.method()==='GET')return route.fulfill({json:path==='/api/data'?business:path==='/api/site-content'?{pages:{},drafts:{}}:path==='/api/cms-resources'?{shared:{value:{},revision:''},media:{value:[],revision:''},templates:{value:[],revision:''}}:{}});
  const data=req.postDataJSON();writes.push(data);
  if(data.action==='updateAppointment'){
    const appointment=business.appointments.find(row=>row.code===data.code);assert.ok(appointment);Object.assign(appointment,data);return route.fulfill({json:{appointment}});
  }
  if(data.action!=='createAppointment')throw new Error('Unexpected write in fixture: '+data.action);
  const appointment={...data,code:'TEST-'+writes.length,total:700000,deposit:0,status:'pending',paymentStatus:'unverified',refundStatus:'none'};business.appointments.push(appointment);return route.fulfill({status:201,json:{appointment}});
});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.clock.install({time:new Date('2026-11-02T18:00:00Z')});
const display=id=>page.locator(`[data-vn-date-for="${id}"]`);
const calendar=()=>page.locator('.vn-date-calendar');
const fillDate=async(id,value)=>{await display(id).fill(value);await display(id).dispatchEvent('change');};
const go=async hash=>{await page.goto(base+'/#'+hash);await page.waitForFunction(()=>window.state?.backendReady&&window.HoanVietnamDate&&window.HoanOverview&&window.HoanAdminLocations);};
const shot=name=>page.screenshot({path:`outputs/vietnam-date/${name}.png`,animations:'disabled'});
try{
  await mkdir('outputs/vietnam-date',{recursive:true});await go('/admin');
  await page.locator('[data-action="new-appointment"]').click();await display('modal-date').waitFor();
  assert.equal(await display('modal-date').inputValue(),'03/11/2026');assert.equal(await page.locator('#modal-date').inputValue(),'2026-11-03');assert.equal(await display('modal-time').inputValue(),'09:30');
  await page.locator('.modal .vn-date-trigger').first().click();await calendar().waitFor();assert.deepEqual(await calendar().locator('.vn-date-weekdays span').allTextContents(),['T2','T3','T4','T5','T6','T7','CN']);await shot('desktop-calendar');
  await calendar().getByRole('button',{name:'24 tháng 11 năm 2026',exact:true}).click();assert.equal(await display('modal-date').inputValue(),'24/11/2026');assert.equal(await page.locator('#modal-date').inputValue(),'2026-11-24');
  await display('modal-date').press('ArrowDown');await page.keyboard.press('ArrowRight');await page.keyboard.press('Enter');assert.equal(await display('modal-date').inputValue(),'25/11/2026');
  await display('modal-date').press('ArrowDown');await calendar().getByRole('button',{name:'Tháng sau',exact:true}).click();await page.keyboard.press('Escape');assert.equal(await display('modal-date').inputValue(),'25/11/2026');assert.equal(await calendar().count(),0);
  await page.locator('#modal-customer').fill('Khách kiểm thử');await page.locator('#modal-phone').fill('0901234567');await page.locator('#modal-service').selectOption('party');
  await fillDate('modal-date','31/11/2026');await page.locator('[data-confirm="create-appointment"]').click();assert.equal(writes.length,0);assert.match(await display('modal-date').evaluate(el=>el.validationMessage),/ngày\/tháng\/năm/);
  await fillDate('modal-date','24/11/2026');await display('modal-time').fill('25:00');await page.locator('[data-confirm="create-appointment"]').click();assert.equal(writes.length,0);
  await display('modal-time').fill('15:45');await display('modal-time').dispatchEvent('change');await shot('desktop-form');await page.locator('[data-confirm="create-appointment"]').click();await page.locator('.modal').waitFor({state:'detached'});assert.equal(writes[0].date,'2026-11-24');assert.equal(writes[0].time,'15:45');

  await go('/admin/appointments');await display('appointment-date').waitFor();await fillDate('appointment-date','24/11/2026');await page.waitForURL(url=>url.hash.includes('date=2026-11-24'));await display('appointment-date').waitFor();assert.equal(await display('appointment-date').inputValue(),'24/11/2026');
  await page.locator('.toolbar .vn-date-trigger').click();await calendar().getByRole('button',{name:'Xóa ngày',exact:true}).click();assert.equal(await page.locator('#appointment-date').inputValue(),'');

  await page.locator('[data-action="admin-edit-appointment"][data-code="TEST-1"]').click();await display('modal-edit-date').waitFor();
  assert.equal(await display('modal-edit-date').inputValue(),'24/11/2026');assert.equal(await display('modal-edit-time').inputValue(),'15:45');
  await fillDate('modal-edit-date','');await page.locator('[data-confirm="edit-appointment:TEST-1"]').click();assert.equal(writes.length,1,'clearing a required edit date must not send an update');
  await fillDate('modal-edit-date','26/11/2026');await display('modal-edit-time').fill('17:15');await display('modal-edit-time').dispatchEvent('change');await shot('desktop-edit');await page.locator('[data-confirm="edit-appointment:TEST-1"]').click();await page.locator('.modal').waitFor({state:'detached'});
  assert.equal(writes[1].date,'2026-11-26');assert.equal(writes[1].time,'17:15');
  await page.locator('[data-action="admin-status"][data-code="TEST-1"]').click();await display('modal-appointment-date').waitFor();
  assert.equal(await display('modal-appointment-date').inputValue(),'26/11/2026');await display('modal-appointment-date').press('ArrowDown');await page.keyboard.press('Escape');
  await page.locator('.modal [data-action="close-modal"]').click();assert.equal(writes.length,2,'cancelling status/date editing never writes');

  await page.setViewportSize({width:390,height:844});await go('/admin/appointments/new');await display('date').waitFor();await page.locator('[name="customer"]').fill('Khách mobile');await page.locator('[name="phone"]').fill('0901234567');
  await fillDate('date','25/11/2026');await display('time').fill('16:00');await display('time').dispatchEvent('change');await display('date').press('ArrowDown');assert.equal(await calendar().evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight+1;}),true);await shot('mobile-calendar');
  await calendar().getByRole('spinbutton',{name:'Năm'}).fill('2028');await calendar().getByRole('spinbutton',{name:'Năm'}).dispatchEvent('change');await calendar().getByRole('combobox',{name:'Tháng'}).selectOption('1');await calendar().getByRole('button',{name:'29 tháng 2 năm 2028',exact:true}).click();assert.equal(await display('date').inputValue(),'29/02/2028');
  await page.locator('[name="date"]').evaluate(el=>{el.min='2026-11-03';el.max='2026-11-10';});await fillDate('date','05/11/2026');await display('date').press('ArrowDown');assert.equal(await calendar().getByRole('button',{name:'2 tháng 11 năm 2026',exact:true}).isDisabled(),true);assert.equal(await calendar().getByRole('button',{name:'11 tháng 11 năm 2026',exact:true}).isDisabled(),true);await calendar().getByRole('button',{name:'Hôm nay',exact:true}).click();assert.equal(await display('date').inputValue(),'03/11/2026');
  await page.locator('[name="date"]').evaluate(el=>{el.min='';el.max='';});await fillDate('date','25/11/2026');await page.locator('[data-ma-form="new-appointment"] [type="submit"]').click();await page.waitForURL(url=>url.hash.includes('/admin/appointments/TEST-3'));assert.equal(writes[2].date,'2026-11-25');assert.equal(writes[2].time,'16:00');
  await go('/admin/appointments/TEST-3/edit');await display('date').waitFor();assert.equal(await display('date').inputValue(),'25/11/2026');assert.equal(await display('time').inputValue(),'16:00');
  await fillDate('date','27/11/2026');await display('time').fill('18:00');await display('time').dispatchEvent('change');await page.locator('[data-ma-form="edit-appointment"] [type="submit"]').click();await page.waitForURL(url=>url.hash==='#/admin/appointments/TEST-3');assert.equal(writes[3].date,'2026-11-27');assert.equal(writes[3].time,'18:00');
  await go('/admin/appointments/TEST-3/reschedule');await display('date').waitFor();await fillDate('date','31/04/2027');await display('time').fill('14:30');await display('time').dispatchEvent('change');await page.locator('[data-ma-form="reschedule"] [type="submit"]').click();assert.equal(writes.length,4,'invalid reschedule dates must not be submitted');
  await fillDate('date','28/11/2026');await shot('mobile-reschedule');await page.locator('[data-ma-form="reschedule"] [type="submit"]').click();await page.waitForURL(url=>url.hash==='#/admin/appointments/TEST-3');assert.equal(writes[4].date,'2026-11-28');assert.equal(writes[4].time,'14:30');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert.deepEqual(errors,[]);
  console.log('PASS Vietnam date picker: en-US browser and Los Angeles timezone show dd/mm/yyyy; Vietnam today; Monday-first Vietnamese calendar; keyboard/cancel; invalid/required date/time blocked; leap-day/month/year and min/max; correct ISO/24h payloads for desktop create/edit/filter and mobile create/edit/reschedule; no overflow. Fixture writes only.');
}catch(error){await shot('failure');console.error(errors);throw error;}
finally{await browser.close();}
