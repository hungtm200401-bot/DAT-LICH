import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';
import { request as httpRequest } from 'node:http';
const base='http://127.0.0.1:5173';
const vars=await readFile(new URL('../.dev.vars',import.meta.url),'utf8');
const token=vars.match(/^ADMIN_TOKEN\s*=\s*([^\r\n]+)$/m)?.[1]?.trim().replace(/^['"]|['"]$/g,'');
assert.ok(token,'Initialize local key first; never print the key');
const evidence={target:base,liveDataWrites:0,checks:[],time:new Date().toISOString()};
for(const supplied of ['', 'INTENTIONALLY-WRONG']){
  const r=await fetch(base+'/api/visits?session=SECURITY-NONEXISTENT-FIXTURE',{headers:supplied?{Authorization:'Bearer '+supplied}:{}});assert.equal(r.status,401);await r.text();evidence.checks.push({actor:supplied?'wrong-key':'anonymous',http:401});
}
const verified=await fetch(base+'/api/visits?session=SECURITY-NONEXISTENT-FIXTURE',{headers:{Authorization:'Bearer '+token}});assert.equal(verified.status,200);assert.deepEqual((await verified.json()).events,[]);evidence.checks.push({actor:'valid-key',http:200,noRecordContentsCollected:true});
const publicData=await(await fetch(base+'/api/data')).json();assert.equal(publicData.customers,undefined);assert.equal(publicData.bookingDetails,undefined);assert.ok(publicData.appointments.every(a=>!('phone'in a)&&!('code'in a)));evidence.checks.push({publicSnapshotMinimized:true});
const hostStatus=await new Promise((resolve,reject)=>{const req=httpRequest(base+'/',{headers:{Host:'untrusted.example.invalid'}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});req.on('error',reject);req.end();});assert.equal(hostStatus,403);evidence.checks.push({untrustedHost:403});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
  await context.addInitScript(()=>localStorage.setItem('hoanAnalyticsConsent','no'));
  const writes=[],errors=[];
  await context.route('**/*',route=>{
    const request=route.request();
    if(new URL(request.url()).origin!==base)return route.abort();
    if(!['GET','HEAD'].includes(request.method())){writes.push({method:request.method(),path:new URL(request.url()).pathname});return route.abort();}
    return route.continue();
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/#/admin/settings');await page.waitForLoadState('networkidle');await page.locator('[data-form="admin-login"]').waitFor();
  await page.locator('#admin-access-key').fill(token);await page.locator('[data-form="admin-login"] button').click();await page.locator('.settings-workspace').waitFor();
  assert.equal(await page.evaluate(()=>window.state.adminAuthorized),true);
  await page.locator('[data-action="admin-logout"]').click();await page.locator('[data-form="admin-login"]').waitFor();
  assert.equal(await page.evaluate(()=>window.state.customers.length),0);assert.equal(await page.evaluate(()=>sessionStorage.getItem('hoanAdminToken')),null);
  assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);evidence.checks.push({browserLoginLogout:true,businessWrites:0,errors:0});
  await context.close();
}finally{await browser.close();}
await mkdir('outputs/security-audit',{recursive:true});await writeFile('outputs/security-audit/after-dev-access.json',JSON.stringify(evidence,null,2));
console.log('PASS live local dev: missing/wrong keys denied, valid key verified against empty fixture lookup, minimized public data, hostile Host blocked, browser login/logout, zero POST/PUT/PATCH/DELETE requests. No PII or secret retained.');
