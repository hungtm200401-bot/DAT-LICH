import assert from 'node:assert/strict';
import {chromium} from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173';
const browser=await chromium.launch({channel:'msedge',headless:true});
const tile='<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#eee"/></svg>';
try{
  for(const fallback of [false,true]){
    const context=await browser.newContext({viewport:{width:1200,height:900},serviceWorkers:'block'});
    await context.addInitScript(() => { window.maplibregl = { supported: () => false }; });
    await context.route('**/*',route=>{
      const url=new URL(route.request().url());
      if(url.hostname==='tile.openstreetmap.org')return route.fulfill({contentType:'image/svg+xml',body:tile});
      if(url.origin!==new URL(base).origin)return route.abort();
      if(url.pathname==='/__admin_location_lazy')return route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/admin-location.css"><style>body{margin:0;font:14px Arial}#test-app{max-width:960px;margin:auto}.admin-location-booking{min-height:680px}#test-modal:not([hidden]){position:fixed;inset:0;display:grid;place-items:center;background:#0004;z-index:20}#test-modal>div{max-height:calc(100vh - 40px);overflow:auto;width:700px;background:#fff;padding:20px;box-sizing:border-box}</style></head><body><main id="test-app"></main><div id="test-modal" hidden></div></body></html>'});
      return route.continue();
    });
    if(fallback)await context.addInitScript(()=>{window.IntersectionObserver=undefined;});
    const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base+'/__admin_location_lazy');await page.addScriptTag({url:base+'/vendor/leaflet/leaflet.js'});
    await page.addStyleTag({url:base+'/vendor/leaflet/leaflet.css'});
    await page.evaluate(async()=>{
      const original=window.L.map;window.testMaps=[];
      window.L.map=function(...args){const map=original.apply(this,args),record={map,container:map.getContainer(),active:true};window.testMaps.push(record);map.on('unload',()=>{record.active=false;});return map;};
      const {createAdminLocations}=await import('/admin-location.js?lazy-regression=1');
      const appointments=Array.from({length:24},(_,index)=>({code:'LAZY-FIXTURE-'+index,customer:'Khách kiểm thử',phone:'0900000000',date:'2026-12-01',time:'09:00',address:'Địa chỉ kiểm thử',ward:'Xã kiểm thử'}));
      window.testState={appointments,customers:[{name:'Khách kiểm thử',phone:'0900000000'}],bookingDetails:Object.fromEntries(appointments.map((a,index)=>[a.code,{city:'Thành phố kiểm thử',locationCoordinates:{lat:21.1+index*.00001,lon:105.5,accuracy:null,mode:'pin'},locationDeviceCoordinates:{lat:21.1,lon:105.5,accuracy:8,mode:'gps'},locationCapturedAt:'2026-10-31T08:00:00Z',locationConfirmedAt:'2026-10-31T08:01:00Z'}]))};
      window.testLocations=createAdminLocations({getState:()=>window.testState,modal:()=>{}});
      document.getElementById('test-app').innerHTML=testLocations.customerHtml(testState.customers[0]);testLocations.mount(document);
    });
    await page.waitForFunction(()=>testMaps.some(record=>record.active));
    let counts=await page.evaluate(()=>({active:testMaps.filter(record=>record.active).length,total:testMaps.length,panels:document.querySelectorAll('[data-admin-location-panel]').length}));
    assert.equal(counts.panels,24);assert.ok(counts.active<=4&&counts.total<=4,`${fallback?'fallback':'observer'} must not initialize all history maps: ${JSON.stringify(counts)}`);
    for(const index of [11,23,0]){
      await page.locator('.admin-location-booking').nth(index).scrollIntoViewIfNeeded();
      await page.waitForFunction(index=>testMaps.some(record=>record.active&&record.container.closest('[data-admin-location-panel]')?.dataset.adminLocationPanel==='LAZY-FIXTURE-'+index),index);
      await page.waitForFunction(()=>testMaps.filter(record=>record.active).length<=4);
    }
    await page.evaluate(()=>{
      const modal=document.getElementById('test-modal');modal.hidden=false;modal.innerHTML='<div>'+testLocations.html(testState.appointments[0],testState.bookingDetails['LAZY-FIXTURE-0'])+'</div>';testLocations.mount(modal);
    });
    await page.waitForFunction(()=>testMaps.some(record=>record.active&&document.getElementById('test-modal').contains(record.container)));
    const modalId=await page.evaluate(()=>{const record=testMaps.find(record=>record.active&&document.getElementById('test-modal').contains(record.container));return testMaps.indexOf(record);});
    await page.evaluate(()=>{const app=document.getElementById('test-app');testLocations.beforeRender(app);app.innerHTML='<p>Đã làm mới dữ liệu nền.</p>';testLocations.mount(document);});
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(index=>testMaps[index].active,modalId),true,'connected modal map must survive background app replacement');
    await page.evaluate(()=>{const app=document.getElementById('test-app');app.innerHTML=testLocations.html(testState.appointments[1],testState.bookingDetails['LAZY-FIXTURE-1']);testLocations.mount(app);});
    await page.waitForFunction(()=>testMaps.some(record=>record.active&&document.getElementById('test-app').contains(record.container)));
    const appId=await page.evaluate(()=>testMaps.findIndex(record=>record.active&&document.getElementById('test-app').contains(record.container)));
    await page.evaluate(()=>{const modal=document.getElementById('test-modal');testLocations.beforeRender(modal);modal.innerHTML='';modal.hidden=true;});
    assert.equal(await page.evaluate(index=>testMaps[index].active,modalId),false,'modal replacement must release its map');
    assert.equal(await page.evaluate(index=>testMaps[index].active,appId),true,'modal cleanup must keep app maps');
    await page.evaluate(()=>document.getElementById('test-app').innerHTML='');
    await page.waitForFunction(()=>testMaps.every(record=>!record.active));
    await page.evaluate(()=>{const app=document.getElementById('test-app');app.innerHTML=testLocations.html(testState.appointments[2],testState.bookingDetails['LAZY-FIXTURE-2']);testLocations.mount(app);testLocations.beforeRender(app);app.innerHTML='';testLocations.dispose();});
    await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>testMaps.filter(record=>record.active).length),0);
    assert.deepEqual(errors,[],errors.join('\n'));await context.close();
  }
  console.log('PASS: 24-booking admin history creates only nearby maps, releases offscreen maps, preserves connected modal across app refresh, scoped cleanup and fallback visibility. All coordinates are local fixtures; tiles mocked.');
}finally{await browser.close();}
