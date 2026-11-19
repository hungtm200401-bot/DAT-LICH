import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,access} from 'node:fs/promises';

const code=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
function harness(){
 const nodes=new Map();const handlers={};
 const node=()=>({innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){}},querySelector(){return null},querySelectorAll(){return []}});
 const ctx={console,URLSearchParams,Intl,Date,Math,Number,String,Object,Array,JSON,Set,Promise,structuredClone,setTimeout(){},clearTimeout(){},location:{hash:'#/'},localStorage:{getItem(){return null},setItem(){}},document:{querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)},querySelectorAll(){return []},addEventListener(){},title:''},window:{scrollTo(){},addEventListener(k,f){(handlers[k]??=[]).push(f)}},fetch:()=>new Promise(()=>{})};
 ctx.document.getElementById = () => node();
 vm.createContext(ctx);vm.runInContext(code,ctx);
 return {state:ctx.window.state,render(path){ctx.location.hash='#'+path;for(const f of handlers.hashchange||[])f();return nodes.get('#app').innerHTML;}};
}
test('all approved public pages render with the same header and independent footer destinations',async()=>{
 const app=harness();
 const routes=['/','/services','/services/personal','/services/bridal','/gallery','/look/evening','/about','/support','/contact','/policies','/lookup','/search','/booking/service','/booking/time','/booking/location','/booking/info','/booking/deposit','/booking/confirm','/booking/success','/booking/missing','/booking/missing/receipt','/booking/missing/cancel','/booking/missing/reschedule',...['booking','lookup','deposit','verification','receipt','reschedule','cancel','refund','preparation','reference'].map(x=>'/support/'+x),...['booking','deposit','change','cancel','late','travel','privacy'].map(x=>'/policies/'+x)];
 for(const route of routes){const html=app.render(route);assert.match(html,/couture-header/,route);for(const dest of ['support','lookup','policies','contact'])assert.ok(html.includes('href="#/'+dest+'"'),route+' footer '+dest);assert.ok(!html.includes('undefined'),route);}
});
test('existing admin destinations remain renderable without fake appointments',()=>{
 const app=harness();for(const route of ['','appointments','schedule','services','customers','payments','promotions','gallery','content','notifications','reports','permissions','audit','settings','requests']){assert.ok(app.render('/admin/'+route).length>100,route);}
});
test('website content admin no longer exposes the general configuration mode',()=>{
 const html=harness().render('/admin/content');assert.doesNotMatch(html,/Cấu hình chung|switch-content-view/);
});
test('referenced public image assets exist',async()=>{
 const app=harness();for(const path of ['/','/services','/gallery','/about']){for(const m of app.render(path).matchAll(/src="(\/assets\/[^"?]+)"/g))await access(new URL('../public'+m[1],import.meta.url));}
});
test('lookup and policy index keep separate destination pages; payment has no fake successful receipt',()=>{
 const app=harness();assert.doesNotMatch(app.render('/lookup'),/KẾT QUẢ MINH HỌA|HOAN-MAU/);assert.match(app.render('/policies'),/#\/policies\/deposit/);assert.doesNotMatch(app.render('/booking/deposit'),/Thanh toán thành công/);
});

test('services use one overview and scoped detail pages, including legacy filter links',()=>{
 const app=harness();
 const overview=app.render('/services');
 assert.match(overview,/ct-services-overview/);
 assert.doesNotMatch(overview,/<nav class="ct-tabs">|services\?filter=/);
 assert.equal((overview.match(/class="ct-service-card"/g)||[]).length,4);
 for(const id of ['personal','party','photo','bridal']) {
  const detail=app.render('/services/'+id);
  assert.match(detail,/ct-service-collection/);
  assert.doesNotMatch(detail,/<nav class="ct-tabs">|services\?filter=/);
  assert.match(detail,/Quay lại danh sách dịch vụ/);
  assert.equal(app.render('/services?filter='+id),detail);
 }
 assert.equal(app.render('/services?filter=all'),overview);
 assert.match(app.render('/services/personal/port-personal-1'),/Trong trẻo tự nhiên hằng ngày/);
 assert.match(app.render('/services/personal/port-party-1'),/Mẫu trang điểm hiện không khả dụng/);
 assert.match(app.render('/services/missing'),/Dịch vụ hiện không khả dụng/);
});

test('payment receipt renders the new A4 editorial receipt layout and reconciled figures',()=>{
 const app=harness();
 app.state.appointments.push({
  code:'HMA-300926-AG2',
  customer:'manhj hung',
  phone:'0901234567',
  serviceId:'personal',
  date:'2026-09-30',
  time:'13:00',
  total:500000,
  deposit:200000,
  status:'confirmed',
  paymentStatus:'received',
  finance:{received:200000,refunded:0,netReceived:200000,remaining:300000}
 });
 app.state.paymentHistoryByCode={
  'HMA-300926-AG2':[{kind:'opening',amount:200000}]
 };
 const html=app.render('/booking/HMA-300926-AG2/receipt');
 for(const expected of [
  'Biên nhận thanh toán',
  'MÃ BIÊN NHẬN',
  'HMA-300926-AG2',
  'TRẠNG THÁI GIAO DỊCH',
  'ĐÃ ĐỐI SOÁT',
  'THÔNG TIN LỊCH HẸN',
  'KHÁCH HÀNG',
  'manhj hung',
  'DỊCH VỤ',
  'Trang điểm cá nhân',
  'NGÀY HẸN',
  '30/09/2026',
  'GIỜ HẸN',
  '13:00',
  'CHI TIẾT THANH TOÁN',
  'Tổng chi phí',
  '500.000đ',
  'Tổng tiền đã nhận',
  'Đã hoàn cho khách',
  'Thực nhận sau hoàn',
  'CÒN PHẢI THANH TOÁN',
  'Số tiền còn lại của lịch hẹn',
  '300.000đ',
  'LỊCH SỬ THU / HOÀN',
  'Số dư đã nhận chuyển sang',
  'Khoản đã thanh toán được trừ vào tổng chi phí.',
  'Biên nhận phản ánh những giao dịch Hoàn đã kiểm tra.',
  '01 / 01'
 ]) assert.ok(html.includes(expected), 'missing receipt text: '+expected);
});

test('selecting a service on /booking/service updates and animates only that product card without re-rendering the page',async()=>{
 const nodes=new Map();const winHandlers={};const docHandlers={};
 const makeNode=()=>({innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){}},setAttribute(){},querySelector(){return null},querySelectorAll(){return []}});
 const footerSummary={innerHTML:''};
 const ctx={
  console,URLSearchParams,Intl,Date,Math,Number,String,Object,Array,JSON,Set,Promise,structuredClone,
  setTimeout(){},clearTimeout(){},
  location:{hash:'#/booking/service'},
  localStorage:{getItem(){return null},setItem(){}},
  document:{
   querySelector(s){
    if(s==='.ct-booking-footer > div:first-child')return footerSummary;
    if(!nodes.has(s))nodes.set(s,makeNode());
    return nodes.get(s);
   },
   querySelectorAll(){return []},
   getElementById(){return makeNode();},
   addEventListener(k,f){(docHandlers[k]??=[]).push(f);},
   title:''
  },
  window:{
   scrollTo(){},
   matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),
   addEventListener(k,f){(winHandlers[k]??=[]).push(f);}
  },
  fetch:()=>new Promise(()=>{})
 };
 vm.createContext(ctx);vm.runInContext(code,ctx);
 const initialHtml=nodes.get('#app').innerHTML;
 assert.ok(initialHtml.includes('Vẻ đẹp không cần giống một ai.'));
 nodes.get('#app').innerHTML='SENTINEL_NO_FULL_RERENDER';

 const animatedIds=[];
 const makeCard=id=>{
  const h2={tagName:'H2',animate(){animatedIds.push(id+':h2');return {cancel(){},finished:Promise.resolve()};}};
  const p={tagName:'P',animate(){animatedIds.push(id+':p');return {cancel(){},finished:Promise.resolve()};}};
  const span={tagName:'SPAN',textContent:id==='party'?'✓ Đã chọn':'Chọn dịch vụ',animate(){animatedIds.push(id+':span');return {cancel(){},finished:Promise.resolve()};}};
  const img={tagName:'IMG',animate(){animatedIds.push(id+':img');return {cancel(){},finished:Promise.resolve()};}};
  const classes=new Set(id==='party'?['ct-service-option','selected']:['ct-service-option']);
  const attrs={};
  const card={
   dataset:{action:'booking-service',id},
   offsetWidth:280,
   children:[img,h2,p,span],
   classList:{
    add(c){classes.add(c);},
    remove(c){classes.delete(c);},
    toggle(c,force){if(force)classes.add(c);else classes.delete(c);},
    contains(c){return classes.has(c);}
   },
   setAttribute(k,v){attrs[k]=v;},
   getAttribute(k){return attrs[k];},
   querySelector(sel){return sel==='h2'?h2:sel==='p'?p:sel==='img'?img:sel==='span'?span:null;},
   closest(sel){return sel==='.ct-select-services'?grid:sel==='[data-action]'?card:null;}
  };
  return {card,span};
 };
 const cards=['personal','party','photo','bridal'].map(makeCard);
 const grid={querySelectorAll(){return cards.map(c=>c.card);}};
 const photoCard=cards.find(c=>c.card.dataset.id==='photo').card;

 for(const fn of docHandlers.click||[]){
  await fn({target:{closest(sel){return sel==='[data-action]'?photoCard:null;}},preventDefault(){},stopImmediatePropagation(){}});
 }

 assert.equal(nodes.get('#app').innerHTML,'SENTINEL_NO_FULL_RERENDER','whole #app must not be re-rendered');
 assert.equal(ctx.window.state.booking.serviceId,'photo');
 assert.equal(photoCard.classList.contains('selected'),true);
 assert.equal(photoCard.classList.contains('is-just-selected'),true);
 assert.equal(cards.find(c=>c.card.dataset.id==='party').card.classList.contains('selected'),false);
 assert.equal(cards.find(c=>c.card.dataset.id==='party').span.textContent,'Chọn dịch vụ');
 assert.equal(cards.find(c=>c.card.dataset.id==='photo').span.textContent,'✓ Đã chọn');
 assert.match(footerSummary.innerHTML,/Trang điểm chụp ảnh · 850\.000đ/);
 assert.equal(animatedIds.some(id=>id.endsWith(':h2')||id.endsWith(':p')),false,'service title and price must never blink');
 assert.deepEqual(animatedIds,['photo:img','photo:span']);
});
