import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

const base=process.env.TEST_BASE_URL || 'http://localhost:5173';
const vectorLive = process.argv.includes('--vector-live');
const renderer = vectorLive ? 'maplibregl-map' : 'leaflet-container';
const output = vectorLive ? 'outputs/vector-booking-goals' : 'outputs/booking-goals';
const browser=await chromium.launch({channel:'msedge',headless:true});
await mkdir(output,{recursive:true});
const gps={lat:21.1,lon:105.5,accuracy:12,mode:'gps'};
const timestamp=Date.now();
const future=new Date(timestamp+2*86400000).toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'});
const service={id:'party',name:'Trang điểm dự tiệc',description:'Dịch vụ kiểm thử',price:650000,duration:90,enabled:true,sortOrder:1};
const snapshot={services:[service],appointments:[],customers:[],scheduleSlots:[],bookingDetails:{},notifications:[],requests:[],brand:{name:'HOÀN',phone:'',email:''},settings:{deposit:200000,travelFee:50000,bookingWindow:60,scheduleOpen:true},finance:{entries:[],summaries:[],totals:{}}};
const writes=[],errors=[];
const consoleErrors=[];
const mapResizeDiagnostics=[];
let page,tileRequests=0;
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference',permissions:['clipboard-read','clipboard-write']});
if (!vectorLive) await context.addInitScript(() => { window.maplibregl = { supported: () => false }; });
await context.addInitScript(({gps,timestamp,future})=>{
  localStorage.setItem('hoanAnalyticsConsent','no');
  if(!sessionStorage.getItem('booking-goals-seeded')) {
    localStorage.removeItem('hoanAdminToken');
    localStorage.removeItem('hoanLastBookingCode');
    localStorage.setItem('hoanMakeupDraft',JSON.stringify({booking:{serviceId:'party',date:future,time:'10:00',locationType:'client',city:'',ward:'',address:'',travelFee:50000}}));
    sessionStorage.setItem('booking-goals-seeded','1');
  }
  window.__testGpsCalls=0;
  Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(success){window.__testGpsCalls++;queueMicrotask(()=>success({coords:{latitude:gps.lat,longitude:gps.lon,accuracy:gps.accuracy},timestamp}));},watchPosition(){throw new Error('A precise fixture should not need a watch.');},clearWatch(){}}});
},{gps,timestamp,future});

await context.route('**/*',route=>{
  const url=route.request().url();
  if(!url.startsWith('https://')) return route.fallback();
  // Live mode sends only the fixed fixture viewport to the free map provider.
  if(vectorLive && new URL(url).hostname === 'tiles.openfreemap.org') return route.fallback();
  if(url.startsWith('https://tile.openstreetmap.org/')) { tileRequests++;return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#f1f1e9"/><path d="M0 80H256M90 0V256" stroke="#d0d4c8" stroke-width="5"/></svg>'}); }
  // No fixture coordinates or customer data leave the local test server.
  return route.abort();
});
await context.route('**/api/data*',route=>{
  const request=route.request();
  if(request.method()==='GET') {
    const url=new URL(request.url());
    if(url.searchParams.has('code')) {
      const appointment=snapshot.appointments.find(item=>item.code===url.searchParams.get('code')&&item.phone===url.searchParams.get('phone'));
      return appointment ? route.fulfill({json:{appointment,bookingDetails:snapshot.bookingDetails[appointment.code]||{},paymentInstructions:{bankName:'MB',bankAccount:'0000000000',bankOwner:'TEST FIXTURE'},paymentHistory:[]}}) : route.fulfill({status:404,json:{error:'Không tìm thấy lịch kiểm thử.'}});
    }
    if(request.headers().authorization==='Bearer booking-goals-test-token')return route.fulfill({json:snapshot});
    const {services,appointments,scheduleSlots,brand,settings}=snapshot;
    return route.fulfill({json:{services,appointments:appointments.map(({code,date,time,serviceId,status})=>({code,date,time,serviceId,status})),scheduleSlots,brand,settings}});
  }
  const payload=request.postDataJSON();
  if(payload.action==='reverseGeocode')return route.fulfill({json:{address:'12 Đường kiểm thử',addressDistance:2,city:'Thành phố Hà Nội',ward:'Phường Tùng Thiện',countryCode:'vn'}});
  writes.push(payload);
  if(payload.action==='createAppointment') {
    const appointment={code:'TEST-BOOKING-GOALS',customer:payload.customer,phone:payload.phone,email:payload.email,serviceId:payload.serviceId,date:payload.date,time:payload.time,address:payload.address,ward:payload.ward,district:'',style:payload.style,note:payload.note,total:700000,deposit:0,paymentStatus:'unverified',status:'pending',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    snapshot.appointments=[appointment];
    snapshot.customers=[{id:1,name:appointment.customer,phone:appointment.phone,email:appointment.email||'',visits:1,spent:0,note:''}];
    snapshot.bookingDetails[appointment.code]={city:payload.city,locationNote:payload.locationNote,locationCoordinates:payload.locationCoordinates,locationDeviceCoordinates:payload.locationDeviceCoordinates,locationCapturedAt:payload.locationCapturedAt,locationConfirmedAt:payload.locationConfirmedAt,depositRequired:200000,travelFee:50000};
    return route.fulfill({status:201,json:{appointment}});
  }
  return route.fulfill({status:400,json:{error:'Unexpected write blocked by booking goal test: '+payload.action}});
});
await context.route('**/api/site-content*',route=>route.fulfill({json:{pages:{},drafts:{}}}));
await context.route('**/api/cms-resources*',route=>route.fulfill({json:{shared:{value:{albums:[],testimonials:[]},revision:''},media:{value:[],revision:''},templates:{value:[],revision:''}}}));

async function mapGeometry(page,label) {
  return page.evaluate(({label,vectorLive})=>{
    const host=document.querySelector('.booking-location [data-location-map-canvas]');
    const rect=node=>{const value=node.getBoundingClientRect();return Object.fromEntries(['left','top','right','bottom','width','height'].map(key=>[key,value[key]]));};
    const style=node=>{const value=getComputedStyle(node);return {position:value.position,overflow:value.overflow,display:value.display,visibility:value.visibility};};
    const selectors=vectorLive ? ['.maplibregl-ctrl-group','.maplibregl-ctrl-attrib','.maplibregl-ctrl-scale'] : ['.leaflet-control-zoom','.leaflet-control-attribution','.leaflet-control-scale'];
    const bounds=rect(host);
    return {label,viewport:{width:innerWidth,height:innerHeight},host:{...bounds,clientWidth:host.clientWidth,clientHeight:host.clientHeight,...style(host)},canvas:vectorLive?rect(host.querySelector('.maplibregl-canvas')):null,controls:selectors.map(selector=>{
      const node=host.querySelector(selector);
      if(!node)return {selector,missing:true};
      const box=rect(node),clippingAncestors=[];
      for(let ancestor=node.parentElement;ancestor&&ancestor!==host;ancestor=ancestor.parentElement) {
        const ancestorStyle=getComputedStyle(ancestor);
        if(/hidden|clip|scroll|auto/.test(ancestorStyle.overflowX+' '+ancestorStyle.overflowY))clippingAncestors.push({className:ancestor.className,rect:rect(ancestor),...style(ancestor)});
      }
      return {selector,...box,...style(node),clippingAncestors,insideHost:box.width>0&&box.height>0&&box.left>=bounds.left-1&&box.top>=bounds.top-1&&box.right<=bounds.right+1&&box.bottom<=bounds.bottom+1};
    })};
  },{label,vectorLive});
}

async function responsiveMapReady(page) {
  try {
    if(vectorLive) await page.waitForFunction(()=>{
      const host=document.querySelector('.booking-location [data-location-map-canvas]');
      const canvas=host?.querySelector('.maplibregl-canvas'),box=canvas?.getBoundingClientRect();
      return box&&Math.abs(box.width-host.clientWidth)<=1&&Math.abs(box.height-host.clientHeight)<=1;
    });
    // ResizeObserver schedules the map resize on the next animation frame.
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const geometry=await mapGeometry(page,'mobile-after-resize');mapResizeDiagnostics.push(geometry);
    for(const control of geometry.controls) {
      assert.equal(control.missing,undefined,control.selector+' exists after the retained map resizes');
      assert.equal(control.insideHost,true,control.selector+' remains inside the map clipping rectangle after resize');
      assert.notEqual(control.display,'none');assert.notEqual(control.visibility,'hidden');
      for(const ancestor of control.clippingAncestors)assert.ok(control.left>=ancestor.rect.left-1&&control.top>=ancestor.rect.top-1&&control.right<=ancestor.rect.right+1&&control.bottom<=ancestor.rect.bottom+1,control.selector+' remains inside its clipping ancestor');
    }
    console.log('Retained map responsive geometry:',JSON.stringify(geometry));
  } catch(error) {
    console.error('Map resize diagnostic:',JSON.stringify([...mapResizeDiagnostics,await mapGeometry(page,'resize-check-failure')]));throw error;
  }
}

try {
  page=await context.newPage();page.setDefaultTimeout(25000);page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error'&&!message.text().includes('ERR_FAILED'))consoleErrors.push(message.text());});
  await page.goto(base+'/?booking-goals=1#/booking/location');
  await page.locator('#booking-city:not([disabled])').waitFor();
  await page.locator(`[data-location-map-canvas].${renderer}`).waitFor();
  assert.equal(await page.locator('[data-location-use-pin]').isDisabled(),true,'No invented customer pin before GPS/selection');
  await page.locator('[data-location-detect]').click();
  await page.waitForFunction(()=>Boolean(window.state?.booking.locationRegion)&&!window.state.booking.isDetectingLocation);
  const original=await page.evaluate(()=>structuredClone(window.state.booking));
  assert.deepEqual(original.locationCoordinates,gps);
  assert.deepEqual(original.locationDeviceCoordinates,gps);
  assert.equal(original.locationCapturedAt,new Date(timestamp).toISOString());
  assert.equal(original.city,'Thành phố Hà Nội');
  assert.equal(original.ward,'Phường Tùng Thiện');

  await page.locator('[data-location-use-pin]:not([disabled])').waitFor();
  assert.equal(await page.locator('.booking-location .location-map-marker').count(),0,'GPS is a blue device point until the customer selects a service pin');
  const canvas=page.locator('[data-location-map-canvas]');
  await canvas.focus();await canvas.press('Enter');
  await page.waitForFunction(()=>window.state?.booking.locationCoordinates?.mode==='pin');
  const marker=page.locator('.booking-location .location-map-marker');
  await marker.focus();await marker.press('ArrowRight');await marker.press('ArrowDown');
  const pending=await page.evaluate(()=>structuredClone(window.state.booking));
  assert.equal(pending.locationConfirmedAt,'','Moving the service pin requires a fresh confirmation');
  assert.equal(pending.locationRegion,null);
  assert.deepEqual(pending.locationDeviceCoordinates,gps,'An unconfirmed service move preserves original GPS metadata');
  assert.equal(pending.locationCapturedAt,original.locationCapturedAt);
  await page.locator('[data-action="ct-next"]').click();
  assert.match(page.url(),/#\/booking\/location$/,'Next is blocked until the moved service point is confirmed');
  assert.equal(writes.length,0);
  await page.locator('[data-location-use-pin]').click();
  await page.waitForFunction(()=>window.state?.booking.locationCoordinates?.mode==='pin'&&Boolean(window.state.booking.locationConfirmedAt)&&!window.state.booking.isDetectingLocation);
  const adjusted=await page.evaluate(()=>structuredClone(window.state.booking));
  assert.notEqual(adjusted.locationCoordinates.lon,gps.lon,'The service point follows the chosen map point');
  assert.notEqual(adjusted.locationCoordinates.lat,gps.lat);
  assert.equal(adjusted.locationCoordinates.accuracy,null,'A selected pin must not claim GPS accuracy');
  assert.deepEqual(adjusted.locationDeviceCoordinates,gps,'Moving service pin must preserve original device GPS');
  assert.equal(adjusted.locationCapturedAt,original.locationCapturedAt);
  assert.equal(await page.evaluate(()=>window.__testGpsCalls),1);
  await page.locator('#booking-address').fill('14 Đường kiểm thử');
  await page.locator('#booking-location-note').fill('Cổng bên phải, tầng 2');
  assert.deepEqual(await page.evaluate(()=>window.state.booking.locationCoordinates),adjusted.locationCoordinates,'House details preserve confirmed map point');
  mapResizeDiagnostics.push(await mapGeometry(page,'desktop-before-resize'));
  await page.screenshot({path:`${output}/location-desktop.png`,fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await responsiveMapReady(page);
  await page.screenshot({path:`${output}/location-mobile.png`,fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('[data-action="ct-next"]').click();await page.waitForURL(/#\/booking\/info$/);
  await page.locator('form[data-form="info"] [name="name"]').fill('Khách kiểm thử tọa độ');
  await page.locator('form[data-form="info"] [name="phone"]').fill('0900000000');
  await page.locator('form[data-form="info"] [name="style"]').selectOption({label:'Tự nhiên · Trong trẻo'});
  await page.locator('form[data-form="info"] [name="consent"]').check();
  await page.locator('[data-action="ct-next"]').click();await page.waitForURL(/#\/booking\/deposit$/);
  assert.equal(writes.length,1,'The customer location is saved before payment instructions are shown');
  assert.equal(writes[0].action,'createAppointment');
  await page.locator('[data-action="go-step"][data-target="/booking/confirm"]').click();
  await page.waitForURL(/#\/booking\/confirm$/);
  await page.locator('[data-action="complete-booking"]').click();
  await page.waitForURL(/#\/booking\/success$/);
  assert.equal(writes.length,1,'One mocked create, no real writes or payment confirmation');
  const payload=writes[0];
  assert.equal(payload.action,'createAppointment');
  assert.deepEqual(payload.locationCoordinates,adjusted.locationCoordinates);
  assert.deepEqual(payload.locationDeviceCoordinates,gps);
  assert.equal(payload.locationCapturedAt,original.locationCapturedAt);
  assert.ok(payload.locationConfirmedAt);
  assert.equal(payload.address,'14 Đường kiểm thử');
  assert.equal(payload.locationNote,'Cổng bên phải, tầng 2');

  // A second browser page models the admin reading the private saved snapshot.
  await page.evaluate(()=>localStorage.setItem('hoanAdminToken','booking-goals-test-token'));
  await page.goto(base+'/?booking-goals=admin-appointments#/admin/appointments');
  await page.waitForFunction(()=>Boolean(window.HoanAdminLocations)&&window.state?.appointments[0]?.customer==='Khách kiểm thử tọa độ');
  const shortcut=page.locator('[data-admin-open-location="TEST-BOOKING-GOALS"]');
  await shortcut.click();
  await page.locator(`.modal [data-admin-location-panel="TEST-BOOKING-GOALS"] .${renderer}`).waitFor();
  assert.match(await page.locator('.modal .admin-location-facts').innerText(),/GPS thiết bị ban đầu/);
  const directions=new URL(await page.locator('.modal .admin-location-actions a').first().getAttribute('href'));
  assert.equal(directions.searchParams.get('destination'),payload.locationCoordinates.lat+','+payload.locationCoordinates.lon);
  await page.screenshot({path:`${output}/admin-location.png`});
  await page.locator('.modal [data-action="close-modal"]').click();
  await page.locator('.modal').waitFor({state:'detached'});
  await page.locator('[data-action="admin-view-appointment"][data-code="TEST-BOOKING-GOALS"] button[data-action="admin-view-appointment"],button[data-action="admin-view-appointment"][data-code="TEST-BOOKING-GOALS"]').first().click();
  await page.locator(`.modal .admin-location-canvas.${renderer}`).waitFor();
  await page.locator('.modal [data-action="close-modal"]').click();
  await page.goto(base+'/?booking-goals=admin-customers#/admin/customers');
  await page.locator('[data-admin-customer-locations="0900000000"]').click();
  await page.locator('.modal .admin-customer-locations').waitFor();
  assert.match(await page.locator('.modal .admin-customer-locations').innerText(),/TEST-BOOKING-GOALS/);
  await page.locator('.modal [data-action="close-modal"]').click();

  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'/?booking-goals=admin-mobile#/admin/appointments/TEST-BOOKING-GOALS');
  await page.locator(`.admin-location-canvas.${renderer}`).waitFor();
  assert.match(await page.locator('.admin-location-facts').innerText(),/GPS thiết bị ban đầu/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'Mobile private location has no horizontal overflow');
  assert.deepEqual(errors,[]);
  console.log(`PASS ${vectorLive ? 'live OpenFreeMap' : 'raster fallback'}: GPS to service pin to booking payload, original GPS and timestamps preserved, private desktop appointment/customer locations and mobile details, exact directions, no actual customer writes or external geocoding requests.`);
} catch(error) {
  console.error('Browser errors:',errors);
  if(page) console.error('Current UI:',await page.evaluate(()=>({url:location.href,status:document.querySelector('[data-location-status]')?.textContent,mapStatus:document.querySelector('[data-location-pin-status]')?.textContent,tiles:[...document.querySelectorAll('.leaflet-tile')].map(tile=>({src:tile.src,complete:tile.complete,width:tile.naturalWidth})),booking:window.state?.booking,adminLocations:Boolean(window.HoanAdminLocations),appointments:window.state?.appointments,backendError:window.state?.backendError})).catch(()=>({})),{tileRequests,consoleErrors});
  throw error;
} finally {await context.close();await browser.close();}
