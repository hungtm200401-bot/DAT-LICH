import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,access} from 'node:fs/promises';

const code=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
function harness(){
 const nodes=new Map();const handlers={};
 const node=()=>({innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){}},querySelector(){return null},querySelectorAll(){return []}});
 const ctx={console,URLSearchParams,Intl,Date,Math,Number,String,Object,Array,JSON,Set,Promise,structuredClone,setTimeout(){},clearTimeout(){},location:{hash:'#/'},localStorage:{getItem(){return null},setItem(){}},document:{querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s)},querySelectorAll(){return []},addEventListener(){},title:''},window:{scrollTo(){},addEventListener(k,f){(handlers[k]??=[]).push(f)}},fetch:()=>new Promise(()=>{})};
 vm.createContext(ctx);vm.runInContext(code,ctx);
 return {render(path){ctx.location.hash='#'+path;for(const f of handlers.hashchange||[])f();return nodes.get('#app').innerHTML;}};
}
test('all approved public pages render with the same header and independent footer destinations',async()=>{
 const app=harness();
 const routes=['/','/services','/services/personal','/services/bridal','/gallery','/look/evening','/about','/support','/contact','/policies','/lookup','/search','/booking/service','/booking/time','/booking/location','/booking/info','/booking/deposit','/booking/confirm','/booking/success','/booking/missing','/booking/missing/receipt','/booking/missing/cancel','/booking/missing/reschedule',...['booking','lookup','deposit','verification','receipt','reschedule','cancel','refund','preparation','reference'].map(x=>'/support/'+x),...['booking','deposit','change','cancel','late','travel','privacy'].map(x=>'/policies/'+x)];
 for(const route of routes){const html=app.render(route);assert.match(html,/couture-header/,route);for(const dest of ['support','lookup','policies','contact'])assert.ok(html.includes('href="#/'+dest+'"'),route+' footer '+dest);assert.ok(!html.includes('undefined'),route);}
});
test('existing admin destinations remain renderable without fake appointments',()=>{
 const app=harness();for(const route of ['','appointments','schedule','services','customers','payments','promotions','gallery','content','notifications','reports','permissions','audit','settings','requests']){assert.ok(app.render('/admin/'+route).length>100,route);}
});
test('referenced public image assets exist',async()=>{
 const app=harness();for(const path of ['/','/services','/gallery','/about']){for(const m of app.render(path).matchAll(/src="(\/assets\/[^"?]+)"/g))await access(new URL('../public'+m[1],import.meta.url));}
});
test('lookup and policy index keep separate destination pages; payment has no fake successful receipt',()=>{
 const app=harness();assert.doesNotMatch(app.render('/lookup'),/KẾT QUẢ MINH HỌA|HOAN-MAU/);assert.match(app.render('/policies'),/#\/policies\/deposit/);assert.match(app.render('/booking/deposit'),/Hoàn sẽ gửi thông tin chuyển khoản/);assert.doesNotMatch(app.render('/booking/deposit'),/15:00|Thanh toán thành công/);
});
