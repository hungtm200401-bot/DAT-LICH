import fs from 'node:fs';
import vm from 'node:vm';

const code = fs.readFileSync('./public/app.js', 'utf8');

function harness(draft = {}) {
  const handlers = {};
  const nMap = new Map();
  const node = () => ({ innerHTML: '', textContent: '', classList: { add(){}, remove(){}, toggle(){} }, querySelector(){ return null; }, querySelectorAll(){ return []; } });
  const c = {
    console, URLSearchParams, Intl, Date, Math, Number, String, Object, Array, JSON, Set, Promise, structuredClone,
    setTimeout(){}, clearTimeout(){}, location: { hash: '#/booking/deposit' },
    localStorage: { getItem(k){ if (k==='hoanMakeupDraft') return JSON.stringify(draft); return null; }, setItem(){} },
    document: { querySelector(s){ if (!nMap.has(s)) nMap.set(s, node()); return nMap.get(s); }, querySelectorAll(){ return []; }, addEventListener(){}, title: '' },
    window: { scrollTo(){}, addEventListener(k, f){ (handlers[k] ??= []).push(f); } },
    fetch: () => new Promise(()=>{})
  };
  vm.createContext(c);
  vm.runInContext(code, c);
  return {
    render(p){ c.location.hash = '#' + p; for (const f of handlers.hashchange || []) f(); return nMap.get('#app').innerHTML; }
  };
}

function extractTrack(html) {
  const match = html.match(/<div class="ct-deposit-status-track"[\s\S]*?<\/div>\s*<\/div>/);
  return match ? match[0].replace(/\s+/g, ' ') : 'NOT FOUND';
}

console.log('--- 1. Ban dau (chua thanh toan) ---');
const app1 = harness();
console.log(extractTrack(app1.render('/booking/deposit')));

console.log('\n--- 2. Khach da chuyen khoan (cho doi soat) ---');
const app2 = harness({ booking: { depositReported: true, depositStatus: 'pending_verification' } });
console.log(extractTrack(app2.render('/booking/deposit')));

console.log('\n--- 3. Quan tri da xac nhan coc (da nhan coc) ---');
const app3 = harness({ booking: { depositPaid: true, depositStatus: 'received' } });
console.log('Step 5 deposit:');
console.log(extractTrack(app3.render('/booking/deposit')));

console.log('\n--- 4. Buoc 6 Xac nhan sau khi quan tri duyet coc ---');
console.log('Step 6 confirm:');
console.log(extractTrack(app3.render('/booking/confirm')));
