import { cleanLocationCoordinates } from './location-utils.js?v=5.0';

const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const coordinateText = point => `${point.lat.toFixed(6)}, ${point.lon.toFixed(6)}`;
const phoneKey = value => String(value || '').replace(/\D/g, '').replace(/^84(?=\d{9}$)/, '0');

function formattedTime(value) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return '';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value));
}

export function adminLocationInfo(appointment = {}, details = {}) {
  const point = cleanLocationCoordinates(details?.locationCoordinates);
  const devicePoint = cleanLocationCoordinates(details?.locationDeviceCoordinates);
  const parts = [appointment.address, appointment.ward, details?.city].map(value => String(value || '').trim()).filter(Boolean);
  const address = parts.filter((value, index) => !parts.slice(0, index).some(previous => previous.toLocaleLowerCase('vi').includes(value.toLocaleLowerCase('vi')))).join(', ');
  return {
    point, devicePoint, address,
    coordinates: point ? coordinateText(point) : '',
    deviceCoordinates: devicePoint ? coordinateText(devicePoint) : '',
    source: point?.mode === 'pin' ? 'Khách chọn trên bản đồ' : point ? 'GPS thiết bị' : 'Khách nhập địa chỉ',
    capturedAt: formattedTime(details?.locationCapturedAt),
    confirmedAt: formattedTime(details?.locationConfirmedAt),
    mapsUrl: point ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(point.lat + ',' + point.lon)}` : '',
    directionsUrl: point ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(point.lat + ',' + point.lon)}&travelmode=driving` : '',
  };
}

export function adminLocationHtml(appointment = {}, details = {}) {
  const info = adminLocationInfo(appointment, details);
  const code = escape(appointment.code);
  const note = String(details?.locationNote || '').trim();
  if (!info.point) return `<section class="admin-location admin-location-empty" aria-label="Địa điểm khách hàng"><div class="admin-location-heading"><h3>Địa điểm phục vụ</h3><span>Địa chỉ nhập tay</span></div><p class="admin-location-address">${escape(info.address || 'Khách chưa cung cấp địa chỉ.')}</p><p class="admin-location-note">Lịch này chưa có tọa độ điểm đến khách xác nhận. Liên hệ khách để xác nhận điểm đến.</p>${info.devicePoint ? `<dl class="admin-location-facts"><div><dt>GPS thiết bị ban đầu</dt><dd><code>${info.deviceCoordinates}</code><button type="button" data-admin-copy-coordinates="${escape(info.devicePoint.lat + ', ' + info.devicePoint.lon)}" aria-label="Sao chép GPS thiết bị ban đầu">Sao chép</button><small>Chưa được dùng làm điểm đến phục vụ.</small></dd></div><div><dt>Độ chính xác GPS</dt><dd>${info.devicePoint.accuracy ? `Khoảng ±${Math.ceil(info.devicePoint.accuracy).toLocaleString('vi-VN')} m` : 'Thiết bị không cung cấp'}</dd></div>${info.capturedAt ? `<div><dt>Ghi nhận GPS</dt><dd>${escape(info.capturedAt)}</dd></div>` : ''}</dl>` : ''}${note ? `<p class="admin-location-note"><b>Chỉ dẫn:</b> ${escape(note)}</p>` : ''}</section>`;
  const accuracyPoint = info.devicePoint || (info.point.mode === 'gps' ? info.point : null);
  return `<section class="admin-location" data-admin-location-panel="${code}" aria-label="Địa điểm khách hàng">
    <div class="admin-location-heading"><h3>Điểm đến của khách</h3><span>${escape(info.source)}</span></div>
    <p class="admin-location-address">${escape(info.address || 'Tọa độ do khách cung cấp')}</p>
    <div class="admin-location-canvas" data-location-map-canvas role="region" aria-label="Bản đồ điểm đến của khách"></div>
    <p class="admin-location-map-status" data-location-pin-status role="status" aria-live="polite">Đang tải bản đồ…</p>
    <dl class="admin-location-facts">
      <div><dt>Tọa độ điểm đến</dt><dd><code>${info.coordinates}</code><button type="button" data-admin-copy-coordinates="${escape(info.point.lat + ', ' + info.point.lon)}" aria-label="Sao chép tọa độ điểm đến">Sao chép</button></dd></div>
      <div><dt>Độ chính xác GPS</dt><dd>${accuracyPoint?.accuracy ? `Khoảng ±${Math.ceil(accuracyPoint.accuracy).toLocaleString('vi-VN')} m` : 'Thiết bị không cung cấp'}${info.point.mode === 'pin' ? '<small>Điểm đến do khách chọn; độ chính xác GPS không áp dụng cho điểm ghim.</small>' : ''}</dd></div>
      ${info.devicePoint && info.point.mode === 'pin' ? `<div><dt>GPS thiết bị ban đầu</dt><dd><code>${info.deviceCoordinates}</code><button type="button" data-admin-copy-coordinates="${escape(info.devicePoint.lat + ', ' + info.devicePoint.lon)}" aria-label="Sao chép GPS thiết bị ban đầu">Sao chép</button></dd></div>` : ''}
      ${info.capturedAt ? `<div><dt>Ghi nhận GPS</dt><dd>${escape(info.capturedAt)}</dd></div>` : ''}
      ${info.confirmedAt ? `<div><dt>Khách xác nhận điểm</dt><dd>${escape(info.confirmedAt)}</dd></div>` : ''}
    </dl>
    ${note ? `<p class="admin-location-note"><b>Chỉ dẫn của khách:</b> ${escape(note)}</p>` : ''}
    <div class="admin-location-actions"><a class="btn btn-sm btn-dark" href="${info.directionsUrl}" target="_blank" rel="noopener noreferrer">Chỉ đường Google Maps ↗</a><a class="btn btn-sm" href="${info.mapsUrl}" target="_blank" rel="noopener noreferrer">Mở bản đồ ↗</a></div>
  </section>`;
}

export function adminLocationShortcutHtml(appointment = {}, details = {}) {
  const info = adminLocationInfo(appointment, details);
  return info.point ? `<button type="button" class="admin-location-table-link" data-admin-open-location="${escape(appointment.code)}" data-action="admin-location">Xem vị trí ↗</button>` : '<small class="admin-location-no-point">Chưa có tọa độ</small>';
}

export const adminLocationExportHeaders = ['Vĩ độ điểm đến', 'Kinh độ điểm đến', 'Nguồn điểm đến', 'Độ chính xác GPS (m)', 'Vĩ độ GPS gốc', 'Kinh độ GPS gốc', 'Lúc lấy GPS', 'Lúc xác nhận điểm', 'Chỉ đường'];

export function adminLocationExportColumns(appointment = {}, details = {}) {
  const { point, devicePoint, source, directionsUrl } = adminLocationInfo(appointment, details);
  return [point?.lat ?? '', point?.lon ?? '', point ? source : '', (devicePoint || point)?.accuracy ?? '', devicePoint?.lat ?? '', devicePoint?.lon ?? '', details?.locationCapturedAt || '', details?.locationConfirmedAt || '', directionsUrl];
}

export function createAdminLocations({ getState, modal, toast = () => {} }) {
  const panels = new Map();
  let disposed = false;
  let visibilityFrame = 0;
  const state = () => getState() || {};
  const detailsFor = appointment => state().bookingDetails?.[appointment.code] || {};
  const appointmentsFor = customer => (state().appointments || []).filter(appointment => phoneKey(customer.phone) && phoneKey(appointment.phone) === phoneKey(customer.phone)).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.time || '').localeCompare(String(a.time || '')));
  const nearViewport = canvas => {
    const rect=canvas.getBoundingClientRect();
    return Boolean(canvas.getClientRects().length&&rect.bottom>=-320&&rect.top<=innerHeight+320&&rect.right>=0&&rect.left<=innerWidth);
  };
  function stop(record) {
    record.controller?.abort(); record.controller=null;
    record.cleanup?.(); record.cleanup=null;
    if(record.panel.isConnected){const status=record.panel.querySelector('[data-location-pin-status]');if(status&&status.textContent!=='Bản đồ điểm đến')status.textContent='Bản đồ điểm đến';}
  }
  function forget(record) {
    stop(record); visibilityObserver?.unobserve(record.canvas); panels.delete(record.panel);
  }
  function start(record) {
    if(disposed||record.controller||!record.panel.isConnected)return;
    const appointment=(state().appointments||[]).find(item=>item.code===record.panel.dataset.adminLocationPanel);
    if(!appointment)return;
    const info=adminLocationInfo(appointment,detailsFor(appointment));
    if(!info.point)return;
    const controller=new AbortController();record.controller=controller;
    const status=record.panel.querySelector('[data-location-pin-status]');if(status)status.textContent='Đang tải bản đồ…';
    import('./location-map.js?v=8.2').then(async({mountReadonlyLocationMap})=>{
      if(controller.signal.aborted||!record.panel.isConnected)return;
      const cleanup=await mountReadonlyLocationMap(record.panel,info.point,{signal:controller.signal,devicePoint:info.devicePoint});
      if(controller.signal.aborted||!record.panel.isConnected||record.controller!==controller)cleanup();
      else record.cleanup=cleanup;
    }).catch(()=>{
      if(!controller.signal.aborted&&record.panel.isConnected&&record.controller===controller&&status)status.textContent='Chưa tải được bản đồ. Tọa độ vẫn được lưu; dùng liên kết Google Maps bên dưới.';
    });
  }
  const visibilityObserver=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
    for(const entry of entries){
      const panel=entry.target.closest('[data-admin-location-panel]'),record=panels.get(panel);
      if(!record||record.canvas!==entry.target)continue;
      if(entry.isIntersecting)start(record);else stop(record);
    }
  },{rootMargin:'320px 0px',threshold:0}):null;
  const checkVisibility=()=>{
    visibilityFrame=0;if(disposed)return;
    panels.forEach(record=>{if(nearViewport(record.canvas))start(record);else stop(record);});
  };
  const scheduleVisibility=()=>{if(!visibilityFrame)visibilityFrame=requestAnimationFrame(checkVisibility);};
  if(!visibilityObserver){window.addEventListener('scroll',scheduleVisibility,true);window.addEventListener('resize',scheduleVisibility);}
  const cancelDisconnected = () => { panels.forEach(record=>{if(!record.panel.isConnected)forget(record);}); };
  const observer = new MutationObserver(cancelDisconnected);
  observer.observe(document.body, { childList: true, subtree: true });

  function customerHtml(customer) {
    const rows = appointmentsFor(customer);
    return `<div class="admin-customer-locations"><p class="admin-location-note">Địa điểm được lưu riêng theo từng lịch hẹn của ${escape(customer.name || customer.phone || 'khách')}.</p>${rows.length ? rows.map(appointment => `<article class="admin-location-booking"><div class="admin-location-booking-heading"><b>${escape(appointment.code)}</b><span>${escape(appointment.date || '')}${appointment.time ? ' · ' + escape(appointment.time) : ''}</span></div>${adminLocationHtml(appointment, detailsFor(appointment))}</article>`).join('') : '<p>Chưa có lịch hẹn của khách này.</p>'}</div>`;
  }

  function mount(root = document) {
    if (disposed) return;
    cancelDisconnected();
    const candidates=[...(root.matches?.('[data-admin-location-panel]')?[root]:[]),...root.querySelectorAll('[data-admin-location-panel]')];
    candidates.forEach(panel => {
      if (panels.has(panel)) return;
      const appointment = (state().appointments || []).find(item => item.code === panel.dataset.adminLocationPanel);
      if (!appointment) return;
      const info = adminLocationInfo(appointment, detailsFor(appointment));
      if (!info.point) return;
      const canvas=panel.querySelector('[data-location-map-canvas]');if(!canvas)return;
      const record={panel,canvas,controller:null,cleanup:null};panels.set(panel,record);
      const status=panel.querySelector('[data-location-pin-status]');if(status)status.textContent='Bản đồ điểm đến';
      if(visibilityObserver)visibilityObserver.observe(canvas);
    });
    if(!visibilityObserver)scheduleVisibility();
  }

  async function onClick(event) {
    const copy = event.target.closest('[data-admin-copy-coordinates]');
    const open = event.target.closest('[data-admin-open-location]');
    const customerButton = event.target.closest('[data-admin-customer-locations]');
    if (!copy && !open && !customerButton) return;
    event.preventDefault(); event.stopPropagation();
    if (copy) {
      try {
        await navigator.clipboard.writeText(copy.dataset.adminCopyCoordinates);
        toast('Đã sao chép tọa độ');
      } catch { toast('Chưa sao chép được. Bạn có thể chọn và sao chép dòng tọa độ.'); }
    } else if (open) {
      const appointment = (state().appointments || []).find(item => item.code === open.dataset.adminOpenLocation);
      if (!appointment) return toast('Không tìm thấy lịch hẹn');
      modal('Địa điểm lịch hẹn ' + escape(appointment.code), adminLocationHtml(appointment, detailsFor(appointment)), 'Đóng', 'close-modal');
      mount();
    } else if (customerButton) {
      const customer = (state().customers || []).find(item => phoneKey(item.phone) === phoneKey(customerButton.dataset.adminCustomerLocations));
      if (!customer) return toast('Không tìm thấy khách hàng');
      modal('Địa điểm khách hàng', customerHtml(customer), 'Đóng', 'close-modal');
      mount();
    }
  }
  document.addEventListener('click', onClick, true);

  return {
    html: adminLocationHtml,
    shortcut: adminLocationShortcutHtml,
    customerShortcut: customer => `<button type="button" class="admin-location-table-link" data-admin-customer-locations="${escape(customer.phone)}" data-action="admin-location">Địa điểm các lịch ↗</button>`,
    customerHtml, mount,
    exportHeaders: adminLocationExportHeaders,
    exportColumns: adminLocationExportColumns,
    beforeRender(root) { panels.forEach(record=>{if(!root||root===record.panel||root.contains?.(record.panel))forget(record);}); },
    dispose() { disposed=true;observer.disconnect();visibilityObserver?.disconnect();cancelAnimationFrame(visibilityFrame);window.removeEventListener('scroll',scheduleVisibility,true);window.removeEventListener('resize',scheduleVisibility);document.removeEventListener('click',onClick,true);panels.forEach(forget); },
  };
}
