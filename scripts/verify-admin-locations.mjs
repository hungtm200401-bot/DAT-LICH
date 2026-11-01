import assert from 'node:assert/strict';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

const base='http://localhost:5173';
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
  await context.addInitScript(() => { window.maplibregl = { supported: () => false }; });
  await context.addInitScript(()=>localStorage.setItem('hoanAnalyticsConsent','no'));
  await context.route('https://tile.openstreetmap.org/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#eeeee9"/></svg>'}));
  const page=await context.newPage(), errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/?admin-location-qa=1#/support');
  await page.locator('.support-desk').waitFor();
  await page.addStyleTag({url:base+'/admin-location.css?v=1.0'});
  await page.evaluate(async()=>{
    const {createAdminLocations}=await import('/admin-location.js?v=1.0');
    const appointment={code:'TEST-COORDS-1',customer:'Khách kiểm thử',phone:'0900000000',date:'2026-11-02',time:'10:00',address:'Địa chỉ thử nghiệm',ward:'Xã thử nghiệm'};
    const details={city:'Thành phố thử nghiệm',locationCoordinates:{lat:21.100012345,lon:105.500023456,mode:'pin',accuracy:null},locationDeviceCoordinates:{lat:21.1001,lon:105.5002,mode:'gps',accuracy:18},locationCapturedAt:'2026-10-31T10:00:00.000Z',locationConfirmedAt:'2026-10-31T10:01:00.000Z'};
    const state={appointments:[appointment],bookingDetails:{[appointment.code]:details},customers:[{name:appointment.customer,phone:appointment.phone}]};
    const host=document.createElement('div');host.id='location-fixture';host.style.cssText='position:fixed;inset:0;z-index:10000;overflow:auto;background:#fff;padding:20px';
    document.body.append(host);
    const render=(_title,content)=>{host.innerHTML='<div style="max-width:640px;margin:auto">'+content+'</div>';};
    const subject=createAdminLocations({getState:()=>state,modal:render,toast:message=>window.__locationMessage=message});
    window.__locationSubject=subject;
    render('',subject.html(appointment,details));subject.mount(host);
  });
  const fixture=page.locator('#location-fixture');
  await fixture.locator('.leaflet-container').waitFor();
  assert.equal(await fixture.locator('.admin-location-facts').textContent().then(value=>value.includes('GPS thiết bị ban đầu')),true);
  assert.equal(await fixture.locator('[data-location-use-pin]').count(),0);
  const directions=new URL(await fixture.getByRole('link',{name:'Chỉ đường Google Maps ↗'}).getAttribute('href'));
  assert.equal(directions.searchParams.get('destination'),'21.100012345,105.500023456');
  await fixture.locator('[data-admin-copy-coordinates]').first().click();
  await page.waitForFunction(()=>window.__locationMessage==='Đã sao chép tọa độ');
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'21.100012345, 105.500023456');
  for(const width of [390,768,1440]) {
    await page.setViewportSize({width,height:900});
    assert.equal(await fixture.evaluate(node=>node.scrollWidth<=node.clientWidth+1),true,`No admin coordinate overflow at ${width}px`);
  }
  await page.evaluate(()=>{
    window.__locationSubject.beforeRender();
    document.getElementById('location-fixture').innerHTML='<div>Closed</div>';
    window.__locationSubject.mount();
    window.__locationSubject.dispose();window.__locationSubject.dispose();
  });
  await page.waitForTimeout(400);
  assert.deepEqual(errors,[]);
  console.log('PASS private admin coordinate panel, original device GPS, exact Google directions, copy, responsive sizing and lifecycle cleanup.');
  await context.close();
} finally {await browser.close();}
