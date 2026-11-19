import { buildOverview, overviewCsv, searchAdminSnapshot } from './overview-utils.js?v=1.0';

export async function ensureOverviewStyles() {
  const href = '/admin-overview.css?v=2.1';
  let link = document.querySelector(`link[rel="stylesheet"][href="${href}"]`);
  if (link?.sheet) return;
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => finish(link.sheet ? null : new Error('Overview stylesheet did not load')), 10000);
    const finish = error => {
      clearTimeout(timer);
      link.removeEventListener('load', loaded);
      link.removeEventListener('error', failed);
      if (error) reject(error); else resolve();
    };
    const loaded = () => finish();
    const failed = () => finish(new Error('Overview stylesheet did not load'));
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet'; link.href = href;
      link.addEventListener('load', loaded, { once: true });
      link.addEventListener('error', failed, { once: true });
      document.head.append(link);
    } else {
      link.addEventListener('load', loaded, { once: true });
      link.addEventListener('error', failed, { once: true });
      if (link.sheet) finish();
    }
  });
}

export function createAdminOverview({ getState, esc, money, icon, adminShell, refresh, render, toast, modal }) {
  let busy = false, boundRoot, searchBound = false;
  const count = value => String(value);
  const shortDay = day => day.slice(8, 10) + '/' + day.slice(5, 7);
  const timeLabel = value => new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }).format(new Date(value));

  function insights(model, ready, mobile) {
    const received=model.days.reduce((sum,day)=>sum+day.received,0),refunded=model.days.reduce((sum,day)=>sum+day.refunded,0);
    const maximum=Math.max(1,...model.days.flatMap(day=>[day.received,day.refunded]));
    const history=model.activity.slice(0,4);
    const activityLink=row=>row.id.startsWith('payment-')?'#/admin/payments?q='+encodeURIComponent(row.code):row.kind==='appointment'?'#/admin/appointments'+(mobile?'/':'?code=')+encodeURIComponent(row.code):row.kind==='request'?'#/admin/requests'+(mobile?'/'+encodeURIComponent(row.code):''):'#/admin/notifications';
    return `<div class="overview-insights">
      <section class="overview-panel overview-cash-chart"><header class="overview-panel-head"><div><h2>Dòng tiền 7 ngày</h2><p>${shortDay(model.days[0].day)} – ${shortDay(model.today)} · Theo ngày giao dịch</p></div><span class="overview-week-net"><small>Thu ròng</small><b class="numeric">${ready?money(model.weekNet):'—'}</b></span></header>
        ${!ready?'<div class="overview-insight-empty" role="status">Chưa tải được dữ liệu thu chi.</div>':received||refunded?`<div class="overview-chart-legend"><span><i class="is-received"></i>Đã thu <b>${money(received)}</b></span><span><i class="is-refunded"></i>Đã hoàn <b>${money(refunded)}</b></span></div><div class="overview-bars" role="list" aria-label="Tiền thu và hoàn theo ngày">${model.days.map(day=>`<a class="overview-bar-day" role="listitem" href="#/admin/payments?month=${day.day.slice(0,7)}" aria-label="${shortDay(day.day)}: thu ${money(day.received)}, hoàn ${money(day.refunded)}" title="${shortDay(day.day)} · Thu ${money(day.received)} · Hoàn ${money(day.refunded)}"><span class="overview-bar-pair" aria-hidden="true"><i class="is-received" style="height:${day.received/maximum*100}%"></i><i class="is-refunded" style="height:${day.refunded/maximum*100}%"></i></span><small>${shortDay(day.day)}</small></a>`).join('')}</div>`:'<div class="overview-insight-empty"><span aria-hidden="true">↗</span><b>Chưa có thu chi trong 7 ngày qua</b><small>Biểu đồ cập nhật khi có giao dịch thực tế.</small></div>'}
        <footer><a href="#/admin/payments?month=">Xem sổ giao dịch <span aria-hidden="true">→</span></a></footer>
      </section>
      <section class="overview-panel overview-activity"><header class="overview-panel-head"><div><h2>Hoạt động gần đây</h2><p>Cập nhật mới nhất từ lịch hẹn và thanh toán</p></div><span class="overview-live-mark" aria-hidden="true"></span></header>
        ${!ready?'<div class="overview-insight-empty" role="status">Chưa tải được hoạt động.</div>':history.length?`<div class="overview-events">${history.map(row=>`<a class="overview-event" href="${activityLink(row)}"><span class="overview-event-icon ${row.amount<0?'is-refund':''}" aria-hidden="true">${icon(row.id.startsWith('payment-')?'card':row.kind==='appointment'?'calendar':row.kind==='request'?'mail':'bell')}</span><span class="overview-event-copy"><b>${esc(row.title)}</b><small>${esc(row.detail)}</small><time datetime="${esc(row.time)}">${esc(timeLabel(row.time))}</time></span>${typeof row.amount==='number'?`<strong class="overview-event-amount ${row.amount<0?'is-refund':''}">${row.amount>0?'+':''}${money(row.amount)}</strong>`:'<span class="overview-chevron" aria-hidden="true">›</span>'}</a>`).join('')}</div>`:'<div class="overview-insight-empty"><span aria-hidden="true">◷</span><b>Chưa có hoạt động được ghi nhận</b><small>Cập nhật mới sẽ xuất hiện tại đây.</small></div>'}
        <footer><a href="#/admin/notifications">Xem thông báo <span aria-hidden="true">→</span></a></footer>
      </section>
    </div>`;
  }

  function content({ mobile = false } = {}) {
    const state = getState(), model = buildOverview(state), ready = state.backendReady;
    const value = (number, monetary = false) => ready ? (monetary ? money(number) : count(number)) : '—';
    const appointments = '#/admin/appointments';
    const cards = [
      ['Lịch hôm nay', value(model.todayRows.length), 'Lịch hẹn trong ngày', appointments + '?date=' + model.today],
      ['Chờ xác nhận', value(model.pending), 'Cần kiểm tra và xác nhận', appointments + '?status=pending'],
      ['Thu ròng tháng', value(model.monthNet, true), 'Tiền đã thu, trừ tiền hoàn', '#/admin/payments?month=' + model.month],
    ];
    const queues = [
      ['Đối soát tiền cọc', model.paymentPending, '#/admin/payments?status=pending'],
      ['Yêu cầu đổi lịch', model.reschedules, '#/admin/requests?status=open&type=reschedule'],
      ['Xử lý hoàn tiền', model.refunds, '#/admin/payments?status=refund'],
    ].filter(([, number]) => number > 0);
    const statuses = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', completed: 'Hoàn thành' };
    const time = state.backendUpdatedAt ? timeLabel(state.backendUpdatedAt).split(' ')[0] : '';
    const updated = busy ? 'Đang cập nhật…' : time ? 'Cập nhật lúc ' + time : 'Đang tải dữ liệu…';
    const dateLabel = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: mobile ? 'short' : 'long', day: 'numeric', month: mobile ? 'numeric' : 'long', ...(mobile ? {} : { year: 'numeric' }) }).format(new Date());
    const visibleRows = model.todayRows.slice(0, 5);
    const reportLink = mobile ? '#/admin/payments?month=' + model.month : '#/admin/reports';
    const appointmentLink = row => appointments + (mobile ? '/' + encodeURIComponent(row.code) : '?code=' + encodeURIComponent(row.code));
    return `<div id="overview-dashboard" class="overview-dashboard" data-overview-version="workspace-4" aria-busy="${busy}">
      <header class="overview-workspace-head"><div class="overview-workspace-title"><h1>Tổng quan</h1><p><span>${esc(dateLabel)}</span><span class="overview-date-separator" aria-hidden="true">·</span><span role="status">${esc(updated)}</span></p></div><div class="overview-header-actions">
        <button class="overview-refresh" data-overview="refresh" aria-label="Làm mới tổng quan" title="Làm mới" ${busy ? 'disabled' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 7a7 7 0 0 1 11.5-1L20 9M4 15l2.4 3A7 7 0 0 0 18 17"/></svg></button>
        <details class="overview-more"><summary aria-label="Tùy chọn tổng quan" title="Tùy chọn">•••</summary><div><button data-overview="export" ${!ready || busy ? 'disabled' : ''}>${icon('download')} Xuất tổng quan</button><a href="${reportLink}">${mobile ? 'Chi tiết thu chi' : 'Báo cáo chi tiết'}</a></div></details>
        ${mobile ? '<a class="overview-create" href="#/admin/appointments/new">+ Tạo lịch</a>' : `<button class="overview-create" data-action="new-appointment">${icon('plus')} Tạo lịch hẹn</button>`}
      </div></header>
      ${state.backendError ? `<div class="overview-alert" role="alert">Chưa cập nhật được dữ liệu. ${ready ? 'Đang hiển thị lần tải gần nhất.' : 'Số liệu chưa khả dụng.'} Vui lòng làm mới để thử lại.</div>` : ''}
      <section class="overview-stats" aria-label="Các chỉ số chính">${cards.map(([title, number, description, href]) => `<a class="overview-stat" href="${href}"><span>${title}</span><strong class="numeric">${number}</strong><small>${description}</small></a>`).join('')}</section>
      <div class="overview-columns">
        <section class="overview-panel overview-today"><header class="overview-panel-head"><h2>Lịch hôm nay</h2><span>${shortDay(model.today)}</span></header>
          ${!ready ? '<div class="overview-empty" role="status">Chưa tải được lịch hẹn.</div>' : visibleRows.length ? `<div class="overview-bookings">${visibleRows.map(row => `<a class="overview-booking" href="${appointmentLink(row)}"><time>${esc(row.time)}</time><span class="overview-booking-person"><b>${esc(row.customer)}</b><small>${esc((state.services || []).find(service => service.id === row.serviceId)?.name || 'Dịch vụ cũ')}</small></span><span class="overview-status ${row.status === 'pending' ? 'is-pending' : ''}">${statuses[row.status] || esc(row.status)}</span><span class="overview-chevron" aria-hidden="true">›</span></a>`).join('')}</div>` : '<div class="overview-empty"><span class="overview-empty-mark" aria-hidden="true">—</span><b>Hôm nay chưa có lịch hẹn</b><span>Lịch mới sẽ xuất hiện tại đây.</span></div>'}
          <footer><a href="${appointments}?date=${model.today}">${ready && model.todayRows.length > 5 ? 'Xem đủ ' + model.todayRows.length + ' lịch hôm nay' : 'Xem lịch hẹn'} <span aria-hidden="true">→</span></a></footer>
        </section>
        <aside class="overview-panel overview-pending"><header class="overview-panel-head"><h2>Cần xử lý</h2></header>
          ${!ready ? '<div class="overview-empty" role="status">Số liệu chưa khả dụng.</div>' : queues.length ? `<div class="overview-queues">${queues.map(([title, number, href]) => `<a class="overview-task" href="${href}"><span>${title}</span><strong class="numeric">${count(number)}</strong><span class="overview-chevron" aria-hidden="true">›</span></a>`).join('')}</div>` : '<div class="overview-empty overview-clear"><span class="overview-clear-mark" aria-hidden="true">✓</span><b>Chưa có yêu cầu cần xử lý</b><span>Đối soát, đổi lịch và hoàn tiền.</span></div>'}
          <footer><a href="#/admin/requests">Yêu cầu hỗ trợ <span aria-hidden="true">→</span></a></footer>
        </aside>
      </div>
      ${insights(model, ready, mobile)}
      <nav class="overview-bottom-links" aria-label="Xem thêm"><a href="${reportLink}">${mobile ? 'Chi tiết thu chi' : 'Báo cáo chi tiết'} <span aria-hidden="true">↗</span></a><a href="${mobile ? appointments : '#/admin/payments'}">${mobile ? 'Tất cả lịch hẹn' : 'Sổ thu chi'} <span aria-hidden="true">↗</span></a></nav>
    </div>`;
  }

  function desktop() {
    const date = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    return adminShell('overview', content(), 'Tổng quan', date);
  }

  function mount() {
    if (!searchBound) {
      searchBound = true;
      document.addEventListener('keydown', event => {
        if (event.target.id !== 'admin-global-search' || event.key !== 'Enter' || event.isComposing) return;
        event.preventDefault();
        const query = event.target.value.trim();
        if (query.length < 2) return toast('Nhập ít nhất hai ký tự để tìm kiếm.');
        if (!getState().backendReady) return toast('Chưa tải được dữ liệu. Vui lòng làm mới Tổng quan.');
        const result = searchAdminSnapshot(getState(), query);
        const link = (href, title, detail) => `<a class="overview-search-result" href="${href}" data-action="close-modal"><b>${esc(title)}</b><small>${esc(detail)}</small><span>Mở →</span></a>`;
        const groups = [
          ['Lịch hẹn', result.appointments.map(row => link('#/admin/appointments?code=' + encodeURIComponent(row.code), row.code + ' · ' + row.customer, row.date + ' · ' + row.time + ' · ' + row.phone))],
          ['Khách hàng', result.customers.map(row => link('#/admin/appointments?q=' + encodeURIComponent(row.phone || row.name), row.name, (row.phone || '') + ' · Xem lịch hẹn của khách'))],
          ['Giao dịch', result.payments.map(row => link('#/admin/payments?month=&q=' + encodeURIComponent(row.reference || row.appointmentCode), row.id + ' · ' + money(row.amount), row.appointmentCode + ' · ' + (row.reference || 'Không có mã ngân hàng')))],
        ];
        const total = result.appointments.length + result.customers.length + result.payments.length;
        modal('Kết quả tìm kiếm', `<p>${total ? 'Kết quả cho' : 'Không tìm thấy dữ liệu phù hợp với'} “${esc(query)}”.</p><div class="overview-search-results">${groups.filter(([, rows]) => rows.length).map(([title, rows]) => `<h3>${title}</h3>${rows.join('')}`).join('')}</div>`, 'Đóng', 'close-modal');
      });
    }
    const root = document.getElementById('overview-dashboard');
    if (!root || root === boundRoot) return;
    boundRoot = root;
    root.addEventListener('click', async event => {
      const button = event.target.closest('[data-overview]');
      if (!button || button.disabled) return;
      if (button.dataset.overview === 'refresh') {
        if (busy) return;
        busy = true; render();
        try {
          await refresh();
          toast(getState().backendError ? 'Chưa cập nhật được dữ liệu. Vui lòng thử lại.' : 'Đã cập nhật tổng quan.');
        } catch {
          toast('Chưa cập nhật được dữ liệu. Vui lòng thử lại.');
        } finally { busy = false; render(); }
      } else if (button.dataset.overview === 'export' && getState().backendReady) {
        const model = buildOverview(getState());
        const url = URL.createObjectURL(new Blob([overviewCsv(model)], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a'); link.href = url; link.download = 'hoan-tong-quan-' + model.today + '.csv'; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast('Đã xuất số liệu tổng quan.');
      }
    });
  }
  return { desktop, content, mount };
}
