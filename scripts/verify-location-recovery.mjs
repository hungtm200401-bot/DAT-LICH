import assert from 'node:assert/strict';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';
import { createServer } from 'node:http';
const base = 'http://localhost:5173';
let legacyWorker = '', serveLegacy = true;
const proxy = createServer(async (request, response) => {
  try {
    if (request.url === '/__old_fixture_setup') { response.writeHead(200,{'Content-Type':'text/html'}); response.end('<!doctype html><title>Legacy cache fixture</title>'); return; }
    if (request.url.split('?')[0] === '/sw.js' && serveLegacy) { response.writeHead(200,{'Content-Type':'application/javascript','Cache-Control':'no-store','Service-Worker-Allowed':'/'}); response.end(legacyWorker); return; }
    const chunks=[]; for await(const chunk of request) chunks.push(chunk);
    const upstream=await fetch(base+request.url,{method:request.method,body:['GET','HEAD'].includes(request.method)?undefined:Buffer.concat(chunks),headers:{'Content-Type':request.headers['content-type']||'text/plain'}});
    const headers=Object.fromEntries(upstream.headers); delete headers['content-encoding']; delete headers['content-length']; delete headers['transfer-encoding'];
    response.writeHead(upstream.status,headers);response.end(Buffer.from(await upstream.arrayBuffer()));
  } catch(error) {response.writeHead(502);response.end(String(error));}
});
await new Promise(resolve=>proxy.listen(0,'127.0.0.1',resolve));
const recoveryBase='http://127.0.0.1:'+proxy.address().port;
const browser = await chromium.launch({channel:'msedge',headless:true});
const snapshot={services:[{id:'party',name:'Dịch vụ kiểm thử',price:650000,duration:90,enabled:true}],appointments:[],customers:[],scheduleSlots:[],bookingDetails:{},notifications:[],requests:[],brand:{},settings:{deposit:200000,travelFee:50000,bookingWindow:60,scheduleOpen:true}};
const writes=[];
async function offlineFixtures(context,onReverse=()=>{}) {
  await context.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='tile.openstreetmap.org')return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#f0f0ed"/><path d="M0 128H256M128 0V256" stroke="#ddd"/></svg>'});
    if(url.hostname==='localhost'||url.hostname==='127.0.0.1')return route.fallback();
    return route.abort();
  });
  await context.route('**/api/**',route=>{
    const request=route.request(),path=new URL(request.url()).pathname;
    if(path==='/api/data') {
      if(request.method()==='GET')return route.fulfill({json:snapshot});
      const payload=request.postDataJSON();
      if(payload.action==='reverseGeocode') {onReverse(payload);return route.fulfill({status:503,json:{error:'No street details'}});}
      writes.push(payload);return route.fulfill({status:400,json:{error:'No writes in location recovery fixtures.'}});
    }
    if(path==='/api/site-content')return route.fulfill({json:{pages:{},drafts:{}}});
    if(path==='/api/cms-resources')return route.fulfill({json:{shared:{value:{albums:[],testimonials:[]},revision:''},media:{value:[],revision:''},templates:{value:[],revision:''}}});
    return route.fulfill({json:{}});
  });
}
try {
  const context = await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await offlineFixtures(context);
  await context.addInitScript(() => { window.maplibregl = { supported: () => false }; });
  const errors=[];
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(recoveryBase + '/__old_fixture_setup');
  await page.evaluate(async () => {
    localStorage.setItem('hoanAnalyticsConsent','no');
    localStorage.setItem('hoanMakeupDraft',JSON.stringify({booking:{city:'Thành phố Hà Nội',ward:'Phụng Thượng',address:'Thông tin khách đã nhập',locationNote:'Ghi chú còn giữ'}}));
  });
  legacyWorker = `
    self.addEventListener('install',event=>event.waitUntil((async()=>{
      const cache=await caches.open('hoan-makeup-old-fixture');
      await cache.put('/',new Response('<html><body><div class="mockup-location-count">34 mục</div><input name="district"><p>Biểu mẫu cũ</p></body></html>',{headers:{'Content-Type':'text/html'}}));
      await self.skipWaiting();
    })()));
    self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
    self.addEventListener('fetch',event=>{if(event.request.mode==='navigate')event.respondWith(caches.match('/'));});
  `;
  await page.evaluate(async () => {
    const registration=await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
  });
  const legacyNavigation = await page.goto(recoveryBase + '/#/booking/location');
  assert.equal(legacyNavigation.fromServiceWorker(),true);
  await page.locator('.mockup-location-count').waitFor();
  serveLegacy=false;
  await page.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration();await registration.update();}).catch(error=>{if(!String(error).includes('Execution context was destroyed'))throw error;});
  await page.locator('#booking-city:not([disabled])').waitFor({timeout:30000});
  assert.equal(await page.locator('.mockup-location-count,[name="district"]').count(),0);
  assert.equal(await page.locator('#booking-city').inputValue(),'Thành phố Hà Nội');
  assert.equal(await page.locator('#booking-ward').inputValue(),'Xã Phúc Thọ');
  assert.equal(await page.locator('#booking-address').inputValue(),'Thông tin khách đã nhập');
  assert.equal(await page.locator('#booking-location-note').inputValue(),'Ghi chú còn giữ');
  assert.deepEqual(await page.evaluate(()=>caches.keys()),[]);
  await context.close();

  const coarse=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  let requests=0,received;
  await offlineFixtures(coarse,payload=>{requests++;received=payload;});
  await coarse.addInitScript(() => { window.maplibregl = { supported: () => false }; });
  await coarse.addInitScript(()=>{
    try{localStorage.removeItem('hoanMakeupDraft');localStorage.setItem('hoanAnalyticsConsent','no');}catch{}
    Object.defineProperty(navigator,'geolocation',{value:{
      getCurrentPosition(success){success({coords:{latitude:21.1,longitude:105.5,accuracy:5000},timestamp:Date.now()});},
      watchPosition(_success,error){error({code:2});return 1;}, clearWatch(){}
    }});
  });
  const mobile=await coarse.newPage();mobile.on('pageerror',error=>errors.push(error.message));
  await mobile.clock.install({time:new Date()});
  await mobile.goto(base+'/?v=160#/booking/location');
  await mobile.locator('#booking-city:not([disabled])').waitFor();
  await mobile.locator('[data-location-detect]').click();
  await mobile.waitForFunction(()=>window.state?.booking.locationCoordinates?.accuracy===5000&&window.state.booking.isDetectingLocation);
  await mobile.clock.fastForward(18001);
  await mobile.waitForFunction(()=>!window.state.booking.isDetectingLocation);
  assert.equal(requests,0);
  assert.equal(await mobile.locator('#booking-city').inputValue(),'');
  assert.equal(await mobile.locator('#booking-ward').inputValue(),'');
  assert.equal(await mobile.locator('.location-map-marker').count(),0,'Coarse GPS does not invent a service pin');
  assert.equal(await mobile.locator('[data-location-use-pin]').isDisabled(),true);
  const canvas=mobile.locator('[data-location-map-canvas]');
  await canvas.focus();await canvas.press('Enter');
  await mobile.waitForFunction(()=>window.state.booking.locationCoordinates?.mode==='pin');
  const marker=mobile.locator('.location-map-marker');await marker.waitFor();
  await marker.focus();await mobile.keyboard.press('ArrowRight');
  await mobile.locator('[data-location-use-pin]:not([disabled])').click();
  await mobile.waitForFunction(()=>Boolean(window.state.booking.locationConfirmedAt)&&!window.state.booking.isDetectingLocation);
  assert.equal(requests,1);assert.notEqual(received.lon,105.5);
  assert.equal(await mobile.locator('#booking-city').inputValue(),'Thành phố Hà Nội');
  assert.ok((await mobile.locator('#booking-ward').inputValue()).length>0);
  assert.equal(await mobile.evaluate(()=>window.state.booking.locationCoordinates.mode),'pin');
  const confirmed = await mobile.evaluate(()=>({...window.state.booking.locationCoordinates}));
  await mobile.locator('#booking-address').fill('Số nhà được bổ sung sau khi chọn điểm');
  assert.deepEqual(await mobile.evaluate(()=>window.state.booking.locationCoordinates),confirmed);
  assert.equal(await mobile.locator('[data-location-map-panel]').isVisible(),true);
  await mobile.locator('[data-action="ct-next"]').click();await mobile.waitForURL(/#\/booking\/info$/);
  assert.deepEqual(await mobile.evaluate(()=>window.state.booking.locationCoordinates),confirmed);
  assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  assert.deepEqual(writes,[]);
  assert.deepEqual(errors,[]);
  await coarse.close();
  console.log('PASS migration from a real legacy cache-first worker, automatic page recovery, legacy-address conversion, draft preservation, no item counts, coarse GPS refusal, map adjustment, confirmed point lookup, mobile layout, and no browser errors.');
} finally {await browser.close();await new Promise(resolve=>proxy.close(resolve));}
