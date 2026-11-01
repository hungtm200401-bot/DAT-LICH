import assert from 'node:assert/strict';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';
const base = 'http://localhost:5173';
const browser = await chromium.launch({channel:'msedge',headless:true});
const errors=[];
try {
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
  // Exercise the raster fallback for devices without WebGL; vector has its own suite.
  await context.addInitScript(() => { window.maplibregl = { supported: () => false }; });
  await context.addInitScript(()=>{
    try {
      localStorage.setItem('hoanAnalyticsConsent','no');
      localStorage.setItem('hoanMakeupDraft',JSON.stringify({booking:{city:'Thành phố Hà Nội',provinceCode:1,ward:'Phường Tùng Thiện',wardCode:9604,address:'Địa chỉ đang nhập',locationCoordinates:{lat:21.1,lon:105.5,accuracy:null,mode:'pin'},locationRegion:{provinceCode:1,wardCode:9604}}}));
    }catch{}
  });
  await context.route('https://tile.openstreetmap.org/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#eee"/></svg>'}));
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/?map-lifecycle=1#/support');
  await page.locator('.support-desk').waitFor();
  await page.addStyleTag({url:base+'/vendor/leaflet/leaflet.css'});
  await page.addScriptTag({url:base+'/vendor/leaflet/leaflet.js'});
  await page.evaluate(()=>{
    const create=window.L.map;
    window.__testMaps=[];
    window.__testRemovedMaps=new Set();
    window.L.map=function(...args){const map=create(...args);map.on('unload',()=>window.__testRemovedMaps.add(map));window.__testMaps.push(map);return map;};
  });
  await page.evaluate(()=>{location.hash='#/booking/location';});
  await page.locator('[data-location-map-canvas].leaflet-container').waitFor();
  await page.evaluate(()=>{const map=window.__testMaps.at(-1);map.setView([21.1,105.5],18,{animate:false});map.fire('click',{latlng:window.L.latLng(21.1,105.5)});});
  await page.locator('[data-location-use-pin]:not([disabled])').waitFor();
  for(let i=0;i<6;i++) {
    await page.evaluate(async()=>{
      const map=window.__testMaps.at(-1);
      map.setZoom(map.getZoom()+1,{animate:true});
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      dispatchEvent(new HashChangeEvent('hashchange'));
    });
    await page.waitForTimeout(400); // Leaflet's delayed zoom completion runs after 250ms.
    assert.deepEqual(errors,[],`Map replaced during zoom, iteration ${i}`);
    await page.locator('[data-location-use-pin]:not([disabled])').waitFor();
    assert.equal(await page.locator('.location-map-canvas.leaflet-container').count(),1);
    assert.equal(await page.locator('#booking-address').inputValue(),'Địa chỉ đang nhập');
    await page.setViewportSize({width:i%2?1440:390,height:i%2?1000:844});
  }
  await page.evaluate(async()=>{
    const map=window.__testMaps.at(-1);map.setZoom(map.getZoom()-1,{animate:true});
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    location.hash='#/booking/info';
  });
  await page.waitForURL(/#\/booking\/info$/);await page.waitForTimeout(400);
  assert.deepEqual(errors,[]);
  assert.equal(await page.locator('.leaflet-container').count(),0);
  await page.evaluate(()=>{location.hash='#/booking/location';});
  await page.locator('[data-location-use-pin]:not([disabled])').waitFor();
  await page.locator('.leaflet-control-zoom-in').click();
  await page.waitForTimeout(400);
  assert.deepEqual(errors,[]);
  assert.equal(await page.evaluate(()=>window.__testMaps.filter(map=>!window.__testRemovedMaps.has(map)).length),1);
  await page.evaluate(async()=>{
    const {mountLocationMap}=await import('/location-map.js?v=5.0');
    const container=document.createElement('section');
    container.innerHTML='<div data-location-map-canvas style="height:200px"></div><p data-location-pin-status></p><button data-location-use-pin>Use</button>';
    document.body.append(container);
    const point={lat:21.1,lon:105.5,accuracy:30,mode:'gps'};
    const first=new AbortController();
    const cancelled=mountLocationMap(container,point,()=>{}, {signal:first.signal});
    first.abort();
    const second=new AbortController();
    const current=mountLocationMap(container,point,()=>{}, {signal:second.signal});
    const [removeOld,removeCurrent]=await Promise.all([cancelled,current]);
    removeOld();removeOld();second.abort();removeCurrent();removeCurrent();
    container.remove();
  });
  await page.waitForTimeout(400);
  assert.deepEqual(errors,[]);
  assert.equal(await page.evaluate(()=>window.__testMaps.filter(map=>!window.__testRemovedMaps.has(map)).length),1);
  await context.close();
  console.log('PASS map replacement during zoom, repeated rerenders, resizing desktop/mobile, leaving during zoom, returning and using zoom controls, cancelling pending mounts, repeated cleanup, draft preservation, and one active map without browser errors.');
} finally {await browser.close();}
