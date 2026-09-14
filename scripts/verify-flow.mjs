import fs from 'node:fs';
import vm from 'node:vm';

const code = fs.readFileSync('public/app.js', 'utf8');
const nodes = new Map();
const node = () => ({
  innerHTML: '',
  textContent: '',
  classList: { add() {}, remove() {}, toggle() {} },
  querySelector() { return null; },
  querySelectorAll() { return []; }
});
const handlers = {};
const ctx = {
  console,
  URLSearchParams,
  Intl,
  Date,
  Math,
  Number,
  String,
  Object,
  Array,
  JSON,
  Set,
  Promise,
  structuredClone,
  setTimeout() {},
  clearTimeout() {},
  location: { hash: '#/' },
  localStorage: { getItem() { return null; }, setItem() {} },
  document: {
    querySelector(s) {
      if (!nodes.has(s)) nodes.set(s, node());
      return nodes.get(s);
    },
    querySelectorAll() { return []; },
    addEventListener() {},
    title: ''
  },
  window: {
    scrollTo() {},
    addEventListener(k, f) {
      (handlers[k] ??= []).push(f);
    }
  },
  fetch: () => new Promise(() => {})
};
vm.createContext(ctx);
vm.runInContext(code, ctx);

function render(path) {
  ctx.location.hash = '#' + path;
  for (const f of handlers.hashchange || []) f();
  return nodes.get('#app').innerHTML;
}

const serviceHtml = render('/booking/service');
const progressMatches = [...serviceHtml.matchAll(/class="step-label">([^<]+)<\/span>/g)].map(m => m[1]);
console.log('1. Tiến trình 5 bước:', progressMatches);

const depositHtml = render('/booking/deposit');
console.log('2. Bước 5 (Đặt cọc có QR & nút chuyển khoản):', depositHtml.includes('TÔI ĐÃ CHUYỂN KHOẢN'));

const statusHtml = render('/booking/LK7519');
console.log('3. Màn hình 1 (Đang kiểm tra khoản cọc):', statusHtml.includes('Đang kiểm tra khoản cọc'));
console.log('   Mã lịch hẹn hiển thị chính xác LK7519:', statusHtml.includes('LK7519'));

const confirmHtml = render('/booking/confirm');
console.log('4. Route /booking/confirm cũ không còn màn hình mâu thuẫn:', !confirmHtml.includes('Kiểm tra lịch hẹn') && confirmHtml.includes('TÔI ĐÃ CHUYỂN KHOẢN'));
