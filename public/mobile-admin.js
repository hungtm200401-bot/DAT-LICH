(() => {
  'use strict';

  const MAX_WIDTH = 700;
  const ui = { pushEnabled: false, notificationRead: false };
  const $ = (selector, root = document) => root.querySelector(selector);
  const esc = (value = '') => String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]);
  const money = value => new Intl.NumberFormat('vi-VN').format(Number(value || 0)) + 'đ';
  const iso = (date = new Date()) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const dateVi = value => {
    if (!value) return '—';
    const [y,m,d] = value.split('-');
    return `${d}/${m}/${y}`;
  };
  const longDate = (value = new Date()) => new Intl.DateTimeFormat('vi-VN', { weekday:'long', day:'numeric', month:'long', year:'numeric' }).format(new Date(value));
  const state = () => window.state || { appointments:[], customers:[], requests:[], services:[], scheduleSlots:[], settings:{} };
  const service = id => state().services?.find(item => item.id === id) || { id:id || 'personal', name:'Trang điểm cá nhân', price:0, duration:90 };
  const appointment = code => state().appointments?.find(item => item.code === code);
  const request = id => state().requests?.find(item => item.id === id);
  const statusText = status => ({ pending:'Chờ xác nhận', confirmed:'Đã xác nhận', completed:'Đã hoàn thành', cancelled:'Đã hủy' })[status] || 'Chờ xác nhận';
  const queryOf = raw => new URLSearchParams((raw.split('?')[1] || ''));
  const pathOf = raw => raw.split('?')[0];
  const go = path => { location.hash = path.startsWith('#') ? path : `#${path}`; };
  const refresh = () => window.dispatchEvent(new HashChangeEvent('hashchange'));

  const icons = {
    back:'<path d="M19 12H5m6-6-6 6 6 6"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    home:'<path d="m3 11 9-8 9 8v9H5v-9"/><path d="M9 20v-6h6v6"/>',
    calendar:'<path d="M6 2v4m12-4v4M3 9h18"/><rect x="3" y="4" width="18" height="17" rx="2"/>',
    card:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18m-14 5h4"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
    chevron:'<path d="m9 18 6-6-6-6"/>',
    phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1z"/>',
    copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    edit:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',
    pin:'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0"/><circle cx="12" cy="10" r="2.5"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    help:'<path d="M4 4h16v13H8l-4 4z"/><path d="M8 9h8m-8 4h5"/>',
    sliders:'<path d="M4 6h8m4 0h4M4 12h3m4 0h9M4 18h10m4 0h2"/><circle cx="14" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18m0-18a15 15 0 0 0 0 18"/>',
    device:'<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 21h16"/>',
    logout:'<path d="M10 17l5-5-5-5m5 5H3m11-8h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5"/>',
    wifi:'<path d="M2 8a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 20h.01M3 3l18 18"/>',
    alert:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 4h.01"/>',
    trash:'<path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6m5 4v7m4-7v7"/>',
    file:'<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h8m-8 4h8"/>',
    lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'
  };
  const icon = name => `<svg class="ma-ico" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.chevron}</svg>`;

  function top(title = '', back = '', home = false) {
    if (home) return `<header class="ma-top ma-home"><a class="ma-brand" href="#/admin">HOÀN <small>ADMIN MOBILE</small></a><a class="ma-icon-btn ma-bell" href="#/admin/notifications" aria-label="Thông báo">${icon('bell')}</a></header>`;
    return `<header class="ma-top"><a class="ma-icon-btn" href="${back || '#/admin'}" aria-label="Quay lại">${icon('back')}</a><div class="ma-top-title">${esc(title)}</div><a class="ma-icon-btn ma-bell" href="#/admin/notifications" aria-label="Thông báo">${icon('bell')}</a></header>`;
  }

  function bottom(active = 'overview') {
    const links = [
      ['overview','home','Tổng quan','/admin'],
      ['appointments','calendar','Lịch hẹn','/admin/appointments'],
      ['payments','card','Tiền cọc','/admin/payments'],
      ['schedule','calendar','Lịch làm việc','/admin/schedule'],
      ['customers','user','Khách','/admin/customers']
    ];
    return `<nav class="ma-bottom" aria-label="Điều hướng quản trị">${links.map(([key,ico,label,path]) => `<a class="${active === key ? 'active' : ''}" href="#${path}">${icon(ico)}<span>${label}</span></a>`).join('')}</nav>`;
  }

  function shell(content, options = {}) {
    return `<div class="ma-app">${top(options.title, options.back, options.home)}<main id="main" class="ma-main ${options.flush ? 'ma-flush' : ''}">${content}</main>${options.nav === false ? '' : bottom(options.active)}</div>`;
  }

  function button(label, href = '', kind = '', ico = '') {
    return href
      ? `<a class="ma-btn ${kind}" href="#${href}">${ico ? icon(ico) : ''}${label}</a>`
      : `<button class="ma-btn ${kind}">${ico ? icon(ico) : ''}${label}</button>`;
  }

  function search(placeholder, value = '') {
    return `<label class="ma-search">${icon('search')}<input name="q" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="off"></label>`;
  }

  function dashboard() {
    const s = state();
    const today = iso();
    const todayRows = (s.appointments || []).filter(a => a.date === today && a.status !== 'cancelled');
    const pending = (s.appointments || []).filter(a => a.status === 'pending').length;
    const paymentPending = (s.appointments || []).filter(a => a.paymentStatus === 'pending_verification').length;
    const deposits = (s.appointments || []).filter(a => a.paymentStatus === 'received').reduce((sum,a) => sum + Number(a.deposit || 0), 0);
    const revenue = (s.appointments || []).filter(a => a.date?.startsWith(today.slice(0,7)) && a.status !== 'cancelled').reduce((sum,a) => sum + Number(a.total || 0), 0);
    const openRequests = (s.requests || []).filter(r => ['pending','in_progress'].includes(r.status || 'pending')).length;
    return shell(`
      <div class="ma-date">${esc(longDate()).toUpperCase()}</div>
      <div class="ma-title-row"><h1>Tổng quan hôm nay</h1><a class="ma-circle-add" href="#/admin/appointments/new" aria-label="Thêm lịch hẹn">+</a></div>
      ${s.backendError ? `<div class="ma-alert">${icon('wifi')}<span>Mất kết nối dữ liệu. Một số thông tin có thể chưa được cập nhật.</span></div>` : ''}
      <section class="ma-kpis">
        <div class="ma-kpi"><span>Lịch hôm nay</span><strong>${String(todayRows.length).padStart(2,'0')}</strong><small>Dữ liệu cập nhật trực tiếp</small></div>
        <div class="ma-kpi"><span>Chờ xác nhận</span><strong>${String(pending).padStart(2,'0')}</strong><small>${pending ? 'Cần kiểm tra lịch mới' : 'Không có lịch chờ'}</small></div>
        <div class="ma-kpi"><span>Cọc đã nhận</span><strong>${money(deposits)}</strong><small>${paymentPending} giao dịch chờ đối soát</small></div>
        <div class="ma-kpi"><span>Doanh thu tháng</span><strong>${money(revenue)}</strong><small>Không gồm lịch đã hủy</small></div>
      </section>
      <div class="ma-actions one">${button('Tạo lịch hẹn','/admin/appointments/new','primary','plus')}</div>
      <div class="ma-actions">${button('Chặn giờ','/admin/schedule/block','','clock')}${button('Xem tiền cọc','/admin/payments','','card')}</div>
      <div class="ma-section-title"><b>Cần xử lý</b></div>
      <div class="ma-list">
        ${taskRow('calendar',pending,'Lịch chờ xác nhận','Cập nhật theo dữ liệu thật','/admin/appointments?status=pending')}
        ${taskRow('card',paymentPending,'Cọc chờ đối soát','Chưa ghi nhận tiền cọc','/admin/payments?status=pending')}
        ${taskRow('mail',openRequests,'Hỗ trợ mới','Yêu cầu của khách hàng','/admin/requests')}
        ${taskRow('bell',(s.notifications || []).filter(n => n.status === 'unread').length,'Thông báo chưa đọc','Sự kiện cần xử lý','/admin/notifications?tab=unread')}
      </div>
      <div class="ma-section-title"><b>Hoạt động gần đây</b><a class="ma-link" href="#/admin/audit">Xem tất cả →</a></div>
      <div class="ma-recent-empty">${icon('file')}<span>Hoạt động mới sẽ xuất hiện tại đây.</span></div>
    `,{ home:true, active:'overview' });
  }

  function taskRow(ico,count,title,sub,href) {
    return `<a class="ma-row" href="#${href}">${icon(ico)}<span class="ma-row-count">${String(count).padStart(2,'0')}</span><span class="ma-row-text"><b>${title}</b><small>${sub}</small></span>${icon('chevron')}</a>`;
  }

  function appointmentList(raw) {
    const q = queryOf(raw);
    const filter = q.get('status') || 'all';
    const keyword = (q.get('q') || '').toLocaleLowerCase('vi');
    let rows = [...(state().appointments || [])].sort((a,b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    if (filter !== 'all') rows = rows.filter(a => a.status === filter || (filter === 'today' && a.date === iso()));
    if (keyword) rows = rows.filter(a => `${a.customer} ${a.phone} ${a.code}`.toLocaleLowerCase('vi').includes(keyword));
    const labels = [['pending','Chờ xác nhận'],['confirmed','Đã xác nhận'],['today','Hôm nay'],['all','Sắp tới'],['completed','Hoàn thành'],['cancelled','Đã hủy']];
    const stateView = q.get('view');
    let list = '';
    if (stateView === 'loading') list = loadingState();
    else if (!rows.length) list = emptyAppointments(filter);
    else list = groupAppointments(rows);
    return shell(`
      <div class="ma-title-row"><h1>Lịch hẹn</h1><a class="ma-circle-add" href="#/admin/appointments/new" aria-label="Thêm lịch hẹn">+</a></div>
      <form data-ma-form="appointment-search">${search('Tên khách hoặc số điện thoại', q.get('q') || '')}</form>
      <div class="ma-tabs six">${labels.map(([key,label]) => `<a class="ma-tab ${filter === key ? 'active':''}" href="#/admin/appointments?status=${key}">${label}</a>`).join('')}</div>
      ${list}
      <div class="ma-form-footer">${button('Thêm lịch hẹn','/admin/appointments/new','primary','plus')}</div>
    `,{ home:true, active:'appointments' });
  }

  function groupAppointments(rows) {
    const grouped = Object.groupBy ? Object.groupBy(rows, a => a.date) : rows.reduce((all,a) => ((all[a.date] ||= []).push(a), all), {});
    return Object.entries(grouped).map(([date,items]) => `<section><div class="ma-section-title"><b>${esc(longDate(new Date(date + 'T12:00:00')))}</b></div>${items.map(bookingCard).join('')}</section>`).join('');
  }

  function bookingCard(a) {
    const paid = Number(a.deposit || 0) > 0;
    return `<article class="ma-booking-card">
      <div class="ma-time">${esc(a.time)}</div>
      <div class="ma-booking-info"><b>${esc(a.customer || 'Khách hàng')}</b><small>${esc(service(a.serviceId).name)}</small><small>${esc(a.phone || '—')}</small></div>
      <div class="ma-booking-meta"><span class="ma-badge ${a.status === 'confirmed' || a.status === 'completed' ? 'green':''}">${statusText(a.status)}</span><strong>${paid ? money(a.deposit) : '—'}</strong></div>
      <a href="#/admin/appointments/${encodeURIComponent(a.code)}" aria-label="Xem chi tiết">${icon('chevron')}</a>
      <div class="ma-card-actions">${button('Gọi khách',`tel:${a.phone}`,'','phone').replace('href="#tel:','href="tel:')}${button('Xem chi tiết',`/admin/appointments/${encodeURIComponent(a.code)}`,'','file')}</div>
    </article>`;
  }

  function loadingState() {
    return `<div class="ma-skeleton"><div class="ma-loading"><i class="ma-spinner"></i><b>Đang tải lịch hẹn...</b></div>${[1,2,3].map(() => `<div class="ma-skel-row"><i></i><span class="ma-skel-lines"><i></i><i></i></span><span class="ma-skel-lines"><i></i></span></div>`).join('')}</div>`;
  }

  function emptyAppointments(filter) {
    return `<div class="ma-empty">${icon('calendar')}<h2>Không có lịch ${filter === 'pending' ? 'chờ xác nhận' : 'phù hợp'}</h2><p>Lịch mới từ website sẽ xuất hiện tại đây.</p>${button('Xem tất cả lịch hẹn','/admin/appointments?status=all')}</div>`;
  }

  function appointmentDetail(code) {
    const a = appointment(code);
    if (!a) return notFound('Không tìm thấy lịch hẹn','/admin/appointments');
    const completed = a.status === 'completed';
    return shell(`
      <h1>Chi tiết lịch hẹn</h1>
      ${completed ? `<div class="ma-alert success">${icon('check')}<span>Đã đánh dấu hoàn thành</span></div>` : ''}
      <div class="ma-info-head"><div class="ma-person"><div><b>${esc(a.customer)}</b><small>${esc(a.phone)}</small></div></div><span class="ma-badge ${a.status === 'confirmed' || completed ? 'green':''}">${statusText(a.status)}</span></div>
      <div class="ma-details">
        ${detail('Dịch vụ',service(a.serviceId).name)}${detail('Ngày',dateVi(a.date))}${detail('Giờ',a.time)}${detail('Địa điểm',a.address || a.district || 'Chưa có thông tin','muted')}${detail('Tổng tiền',a.total ? money(a.total) : '—')}${detail('Đã cọc',a.deposit ? money(a.deposit) : '—')}${detail('Ghi chú',a.note || 'Chưa có thông tin','muted')}
      </div>
      <div class="ma-actions">${button('Gọi khách',`tel:${a.phone}`,'','phone').replace('href="#tel:','href="tel:')}${button('Sao chép số','','','copy').replace('<button','<button data-ma-action="copy" data-value="'+esc(a.phone)+'"')}</div>
      ${!completed && a.status !== 'cancelled' ? `<div class="ma-actions">${button('Chỉnh sửa',`/admin/appointments/${encodeURIComponent(a.code)}/edit`,'','edit')}${button('Đổi lịch',`/admin/appointments/${encodeURIComponent(a.code)}/reschedule`,'','calendar')}</div><div class="ma-actions one"><button class="ma-btn primary" data-ma-action="complete" data-code="${esc(a.code)}">Đánh dấu hoàn thành</button><button class="ma-btn ghost" data-ma-action="cancel-sheet" data-code="${esc(a.code)}">Hủy lịch</button></div>` : ''}
      ${completed ? `<div class="ma-actions">${button('Gọi khách',`tel:${a.phone}`,'','phone').replace('href="#tel:','href="tel:')}${button('Xem tiền cọc',`/admin/payments/${encodeURIComponent(a.code)}`,'','card')}</div><div class="ma-actions one">${button('Về danh sách lịch hẹn','/admin/appointments','primary')}</div>` : ''}
    `,{ title:'Lịch hẹn', back:'#/admin/appointments', active:'appointments' });
  }

  function detail(label,value,cls='') { return `<div class="ma-detail"><span>${esc(label)}</span><span class="${cls}">${esc(value)}</span></div>`; }

  function appointmentForm(code = '', mode = 'new') {
    const a = code ? appointment(code) : null;
    const editing = mode === 'edit';
    const reschedule = mode === 'reschedule';
    const title = reschedule ? 'Đổi lịch hẹn' : editing ? 'Sửa lịch hẹn' : 'Thêm lịch hẹn';
    if (code && !a) return notFound('Không tìm thấy lịch hẹn','/admin/appointments');
    if (reschedule) return rescheduleForm(a);
    const nextAvailableDay = new Date();
    nextAvailableDay.setDate(nextAvailableDay.getDate() + 1);
    const today = iso(nextAvailableDay);
    return shell(`
      <h1>${title}</h1>
      ${state().backendError && editing ? `<div class="ma-alert">${icon('wifi')}<span>Mất kết nối · Thay đổi chưa được lưu</span></div>` : ''}
      <form class="ma-form" data-ma-form="${editing ? 'edit-appointment' : 'new-appointment'}" data-code="${esc(code)}">
        <div class="ma-form-grid">
          ${field('customer','Tên khách','text',a?.customer || '',true,'Nhập tên khách')}
          ${field('phone','Số điện thoại','tel',a?.phone || '',true,'Nhập số điện thoại')}
          <label class="ma-field full"><label>Dịch vụ <i>*</i></label><select name="serviceId" required>${(state().services || []).filter(s => s.enabled !== false).map(s => `<option value="${esc(s.id)}" ${a?.serviceId === s.id ? 'selected':''}>${esc(s.name)}</option>`).join('')}</select></label>
          ${field('date','Ngày','date',a?.date || today,true)}
          ${field('time','Giờ','time',a?.time || '10:00',true)}
          ${field('address','Địa điểm','text',a?.address || '',false,'Nhập địa điểm...','full')}
          ${field('total','Tổng tiền','number',a?.total || '',false,'Nhập số tiền')}
          ${field('deposit','Tiền cọc','number',a?.deposit || '',false,'Nhập số tiền')}
          ${field('note','Ghi chú','textarea',a?.note || '',false,'Nhập ghi chú...','full')}
        </div>
        <div class="ma-note">${icon('info')}<span>Các mục có <b style="color:var(--ma-wine)">*</b> cần được điền.</span></div>
        <div class="ma-form-footer"><button class="ma-btn primary" type="submit">${editing ? 'Thử lưu lại' : 'Lưu lịch hẹn'}</button>${editing ? '<button class="ma-btn" type="button" data-ma-action="retry-edit">Tiếp tục chỉnh sửa</button>' : ''}</div>
      </form>
    `,{ title:'Lịch hẹn', back:code ? `#/admin/appointments/${encodeURIComponent(code)}` : '#/admin/appointments', nav:false });
  }

  function field(name,label,type,value,required=false,placeholder='',cls='') {
    const input = type === 'textarea'
      ? `<textarea name="${name}" placeholder="${esc(placeholder)}" ${required ? 'required':''}>${esc(value)}</textarea>`
      : `<input name="${name}" type="${type}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${required ? 'required':''}>`;
    return `<label class="ma-field ${cls}"><label>${label}${required ? ' <i>*</i>':''}</label>${input}</label>`;
  }

  function rescheduleForm(a) {
    return shell(`<h1>Đổi lịch hẹn</h1>
      <div class="ma-summary"><b>${esc(a.customer)} · ${esc(service(a.serviceId).name)}</b><span>Lịch hiện tại: ${dateVi(a.date)} · ${esc(a.time)}</span></div>
      <form class="ma-form" data-ma-form="reschedule" data-code="${esc(a.code)}">
        <div class="ma-form-grid">${field('date','Ngày mới','date','',true)}${field('time','Giờ mới','time','',true)}${field('note','Lý do đổi lịch (tùy chọn)','textarea','',false,'Nhập ghi chú...','full')}</div>
        <div class="ma-note">${icon('info')}<span>Chọn ngày để xem khung giờ còn trống.</span></div>
        <div class="ma-summary"><b>Thay đổi dự kiến</b>${detail('Ngày mới','—')}${detail('Giờ mới','—')}</div>
        <div class="ma-form-footer"><button class="ma-btn primary" type="submit">Lưu ngày giờ mới</button>${button('Giữ lịch hiện tại',`/admin/appointments/${encodeURIComponent(a.code)}`)}</div>
      </form>`,{ title:'Lịch hẹn', back:`#/admin/appointments/${encodeURIComponent(a.code)}`, nav:false });
  }

  function notifications(raw) {
    const q = queryOf(raw), tab = q.get('tab') || 'all';
    const entries = notificationEntries().filter(n => tab === 'unread' ? n.unread : true);
    return shell(`<div class="ma-title-row"><h1>Thông báo</h1><button class="ma-link ma-icon-btn" data-ma-action="read-all">Đọc tất cả</button></div>
      <div class="ma-underline-tabs"><a class="${tab === 'all' ? 'active':''}" href="#/admin/notifications?tab=all">Tất cả</a><a class="${tab === 'unread' ? 'active':''}" href="#/admin/notifications?tab=unread">Chưa đọc</a></div>
      ${search('Tìm thông báo...')}
      <div>${entries.map(notificationItem).join('') || '<div class="ma-empty"><h2>Không có thông báo</h2><p>Thông báo mới sẽ xuất hiện tại đây.</p></div>'}</div>
      <a class="ma-settings-link" href="#/admin/notification-settings">${icon('sliders')}<span>Tùy chọn thông báo</span>${icon('chevron')}</a>
    `,{ title:'', back:'#/admin', nav:false });
  }

  function notificationEntries() {
    const entries = (state().notifications || []).slice().sort((a,b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    return entries.map(notification => {
      const isPayment = notification.type === 'payment.reported';
      const isAppointment = notification.entityType === 'appointment';
      return {
        id: notification.id,
        icon: isPayment ? 'card' : isAppointment ? 'calendar' : 'help',
        title: notification.title || 'Thông báo',
        text: notification.message || '',
        action: isAppointment ? 'Mở lịch hẹn' : 'Xem yêu cầu',
        href: isAppointment ? `/admin/appointments/${notification.entityId}` : `/admin/requests`,
        unread: notification.status === 'unread',
        createdAt: notification.createdAt,
      };
    });
  }

  function notificationItem(n) {
    const eventTime = n.createdAt ? new Intl.DateTimeFormat('vi-VN', { dateStyle:'short', timeStyle:'short' }).format(new Date(n.createdAt)) : 'Không rõ thời gian';
    return `<a class="ma-notification ${n.unread ? 'unread':''}" href="#${n.href}"><span class="ma-notification-icon">${icon(n.icon)}</span><span class="ma-notification-copy"><b>${esc(n.title)}</b><p>${esc(n.text)}</p><small>${esc(eventTime)}</small><span>${n.action} →</span></span>${n.unread ? '<i class="ma-unread-dot"></i>' : icon('chevron')}</a>`;
  }

  function notificationSettings() {
    return shell(`<a class="ma-link" href="#/admin/notifications">← Thông báo</a><h1 style="margin-top:12px">Tùy chọn nhận tin</h1>
      ${!ui.pushEnabled ? `<div class="ma-alert">${icon('bell')}<span><b>Thông báo đẩy chưa bật</b><br>Bạn chưa cho phép nhận thông báo từ trình duyệt trên thiết bị này.</span></div><button class="ma-btn primary" data-ma-action="enable-push">Bật thông báo trên thiết bị</button><p style="text-align:center;color:#758093;font-size:10px">Bạn có thể thay đổi lựa chọn bất cứ lúc nào.</p>` : '<div class="ma-alert success">'+icon('check')+'<span>Thông báo đẩy đã được bật trên thiết bị này.</span></div>'}
      <div class="ma-section-title"><b>Thông báo trong app</b></div>
      ${toggleRow('calendar','Lịch hẹn mới',true)}${toggleRow('card','Báo cáo cọc',true)}${toggleRow('mail','Yêu cầu hỗ trợ',true)}
      <div class="ma-section-title"><b>Thông báo đẩy</b></div>
      <a class="ma-settings-link" href="#/admin/push">${icon('globe')}<span>Quyền trình duyệt</span><small>${ui.pushEnabled ? 'Đã cấp':'Chưa cấp'}</small>${icon('chevron')}</a>
      <div class="ma-settings-link">${icon('device')}<span>Thiết bị này</span><small>${ui.pushEnabled ? 'Đã đăng ký':'Chưa đăng ký'}</small>${icon('chevron')}</div>
      <div class="ma-note">${icon('info')}<span>Thông báo trong app vẫn xem được khi chưa bật thông báo đẩy.</span></div>
    `,{ title:'', back:'#/admin/notifications', nav:false });
  }

  function toggleRow(ico,label,on) { return `<div class="ma-toggle-row">${icon(ico)}<span>${label}</span><button class="ma-switch ${on ? 'on':''}" data-ma-action="toggle" aria-label="Bật tắt ${label}"></button></div>`; }

  function payments(raw) {
    const q = queryOf(raw), filter = q.get('status') || 'received';
    const rows = (state().appointments || []).filter(a => filter === 'pending' ? a.paymentStatus === 'pending_verification' : filter === 'unpaid' ? a.paymentStatus === 'unverified' : a.paymentStatus === 'received');
    const received = (state().appointments || []).filter(a => a.paymentStatus === 'received').reduce((sum,a) => sum + Number(a.deposit || 0),0);
    const today = iso();
    const receivedToday = (state().appointments || []).filter(a => a.paymentStatus === 'received' && String(a.updatedAt || a.createdAt || '').startsWith(today)).reduce((sum,a) => sum + Number(a.deposit || 0),0);
    const pending = (state().appointments || []).filter(a => a.paymentStatus === 'pending_verification').length;
    return shell(`<div class="ma-title-row"><h1>Tiền cọc</h1><button class="ma-circle-add" aria-label="Tìm kiếm">${icon('search')}</button></div>
      <div class="ma-deposit-summary"><div><span>Cọc đã nhận</span><strong>${money(received)}</strong><small>Tổng tiền cọc đã xác nhận</small></div><div><span>Cọc hôm nay</span><strong>${money(receivedToday)}</strong><small>Tiền cọc xác nhận trong ngày</small></div></div>
      <a class="ma-settings-link" href="#/admin/payments?status=pending"><span></span><span>Chờ đối soát</span><b class="ma-row-count">${String(pending).padStart(2,'0')}</b>${icon('chevron')}</a>
      <div class="ma-tabs"><a class="ma-tab ${filter === 'pending'?'active':''}" href="#/admin/payments?status=pending">Chờ xác nhận</a><a class="ma-tab ${filter === 'received'?'active':''}" href="#/admin/payments?status=received">Đã nhận</a><a class="ma-tab ${filter === 'unpaid'?'active':''}" href="#/admin/payments?status=unpaid">Chưa nhận</a></div>
      ${rows.length ? rows.map(paymentCard).join('') : '<div class="ma-empty"><h2>Chưa có giao dịch</h2><p>Khoản cọc phù hợp sẽ xuất hiện tại đây.</p></div>'}
    `,{ home:true, active:'payments' });
  }

  function paymentCard(a) {
    const status = a.paymentStatus === 'received' ? 'Đã nhận' : a.paymentStatus === 'pending_verification' ? 'Chờ đối soát' : 'Chưa thanh toán';
    return `<a class="ma-booking-card" href="#/admin/payments/${encodeURIComponent(a.code)}"><div class="ma-booking-info" style="grid-column:1/3"><b>${esc(a.customer)}</b><small>${esc(service(a.serviceId).name)}</small><small>${dateVi(a.date)} · ${esc(a.time)}</small></div><div class="ma-booking-meta"><strong>${a.paymentStatus === 'received' ? money(a.deposit) : money(a.total)}</strong><span class="ma-badge ${a.paymentStatus === 'received' ? 'green':''}">${status}</span></div>${icon('chevron')}</a>`;
  }

  function paymentDetail(code) {
    const a = appointment(code);
    if (!a) return notFound('Không tìm thấy khoản cọc','/admin/payments');
    const paid = a.paymentStatus === 'received';
    return shell(`<div class="ma-title-row"><h1>Chi tiết tiền cọc</h1><span class="ma-badge ${paid ? 'green':''}">${paid ? 'Đã nhận':'Chờ đối soát'}</span></div>
      ${paid ? '<div class="ma-alert success">'+icon('check')+'<span>Đã cập nhật tiền cọc</span></div>' : ''}
      <div class="ma-info-head"><div class="ma-person"><span class="ma-avatar">${icon('user')}</span><div><b>${esc(a.customer)}</b><small>${esc(a.phone)}</small></div></div></div>
      <div class="ma-details">${detail('Số tiền báo cọc',money(a.deposit || state().settings?.deposit || 200000))}${detail('Lịch hẹn',`${dateVi(a.date)} · ${a.time}`)}${detail('Dịch vụ',service(a.serviceId).name)}${detail('Khách báo cọc lúc','Thời gian gửi')}${detail('Nội dung chuyển khoản',a.code)}</div>
      <div class="ma-field"><label>Ghi chú đối soát</label><textarea readonly>Chưa có ghi chú</textarea></div>
      <div class="ma-note">${icon('info')}<span>Đối chiếu giao dịch trước khi xác nhận.</span></div>
      <div class="ma-actions">${button('Mở lịch hẹn',`/admin/appointments/${encodeURIComponent(a.code)}`,'','calendar')}${button('Gọi khách',`tel:${a.phone}`,'','phone').replace('href="#tel:','href="tel:')}</div>
      ${paid ? `<div class="ma-actions one">${button('Sửa số tiền / ghi chú',`/admin/payments/${encodeURIComponent(a.code)}/reconcile`,'','edit')}${button('Mở lịch hẹn',`/admin/appointments/${encodeURIComponent(a.code)}`,'primary','calendar')}${button('Về danh sách tiền cọc','/admin/payments','ghost','back')}</div>` : `<div class="ma-actions one">${button('Đối soát khoản cọc',`/admin/payments/${encodeURIComponent(a.code)}/reconcile`,'primary')}</div>`}
    `,{ title:'', back:'#/admin/payments', active:'payments' });
  }

  function reconcileForm(code) {
    const a = appointment(code);
    if (!a) return notFound('Không tìm thấy khoản cọc','/admin/payments');
    return shell(`<h1>Đối soát tiền cọc</h1><div class="ma-info-head"><div class="ma-person"><span class="ma-avatar">${icon('user')}</span><div><b>${esc(a.customer)}</b><small>Lịch hẹn: ${dateVi(a.date)} · ${esc(a.time)}</small></div></div></div>
      <form class="ma-form" data-ma-form="reconcile" data-code="${esc(a.code)}">${field('deposit','Số tiền thực nhận','number',a.deposit || state().settings?.deposit || 200000,true,'Nhập số tiền')}${field('note','Ghi chú đối soát','textarea','',false,'Nhập thông tin giao dịch...')}
        <label class="ma-checkbox"><input type="checkbox" name="verified" required><span>Tôi đã kiểm tra và nhận được khoản tiền này.</span></label>
        <div class="ma-note">${icon('info')}<span>Chỉ xác nhận sau khi đối chiếu giao dịch.</span></div>
        <button class="ma-btn primary" type="submit">Xác nhận đã nhận cọc</button>${button('Quay lại',`/admin/payments/${encodeURIComponent(a.code)}`)}
      </form>`,{ title:'', back:`#/admin/payments/${encodeURIComponent(a.code)}`, nav:false });
  }

  function schedule(raw) {
    const q = queryOf(raw), view = q.get('view') || 'day';
    const base = new Date();
    const dates = Array.from({length:7},(_,i) => { const d = new Date(base); d.setDate(base.getDate() - 2 + i); return d; });
    return shell(`<div class="ma-title-row"><h1>Lịch làm việc</h1><a class="ma-icon-btn" href="#/admin/schedule/week-settings">${icon('sliders')}</a></div>
      <div class="ma-segments"><a class="ma-segment ${view === 'day'?'active':''}" href="#/admin/schedule?view=day">Ngày</a><a class="ma-segment ${view === 'week'?'active':''}" href="#/admin/schedule?view=week">Tuần</a></div>
      ${view === 'week' ? weekSchedule(dates) : daySchedule(dates)}
      <div class="ma-actions">${button('Chặn thời gian','/admin/schedule/block','','clock')}${button('Thêm khung giờ','/admin/schedule/block','primary','plus')}</div>
      <a class="ma-settings-link" href="#/admin/schedule/week-settings">${icon('sliders')}<span><b>Thiết lập tuần</b><small style="display:block">09:00 – 20:00 · Nghỉ 30 phút</small></span>${icon('chevron')}</a>
    `,{ home:true, active:'schedule' });
  }

  function daySchedule(dates) {
    const current = dates[2], dayIso = iso(current);
    const dayAppts = (state().appointments || []).filter(a => a.date === dayIso && a.status === 'confirmed');
    return `<div class="ma-week-days">${dates.map((d,i) => `<button class="ma-day ${i === 2 ? 'active':''}"><b>${['CN','T2','T3','T4','T5','T6','T7'][d.getDay()]}</b>${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}</button>`).join('')}</div>
      <div class="ma-title-row" style="margin-top:14px"><h2>${esc(longDate(current))}</h2><span class="ma-badge green">Ngày làm việc</span></div>
      ${!dayAppts.length ? '<div class="ma-note">'+icon('info')+'<span>Chưa có lịch hẹn trong ngày</span></div>' : ''}
      <div class="ma-time-grid">${['09:00','10:00','11:00','12:00','13:00','14:00'].map(time => { const a=dayAppts.find(x=>x.time===time); return `<div class="ma-time-row"><span>${time}</span>${a ? `<span class="ma-time-event">${esc(a.customer)} · ${esc(service(a.serviceId).name)}</span>`:'<span></span>'}</div>`; }).join('')}</div><p style="text-align:center;color:#657083;font-size:10px">Nghỉ giữa lịch 30 phút · Di chuyển 45 phút</p>`;
  }

  function weekSchedule(dates) {
    const visible = dates.slice(2,5);
    return `<div class="ma-calendar-head"><button class="ma-btn" style="min-height:35px">Hôm nay</button><b>${dateVi(iso(dates[0]))}–${dateVi(iso(dates[6]))}</b></div><div class="ma-week-grid"><div class="ma-week-row head"><span>Giờ</span>${visible.map(d=>`<span>${['CN','T2','T3','T4','T5','T6','T7'][d.getDay()]}<br>${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}</span>`).join('')}</div>${['09:00','10:00','11:00','12:00','13:00','14:00'].map(time => `<div class="ma-week-row"><span>${time}</span>${visible.map(d => { const blocked=state().scheduleSlots?.some(x=>x.slotDate===iso(d)&&x.slotTime===time&&x.status==='blocked'); return `<span class="${blocked?'ma-week-block':''}">${blocked?'Đang chặn':''}</span>`; }).join('')}</div>`).join('')}</div><p style="text-align:center;color:#657083;font-size:10px">← Vuốt ngang để xem cả tuần →</p>`;
  }

  function weekSettings() {
    const dates = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()+i); return d; });
    return shell(`<h1>Thiết lập tuần</h1><b>${dateVi(iso(dates[0]))}–${dateVi(iso(dates[6]))}</b>
      <form class="ma-form" data-ma-form="week-settings"><div class="ma-form-grid">${field('start','Bắt đầu','time','09:00')}${field('end','Kết thúc','time','20:00')}<label class="ma-field full"><label>Nghỉ giữa lịch</label><select><option>30 phút</option><option>45 phút</option></select></label><label class="ma-field full"><label>Thời gian di chuyển</label><select><option>45 phút</option><option>60 phút</option></select></label></div>
      <div class="ma-section-title"><b>Lịch làm việc trong tuần</b></div>${dates.map(d => toggleRow('',longDate(d),true)).join('')}
      <a class="ma-settings-link" href="#/admin/schedule/block"><span></span><span>Ngày nghỉ</span>${icon('chevron')}</a>
      <button class="ma-btn primary" type="submit">Lưu thiết lập</button>${button('Sao chép sang tuần sau','/admin/schedule/copy','','copy')}</form>
    `,{ title:'', back:'#/admin/schedule', nav:false });
  }

  function blockTime(raw) {
    const q=queryOf(raw), edit=q.get('edit')==='1';
    return shell(`<h1>${edit?'Chỉnh khung giờ bận':'Chặn thời gian'}</h1><p><b>${esc(longDate())}</b></p><form class="ma-form" data-ma-form="block-time">${field('date','Ngày','date',iso(),true)}${field('time','Bắt đầu','time','14:00',true)}${field('end','Kết thúc','time','',false,'Chọn giờ')}<div class="ma-toggle-row"><span>Cả ngày</span><button type="button" class="ma-switch" data-ma-action="toggle"></button></div>${field('note','Lý do chặn','textarea','',false,'Ví dụ: lịch cá nhân, di chuyển...')}<div class="ma-note">${icon('info')}<span>Khung giờ bị chặn sẽ không nhận lịch hẹn mới.</span></div><div class="ma-summary"><b>${dateVi(iso())} · Từ 14:00</b><small>Chọn giờ kết thúc để tiếp tục.</small></div><button class="ma-btn primary" type="submit">Lưu khung giờ bận</button>${button('Quay lại','/admin/schedule')}</form>`,{ title:'', back:'#/admin/schedule', nav:false });
  }

  function copyWeek() {
    const now=new Date(), next=new Date(now); next.setDate(now.getDate()+7);
    return shell(`<h1>Sao chép thiết lập</h1><form class="ma-form" data-ma-form="copy-week"><label class="ma-field"><label>Từ tuần</label><input value="${dateVi(iso(now))}" readonly></label><div style="text-align:center;font-size:30px">↓</div><label class="ma-field"><label>Sang tuần</label><input value="${dateVi(iso(next))}" readonly></label><div class="ma-section-title"><b>Thiết lập sẽ sao chép</b></div><div class="ma-details">${detail('Giờ làm việc','09:00 – 20:00')}${detail('Nghỉ giữa lịch','30 phút')}${detail('Thời gian di chuyển','45 phút')}${detail('Ngày làm việc','Thứ 2 – Chủ nhật')}</div><div class="ma-note">${icon('info')}<span>Kiểm tra tuần đích trước khi xác nhận.</span></div><button class="ma-btn primary">Xác nhận sao chép</button>${button('Quay lại','/admin/schedule')}</form>`,{ title:'Lịch làm việc', back:'#/admin/schedule', active:'schedule' });
  }

  function customers(raw) {
    const q=queryOf(raw), tab=q.get('tab') || 'support';
    return shell(`<h1>Khách</h1><div class="ma-underline-tabs"><a class="${tab==='support'?'active':''}" href="#/admin/customers?tab=support">Yêu cầu hỗ trợ</a><a class="${tab==='leads'?'active':''}" href="#/admin/customers?tab=leads">Khách tiềm năng</a></div>${tab === 'leads' ? leads(raw) : supportRequests(raw)}`,{ home:true, active:'customers' });
  }

  function supportRequests(raw) {
    const q=queryOf(raw), status=q.get('status') || 'pending';
    const rows=(state().requests || []).filter(r => status==='all' || (status==='pending' ? r.status!=='resolved' : r.status==='resolved'));
    return `${search('Tên khách hoặc số điện thoại')}<div class="ma-segments"><a class="ma-segment ${status==='pending'?'active':''}" href="#/admin/customers?tab=support&status=pending">● &nbsp; Mới</a><a class="ma-segment ${status==='resolved'?'active':''}" href="#/admin/customers?tab=support&status=resolved">Đã xử lý</a></div>${rows.map(r => `<article class="ma-card"><div class="ma-lead-head"><b>${esc(r.name || 'Khách hàng')}</b>${icon('chevron')}</div><span class="ma-badge">Yêu cầu hỗ trợ</span><p>${esc(r.subject || r.message || 'Yêu cầu của khách hàng')}</p><small style="color:#738094">◷ ${r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN'):'Thời gian gửi'}</small><div class="ma-actions">${button(r.phone || 'Gọi khách',`tel:${r.phone}`,'','phone').replace('href="#tel:','href="tel:')}${button('Xem yêu cầu',`/admin/requests/${encodeURIComponent(r.id)}`,'primary')}</div></article>`).join('') || '<div class="ma-recent-empty" style="min-height:115px">Các yêu cầu mới sẽ xuất hiện tại đây.</div>'}`;
  }

  function leads() {
    const rows=state().customers || [];
    return `<label class="ma-field"><select><option>7 ngày gần nhất</option><option>30 ngày gần nhất</option></select></label><div class="ma-kpis"><div class="ma-kpi"><strong>${String(rows.length).padStart(2,'0')}</strong><span>Khách tiềm năng</span></div><div class="ma-kpi"><strong>${String(rows.filter(c=>/facebook/i.test(c.source||'')).length).padStart(2,'0')}</strong><span>Từ Facebook</span></div></div>${search('Tên, số điện thoại, Facebook')}<div class="ma-tabs"><a class="ma-tab active">Tất cả</a><a class="ma-tab">Facebook</a><a class="ma-tab">Có liên hệ</a></div>${rows.map((c,i)=>`<a class="ma-lead" href="#/admin/customers/${encodeURIComponent(c.id || i)}"><div class="ma-lead-head"><b>${esc(c.name || 'Khách vãng lai')}</b><span class="ma-badge blue">${esc(c.source || 'Truy cập trực tiếp')}</span></div><p>Quan tâm: ${esc(c.interest || 'Trang điểm cá nhân')}</p><p>Gần nhất: ${esc(c.updatedAt ? new Date(c.updatedAt).toLocaleString('vi-VN') : 'Chưa có thông tin')}</p></a>`).join('') || '<div class="ma-recent-empty" style="min-height:115px">Khách tiềm năng sẽ xuất hiện tại đây.</div>'}`;
  }

  function requestDetail(id) {
    const r=request(id);
    if(!r) return notFound('Không tìm thấy yêu cầu','/admin/requests');
    return shell(`<div class="ma-title-row"><h1>Chi tiết yêu cầu</h1><span class="ma-badge">${r.status==='resolved'?'Đã xử lý':'Chưa xử lý'}</span></div><div class="ma-info-head"><div class="ma-person"><span class="ma-avatar">${icon('user')}</span><div><b>${esc(r.name)}</b><small>${esc(r.phone)}</small></div></div></div><div class="ma-section-title"><b>Nội dung khách gửi</b></div><div class="ma-field"><textarea readonly>${esc(r.message || r.subject)}</textarea></div>${r.code?`<div class="ma-section-title"><b>Lịch hẹn liên quan</b></div><a class="ma-settings-link" href="#/admin/appointments/${encodeURIComponent(r.code)}">${icon('calendar')}<span>${esc(r.code)}</span><span class="ma-link">Mở lịch hẹn →</span></a>`:''}<form class="ma-form" data-ma-form="resolve-request" data-id="${esc(r.id)}">${field('reply','Ghi chú xử lý','textarea',r.reply || '',false,'Nhập kết quả trao đổi...')}<div class="ma-actions">${button('Gọi khách',`tel:${r.phone}`,'','phone').replace('href="#tel:','href="tel:')}<button type="button" class="ma-btn" data-ma-action="copy" data-value="${esc(r.phone)}">${icon('copy')}Sao chép số</button></div><button class="ma-btn primary" type="submit">Đánh dấu đã xử lý</button></form>`,{ title:'Yêu cầu hỗ trợ', back:'#/admin/customers?tab=support', nav:false });
  }

  function customerDetail(id) {
    const rows=state().customers || [];
    const c=rows.find(x=>String(x.id)===String(id)) || rows[Number(id)];
    if(!c) return notFound('Không tìm thấy khách hàng','/admin/customers?tab=leads');
    return shell(`<h1>Chi tiết khách</h1><div class="ma-info-head"><div class="ma-person"><span class="ma-avatar">${icon('user')}</span><b>${esc(c.name || 'Khách hàng')}</b></div><span class="ma-badge blue">${esc(c.source || 'Website')}</span></div><div class="ma-section-title"><b>Thông tin khách cung cấp</b></div><div class="ma-details">${detail('Điện thoại',c.phone || 'Chưa có thông tin')}${detail('Email',c.email || 'Chưa có thông tin')}${detail('Số lần đặt lịch',String(c.visits || 0))}</div><div class="ma-section-title"><b>Khách quan tâm</b></div><div class="ma-details">${detail('Dịch vụ đã xem',c.interest || 'Trang điểm cá nhân')}${detail('Truy cập gần nhất',c.updatedAt ? new Date(c.updatedAt).toLocaleString('vi-VN'):'Chưa có thông tin')}${detail('Nguồn truy cập',c.source || 'Website')}</div><div class="ma-section-title"><b>Liên hệ</b></div><div class="ma-actions">${button('Gọi khách',`tel:${c.phone}`,'','phone').replace('href="#tel:','href="tel:')}<button class="ma-btn" data-ma-action="copy" data-value="${esc(c.phone)}">${icon('copy')}Sao chép số</button></div>`,{ title:'Khách', back:'#/admin/customers?tab=leads', nav:false });
  }

  function account() {
    return shell(`<h1>Tài khoản & ứng dụng</h1><div class="ma-account"><span class="ma-account-avatar">HN</span><div><b>Hoàn Nguyễn</b><small style="display:block;color:#657083;margin-top:4px">Quản trị viên</small></div></div><div class="ma-summary" style="margin-top:12px">Vận hành studio</div>${settingsLink('sliders','Quản lý dịch vụ & giá niêm yết','/admin/services')}${settingsLink('card','Cài đặt tài khoản nhận cọc','/admin/settings')}${settingsLink('bell','Trung tâm thông báo','/admin/notifications')}${settingsLink('sliders','Tùy chọn nhận thông báo','/admin/notification-settings')}${settingsLink('device','Cài HOÀN Admin Mobile','/admin/install')}<div class="ma-summary" style="margin-top:12px">Thiết bị này</div>${settingsLink('download','Cài ứng dụng','/admin/install','Chưa kiểm tra')}${settingsLink('bell','Thông báo đẩy','/admin/push',ui.pushEnabled?'Đã bật':'Chưa bật')}<button class="ma-btn" style="width:100%;margin-top:16px" data-ma-action="logout">${icon('logout')}Đăng xuất</button><p style="text-align:center;color:#657083;font-size:11px">HOÀN · Quản trị vận hành</p>`,{ title:'', back:'#/admin', active:'customers' });
  }

  function mobileServices() {
    const list = state().services || [];
    return shell(`
      <div class="ma-title-row">
        <h1>Quản lý dịch vụ</h1>
      </div>
      <p style="margin:-2px 0 14px;color:#657083;font-size:12px">Bật/tắt dịch vụ hiển thị cho khách và giá niêm yết</p>
      <div class="ma-service-list">
        ${list.map((s) => `
          <div class="ma-card" style="padding:14px;margin-bottom:12px;border:1px solid var(--ma-line);border-radius:8px;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.03)">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
              <div style="flex:1">
                <b style="font-size:15px;color:#111;display:block">${esc(s.name)}</b>
                <div style="margin-top:4px;font-size:12px;color:#657083;line-height:1.4">${esc(s.description || '')}</div>
              </div>
              <button class="ma-switch ${s.enabled !== false ? 'on' : ''}" data-ma-action="toggle-service" data-id="${esc(s.id)}" aria-label="Bật tắt ${esc(s.name)}"></button>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:10px;border-top:1px dashed var(--ma-line);font-size:13px">
              <span style="color:#657083">Thời lượng: <b style="color:#111">${s.duration || 60} phút</b></span>
              <span style="color:var(--ma-wine);font-weight:600">${s.contact ? 'Giá liên hệ' : money(s.price)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `, { title: 'Dịch vụ', back: '#/admin/account', active: 'customers' });
  }

  function mobileSettings() {
    const s = state().settings || {};
    const b = state().brand || {};
    return shell(`
      <h1>Cài đặt vận hành</h1>
      <p style="margin:-2px 0 14px;color:#657083;font-size:12px">Tài khoản nhận cọc, hotline và nhận lịch</p>
      <form class="ma-form" data-ma-form="save-mobile-settings">
        <div class="ma-summary" style="margin-bottom:12px"><b>Tài khoản nhận tiền cọc</b></div>
        <div class="ma-form-grid">
          ${field('bankName','Ngân hàng','text',s.bankName || 'MB Bank (Ngân hàng Quân Đội)',true,'Tên ngân hàng')}
          ${field('bankAccount','Số tài khoản','text',s.bankAccount || '0901234567',true,'Số tài khoản nhận cọc')}
          ${field('bankOwner','Chủ tài khoản','text',s.bankOwner || 'NGUYEN HOAN',true,'Tên chủ tài khoản')}
        </div>

        <div class="ma-summary" style="margin:16px 0 12px"><b>Chính sách cọc & Hotline</b></div>
        <div class="ma-form-grid">
          ${field('deposit','Mức cọc tối thiểu (VNĐ)','number',s.deposit || '200000',true,'Số tiền cọc')}
          ${field('travelFee','Phí di chuyển / km (VNĐ)','number',s.travelFee || '50000',false,'Phí di chuyển')}
          ${field('bookingWindow','Số ngày nhận lịch trước','number',s.bookingWindow || '60',true,'Số ngày')}
          ${field('phone','Hotline / Zalo tư vấn','tel',b.phone || s.phone || '0988123456',true,'Số điện thoại tư vấn')}
        </div>

        <div class="ma-form-footer" style="margin-top:20px">
          <button class="ma-btn primary" type="submit">Lưu cài đặt</button>
        </div>
      </form>
    `, { title: 'Cài đặt', back: '#/admin/account', active: 'customers' });
  }

  function settingsLink(ico,label,href,status='') { return `<a class="ma-settings-link" href="${href.startsWith('#') ? href : '#'+href}">${icon(ico)}<span>${label}</span>${status?`<small>${status}</small>`:'<span></span>'}${icon('chevron')}</a>`; }

  function installPage() {
    return shell(`<h1>Cài ứng dụng</h1><div class="ma-install-logo"><span class="ma-appmark">H</span><div><h2>HOÀN Admin Mobile</h2><p style="margin:4px 0;color:#657083">Truy cập nhanh từ màn hình chính</p></div></div>${settingsLink('download','Mở app nhanh','#')}${settingsLink('device','Giao diện cho điện thoại','#')}${settingsLink('bell','Nhận thông báo khi cho phép','/admin/push')}<button class="ma-btn primary" style="width:100%;margin:12px 0" data-ma-action="install">Cài ứng dụng</button><div class="ma-summary"><b>Nếu không thấy nút cài đặt</b><div class="ma-segments"><span class="ma-segment">Android</span><span class="ma-segment active">iPhone</span></div><div class="ma-details">${detail('1','Mở trong Safari')}${detail('2','Chạm Chia sẻ')}${detail('3','Chọn Thêm vào Màn hình chính')}</div></div><div class="ma-note">${icon('info')}<span>Tùy chọn cài đặt phụ thuộc trình duyệt.</span></div>`,{ title:'', back:'#/admin/account', nav:false });
  }

  function pushPage() {
    return shell(`<h1>Nhận thông báo</h1><div class="ma-empty" style="min-height:180px">${icon('bell')}<h2>Bạn muốn nhận thông báo trên điện thoại?</h2><p>Nhận thông báo về các hoạt động quan trọng ngay cả khi không mở app.</p></div><div class="ma-card">${settingsLink('calendar','Lịch hẹn mới','#')}${settingsLink('card','Báo cáo tiền cọc','#')}${settingsLink('help','Yêu cầu hỗ trợ','#')}${settingsLink('user','Khách tiềm năng mới','#')}</div><div class="ma-summary" style="margin-top:12px">Trạng thái: &nbsp; <b style="display:inline;color:var(--ma-wine)">${ui.pushEnabled?'Đã bật':'● Chưa bật'}</b></div><p style="font-size:11px;color:#657083">Sau khi tiếp tục, hãy chọn Cho phép trong yêu cầu của trình duyệt.</p><button class="ma-btn primary" style="width:100%" data-ma-action="enable-push">Tiếp tục bật thông báo</button>${button('Để sau','/admin/account')}<div class="ma-note">${icon('info')}<span>Bạn vẫn xem được thông báo trong app.</span></div>`,{ title:'', back:'#/admin/account', nav:false });
  }

  function loginPage() {
    return `<div class="ma-login"><div class="ma-login-top"><span class="ma-brand">HOÀN</span></div><div class="ma-login-body"><div class="ma-alert">${icon('alert')}<span><b>Phiên đăng nhập đã hết hạn.</b><br>Vui lòng đăng nhập lại.</span></div><div class="ma-login-title"><h1>Đăng nhập quản trị</h1><p>HOÀN Admin Mobile</p></div><form class="ma-form" data-ma-form="login">${field('username','Tài khoản','text','',true,'Nhập tài khoản quản trị')}${field('password','Mật khẩu','password','',true,'Nhập mật khẩu')}<button class="ma-btn primary" type="submit">Đăng nhập</button></form><p style="text-align:center;color:#657083;margin-top:30px">${icon('lock')} &nbsp; Dành cho quản trị viên HOÀN</p></div></div>`;
  }

  function utilityPage(path) {
    const names={ promotions:'Mã ưu đãi', gallery:'Bộ sưu tập', content:'Nội dung website', reports:'Báo cáo', audit:'Nhật ký hoạt động', permissions:'Phân quyền', visitors:'Khách truy cập website' };
    const key=path.split('/')[2], title=names[key] || 'Tài khoản & ứng dụng';
    return shell(`<h1>${title}</h1><div class="ma-note">${icon('info')}<span>Mục này sử dụng bố cục quản trị rút gọn trên điện thoại. Bạn có thể tiếp tục thao tác ở bản desktop khi cần dữ liệu dạng bảng.</span></div>${settingsLink('bell','Trung tâm thông báo','/admin/notifications')}${settingsLink('calendar','Lịch hẹn','/admin/appointments')}${settingsLink('card','Tiền cọc','/admin/payments')}${settingsLink('sliders','Lịch làm việc','/admin/schedule')}${settingsLink('user','Tài khoản & ứng dụng','/admin/account')}`,{ title:'', back:'#/admin', active:'overview' });
  }

  function notFound(title,back) { return shell(`<div class="ma-empty">${icon('info')}<h2>${title}</h2>${button('Quay lại',back,'primary')}</div>`,{ title:'', back:`#${back}`, nav:false }); }

  function render(raw) {
    const path=pathOf(raw), parts=path.split('/').filter(Boolean);
    if(path==='/admin/login') return loginPage();
    if(path==='/admin' || path==='/admin/') return dashboard();
    if(path==='/admin/services') return mobileServices();
    if(path==='/admin/settings') return mobileSettings();
    if(path==='/admin/notifications') return notifications(raw);
    if(path==='/admin/notification-settings') return notificationSettings();
    if(path==='/admin/push') return pushPage();
    if(path==='/admin/install') return installPage();
    if(path==='/admin/account') return account();
    if(path==='/admin/appointments') return appointmentList(raw);
    if(path==='/admin/appointments/new') return appointmentForm();
    if(parts[1]==='appointments' && parts[2]) {
      const code=decodeURIComponent(parts[2]);
      if(parts[3]==='edit') return appointmentForm(code,'edit');
      if(parts[3]==='reschedule') return appointmentForm(code,'reschedule');
      return appointmentDetail(code);
    }
    if(path==='/admin/payments') return payments(raw);
    if(parts[1]==='payments' && parts[2]) return parts[3]==='reconcile' ? reconcileForm(decodeURIComponent(parts[2])) : paymentDetail(decodeURIComponent(parts[2]));
    if(path==='/admin/schedule') return schedule(raw);
    if(path==='/admin/schedule/week-settings') return weekSettings();
    if(path==='/admin/schedule/block') return blockTime(raw);
    if(path==='/admin/schedule/copy') return copyWeek();
    if(path==='/admin/customers' || path==='/admin/requests') return customers(path==='/admin/requests' ? '/admin/customers?tab=support' : raw);
    if(parts[1]==='requests' && parts[2]) return requestDetail(decodeURIComponent(parts[2]));
    if(parts[1]==='customers' && parts[2]) return customerDetail(decodeURIComponent(parts[2]));
    return utilityPage(path);
  }

  async function api(payload) {
    const token = localStorage.getItem('hoanAdminToken') || sessionStorage.getItem('hoanAdminToken') || '';
    const response = await fetch('/api/data',{ method:'POST', headers:{ 'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`}:{}) }, body:JSON.stringify(payload) });
    const data=await response.json();
    if(!response.ok) throw new Error(data.error || 'Không thể kết nối dữ liệu');
    return data;
  }

  function toast(message) {
    $('.ma-toast')?.remove();
    const el=document.createElement('div'); el.className='ma-toast'; el.textContent=message; document.body.append(el);
    setTimeout(()=>el.remove(),2600);
  }

  function cancelSheet(code) {
    const a=appointment(code); if(!a) return;
    const root=$('#modal-root');
    root.innerHTML=`<div class="ma-modal-backdrop"><section class="ma-sheet"><div class="ma-grab"></div><div class="ma-sheet-title"><span class="ma-danger-icon">${icon('alert')}</span><h2>Hủy lịch hẹn này?</h2><button class="ma-icon-btn" data-ma-action="close-sheet">${icon('close')}</button></div><div class="ma-summary" style="margin:14px 0"><b>${esc(a.customer)} · ${esc(service(a.serviceId).name)}</b><span>${dateVi(a.date)} · ${esc(a.time)}</span></div><p style="font-size:11px">Vui lòng kiểm tra lịch hẹn và khoản cọc trước khi xác nhận.</p><label class="ma-field"><label>Lý do hủy</label><textarea id="ma-cancel-reason" placeholder="Nhập lý do..."></textarea></label><div class="ma-actions"><button class="ma-btn" data-ma-action="close-sheet">Giữ lịch hẹn</button><button class="ma-btn primary" data-ma-action="confirm-cancel" data-code="${esc(code)}">Xác nhận hủy</button></div></section></div>`;
  }

  document.addEventListener('click', async event => {
    const el=event.target.closest('[data-ma-action]'); if(!el) return;
    const action=el.dataset.maAction; event.preventDefault();
    try {
      if(action==='toggle'){ el.classList.toggle('on'); return; }
      if(action==='toggle-service'){
        const s=(state().services || []).find(item => item.id === el.dataset.id);
        if(s){
          s.enabled = s.enabled === false;
          el.classList.toggle('on', s.enabled);
          await api({action:'saveService',...s});
          toast(s.enabled ? 'Đã bật hiển thị dịch vụ' : 'Đã tạm ẩn dịch vụ');
        }
        return;
      }
      if(action==='copy'){ await navigator.clipboard.writeText(el.dataset.value || ''); toast('Đã sao chép'); return; }
      if(action==='read-all'){
        await api({action:'markNotificationsRead'});
        (state().notifications || []).forEach(notification => { notification.status = 'read'; });
        ui.notificationRead=true; refresh(); toast('Đã đánh dấu các thông báo là đã đọc'); return;
      }
      if(action==='cancel-sheet'){ cancelSheet(el.dataset.code); return; }
      if(action==='close-sheet'){ $('#modal-root').innerHTML=''; return; }
      if(action==='confirm-cancel'){
        const result=await api({action:'updateAppointment',code:el.dataset.code,status:'cancelled',note:$('#ma-cancel-reason')?.value || ''});
        Object.assign(appointment(el.dataset.code),result.appointment); $('#modal-root').innerHTML=''; toast('Đã hủy lịch hẹn'); refresh(); return;
      }
      if(action==='complete'){
        const result=await api({action:'updateAppointment',code:el.dataset.code,status:'completed'}); Object.assign(appointment(el.dataset.code),result.appointment); toast('Đã đánh dấu hoàn thành'); refresh(); return;
      }
      if(action==='enable-push'){
        if('Notification' in window){ const result=await Notification.requestPermission(); ui.pushEnabled=result==='granted'; }
        else ui.pushEnabled=true;
        toast(ui.pushEnabled?'Đã bật thông báo':'Trình duyệt chưa cấp quyền thông báo'); refresh(); return;
      }
      if(action==='install'){
        if(window.__hoanInstallPrompt){ window.__hoanInstallPrompt.prompt(); await window.__hoanInstallPrompt.userChoice; }
        else toast('Trên iPhone: Chia sẻ → Thêm vào Màn hình chính');
        return;
      }
      if(action==='logout'){ localStorage.removeItem('hoanAdminToken'); sessionStorage.removeItem('hoanAdminToken'); go('/admin/login'); }
    } catch(error) { toast(error.message || 'Không thể hoàn tất thao tác'); }
  });

  document.addEventListener('submit', async event => {
    const form=event.target.closest('[data-ma-form]'); if(!form) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const kind=form.dataset.maForm, data=Object.fromEntries(new FormData(form));
    const submit=form.querySelector('[type="submit"]'); if(submit) submit.disabled=true;
    try {
      if(kind==='appointment-search'){ go(`/admin/appointments?status=all&q=${encodeURIComponent(data.q || '')}`); return; }
      if(kind==='new-appointment'){
        const result=await api({action:'createAppointment',...data}); state().appointments.unshift(result.appointment); toast('Đã tạo lịch hẹn'); go(`/admin/appointments/${result.appointment.code}`); return;
      }
      if(kind==='edit-appointment'){
        const payload={action:'updateAppointment',code:form.dataset.code,...data,total:Number(data.total || 0),deposit:Number(data.deposit || 0)};
        const result=await api(payload); Object.assign(appointment(form.dataset.code),result.appointment); toast('Đã lưu thay đổi'); go(`/admin/appointments/${form.dataset.code}`); return;
      }
      if(kind==='reschedule'){
        const result=await api({action:'updateAppointment',code:form.dataset.code,date:data.date,time:data.time,note:data.note}); Object.assign(appointment(form.dataset.code),result.appointment); toast('Đã đổi lịch hẹn'); go(`/admin/appointments/${form.dataset.code}`); return;
      }
      if(kind==='reconcile'){
        const result=await api({action:'updateAppointment',code:form.dataset.code,deposit:Number(data.deposit),paymentStatus:'received',status:'confirmed',note:data.note}); Object.assign(appointment(form.dataset.code),result.appointment); toast('Đã xác nhận khoản cọc'); go(`/admin/payments/${form.dataset.code}`); return;
      }
      if(kind==='resolve-request'){
        const result=await api({action:'resolveRequest',id:form.dataset.id,status:'resolved',reply:data.reply}); Object.assign(request(form.dataset.id),result.request); toast('Đã đánh dấu xử lý'); refresh(); return;
      }
      if(kind==='block-time'){
        await api({action:'setScheduleSlot',date:data.date,time:data.time,status:'blocked',note:data.note}); state().scheduleSlots.push({slotDate:data.date,slotTime:data.time,status:'blocked',note:data.note}); toast('Đã chặn khung giờ'); go('/admin/schedule'); return;
      }
      if(kind==='week-settings' || kind==='copy-week'){ toast(kind==='copy-week'?'Đã sao chép thiết lập tuần':'Đã lưu thiết lập tuần'); go('/admin/schedule'); return; }
      if(kind==='save-mobile-settings'){
        const curSettings = state().settings || {};
        const newSettings = {
          ...curSettings,
          bankName: data.bankName,
          bankAccount: data.bankAccount,
          bankOwner: data.bankOwner,
          deposit: String(data.deposit || '200000'),
          travelFee: String(data.travelFee || '50000'),
          bookingWindow: String(data.bookingWindow || '60'),
          phone: data.phone,
        };
        state().settings = newSettings;
        if(state().brand) state().brand.phone = data.phone;
        await api({ action: 'saveContent', key: 'settings', value: newSettings });
        toast('Đã lưu cài đặt thành công');
        go('/admin/account');
        return;
      }
      if(kind==='login'){ sessionStorage.setItem('hoanAdminToken',data.password || 'mobile-session'); toast('Đăng nhập thành công'); go('/admin'); return; }
    } catch(error) { toast(error.message || 'Không thể lưu thay đổi'); }
    finally { if(submit) submit.disabled=false; }
  },true);

  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); window.__hoanInstallPrompt=event; });
  const isForcedMobile = () => {
    try {
      const q = new URLSearchParams(location.search || location.hash.split('?')[1] || '');
      if (q.get('mobile') === '1' || q.get('view') === 'mobile') return true;
      if (window.parent && window.parent !== window) return true;
    } catch {}
    return false;
  };
  if (isForcedMobile()) {
    document.documentElement.classList.add('force-mobile');
    document.body?.classList.add('force-mobile');
  }
  let mobile = isForcedMobile() || matchMedia(`(max-width:${MAX_WIDTH}px)`).matches;
  window.addEventListener('resize',() => { const next=isForcedMobile() || matchMedia(`(max-width:${MAX_WIDTH}px)`).matches; if(next!==mobile){ mobile=next; refresh(); } });

  window.HoanMobileAdmin = { matches:() => isForcedMobile() || matchMedia(`(max-width:${MAX_WIDTH}px)`).matches, render, refresh };
})();
