import assert from 'node:assert/strict';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

const base=process.env.TEST_BASE_URL || 'http://localhost:5173';
const browser=await chromium.launch({channel:'msedge',headless:true});
const errors=[],writes=[];
const service={id:'party',name:'Dịch vụ kiểm thử',price:650000,duration:90,enabled:true};
const tile='<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#eeeee8"/></svg>';

async function createContext(point,booking={}) {
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
  await context.addInitScript(() => { window.maplibregl = { supported: () => false }; });
  await context.addInitScript(({point,booking})=>{
    localStorage.setItem('hoanAnalyticsConsent','no');
    localStorage.setItem('hoanMakeupDraft',JSON.stringify({booking:{serviceId:'party',city:'Thành phố Hà Nội',provinceCode:1,ward:'Phường Tùng Thiện',wardCode:9604,address:'14 Đường kiểm thử',locationType:'client',...booking}}));
    Object.defineProperty(navigator,'geolocation',{value:{
      getCurrentPosition(success){queueMicrotask(()=>success({coords:{latitude:point.lat,longitude:point.lon,accuracy:point.accuracy},timestamp:Date.now()}));},
      watchPosition(_success,error){queueMicrotask(()=>error({code:2}));return 1;},clearWatch(){}
    }});
  },{point,booking});
  await context.route('**/*',route=>{
    const url=route.request().url();
    if(url.startsWith('https://tile.openstreetmap.org/')) return route.fulfill({contentType:'image/svg+xml',body:tile});
    if(url.startsWith('https://')) return route.abort();
    return route.fallback();
  });
  await context.route('**/api/**',route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.pathname==='/api/data') {
      if(request.method()==='GET')return route.fulfill({json:{services:[service],appointments:[],scheduleSlots:[],brand:{},settings:{deposit:200000,travelFee:50000,scheduleOpen:true}}});
      const payload=request.postDataJSON();
      if(payload.action==='reverseGeocode')return route.fulfill({json:{countryCode:point.lon<0?'us':'vn',address:'',city:point.lon<0?'New York':'Hà Nội',addressDistance:1}});
      writes.push(payload);return route.fulfill({status:400,json:{error:'No writes are allowed in the location validation test.'}});
    }
    if(url.pathname==='/api/site-content') return route.fulfill({json:{pages:{},drafts:{}}});
    if(url.pathname==='/api/cms-resources')return route.fulfill({json:{shared:{value:{albums:[],testimonials:[]},revision:''},media:{value:[],revision:''},templates:{value:[],revision:''}}});
    return route.fulfill({json:{}});
  });
  const page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/?location-validation=1#/booking/location');
  await page.locator('#booking-city:not([disabled])').waitFor();
  await page.locator('[data-location-map-canvas].leaflet-container').waitFor();
  assert.equal(await page.locator('#booking-city').inputValue(),'Thành phố Hà Nội');
  assert.equal(await page.locator('#booking-ward').inputValue(),'Phường Tùng Thiện');
  return {context,page};
}

async function blocked(page) {
  await page.locator('[data-action="ct-next"]').click();
  assert.match(page.url(),/#\/booking\/location$/);
  assert.equal(await page.locator('[data-location-form-error]').isVisible(),true);
  assert.match(await page.locator('[data-location-form-error]').innerText(),/chưa được xác nhận/);
  assert.equal(await page.locator('[data-location-manual]').isVisible(),true);
  await page.locator('[data-action="go-step"][data-target="/booking/info"]').click();
  assert.match(page.url(),/#\/booking\/location$/,'Forward progress navigation must enforce the same location guard');
}

async function manual(page,point) {
  await page.locator('[data-location-manual]').click();
  const state=await page.evaluate(()=>structuredClone(window.state.booking));
  assert.equal(state.locationCoordinates,null);
  assert.equal(state.locationRegion,null);
  assert.equal(state.locationConfirmedAt,'');
  assert.deepEqual(state.locationDeviceCoordinates,point);
  assert.equal(state.address,'14 Đường kiểm thử');
  const adminHtml=await page.evaluate(async()=>{
    const {adminLocationHtml}=await import('/admin-location.js?v=1.0');
    const booking=window.state.booking;
    return adminLocationHtml({code:'TEST-MANUAL',address:booking.address,ward:booking.ward},booking);
  });
  assert.match(adminHtml,/GPS thiết bị ban đầu/);
  assert.match(adminHtml,/Chưa được dùng làm điểm đến/);
  assert.doesNotMatch(adminHtml,/google.com\/maps/,'Unconfirmed GPS is never used as service directions');
  await page.locator('[data-action="ct-next"]').click();await page.waitForURL(/#\/booking\/info$/);
}

try {
  const coarsePoint={lat:21.1,lon:105.5,accuracy:5000,mode:'gps'};
  const coarse=await createContext(coarsePoint);
  try {
    const {page}=coarse;
    await page.locator('[data-location-detect]').click();
    await page.waitForFunction(()=>window.state?.booking.locationCoordinates&&!window.state.booking.isDetectingLocation);
    assert.equal(await page.evaluate(()=>window.state.booking.locationRegion),null);
    await blocked(page);
    assert.equal(await page.locator('[data-location-use-pin]').isDisabled(),true,'Coarse GPS needs an explicit map selection');
    await page.locator('[data-location-map-canvas]').focus();await page.keyboard.press('Enter');
    await page.locator('[data-location-use-pin]:not([disabled])').waitFor();
    const oldOverflow=await page.evaluate(()=>document.body.style.overflow);
    await page.locator('[data-map-expand]').click();
    assert.equal(await page.locator('[data-location-map-panel]').getAttribute('role'),'dialog');
    assert.equal(await page.locator('[data-location-map-panel]').getAttribute('aria-modal'),'true');
    assert.equal(await page.evaluate(()=>document.body.style.overflow),'hidden');
    await page.evaluate(()=>document.querySelector('[data-map-expand]').focus());
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(()=>{
      const panel=document.querySelector('[data-location-map-panel]');
      const controls=[...panel.querySelectorAll('a[href],button:not(:disabled),[tabindex="0"]')].filter(node=>node.getClientRects().length);
      return document.activeElement===controls.at(-1);
    }),true,'Fullscreen Shift+Tab wraps within map');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('[data-map-expand]').evaluate(node=>document.activeElement===node),true,'Fullscreen Tab wraps to first control');
    const marker=page.locator('.booking-location .location-map-marker');
    await marker.focus();await marker.press('ArrowRight');
    assert.match(await page.locator('[data-location-pin-status]').textContent(),/Điểm đã chọn/);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-location-map-panel]').getAttribute('role'),null);
    assert.equal(await page.locator('[data-location-map-panel]').getAttribute('aria-modal'),null);
    assert.equal(await page.locator('[data-map-expand]').evaluate(node=>document.activeElement===node),true);
    assert.equal(await page.evaluate(()=>document.body.style.overflow),oldOverflow);
    await page.locator('[data-map-expand]').click();
    await page.locator('.leaflet-control-zoom-in').click();
    await page.evaluate(()=>{location.hash='#/booking/info';});
    await page.waitForURL(/#\/booking\/info$/);await page.waitForTimeout(350);
    assert.equal(await page.locator('.leaflet-container,.is-expanded').count(),0);
    assert.equal(await page.evaluate(()=>document.body.style.overflow),oldOverflow,'Removing fullscreen map restores page scroll');
    await page.evaluate(()=>{location.hash='#/booking/location';});
    await page.locator('[data-location-manual]').waitFor();
    await manual(page,coarsePoint);
  } finally {await coarse.context.close();}

  const outsidePoint={lat:40.7,lon:-74,accuracy:10,mode:'gps'};
  const outside=await createContext(outsidePoint);
  try {
    await outside.page.locator('[data-location-detect]').click();
    await outside.page.waitForFunction(()=>window.state?.booking.locationCoordinates&&!window.state.booking.isDetectingLocation);
    assert.match(await outside.page.locator('[data-location-status]').textContent(),/ngoài Việt Nam/);
    await blocked(outside.page);await manual(outside.page,outsidePoint);
  } finally {await outside.context.close();}

  const stalePoint={lat:21.1,lon:105.5,accuracy:null,mode:'pin'};
  const originalGps={lat:21.1,lon:105.5,accuracy:12,mode:'gps'};
  const stale=await createContext(originalGps,{locationCoordinates:stalePoint,locationDeviceCoordinates:originalGps,locationRegion:{provinceCode:1,wardCode:999999},locationConfirmedAt:'2026-10-31T10:00:00.000Z'});
  try {
    assert.equal(await stale.page.evaluate(()=>window.state.booking.locationCoordinates),null,'Reload discards a saved pin with a mismatched region');
    assert.equal(await stale.page.evaluate(()=>window.state.booking.locationDeviceCoordinates),null,'Reload also discards the original device fix');
    // A region mismatch introduced in the current document must still block progress.
    await stale.page.evaluate(({stalePoint,originalGps})=>{
      Object.assign(window.state.booking,{locationCoordinates:stalePoint,locationDeviceCoordinates:originalGps,locationRegion:{provinceCode:1,wardCode:999999},locationConfirmedAt:new Date().toISOString()});
      dispatchEvent(new HashChangeEvent('hashchange'));
    },{stalePoint,originalGps});
    await blocked(stale.page);await manual(stale.page,originalGps);
  }
  finally {await stale.context.close();}

  const direct=await createContext(coarsePoint,{locationCoordinates:coarsePoint,locationDeviceCoordinates:coarsePoint,locationRegion:null,locationConfirmedAt:'',name:'Khách kiểm thử',phone:'0900000000',consent:true,style:'Tự nhiên · Trong trẻo'});
  try {
    const {page}=direct;
    await page.locator('[data-location-detect]').click();
    await page.waitForFunction(()=>window.state?.booking.locationCoordinates&&!window.state.booking.isDetectingLocation);
    await page.evaluate(()=>{location.hash='#/booking/deposit';});
    await page.locator('[data-action="ct-prepare-deposit"]').click();
    await page.waitForURL(/#\/booking\/location$/);
    assert.equal(writes.length,0,'Opening deposit directly cannot POST an unconfirmed point even with valid contact and consent');
    assert.deepEqual(await page.evaluate(()=>window.state.booking.locationDeviceCoordinates),coarsePoint);
    await page.evaluate(()=>{location.hash='#/booking/confirm';});
    await page.waitForURL(/#\/booking\/confirm$/);
    await page.getByText('Hoàn tất thông tin và lấy mã lịch trước khi xác nhận.').waitFor();
    assert.equal(await page.locator('[data-action="complete-booking"]').count(),0,'Direct confirmation has no completion action without a persisted booking');
    assert.equal(writes.length,0,'Opening final confirmation directly does not create a booking');
  } finally {await direct.context.close();}
  assert.deepEqual(writes,[]);
  assert.deepEqual(errors,[]);
  console.log('PASS coarse GPS, foreign location and mismatched restored region cannot proceed through Next, progress navigation or direct deposit/confirmation; manual fallback retains original GPS without directions; fullscreen keyboard focus/Escape/route cleanup; no writes or browser errors.');
} finally {await browser.close();}
