import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

const base=process.env.TEST_BASE_URL || 'http://localhost:5173';
const baseline=process.argv.includes('--baseline');
const skipAdmin=process.argv.includes('--map-only');
const sourceSnapshot=baseline?Object.fromEntries(await Promise.all(['app.js','booking-location.js','location-map.js','location-boundaries.js','device-location.js'].map(async file=>[file,await readFile('public/'+file,'utf8')]))):{};
const browser=await chromium.launch({channel:'msedge',headless:true});
const errors=[],writes=[];
let tiles=0;
const point={lat:21.1,lon:105.5,accuracy:null,mode:'pin'};
const devicePoint={lat:21.1,lon:105.5,accuracy:12,mode:'gps'};
const timestamp=new Date().toISOString();
const service={id:'party',name:'Dịch vụ kiểm thử',price:650000,duration:90,enabled:true};
const appointments=Array.from({length:12},(_,index)=>({code:'MAP-PERF-'+index,customer:'Khách kiểm thử bản đồ',phone:'0900000000',date:'2026-11-'+String(index+1).padStart(2,'0'),time:'10:00',serviceId:'party',address:'Địa chỉ kiểm thử '+index,ward:'Phường Tùng Thiện',total:700000,deposit:0,status:'pending',paymentStatus:'unverified'}));
const bookingDetails=Object.fromEntries(appointments.map((appointment,index)=>[appointment.code,{city:'Thành phố Hà Nội',locationCoordinates:{...point,lat:point.lat+index*.00001},locationDeviceCoordinates:devicePoint,locationCapturedAt:timestamp,locationConfirmedAt:timestamp}]));
const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference',permissions:['geolocation']});
// Keep the raster fallback performance regression; vector is measured separately.
await context.addInitScript(() => { window.maplibregl = { supported: () => false }; });
await context.addInitScript(({point,devicePoint,timestamp})=>{
  localStorage.setItem('hoanAnalyticsConsent','no');localStorage.setItem('hoanAdminToken','map-performance-fixture');
  localStorage.setItem('hoanMakeupDraft',JSON.stringify({booking:{city:'Thành phố Hà Nội',provinceCode:1,ward:'Phường Tùng Thiện',wardCode:9604,address:'Địa chỉ đang nhập',locationCoordinates:point,locationDeviceCoordinates:devicePoint,locationRegion:{provinceCode:1,wardCode:9604},locationCapturedAt:timestamp,locationConfirmedAt:timestamp}}));
  Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(success){queueMicrotask(()=>success({coords:{latitude:devicePoint.lat,longitude:devicePoint.lon,accuracy:devicePoint.accuracy},timestamp:Date.now()}));},clearWatch(){}}});
},{point,devicePoint,timestamp});
await context.route('**/*',async route=>{
  const url=route.request().url();
  const file=new URL(url).pathname.slice(1);
  if(sourceSnapshot[file]) return route.fulfill({contentType:'application/javascript',body:sourceSnapshot[file]});
  if(url.startsWith('https://tile.openstreetmap.org/')) {
    tiles++;
    return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#eeeee7"/><path d="M0 120H256M110 0V256" stroke="#d2d6ca" stroke-width="3"/></svg>'});
  }
  if(url.startsWith('https://'))return route.abort();
  return route.fallback();
});
await context.route('**/api/**',route=>{
  const request=route.request(),path=new URL(request.url()).pathname;
  if(path==='/api/data') {
    if(request.method()==='GET')return route.fulfill({json:{services:[service],appointments,bookingDetails,customers:[{name:'Khách kiểm thử bản đồ',phone:'0900000000',visits:12,spent:0,note:'',email:''}],scheduleSlots:[],settings:{deposit:200000,travelFee:50000,scheduleOpen:true},brand:{},requests:[],notifications:[],paymentTransactions:[]}});
    const payload=request.postDataJSON();
    if(payload.action==='reverseGeocode')return route.fulfill({json:{address:'12 Đường kiểm thử',addressDistance:1,city:'Thành phố Hà Nội',ward:'Phường Tùng Thiện',countryCode:'vn'}});
    writes.push(payload);return route.fulfill({status:400,json:{error:'No writes in map performance fixtures.'}});
  }
  if(path==='/api/site-content')return route.fulfill({json:{pages:{},drafts:{}}});
  if(path==='/api/cms-resources')return route.fulfill({json:{shared:{value:{albums:[],testimonials:[]},revision:''},media:{value:[],revision:''},templates:{value:[],revision:''}}});
  return route.fulfill({json:{}});
});
const page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',error=>errors.push(error.message));
const metrics={cpuThrottle:4,historyAppointments:appointments.length};
const brief=value=>Object.fromEntries(Object.entries(value).map(([key,item])=>[key,item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).filter(([name])=>name!=='longTasks')):item]));
const frame=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const snapshot=()=>page.evaluate(()=>{
  const all=window.__mapPerformance.maps,live=all.filter(map=>!window.__mapPerformance.removed.has(map));
  const map=live.at(-1),center=map?.getCenter();
  return {created:all.length,live:live.length,center:center?{lat:center.lat,lng:center.lng}:null,zoom:map?.getZoom(),longTasks:window.__mapPerformance.longTasks.filter(task=>task.startTime>=window.__mapPerformance.start)};
});

try {
  await page.goto(base+'/?map-performance=1#/support');await page.locator('.support-desk').waitFor();
  await page.waitForFunction(()=>Boolean(window.HoanAdminLocations));
  await page.addStyleTag({url:base+'/vendor/leaflet/leaflet.css'});await page.addScriptTag({url:base+'/vendor/leaflet/leaflet.js'});
  await page.evaluate(()=>{
    const state=window.__mapPerformance={maps:[],removed:new Set(),longTasks:[],start:performance.now()};
    const create=window.L.map;
    window.L.map=function(...args){const map=create(...args);state.maps.push(map);map.on('unload',()=>state.removed.add(map));return map;};
    if(PerformanceObserver.supportedEntryTypes.includes('longtask'))new PerformanceObserver(list=>state.longTasks.push(...list.getEntries().map(({startTime,duration})=>({startTime,duration})))).observe({type:'longtask',buffered:true});
  });
  const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.evaluate(()=>{location.hash='#/booking/location';});
  await page.locator('[data-location-map-canvas].leaflet-container').waitFor();
  await page.evaluate(point=>{const map=window.__mapPerformance.maps.at(-1);map.setView([point.lat,point.lon],18,{animate:false});map.fire('click',{latlng:window.L.latLng(point.lat,point.lon)});},point);
  await page.locator('[data-location-use-pin]:not([disabled])').click();
  await page.waitForFunction(()=>Boolean(window.state.booking.locationConfirmedAt)&&!window.state.booking.isDetectingLocation);
  await page.locator('[data-location-use-pin]').waitFor({state:'hidden'});await frame();
  metrics.initial={...await snapshot(),tiles};
  await page.evaluate(()=>{const map=window.__mapPerformance.maps.at(-1);map.panBy([96,36],{animate:false});});await frame();
  const panned=await snapshot();
  await page.locator('#booking-address').fill('Địa chỉ đang nhập thêm');
  await page.locator('#booking-location-note').fill('Ghi chú thêm');await frame();
  metrics.formEdits={...await snapshot(),tiles};
  metrics.formEdits.panPreserved=JSON.stringify(metrics.formEdits.center)===JSON.stringify(panned.center);
  const beforeBackground=await snapshot(),tilesBeforeBackground=tiles;
  for(let index=0;index<6;index++) {
    await page.evaluate(()=>dispatchEvent(new HashChangeEvent('hashchange')));
    await page.locator('[data-location-use-pin]').waitFor({state:'hidden'});await frame();
  }
  metrics.backgroundRenders={...await snapshot(),tiles,extraMaps:(await snapshot()).created-beforeBackground.created,extraTileRequests:tiles-tilesBeforeBackground,panPreserved:JSON.stringify((await snapshot()).center)===JSON.stringify(beforeBackground.center)};
  const beforeGps=await snapshot(),tilesBeforeGps=tiles;
  await page.locator('[data-location-detect]').click();
  await page.waitForFunction(()=>window.state?.booking.locationCoordinates?.mode==='gps'&&!window.state.booking.isDetectingLocation);
  await page.waitForFunction(()=>Boolean(window.state.booking.locationConfirmedAt));
  assert.equal(await page.locator('[data-location-use-pin]').isVisible(),false,'Resolved GPS is accepted without a second confirmation');
  await page.evaluate(()=>window.__mapPerformance.maps.at(-1).panBy([160,0],{animate:false}));
  await page.locator('[data-location-detect]').click();
  await page.waitForFunction(()=>!window.state.booking.isDetectingLocation);
  const recentered=await snapshot();
  assert.ok(Math.abs(recentered.center.lat-devicePoint.lat)<0.00001&&Math.abs(recentered.center.lng-devicePoint.lon)<0.00001,'An explicit GPS refresh recenters even when the measured coordinates are unchanged');
  await page.waitForFunction(()=>window.state?.booking.locationCoordinates?.mode==='gps'&&Boolean(window.state.booking.locationConfirmedAt)&&!window.state.booking.isDetectingLocation);
  assert.deepEqual(await page.evaluate(()=>window.state.booking.locationCoordinates),devicePoint,'Confirming an unchanged GPS point retains its source and measured accuracy');
  assert.deepEqual(await page.evaluate(()=>window.state.booking.locationDeviceCoordinates),devicePoint);
  await page.locator('[data-location-use-pin]').waitFor({state:'hidden'});await frame();
  metrics.gpsAndConfirmation={...await snapshot(),tiles,extraMaps:(await snapshot()).created-beforeGps.created,extraTileRequests:tiles-tilesBeforeGps};
  metrics.pointerFrames=await page.evaluate(async()=>{
    const map=window.__mapPerformance.maps.at(-1),times=[];
    let previous=performance.now();
    for(let index=0;index<20;index++) {map.panBy([3,0],{animate:false});await new Promise(requestAnimationFrame);const now=performance.now();times.push(now-previous);previous=now;}
    times.sort((a,b)=>a-b);return {max:times.at(-1),p95:times[Math.floor(times.length*.95)-1],median:times[Math.floor(times.length*.5)]};
  });
  await page.waitForTimeout(850); // Let the bounded scroll updates from the last navigation settle.
  metrics.idleProgress=await page.evaluate(async()=>{
    const root=document.getElementById('hoan-scroll-system');
    const percent=document.querySelector('#back-to-top-btn .btn-percent');
    const bar=document.getElementById('scroll-progress-bar');
    const result={present:Boolean(root&&percent&&bar),textWrites:0,updates:0};
    const observer=new MutationObserver(records=>{
      records.forEach(record=>{
        if(record.target===percent&&record.type==='childList')result.textWrites++;
        if(record.target===bar&&record.attributeName==='aria-valuenow')result.updates++;
      });
    });
    observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-valuenow']});
    // Tile/marker DOM churn must not restart a progress animation loop.
    const pane=document.querySelector('.leaflet-pane');
    for(let index=0;index<20;index++){const item=document.createElement('span');pane.append(item);item.remove();}
    await new Promise(resolve=>setTimeout(resolve,600));
    observer.disconnect();return result;
  });
  metrics.afterContentMutation=await page.evaluate(async()=>{
    const root=document.getElementById('hoan-scroll-system'),bar=document.getElementById('scroll-progress-bar');
    const result={updates:0};
    const observer=new MutationObserver(records=>{result.updates+=records.filter(record=>record.target===bar&&record.attributeName==='aria-valuenow').length;});
    observer.observe(root,{subtree:true,attributes:true,attributeFilter:['aria-valuenow']});
    const external=document.createElement('span');external.hidden=true;document.body.append(external);external.remove();
    await new Promise(resolve=>setTimeout(resolve,600));
    observer.disconnect();return result;
  });
  await mkdir('outputs/map-performance',{recursive:true});
  await writeFile(`outputs/map-performance/${baseline?'baseline':'result'}-partial.json`,JSON.stringify(metrics,null,2));
  console.log('Map interaction stages:',JSON.stringify(brief(metrics),null,2));
  await page.evaluate(()=>{location.hash='#/admin/customers';});await page.locator('[data-admin-customer-locations]').waitFor();
  const beforeHistory=await snapshot(),tilesBeforeHistory=tiles;
  if(!skipAdmin) {
  await page.locator('[data-admin-customer-locations]').click();await page.locator('.admin-customer-locations').waitFor();
  await page.waitForTimeout(400);await frame();
  metrics.adminHistory={...await snapshot(),tiles,extraMaps:(await snapshot()).created-beforeHistory.created,extraTileRequests:tiles-tilesBeforeHistory,panels:await page.locator('[data-admin-location-panel]').count()};
  await page.locator('.modal [data-action="close-modal"]').click();await frame();
  }
  metrics.afterCleanup={...await snapshot(),tiles};
  metrics.totalLongTasks=metrics.afterCleanup.longTasks.length;
  metrics.maxLongTask=Math.max(0,...metrics.afterCleanup.longTasks.map(task=>task.duration));
  await mkdir('outputs/map-performance',{recursive:true});
  await writeFile(`outputs/map-performance/${baseline?'baseline':'result'}.json`,JSON.stringify(metrics,null,2));
  console.log(JSON.stringify(brief(metrics),null,2));
  assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);assert.equal(metrics.afterCleanup.live,0);
  if(!baseline) {
    assert.equal(metrics.formEdits.created,metrics.initial.created,'Form edits retain one map');
    assert.equal(metrics.formEdits.panPreserved,true);
    assert.equal(metrics.backgroundRenders.extraMaps,0,'Same-route renders preserve the map instance');
    assert.equal(metrics.backgroundRenders.panPreserved,true,'Background hydration preserves customer pan/zoom');
    assert.equal(metrics.backgroundRenders.extraTileRequests,0,'Background renders do not reload identical tiles');
    assert.equal(metrics.gpsAndConfirmation.extraMaps,0,'GPS updates and confirming the same device point update one map');
    assert.ok(metrics.adminHistory.extraMaps<=2,'History maps mount on demand rather than all bookings');
    assert.ok(metrics.pointerFrames.p95<150,'Panning remains responsive under 4x CPU throttle');
    assert.equal(metrics.idleProgress.present,true);
    assert.equal(metrics.idleProgress.textWrites,0,'Idle map DOM mutations cannot start a self-triggered progress loop');
    assert.equal(metrics.idleProgress.updates,0,'Fixed-size tile mutations do not request scroll progress frames');
    assert.ok(metrics.afterContentMutation.updates<=2,'One page content mutation causes bounded progress updates');
  }
  console.log(baseline?'BASELINE captured; expected regression assertions skipped.':'PASS retained map and pan across form/background/GPS updates, no tile churn on background renders, lazy admin maps, responsive panning and cleanup.');
} catch(error) {
  await mkdir('outputs/map-performance',{recursive:true});
  await writeFile(`outputs/map-performance/${baseline?'baseline':'result'}-failure.json`,JSON.stringify({...metrics,error:String(error)},null,2));
  throw error;
} finally {await context.close();await browser.close();}
