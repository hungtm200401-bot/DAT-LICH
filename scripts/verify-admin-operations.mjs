import assert from 'node:assert/strict';
import { mkdir,readFile } from 'node:fs/promises';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5173';
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true,reducedMotion:'reduce'});
await context.addInitScript(()=>{localStorage.setItem('hoanAdminToken','fixture-token');localStorage.setItem('hoanAnalyticsConsent','no');});
const notice=(id,title,status='unread')=>({id,title,message:'Nội dung kiểm thử '+id,type:'appointment.created',entityType:'appointment',entityId:'A-1',status,createdAt:new Date().toISOString()});
const business={services:[],appointments:[{code:'A-1',customer:'Khách thử',phone:'0901234567',date:'2026-11-03',time:'09:00',total:700000,deposit:0,status:'pending',serviceId:'party'}],paymentTransactions:[],customers:[],scheduleSlots:[],requests:[],notifications:[notice('N1','Lịch mới'),notice('N2','Khách báo cọc'),notice('N3','Đổi lịch'),notice('N4','Đã xử lý','read')],bookingDetails:{},settings:{},brand:{}};
const timeAgo = ms => new Date(Date.now() - ms).toISOString();
const sessions = Array.from({ length: 12 }, (_, i) => ({
  id: 'session-' + i,
  session_code: 'HMA-' + String(i + 1).padStart(6, '0'),
  display_name: i === 0 ? 'Ngọc Anh' : '',
  source: i % 2 ? 'direct' : 'facebook',
  device: i % 2 ? 'Máy tính' : 'Điện thoại',
  campaign: i % 2 ? '' : 'Tháng 11',
  current_page: i === 0 ? '/' : i % 2 ? '/services' : '/booking/service',
  pageviews: i + 1,
  active_seconds: 60 + i,
  started_at: timeAgo(360_000),
  last_seen_at: timeAgo(i < 3 ? 0 : 300_000),
}));
const departed = sessions[3];
departed.left_at = departed.last_seen_at = timeAgo(10_000);
const legacy = sessions[4];
legacy.last_seen_at = timeAgo(400_000);
legacy.last_event_at = timeAgo(350_000);
const shortVisit = sessions[5];
shortVisit.current_page = '/';
shortVisit.active_seconds = 19;
shortVisit.last_event_at = new Date(Date.parse(shortVisit.started_at) + 50).toISOString();
shortVisit.last_seen_at = new Date(Date.parse(shortVisit.started_at) + 19_183).toISOString();
const missingEnd = sessions[6];
missingEnd.last_seen_at = timeAgo(400_000);
missingEnd.last_event_at = missingEnd.started_at;
business.services=[{id:'party',name:'Trang điểm dự tiệc',duration:90,price:700000,enabled:true}];
const writes=[],visitQueries=[];let failNotice=false,failVisits=false,failDetail=false,slow=false;
await context.route('**/api/**',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.pathname==='/api/data'){
    if(request.method()==='GET')return route.fulfill({json:business});
    const data=request.postDataJSON();writes.push(data);assert.equal(data.action,'markNotificationsRead');assert.ok(data.id,'read-all mutations forbidden');
    if(slow)await new Promise(resolve=>setTimeout(resolve,data.id==='N2'?200:50));
    if(failNotice)return route.fulfill({status:503,json:{error:'Lỗi lưu kiểm thử'}});
    business.notifications.find(n=>n.id===data.id).status='read';return route.fulfill({json:{ok:true,count:1}});
  }
  if(url.pathname==='/api/visits'){
    assert.equal(request.method(),'GET','visitor admin must not write tracking data');visitQueries.push(Object.fromEntries(url.searchParams));
    if (url.searchParams.has('session')) {
      const occurred_at = new Date().toISOString();
      return route.fulfill(failDetail ? { status: 503, json: { error: 'Chưa tải được hành trình thử' } } : { json: { events: [
        { type: 'pageview', page: '/', occurred_at },
        { type: 'click', page: '/', label: 'Đi tới /services/party', occurred_at },
        { type: 'pageview', page: '/services/party', occurred_at },
        { type: 'click', page: '/booking/service', label: 'Chọn dịch vụ / bước đặt lịch', occurred_at },
        { type: 'click', page: '/booking/time', label: 'Chọn giờ hẹn', occurred_at },
        { type: 'click', page: '/services', label: '<script>unsafe</script>', occurred_at },
      ] } });
    }
    if(failVisits)return route.fulfill({status:503,json:{error:'Không tải được thống kê thử'}});
    const src=url.searchParams.get('source'),active=url.searchParams.get('active')==='1',offset=Number(url.searchParams.get('offset'))||0,activeSince=timeAgo(90_000);
    const isActive = session => !session.left_at && session.last_seen_at >= activeSince;
    const filtered = sessions.filter(session => (!src || session.source === src) && (!active || isActive(session)));
    return route.fulfill({json:{sessions:filtered.slice(offset,offset+10),summary:{total:filtered.length,active:filtered.filter(isActive).length,facebook:filtered.filter(s=>s.source==='facebook').length,identified:1},activeSince,serverTime:new Date().toISOString(),pageSize:10,retentionDays:90}});
  }
  return route.fulfill({json:url.pathname==='/api/site-content'?{pages:{},drafts:{}}:url.pathname==='/api/cms-resources'?{shared:{value:{},revision:''},media:{value:[],revision:''},templates:{value:[],revision:''}}:{}});
});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
const go=async path=>{await page.goto(base+'/#'+path);await page.waitForFunction(()=>window.state?.backendReady&&window.HoanNoticeAdmin&&window.HoanVisitorAdmin);};
const count=async(n,mobile=false)=>{const badge=page.locator(mobile?'.ma-notice-count':'.admin-notification>b');if(n)await page.waitForFunction(([selector,text])=>document.querySelector(selector)?.textContent===text,[mobile?'.ma-notice-count':'.admin-notification>b',String(n)]);else await badge.waitFor({state:'detached'});};
const read=id=>page.locator(`[data-notice-read="${id}"]`);
const fit=async()=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
const shot=name=>page.screenshot({path:'outputs/admin-operations/'+name+'.png',fullPage:true,animations:'disabled',style:'.toast{visibility:hidden!important}'});
try{
  await mkdir('outputs/admin-operations',{recursive:true});
  await go('/admin/notifications');await read('N1').waitFor();await count(3);assert.equal(await page.locator('[data-action="mark-all-notifications-read"],[data-ma-action="read-all"]').count(),0);assert.match(await page.locator('[data-notice-id="N1"]').innerText(),/Chưa đọc/);await fit();await shot('notifications-desktop');
  await read('N1').click();await count(2);assert.equal(writes.length,1);assert.deepEqual(writes[0],{action:'markNotificationsRead',id:'N1'});assert.equal(await read('N1').isChecked(),true);await page.reload();await count(2);assert.equal(await read('N1').isChecked(),true);
  await page.locator('[data-notice-id="N2"] a').click();await page.waitForURL(u=>u.hash.includes('/admin/appointments'));await page.locator('.modal [data-action="close-modal"]').click();assert.equal(writes.length,1,'opening details does not mark notifications read');await go('/admin/notifications');await count(2);
  failNotice=true;await read('N2').click();await page.locator('.notice-row .ops-error').waitFor();assert.equal(await read('N2').isChecked(),false);await count(2);failNotice=false;slow=true;await read('N2').click();await read('N3').click();await count(0);slow=false;assert.equal(await read('N2').isChecked(),true);assert.equal(await read('N3').isChecked(),true);
  await page.locator('.notice-toolbar a[href$="tab=unread"]').click();await page.locator('.notice-list .ops-empty').waitFor();assert.match(await page.locator('.notice-list').innerText(),/đã đọc hết/);
  await page.setViewportSize({width:390,height:844});business.notifications.push(notice('N5','Thông báo mobile'));await go('/admin/notifications');await page.reload();await read('N5').waitFor();await count(1,true);assert.equal(await page.locator('.ma-bell').evaluate(el=>getComputedStyle(el,'::after').display),'none');await fit();await shot('notifications-mobile');await read('N5').click();await count(0,true);await page.reload();await read('N5').waitFor();await count(0,true);

  await page.setViewportSize({width:1440,height:1000});await go('/admin/visitors');await page.waitForFunction(()=>document.querySelectorAll('[data-visitor-session-row]').length===10);assert.deepEqual(await page.locator('.visitor-stats strong').allTextContents(),['12','3','6']);await fit();await shot('visitors-desktop');assert.equal(await page.locator('.visitor-tools').evaluate(el=>el.open),false);
  const homeRow = page.locator('[data-visitor-session-row="session-0"]');
  assert.equal(await homeRow.locator('.visitor-journey b').innerText(), 'Trang chủ');
  assert.equal(await homeRow.locator('.visitor-online').innerText(), 'Đang hoạt động');
  assert.deepEqual(await homeRow.locator('.visitor-session-times dt').allTextContents(), ['Bắt đầu', 'Ghi nhận cuối']);
  assert.match(await homeRow.locator('.visitor-session-times time').first().innerText(), /\d{2}:\d{2}:\d{2}/);
  const departedRow = page.locator('[data-visitor-session-row="session-3"]');
  assert.equal(await departedRow.locator('.visitor-online').innerText(), 'Đã rời trang');
  assert.deepEqual(await departedRow.locator('.visitor-session-times dt').allTextContents(), ['Bắt đầu', 'Rời lúc']);
  assert.equal(await departedRow.locator('time').first().getAttribute('datetime'), departed.started_at);
  assert.equal(await departedRow.locator('time').last().getAttribute('datetime'), departed.left_at);
  const legacyRow = page.locator('[data-visitor-session-row="session-4"]');
  assert.equal(await legacyRow.locator('.visitor-online').innerText(), 'Không hoạt động');
  assert.deepEqual(await legacyRow.locator('.visitor-session-times dt').allTextContents(), ['Bắt đầu', 'Ghi nhận cuối']);
  assert.equal(await legacyRow.locator('time').last().getAttribute('datetime'), legacy.last_event_at);
  const shortVisitRow = page.locator('[data-visitor-session-row="session-5"]');
  assert.equal(await shortVisitRow.locator('time').last().getAttribute('datetime'), shortVisit.last_seen_at);
  assert.match(await shortVisitRow.locator('.visitor-journey').innerText(), /Trang chủ[\s\S]*19 giây/);
  assert.equal(await shortVisitRow.getByText('Ghi nhận cuối', { exact: true }).evaluate(label => {
    const range = document.createRange();
    range.selectNodeContents(label);
    return range.getClientRects().length;
  }), 1);
  const missingEndTimes = page.locator('[data-visitor-session-row="session-6"] .visitor-session-times');
  assert.equal(await missingEndTimes.locator('time').count(), 1);
  assert.equal(await missingEndTimes.locator('dd').last().innerText(), 'Chưa ghi nhận');
  await page.locator('[data-visitor="next"]').click();await page.waitForFunction(()=>document.querySelectorAll('[data-visitor-session-row]').length===2);assert.equal(visitQueries.at(-1).offset,'10');await page.locator('[data-visitor-filter="source"]').selectOption('facebook');await page.waitForFunction(()=>document.querySelectorAll('[data-visitor-session-row]').length===6);assert.equal(visitQueries.at(-1).offset,'0');assert.equal(visitQueries.at(-1).source,'facebook');
  await page.locator('[data-visitor-filter="active"]').check();await page.waitForFunction(()=>document.querySelectorAll('[data-visitor-session-row]').length===2);await page.locator('[data-visitor-filter="days"]').selectOption('30');await page.waitForFunction(()=>document.querySelector('[data-visitor="refresh"]')?.textContent==='Làm mới');assert.equal(visitQueries.at(-1).days,'30');
  await page.locator('[data-visitor-search]').fill('Ngoc Anh');
  assert.equal(await page.locator('[data-visitor-session-row]').count(), 1);
  await page.locator('[data-visitor-search]').fill('trang chu');
  assert.equal(await page.locator('[data-visitor-session-row]').count(), 1);
  assert.equal(await homeRow.count(), 1);
  await page.locator('[data-visitor-search]').fill('hma-000001');
  assert.equal(await page.locator('[data-visitor-session-row]').count(), 1);
  assert.equal(await page.locator('.visitor-person code').innerText(), 'HMA-000001');
  const download=page.waitForEvent('download');
  await page.locator('[data-visitor="export"]').click();
  const csv=await readFile(await (await download).path(),'utf8');
  assert.match(csv, /"Ngọc Anh","HMA-000001"/);
  assert.doesNotMatch(csv, /HMA-000003/);
  failDetail=true;await page.locator('[data-visitor="detail"]').first().click();await page.locator('.visitor-detail-dialog .ops-error').waitFor();failDetail=false;await page.locator('[data-visitor="retry-detail"]').click();await page.locator('.visitor-event-list').waitFor();assert.match(await page.locator('.visitor-event-list').innerText(),/unsafe/);assert.equal(await page.locator('.visitor-event-list script').count(),0);
  const timeline = page.locator('.visitor-event-list');
  assert.deepEqual((await timeline.locator('.visitor-event-card').allTextContents()).slice(0, 5), [
    'Xem Trang chủ', 'Mở Trang điểm dự tiệc', 'Xem Trang điểm dự tiệc', 'Thao tác đặt lịch', 'Chọn giờ hẹn',
  ]);
  assert.equal(await timeline.locator('code').count(), 0);
  assert.doesNotMatch(await timeline.innerText(), /\/services|\/booking/);
  assert.equal(await page.locator('.visitor-detail-person code').innerText(), 'HMA-000001');
  assert.deepEqual(await page.locator('.visitor-detail-meta dt').allTextContents(), ['Thiết bị', 'Chiến dịch', 'Bắt đầu', 'Ghi nhận cuối']);
  assert.equal(visitQueries.at(-1).session, 'session-0');
  await page.locator('[data-visitor="close-detail"]').click();
  failVisits=true;await page.locator('[data-visitor="refresh"]').click();await page.locator('[data-visitor-body]>.ops-error').waitFor();assert.equal(await page.locator('[data-visitor="export"]').isDisabled(),true);failVisits=false;await page.locator('[data-visitor-body]>.ops-error [data-visitor="refresh"]').click();await page.locator('[data-visitor-body]>.ops-error').waitFor({state:'detached'});
  await page.locator('[data-visitor="reset"]').click();await page.waitForFunction(()=>document.querySelectorAll('[data-visitor-session-row]').length===10);
  await page.locator('.visitor-tools>summary').click();await page.locator('[name="website"]').fill('https://example.com/');await page.locator('[name="campaign"]').fill('test-campaign');await page.locator('#visit-share-form [type="submit"]').click();await page.waitForFunction(()=>document.querySelector('#visit-share-link')?.value.includes('utm_campaign=test-campaign'));assert.equal(await page.locator('#visit-qr-container svg').count(),1);assert.equal(await page.locator('[data-action="download-qr"]').isDisabled(),false);await fit();
  await page.setViewportSize({width:390,height:844});await go('/admin/visitors');await page.waitForFunction(()=>document.querySelectorAll('[data-visitor-session-row]').length===10);await fit();await shot('visitors-mobile');await page.locator('[data-visitor="detail"]').first().click();await page.locator('.visitor-event-list').waitFor();assert.equal(await page.locator('.visitor-detail-dialog').evaluate(el=>el.scrollWidth>el.clientWidth+1),false);await page.keyboard.press('Escape');
  await page.locator('[data-visitor-search]').fill('no-such-visitor');assert.match(await page.locator('.visitor-session-list').innerText(),/Không có kết quả/);sessions.length=0;await page.locator('[data-visitor-search]').fill('');await page.locator('[data-visitor="refresh"]').click();await page.waitForFunction(()=>document.querySelector('.visitor-stats strong')?.textContent==='0');assert.match(await page.locator('.visitor-session-list').innerText(),/Chưa có phiên phù hợp/);
  assert.deepEqual(errors,[]);assert.ok(writes.every(row=>row.action==='markNotificationsRead'&&row.id));
  console.log('PASS admin operations: individual notification checkboxes, unread marks, successful-only desktop/mobile badge decrement, reload persistence, read-link distinction, failure/retry and concurrent reads; visitor summary, server filters, paging, scoped search/CSV, detail retry/escape, campaign QR, empty/error states and responsive layout. Fixture writes only.');
}catch(error){await page.screenshot({path:'outputs/admin-operations/failure.png',fullPage:true});console.error(errors);throw error;}finally{await browser.close();}
