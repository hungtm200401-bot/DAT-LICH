import { customerSummary, customerPayment } from './customer-history.js?v=1.0';

export function createCustomerWorkspace({ getState, esc, money, icon }) {
  const date = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value.split('-').reverse().join('/') : 'Chưa có ngày';
  const status = value => ({ pending:'Chờ xác nhận', confirmed:'Đã xác nhận', completed:'Hoàn thành', cancelled:'Đã hủy' })[value] || 'Chưa xác định';
  const key = (c, index) => String(c.id ?? `row-${index}`);
  const profileLink = (c, index) => '#/admin/customers?customer=' + encodeURIComponent(key(c, index));
  const initials = c => String(c.name || 'KH').trim().split(/\s+/).slice(-2).map(s => s[0]).join('').toUpperCase();
  const kpi = (label, value, hint = '') => `<div class="customer-stat"><span>${label}</span><strong>${value}</strong>${hint ? `<small>${hint}</small>` : ''}</div>`;

  function content({ mobile = false, customerKey } = {}) {
    const state = getState();
    const selected = customerKey ?? new URLSearchParams(location.hash.split('?')[1] || '').get('customer');
    if (selected != null) {
      const index = (state.customers || []).findIndex((c, i) => key(c, i) === selected);
      return index < 0 ? `<section class="customer-workspace"><a class="customer-back" href="#/admin/customers">← Danh sách khách hàng</a><div class="customer-empty">Không tìm thấy khách hàng. Hãy quay lại danh sách để chọn lại.</div></section>` : profile(state.customers[index], index, mobile);
    }
    const rows = (state.customers || []).map((c, i) => ({ c, i, summary: customerSummary(c, state) }));
    return `<section class="customer-workspace" aria-label="Danh sách khách hàng">
      <div class="customer-stats">${kpi('Tổng khách hàng', rows.length)}${kpi('Khách quay lại', rows.filter(r => r.summary.count > 1).length)}${kpi('Tiền thực nhận', money(rows.reduce((sum, r) => sum + r.summary.net, 0)), 'Sau khi trừ các khoản hoàn')}</div>
      <div class="customer-directory"><div class="customer-tools"><label class="customer-search">${icon('search')}<span class="sr-only">Tìm khách hàng</span><input id="customer-search" type="search" placeholder="Tìm tên, số điện thoại, email…"></label><label><span class="sr-only">Nhóm khách hàng</span><select id="customer-group"><option value="all">Tất cả khách hàng</option><option value="returning">Khách quay lại</option><option value="new">Đặt lần đầu</option><option value="none">Chưa đặt lịch</option></select></label><span class="customer-result" role="status" data-customer-count>${rows.length} khách hàng</span></div>
      <div class="table-wrap"><table class="data-table customer-table"><thead><tr><th>Khách hàng</th><th>Liên hệ</th><th>Lần đặt</th><th>Thực nhận</th><th>Gần nhất</th><th></th></tr></thead><tbody id="customer-body">${rows.map(({ c, i, summary: s }) => `<tr data-customer-row data-visits="${s.count}"><td><a class="customer-person" href="${esc(profileLink(c, i))}"><span class="customer-avatar" aria-hidden="true">${esc(initials(c))}</span><span><b>${esc(c.name || 'Chưa có tên')}</b><small>${s.count > 1 ? 'Khách quay lại' : s.count ? 'Khách mới' : 'Chưa có lịch hẹn'}</small></span></a></td><td><span>${esc(c.phone || 'Chưa có số điện thoại')}</span><small>${esc(c.email || '')}</small></td><td><span class="customer-visits">${s.count}</span></td><td><b>${money(s.net)}</b><small>${s.refunded ? `Đã hoàn ${money(s.refunded)}` : 'Đã đối soát'}</small></td><td>${s.appointments[0] ? `<span>${date(s.appointments[0].date)}</span><small>${esc(state.services.find(x => x.id === s.appointments[0].serviceId)?.name || 'Dịch vụ đã ngừng cung cấp')}</small>` : '—'}</td><td class="customer-row-actions"><a class="customer-view" href="${esc(profileLink(c, i))}">Xem hồ sơ ${icon('chevron')}</a><button class="action-btn" data-action="edit-customer" data-index="${i}" aria-label="Chỉnh sửa ${esc(c.name || 'khách hàng')}">${icon('edit')}</button></td></tr>`).join('')}</tbody></table></div>
      <div class="customer-empty" data-customer-empty ${rows.length ? 'hidden' : ''}>${icon('user')}<b>${rows.length ? 'Không tìm thấy khách phù hợp' : 'Chưa có khách hàng'}</b><p>${rows.length ? 'Thử tên, số điện thoại khác hoặc đổi nhóm khách hàng.' : 'Khách hàng sẽ xuất hiện khi có lịch đặt mới.'}</p></div></div>
      <p class="customer-footnote">Bấm tên khách hoặc “Xem hồ sơ” để xem toàn bộ lịch sử đặt lịch.</p>
    </section>`;
  }

  function profile(c, index, mobile) {
    const state = getState(), s = customerSummary(c, state);
    return `<section class="customer-workspace customer-profile"><a class="customer-back" href="#/admin/customers">${icon('back')} Danh sách khách hàng</a>
      <header class="customer-profile-head"><div class="customer-person"><span class="customer-avatar large" aria-hidden="true">${esc(initials(c))}</span><div><span class="customer-eyebrow">HỒ SƠ KHÁCH HÀNG</span><h2>${esc(c.name || 'Chưa có tên')}</h2><p>${esc(c.phone || 'Chưa có số điện thoại')}${c.email ? ' · ' + esc(c.email) : ''}</p></div></div><button class="btn" data-action="edit-customer" data-index="${index}">${icon('edit')} Chỉnh sửa</button></header>
      <div class="customer-stats profile-stats">${kpi('Lần đặt lịch', s.count, `${s.completed} hoàn thành · ${s.cancelled} đã hủy`)}${kpi('Tiền thực nhận', money(s.net), `Đã thu ${money(s.received)} · Hoàn ${money(s.refunded)}`)}${kpi('Còn phải thu', money(s.remaining), 'Không tính các lịch đã hủy')}</div>
      <div class="customer-profile-grid"><aside class="customer-contact"><h3>Thông tin khách hàng</h3><dl><dt>Số điện thoại</dt><dd>${esc(c.phone || 'Chưa cập nhật')}</dd><dt>Email</dt><dd>${esc(c.email || 'Chưa cập nhật')}</dd><dt>Ghi chú phục vụ</dt><dd class="customer-note">${esc(c.note || 'Chưa có ghi chú cho khách hàng này.')}</dd></dl>${window.HoanAdminLocations?.customerShortcut(c) || ''}</aside>
      <div class="customer-history"><div class="customer-history-heading"><div><h3>Lịch sử đặt lịch</h3><p>Mới nhất trước · Bao gồm lịch đã hủy</p></div><span class="customer-visits">${s.count} lịch</span></div>
      ${s.count ? `<div class="customer-timeline">${s.appointments.map(a => {
        const p = customerPayment(a, state.paymentTransactions), service = state.services.find(x => x.id === a.serviceId);
        const meta = state.bookingDetails?.[a.code] || {};
        const address = [a.address, a.ward, meta.city || a.district].filter(Boolean).join(', ');
        return `<article class="customer-booking"><div class="customer-booking-top"><span>${icon('calendar')} ${date(a.date)} <b>· ${esc(a.time || '—')}</b></span><span class="customer-status ${['pending','confirmed','completed','cancelled'].includes(a.status) ? a.status : ''}">${status(a.status)}</span></div><h4>${esc(service?.name || 'Dịch vụ đã ngừng cung cấp')}</h4><div class="customer-booking-code">${esc(a.code)}</div>${address ? `<p class="customer-booking-address">${icon('pin')} ${esc(address)}</p>` : ''}${a.style ? `<p>Phong cách: ${esc(a.style)}</p>` : ''}${a.note ? `<p class="customer-note">Ghi chú: ${esc(a.note)}</p>` : ''}<div class="customer-booking-money"><span>Tổng chi phí<b>${money(a.total || 0)}</b></span><span>Đã thu<b>${money(p.received)}</b></span>${p.refunded ? `<span>Đã hoàn<b>${money(p.refunded)}</b></span>` : ''}<span>Còn phải thu<b>${a.status === 'cancelled' ? '—' : money(p.remaining)}</b></span></div><div class="customer-booking-actions">${mobile ? `<a href="#/admin/appointments/${encodeURIComponent(a.code)}">Xem lịch hẹn ${icon('arrow')}</a>` : `<button data-action="admin-view-appointment" data-code="${esc(a.code)}">Xem lịch hẹn ${icon('arrow')}</button>`}<a href="#/admin/payments?q=${encodeURIComponent(a.code)}">Lịch sử thu / hoàn</a></div></article>`;
      }).join('')}</div>` : '<div class="customer-empty"><b>Khách chưa có lịch đặt</b><p>Lịch sử sẽ được cập nhật khi khách đặt lịch.</p></div>'}</div></div></section>`;
  }

  function applyFilters() {
    const search = document.querySelector('#customer-search');
    if (!search) return;
    const normalize = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
    const q = normalize(search.value).trim(), group = document.querySelector('#customer-group')?.value;
    let count = 0;
    document.querySelectorAll('[data-customer-row]').forEach(row => {
      const n = Number(row.dataset.visits);
      const show = (!q || normalize(row.textContent).includes(q)) && (group === 'all' || group === 'returning' && n > 1 || group === 'new' && n === 1 || group === 'none' && n === 0);
      row.hidden = !show; if (show) count++;
    });
    document.querySelector('[data-customer-count]').textContent = `${count} khách hàng`;
    document.querySelector('[data-customer-empty]').hidden = count > 0;
  }
  document.addEventListener('input', event => { if (event.target.id === 'customer-search') applyFilters(); });
  document.addEventListener('change', event => { if (event.target.id === 'customer-group') applyFilters(); });
  return { content };
}
