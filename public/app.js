(() => {
  'use strict';

  if (typeof window !== 'undefined') {
    if (window.__hoanAppStarted) return;
    window.__hoanAppStarted = true;
    // A development script update must not attach a second set of document
    // handlers to an already running legacy app. The version loader refreshes it.
    const existing = typeof document.getElementById === 'function' && document.getElementById('app');
    if (window.state && existing?.childElementCount) { window.__hoanAppBuild = 'legacy'; return; }
    window.__hoanAppBuild = 'location-auto-fill-1';
  }

  // Guaranteed critical schedule styles injection (bulletproof against browser CSS caching)
  if (typeof document !== 'undefined' && typeof document.getElementById === 'function' && document.head) {
    let sEl = document.getElementById('schv2-critical-styles');
    if (!sEl) {
      sEl = document.createElement('style');
      sEl.id = 'schv2-critical-styles';
      document.head.appendChild(sEl);
    }
    sEl.textContent = `
      .schv2-calendar { overflow-y: auto !important; max-height: 860px !important; box-sizing: border-box !important; }
      .schv2-header-row { position: sticky !important; top: 0 !important; z-index: 30 !important; display: grid !important; grid-template-columns: 66px repeat(7, 1fr) !important; grid-template-rows: 62px !important; height: 62px !important; min-height: 62px !important; max-height: 62px !important; overflow: hidden !important; border-bottom: 1px solid #e5e7eb !important; background: #fafafa !important; box-sizing: border-box !important; }
      .schv2-grid-body { position: relative !important; display: grid !important; grid-template-columns: 66px repeat(7, 1fr) !important; overflow: visible !important; max-height: none !important; box-sizing: border-box !important; }
      .schv2-day-header { height: 62px !important; box-sizing: border-box !important; padding: 6px 2px !important; }
      .schv2-hour-col-head { height: 62px !important; box-sizing: border-box !important; }
      .schv2-wed-header { background: #fafafa !important; }
      .schv2-wed-col { background: #ffffff !important; }
    `;
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const money = (value) => new Intl.NumberFormat('vi-VN').format(value) + 'đ';
  const route = (path) => { location.hash = path.startsWith('#') ? path : '#' + path; };
  const img = (name, alt = '') => `<img src="./assets/${name}" alt="${alt}" loading="eager">`;
  const icon = (name, label = '') => {
    const paths = {
      grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
      calendar: '<path d="M6 2v4M18 2v4M3 9h18"/><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 13h3v3H8zM14 13h3v3h-3z"/>',
      clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      tag: '<path d="M20 13 13 20a2 2 0 0 1-3 0l-6-6a2 2 0 0 1 0-3l7-7h7a2 2 0 0 1 2 2z"/><circle cx="15.5" cy="8.5" r="1"/>',
      user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
      card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
      ticket: '<path d="M3 9a3 3 0 0 0 0 6v3h18v-3a3 3 0 0 0 0-6V6H3z"/><path d="M13 6v2M13 11v2M13 16v2"/>',
      image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
      content: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
      bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
      report: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
      shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/>',
      log: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r=".5"/><circle cx="3.5" cy="12" r=".5"/><circle cx="3.5" cy="18" r=".5"/>',
      settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/>',
      arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
      back: '<path d="M19 12H5M10 7l-5 5 5 5"/>',
      chevron: '<path d="m9 18 6-6-6-6"/>',
      pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0"/><circle cx="12" cy="10" r="2.5"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1z"/>',
      mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
      download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
      edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',
      trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 10v7M14 10v7"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      more: '<circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/>',
      menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
      eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12"/><circle cx="12" cy="12" r="3"/>',
      print: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7"/>',
      trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
      star: '<path d="m12 2 3 6 6 .9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 8.9 9 8z"/>',
      lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
      upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
      close: '<path d="m6 6 12 12M6 18 18 6"/>'
    };
    const title = label ? `<title>${label}</title>` : '';
    return `<svg class="ui-icon ui-icon-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${title}${paths[name] || paths.more}</svg>`;
  };

  const localIso = (date = new Date()) => {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const hourlyTimes = (start = '00:00', end = '24:00') => {
    const toMinutes = value => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
    const first = Math.max(0, toMinutes(start));
    const last = Math.min(24 * 60, toMinutes(end));
    return Array.from({ length: Math.max(0, Math.ceil((last - first) / 60)) }, (_, index) => {
      const minutes = first + index * 60;
      return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    });
  };

  const defaultBookingTime = (dateIso = localIso()) => {
    const today = localIso();
    const defaultTimes = hourlyTimes();
    if (dateIso > today) return '09:30';
    const now = new Date();
    const curMinutes = now.getHours() * 60 + now.getMinutes();
    const nextSlot = defaultTimes.find(t => {
      const [h, m] = t.split(':').map(Number);
      return (h * 60 + m) > curMinutes + 15;
    });
    return nextSlot || defaultTimes.at(-1);
  };

  const defaultState = {
    brand: {
      name: 'HOÀN',
      role: 'MAKEUP ARTIST',
      headline: 'Vẻ đẹp không cần giống một ai.',
      description: 'Mỗi diện mạo được thiết kế theo đường nét, phong cách và khoảnh khắc của riêng bạn.',
      imageMessage: 'Mỗi diện mạo là một thiết kế dành riêng cho bạn.',
      phone: '',
      email: '',
      area: 'Hà Nội',
      accent: '#7A1832'
    },
    services: [
      { id: 'personal', name: 'Trang điểm cá nhân', duration: 60, price: 450000, description: 'Tươi sáng, tự nhiên và phù hợp với phong cách hằng ngày.', enabled: true },
      { id: 'party', name: 'Trang điểm dự tiệc', duration: 90, price: 650000, description: 'Sắc nét vừa đủ, bền đẹp dưới nhiều điều kiện ánh sáng.', enabled: true },
      { id: 'photo', name: 'Trang điểm chụp ảnh', duration: 120, price: 850000, description: 'Tối ưu lớp nền, đường nét và màu sắc trước ống kính.', enabled: true },
      { id: 'bridal', name: 'Trang điểm cô dâu', duration: 150, price: 0, description: 'Thiết kế diện mạo, thử phong cách và đồng hành trong ngày cưới.', enabled: true, contact: true }
    ],
    booking: {
      serviceId: 'party',
      date: localIso(),
      time: defaultBookingTime(),
      locationType: 'client',
      address: '',
      city: '',
      district: '',
      ward: '',
      detectedAddress: '',
      locationError: '',
      isDetectingLocation: false,
      travelFee: 50000,
      name: '',
      phone: '',
      email: '',
      style: 'Tự nhiên · Trong trẻo',
      skin: 'Da thường',
      allergy: 'Không',
      note: '',
      deposit: 200000,
      payment: 'bank'
    },
    appointments: [],
    customers: [],
    scheduleSlots: [],
    promotions: [],
    notifications: [],
    audit: [],
    settings: { autoConfirm: false, zaloReminder: true, emailReminder: true, bookingWindow: '60', deposit: '200000', timezone: 'GMT+7', scheduleOpen: true },
    adminWeekOffset: 0,
    portfolio: [
      { id: 'port-bridal-1', serviceId: 'bridal', title: 'Cô dâu thanh lịch lễ gia tiên', tag: 'Cô dâu', image: 'bridal-new.png', note: 'Tone hồng đào trong trẻo, nền mướt mịn' },
      { id: 'port-bridal-2', serviceId: 'bridal', title: 'Cô dâu đãi tiệc lộng lẫy', tag: 'Cô dâu', image: 'bridal-user.png', note: 'Layout mắt nhũ sáng, tóc búi sang trọng' },
      { id: 'port-bridal-3', serviceId: 'bridal', title: 'Cận cảnh đường nét & tóc cưới', tag: 'Cô dâu', image: 'bridal.png', note: 'Lớp nền tự nhiên bắt sáng nhẹ' },
      { id: 'port-bridal-4', serviceId: 'bridal', title: 'Chi tiết ánh nhìn ngày trọng đại', tag: 'Cô dâu', image: 'about-eye.png', note: 'Eyeliner mảnh và mi tơ tự nhiên' },
      { id: 'port-party-1', serviceId: 'party', title: 'Đỏ rượu trên nền lụa đen', tag: 'Dự tiệc', image: 'hero.png', note: 'Tone đỏ cổ điển quý phái' },
      { id: 'port-party-2', serviceId: 'party', title: 'Sắc sảo tiệc đêm Gala', tag: 'Dự tiệc', image: 'evening.png', note: 'Mắt khói nhẹ bắt sáng cuốn hút' },
      { id: 'port-party-3', serviceId: 'party', title: 'Tone nâu Tây sang trọng', tag: 'Dự tiệc', image: 'campaign.png', note: 'Sâu lắng, tôn đường nét góc cạnh gương mặt' },
      { id: 'port-personal-1', serviceId: 'personal', title: 'Trong trẻo tự nhiên hằng ngày', tag: 'Tự nhiên', image: 'natural.png', note: 'Lớp nền mỏng nhẹ như sương, tôn nét tự nhiên' },
      { id: 'port-personal-2', serviceId: 'personal', title: 'Tone cam đào tươi sáng', tag: 'Tự nhiên', image: 'campaign.png', note: 'Trẻ trung, rạng rỡ cho dạo phố & công việc' },
      { id: 'port-personal-3', serviceId: 'personal', title: 'Chi tiết đường nét & hàng mi', tag: 'Tự nhiên', image: 'about-eye.png', note: 'Mắt kẻ mảnh tự nhiên, chuốt mi tơ tơi đều' },
      { id: 'port-photo-1', serviceId: 'photo', title: 'Ánh nâu trước ống kính Studio', tag: 'Chụp ảnh', image: 'campaign.png', note: 'Tối ưu khối mặt và ánh nhìn' },
      { id: 'port-photo-2', serviceId: 'photo', title: 'Đường nét nghệ thuật trước ống kính', tag: 'Chụp ảnh', image: 'about-process.png', note: 'Kiểm soát bóng dầu và góc sáng' }
    ],
    backendReady: false,
    backendError: ''
  };

  const loadState = ({ freshDocument = false } = {}) => {
    const today = localIso();
    try {
      const saved = JSON.parse(localStorage.getItem('hoanMakeupDraft'));
      if (!saved) {
        const s = structuredClone(defaultState);
        s.booking.date = today;
        s.booking.time = defaultBookingTime(today);
        return s;
      }
      const loaded = {
        ...structuredClone(defaultState),
        booking: { ...defaultState.booking, ...(saved.booking || {}) },
        adminWeekOffset: saved.adminWeekOffset === undefined ? 0 : Number(saved.adminWeekOffset),
        portfolio: (saved.portfolio && Array.isArray(saved.portfolio) && saved.portfolio.length) ? saved.portfolio : structuredClone(defaultState.portfolio)
      };
      if (!loaded.booking.date || loaded.booking.date < today) {
        loaded.booking.date = today;
        loaded.booking.time = defaultBookingTime(today);
      }
      if (!loaded.booking.time) {
        loaded.booking.time = defaultBookingTime(loaded.booking.date);
      }
      if (freshDocument) {
        const booking = loaded.booking;
        if (booking.locationSource === 'administrative-boundaries' || booking.locationAutofill) {
          const automatic = booking.locationAutofill || { city: booking.city, ward: booking.ward, address: booking.detectedAddress === [booking.address, booking.ward, booking.city].filter(Boolean).join(', ') ? booking.address : undefined };
          for (const field of ['city', 'ward', 'address']) if (automatic[field] !== undefined && booking[field] === automatic[field]) booking[field] = '';
          if (!booking.city) booking.provinceCode = null;
          if (!booking.city || !booking.ward) { booking.ward = ''; booking.wardCode = null; }
        }
        Object.assign(booking, { locationCoordinates: null, locationDeviceCoordinates: null, locationCapturedAt: '', locationConfirmedAt: '', locationRegion: null, locationSource: '', locationAutofill: null, locationAddressDetails: null, locationVerificationVersion: 0, detectedAddress: '', isDetectingLocation: false, locationStage: 'idle', locationError: '', locationMessage: '' });
        // Persist the reset before any async controller/map code can read it.
        localStorage.setItem('hoanMakeupDraft', JSON.stringify({ ...saved, booking }));
      }
      return loaded;
    } catch {
      const s = structuredClone(defaultState);
      s.booking.date = today;
      s.booking.time = defaultBookingTime(today);
      return s;
    }
  };

  function startNewBooking() {
    state.booking = structuredClone(defaultState.booking);
    state.booking.date = localIso();
    state.booking.time = defaultBookingTime(state.booking.date);
    saveState(undefined, { replaceBooking: true });
    route('/booking/service');
  }
  const isPreview = typeof window !== 'undefined' && window.parent !== window && new URLSearchParams(location.search || '').get('cmsPreview') === '1';
  let state = loadState({ freshDocument: !isPreview && !(location.hash.slice(1) || '/').startsWith('/admin') });
  let siteTools;
  let bookingLocation;
  let financeAdmin;
  let adminLocations;
  let policyNavigation;
  const verifiedBookings = new Map();
  let depositPreparation = null;
  let depositPreparationError = '';

  if (typeof window !== 'undefined') window.state = state;
  const saveState = (message, options = {}) => {
    if (isPreview) return;
    try {
      let booking = state.booking;
      if (!options.replaceBooking && (location.hash.slice(1) || '/').startsWith('/admin')) {
        try {
          const latest = JSON.parse(localStorage.getItem('hoanMakeupDraft') || '{}');
          if (latest.booking && typeof latest.booking === 'object' && !Array.isArray(latest.booking)) booking = latest.booking;
        } catch { /* Preserve the current draft if local storage is unreadable. */ }
      }
      // Native requests belong to this tab. A shared draft must not make another
      // tab resume, cancel, or overwrite a live browser location request.
      const savedBooking = { ...booking, isDetectingLocation: false };
      delete savedBooking.locationStage;
      localStorage.setItem('hoanMakeupDraft', JSON.stringify({ booking: savedBooking, adminWeekOffset: state.adminWeekOffset, portfolio: state.portfolio }));
      localStorage.setItem('hoanDepositSyncTrigger', String(Date.now()));
    } catch { /* storage may be blocked in iframe / test sandbox */ }
    if (message) toast(message);
  };
  const currentToday = localIso();
  if (!isPreview) {
    if (!state.booking.date || state.booking.date < currentToday) {
      state.booking.date = currentToday;
      state.booking.time = defaultBookingTime(currentToday);
      saveState();
    }
    if (!state.booking.time) {
      state.booking.time = defaultBookingTime(state.booking.date);
      saveState();
    }
  }
  const service = (id = state.booking.serviceId) => state.services.find(s => s.id === id) || state.services[0];
  const currentTotal = () => service().price + Number(state.booking.travelFee || 0);
  const dateLabel = (iso = state.booking.date) => {
    const [y,m,d] = (iso || localIso()).split('-');
    return `${d}/${m}/${y}`;
  };
  let bookingCode = 'CHƯA TẠO';
  try { bookingCode = localStorage.getItem('hoanLastBookingCode') || 'CHƯA TẠO'; } catch {}

  const isUserAdmin = () => {
    try {
      return Boolean(localStorage.getItem('hoanAdminToken') || sessionStorage.getItem('hoanAdminToken') || (typeof window !== 'undefined' && window.parent !== window) || (typeof location !== 'undefined' && location.hash.startsWith('#/admin')));
    } catch {
      return false;
    }
  };
  if (typeof window !== 'undefined') window.isAdmin = isUserAdmin;

  async function api(payload) {
    if (payload && window.parent !== window && new URLSearchParams(location.search).get('cmsPreview') === '1') throw new Error('Bản xem trước không gửi dữ liệu nghiệp vụ.');
    const token = (() => { try { return localStorage.getItem('hoanAdminToken') || sessionStorage.getItem('hoanAdminToken') || ''; } catch { return ''; } })();
    const options = payload ? {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      },
      body: JSON.stringify(payload)
    } : (token ? { headers: { 'Authorization': 'Bearer ' + token } } : {});
    const response = await fetch('/api/data', options);
    const data = await response.json();
    if (!response.ok) { const error = new Error(data.error || 'Không thể kết nối dữ liệu'); error.status = response.status; throw error; }
    if (payload?.action === 'createAppointment') siteTools?.conversion('Đã gửi yêu cầu đặt lịch');
    if (payload?.action === 'createRequest') siteTools?.conversion('Đã gửi yêu cầu liên hệ');
    if (payload?.action === 'saveContent') siteTools?.contentSaved();
    return data;
  }

  function retainVerifiedBooking(result) {
    const code = result.appointment.code;
    verifiedBookings.set(code, result);
    state.appointments = [result.appointment, ...state.appointments.filter(item => item.code !== code)];
    state.bookingDetails = { ...state.bookingDetails, [code]: result.bookingDetails || {} };
    state.paymentInstructionsByCode = { ...state.paymentInstructionsByCode, [code]: result.paymentInstructions || {} };
    state.paymentHistoryByCode = { ...state.paymentHistoryByCode, [code]: result.paymentHistory || [] };
    return result.appointment;
  }

  async function lookupOwnBooking(code, phone) {
    const response = await fetch('/api/data?code=' + encodeURIComponent(code) + '&phone=' + encodeURIComponent(phone), { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || !result.appointment) throw new Error(result.error || 'Chưa tìm thấy lịch hẹn.');
    return retainVerifiedBooking(result);
  }

  function bookingFingerprint(booking) {
    return JSON.stringify(['serviceId','date','time','locationType','travelFee','address','ward','city','name','phone','style','skin','allergy','allergyNote','note','locationNote','locationCoordinates','locationDeviceCoordinates','references'].map(field => booking[field] ?? null));
  }

  function requireBookingLocation(booking) {
    const point = booking.locationCoordinates, region = booking.locationRegion;
    if (point && (!booking.locationConfirmedAt || !region || region.provinceCode !== booking.provinceCode || region.wardCode !== booking.wardCode)) {
      route('/booking/location');
      throw new Error('Kiểm tra và xác nhận điểm đến, hoặc chọn dùng địa chỉ nhập tay trước khi tiếp tục.');
    }
    if (booking.locationType === 'client' && (!booking.address?.trim() || !booking.city || !booking.ward || !booking.provinceCode || !booking.wardCode)) {
      route('/booking/location');
      throw new Error('Vui lòng hoàn tất địa chỉ phục vụ trước khi tạo mã lịch.');
    }
  }

  async function prepareDepositBooking(create = false) {
    if (depositPreparation) return depositPreparation;
    const booking = state.booking;
    depositPreparationError = '';
    depositPreparation = (async () => {
      if (!booking.name?.trim() || !booking.phone?.trim()) throw new Error('Hoàn tất thông tin khách hàng trước khi tạo mã chuyển khoản.');
      if (booking.code) {
        if (booking.serverBookingFingerprint && booking.serverBookingFingerprint !== bookingFingerprint(booking)) {
          route('/booking/' + booking.code);
          throw new Error('Lịch đã được gửi trước đó. Vui lòng gửi yêu cầu thay đổi từ trang lịch hẹn.');
        }
        try {
          const appointment = await lookupOwnBooking(booking.code, booking.phone);
          if (appointment.status === 'cancelled') throw new Error('Lịch này đã hủy. Vui lòng tạo lịch mới.');
          return appointment;
        } catch (error) { if (!create || /^HMA-/.test(booking.code)) throw error; }
      }
      if (!create) return null;
      if (!booking.consent) throw new Error('Vui lòng đồng ý chính sách đặt lịch ở phần thông tin khách hàng.');
      requireBookingLocation(booking);
      const result = await api({ action: 'createAppointment', ...booking, customer: booking.name, paymentStatus: 'unverified' });
      booking.code = result.appointment.code;
      booking.serverBookingFingerprint = bookingFingerprint(booking);
      bookingCode = booking.code;
      state.appointments = [result.appointment, ...state.appointments.filter(item => item.code !== booking.code)];
      try { localStorage.setItem('hoanLastBookingCode', bookingCode); } catch {}
      saveState();
      return lookupOwnBooking(booking.code, booking.phone);
    })().catch(error => { depositPreparationError = error.message; throw error; }).finally(() => { depositPreparation = null; });
    return depositPreparation;
  }

  async function hydrateBackend(silent = false) {
    try {
      const data = await api();
      state.services = data.services || [];
      state.bookingDetails = data.bookingDetails || Object.fromEntries([...verifiedBookings].map(([code, value]) => [code, value.bookingDetails || {}]));
      state.paymentTransactions = data.paymentTransactions || [];
      state.requests = data.requests || [];
      state.notifications = data.notifications || [];
      state.appointments = (data.appointments || []).map(appointment => data.bookingDetails ? appointment : ({ ...verifiedBookings.get(appointment.code)?.appointment, ...appointment }));
      state.customers = data.customers || [];
      state.scheduleSlots = data.scheduleSlots || [];
      state.brand = { ...state.brand, ...(data.brand || {}) };
      state.settings = { ...state.settings, ...(data.settings || {}) };
      ensureScheduleSeedData();
      state.backendReady = true;
      state.backendError = '';
      if (!silent && !isPreview) render();
    } catch (error) {
      state.backendError = error.message;
      ensureScheduleSeedData();
      if (!silent && !isPreview) render();
    }
  }

  const slotRecord = (date, time) => state.scheduleSlots.find(slot => slot.slotDate === date && slot.slotTime === time);
  const activeAppointment = appointment => appointment.status === 'pending' || appointment.status === 'confirmed';
  const slotUnavailable = (date, time) => {
    const blocked = slotRecord(date, time)?.status === 'blocked';
    const minutes=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
    const start=minutes(time),duration=service().duration;
    const booked = state.appointments.some(a => a.date === date && activeAppointment(a) && start<minutes(a.time)+service(a.serviceId).duration && start+duration>minutes(a.time));
    const day=new Date(date+'T'+time+':00+07:00');
    return blocked || booked || day.getTime() < Date.now();
  };

  const formatLongDate = (date = new Date()) => new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh'
  }).format(date).replace(/^./, c => c.toUpperCase());


  function mondayForOffset(offset = 0) {
    const now = new Date();
    const day = now.getDay() || 7;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1 + offset * 7);
    monday.setHours(12, 0, 0, 0);
    return monday;
  }

  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  function editorialMenu(key) {
    const groups = {
      services: {
        title: 'Dịch vụ',
        all: '/services',
        links: [
          ['Trang điểm cá nhân', '/services/personal'],
          ['Trang điểm dự tiệc', '/services/party'],
          ['Trang điểm chụp ảnh', '/services/photo'],
          ['Trang điểm cô dâu', '/services/bridal']
        ]
      },
      gallery: {
        title: 'Bộ sưu tập',
        all: '/gallery',
        links: [
          ['Khám phá các diện mạo', '/gallery'],
          ['Phong cách cá nhân', '/services/personal'],
          ['Cảm hứng cô dâu', '/services/bridal']
        ]
      },
      about: {
        title: 'Về Hoàn',
        all: '/about',
        links: [
          ['Câu chuyện của HOÀN', '/about'],
          ['Trải nghiệm dịch vụ', '/services'],
          ['Tư vấn và hỗ trợ', '/support']
        ]
      }
    };
    const g = groups[key]; if (!g) return '';
    return `<div class="editorial-menu compact-dropdown" id="nav-panel-${key}" aria-label="${g.title}" hidden>
      <div class="dropdown-links">
        ${g.links.map(l => `<a href="#${l[1]}" class="dropdown-item"><span>${l[0]}</span>${icon('arrow')}</a>`).join('')}
        <a class="dropdown-item dropdown-all" href="#${g.all}"><span>Xem tất cả</span>${icon('arrow')}</a>
      </div>
    </div>`;
  }

  function fashionPhoto(name, label) {
    const src = esc(assetUrl(name));
    return `<span class="fashion-photo"><img class="fashion-full" src="${src}" alt="${esc(label)}" loading="lazy" width="1024" height="1536"><img class="fashion-detail" src="${src}" alt="" aria-hidden="true" loading="lazy" width="1024" height="1536"><span class="photo-discover">Xem chi tiết ${icon('arrow')}</span></span>`;
  }

  const galleryItems = [
    { cat:'party', tag:'Dự tiệc', title:'Đỏ rượu trên nền lụa đen', image:'hero.png' },
    { cat:'natural', tag:'Tự nhiên', title:'Trong trẻo buổi sớm', image:'natural.png' },
    { cat:'photo', tag:'Chụp ảnh', title:'Ánh nâu trước ống kính', image:'hero.png' },
    { cat:'bridal', tag:'Cô dâu', title:'Tĩnh lặng ngày trọng đại', image:'bridal.png' },
    { cat:'detail', tag:'Chi tiết', title:'Đường nét và ánh sáng', image:'natural.png' }
  ];

  const faqItems = [
    ['Tôi có thể đổi lịch sau khi đã đặt cọc không?','Có. Bạn được đổi lịch miễn phí nếu gửi yêu cầu trước giờ hẹn ít nhất 24 giờ. Khung giờ mới phụ thuộc vào lịch còn trống.'],
    ['Tiền cọc được xác nhận trong bao lâu?','Chuyển khoản đúng nội dung thường được xác nhận tự động trong 1—3 phút.'],
    ['Phí di chuyển được tính như thế nào?','Phí được xác định theo quận/huyện và hiển thị rõ trước bước đặt cọc.'],
    ['Tôi cần chuẩn bị gì trước buổi hẹn?','Giữ da sạch, dưỡng ẩm nhẹ và chuẩn bị ảnh trang phục hoặc phong cách mong muốn.'],
    ['Nếu đến muộn, lịch hẹn được xử lý ra sao?','Thời lượng có thể được rút ngắn để không ảnh hưởng lịch kế tiếp; hãy báo trước khi có thể.']
  ];

  function bookingArt() {
    return `<aside class="booking-art">${img('hero.png','Phong cách trang điểm HOÀN')}${brandMarkup(true)}<div class="booking-quote">${state.brand.imageMessage}</div></aside>`;
  }
  function statusLabel(status) {
    return ({confirmed:'Đã xác nhận',pending:'Chờ xác nhận',completed:'Đã hoàn thành',cancelled:'Đã hủy'})[status] || status;
  }

  function manageShell(body) {
    return `<div class="booking-shell">${bookingArt()}<section class="booking-panel"><div class="booking-top"><a class="active" href="#/lookup">Tra cứu lịch</a><a href="#/support">Hỗ trợ</a><span class="booking-user">${icon('user')}</span></div><main id="main" class="booking-main manage-main">${body}</main></section></div>`;
  }

  // Approved couture direction: one shared header, separate public destinations.
  const esc = (v = '') => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const policySections = [
    ['booking','Chính sách đặt lịch','Quy trình tạo yêu cầu và xác nhận lịch hẹn.'],
    ['deposit','Đặt cọc & thanh toán','Khoản cọc, đối soát và số tiền còn lại.'],
    ['change','Chính sách đổi lịch','Điều kiện, thời hạn và cách gửi yêu cầu.'],
    ['cancel','Hủy lịch & hoàn cọc','Điều kiện xem xét và theo dõi khoản hoàn.'],
    ['late','Đi muộn','Cách xử lý khi thời gian buổi hẹn thay đổi.'],
    ['travel','Khu vực & phí di chuyển','Phạm vi phục vụ và chi phí theo địa điểm.'],
    ['privacy','Bảo mật thông tin','Thông tin thu thập và mục đích sử dụng.']
  ];
  const helpSections = [
    ['calendar', 'Lịch hẹn', [
      ['booking', 'Đặt lịch như thế nào?', 'Chọn dịch vụ, ngày giờ và gửi thông tin của bạn.'],
      ['lookup', 'Xem lại lịch đã đặt', 'Tra cứu bằng mã lịch hẹn và số điện thoại.']
    ]],
    ['card', 'Thanh toán', [
      ['deposit', 'Chuyển khoản đặt cọc', 'Thông tin chuyển khoản và cách ghi nội dung.'],
      ['verification', 'Đã chuyển tiền nhưng lịch chưa xác nhận?', 'Kiểm tra giao dịch và gửi biên lai cho Hoàn.'],
      ['receipt', 'Xem và lưu biên nhận', 'Biên nhận sau khi khoản cọc được xác nhận.']
    ]],
    ['clock', 'Thay đổi lịch', [
      ['reschedule', 'Tôi muốn đổi ngày hoặc giờ hẹn', 'Gửi yêu cầu đổi lịch và kiểm tra giờ còn trống.'],
      ['cancel', 'Tôi muốn hủy lịch', 'Cách gửi yêu cầu và xem điều kiện hoàn cọc.'],
      ['refund', 'Kiểm tra khoản hoàn cọc', 'Theo dõi tiến độ sau khi yêu cầu được duyệt.']
    ]],
    ['star', 'Trước buổi hẹn', [
      ['preparation', 'Cần chuẩn bị gì trước khi trang điểm?', 'Một vài lưu ý về làn da, trang phục và địa điểm.'],
      ['reference', 'Gửi ảnh makeup và kiểu tóc yêu thích', 'Đính kèm ảnh để trao đổi trước với Hoàn.']
    ]]
  ];
  const lookItems = [
    ['bridal','Ngày của riêng bạn','bridal-new.png','bridal'],['natural','Nét trong trẻo','natural.png','personal'],
    ['evening','Sắc thái cuốn hút','evening.png','party'],['detail','Ánh nhìn cuốn hút','bridal-new.png','bridal'],['portrait','Sắc thái tự nhiên','natural.png','personal']
  ];
  const assetUrl = value => /^(\/assets\/|\/api\/uploads\?|https:\/\/)/.test(value || '') ? value : '/assets/' + (value || 'natural.png');
  const imageFor = s => s.id==='bridal'?(state.brand.bridalImage||'bridal-new.png'):s.id==='personal'||s.id==='photo'?(state.brand.personalImage||'natural.png'):(state.brand.partyImage||'evening.png');
  const field = (name,label,type='text',required=false,value=state.booking[name]||'') => `<label class="ct-field">${label}${required?' *':''}<input name="${name}" type="${type}" value="${esc(value)}" ${required?'required':''} ${type==='tel'?'inputmode="tel" pattern="[+0-9 ()-]{9,16}"':''}></label>`;
  const selectField = (name,label,options,value=state.booking[name]) => `<label class="ct-field">${label}<select name="${name}">${options.map(x=>`<option ${value===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label>`;
  function brandMarkup(invert = false) {
    return `<a class="brand approved-brand ${invert ? 'brand-invert' : ''}" href="#/" aria-label="HOÀN Makeup Artist — Trang chủ"><span class="brand-text"><b class="brand-title">HOÀN</b><small class="brand-sub">MAKEUP ARTIST</small></span></a>`;
  }
  function publicHeader(active='') {
    const nav=[['home','/','Trang chủ'],['services','/services','Dịch vụ'],['bridal','/services/bridal','Cô dâu'],['gallery','/gallery','Bộ sưu tập'],['about','/about','Về Hoàn']];
    return `<a class="skip-link" href="#main">Đến nội dung</a><header class="site-header couture-header" id="site-header"><div class="ct-masthead"><a class="ct-search" href="#/search">${icon('search')}<span>Tìm kiếm…</span></a><button class="icon-btn mobile-menu" data-action="mobile-menu" aria-label="Mở menu" aria-expanded="false">${icon('menu')}</button>${brandMarkup()}<a class="ct-book" href="#/booking/service" data-action="start-booking">${icon('calendar')}<span>Đặt lịch</span></a></div><nav class="main-nav" aria-label="Điều hướng chính">${nav.map(([key,path,label])=>`<div class="nav-entry"><a class="nav-label ${active===key?'active':''}" href="#${path}" ${['services','gallery','about'].includes(key)?`data-nav="${key}" aria-controls="nav-panel-${key}" aria-expanded="false"`:''}>${label}</a>${['services','gallery','about'].includes(key)?`<button class="nav-expand" data-nav-toggle="${key}" aria-label="Mở nhánh ${label}" aria-expanded="false">+</button>${editorialMenu(key)}`:''}</div>`).join('')}</nav></header><div class="nav-veil" hidden></div>`;
  }
  function publicFooter() {
    const current=(location.hash.slice(1)||'/').split('?')[0];
    const isAbout=current==='/about';
    const isContact=current==='/contact';
    const socialLinks=isAbout?`<div class="ct-footer-socials" aria-label="Kênh mạng xã hội của Hoàn"><span class="ct-social-instagram" aria-label="Instagram" role="img"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg></span><span class="ct-social-facebook" aria-label="Facebook" role="img">f</span><span class="ct-social-youtube" aria-label="YouTube" role="img"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12c0 2.75-.32 4.45-.72 5.37a2.5 2.5 0 0 1-1.4 1.4C17.95 19.18 16.24 19.5 12 19.5s-5.95-.32-6.88-.73a2.5 2.5 0 0 1-1.4-1.4C3.32 16.45 3 14.75 3 12s.32-4.45.72-5.37a2.5 2.5 0 0 1 1.4-1.4C20.68 7.55 21 9.25 21 12Z"/><path d="m10 8.8 5 3.2-5 3.2Z" fill="currentColor" stroke="none"/></svg></span><span class="ct-social-tiktok" aria-label="TikTok" role="img">♪</span></div>`:'';
    const tagline=isAbout?`<p class="ct-footer-tagline">${esc(state.brand.tagline || 'Vẻ đẹp bắt đầu từ sự thấu hiểu')}</p>`:'';
    const footerNav = [['support','Hỗ trợ'],['lookup','Tra cứu lịch'],['policies','Chính sách'],['contact','Liên hệ']];
    if (isContact) {
      return `<footer class="public-footer couture-footer ct-contact-footer"><nav aria-label="Thông tin và hỗ trợ">${footerNav.map(([p,t],i)=>`${i>0?'<span class="footer-sep">|</span>':''}<a ${current.startsWith('/'+p)?'aria-current="page" class="active"':''} href="#/${p}">${t}</a>`).join('')}</nav><span class="ct-footer-note">Bản duyệt giao diện — kênh liên hệ sẽ dùng thông tin thật</span></footer>`;
    }
    return `<footer class="public-footer couture-footer ${isAbout?'ct-about-footer':''}">${brandMarkup()}<nav aria-label="Thông tin và hỗ trợ">${footerNav.map(([p,t],i)=>`${i>0?'<span class="footer-sep">|</span>':''}<a ${current.startsWith('/'+p)?'aria-current="page"':''} href="#/${p}">${t}</a>`).join('')}</nav><button type="button" class="visit-preferences" data-visit-action="preferences">Tùy chọn thống kê</button>${socialLinks}${tagline}</footer>`;
  }
  function resolveBreadcrumbHref(text) {
    if (!text) return null;
    const t = String(text).trim();
    const lower = t.toLowerCase();
    
    if (lower === 'trang chủ') return '#/';
    if (lower === 'dịch vụ') return '#/services';
    if (lower === 'bộ sưu tập') return '#/gallery';
    if (lower === 'về hoàn') return '#/about';
    if (lower === 'hỗ trợ') return '#/support';
    if (lower === 'chính sách') return '#/policies';
    if (lower === 'tra cứu lịch' || lower === 'lịch hẹn' || lower === 'tra cứu') return '#/lookup';
    if (lower === 'liên hệ') return '#/contact';
    
    const matchedService = (state.services || []).find(s => 
      s.name.toLowerCase() === lower || 
      lower.includes(s.name.toLowerCase()) || 
      s.name.toLowerCase().includes(lower)
    );
    if (matchedService) {
      return `#/services/${matchedService.id}`;
    }
    
    if (lower === 'cá nhân') return '#/services/personal';
    if (lower === 'dự tiệc') return '#/services/party';
    if (lower === 'cô dâu') return '#/services/bridal';
    
    return null;
  }

  function formatBreadcrumbs(breadcrumb) {
    let items = [];
    if (Array.isArray(breadcrumb)) {
      items = breadcrumb.map(item => (typeof item === 'string' ? { label: item, href: resolveBreadcrumbHref(item) } : item));
    } else if (typeof breadcrumb === 'string') {
      const parts = breadcrumb.split(/\s*[\/›]\s*/).filter(Boolean);
      items = parts.map((part, idx) => {
        const isLast = idx === parts.length - 1;
        if (isLast) return { label: part };
        const href = resolveBreadcrumbHref(part);
        return { label: part, href };
      });
    } else {
      items = [{ label: String(breadcrumb || '') }];
    }

    const rendered = items.map((item, idx) => {
      const isLast = idx === items.length - 1;
      const content = isLast || !item.href
        ? `<span class="breadcrumb-item ${isLast ? 'breadcrumb-current' : ''}">${esc(item.label)}</span>`
        : `<a class="breadcrumb-link" href="${esc(item.href)}">${esc(item.label)}</a>`;
      return `<span>›</span>${content}`;
    }).join('');

    return `<div class="breadcrumbs"><a class="breadcrumb-link" href="#/">Trang chủ</a>${rendered}</div>`;
  }

  function ctPage(active,title,body,breadcrumb=title,wide=false) {
    return `<div class="page couture ct-page-${active||'default'}">${publicHeader(active)}<main id="main" class="ct-main ${wide?'ct-wide':''}">${formatBreadcrumbs(breadcrumb)}${title?`<h1 class="ct-title">${title}</h1>`:''}${body}</main>${publicFooter()}</div>`;
  }
  function bookingInvite() {
    const b = state.brand || {};
    const inviteTitle = b.inviteTitle || 'Cuộc hẹn dành riêng cho bạn';
    const inviteBtn = b.inviteBtnLabel || 'ĐẶT LỊCH';
    return `<section class="ct-invite"><h2>${esc(inviteTitle)}</h2><a class="btn" href="#/booking/service">Chọn dịch vụ ${icon('chevron')}</a><a class="btn" href="#/booking/time">${icon('calendar')} Chọn ngày</a><a class="btn btn-dark" href="#/booking/service">${esc(inviteBtn)}</a></section>`;
  }
  function pageHome() {
    const b = state.brand || {};
    const heroTitle = esc(b.homeTitle || 'Một ngày của bạn.\nMột dấu ấn của Hoàn.').replace(/\n|&lt;br\s*\/?&gt;/gi, '<br>');
    const heroSubtitle = b.homeSubtitle || 'TRANG ĐIỂM CÁ NHÂN & CÔ DÂU';
    const overline = b.editorialOverline || 'NGHỆ THUẬT CỦA SỰ TINH TẾ';
    const edTitle = b.editorialTitle || 'Đẹp từ những điều rất riêng';
    const bridalTitle = esc(b.bridalStoryTitle || 'Khoảnh khắc\ncô dâu').replace(/\n|&lt;br\s*\/?&gt;/gi, '<br>');
    const bridalDesc = esc(b.bridalStoryDesc || 'Tôn lên đường nét.\nGiữ trọn nét riêng.').replace(/\n|&lt;br\s*\/?&gt;/gi, '<br>');
    const eveningTitle = b.eveningTitle || 'Sắc thái của buổi tối';
    const campImg = esc(assetUrl(b.campaignImage || '/assets/campaign.png'));
    const bridalImg = b.bridalImage || 'bridal-new.png';
    const partyImg = b.partyImage || 'evening.png';
    return `<div class="page couture">${publicHeader('home')}<main id="main"><section class="ct-campaign"><img src="${campImg}" alt="Cảm hứng trang điểm cô dâu ${esc(b.name||'HOÀN')}" fetchpriority="high" width="1536" height="1024" onerror="this.src='/assets/campaign.png'"><div class="ct-campaign-copy"><h1>${heroTitle}</h1><p>${esc(heroSubtitle)}</p><a class="link" href="#/services">Khám phá ${icon('arrow')}</a></div></section><section class="ct-editorial"><header><p class="ct-overline">${esc(overline)}</p><h2>${esc(edTitle)}</h2></header><div class="ct-bridal-story"><a href="#/services/bridal">${fashionPhoto(bridalImg,'Trang điểm cô dâu')}</a><div><h2>${bridalTitle}</h2><p>${bridalDesc}</p><a class="btn" href="#/services/bridal">KHÁM PHÁ</a></div><a class="ct-detail-crop" href="#/look/detail">${fashionPhoto(bridalImg,'Chi tiết phong cách cô dâu')}</a></div></section><section class="ct-evening"><div><h2>${esc(eveningTitle)}</h2><a class="link" href="#/services/party">Trang điểm dự tiệc ${icon('arrow')}</a></div><a href="#/services/party">${fashionPhoto(partyImg,'Phong cách dự tiệc')}</a></section>${bookingInvite()}</main>${publicFooter()}</div>`;
  }
  function pageServices() {
    const b = state.brand || {};
    const services = state.services.filter(s => s.enabled);
    return ctPage(
      'services',
      esc(b.servicesPageTitle || 'Dịch vụ trang điểm'),
      `<p class="ct-subtitle">${esc(b.servicesPageSubtitle || 'Lựa chọn dành cho khoảnh khắc của bạn.')}</p>
      <section class="ct-service-grid ct-services-overview" aria-label="Danh sách dịch vụ">
        ${services.map(s => `
          <article class="ct-service-card">
            <a class="ct-service-cover" href="#/services/${esc(s.id)}" aria-label="Xem ${esc(s.name)}">
              ${fashionPhoto(imageFor(s), s.name)}
            </a>
            <a class="ct-service-name" href="#/services/${esc(s.id)}"><h2>${esc(s.name)}</h2></a>
            <p class="ct-service-description">${esc(s.description)}</p>
            <p class="ct-service-meta"><b>${s.contact ? 'Tư vấn riêng' : money(s.price)}</b><span>${icon('clock')} ${esc(s.duration)} phút</span></p>
            <a class="btn btn-wide ct-service-discover" href="#/services/${esc(s.id)}">Xem mẫu & chi tiết ${icon('arrow')}</a>
          </article>
        `).join('')}
        ${!services.length ? '<div class="ct-service-empty"><p>Dịch vụ đang được cập nhật. Liên hệ Hoàn để được tư vấn lựa chọn phù hợp.</p><a class="btn" href="#/contact">Liên hệ tư vấn</a></div>' : ''}
      </section>
      <section class="ct-consult">
        <img src="/assets/natural.png" alt="Phong cách trang điểm tự nhiên" loading="lazy">
        <div>
          <h2>${esc(b.consultTitle || 'Tìm phong cách phù hợp')}</h2>
          <p>${esc(b.consultDesc || 'Chia sẻ dịp tham dự, trang phục và mong muốn của bạn cùng Hoàn.')}</p>
          <a class="btn" href="#/contact">Nhận tư vấn ${icon('arrow')}</a>
        </div>
      </section>`,
      'Dịch vụ',
      true
    );
  }

  function pageServiceDetail(id, photoId) {
    const s = state.services.find(item => item.id === id && item.enabled);
    if (!s) return ctPage('services', 'Dịch vụ hiện không khả dụng', '<div class="ct-service-empty"><p>Dịch vụ này có thể đã được cập nhật hoặc tạm ngừng nhận lịch.</p><a class="btn" href="#/services">Quay lại danh sách dịch vụ</a></div>', 'Dịch vụ');
    const servicePhotos = (state.portfolio || []).filter(p => p.serviceId === s.id);
    const serviceHref = `#/services/${esc(s.id)}`;
    const price = s.contact ? 'Tư vấn riêng' : money(s.price);
    const bookLabel = s.contact ? 'Liên hệ tư vấn' : 'Chọn ngày & giờ';
    const backToServices = `<a class="ct-service-back" href="#/services">${icon('back')} Quay lại danh sách dịch vụ</a>`;

    if (photoId) {
      // Old links to the default illustration remain usable; never select a photo from another service.
      const selectedPhoto = servicePhotos.find(p => p.id === photoId) ||
        (photoId === 'default' && !servicePhotos.length ? { id: 'default', image: imageFor(s), title: s.name, note: '' } : null);
      if (!selectedPhoto) return ctPage('services', 'Mẫu trang điểm hiện không khả dụng', `<div class="ct-service-empty"><p>Mẫu này đã được cập nhật hoặc không thuộc dịch vụ bạn đang xem.</p><a class="btn" href="${serviceHref}">Xem các mẫu của ${esc(s.name)}</a></div>`, [{ label: 'Dịch vụ', href: '#/services' }, { label: s.name, href: serviceHref }, { label: 'Mẫu trang điểm' }]);
      return ctPage(
        id === 'bridal' ? 'bridal' : 'services',
        '',
        `<a class="ct-service-back ct-service-look-back" href="${serviceHref}">${icon('back')} Quay lại ${esc(s.name)}</a>
        <section class="ct-product-detail ct-service-look">
          <div class="ct-service-look-image">${fashionPhoto(selectedPhoto.image, selectedPhoto.title)}</div>
          <article>
            <p class="ct-overline">${esc(s.name)}</p>
            <h1>${esc(selectedPhoto.title)}</h1>
            ${selectedPhoto.note ? `<p class="ct-service-look-note">${esc(selectedPhoto.note)}</p>` : ''}
            <p>${esc(s.description)}</p>
            <dl class="ct-service-facts">
              <div><dt>Giá dịch vụ</dt><dd>${price}</dd></div>
              <div><dt>Thời lượng</dt><dd>${icon('clock')} ${esc(s.duration)} phút</dd></div>
            </dl>
            <h2>Trải nghiệm của bạn</h2>
            <ul>
              <li>Trao đổi phong cách, trang phục và dịp tham dự.</li>
              <li>Chuẩn bị da và trang điểm theo đường nét.</li>
              <li>Kiểm tra và hoàn thiện diện mạo.</li>
            </ul>
            <button class="btn btn-dark btn-wide" data-action="choose-service" data-id="${esc(s.id)}" data-style="${esc(selectedPhoto.title)}">${bookLabel} ${icon('arrow')}</button>
            <p class="ct-service-booking-note">Phí di chuyển được báo trước khi đặt cọc.</p>
            <div class="ct-service-look-links">
              <a class="link" href="#/policies/deposit">Chính sách đặt cọc ${icon('arrow')}</a>
              <a class="link" href="#/services">Danh sách dịch vụ ${icon('arrow')}</a>
            </div>
            ${selectedPhoto.id !== 'default' && isUserAdmin() ? `<button type="button" class="ct-service-manage" data-action="delete-portfolio-item" data-id="${esc(selectedPhoto.id)}">${icon('trash')} Xóa mẫu này</button>` : ''}
          </article>
        </section>`,
        [{ label: 'Dịch vụ', href: '#/services' }, { label: s.name, href: serviceHref }, { label: selectedPhoto.title }],
        true
      );
    }

    return ctPage(
      id === 'bridal' ? 'bridal' : 'services',
      esc(s.name),
      `<p class="ct-subtitle">${esc(s.description)}</p>
      <section class="ct-service-collection">
        <div class="ct-service-bar">
          ${backToServices}
          <div class="ct-service-bar-booking">
            ${!servicePhotos.length ? `<div class="ct-service-meta"><b>${price}</b><span>${icon('clock')} ${esc(s.duration)} phút</span></div>` : ''}
            <button class="btn btn-dark" data-action="choose-service" data-id="${esc(s.id)}">${bookLabel} ${icon('arrow')}</button>
          </div>
        </div>
        <header class="ct-service-collection-heading">
          <div><h2>Mẫu trang điểm</h2><p>Chọn một mẫu để xem chi tiết và đặt lịch theo phong cách bạn thích.</p></div>
          ${servicePhotos.length ? `<span class="ct-service-count">${servicePhotos.length} mẫu</span>` : ''}
        </header>
        ${servicePhotos.length ? `<div class="ct-real-photo-grid ct-service-looks-grid">
          ${servicePhotos.map(p => `
            <article class="ct-service-style-card">
              <a class="ct-service-style-link" href="${serviceHref}/${esc(p.id)}">
                <div class="ct-real-photo-img-wrap"><img src="${esc(assetUrl(p.image))}" alt="${esc(p.title)}" loading="lazy" width="768" height="1024"></div>
                <div class="ct-service-style-copy">
                  <h3>${esc(p.title)}</h3>
                  ${p.note || p.tag ? `<p>${esc(p.note || p.tag)}</p>` : ''}
                  <div class="ct-service-style-pricing ct-service-meta">
                    <div><span>Giá dịch vụ</span><b>${price}</b></div>
                    <div><span>Thời lượng</span><b>${icon('clock')} ${esc(s.duration)} phút</b></div>
                  </div>
                  <span class="link">Xem chi tiết & đặt lịch ${icon('arrow')}</span>
                </div>
              </a>
              ${isUserAdmin() ? `<button type="button" class="ct-service-manage" data-action="delete-portfolio-item" data-id="${esc(p.id)}">${icon('trash')} Xóa mẫu</button>` : ''}
            </article>
          `).join('')}
        </div>` : `<div class="ct-service-empty"><p>Hình ảnh mẫu của dịch vụ này đang được cập nhật.</p><a class="link" href="#/contact">Nhận tư vấn phong cách ${icon('arrow')}</a></div>`}
      </section>`,
      [{ label: 'Dịch vụ', href: '#/services' }, { label: s.name }],
      true
    );
  }

  function pageGallery(filter='all') {
    const list = state.portfolio || [];
    const visible = list.filter(x => filter==='all' || x.serviceId === filter || (filter === 'personal' && (x.serviceId === 'personal' || x.tag === 'Tự nhiên')) || (filter === 'party' && x.serviceId === 'party') || (filter === 'bridal' && x.serviceId === 'bridal'));
    return ctPage('gallery','Những sắc thái của vẻ đẹp',`<p class="ct-subtitle">Tìm cảm hứng cho phong cách của bạn.</p><nav class="ct-tabs">${[['all','Tất cả'],['bridal','Cô dâu'],['party','Dự tiệc'],['personal','Trong trẻo']].map(([v,t])=>`<a class="${filter===v?'active':''}" href="#/gallery?filter=${v}">${t}</a>`).join('')}</nav><section class="ct-gallery">${visible.map((p, idx)=>`<article class="ct-look-card ${p.serviceId==='bridal' && idx===0 ? 'ct-look-bridal' : ''}"><a href="#/look/${p.id}">${fashionPhoto(p.image,p.title)}</a><div class="ct-look-card-meta"><div><span class="ct-look-tag">${esc(p.tag)}</span><h2>${esc(p.title)}</h2></div><a class="link" href="#/look/${p.id}">Xem chi tiết ${icon('arrow')}</a></div></article>`).join('')}</section>`,'Bộ sưu tập',true);
  }
  function pageLook(lookId) {
    const id = lookId || (location.hash.split('/')[2]);
    const photo = (state.portfolio || []).find(p => p.id === id || p.serviceId === id) || (state.portfolio && state.portfolio[0]) || {
      id: 'bridal',
      title: 'Ngày của riêng bạn',
      image: 'bridal-new.png',
      serviceId: 'bridal',
      note: 'Chi tiết phong cách'
    };
    const s = service(photo.serviceId) || state.services[0];
    return ctPage(
      'gallery',
      '',
      `<section class="ct-product-detail">
        <div>${fashionPhoto(photo.image, photo.title)}</div>
        <article>
          <p class="ct-overline">${esc(state.brand?.name || 'HOÀN')} MAKEUP ARTIST</p>
          <h1>${esc(s.name)}</h1>
          <p class="ct-look-style-note" style="color:#7A1832;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin:-10px 0 16px;">PHONG CÁCH: ${esc(photo.title)}</p>
          <p>${esc(s.description)}</p>
          <p class="ct-price">${s.contact ? 'Trao đổi để nhận tư vấn' : money(s.price)}</p>
          <p>${icon('clock')} ${s.duration} phút · Phí di chuyển được báo trước khi đặt cọc.</p>
          <h3>Trải nghiệm của bạn</h3>
          <ul>
            <li>Trao đổi phong cách, trang phục và dịp tham dự.</li>
            <li>Chuẩn bị da và trang điểm theo đường nét.</li>
            <li>Kiểm tra và hoàn thiện diện mạo.</li>
          </ul>
          <button class="btn btn-dark btn-wide" data-action="choose-service" data-id="${s.id}">${s.contact ? 'YÊU CẦU TƯ VẤN' : 'CHỌN NGÀY VÀ GIỜ'}</button>
          <div style="margin-top:20px;display:flex;gap:20px;align-items:center;flex-wrap:wrap;">
            <a class="link" href="#/policies/deposit">Chính sách đặt cọc ${icon('arrow')}</a>
            <a class="link" href="#/gallery">← Trở về bộ sưu tập</a>
          </div>
        </article>
      </section>`,
      [
        { label: 'Bộ sưu tập', href: '#/gallery' },
        { label: photo.title }
      ],
      true
    );
  }
  function pageAbout() {
    const b = state.brand || {};
    const aboutTitle = b.aboutTitle || 'Vẻ đẹp bắt đầu từ sự thấu hiểu';
    const aboutCaption = b.aboutCaption || 'Ảnh minh họa quá trình trang điểm';
    const aboutImg = esc(assetUrl(b.aboutImage || '/assets/about-process.png'));
    const brandName = b.name || 'HOÀN';
    const brandRole = b.role || 'MAKEUP ARTIST';
    const bio1 = b.aboutBio1 || b.aboutBio || 'Mỗi người có đường nét, phong cách và mong muốn riêng. Buổi trang điểm bắt đầu từ việc lắng nghe những điều đó.';
    const bio2 = b.aboutBio2 || 'Từ lớp nền đến điểm nhấn cuối cùng, hướng thiết kế của Hoàn là sự hài hòa với gương mặt, trang phục và dịp tham dự.';
    const p1Title = b.processStep1Title || 'Lắng nghe mong muốn';
    const p1Desc = b.processStep1Desc || 'Hiểu nhu cầu, phong cách và dịp tham dự.';
    const p2Title = b.processStep2Title || 'Thống nhất phong cách';
    const p2Desc = b.processStep2Desc || 'Tư vấn và lựa chọn hướng trang điểm phù hợp.';
    const p3Title = b.processStep3Title || 'Trang điểm & hoàn thiện';
    const p3Desc = b.processStep3Desc || 'Thực hiện theo phong cách đã thống nhất.';
    const p4Title = b.processStep4Title || 'Kiểm tra diện mạo';
    const p4Desc = b.processStep4Desc || 'Cùng xem lại và điều chỉnh để bạn tự tin.';
    const ctaTitle = b.aboutCtaTitle || 'Cùng tìm nét đẹp của bạn';
    return ctPage('about',aboutTitle,`<section class="ct-about"><div class="ct-about-img-wrap"><img src="${aboutImg}" alt="${esc(aboutCaption)}" loading="lazy" width="342" height="174" onerror="this.src='/assets/about-process.png'"><p class="ct-about-caption">${esc(aboutCaption)}</p></div><article><h2>${esc(brandName)} ${esc(brandRole)}</h2><p>${esc(bio1)}</p><hr><p>${esc(bio2)}</p></article></section><section class="ct-process"><h2>Một buổi hẹn cùng ${esc(brandName)}</h2><div>${[[p1Title,p1Desc],[p2Title,p2Desc],[p3Title,p3Desc],[p4Title,p4Desc]].map(([t,d],i)=>`<article><span>0${i+1}</span><h3>${esc(t)}</h3><p>${esc(d)}</p></article>`).join('')}</div></section><div class="ct-about-photos"><img src="/assets/about-brushes.png" alt="Cọ trang điểm" loading="lazy" width="385" height="91"><img src="/assets/about-eye.png" alt="Trang điểm mắt" loading="lazy" width="330" height="91"></div><div class="ct-center-cta"><h2>${esc(ctaTitle)}</h2><a class="btn btn-dark" href="#/booking/service">ĐẶT LỊCH</a><a class="btn" href="#/contact">TRAO ĐỔI VỚI ${esc(brandName)}</a></div>`,'Về Hoàn',true);
  }
  const helpArticlesData = {
    booking: {
      summary: 'Bạn có thể đặt lịch ngay trên website. Hãy chuẩn bị ngày giờ, địa điểm và một vài ảnh makeup bạn thích nếu có.',
      steps: [
        { title: 'Chọn dịch vụ', desc: 'Vào trang Dịch vụ để xem giá, thời lượng và chọn gói phù hợp với buổi hẹn.' },
        { title: 'Chọn ngày giờ và địa điểm', desc: 'Chọn khung giờ còn trống, sau đó chọn trang điểm tại studio hoặc nhập địa chỉ nếu cần Hoàn đến tận nơi.', tip: 'Nếu có giờ chụp ảnh hoặc giờ vào tiệc cố định, bạn nên ghi rõ khi đặt lịch.' },
        { title: 'Điền thông tin', desc: 'Nhập tên, số điện thoại và ghi chú. Bạn có thể gửi tối đa 3 ảnh tham khảo; nhớ báo trước nếu da dễ kích ứng.' },
        { title: 'Đặt cọc và giữ lại mã lịch', desc: 'Làm theo hướng dẫn thanh toán trên màn hình. Hoàn sẽ kiểm tra khoản cọc và xác nhận lịch; bạn dùng mã lịch hẹn để xem lại thông tin.' }
      ],
      cta: { primaryText: 'Đặt lịch', primaryHref: '#/booking/service', secondaryText: 'Tra cứu lịch hẹn', secondaryHref: '#/lookup' },
      related: ['lookup', 'deposit', 'preparation']
    },
    lookup: {
      summary: 'Ngày giờ, địa điểm và trạng thái thanh toán đều có trong trang Tra cứu lịch.',
      steps: [
        { title: 'Mở trang Tra cứu lịch', desc: 'Bạn có thể mở từ liên kết ở cuối website hoặc nút bên dưới.' },
        { title: 'Nhập mã lịch và số điện thoại', desc: 'Dùng mã được cấp khi đặt lịch và số điện thoại đã đăng ký.', tip: 'Nếu quên mã, hãy xem lại tin nhắn xác nhận hoặc liên hệ Hoàn để tìm lại.' },
        { title: 'Xem thông tin buổi hẹn', desc: 'Trang chi tiết hiển thị trạng thái lịch, khoản cọc và biên nhận. Bạn cũng có thể gửi yêu cầu đổi hoặc hủy lịch tại đây.' }
      ],
      cta: { primaryText: 'Tra cứu lịch', primaryHref: '#/lookup', secondaryText: 'Liên hệ Hoàn', secondaryHref: '#/contact' },
      related: ['booking', 'receipt', 'reschedule']
    },
    deposit: {
      summary: 'Tiền cọc dùng để giữ lịch và được trừ vào tổng chi phí buổi trang điểm.',
      steps: [
        { title: 'Xem số tiền và tài khoản nhận', desc: 'Kiểm tra mức cọc trên lịch hẹn và thông tin ngân hàng của Hoàn trước khi chuyển. Mức cọc cho lịch đặc biệt có thể được thỏa thuận riêng.' },
        { title: 'Ghi mã lịch vào nội dung chuyển khoản', desc: 'Chuyển đúng số tiền và ghi mã lịch hẹn trong nội dung để Hoàn đối chiếu giao dịch.' },
        { title: 'Kiểm tra trạng thái', desc: 'Sau khi nhận và kiểm tra tiền, Hoàn cập nhật xác nhận cùng biên nhận trên trang tra cứu.', tip: 'Việc kiểm tra thường mất 15–30 phút. Nếu chưa thấy cập nhật, bạn có thể gửi biên lai cho Hoàn.' }
      ],
      cta: { primaryText: 'Kiểm tra khoản cọc', primaryHref: '#/lookup', secondaryText: 'Chính sách đặt cọc', secondaryHref: '#/policies/deposit' },
      related: ['verification', 'receipt', 'cancel']
    },
    verification: {
      summary: 'Nếu đã chuyển khoản mà lịch vẫn chờ xác nhận, bạn hãy kiểm tra lại giao dịch theo các bước dưới đây.',
      steps: [
        { title: 'Kiểm tra giao dịch ngân hàng', desc: 'Xem giao dịch đã thành công chưa, số tiền và tài khoản nhận có đúng không. Giao dịch liên ngân hàng đôi khi cập nhật chậm.', tip: 'Bạn không cần chuyển thêm lần nữa trong lúc chờ kiểm tra.' },
        { title: 'Xem nội dung chuyển khoản', desc: 'Kiểm tra giao dịch có ghi mã lịch hẹn không. Nếu thiếu mã, hãy gửi lại thông tin để Hoàn đối chiếu.' },
        { title: 'Gửi biên lai cho Hoàn', desc: 'Gửi ảnh giao dịch thành công kèm mã lịch qua trang Tra cứu lịch hoặc kênh liên hệ của Hoàn.' }
      ],
      cta: { primaryText: 'Tra cứu lịch', primaryHref: '#/lookup', secondaryText: 'Liên hệ Hoàn', secondaryHref: '#/contact' },
      related: ['deposit', 'receipt', 'lookup']
    },
    receipt: {
      summary: 'Biên nhận xuất hiện trong lịch hẹn sau khi Hoàn xác nhận đã nhận tiền cọc.',
      steps: [
        { title: 'Tra cứu lịch hẹn', desc: 'Nhập mã lịch và số điện thoại đã dùng để đặt lịch.' },
        { title: 'Mở biên nhận', desc: 'Chọn “Xem biên nhận” ở phần thanh toán để xem dịch vụ, ngày giờ, tiền cọc đã nhận và số tiền còn lại.' },
        { title: 'Lưu một bản', desc: 'Chọn “In / Lưu PDF” rồi lưu vào điện thoại hoặc máy tính để tiện xem lại.' }
      ],
      cta: { primaryText: 'Xem biên nhận', primaryHref: '#/lookup', secondaryText: 'Đặt lịch mới', secondaryHref: '#/booking/service' },
      related: ['deposit', 'verification', 'lookup']
    },
    reschedule: {
      summary: 'Nếu kế hoạch thay đổi, bạn hãy báo cho Hoàn sớm để cùng chọn lại giờ hẹn.',
      steps: [
        { title: 'Kiểm tra thời hạn đổi lịch', desc: 'Bạn được đổi lịch miễn phí khi báo trước ít nhất 24 giờ. Tiền cọc được chuyển sang lịch mới trong vòng 60 ngày kể từ ngày hẹn ban đầu.' },
        { title: 'Gửi ngày giờ bạn muốn đổi', desc: 'Vào Tra cứu lịch, chọn “Yêu cầu đổi lịch” và ghi ngày giờ mới cùng lý do thay đổi.' },
        { title: 'Chờ Hoàn xác nhận', desc: 'Hoàn kiểm tra giờ còn trống và phản hồi trong 2–4 giờ làm việc. Nếu giờ bạn chọn đã có khách, Hoàn sẽ trao đổi để tìm giờ khác.' }
      ],
      cta: { primaryText: 'Mở lịch hẹn', primaryHref: '#/lookup', secondaryText: 'Chính sách đổi lịch', secondaryHref: '#/policies/change' },
      related: ['cancel', 'refund', 'lookup']
    },
    cancel: {
      summary: 'Bạn có thể gửi yêu cầu hủy từ trang lịch hẹn. Điều kiện hoàn cọc phụ thuộc vào thời điểm báo hủy.',
      steps: [
        { title: 'Xem điều kiện hoàn cọc', desc: 'Báo trước ít nhất 48 giờ: hoàn 100% cọc hoặc bảo lưu trong 60 ngày. Báo trong vòng 48 giờ: cọc không được hoàn lại.' },
        { title: 'Gửi yêu cầu hủy', desc: 'Tra cứu lịch hẹn, chọn “Yêu cầu hủy lịch” và điền lý do. Với trường hợp đột xuất, bạn có thể trao đổi thêm trực tiếp với Hoàn.' },
        { title: 'Theo dõi phản hồi', desc: 'Kiểm tra trạng thái yêu cầu trên lịch hẹn. Nếu được duyệt hoàn cọc, cung cấp tài khoản ngân hàng để Hoàn chuyển lại.' }
      ],
      cta: { primaryText: 'Mở lịch hẹn', primaryHref: '#/lookup', secondaryText: 'Chính sách hủy lịch', secondaryHref: '#/policies/cancel' },
      related: ['reschedule', 'refund', 'lookup']
    },
    refund: {
      summary: 'Khoản hoàn cọc được chuyển sau khi Hoàn xác nhận yêu cầu hủy và điều kiện hoàn tiền.',
      steps: [
        { title: 'Kiểm tra yêu cầu đã được duyệt', desc: 'Mở lịch hẹn để xem phản hồi và trạng thái hoàn cọc.' },
        { title: 'Xác nhận tài khoản nhận tiền', desc: 'Gửi đúng tên ngân hàng, số tài khoản và tên chủ tài khoản cho Hoàn.' },
        { title: 'Kiểm tra tiền về', desc: 'Thời gian hoàn cọc là 1–2 ngày làm việc sau khi được xác nhận. Nếu quá thời gian này, liên hệ Hoàn kèm mã lịch để kiểm tra.' }
      ],
      cta: { primaryText: 'Kiểm tra hoàn cọc', primaryHref: '#/lookup', secondaryText: 'Liên hệ Hoàn', secondaryHref: '#/contact' },
      related: ['cancel', 'reschedule', 'deposit']
    },
    preparation: {
      summary: 'Bạn chỉ cần chuẩn bị một chút trước buổi hẹn. Nếu có điều gì cần lưu ý riêng, hãy nhắn Hoàn trước nhé.',
      steps: [
        { title: 'Làm sạch và dưỡng ẩm nhẹ', desc: 'Giữ các bước chăm sóc da quen thuộc. Báo trước cho Hoàn nếu da nhạy cảm hoặc bạn có dị ứng với mỹ phẩm.' },
        { title: 'Chuẩn bị trang phục và ảnh tham khảo', desc: 'Chọn trang phục dễ thay để tránh chạm vào lớp makeup và tóc. Bạn có thể gửi ảnh trang phục, makeup hoặc kiểu tóc muốn làm.' },
        { title: 'Sắp xếp thời gian và không gian', desc: 'Có mặt đúng giờ. Nếu trang điểm tận nơi, chuẩn bị chỗ ngồi, ánh sáng và ổ cắm điện cho dụng cụ làm tóc.' }
      ],
      cta: { primaryText: 'Xem lịch hẹn', primaryHref: '#/lookup', secondaryText: 'Cách gửi ảnh tham khảo', secondaryHref: '#/support/reference' },
      related: ['reference', 'booking', 'lookup']
    },
    reference: {
      summary: 'Một vài ảnh tham khảo giúp Hoàn hiểu rõ hơn về kiểu makeup và tóc bạn muốn.',
      steps: [
        { title: 'Chọn ảnh rõ mặt và màu sắc', desc: 'Chọn ảnh thấy rõ lớp nền, mắt và màu son. Ảnh ít chỉnh sửa sẽ dễ trao đổi hơn.' },
        { title: 'Nói rõ điểm bạn thích', desc: 'Bạn thích màu mắt, độ bóng của nền hay kiểu tóc trong ảnh? Hãy ghi thêm cùng dịp sử dụng và trang phục dự định mặc.' },
        { title: 'Gửi ảnh khi đặt lịch', desc: 'Đính kèm tối đa 3 ảnh trong bước thông tin. Nếu đã đặt lịch, bạn có thể gửi qua kênh liên hệ của Hoàn, kèm mã lịch hẹn.' }
      ],
      cta: { primaryText: 'Đặt lịch', primaryHref: '#/booking/service', secondaryText: 'Gửi ảnh cho Hoàn', secondaryHref: '#/contact' },
      related: ['preparation', 'booking', 'lookup']
    }
  };

  const supportSearchKey = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLocaleLowerCase('vi').trim();
  const supportAnswerText = id => helpArticlesData[id].steps.map(step => [step.desc, step.tip].filter(Boolean).join(' ')).join(' ');

  function updateSupportUrl(desk) {
    const params = new URLSearchParams();
    const query = desk.querySelector('[data-support-search]').value.trim();
    if (query) params.set('q', query);
    if (desk.dataset.category) params.set('category', desk.dataset.category);
    if (desk.dataset.selected) params.set('article', desk.dataset.selected);
    window.history.replaceState(null, '', '#/support' + (params.size ? '?' + params.toString() : ''));
  }

  function refreshSupportPicker(desk) {
    const picker = desk.querySelector('[data-support-picker]');
    const groups = [];
    desk.querySelectorAll('[data-support-group]').forEach(group => {
      const choices = [...group.querySelectorAll('[data-support-choice]')].filter(choice => !choice.hidden);
      if (!choices.length) return;
      const optionGroup = document.createElement('optgroup');
      optionGroup.label = group.dataset.label;
      choices.forEach(choice => {
        const option = document.createElement('option');
        option.value = choice.dataset.supportChoice;
        option.textContent = choice.dataset.label;
        optionGroup.append(option);
      });
      groups.push(optionGroup);
    });
    picker.replaceChildren(...groups);
    picker.closest('.support-mobile-choice').hidden = groups.length === 0;
    if (desk.dataset.selected) picker.value = desk.dataset.selected;
  }

  function selectSupportAnswer(id, { scroll = false, focus = false, writeUrl = true } = {}) {
    const desk = document.querySelector('.support-desk');
    if (!desk) return;
    const choices = [...desk.querySelectorAll('[data-support-choice]')];
    const choice = choices.find(button => button.dataset.supportChoice === id && !button.hidden);
    const selected = choice ? id : '';
    desk.dataset.selected = selected;
    choices.forEach(button => {
      const active = button.dataset.supportChoice === selected;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    let panel = null;
    desk.querySelectorAll('[data-support-panel]').forEach(answer => {
      answer.hidden = answer.dataset.supportPanel !== selected;
      if (!answer.hidden) panel = answer;
    });
    desk.querySelector('.support-empty').hidden = Boolean(selected);
    const picker = desk.querySelector('[data-support-picker]');
    if (selected) picker.value = selected;
    desk.querySelector('[data-support-announcement]').textContent = choice ? `Đang xem: ${choice.dataset.label}` : 'Không có hướng dẫn phù hợp.';
    if (writeUrl) updateSupportUrl(desk);
    if (panel && focus) panel.focus({ preventScroll: true });
    if (panel && scroll) panel.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }

  function filterSupportAnswers(value) {
    const desk = document.querySelector('.support-desk');
    if (!desk) return;
    const query = supportSearchKey(value);
    const category = desk.dataset.category || '';
    const matches = [];
    desk.querySelectorAll('[data-support-group]').forEach(group => {
      let visible = 0;
      group.querySelectorAll('[data-support-choice]').forEach(choice => {
        const match = (!category || group.dataset.supportGroup === category) && (!query || choice.dataset.search.includes(query));
        choice.hidden = !match;
        if (match) { visible++; matches.push(choice); }
      });
      group.hidden = !visible;
    });
    const results = desk.querySelector('.support-results');
    results.hidden = !query && !category;
    results.querySelector('p').textContent = `${matches.length} hướng dẫn${value.trim() ? ` cho “${value.trim()}”` : ''}`;
    const best = query ? matches.find(choice => supportSearchKey(choice.dataset.label).includes(query)) || matches[0] : matches[0];
    selectSupportAnswer(best?.dataset.supportChoice || '', { writeUrl: false });
    refreshSupportPicker(desk);
    updateSupportUrl(desk);
  }

  document.addEventListener('change', event => {
    if (event.target.matches?.('[data-support-picker]')) selectSupportAnswer(event.target.value, { scroll: true, focus: true });
  });

  function pageSupport() {
    const params = new URLSearchParams(location.hash.split('?')[1]);
    const q = params.get('q') || '';
    const query = supportSearchKey(q);
    const requestedCategory = params.get('category') || '';
    const category = helpSections.some(([id]) => id === requestedCategory) ? requestedCategory : '';
    const b = state.brand || {};
    const zalo = String(b.zaloPhone || b.phone || '').replace(/\D/g, '');
    const contactHref = zalo ? `https://zalo.me/${zalo}` : '#/contact';
    const contactLabel = zalo ? 'Nhắn Hoàn qua Zalo' : 'Liên hệ Hoàn';
    const leads = {
      booking: 'Chọn dịch vụ, ngày giờ và địa điểm, điền thông tin rồi đặt cọc. Lịch được giữ sau khi Hoàn xác nhận.',
      lookup: 'Dùng mã lịch hẹn và số điện thoại đã đăng ký để xem lịch, tiền cọc hoặc gửi yêu cầu đổi, hủy.',
      deposit: `Mức cọc tiêu chuẩn là ${money(Number(state.settings?.deposit || 200000))}, được trừ vào tổng chi phí. Ghi mã lịch hẹn khi chuyển khoản.`,
      verification: 'Kiểm tra giao dịch và gửi biên lai kèm mã lịch. Không chuyển thêm tiền trong lúc chờ kiểm tra.',
      receipt: 'Biên nhận có sau khi khoản cọc được xác nhận. Bạn có thể xem và lưu PDF trong lịch hẹn.',
      reschedule: 'Báo trước ít nhất 24 giờ để đổi miễn phí. Tiền cọc được chuyển sang lịch mới trong vòng 60 ngày.',
      cancel: 'Báo trước ít nhất 48 giờ: hoàn 100% cọc hoặc bảo lưu trong 60 ngày. Hủy trong vòng 48 giờ: không hoàn cọc.',
      refund: 'Hoàn cọc trong 1–2 ngày làm việc sau khi yêu cầu được duyệt và xác nhận thông tin tài khoản.',
      preparation: 'Làm sạch, dưỡng ẩm nhẹ và báo trước nếu da nhạy cảm. Chuẩn bị trang phục dễ thay; có chỗ ngồi và ổ cắm nếu trang điểm tận nơi.',
      reference: 'Gửi tối đa 3 ảnh makeup, kiểu tóc hoặc trang phục khi đặt lịch, kèm ghi chú về những điểm bạn thích.'
    };
    const entries = helpSections.flatMap(([key, title, links]) => links.map(([id, label]) => ({ id, label, key, category: title, lead: leads[id], search: supportSearchKey(`${title} ${label} ${leads[id]} ${supportAnswerText(id)}`) })));
    const matches = entries.filter(entry => (!category || entry.key === category) && (!query || entry.search.includes(query)));
    const selected = matches.find(entry => entry.id === params.get('article')) || (query ? matches.find(entry => supportSearchKey(entry.label).includes(query)) : null) || matches[0];
    const navigation = helpSections.map(([key, title]) => {
      const links = entries.filter(entry => entry.key === key);
      const visible = links.some(entry => matches.includes(entry));
      return `<section class="support-nav-group" data-support-group="${key}" data-label="${esc(title)}" ${visible ? '' : 'hidden'}><h2>${esc(title)}</h2>${links.map(entry => `<button type="button" class="support-choice ${selected?.id === entry.id ? 'is-active' : ''}" data-action="support-select" data-id="${entry.id}" data-support-choice="${entry.id}" data-label="${esc(entry.label)}" data-search="${esc(entry.search)}" aria-controls="support-panel-${entry.id}" ${selected?.id === entry.id ? 'aria-current="true"' : ''} ${matches.includes(entry) ? '' : 'hidden'}><span>${esc(entry.label)}</span>${icon('arrow')}</button>`).join('')}</section>`;
    }).join('');
    const options = helpSections.map(([key, title]) => {
      const links = matches.filter(entry => entry.key === key);
      return links.length ? `<optgroup label="${esc(title)}">${links.map(entry => `<option value="${entry.id}" ${selected?.id === entry.id ? 'selected' : ''}>${esc(entry.label)}</option>`).join('')}</optgroup>` : '';
    }).join('');
    const answers = entries.map(entry => {
      const article = helpArticlesData[entry.id];
      const primaryHref = entry.id === 'reference' ? contactHref : article.cta.primaryHref;
      const primaryLabel = entry.id === 'reference' ? 'Gửi ảnh cho Hoàn' : article.cta.primaryText;
      const secondary = !article.cta.secondaryHref.startsWith('#/support/') && article.cta.secondaryHref !== primaryHref;
      return `<article class="support-reader" id="support-panel-${entry.id}" data-support-panel="${entry.id}" tabindex="-1" aria-labelledby="support-title-${entry.id}" ${selected?.id === entry.id ? '' : 'hidden'}>
        <header><p class="support-reader-category">${esc(entry.category)}</p><h2 id="support-title-${entry.id}">${esc(entry.label)}</h2><p class="support-reader-lead">${esc(entry.lead)}</p></header>
        <ol class="support-reader-steps">${article.steps.map(step => `<li><h3>${esc(step.title)}</h3><p>${esc(step.desc)}</p>${step.tip ? `<p class="support-reader-note">${esc(step.tip)}</p>` : ''}</li>`).join('')}</ol>
        <div class="support-reader-actions"><a class="btn" href="${esc(primaryHref)}" ${entry.id === 'reference' && zalo ? 'target="_blank" rel="noopener noreferrer"' : ''}>${esc(primaryLabel)} ${icon('arrow')}</a>${secondary ? `<a class="link" href="${esc(article.cta.secondaryHref)}">${esc(article.cta.secondaryText)}</a>` : ''}</div>
      </article>`;
    }).join('');
    return ctPage('support', 'Hỗ trợ', `<p class="ct-subtitle">Chọn câu hỏi để xem hướng dẫn đầy đủ ngay bên dưới.</p>
      <div class="support-desk" data-category="${esc(category)}" data-selected="${selected?.id || ''}">
        <div class="support-masterdetail">
          <aside class="support-index"><form class="ct-search-form support-search" data-form="support-search" role="search"><label class="support-sr-only" for="support-query">Tìm câu trả lời</label>${icon('search')}<input id="support-query" type="search" name="q" data-support-search value="${esc(q)}" placeholder="Tìm câu trả lời…" autocomplete="off">${category ? `<input type="hidden" name="category" value="${esc(category)}">` : ''}</form>
            <div class="support-results" role="status" ${query || category ? '' : 'hidden'}><p>${matches.length} hướng dẫn${q.trim() ? ` cho “${esc(q.trim())}”` : ''}</p><a href="#/support">Xem tất cả</a></div>
            <nav class="support-question-nav" aria-label="Chọn câu hỏi hỗ trợ">${navigation}</nav>
            <label class="support-mobile-choice" ${matches.length ? '' : 'hidden'}><span>Chọn câu hỏi</span><select data-support-picker aria-label="Chọn câu hỏi">${options}</select></label>
          </aside>
          <div class="support-reading-area">${answers}<section class="support-empty" ${selected ? 'hidden' : ''}><h2>Chưa tìm thấy hướng dẫn phù hợp.</h2><p>Thử từ khóa khác hoặc liên hệ Hoàn để hỏi trực tiếp.</p><a class="link" href="${esc(contactHref)}" ${zalo ? 'target="_blank" rel="noopener noreferrer"' : ''}>${contactLabel} ${icon('arrow')}</a></section></div>
        </div>
        <span class="support-sr-only" role="status" aria-live="polite" data-support-announcement></span>
      </div>`, 'Hỗ trợ', true);
  }

  function pageHelpArticle(id) {
    const section = helpSections.find(([, , links]) => links.some(link => link[0] === id));
    const article = helpArticlesData[id];
    if (!section || !article) return pageSupport();
    const label = section[2].find(link => link[0] === id)[1];
    const related = article.related.map(key => helpSections.flatMap(s => s[2]).find(link => link[0] === key)).filter(Boolean);
    return ctPage('support', esc(label), `<p class="ct-subtitle">${esc(article.summary)}</p><article class="support-article">
      <a class="ct-service-back support-back" href="#/support">${icon('back')} Tất cả hướng dẫn</a>
      <ol class="support-steps">${article.steps.map(step => `<li><h2>${esc(step.title)}</h2><p>${esc(step.desc)}</p>${step.tip ? `<p class="support-step-note">${esc(step.tip)}</p>` : ''}</li>`).join('')}</ol>
      <div class="support-article-actions"><a class="btn" href="${esc(article.cta.primaryHref)}">${esc(article.cta.primaryText)} ${icon('arrow')}</a><a class="link" href="${esc(article.cta.secondaryHref)}">${esc(article.cta.secondaryText)}</a></div>
      ${related.length ? `<nav class="support-related" aria-label="Hướng dẫn liên quan"><h2>Hướng dẫn liên quan</h2>${related.map(([key, title]) => `<a href="#/support/${key}">${esc(title)} ${icon('arrow')}</a>`).join('')}</nav>` : ''}
    </article>`, [{ label: 'Hỗ trợ', href: '#/support' }, { label }], true);
  }

  function pagePolicies(tab) {
    const b = state.brand || {};
    const s = state.settings || {};
    const depositStandard = money(Number(s.deposit || 200000));
    const title = b.policiesPageTitle || 'Chính sách dịch vụ';
    const subtitle = b.policiesPageSubtitle || 'Một vài điều cần thống nhất trước buổi hẹn. Bạn có thể đọc từng mục bên dưới hoặc liên hệ Hoàn nếu cần giải thích thêm.';
    const policyDetails = {
      booking: {
        title: 'Đặt lịch',
        sections: [
          { title: 'Chọn dịch vụ và thời gian', content: b.policyBooking1 || 'Bạn chọn dịch vụ, ngày giờ còn trống và địa điểm trang điểm trên website. Giá và thời lượng được hiển thị trước khi gửi yêu cầu.', note: 'Có thể gửi kèm ảnh makeup, kiểu tóc và ghi chú về làn da khi đặt lịch.' },
          { title: 'Khi nào lịch được xác nhận?', content: b.policyBooking2 || 'Sau khi gửi yêu cầu, bạn sẽ nhận được mã lịch hẹn. Lịch được xác nhận khi Hoàn kiểm tra thông tin và nhận đủ tiền cọc. Khi đó, khung giờ được giữ riêng cho bạn.' },
          { title: 'Trước buổi hẹn', content: 'Hoàn sẽ nhắn nhắc lịch trước khoảng 24 giờ. Bạn vui lòng giữ liên lạc và báo trước nếu có thay đổi về thời gian, địa điểm hoặc trang phục.' }
        ]
      },
      deposit: {
        title: 'Đặt cọc & thanh toán',
        sections: [
          { title: 'Tiền cọc giữ lịch', content: b.policyDeposit || `Mức cọc tiêu chuẩn là ${depositStandard} cho một lượt hẹn. Toàn bộ tiền cọc được trừ vào tổng chi phí dịch vụ.`, note: 'Với gói cô dâu hoặc lịch đi xa, mức cọc được trao đổi riêng trước khi xác nhận.' },
          { title: 'Chuyển khoản và xác nhận', content: 'Chuyển khoản theo thông tin ngân hàng của Hoàn và ghi mã lịch hẹn trong nội dung. Khi nhận và kiểm tra tiền, Hoàn sẽ cập nhật xác nhận và biên nhận trên trang tra cứu.' },
          { title: 'Số tiền còn lại', content: 'Bạn thanh toán phần còn lại sau khi hoàn thành buổi trang điểm, bằng tiền mặt hoặc chuyển khoản. Các chi phí được thống nhất trước buổi hẹn.' }
        ]
      },
      change: {
        title: 'Đổi lịch hẹn',
        sections: [
          { title: 'Báo trước ít nhất 24 giờ', content: b.policyChange || 'Bạn được đổi ngày giờ miễn phí nếu báo trước ít nhất 24 giờ so với lịch ban đầu. Giờ mới cần còn trống và được Hoàn xác nhận.' },
          { title: 'Bảo lưu tiền cọc', content: 'Toàn bộ tiền cọc được chuyển sang lịch mới trong vòng 60 ngày kể từ ngày hẹn ban đầu. Mã lịch hẹn được giữ nguyên để tiện theo dõi.' },
          { title: 'Đổi lịch trong vòng 24 giờ', content: 'Hoàn sẽ kiểm tra xem có thể sắp xếp giờ khác trong cùng ngày hay không. Nếu không có giờ phù hợp, lịch có thể áp dụng điều kiện hủy.', note: 'Gửi yêu cầu ở trang Tra cứu lịch hoặc liên hệ Hoàn để trao đổi.' }
        ]
      },
      cancel: {
        title: 'Hủy lịch & hoàn cọc',
        sections: [
          { title: 'Điều kiện hoàn cọc', content: b.policyCancel || 'Báo hủy trước ít nhất 48 giờ: hoàn 100% tiền cọc hoặc bảo lưu để đặt lịch trong 60 ngày. Báo hủy trong vòng 48 giờ: tiền cọc không được hoàn lại do khung giờ đã được giữ.' },
          { title: 'Thời gian hoàn tiền', content: 'Sau khi yêu cầu hoàn cọc được xác nhận, Hoàn chuyển tiền về tài khoản của bạn trong 1–2 ngày làm việc. Bạn có thể theo dõi trạng thái trên trang lịch hẹn.' },
          { title: 'Trường hợp bất khả kháng', content: 'Với sự cố sức khỏe, gia đình hoặc thời tiết, bạn hãy liên hệ trực tiếp. Hoàn sẽ trao đổi về việc hoàn tiền hoặc bảo lưu không giới hạn thời gian theo trường hợp cụ thể.' }
        ]
      },
      late: {
        title: 'Đến trễ & thời lượng buổi hẹn',
        sections: [
          { title: 'Bắt đầu đúng giờ', content: b.policyLate || 'Một buổi trang điểm thường kéo dài 60–90 phút. Bạn vui lòng có mặt đúng giờ và báo trước nếu có giờ chụp ảnh, xuất hành hoặc vào tiệc cố định.' },
          { title: 'Nếu bạn đến muộn', content: 'Hãy nhắn hoặc gọi cho Hoàn sớm. Trễ dưới 15 phút, Hoàn sẽ điều chỉnh các bước để kịp giờ. Trễ hơn 15 phút, một số chi tiết có thể phải rút gọn để không ảnh hưởng lịch của khách tiếp theo.' },
          { title: 'Nếu Hoàn đến muộn', content: 'Hoàn sẽ báo ngay khi có sự cố và trao đổi cách xử lý: hoàn thành theo giờ đã hẹn hoặc miễn phí di chuyển.' }
        ]
      },
      travel: {
        title: 'Khu vực & phí di chuyển',
        sections: [
          { title: 'Trang điểm tận nơi', content: b.policyTravel || 'Hoàn nhận trang điểm tại nhà, khách sạn, studio và địa điểm tổ chức tiệc ở TP.HCM cùng các tỉnh lân cận.', note: 'Bạn chuẩn bị chỗ ngồi, ánh sáng cơ bản và ổ cắm cho dụng cụ làm tóc.' },
          { title: 'Phí di chuyển', content: 'Phí được tính theo địa điểm và hiển thị ở bước chọn địa điểm, trước khi đặt cọc. Khu vực gần studio có thể được miễn hoặc hỗ trợ phí. Mọi khoản phí được thống nhất trước.' },
          { title: 'Lịch đi tỉnh', content: 'Với lịch đi xa hoặc làm việc nhiều ngày, Hoàn sẽ trao đổi thời gian xuất phát, phương tiện và báo chi phí trọn gói trước ngày hẹn.' }
        ]
      },
      privacy: {
        title: 'Thông tin cá nhân & hình ảnh',
        sections: [
          { title: 'Thông tin đặt lịch', content: b.policyPrivacy || 'Tên, số điện thoại, địa chỉ và ghi chú được sử dụng để liên hệ, xác nhận và phục vụ buổi hẹn. Hoàn không cung cấp thông tin này cho bên thứ ba.' },
          { title: 'Ảnh tham khảo và lưu ý về da', content: 'Ảnh bạn gửi cùng thông tin về da, dị ứng chỉ được dùng nội bộ để trao đổi phong cách và chuẩn bị mỹ phẩm cho buổi hẹn.' },
          { title: 'Sử dụng hình ảnh sau trang điểm', content: 'Hoàn chỉ đăng ảnh của bạn lên website hoặc trang cá nhân khi được đồng ý. Bạn có thể từ chối chụp ảnh hoặc yêu cầu gỡ ảnh bất cứ lúc nào.' }
        ]
      }
    };
    const policyIndex = policySections.findIndex(([id]) => id === tab);
    const selected = policyIndex >= 0 ? policySections[policyIndex] : null;
    const policyBody = (id, heading = 'h3') => policyDetails[id].sections.map(section => `<section class="policy-clause"><${heading}>${esc(section.title)}</${heading}><p>${esc(section.content)}</p>${section.note ? `<p class="policy-note">${esc(section.note)}</p>` : ''}</section>`).join('');
    const next = selected ? policySections[policyIndex + 1] : null;
    const contents = policySections.map(([id, label], index) => selected ? `<a href="#/policies/${id}" ${id === tab ? 'aria-current="page"' : ''}><small>${String(index + 1).padStart(2, '0')}</small><span>${esc(label)}</span></a>` : `<button type="button" data-action="policy-scroll" data-id="${id}" aria-controls="policy-${id}" ${index === 0 ? 'aria-current="location"' : ''}><small>${String(index + 1).padStart(2, '0')}</small><span>${esc(label)}</span></button>`).join('');
    return ctPage('policies', esc(selected ? policyDetails[tab].title : title), `<p class="ct-subtitle">${esc(selected ? selected[2] : subtitle)}</p><div class="policy-document">
      ${selected ? `<a class="ct-service-back policy-back" href="#/policies">${icon('back')} Toàn bộ chính sách</a>` : ''}
      <div class="policy-document-layout">
        <aside class="policy-contents"><div class="policy-desktop-contents"><p>Nội dung chính sách</p><nav aria-label="Mục lục chính sách">${contents}</nav></div><details class="policy-mobile-contents"><summary><span data-policy-current-label>Nội dung chính sách</span>${icon('chevron')}</summary><nav aria-label="Mục lục chính sách">${contents}</nav></details><p>Các điều kiện áp dụng cho lịch hẹn tại Hoàn Makeup Artist.</p></aside>
        <div class="policy-text">${selected ? `<article class="policy-single">${policyBody(tab, 'h2')}</article>` : policySections.map(([id], index) => `<article class="policy-chapter" id="policy-${id}"><h2><span>${String(index + 1).padStart(2, '0')}</span>${esc(policyDetails[id].title)}</h2>${policyBody(id)}<a class="policy-permalink" href="#/policies/${id}">Xem riêng mục này ${icon('arrow')}</a></article>`).join('')}
          ${next ? `<a class="policy-next" href="#/policies/${next[0]}"><span><small>Chính sách tiếp theo</small>${esc(policyDetails[next[0]].title)}</span>${icon('arrow')}</a>` : ''}
          <div class="policy-footnote"><p>Nếu có điểm nào chưa rõ, Hoàn sẵn sàng giải thích thêm trước khi bạn đặt lịch.</p><a class="link" href="#/contact">Liên hệ Hoàn ${icon('arrow')}</a></div>
        </div>
      </div>
    </div>`, selected ? [{ label: 'Chính sách', href: '#/policies' }, { label: selected[1] }] : 'Chính sách', true);
  }
  function pageContact() {
    const b = state.brand;
    const phone = (b.phone || '').replace(/\D/g, '');
    const email = esc(b.email || '');
    const zaloUrl = `https://zalo.me/${(b.zaloPhone || b.phone || '').replace(/\D/g, '')}`;

    return ctPage('contact','Trao đổi cùng Hoàn',`<p class="ct-subtitle">Chia sẻ mong muốn hoặc vấn đề bạn cần hỗ trợ.</p>
      <section class="ct-contact-layout">
        <aside class="ct-contact-sidebar">
          <h2>Kết nối trực tiếp</h2>
          <div class="contact-channels">
            <a href="${zaloUrl}" target="_blank" rel="noreferrer" class="contact-channel-card">
              <span class="channel-left">
                <svg class="channel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
                <span class="channel-name">Nhắn qua Zalo</span>
              </span>
              <span class="channel-arrow">↗</span>
            </a>

            <a href="tel:${phone}" class="contact-channel-card">
              <span class="channel-left">
                <svg class="channel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span class="channel-name">Gọi cho Hoàn</span>
              </span>
              <span class="channel-arrow">↗</span>
            </a>

            <a href="mailto:${email}" class="contact-channel-card">
              <span class="channel-left">
                <svg class="channel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <span class="channel-name">Gửi email</span>
              </span>
              <span class="channel-arrow">↗</span>
            </a>
          </div>

          <div class="contact-lookup-box">
            <p class="contact-lookup-label">Bạn đã đặt lịch?</p>
            <a class="contact-lookup-link" href="#/lookup">Đến trang tra cứu lịch ↗</a>
          </div>

          <div class="contact-image-wrap">
            <img src="/assets/contact-brushes.jpg" alt="Dụng cụ trang điểm chuyên nghiệp HOÀN" loading="lazy">
          </div>
        </aside>

        <form data-form="contact" class="ct-contact-form-main">
          <h2>Gửi lời nhắn</h2>
          
          <div class="contact-grid-2">
            <label class="contact-field-wrap">
              <span class="contact-label">Họ và tên *</span>
              <input type="text" name="name" required placeholder="Nhập họ và tên">
            </label>
            <label class="contact-field-wrap">
              <span class="contact-label">Số điện thoại *</span>
              <input type="tel" name="phone" required placeholder="Nhập số điện thoại">
            </label>
          </div>

          <label class="contact-field-wrap">
            <span class="contact-label">Email</span>
            <input type="email" name="email" placeholder="Nhập email (không bắt buộc)">
          </label>

          <label class="contact-field-wrap">
            <span class="contact-label">Nội dung cần trao đổi *</span>
            <div class="contact-select-wrap">
              <select name="subject" required>
                <option value="" disabled selected>Chọn chủ đề</option>
                <option value="Tư vấn trang điểm">Tư vấn trang điểm</option>
                <option value="Đặt lịch & kiểm tra lịch">Đặt lịch & kiểm tra lịch</option>
                <option value="Đặt cọc & thanh toán">Đặt cọc & thanh toán</option>
                <option value="Đổi / hủy lịch">Đổi / hủy lịch</option>
                <option value="Vấn đề khác">Vấn đề khác</option>
              </select>
              <svg class="select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </label>

          <label class="contact-field-wrap">
            <span class="contact-label">Mã lịch hẹn</span>
            <input type="text" name="code" placeholder="Nhập mã lịch hẹn (không bắt buộc)">
          </label>

          <label class="contact-field-wrap">
            <span class="contact-label">Lời nhắn *</span>
            <textarea name="message" required rows="4" placeholder="Mô tả mong muốn hoặc vấn đề cần hỗ trợ..."></textarea>
          </label>

          <div class="contact-attach-row">
            <button type="button" class="contact-attach-btn" data-action="ct-contact-attach">
              <svg class="attach-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
              <span>Đính kèm ảnh tham khảo (không bắt buộc)</span>
            </button>
            <input type="file" id="contact-file-input" accept="image/*" multiple hidden>
            <span class="contact-file-status" hidden></span>
          </div>

          <label class="contact-check-label">
            <input type="checkbox" required>
            <span>Tôi đồng ý chính sách bảo mật</span>
          </label>

          <button type="submit" class="contact-submit-btn">GỬI LỜI NHẮN</button>
          <p class="ct-form-status" role="status"></p>
        </form>
      </section>`,
      'Liên hệ'
    );
  }
  function pageLookup() {
    return ctPage('lookup','Tra cứu lịch hẹn',`<p class="ct-subtitle">Xem trạng thái và quản lý lịch đã đặt cùng Hoàn.</p><form class="ct-lookup ct-form" data-form="lookup">${field('code','Mã lịch hẹn','text',true,'')}${field('phone','Số điện thoại đặt lịch','tel',true,'')}<button class="btn btn-dark btn-wide">TRA CỨU LỊCH HẸN</button><p class="ct-form-status" role="status"></p><p class="ct-secure">${icon('lock')} Thông tin được dùng để xác minh lịch của bạn.</p><p>Không nhớ mã lịch? <a class="link" href="#/contact">Liên hệ Hoàn ${icon('arrow')}</a></p></form>`,'Tra cứu lịch');
  }
  function progress(step) {
    const names=['Dịch vụ','Thời gian','Địa điểm','Thông tin','Đặt cọc','Xác nhận'];
    const stepRoutes = ['/booking/service', '/booking/time', '/booking/location', '/booking/info', '/booking/deposit', '/booking/confirm'];
    return `<nav class="booking-progress ct-progress mockup-progress" aria-label="Tiến trình đặt lịch">${names.map((t,i)=>`${i>0?'<span class="step-connector"></span>':''}<div class="progress-step ${i+1===step?'active':''}${i+1<step?' done':''}" ${i+1===step?'aria-current="step"':''} data-action="go-step" data-target="${stepRoutes[i]}" style="cursor:pointer;" title="${t}"><b class="step-num">${i+1}</b><span class="step-label">${t}</span></div>`).join('')}</nav>`;
  }
  function bookingFooterPrice(step) {
    const s = service();
    if (s.contact) return 'Tư vấn riêng';
    // Travel fee is unknown until the customer picks a location (step 3); keep card and booking prices identical before that.
    const travel = step >= 3 ? Number(state.booking.travelFee || 0) : 0;
    return travel ? `${money(s.price + travel)} <small class="muted">(gồm ${money(travel)} di chuyển)</small>` : money(s.price);
  }
  function bookingShell(step,body,nextPath,nextLabel,summary='',hasCustomFooter=false) {
    return `<div class="page couture">${publicHeader()}<main id="main" class="ct-main ct-booking">${progress(step)}${body}${hasCustomFooter?'':`<footer class="ct-booking-footer"><div>${summary||`${esc(service().name)} · ${bookingFooterPrice(step)}`}</div><div class="ct-actions"><button class="btn" data-action="booking-back" data-step="${step}">Quay lại</button>${nextPath?`<button class="btn btn-dark" data-action="ct-next" data-next="${nextPath}" data-step="${step}">${nextLabel}</button>`:''}</div></footer>`}</main>${publicFooter()}</div>`;
  }
  function pageBookingService() {
    return bookingShell(1,`<h1 class="ct-title">Chọn dịch vụ trang điểm</h1><p class="ct-subtitle">Lựa chọn dành cho khoảnh khắc của bạn.</p><section class="ct-service-grid ct-select-services">${state.services.filter(s=>s.enabled).map(s=>`<button class="ct-service-option ${s.id===state.booking.serviceId?'selected':''}" data-action="booking-service" data-id="${s.id}"><img src="/assets/${imageFor(s)}" alt="${esc(s.name)}"><h2>${esc(s.name)}</h2><p>${s.contact?'Tư vấn riêng':`${money(s.price)} · ${s.duration} phút`}</p><span>${s.id===state.booking.serviceId?'✓ Đã chọn':'Chọn dịch vụ'}</span></button>`).join('')}</section>`,'/booking/time','TIẾP TỤC · THỜI GIAN');
  }
  function calendarMarkup() {
    const today = localIso();
    if (!state.booking.date || state.booking.date < today) {
      state.booking.date = today;
    }
    const d=new Date((state.calendarMonth||state.booking.date).slice(0,7)+'-01T12:00:00');const y=d.getFullYear(),m=d.getMonth(),offset=(d.getDay()+6)%7;
    const end=new Date();end.setDate(end.getDate()+Number(state.settings.bookingWindow||60));
    return `<div class="ct-calendar"><header><button class="icon-btn" data-action="ct-month" data-delta="-1" aria-label="Tháng trước">${icon('back')}</button><h3>Tháng ${m+1}, ${y}</h3><button class="icon-btn" data-action="ct-month" data-delta="1" aria-label="Tháng sau">${icon('arrow')}</button></header><div class="ct-calendar-grid">${['T2','T3','T4','T5','T6','T7','CN'].map(t=>`<span>${t}</span>`).join('')}${'<span></span>'.repeat(offset)}${Array.from({length:new Date(y,m+1,0).getDate()},(_,i)=>{const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;return `<button class="${iso===state.booking.date?'selected':''}" data-action="ct-date" data-date="${iso}" ${iso<today||iso>localIso(end)?'disabled':''} aria-label="${dateLabel(iso)}" aria-pressed="${iso===state.booking.date}">${i+1}</button>`}).join('')}</div></div>`;
  }
  function availableTimes() {
    return [...new Set([...hourlyTimes('00:00', '24:00'), ...state.scheduleSlots.filter(s=>s.slotDate===state.booking.date).map(s=>s.slotTime)])].sort();
  }
  function pageBookingTime() {
    const today = localIso();
    if (!state.booking.date || state.booking.date < today) {
      state.booking.date = today;
      state.booking.time = '';
    }
    const times = availableTimes();
    if (state.booking.time && slotUnavailable(state.booking.date, state.booking.time)) {
      state.booking.time = '';
    }
    if (!state.booking.time) {
      const firstAvail = times.find(t => !slotUnavailable(state.booking.date, t));
      state.booking.time = firstAvail || defaultBookingTime(state.booking.date);
      saveState();
    }
    return bookingShell(2,`<h1 class="ct-title">Chọn ngày và giờ</h1><p class="ct-subtitle">Thời gian hiển thị theo giờ Việt Nam.</p><section class="ct-time-layout">${calendarMarkup()}<div><h2>Giờ bắt đầu · ${dateLabel()}</h2><div class="ct-time-slots">${times.map(t=>{const toMinutes=value=>Number(value.slice(0,2))*60+Number(value.slice(3));const start=toMinutes(t),duration=service().duration;const booked=state.appointments.some(a=>a.date===state.booking.date&&activeAppointment(a)&&start<toMinutes(a.time)+(service(a.serviceId)?.duration||90)&&start+duration>toMinutes(a.time));const no=slotUnavailable(state.booking.date,t)||!state.settings.scheduleOpen;return `<button class="btn ${state.booking.time===t&&!no?'btn-dark':''}${no?' time-slot-unavailable':''}" data-action="time-select" data-time="${t}" title="${booked?'Đã có khách đặt khung giờ này':no?'Khung giờ không khả dụng':'Chọn khung giờ '+t}" aria-label="${t}${booked?' - Đã có khách đặt':''}" ${no?'disabled':''}>${t}${booked?'<small>Đã có khách</small>':''}</button>`}).join('')}</div><p>${icon('clock')} Thời lượng: ${service().duration} phút</p><p class="muted">Giờ đã có lịch hoặc được chặn sẽ không thể chọn.</p></div></section>`,'/booking/location','TIẾP TỤC · ĐỊA ĐIỂM');
  }

  function pageBookingLocation() {
    return bookingShell(3, bookingLocation ? bookingLocation.html() : `<h1 class="ct-title">Địa điểm trang điểm</h1><p class="ct-subtitle" role="status">Đang tải biểu mẫu địa chỉ…</p>`, '/booking/info', 'TIẾP TỤC · THÔNG TIN');
  }
  function pageBookingInfo() {
    const chevronSvg = `<svg class="mockup-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    const refs = state.booking.references || [];

    const body = `
    <h1 class="ct-title">Thông tin & mong muốn</h1>
    <p class="ct-subtitle">Chia sẻ thêm thông tin để Hoàn có thể chuẩn bị tốt nhất cho bạn.</p>
    <div class="mockup-container">
      <form class="ct-form" data-form="info">
        <h2 class="mockup-section-title">Thông tin liên hệ</h2>

        <div class="mockup-grid-2">
          <label class="mockup-field">
            <span class="mockup-label">Họ và tên <span class="mockup-req">*</span></span>
            <input class="mockup-input" type="text" name="name" placeholder="Nhập họ và tên..." value="${esc(state.booking.name || '')}" required>
          </label>

          <label class="mockup-field">
            <span class="mockup-label">Số điện thoại <span class="mockup-req">*</span></span>
            <input class="mockup-input" type="tel" inputmode="tel" name="phone" placeholder="Nhập số điện thoại..." value="${esc(state.booking.phone || '')}" required>
          </label>
        </div>

        <label class="mockup-field full">
          <span class="mockup-label">Email (tùy chọn)</span>
          <input class="mockup-input" type="email" name="email" placeholder="Nhập email của bạn..." value="${esc(state.booking.email || '')}">
        </label>

        <h2 class="mockup-section-title">Mong muốn trang điểm</h2>

        <div class="mockup-grid-2">
          <label class="mockup-field">
            <span class="mockup-label">Phong cách mong muốn <span class="mockup-req">*</span></span>
            <div class="mockup-select-wrapper">
              <select class="mockup-select" name="style" required>
                <option value="" disabled ${!state.booking.style ? 'selected' : ''}>Chọn phong cách trang điểm</option>
                ${[...new Set([state.booking.style, 'Tự nhiên · Trong trẻo', 'Thanh lịch · Cuốn hút', 'Hiện đại · Cá tính', 'Cô dâu lộng lẫy', 'Theo ảnh tham khảo'].filter(Boolean))].map(s => `<option value="${esc(s)}" ${state.booking.style === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}
              </select>
              ${chevronSvg}
            </div>
          </label>

          <label class="mockup-field">
            <span class="mockup-label">Tình trạng da</span>
            <div class="mockup-select-wrapper">
              <select class="mockup-select" name="skin">
                <option value="" ${!state.booking.skin ? 'selected' : ''}>Chọn tình trạng da</option>
                ${['Da thường', 'Da khô', 'Da dầu', 'Da hỗn hợp', 'Da nhạy cảm', 'Chưa rõ'].map(s => `<option value="${s}" ${state.booking.skin === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
              ${chevronSvg}
            </div>
          </label>
        </div>

        <div class="mockup-grid-2">
          <label class="mockup-field">
            <span class="mockup-label">Dị ứng mỹ phẩm</span>
            <div class="mockup-select-wrapper">
              <select class="mockup-select" name="allergy">
                <option value="" ${!state.booking.allergy ? 'selected' : ''}>Chọn thông tin</option>
                ${['Không', 'Có dị ứng mỹ phẩm', 'Chưa rõ'].map(a => `<option value="${a}" ${state.booking.allergy === a ? 'selected' : ''}>${a}</option>`).join('')}
              </select>
              ${chevronSvg}
            </div>
          </label>

          <label class="mockup-field">
            <span class="mockup-label">Mỹ phẩm hoặc thành phần cần tránh</span>
            <input class="mockup-input" type="text" name="allergyNote" placeholder="Nhập mỹ phẩm hoặc thành phần cần tránh..." value="${esc(state.booking.allergyNote || '')}">
          </label>
        </div>

        <label class="mockup-field full">
          <span class="mockup-label">Trang phục, sự kiện và yêu cầu riêng (tùy chọn)</span>
          <textarea class="mockup-textarea" name="note" placeholder="Chia sẻ thêm để Hoàn hiểu rõ mong muốn của bạn...">${esc(state.booking.note || '')}</textarea>
        </label>

        <label class="mockup-label" style="margin-top: 24px; margin-bottom: 10px;">Thêm tối đa 3 ảnh tham khảo (tùy chọn)</label>
        <div class="mockup-photo-grid">
          ${[0, 1, 2].map(idx => {
            const url = refs[idx];
            if (url) {
              return `
              <div class="mockup-photo-slot has-image">
                <img src="${esc(url)}" alt="Ảnh tham khảo ${idx + 1}">
                <button type="button" class="mockup-photo-remove" data-action="remove-ref-photo" data-index="${idx}" title="Xóa ảnh">✕</button>
              </div>`;
            } else {
              return `
              <label class="mockup-photo-slot">
                <span class="mockup-photo-plus">+</span>
                <span class="mockup-photo-label">Thêm ảnh</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" data-action="mockup-upload-single" data-index="${idx}" hidden>
              </label>`;
            }
          }).join('')}
        </div>

        <div class="mockup-check-grid-2">
          <label class="mockup-check-box">
            <input type="checkbox" name="zaloNotice" ${state.booking.zaloNotice ? 'checked' : ''}>
            <div>
              <div class="mockup-check-label">Nhận thông báo qua Zalo / email (tùy chọn)</div>
              <div class="mockup-check-sub">Theo kênh đã được thiết lập.</div>
            </div>
          </label>

          <label class="mockup-check-box">
            <input type="checkbox" name="consent" ${state.booking.consent ? 'checked' : ''} required>
            <div>
              <div class="mockup-check-label">Tôi đồng ý chính sách đặt lịch và bảo mật <span class="mockup-req">*</span></div>
              <div class="mockup-check-sub">Vui lòng đọc kỹ trước khi xác nhận.</div>
            </div>
          </label>
        </div>
      </form>
    </div>`;

    return bookingShell(4, body, '/booking/deposit', 'TIẾP TỤC · ĐẶT CỌC');
  }
  function paymentRows(total,deposit,received=0,travel=state.booking.travelFee) {
    return `<div class="ct-money-row"><span>Giá dịch vụ</span><strong>${money(total-Number(travel||0))}</strong></div><div class="ct-money-row"><span>Phí di chuyển</span><strong>${money(Number(travel||0))}</strong></div><div class="ct-money-row"><span>Tổng chi phí</span><strong>${money(total)}</strong></div><div class="ct-money-row ct-emphasis"><span>Cọc yêu cầu</span><strong>${money(deposit)}</strong></div><div class="ct-money-row"><span>Đã thanh toán (sau hoàn)</span><strong>${money(received)}</strong></div><div class="ct-money-row"><span>Còn phải thanh toán</span><strong>${money(Math.max(0,total-received))}</strong></div>`;
  }
  function paymentQR(settings = state.settings) {
    const url = settings.paymentQrUrl || '';
    if (!/^\/api\/uploads\?key=references(?:%2F|\/)[a-zA-Z0-9.-]+$/.test(url)) return '';
    return `<figure class="ct-payment-qr"><img src="${esc(url)}" alt="Mã QR nhận tiền của Hoàn"><figcaption>Mã QR nhận tiền · HOÀN</figcaption><a class="link" href="${esc(url)}" target="_blank" rel="noopener">Mở ảnh QR</a></figure>`;
  }
  function bankReady(settings = state.settings) { return !!(settings.bankName&&settings.bankAccount&&settings.bankOwner); }
  function statusTrack(isPaid, isPending) {
    const isUnpaid = !isPaid && !isPending;
    return `
      <div class="ct-deposit-status-track" role="status" aria-label="Tiến trình thanh toán cọc">
        <div class="track-step ${isUnpaid ? 'active' : 'done'}">
          <span class="track-dot"></span>
          <span class="track-text">Chưa thanh toán</span>
        </div>
        <span class="track-arrow">→</span>
        <div class="track-step ${isPending ? 'active' : isPaid ? 'done' : 'pending'}">
          <span class="track-dot"></span>
          <span class="track-text">Chờ đối soát</span>
        </div>
        <span class="track-arrow">→</span>
        <div class="track-step ${isPaid ? 'active confirmed' : 'pending'}">
          <span class="track-dot ${isPaid ? 'check-dot' : ''}">${isPaid ? '✓' : ''}</span>
          <span class="track-text">Đã nhận cọc</span>
        </div>
      </div>
    `;
  }
  function pageBookingDeposit() {
    const apt = getAppointment(state.booking.code);
    const s = service(apt?.serviceId);
    if (!apt?.phone || !state.paymentInstructionsByCode?.[apt.code]) {
      return bookingShell(5, `<h1 class="ct-title">Đặt cọc giữ lịch</h1><section class="ct-summary"><h2>Tạo mã lịch trước khi chuyển khoản</h2><p>Mã lịch và nội dung chuyển khoản được cấp từ hệ thống để Hoàn đối soát chính xác.</p>${depositPreparationError ? `<p role="alert">${esc(depositPreparationError)}</p>` : ''}<button class="btn btn-dark" data-action="ct-prepare-deposit">${state.booking.code ? 'Tải thông tin thanh toán' : 'Tạo mã lịch & xem thanh toán'}</button> <a class="link" href="#/booking/info">Kiểm tra thông tin</a></section>`, null, '');
    }
    const instructions = state.paymentInstructionsByCode[apt.code];
    const total = Number(apt.total);
    const travelFee = Number(state.bookingDetails?.[apt.code]?.travelFee ?? state.booking.travelFee ?? 0);
    const servicePrice = Math.max(0, total - travelFee);
    const deposit = Math.min(Number(instructions.depositRequired ?? state.settings.deposit ?? 200000), total);
    state.booking.deposit = deposit;
    const code = apt.code;
    if (deposit === 0) return bookingShell(5, `<h1 class="ct-title">Không yêu cầu đặt cọc</h1><section class="ct-summary"><p>Lịch ${esc(code)} đã được ghi nhận. Bạn thanh toán chi phí theo thỏa thuận với Hoàn.</p>${paymentRows(total,0,Number(apt.finance?.netReceived ?? apt.deposit ?? 0),travelFee)}<a class="btn btn-dark" href="#/booking/confirm">Tiếp tục kiểm tra lịch hẹn →</a></section>`, null, '');
    const isPaid = Boolean(apt && apt.paymentStatus === 'received' && Number(apt.deposit) >= deposit);
    const isPending = !isPaid && (
      (apt && apt.paymentStatus === 'pending_verification') ||
      Boolean(apt && apt.paymentStatus === 'pending_verification')
    );
    const paid = Number(apt.finance?.netReceived ?? apt.deposit ?? 0);
    const remaining = Math.max(0, total - paid);
    const toPay = Math.max(0, deposit - paid);
    const receiptData = state.booking.receiptData || '';
    const receiptName = state.booking.receiptName || '';

    const bankName = instructions.bankName || '';
    const bankOwner = instructions.bankOwner || '';
    const bankAccount = instructions.bankAccount || '';
    const customQr = /^\/api\/uploads\?key=references(?:%2F|\/)[a-zA-Z0-9.-]+$/.test(instructions.paymentQrUrl || '') ? instructions.paymentQrUrl : '';
    const bankCode = /^[a-zA-Z0-9]{2,20}$/.test(instructions.bankCode || '') ? instructions.bankCode : /\bMB\b|quân đội/i.test(bankName) ? 'MB' : '';
    const vietQrUrl = bankCode && /^\d{4,30}$/.test(bankAccount) && toPay > 0 ? `https://img.vietqr.io/image/${encodeURIComponent(bankCode)}-${bankAccount}-compact2.png?amount=${toPay}&addInfo=${encodeURIComponent('HOAN '+code)}&accountName=${encodeURIComponent(bankOwner)}` : '';
    const qrUrl = customQr || vietQrUrl;
    const canPay = Boolean((bankName && bankOwner && bankAccount) || customQr);

    const body = `
      <div class="ct-deposit-page">
        <!-- Top header row -->
        <div class="ct-deposit-top-bar">
          <div class="ct-deposit-header-left">
            <div class="ct-deposit-overline">05 / ĐẶT CỌC</div>
            <h1 class="ct-deposit-title">Đặt cọc giữ lịch</h1>
            <p class="ct-deposit-subtitle">Kiểm tra chi phí trước khi chuyển khoản.</p>
          </div>
          
        </div>

        <!-- Mobile Deposit Amount Banner -->
        <div class="ct-deposit-mobile-banner">
          <div class="mb-label">Cọc cần thanh toán</div>
          <div class="mb-amount">${money(deposit)}</div>
          <div class="mb-sub">Mã lịch ${esc(code)}</div>
        </div>

        <!-- Main 2-Column Grid -->
        <div class="ct-deposit-grid">
          <!-- Left Column: Payment Details Card -->
          <div class="ct-deposit-payment-card">
            <!-- Tabs -->
            <div class="ct-deposit-tabs">
              <button type="button" class="deposit-tab active">Chuyển khoản / VietQR</button>

            </div>

            <!-- QR Box with 4 Corner Brackets -->
            <div class="ct-deposit-qr-wrap">
              <div class="ct-deposit-qr-box">
                <span class="corner-bracket top-left"></span>
                <span class="corner-bracket top-right"></span>
                <span class="corner-bracket bottom-left"></span>
                <span class="corner-bracket bottom-right"></span>
                ${qrUrl
                  ? `<img src="${esc(qrUrl)}" alt="Mã VietQR thanh toán cọc" style="width:100%;height:100%;object-fit:contain;">`
                  : `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;text-align:center;">
                      <div class="qr-placeholder-title">VỊ TRÍ MÃ QR</div>
                      <div class="qr-placeholder-sub">Hiển thị khi đã cấu hình</div>
                    </div>`
                }
              </div>
            </div>

            <!-- Bank Details Table -->
            <div class="ct-deposit-bank-info">
              <div class="bank-row">
                <span class="bank-label">Ngân hàng</span>
                <span class="bank-val">${esc(bankName || 'Chưa cấu hình')}</span>
              </div>
              <div class="bank-row">
                <span class="bank-label">Chủ tài khoản</span>
                <span class="bank-val">${esc(bankOwner || 'Chưa cấu hình')}</span>
              </div>
              <div class="bank-row">
                <span class="bank-label">Số tài khoản</span>
                <span class="bank-val-wrap">
                  <span class="bank-val">${esc(bankAccount || 'Chưa cấu hình')}</span>
                  ${bankAccount ? `
                    <button type="button" class="bank-copy-icon-btn" data-action="ct-copy-account" data-value="${esc(bankAccount)}" title="Sao chép số tài khoản">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    </button>
                  ` : ''}
                </span>
              </div>
              <div class="bank-note">Kiểm tra đúng người nhận và nội dung trước khi chuyển tiền.</div>
            </div>

            <!-- Transfer Content Box -->
            <div class="ct-deposit-field-group">
              <label class="deposit-field-label">Nội dung chuyển khoản</label>
              <div class="deposit-copy-input">
                <input type="text" readonly value="HOAN ${esc(code)}" id="transfer-code-val">
                <button type="button" class="copy-btn" data-action="ct-copy-transfer" title="Sao chép nội dung">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                </button>
              </div>
              <div class="deposit-field-sub">Nội dung được tạo theo từng lịch</div>
            </div>

            <!-- Action Buttons: report transfer or proceed -->
            <div class="ct-deposit-actions">
              ${isPaid ? `
                <button type="button" class="btn-deposit-paid btn-deposit-confirmed" data-action="ct-deposit-confirmed-proceed">TIẾP TỤC XÁC NHẬN LỊCH →</button>
              ` : isPending ? `
                <button type="button" class="btn-deposit-paid btn-deposit-pending" disabled aria-disabled="true">ĐANG CHỜ ĐỐI SOÁT</button>
              ` : `
                <button type="button" class="btn-deposit-paid" data-action="ct-report-transfer" ${canPay ? '' : 'disabled'}>TÔI ĐÃ CHUYỂN KHOẢN</button>
              `}
              <a href="#/contact" class="btn-deposit-contact">Liên hệ Hoàn</a>
            </div>
            <div class="deposit-actions-sub ${isPaid ? 'deposit-confirmed-note' : ''}">
              ${isPaid 
                ? '✓ Quản trị viên đã xác nhận nhận cọc — nhấn để hoàn tất lịch hẹn.' 
                : isPending
                ? 'Đã ghi nhận thông báo chuyển khoản — đang chờ đối soát.'
                : canPay ? 'Vui lòng quét mã QR hoặc chuyển khoản, sau đó nhấn "Tôi đã chuyển khoản".' : 'Hoàn chưa thiết lập thông tin nhận tiền. Vui lòng liên hệ trước khi chuyển khoản.'}
            </div>
          </div>

          <!-- Right Column: Invoice & Breakdown -->
          <div class="ct-deposit-summary-card">
            <div class="summary-card-header">
              <h2>Chi tiết thanh toán</h2>
              <span class="summary-sub">Lịch ${esc(code)} · số tiền theo yêu cầu đã lưu.</span>
            </div>

            <div class="summary-rows">
              <div class="summary-row">
                <span>Dịch vụ</span>
                <b>${esc(s.name)}</b>
              </div>
              <div class="summary-row">
                <span>Giá dịch vụ</span>
                <span>${money(servicePrice)}</span>
              </div>
              <div class="summary-row">
                <span>Phí di chuyển</span>
                <span>${money(travelFee)}</span>
              </div>
              <div class="summary-row summary-row-total">
                <span>Tổng chi phí</span>
                <b>${money(total)}</b>
              </div>
              <div class="summary-row summary-row-deposit">
                <span>Cọc cần thanh toán</span>
                <strong>${money(deposit)}</strong>
              </div>
              <div class="summary-row">
                <span>Còn phải thanh toán</span>
                <span>${money(remaining)}</span>
              </div>
              <div class="summary-row">
                <span>Đã nhận hiện tại</span>
                <span>${money(paid)}</span>
              </div>
            </div>

            <!-- Policy Consent Checkbox -->
            <div class="ct-deposit-policy-wrap">
              <div class="policy-check-row">
                <label class="policy-checkbox-label">
                  <input type="checkbox" id="deposit-policy-consent" ${state.booking.depositConsent !== false ? 'checked' : ''}>
                  <span>Tôi đồng ý <button type="button" class="policy-text-btn" data-action="ct-open-deposit-policy">chính sách đặt cọc</button></span>
                </label>
                <button type="button" class="policy-text-btn" data-action="ct-open-reschedule-policy">Đổi lịch &amp; hoàn cọc</button>
              </div>
              <div class="policy-sub">Khoản cọc được trừ vào tổng chi phí.</div>
            </div>

            <!-- Important Notice Box -->
            <div class="ct-deposit-notice-box">
              <div class="notice-icon">!</div>
              <div class="notice-body">
                <div class="notice-title">Thông tin quan trọng</div>
                <p>Bấm báo chuyển khoản chỉ chuyển sang chờ đối soát.</p>
                <p>Chỉ ghi nhận đã nhận cọc sau khi kiểm tra giao dịch thật.</p>
              </div>
            </div>

            <!-- Status Track -->
            ${statusTrack(isPaid, isPending)}

            <p class="deposit-actions-sub">Lịch được xác nhận sau khi Hoàn kiểm tra thông tin và nhận đủ cọc yêu cầu.</p>
          </div>
        </div>
      </div>
    `;

    return bookingShell(5, body, null, '', '', true);
  }

  function pageBookingConfirm() {
    const booking = state.booking, appointment = getAppointment(booking.code);
    if (!appointment?.phone) return bookingShell(6, '<h1 class="ct-title">Kiểm tra lịch hẹn</h1><p class="ct-subtitle">Hoàn tất thông tin và lấy mã lịch trước khi xác nhận.</p><a class="btn" href="#/booking/info">Quay lại thông tin khách hàng</a>', null, '');
    const details = state.bookingDetails?.[appointment.code] || {};
    const received = Number(appointment.finance?.netReceived ?? appointment.deposit ?? 0);
    const deposit = Number(details.depositRequired ?? booking.deposit ?? 0);
    const isPaid = appointment.paymentStatus === 'received' && received >= deposit;
    const isPending = !isPaid && appointment.paymentStatus === 'pending_verification';
    const rows = [['Dịch vụ',service(appointment.serviceId).name],['Ngày giờ',dateLabel(appointment.date)+' · '+appointment.time],['Địa điểm',[appointment.address,appointment.ward,details.city].filter(Boolean).join(', ')],['Phong cách',appointment.style],['Tình trạng da',details.skin],['Dị ứng',[details.allergy,details.allergyNote].filter(Boolean).join(' · ')],['Khách hàng',appointment.customer+' · '+appointment.phone],['Lời nhắn',appointment.note||'Không có']];
    return bookingShell(6, `<h1 class="ct-title">Kiểm tra lịch hẹn</h1><section class="ct-two-col"><article><h2>Thông tin đã gửi · ${esc(appointment.code)}</h2>${rows.map(([title,value])=>`<div class="ct-review-row"><span>${title}</span><b>${esc(value||'—')}</b></div>`).join('')}<p>Muốn thay đổi thông tin? Gửi yêu cầu tại <a class="link" href="#/booking/${esc(appointment.code)}">trang lịch hẹn</a> để Hoàn kiểm tra.</p></article><aside class="ct-summary"><h2>Thanh toán của lịch hẹn</h2>${statusTrack(isPaid,isPending)}${paymentRows(appointment.total,deposit,received,details.travelFee??0)}<p>Hoàn sẽ xác nhận lịch sau khi kiểm tra thông tin và nhận đủ cọc.</p><button class="btn btn-dark btn-wide" data-action="complete-booking">HOÀN TẤT & XEM LỊCH HẸN</button></aside></section>`, null, '');
  }
  function getAppointment(code=bookingCode) {
    return state.appointments.find(a=>a.code===code);
  }
  function missingBooking() {
    return ctPage('lookup','Không tìm thấy lịch hẹn',`<div class="ct-center-cta"><p>Vui lòng tra cứu lại bằng mã lịch và số điện thoại của bạn.</p><a class="btn btn-dark" href="#/lookup">TRA CỨU LỊCH</a></div>`);
  }
  function pageBookingSuccess() {
    const a = getAppointment();
    if (!a) return missingBooking();
    return ctPage('lookup', 'Yêu cầu đặt lịch đã được ghi nhận', `<section class="ct-result"><div class="success-icon">${icon('check')}</div><p>Hoàn sẽ kiểm tra thông tin và khoản cọc để xác nhận lịch của bạn.</p><p class="ct-overline">MÃ LỊCH HẸN</p><h2>${esc(a.code)}</h2><div class="ct-status">${a.paymentStatus==='pending_verification'?'Chờ đối soát':'Chưa thanh toán cọc'} · ${statusLabel(a.status)}</div><div class="ct-summary"><h2>${esc(service(a.serviceId).name)}</h2><p>${dateLabel(a.date)} · ${a.time}</p><p>${esc([a.address,a.ward,a.district].filter(Boolean).join(', '))}</p><div class="ct-money-row"><span>Tổng chi phí</span><strong>${money(a.total)}</strong></div></div><a class="btn btn-dark" href="#/booking/${a.code}">XEM & QUẢN LÝ LỊCH HẸN</a></section>`, 'Đặt lịch / Kết quả');
  }
  function pageBookingDetail(code) {
    const a = getAppointment(code);
    if (!a) return missingBooking();
    const meta = state.bookingDetails?.[code] || {};
    const s = service(a.serviceId);
    const needed = Number(meta.depositRequired ?? Math.min(Number(state.settings.deposit ?? 200000), a.total));
    const isPaid = a.paymentStatus === 'received' && Number(a.deposit) >= needed;
    const isPending = !isPaid && a.paymentStatus === 'pending_verification';
    return ctPage('lookup', 'Chi tiết lịch hẹn', `<div class="ct-detail-top"><b>${esc(a.code)}</b><span class="ct-status">${statusLabel(a.status)}</span><span class="ct-status">${isPaid ? 'Đã nhận cọc' : isPending ? 'Chờ đối soát' : 'Chưa thanh toán'}</span></div><section class="ct-two-col"><article><h2>Thông tin buổi hẹn</h2>${[['Dịch vụ',s.name],['Ngày',dateLabel(a.date)],['Giờ bắt đầu',a.time],['Địa điểm',[a.address,a.ward,a.district,meta.city].filter(Boolean).join(', ')],['Khách hàng',a.customer],['Điện thoại',a.phone],['Phong cách',a.style],['Ghi chú',a.note]].map(([t,v])=>`<div class="ct-money-row"><span>${t}</span><b>${esc(v||'—')}</b></div>`).join('')}<div class="ct-upload-previews">${(meta.references||[]).map(r=>`<img src="${r}" alt="Ảnh phong cách tham khảo">`).join('')}</div>${meta.skin?`<p>Tình trạng da: ${esc(meta.skin)} · Dị ứng: ${esc(meta.allergy)} ${esc(meta.allergyNote||'')}</p>`:''}<div class="ct-actions">${a.status!=='cancelled'&&a.status!=='completed'?`<a class="btn" href="#/booking/${code}/reschedule">Yêu cầu đổi lịch</a><a class="btn" href="#/booking/${code}/cancel">Yêu cầu hủy / hoàn cọc</a>`:''}<button class="btn" data-action="ct-calendar-download" data-code="${code}">Thêm vào lịch</button></div><h3>Chuẩn bị cho buổi hẹn</h3><p>Giữ da sạch và dưỡng ẩm nhẹ. Chuẩn bị ảnh trang phục, phong cách nếu có.</p><a class="link" href="#/contact">Liên hệ Hoàn ${icon('arrow')}</a>${(state.requests||[]).filter(r=>r.code===code).map(r=>`<div class="ct-notice"><b>${esc(r.subject)}</b><p>${esc(r.status==='resolved'?'Đã xử lý':'Chờ xử lý')}</p>${r.reply?`<p>${esc(r.reply)}</p>`:''}</div>`).join('')}</article><aside class="ct-summary"><h2>Thanh toán</h2>${statusTrack(isPaid, isPending)}${paymentRows(a.total,needed,a.deposit,meta.travelFee??Math.max(0,a.total-s.price))}${(a.finance?.received ?? a.deposit)>0?`<a class="btn btn-dark btn-wide" href="#/booking/${code}/receipt">XEM BIÊN NHẬN</a>`:''}${a.deposit<needed&&a.status!=='cancelled'?paymentInstructions(a):''}<button class="btn btn-wide" data-action="ct-refresh">KIỂM TRA TRẠNG THÁI</button></aside></section>`, 'Tra cứu lịch / ' + code);
  }
  function paymentInstructions(a) {
    const settings = state.paymentInstructionsByCode?.[a.code] || state.settings;
    if (!bankReady(settings) && !settings.paymentQrUrl) return '<p>Hoàn chưa thiết lập tài khoản nhận tiền. Vui lòng liên hệ trước khi chuyển khoản.</p>';
    return `${paymentQR(settings)}<h3>Thông tin chuyển khoản</h3>${[['Ngân hàng',settings.bankName],['Chủ tài khoản',settings.bankOwner],['Số tài khoản',settings.bankAccount],['Nội dung','HOAN '+a.code]].map(([title,value])=>`<div class="ct-money-row"><span>${title}</span><strong>${esc(value||'—')}</strong><button class="icon-btn" aria-label="Sao chép ${title}" data-action="ct-copy" data-value="${esc(value||'')}" >${icon('content')}</button></div>`).join('')}<p class="muted">Kiểm tra đúng người nhận. Chỉ báo chuyển khoản sau khi bạn đã thực hiện giao dịch.</p><button class="btn btn-dark btn-wide" data-action="ct-payment-report" data-code="${a.code}" ${a.paymentStatus==='pending_verification'?'disabled':''}>${a.paymentStatus==='pending_verification'?'ĐANG CHỜ ĐỐI SOÁT':'TÔI ĐÃ CHUYỂN KHOẢN'}</button>`;
  }
  function pageReceipt(code) {
    const appointment = getAppointment(code);
    if (!appointment) return missingBooking();
    const finance = appointment.finance || { received: Number(appointment.deposit||0), refunded:0, netReceived:Number(appointment.deposit||0), remaining:Math.max(0,appointment.total-Number(appointment.deposit||0)) };
    if (!finance.received) return ctPage('lookup','Chưa có biên nhận',`<p class="ct-subtitle">Chưa có khoản thu đã được Hoàn đối soát.</p><a class="btn" href="#/booking/${esc(code)}">QUAY LẠI LỊCH HẸN</a>`);
    const history = state.paymentHistoryByCode?.[code] || finance.entries || [];
    return ctPage('lookup','Biên nhận thanh toán',`<article class="ct-receipt">${brandMarkup()}<p class="ct-status">GIAO DỊCH ĐÃ ĐỐI SOÁT</p><h2>${esc(appointment.code)}</h2>${[['Khách hàng',appointment.customer],['Dịch vụ',service(appointment.serviceId).name],['Ngày giờ',dateLabel(appointment.date)+' · '+appointment.time]].map(([title,value])=>`<div class="ct-money-row"><span>${title}</span><b>${esc(value)}</b></div>`).join('')}${[['Tổng chi phí',appointment.total],['Tổng tiền đã nhận',finance.received],['Đã hoàn cho khách',finance.refunded],['Thực nhận sau hoàn',finance.netReceived],['Còn phải thanh toán',appointment.status==='cancelled'?0:finance.remaining]].map(([title,value])=>`<div class="ct-money-row"><span>${title}</span><b>${money(value)}</b></div>`).join('')}${history.length?`<h3>Lịch sử thu / hoàn</h3>${history.map(entry=>`<div class="ct-money-row"><span>${esc(({deposit:'Thu cọc',balance:'Thu phần còn lại',refund:'Hoàn tiền',opening:'Số dư đã nhận chuyển sang',opening_refund:'Khoản hoàn chuyển sang'})[entry.kind]||entry.kind)}${!entry.kind.startsWith('opening')&&entry.occurredAt?' · '+esc(new Date(entry.occurredAt).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})):''}</span><b>${money(entry.amount)}</b></div>`).join('')}`:''}<p>Khoản đã thanh toán được trừ vào tổng chi phí. Biên nhận phản ánh những giao dịch Hoàn đã kiểm tra.</p></article><div class="ct-center-cta"><button class="btn btn-dark" data-action="print">IN / LƯU PDF</button><a class="btn" href="#/booking/${esc(code)}">TRỞ VỀ LỊCH HẸN</a></div>`,'Lịch hẹn / Biên nhận');
  }
  function pageReschedule(code) {
    const a=getAppointment(code);if(!a)return missingBooking();
    return ctPage('lookup','Yêu cầu đổi lịch',`<form class="ct-form ct-lookup" data-form="booking-request"><input type="hidden" name="code" value="${esc(code)}"><input type="hidden" name="subject" value="Yêu cầu đổi lịch"><div class="ct-notice">${esc(service(a.serviceId).name)} · ${dateLabel(a.date)} · ${a.time}</div>${field('date','Ngày mong muốn','date',true,a.date)}${field('time','Giờ mong muốn','time',true,a.time)}<label class="ct-field">Lý do đổi lịch *<textarea name="message" required></textarea></label><p>Ngày giờ mới cần được Hoàn kiểm tra trước khi xác nhận. Lịch hiện tại được giữ trong khi chờ xử lý.</p><a class="link" href="#/policies/change">Chính sách đổi lịch</a><button class="btn btn-dark btn-wide">GỬI YÊU CẦU ĐỔI LỊCH</button><p class="ct-form-status" role="status"></p></form>`,'Lịch hẹn / Đổi lịch');
  }
  function pageCancel(code) {
    const a=getAppointment(code);if(!a)return missingBooking();
    return ctPage('lookup','Yêu cầu hủy / hoàn cọc',`<form class="ct-form ct-lookup" data-form="booking-request"><input type="hidden" name="code" value="${esc(code)}"><input type="hidden" name="subject" value="Yêu cầu hủy / hoàn cọc"><div class="ct-notice">${esc(service(a.serviceId).name)} · ${dateLabel(a.date)} · ${a.time}</div><div class="ct-money-row"><span>Cọc đã nhận</span><b>${money(a.deposit)}</b></div><p>Hoàn sẽ xem xét yêu cầu và thông báo khoản cọc được hoàn theo điều kiện áp dụng. Việc gửi yêu cầu chưa tự động hoàn tiền.</p><a class="link" href="#/policies/cancel">Xem chính sách hủy & hoàn cọc</a><label class="ct-field">Lý do *<textarea name="message" required></textarea></label><label class="ct-check"><input type="checkbox" required> Tôi đã đọc điều kiện hủy lịch và hoàn cọc.</label><button class="btn btn-dark btn-wide">GỬI YÊU CẦU</button><p class="ct-form-status" role="status"></p></form>`,'Lịch hẹn / Hủy lịch');
  }
  function pageSearch() {
    const q=new URLSearchParams(location.hash.split('?')[1]).get('q')||'';const entries=[...state.services.map(s=>[s.name,'/services/'+s.id]),...helpSections.flatMap(s=>s[2]).map(([id,t])=>[t,'/support/'+id]),...policySections.map(([id,t])=>[t,'/policies/'+id]),['Về Hoàn','/about'],['Liên hệ','/contact'],['Tra cứu lịch','/lookup']];
    return ctPage('','Tìm kiếm',`<form data-form="site-search" class="ct-search-form">${icon('search')}<input name="q" value="${esc(q)}" placeholder="Tìm dịch vụ, hướng dẫn…" aria-label="Từ khóa"><button class="btn btn-dark">TÌM KIẾM</button></form><div class="ct-policy-list">${entries.filter(x=>x[0].toLocaleLowerCase('vi').includes(q.toLocaleLowerCase('vi'))).map(([t,p])=>`<a href="#${p}"><h2>${esc(t)}</h2>${icon('arrow')}</a>`).join('')||'<p>Không tìm thấy nội dung phù hợp.</p>'}</div>`);
  }

  const adminLinks = [
    ['overview','grid','Tổng quan'],['appointments','calendar','Lịch hẹn'],['schedule','clock','Lịch làm việc'],
    ['services','tag','Dịch vụ'],['customers','user','Khách hàng'],['payments','card','Thu chi & tiền cọc'],['promotions','ticket','Mã ưu đãi'],
    ['gallery','image','Bộ sưu tập'],['content','content','Nội dung website'],['notifications','bell','Thông báo'],['requests','mail','Yêu cầu hỗ trợ'],
    ['reports','report','Báo cáo'],['permissions','shield','Phân quyền'],['audit','log','Nhật ký'],['settings','settings','Cài đặt'],
    ['visitors','user','Khách truy cập website']
  ];

  function adminShell(active, body, title, subtitle, actions = '') {
    const groups = [
      ['VẬN HÀNH',['overview','appointments','schedule','requests']],
      ['DỮ LIỆU',['services','customers','payments','promotions']],
      ['NỘI DUNG',['gallery','content','notifications']],
      ['HỆ THỐNG',['reports','permissions','audit','settings']],
      ['KHÁCH TRUY CẬP',['visitors']]
    ];
    const headHtml = active === 'schedule' ? '' : `<header class="admin-head"><div><h1>${title}</h1><p>${subtitle}</p></div><div class="admin-head-actions">${actions}</div></header>`;
    const unreadNotifications = (state.notifications || []).filter(notification => notification.status === 'unread').length;
    const notificationBadge = unreadNotifications ? `<b>${unreadNotifications > 99 ? '99+' : unreadNotifications}</b>` : '';
    return `<div class="admin-page"><header class="admin-top"><a class="admin-brand" href="#/admin">HOÀN <small>QUẢN TRỊ VẬN HÀNH</small></a><label class="admin-search-wrap">${icon('search')}<input class="admin-search" id="admin-global-search" placeholder="Tìm lịch hẹn, khách hàng hoặc giao dịch..."></label><div class="admin-user"><a class="admin-view-site-btn" href="#/" target="_blank" title="Xem website khách đặt lịch"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg><span>Xem website</span></a><button class="admin-notification" aria-label="Thông báo${unreadNotifications ? `, ${unreadNotifications} chưa đọc` : ''}" data-action="goto-notifications" title="${unreadNotifications ? `${unreadNotifications} thông báo chưa đọc` : 'Không có thông báo mới'}">${icon('bell')}${notificationBadge}</button><span class="admin-profile" data-action="goto-profile" title="Hoàn Nguyễn - Quản trị viên"><i>HN</i><span>Hoàn Nguyễn<small>Quản trị viên</small></span></span></div></header><div class="admin-layout"><aside class="admin-sidebar">${groups.map(g=>`<div class="admin-group-title">${g[0]}</div>${g[1].map(key=>{const l=adminLinks.find(x=>x[0]===key);return `<a class="admin-link ${active===key?'active':''}" href="#/admin/${key==='overview'?'':key}">${icon(l[1],l[2])}<span>${l[2]}</span></a>`}).join('')}`).join('')}</aside><main id="main" class="admin-content" data-admin-page="${active}">${headHtml}${body}</main></div></div>`;
  }

  function adminOverview() {
    const appts = state.appointments;
    const today = localIso(new Date());
    const currentMonth = today.slice(0,7);
    const todayRows = appts.filter(a=>a.date===today && a.status!=='cancelled');
    const pending = appts.filter(a=>a.status==='pending').length;
    const paymentPending = appts.filter(a=>a.paymentStatus==='pending_verification').length;
    const deposits = appts.reduce((sum,appointment)=>sum+Number(appointment.finance?.netReceived ?? appointment.deposit ?? 0),0);
    const rescheduleRequests = (state.requests || []).filter(r => r.code && /đổi lịch|đổi ngày|reschedule/i.test(String(r.subject || '')) && ['pending','in_progress'].includes(r.status || 'pending')).length;
    const revenue = cashNet(actualCashEntries().filter(entry => transactionDay(entry).startsWith(currentMonth)));
    const body = `${state.backendError?`<div class="data-alert">Không thể tải dữ liệu: ${state.backendError}</div>`:''}<section class="stat-grid"><div class="stat-card"><small>Lịch hôm nay</small><strong class="numeric">${String(todayRows.length).padStart(2,'0')}</strong><span>Dữ liệu cập nhật trực tiếp</span></div><div class="stat-card"><small>Chờ xác nhận</small><strong class="numeric">${String(pending).padStart(2,'0')}</strong><span>${pending?'Cần kiểm tra lịch mới':'Không có lịch chờ'}</span></div><div class="stat-card"><small>Thực còn giữ từ khách</small><strong class="numeric">${money(deposits)}</strong><span>${paymentPending} giao dịch chờ đối soát</span></div><div class="stat-card"><small>Thu ròng tháng</small><strong class="numeric">${money(revenue)}</strong><span>Tiền thực thu trừ tiền đã hoàn</span></div></section><section class="admin-grid"><div class="admin-section"><div class="section-head"><h2>Dòng lịch hôm nay</h2><a class="link wine" href="#/admin/appointments">Xem toàn bộ lịch hẹn →</a></div>${appointmentsTable(todayRows)}</div><aside class="admin-section"><h2>Cần xử lý</h2><div class="task-item"><span class="task-num numeric">${String(pending).padStart(2,'0')}</span><div><b>Lịch chờ xác nhận</b><small class="muted">Cập nhật theo dữ liệu thật</small></div>→</div><div class="task-item"><span class="task-num numeric">${String(paymentPending).padStart(2,'0')}</span><div><b>Giao dịch cần đối soát</b><small class="muted">Chưa ghi nhận tiền cọc</small></div>→</div><div class="task-item"><span class="task-num numeric">${String(rescheduleRequests).padStart(2,'0')}</span><div><b>Yêu cầu đổi lịch</b><small class="muted">${rescheduleRequests?'Cần kiểm tra lịch mới':'Không có yêu cầu mới'}</small></div>→</div></aside></section><section class="admin-grid rule"><div class="admin-section"><h2>Thu ròng 7 ngày</h2>${lineChart()}</div><div class="admin-section"><h2>Hiệu suất dịch vụ</h2>${barChart()}</div></section>`;
    return adminShell('overview',body,'Tổng quan hôm nay',formatLongDate(new Date()),`<button class="btn" data-action="export-report">${icon('download')} Xuất báo cáo</button><button class="btn btn-dark" data-action="new-appointment">${icon('plus')} Tạo lịch hẹn</button>`);
  }

  function appointmentsTable(rows) {
    return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Giờ</th><th>Khách hàng</th><th>Dịch vụ</th><th>Khu vực</th><th>Thanh toán</th><th>Trạng thái</th><th style="min-width:320px;">Thao tác</th></tr></thead><tbody>${rows.length?rows.map(a=>{
      const isConf = (a.status === 'confirmed' || a.paymentStatus === 'received');
      return `<tr class="clickable-row" data-action="admin-view-appointment" data-code="${a.code}" title="Nhấp vào dòng để xem chi tiết lịch hẹn"><td class="numeric"><b>${a.time}</b></td><td><b class="row-hover-link">${esc(a.customer)}</b><br><small class="numeric" style="color:#6b7280;">${a.phone}</small></td><td>${service(a.serviceId).name}</td><td>${esc(a.ward || state.bookingDetails?.[a.code]?.city || a.district || '—')}<br>${adminLocations?.shortcut(a, state.bookingDetails?.[a.code]) || ''}</td><td class="numeric">${a.deposit>0?'Đã thu '+money(a.finance?.netReceived ?? a.deposit):a.paymentStatus==='pending_verification'?'Chờ đối soát':'Chưa thanh toán'}</td><td><span class="badge ${a.status==='confirmed'?'success':a.status==='pending'?'warning':''}">${statusLabel(a.status)}</span></td><td><div class="table-actions"><button class="action-btn action-btn-view" data-action="admin-view-appointment" data-code="${a.code}" title="Xem chi tiết lịch hẹn">${icon('eye')}<span>Xem</span></button><button class="action-btn action-btn-edit" data-action="admin-edit-appointment" data-code="${a.code}" title="Chỉnh sửa thông tin lịch hẹn">${icon('edit')}<span>Sửa</span></button><button class="action-btn action-btn-delete" data-action="admin-delete-appointment" data-code="${a.code}" title="Xóa lịch hẹn khỏi hệ thống">${icon('trash')}<span>Xóa</span></button><button class="action-btn action-btn-status" data-action="admin-status" data-code="${a.code}" title="Đổi trạng thái lịch">${icon('clock')}<span>Trạng thái</span></button>${!isConf?`<button class="action-btn action-btn-deposit" data-action="admin-confirm-deposit" data-code="${a.code}" title="Quản trị duyệt cọc">${icon('check')}<span>Duyệt cọc</span></button>`:`<button class="action-btn action-btn-reset" data-action="admin-reset-deposit" data-code="${a.code}" title="Ghi phiếu hoàn tiền"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg><span>Hoàn cọc</span></button>`}</div></td></tr>`;
    }).join(''):'<tr><td colspan="7"><div class="empty-table">Chưa có lịch hẹn. Lịch khách đặt sẽ xuất hiện tại đây.</div></td></tr>'}</tbody></table></div>`;
  }

  function lineChart() {
    const days = Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return localIso(d)});
    const values = days.map(day => cashNet(actualCashEntries().filter(entry => transactionDay(entry) === day)));
    const min = Math.min(0,...values), max = Math.max(...values,1), range = Math.max(1,max-min);
    const points = values.map((value,index)=>[index*95,150-((value-min)/range)*112]);
    return `<div class="chart"><div class="chart-line"><svg viewBox="0 0 600 180" role="img" aria-label="Thu ròng thực tế trong bảy ngày, tính theo ngày giao dịch"><polyline fill="none" stroke="#7a1832" stroke-width="3" points="${points.map(p=>p.join(',')).join(' ')}"></polyline>${points.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#7a1832"></circle>`).join('')}</svg></div></div>`;
  }
  function barChart() {
    const total=Math.max(state.appointments.filter(a=>a.status!=='cancelled').length,1);
    const rows=state.services.map(s=>[s.name.replace('Trang điểm ',''),Math.round(state.appointments.filter(a=>a.serviceId===s.id&&a.status!=='cancelled').length/total*100)]).filter(r=>r[1]>0);
    return rows.length?`<div class="bar-chart">${rows.map(r=>`<div class="bar-row"><span>${r[0]}</span><div class="bar-track"><div class="bar-fill" style="width:${r[1]}%"></div></div><b class="numeric">${r[1]}%</b></div>`).join('')}</div>`:'<div class="empty-table">Chưa có dữ liệu dịch vụ.</div>';
  }

  function adminAppointments() {
    const body = `<div class="toolbar"><input id="appointment-search" placeholder="Tìm theo khách hàng, mã lịch..."><select id="appointment-status"><option value="all">Tất cả trạng thái</option><option value="confirmed">Đã xác nhận</option><option value="pending">Chờ xác nhận</option><option value="completed">Đã hoàn thành</option></select><input type="date" id="appointment-date"><button class="btn btn-sm" data-action="reset-appointment-filter">Đặt lại</button></div><div id="appointments-table">${appointmentsTable(state.appointments)}</div>`;
    return adminShell('appointments',body,'Lịch hẹn','Quản lý toàn bộ lịch hẹn và trạng thái phục vụ.',`<button class="btn" data-action="export-appointments">${icon('download')} Xuất danh sách</button><button class="btn btn-dark" data-action="new-appointment">${icon('plus')} Tạo lịch hẹn</button>`);
  }

  // Clean seed appointments & slots (No mock data)
  const SEED_SCHEDULE_APPOINTMENTS = [];
  const SEED_SCHEDULE_SLOTS = [];

  function ensureScheduleSeedData() {
    if (!state.appointments) state.appointments = [];
    if (!state.scheduleSlots) state.scheduleSlots = [];
    if (!state.customers) state.customers = [];

    // Purge only explicitly known legacy test appointments.
    const staleCodes = ['HMA-090926-BQ0', 'HMA-090926-MQ3', 'HMA-100926-MS7', 'HMA-090926-BIQ', 'HMA-180926-6W2'];
    state.appointments = (state.appointments || []).filter(a =>
      !staleCodes.includes(a.code)
    );
  }

  function modalEditAppointment(code) {
    const a = getAppointment(code);
    if (!a) return toast('Không tìm thấy lịch hẹn');
    const svcs = state.services || [];
    modal(`Chỉnh sửa lịch hẹn — ${a.code}`, `
      <div class="form-grid">
        <div class="field full">
          <label>Khách hàng *</label>
          <input id="modal-edit-customer" value="${esc(a.customer || '')}" placeholder="Họ và tên khách hàng">
        </div>
        <div class="field">
          <label>Số điện thoại *</label>
          <input id="modal-edit-phone" value="${esc(a.phone || '')}" placeholder="Số điện thoại">
        </div>
        <div class="field">
          <label>Dịch vụ</label>
          <select id="modal-edit-service">
            ${svcs.map(s => `<option value="${s.id}" ${s.id === a.serviceId ? 'selected' : ''}>${s.name} (${money(s.price)})</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Ngày hẹn *</label>
          <input id="modal-edit-date" type="date" value="${a.date || ''}">
        </div>
        <div class="field">
          <label>Giờ hẹn *</label>
          <input id="modal-edit-time" type="time" value="${a.time || '09:00'}">
        </div>
        <div class="field">
          <label>Trạng thái lịch</label>
          <select id="modal-edit-status">
            <option value="confirmed" ${a.status === 'confirmed' ? 'selected' : ''}>Đã xác nhận</option>
            <option value="pending" ${a.status === 'pending' ? 'selected' : ''}>Chờ xác nhận</option>
            <option value="completed" ${a.status === 'completed' ? 'selected' : ''}>Đã hoàn thành</option>
            <option value="cancelled" ${a.status === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
          </select>
        </div>
        <div class="field full"><label>Thanh toán đã đối soát</label><p>Thực nhận: <b>${money(a.finance?.netReceived ?? a.deposit)}</b> · Còn phải thu: <b>${money(a.finance?.remaining ?? Math.max(0, a.total - a.deposit))}</b></p><small>Ghi nhận thu hoặc hoàn tại mục Thu chi & tiền cọc để giữ lịch sử giao dịch.</small></div>
        <div class="field">
          <label>Tổng chi phí (VNĐ)</label>
          <input id="modal-edit-total" type="number" step="10000" value="${a.total || 0}">
        </div>
        <div class="field full">
          <label>Địa điểm / Địa chỉ phục vụ</label>
          <input id="modal-edit-address" value="${esc(a.address || '')}" placeholder="Ví dụ: Tại studio HOÀN hoặc địa chỉ khách">
        </div>
        <div class="field full">
          <label>Ghi chú</label>
          <textarea id="modal-edit-note" rows="2" placeholder="Ghi chú yêu cầu của khách...">${esc(a.note || '')}</textarea>
        </div>
      </div>
    `, 'Lưu thay đổi', `edit-appointment:${a.code}`);
  }

  function modalDeleteAppointment(code) {
    const a = getAppointment(code);
    if (!a) return toast('Không tìm thấy lịch hẹn');
    const sName = service(a.serviceId)?.name || a.serviceId;
    modal('Xác nhận xóa lịch hẹn', `
      <div style="font-size:14px;line-height:1.6;color:#1f2937;">
        <p style="font-size:15px;color:#1f2937;margin-bottom:14px;line-height:1.5;">
          Bạn có chắc chắn muốn xóa lịch hẹn của khách hàng <b>${esc(a.customer)}</b>?
        </p>
        <div style="margin-bottom:16px;">
          <div class="summary-row"><span>Mã lịch</span><b class="numeric">${a.code}</b></div>
          <div class="summary-row"><span>Thời gian</span><b class="numeric">${a.time}, ${a.date}</b></div>
          <div class="summary-row"><span>Dịch vụ</span><b>${esc(sName)}</b></div>
          <div class="summary-row"><span>Số điện thoại</span><b class="numeric">${a.phone || '—'}</b></div>
        </div>
        <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.5;">
          Dữ liệu lịch hẹn sau khi xóa sẽ được gỡ hoàn toàn khỏi hệ thống và không thể khôi phục.
        </p>
      </div>
    `, 'Xác nhận xóa', `delete-appointment:${a.code}`, 'btn-danger');
  }

  function modalAddSlot(defaultDate = '', defaultTime = '09:00', defaultEndTime = '10:15') {
    const d = defaultDate || localIso();
    const svcs = state.services || [];
    modal('Thêm khung giờ', `
      <div class="form-grid">
        <div class="field">
          <label>Ngày áp dụng</label>
          <input id="modal-slot-date" type="date" value="${d}">
        </div>
        <div class="field">
          <label>Loại khung giờ</label>
          <select id="modal-slot-type" onchange="window.onSlotTypeChange?.(this.value)">
            <option value="appointment">Lịch hẹn khách hàng</option>
            <option value="available">Mở nhận lịch (Còn trống)</option>
            <option value="travel">Thời gian di chuyển</option>
            <option value="break">Nghỉ giữa lịch</option>
            <option value="blocked">Không khả dụng (Chặn giờ)</option>
          </select>
        </div>
      </div>
      <div class="form-grid">
        <div class="field">
          <label>Giờ bắt đầu</label>
          <input id="modal-slot-start" type="time" value="${defaultTime}">
        </div>
        <div class="field">
          <label>Giờ kết thúc</label>
          <input id="modal-slot-end" type="time" value="${defaultEndTime}">
        </div>
      </div>
      <div class="field" id="modal-slot-title-wrap">
        <label id="modal-slot-title-label">Khách hàng / Tiêu đề</label>
        <input id="modal-slot-title" placeholder="Nhập họ tên khách hàng...">
      </div>
      <div class="form-grid" id="modal-slot-apt-wrap">
        <div class="field">
          <label>Dịch vụ</label>
          <select id="modal-slot-service">
            ${svcs.map(s => `<option value="${s.id}">${s.name} (${s.duration}p)</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Số điện thoại</label>
          <input id="modal-slot-phone" placeholder="Số điện thoại khách...">
        </div>
      </div>
      <div class="field">
        <label>Ghi chú / Địa điểm</label>
        <input id="modal-slot-note" placeholder="Địa chỉ hoặc ghi chú riêng...">
      </div>
    `, 'Thêm khung giờ', 'create-slot');

    window.onSlotTypeChange = (type) => {
      const aptWrap = document.getElementById('modal-slot-apt-wrap');
      const titleLabel = document.getElementById('modal-slot-title-label');
      const titleInput = document.getElementById('modal-slot-title');
      if (type === 'appointment') {
        if (aptWrap) aptWrap.style.display = 'grid';
        if (titleLabel) titleLabel.textContent = 'Khách hàng';
        if (titleInput) { titleInput.value = ''; titleInput.placeholder = 'Họ và tên khách hàng...'; }
      } else if (type === 'travel') {
        if (aptWrap) aptWrap.style.display = 'none';
        if (titleLabel) titleLabel.textContent = 'Tiêu đề';
        if (titleInput) { titleInput.value = 'Di chuyển'; titleInput.placeholder = 'Di chuyển...'; }
      } else if (type === 'break') {
        if (aptWrap) aptWrap.style.display = 'none';
        if (titleLabel) titleLabel.textContent = 'Tiêu đề';
        if (titleInput) { titleInput.value = 'Nghỉ giữa lịch'; titleInput.placeholder = 'Nghỉ giữa lịch...'; }
      } else if (type === 'blocked') {
        if (aptWrap) aptWrap.style.display = 'none';
        if (titleLabel) titleLabel.textContent = 'Lý do / Khu vực';
        if (titleInput) { titleInput.value = 'Không khả dụng'; titleInput.placeholder = 'Không khả dụng / Lý do...'; }
      } else {
        if (aptWrap) aptWrap.style.display = 'none';
        if (titleLabel) titleLabel.textContent = 'Ghi chú khung giờ';
        if (titleInput) { titleInput.value = ''; titleInput.placeholder = 'Còn trống (Nhận khách)...'; }
      }
    };
  }

  function adminSchedule() {
    const ALL_HOURS = hourlyTimes();
    const monday = mondayForOffset(state.adminWeekOffset);
    const dayDates = Array.from({length:7}, (_,i) => { const d = new Date(monday); d.setDate(monday.getDate()+i); return d; });
    const dayNames = ['T2','T3','T4','T5','T6','T7','CN'];
    const todayIso = localIso(new Date());

    // Stale codes to exclude
    const staleCodes = ['HMA-090926-BQ0', 'HMA-090926-MQ3', 'HMA-100926-MS7', 'HMA-090926-BIQ', 'HMA-180926-6W2'];

    // Determine which days are "open" (on)
    const dayOpen = state.settings.weekDayOpen || [true,true,true,true,true,true,false];

    // Build range label
    const rangeLabel = `${String(dayDates[0].getDate()).padStart(2,'0')}–${String(dayDates[6].getDate()).padStart(2,'0')} tháng ${dayDates[6].getMonth()+1}, ${dayDates[6].getFullYear()}`;

    // Service name shortener
    const shortSvc = (sid) => {
      const s = service(sid);
      return s ? s.name : 'Dịch vụ';
    };

    const timeToMin = (t) => {
      if (!t) return 0;
      const [h, m] = t.split(':').map(Number);
      return h * 60 + (m || 0);
    };

    const HOUR_HEIGHT = 68; // px per hour
    const START_MIN = 0;

    // Render day column with continuous timeline events
    const renderDayColumn = (dateObj, dayIdx) => {
      const iso = localIso(dateObj);
      const isOpen = Boolean(dayOpen[dayIdx]);

      // 1. Clickable background slots for each hour
      const bgSlots = ALL_HOURS.map(h => {
        const isOff = !isOpen;
        if (isOff) {
          return `<div class="schv2-day-bg-slot schv2-slot-off" data-action="add-slot-at" data-date="${iso}" data-hour="${h}" title="Ngoài giờ làm việc"></div>`;
        }
        return `<div class="schv2-day-bg-slot" data-action="add-slot-at" data-date="${iso}" data-hour="${h}" title="Bấm để thêm khung giờ tại ${h}"></div>`;
      });

      // 2. Events on this day
      const eventCards = [];

      if (isOpen) {
        // Appointments
        const dayApts = state.appointments.filter(a => a.date === iso && a.status === 'confirmed' && !staleCodes.includes(a.code));
        for (const a of dayApts) {
          const startMin = timeToMin(a.time);
          const endLabel = a.endTime || addMinutes(a.time, 75);
          const hourKey = (a.time || '').slice(0, 2) + ':00';
          const hourIdx = ALL_HOURS.indexOf(hourKey);
          const top = (hourIdx >= 0 ? hourIdx : Math.round((startMin - START_MIN) / 60)) * HOUR_HEIGHT + 5;
          const height = HOUR_HEIGHT - 10;

          eventCards.push(`
            <div class="schv2-card schv2-card-apt" style="top: ${top}px; height: ${height}px;" data-action="admin-view-appointment" data-code="${a.code}" title="${esc(a.customer)} — ${shortSvc(a.serviceId)} (${a.time} - ${endLabel})">
              <div class="schv2-card-time">${a.time} - ${endLabel}</div>
              <div class="schv2-card-title">${esc(a.customer)}</div>
              <div class="schv2-card-desc">${shortSvc(a.serviceId)}</div>
            </div>
          `);
        }

        // Schedule Slots (travel, break, blocked)
        const daySlots = (state.scheduleSlots || []).filter(s => s.slotDate === iso && s.status !== 'available');
        for (const s of daySlots) {
          const startMin = timeToMin(s.slotTime);
          const defaultDur = (s.status === 'blocked') ? 120 : 45;
          const endMin = s.endTime ? timeToMin(s.endTime) : (startMin + defaultDur);
          const endLabel = s.endTime || addMinutes(s.slotTime, defaultDur);

          const hourKey = (s.slotTime || '').slice(0, 2) + ':00';
          const hourIdx = ALL_HOURS.indexOf(hourKey);
          const top = (hourIdx >= 0 ? hourIdx : Math.round((startMin - START_MIN) / 60)) * HOUR_HEIGHT + 5;
          const durHours = Math.max(1, Math.round((endMin - startMin) / 60));
          const height = (durHours > 1 && s.status === 'blocked') ? (durHours * HOUR_HEIGHT - 10) : (HOUR_HEIGHT - 10);

          if (s.status === 'travel') {
            eventCards.push(`
              <div class="schv2-card schv2-card-travel" style="top: ${top}px; height: ${height}px;" title="Thời gian di chuyển: ${esc(s.note || '')}">
                <div class="schv2-card-time">${s.slotTime} - ${endLabel}</div>
                <div class="schv2-card-title schv2-muted">${esc(s.note || 'Di chuyển')}</div>
              </div>
            `);
          } else if (s.status === 'break') {
            eventCards.push(`
              <div class="schv2-card schv2-card-break" style="top: ${top}px; height: ${height}px;" title="Nghỉ giữa lịch: ${esc(s.note || '')}">
                <div class="schv2-card-time">${s.slotTime} - ${endLabel}</div>
                <div class="schv2-card-title schv2-muted">${esc(s.note || 'Nghỉ giữa lịch')}</div>
              </div>
            `);
          } else if (s.status === 'blocked') {
            eventCards.push(`
              <div class="schv2-card schv2-card-blocked" style="top: ${top}px; height: ${height}px;" title="Không khả dụng: ${esc(s.note || '')}">
                <div class="schv2-card-time">${s.slotTime} - ${endLabel}</div>
                <div class="schv2-card-title">${esc(s.note || 'Không khả dụng')}</div>
                <div class="schv2-card-desc">Không khả dụng</div>
              </div>
            `);
          }
        }
      }

      return `
        <div class="schv2-day-col ${!isOpen ? 'schv2-off-col' : ''}" data-date="${iso}" style="height: ${ALL_HOURS.length * HOUR_HEIGHT}px;">
          ${bgSlots.join('')}
          ${eventCards.join('')}
        </div>
      `;
    };

    // Left hour labels column
    const hourCells = ALL_HOURS.map(h => `<div class="schv2-hour-cell">${h}</div>`).join('');
    const hourCol = `<div class="schv2-hour-col">${hourCells}</div>`;

    // 7 Day columns
    const dayCols = dayDates.map((d, i) => renderDayColumn(d, i)).join('');

    // Day headers
    const dayHeaders = dayDates.map((d, i) => {
      const iso = localIso(d);
      const open = dayOpen[i];
      return `<div class="schv2-day-header">
        <span class="schv2-day-name">${dayNames[i]}</span>
        <span class="schv2-day-date">${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}</span>
        ${!open ? '<span class="schv2-day-off-badge">Nghỉ</span>' : ''}
      </div>`;
    }).join('');

    // Right sidebar settings
    const workStart = state.settings.workStart || '09:00';
    const workEnd   = state.settings.workEnd   || '20:00';
    const breakMin  = state.settings.breakMin  || '30';
    const travelMin = state.settings.travelMin || '45';

    const dayFullNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    const dayToggles = dayFullNames.map((n, i) => {
      const d = dayDates[i];
      const on = dayOpen[i];
      return `<div class="schv2-day-toggle-row">
        <span class="schv2-day-toggle-name">${n}</span>
        <span class="schv2-day-toggle-date">${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}</span>
        <span class="schv2-day-toggle-status ${on ? 'on' : 'off'}">${on ? 'Bật' : 'Tắt'}</span>
        <button class="toggle ${on ? 'on' : ''}" data-action="toggle-weekday" data-index="${i}" aria-label="Bật tắt ${n}"></button>
      </div>`;
    }).join('');

    // Compute real conflicts between appointments
    const activeAppts = (state.appointments || []).filter(activeAppointment);
    const conflicts = [];
    for (let i = 0; i < activeAppts.length; i++) {
      for (let j = i + 1; j < activeAppts.length; j++) {
        const a1 = activeAppts[i], a2 = activeAppts[j];
        if (a1.date === a2.date) {
          const s1 = timeToMin(a1.time), e1 = a1.endTime ? timeToMin(a1.endTime) : (s1 + (service(a1.serviceId)?.duration || 75));
          const s2 = timeToMin(a2.time), e2 = a2.endTime ? timeToMin(a2.endTime) : (s2 + (service(a2.serviceId)?.duration || 75));
          if (s1 < e2 && s2 < e1) {
            conflicts.push({ a1, a2 });
          }
        }
      }
    }

    const conflictAlertHtml = conflicts.length > 0 ? `
      <div class="schv2-conflict-alert" data-action="view-conflicts">
        <div class="schv2-alert-left">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>${conflicts.length} xung đột cần xử lý</span>
        </div>
        <svg class="schv2-alert-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    ` : `
      <div class="schv2-conflict-alert schv2-no-conflict" style="background:#f0fdf4;border:1.5px solid #bbf7d0;color:#166534;cursor:default;">
        <div class="schv2-alert-left" style="color:#166534;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m5 12 4 4L19 6"/>
          </svg>
          <span style="color:#166534;font-weight:600;">Lịch trình thông suốt</span>
        </div>
      </div>
    `;

    const body = `
      <div class="schv2-page">
        <!-- Page Title & Main Heading -->
        <h1 class="schv2-page-title">Lịch làm việc</h1>

        <!-- Toolbar matching reference UI -->
        <div class="schv2-toolbar">
          <div class="schv2-toolbar-left">
            <button class="schv2-btn-today" data-action="week-today">Hôm nay</button>
            <div class="schv2-nav-group">
              <button class="schv2-btn-nav" data-action="week-prev" aria-label="Tuần trước">&#8249;</button>
              <button class="schv2-btn-nav" data-action="week-next" aria-label="Tuần sau">&#8250;</button>
            </div>
            <span class="schv2-range-label">${rangeLabel}</span>
          </div>
          <div class="schv2-toolbar-right">
            <button class="schv2-btn-block" data-action="block-time">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
              </svg>
              Chặn thời gian
            </button>
            <button class="schv2-btn-add" data-action="add-slot">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Thêm khung giờ
            </button>
          </div>
        </div>

        <!-- Main 2-column layout -->
        <div class="schv2-main">
          <!-- Calendar Panel -->
          <div class="schv2-calendar">
            <!-- Header row -->
            <div class="schv2-header-row">
              <div class="schv2-hour-col-head">Giờ</div>
              ${dayHeaders}
            </div>

            <!-- Scrollable Grid Body -->
            <div class="schv2-grid-body">
              ${hourCol}
              ${dayCols}
            </div>
          </div>

          <!-- Right Sidebar -->
          <aside class="schv2-sidebar">
            ${conflictAlertHtml}

            <!-- Settings Panel -->
            <div class="schv2-settings-panel">
              <div class="schv2-settings-title">Thiết lập tuần</div>
              
              <div class="schv2-settings-row">
                <span>Giờ làm việc</span>
                <span class="schv2-settings-val">${workStart} – ${workEnd}</span>
              </div>
              <div class="schv2-settings-row">
                <span>Nghỉ giữa lịch</span>
                <span class="schv2-settings-val">${breakMin} phút</span>
              </div>
              <div class="schv2-settings-row">
                <span>Thời gian di chuyển</span>
                <span class="schv2-settings-val">${travelMin} phút</span>
              </div>

              <div class="schv2-day-toggles">
                ${dayToggles}
              </div>

              <div class="schv2-holidays">
                <div class="schv2-settings-title" style="margin-top:16px; margin-bottom: 8px;">Ngày nghỉ sắp tới</div>
                ${(state.settings.holidays || [{date:'15/09', note:'Nghỉ cá nhân'}]).map(h =>
                  `<div class="schv2-holiday-row"><span class="schv2-holiday-date">${h.date}</span><span class="schv2-holiday-note">${h.note}</span></div>`
                ).join('')}
              </div>
            </div>

            <!-- Sidebar Actions -->
            <div class="schv2-sidebar-actions">
              <button class="schv2-save-btn" data-action="save-schedule">Lưu thiết lập</button>
              <button class="schv2-copy-btn" data-action="copy-week">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Sao chép sang tuần sau
              </button>
            </div>
          </aside>
        </div>
      </div>
    `;

    return adminShell('schedule', body, 'Lịch làm việc', '', '');
  }

  function addMinutes(timeStr, mins) {
    if (!timeStr) return '10:00';
    const [h,m] = timeStr.split(':').map(Number);
    const total = (h || 0) * 60 + (m || 0) + mins;
    return String(Math.floor(total/60)).padStart(2,'0') + ':' + String(total%60).padStart(2,'0');
  }

  function adminServices() {
    const body = `<div class="admin-card-grid">${state.services.map((s,i)=>`<article class="admin-card"><div class="section-head"><span class="wine">0${i+1}</span><button class="toggle ${s.enabled?'on':''}" data-action="toggle-service" data-id="${s.id}" aria-label="Bật tắt ${s.name}"></button></div><h3>${s.name}</h3><p class="muted">${s.description}</p><div class="summary-row"><span>Thời lượng</span><b>${s.duration} phút</b></div><div class="summary-row"><span>Giá</span><b>${s.contact?'Liên hệ':money(s.price)}</b></div><div class="admin-card-actions"><button class="btn btn-sm" data-action="edit-service" data-id="${s.id}">${icon('edit')} Chỉnh sửa</button><button class="btn btn-sm btn-danger" data-action="delete-service" data-id="${s.id}">${icon('trash')} Xóa</button></div></article>`).join('')}</div>`;
    return adminShell('services',body,'Dịch vụ','Quản lý nội dung, thời lượng, giá và trạng thái hiển thị.',`<button class="btn btn-dark" data-action="add-service">${icon('plus')} Thêm dịch vụ</button>`);
  }

  function adminCustomers() {
    const body = `<div class="toolbar"><input id="customer-search" placeholder="Tìm tên, số điện thoại, email..."><select><option>Tất cả khách hàng</option><option>Khách quay lại</option><option>Khách mới</option></select></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Khách hàng</th><th>Liên hệ</th><th>Số lần đặt</th><th>Tổng chi tiêu</th><th>Ghi chú</th><th style="min-width:120px;">Thao tác</th></tr></thead><tbody id="customer-body">${state.customers.map((c,i)=>`<tr><td><b>${c.name}</b></td><td>${c.phone}<br><small>${c.email}</small></td><td>${c.visits}</td><td>${money(c.spent)}</td><td>${c.note}</td><td><button class="action-btn action-btn-edit" data-action="edit-customer" data-index="${i}">${icon('edit')}<span>Chỉnh sửa</span></button><br>${adminLocations?.customerShortcut(c) || ''}</td></tr>`).join('')}</tbody></table></div>`;
    return adminShell('customers',body,'Khách hàng','Lịch sử đặt lịch, thông tin liên hệ và ghi chú phục vụ.',`<button class="btn" data-action="export-customers">${icon('download')} Xuất danh sách</button><button class="btn btn-dark" data-action="add-customer">${icon('plus')} Thêm khách hàng</button>`);
  }

  function adminPayments() {
    return adminShell('payments', financeAdmin?.html() || '<p role="status">Đang tải sổ thu chi…</p>', 'Thu chi & tiền cọc', 'Theo dõi từng khoản thu, hoàn tiền và số còn phải thu.');
  }

  function adminPromotions() {
    const body = `<div class="toolbar"><input id="promo-search" placeholder="Tìm mã ưu đãi..."><select><option>Tất cả trạng thái</option><option>Đang hoạt động</option><option>Đã kết thúc</option></select></div><div class="admin-card-grid">${state.promotions.map((p,i)=>`<article class="admin-card"><div class="section-head"><span class="badge ${p.active?'success':''}">${p.active?'Đang hoạt động':'Đã tắt'}</span><button class="toggle ${p.active?'on':''}" data-action="toggle-promo" data-index="${i}"></button></div><h3 class="wine">${p.code}</h3><p>${p.type} · <b>${p.value}</b></p><div class="summary-row"><span>Đã sử dụng</span><b>${p.used}/${p.limit}</b></div><div class="admin-card-actions"><button class="btn btn-sm" data-action="edit-promo" data-index="${i}">Chỉnh sửa</button><button class="btn btn-sm btn-danger" data-action="delete-promo" data-index="${i}">Xóa</button></div></article>`).join('')}</div>`;
    return adminShell('promotions',body,'Mã ưu đãi','Tạo và kiểm soát chương trình ưu đãi cho khách hàng.',`<button class="btn btn-dark" data-action="add-promo">${icon('plus')} Tạo mã ưu đãi</button>`);
  }

  function adminGallery() {
    const list = state.portfolio || [];
    const filter = state.adminGalleryFilter || 'all';
    const filtered = list.filter(g => filter === 'all' || g.serviceId === filter || g.tag === filter);
    const body = `
      <div class="toolbar">
        <button class="filter-btn ${filter==='all'?'active':''}" data-action="filter-admin-gallery" data-val="all">Tất cả (${list.length})</button>
        <button class="filter-btn ${filter==='bridal'?'active':''}" data-action="filter-admin-gallery" data-val="bridal">Cô dâu</button>
        <button class="filter-btn ${filter==='party'?'active':''}" data-action="filter-admin-gallery" data-val="party">Dự tiệc</button>
        <button class="filter-btn ${filter==='personal'?'active':''}" data-action="filter-admin-gallery" data-val="personal">Tự nhiên</button>
        <button class="filter-btn ${filter==='photo'?'active':''}" data-action="filter-admin-gallery" data-val="photo">Chụp ảnh</button>
        <button class="btn btn-dark" style="margin-left:auto" data-action="open-add-portfolio-modal">+ Thêm ảnh</button>
      </div>
      <div class="admin-card-grid" id="admin-gallery">
        ${filtered.map((g,i)=>`
          <article class="admin-card">
            <div style="height:220px;overflow:hidden;position:relative;background:#f8f9fa;">
              ${img(g.image,g.title)}
              <span class="badge" style="position:absolute;top:10px;left:10px;background:rgba(0,0,0,0.7);color:#fff;font-size:11px;">${esc(g.tag)}</span>
            </div>
            <h3 style="margin-top:14px;font-size:16px;">${esc(g.title)}</h3>
            <p class="muted" style="font-size:13px;">Gắn dịch vụ: <b>${esc(service(g.serviceId)?.name || g.serviceId)}</b></p>
            <p style="font-size:12px;color:#666;margin:4px 0 12px;">${esc(g.note || 'Không có ghi chú')}</p>
            <div class="admin-card-actions">
              <button class="btn btn-sm" data-action="edit-portfolio-item" data-id="${g.id}">Chỉnh sửa</button>
              <button class="btn btn-sm btn-danger" data-action="delete-portfolio-item" data-id="${g.id}">Xóa ảnh</button>
            </div>
          </article>
        `).join('')}
      </div>
    `;
    return adminShell('gallery',body,'Bộ sưu tập','Quản lý hình ảnh hiển thị theo từng dịch vụ.',`<a class="btn" href="#/gallery">Xem trên website</a>`);
  }

  function adminContent() {
    const body = siteTools
      ? siteTools.cmsWorkspaceHtml()
      : '<div class="cms-workspace"><p>Đang tải CMS…</p></div>';
    return adminShell(
      'content',
      body,
      'Nội dung website',
      'Chỉnh sửa thông tin và hình ảnh theo từng trang.',
      ''
    );
  }

  function legacyAdminContent() {
    const b = state.brand || {};
    const s = state.settings || {};
    const viewMode = state.contentViewMode || (state.contentActiveTab === 'pages' ? 'pages' : 'pages');
    const curTab = state.contentActiveTab || (viewMode === 'pages' ? 'pages' : 'home');

    const tabs = [
      { id: 'pages', icon: '📄', num: '01', name: 'Từng trang (CMS)', desc: 'Chỉnh sửa toàn bộ 42 trang' },
      { id: 'home', icon: '🏠', num: '02', name: 'Trang chủ' },
      { id: 'about', icon: '👤', num: '03', name: 'Về Hoàn' },
      { id: 'services', icon: '💄', num: '04', name: 'Dịch vụ' },
      { id: 'booking', icon: '📅', num: '05', name: 'Đặt lịch' },
      { id: 'policies', icon: '📜', num: '06', name: 'Chính sách' },
      { id: 'contact', icon: '📞', num: '07', name: 'Liên hệ & MXH' },
      { id: 'images', icon: '🖼️', num: '08', name: 'Hình ảnh' },
      { id: 'theme', icon: '🎨', num: '09', name: 'Màu & Giao diện' }
    ];

    let tabHtml = '';
    if (curTab === 'home') {
      tabHtml = `
        <div class="content-tab-head">
          <h2>1. Nội dung Trang chủ (Home Page)</h2>
          <p class="muted" style="margin:0;font-size:13px;">Tùy chỉnh biểu ngữ mở đầu (Hero), khẩu hiệu nghệ thuật, các khối câu chuyện cô dâu, dự tiệc và lời mời đặt lịch.</p>
        </div>

        <div class="content-section-title"><span>Biểu ngữ mở đầu (Hero Banner)</span></div>
        <div class="form-grid">
          <div class="field full">
            <label>Tiêu đề chính trên banner (Hero Title)</label>
            <input name="homeTitle" id="field-home-title" value="${esc(b.homeTitle || 'Một ngày của bạn. Một dấu ấn của Hoàn.')}">
          </div>
          <div class="field">
            <label>Phụ đề biểu ngữ (Hero Subtitle)</label>
            <input name="homeSubtitle" id="field-home-subtitle" value="${esc(b.homeSubtitle || 'TRANG ĐIỂM CÁ NHÂN & CÔ DÂU')}">
          </div>
          <div class="field">
            <label>Ảnh bìa chiến dịch (Campaign Image)</label>
            <input name="campaignImage" id="field-campaign-img" value="${esc(b.campaignImage || '/assets/campaign.png')}">
          </div>
        </div>

        <div class="content-section-title"><span>Khẩu hiệu nghệ thuật & Triết lý</span></div>
        <div class="form-grid">
          <div class="field">
            <label>Khẩu hiệu nghệ thuật (Overline)</label>
            <input name="editorialOverline" id="field-editorial-overline" value="${esc(b.editorialOverline || 'NGHỆ THUẬT CỦA SỰ TINH TẾ')}">
          </div>
          <div class="field">
            <label>Tiêu đề phần câu chuyện (Editorial Title)</label>
            <input name="editorialTitle" id="field-editorial-title" value="${esc(b.editorialTitle || 'Đẹp từ những điều rất riêng')}">
          </div>
          <div class="field full">
            <label>Mô tả ngắn triết lý</label>
            <textarea name="description" id="field-brand-desc" rows="2">${esc(b.description || 'Mỗi diện mạo được thiết kế theo đường nét, phong cách và khoảnh khắc của riêng bạn.')}</textarea>
          </div>
        </div>

        <div class="content-section-title"><span>Khối nổi bật Cô dâu & Dự tiệc</span></div>
        <div class="form-grid">
          <div class="field">
            <label>Tiêu đề khối Cô dâu</label>
            <input name="bridalStoryTitle" value="${esc(b.bridalStoryTitle || 'Khoảnh khắc cô dâu')}">
          </div>
          <div class="field">
            <label>Mô tả khối Cô dâu</label>
            <input name="bridalStoryDesc" value="${esc(b.bridalStoryDesc || 'Tôn lên đường nét. Giữ trọn nét riêng.')}">
          </div>
          <div class="field">
            <label>Ảnh phong cách Cô dâu</label>
            <input name="bridalImage" value="${esc(b.bridalImage || 'bridal-new.png')}">
          </div>
          <div class="field">
            <label>Tiêu đề khối Dự tiệc</label>
            <input name="eveningTitle" value="${esc(b.eveningTitle || 'Sắc thái của buổi tối')}">
          </div>
          <div class="field">
            <label>Ảnh phong cách Dự tiệc</label>
            <input name="partyImage" value="${esc(b.partyImage || 'evening.png')}">
          </div>
        </div>

        <div class="content-section-title"><span>Khối Kêu gọi Đặt lịch (Booking Invite)</span></div>
        <div class="form-grid">
          <div class="field">
            <label>Tiêu đề khối mời đặt lịch</label>
            <input name="inviteTitle" value="${esc(b.inviteTitle || 'Cuộc hẹn dành riêng cho bạn')}">
          </div>
          <div class="field">
            <label>Nhãn nút kêu gọi đặt lịch</label>
            <input name="inviteBtnLabel" value="${esc(b.inviteBtnLabel || 'ĐẶT LỊCH')}">
          </div>
        </div>
      `;
    } else if (curTab === 'about') {
      tabHtml = `
        <div class="content-tab-head">
          <h2>2. Nội dung Trang Về Hoàn (About Page)</h2>
          <p class="muted" style="margin:0;font-size:13px;">Tùy chỉnh câu chuyện làm nghề, hình ảnh minh họa, triết lý 2 phần và các bước trong một buổi hẹn.</p>
        </div>

        <div class="form-grid">
          <div class="field full">
            <label>Tiêu đề trang Về Hoàn</label>
            <input name="aboutTitle" id="field-about-title" value="${esc(b.aboutTitle || 'Vẻ đẹp bắt đầu từ sự thấu hiểu')}">
          </div>
          <div class="field">
            <label>Đường dẫn ảnh minh họa quá trình</label>
            <input name="aboutImage" value="${esc(b.aboutImage || '/assets/about-process.png')}">
          </div>
          <div class="field">
            <label>Chú thích ảnh minh họa</label>
            <input name="aboutCaption" value="${esc(b.aboutCaption || 'Ảnh minh họa quá trình trang điểm')}">
          </div>
          <div class="field full">
            <label>Triết lý làm nghề — Phần 1 (Lắng nghe)</label>
            <textarea name="aboutBio1" rows="3">${esc(b.aboutBio1 || b.aboutBio || 'Mỗi người có đường nét, phong cách và mong muốn riêng. Buổi trang điểm bắt đầu từ việc lắng nghe những điều đó.')}</textarea>
          </div>
          <div class="field full">
            <label>Triết lý làm nghề — Phần 2 (Hài hòa & Tinh tế)</label>
            <textarea name="aboutBio2" rows="3">${esc(b.aboutBio2 || 'Từ lớp nền đến điểm nhấn cuối cùng, hướng thiết kế của Hoàn là sự hài hòa với gương mặt, trang phục và dịp tham dự.')}</textarea>
          </div>
        </div>

        <div class="content-section-title"><span>Quy trình 4 bước buổi hẹn cùng Hoàn</span></div>
        <div class="form-grid">
          <div class="field">
            <label>Bước 1: Tiêu đề</label>
            <input name="processStep1Title" value="${esc(b.processStep1Title || 'Lắng nghe mong muốn')}">
          </div>
          <div class="field">
            <label>Bước 1: Mô tả ngắn</label>
            <input name="processStep1Desc" value="${esc(b.processStep1Desc || 'Hiểu nhu cầu, phong cách và dịp tham dự.')}">
          </div>
          <div class="field">
            <label>Bước 2: Tiêu đề</label>
            <input name="processStep2Title" value="${esc(b.processStep2Title || 'Thống nhất phong cách')}">
          </div>
          <div class="field">
            <label>Bước 2: Mô tả ngắn</label>
            <input name="processStep2Desc" value="${esc(b.processStep2Desc || 'Tư vấn và lựa chọn hướng trang điểm phù hợp.')}">
          </div>
          <div class="field">
            <label>Bước 3: Tiêu đề</label>
            <input name="processStep3Title" value="${esc(b.processStep3Title || 'Trang điểm & hoàn thiện')}">
          </div>
          <div class="field">
            <label>Bước 3: Mô tả ngắn</label>
            <input name="processStep3Desc" value="${esc(b.processStep3Desc || 'Thực hiện theo phong cách đã thống nhất.')}">
          </div>
          <div class="field">
            <label>Bước 4: Tiêu đề</label>
            <input name="processStep4Title" value="${esc(b.processStep4Title || 'Kiểm tra diện mạo')}">
          </div>
          <div class="field">
            <label>Bước 4: Mô tả ngắn</label>
            <input name="processStep4Desc" value="${esc(b.processStep4Desc || 'Cùng xem lại và điều chỉnh để bạn tự tin.')}">
          </div>
          <div class="field full">
            <label>Tiêu đề khối kêu gọi cuối trang Về Hoàn</label>
            <input name="aboutCtaTitle" value="${esc(b.aboutCtaTitle || 'Cùng tìm nét đẹp của bạn')}">
          </div>
        </div>
      `;
    } else if (curTab === 'services') {
      tabHtml = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
          <div>
            <h2 style="margin:0 0 4px;font-size:1.15rem;">3. Trang Dịch vụ & Danh sách Gói</h2>
            <p class="muted" style="margin:0;font-size:13px;">Tùy chỉnh tiêu đề trang, banner tư vấn và trực tiếp bật/tắt/chỉnh sửa tất cả dịch vụ trang điểm.</p>
          </div>
          <button type="button" class="btn btn-dark btn-sm" data-action="add-service">+ Thêm dịch vụ mới</button>
        </div>

        <div class="form-grid" style="margin-bottom:18px;">
          <div class="field">
            <label>Tiêu đề trang Dịch vụ</label>
            <input name="servicesPageTitle" id="field-services-title" value="${esc(b.servicesPageTitle || 'Dịch vụ trang điểm')}">
          </div>
          <div class="field">
            <label>Phụ đề trang Dịch vụ</label>
            <input name="servicesPageSubtitle" value="${esc(b.servicesPageSubtitle || 'Lựa chọn dành cho khoảnh khắc của bạn.')}">
          </div>
          <div class="field">
            <label>Tiêu đề khối tư vấn riêng (Consult Banner)</label>
            <input name="consultTitle" value="${esc(b.consultTitle || 'Tìm phong cách phù hợp')}">
          </div>
          <div class="field">
            <label>Mô tả khối tư vấn riêng</label>
            <input name="consultDesc" value="${esc(b.consultDesc || 'Chia sẻ dịp tham dự, trang phục và mong muốn của bạn cùng Hoàn.')}">
          </div>
        </div>

        <div class="content-section-title"><span>Danh sách dịch vụ đang cung cấp (${state.services.length})</span></div>
        <div class="content-service-list" style="display:flex;flex-direction:column;gap:8px;">
          ${state.services.map((svc, i) => `
            <div class="summary-row" style="background:#fafafa;padding:12px 14px;border:1px solid var(--line);border-radius:4px;display:flex;align-items:center;justify-content:space-between;">
              <div style="display:flex;align-items:center;gap:12px;">
                <span class="numeric" style="color:var(--wine);font-weight:700;font-size:13px;">0${i+1}</span>
                <div>
                  <b style="font-size:14px;color:#111827;">${esc(svc.name)}</b>
                  <small style="display:block;color:#6b7280;margin-top:2px;">${svc.duration} phút · ${svc.contact ? 'Liên hệ báo giá' : money(svc.price)}</small>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:12px;">
                <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;">
                  <button type="button" class="toggle ${svc.enabled ? 'on' : ''}" data-action="toggle-service-status" data-id="${svc.id}" title="${svc.enabled ? 'Đang hiển thị' : 'Đang ẩn'}"></button>
                  <span>${svc.enabled ? 'Hiển thị' : 'Đã ẩn'}</span>
                </label>
                <button type="button" class="action-btn action-btn-edit" data-action="edit-service" data-id="${svc.id}" title="Chỉnh sửa dịch vụ">
                  ${icon('edit')}<span>Sửa</span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } else if (curTab === 'booking') {
      tabHtml = `
        <div class="content-tab-head">
          <h2>4. Quy trình Đặt lịch Khách hàng</h2>
          <p class="muted" style="margin:0;font-size:13px;">Thiết lập thông tin thương hiệu, vai trò, tiêu đề quy trình đặt hẹn và chi phí đặt cọc mặc định.</p>
        </div>
        <div class="form-grid">
          <div class="field">
            <label>Tên thương hiệu chính</label>
            <input name="name" id="field-brand-name" value="${esc(b.name || 'HOÀN')}" required>
          </div>
          <div class="field">
            <label>Vai trò / Danh xưng nghệ sĩ</label>
            <input name="role" id="field-brand-role" value="${esc(b.role || 'MAKEUP ARTIST')}">
          </div>
          <div class="field full">
            <label>Tiêu đề bước chọn dịch vụ (Headline)</label>
            <input name="headline" id="field-brand-headline" value="${esc(b.headline || 'Chọn trải nghiệm trang điểm')}">
          </div>
          <div class="field full">
            <label>Mô tả quy trình đặt lịch</label>
            <textarea name="description" id="field-brand-desc" rows="2">${esc(b.description || 'Mỗi diện mạo được thiết kế theo đường nét, phong cách và khoảnh khắc của riêng bạn.')}</textarea>
          </div>
          <div class="field full">
            <label>Thông điệp trên ảnh đại diện bước đặt lịch</label>
            <input name="imageMessage" id="field-brand-imgmsg" value="${esc(b.imageMessage || 'Mỗi diện mạo là một thiết kế dành riêng cho bạn.')}">
          </div>
          <div class="field">
            <label>Khu vực phục vụ chính</label>
            <input name="area" value="${esc(b.area || 'Hà Nội & phục vụ tận nơi')}">
          </div>
          <div class="field">
            <label>Mức tiền cọc tiêu chuẩn (VNĐ)</label>
            <input name="deposit" type="number" step="10000" value="${esc(s.deposit || 200000)}">
          </div>
          <div class="field">
            <label>Phí di chuyển mặc định (VNĐ)</label>
            <input name="travelFee" type="number" step="10000" value="${esc(s.travelFee || 50000)}">
          </div>
        </div>
      `;
    } else if (curTab === 'policies') {
      tabHtml = `
        <div class="content-tab-head">
          <h2>5. Trang Chính sách & Điều khoản Dịch vụ</h2>
          <p class="muted" style="margin:0;font-size:13px;">Tùy chỉnh nội dung công khai về đặt cọc, đổi ngày giờ, hủy lịch, đến muộn, phục vụ tận nơi và cam kết bảo mật.</p>
        </div>
        <div class="form-grid">
          <div class="field">
            <label>Tiêu đề trang Chính sách</label>
            <input name="policiesPageTitle" id="field-policies-title" value="${esc(b.policiesPageTitle || 'Chính sách dịch vụ')}">
          </div>
          <div class="field">
            <label>Phụ đề trang Chính sách</label>
            <input name="policiesPageSubtitle" value="${esc(b.policiesPageSubtitle || 'Chọn mục để xem đầy đủ điều kiện áp dụng.')}">
          </div>
          <div class="field full">
            <label>Chính sách đặt cọc (Deposit Policy)</label>
            <textarea name="policyDeposit" rows="3">${esc(b.policyDeposit || `Mức cọc tiêu chuẩn hiện tại: ${money(Number(s.deposit || 200000))}. Khoản cọc được trừ vào tổng chi phí.`)}</textarea>
          </div>
          <div class="field full">
            <label>Chính sách đổi ngày giờ (Reschedule Policy)</label>
            <textarea name="policyChange" rows="3">${esc(b.policyChange || 'Yêu cầu trước giờ hẹn ít nhất 24 giờ được xem xét đổi miễn phí một lần, tùy lịch còn trống. Khoản cọc được chuyển sang lịch mới khi yêu cầu được duyệt.')}</textarea>
          </div>
          <div class="field full">
            <label>Chính sách hủy lịch & hoàn cọc (Cancellation & Refund)</label>
            <textarea name="policyCancel" rows="3">${esc(b.policyCancel || 'Yêu cầu hủy trước 48 giờ được xem xét hoàn cọc. Trong vòng 48 giờ, khoản cọc có thể không được hoàn.')}</textarea>
          </div>
          <div class="field full">
            <label>Quy định đến muộn / quá giờ hẹn (Late Arrival)</label>
            <textarea name="policyLate" rows="3">${esc(b.policyLate || 'Nếu muộn quá 15 phút, thời lượng dịch vụ có thể cần điều chỉnh theo lịch hẹn tiếp theo.')}</textarea>
          </div>
          <div class="field full">
            <label>Quy định di chuyển tận nơi (On-location Service)</label>
            <textarea name="policyTravel" rows="3">${esc(b.policyTravel || 'Hoàn phục vụ tại địa chỉ khách cung cấp trong khu vực đã thống nhất. Phí di chuyển được thông báo trước khi đặt cọc.')}</textarea>
          </div>
          <div class="field full">
            <label>Cam kết bảo mật thông tin & hình ảnh (Privacy Policy)</label>
            <textarea name="policyPrivacy" rows="3">${esc(b.policyPrivacy || 'Thông tin liên hệ, địa điểm, lịch hẹn và mong muốn trang điểm được dùng để tổ chức buổi hẹn và bảo mật tuyệt đối.')}</textarea>
          </div>
        </div>
      `;
    } else if (curTab === 'contact') {
      tabHtml = `
        <div class="content-tab-head">
          <h2>6. Thông tin Liên hệ & Kênh Mạng Xã Hội</h2>
          <p class="muted" style="margin:0;font-size:13px;">Đồng bộ số điện thoại Hotline, Zalo tư vấn, Email tiếp nhận, fanpage Facebook, Instagram, TikTok và địa chỉ Studio.</p>
        </div>
        <div class="form-grid">
          <div class="field">
            <label>Tiêu đề trang Liên hệ</label>
            <input name="contactPageTitle" id="field-contact-title" value="${esc(b.contactPageTitle || 'Trao đổi cùng Hoàn')}">
          </div>
          <div class="field">
            <label>Phụ đề trang Liên hệ</label>
            <input name="contactPageSubtitle" value="${esc(b.contactPageSubtitle || 'Chia sẻ mong muốn hoặc vấn đề bạn cần hỗ trợ.')}">
          </div>
          <div class="field">
            <label>Số điện thoại Hotline</label>
            <input name="phone" id="field-contact-phone" value="${esc(b.phone || '0912 345 678')}">
          </div>
          <div class="field">
            <label>Số Zalo tư vấn</label>
            <input name="zaloPhone" value="${esc(b.zaloPhone || b.phone || '0912 345 678')}">
          </div>
          <div class="field full">
            <label>Email liên hệ tiếp nhận</label>
            <input name="email" id="field-contact-email" type="email" value="${esc(b.email || 'contact@hoanmakeup.vn')}">
          </div>
          <div class="field full">
            <label>Địa chỉ Studio / Phục vụ</label>
            <input name="address" value="${esc(b.address || 'Hà Nội & phục vụ tận nơi')}">
          </div>
          <div class="field full">
            <label>Link trang Facebook Fanpage</label>
            <input name="facebookUrl" value="${esc(b.facebookUrl || 'https://facebook.com/hoanmakeup')}">
          </div>
          <div class="field full">
            <label>Link tài khoản Instagram</label>
            <input name="instagramUrl" value="${esc(b.instagramUrl || 'https://instagram.com/hoanmakeup')}">
          </div>
          <div class="field full">
            <label>Link tài khoản TikTok</label>
            <input name="tiktokUrl" value="${esc(b.tiktokUrl || 'https://tiktok.com/@hoanmakeup')}">
          </div>
        </div>
      `;
    } else if (curTab === 'images') {
      tabHtml = `
        <div class="content-tab-head">
          <h2>7. Thư viện Hình ảnh Đại diện & Phong cách</h2>
          <p class="muted" style="margin:0;font-size:13px;">Quản lý toàn bộ ảnh sử dụng trên website: ảnh chiến dịch, ảnh chân dung Hoàn, cô dâu, dự tiệc và ảnh giới thiệu.</p>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <div style="border:1px solid var(--line);padding:12px;background:#fafafa;border-radius:4px;">
            <div style="height:120px;overflow:hidden;background:#050505;display:flex;align-items:center;justify-content:center;margin-bottom:8px;border-radius:2px;">
              <img id="preview-img-campaign" src="${esc(b.campaignImage || '/assets/campaign.png')}" style="max-height:100%;max-width:100%;object-fit:cover;" onerror="this.src='/assets/campaign.png'">
            </div>
            <label style="font-weight:600;font-size:12px;display:block;margin-bottom:4px;">Ảnh chiến dịch trang chủ (Hero)</label>
            <input name="campaignImage" value="${esc(b.campaignImage || '/assets/campaign.png')}" style="font-size:12px;">
            <div style="display:flex;gap:6px;margin-top:6px;">
              <button type="button" class="btn btn-sm" data-action="set-sample-image" data-target="campaignImage" data-val="/assets/campaign.png">Mặc định</button>
            </div>
          </div>
          <div style="border:1px solid var(--line);padding:12px;background:#fafafa;border-radius:4px;">
            <div style="height:120px;overflow:hidden;background:#050505;display:flex;align-items:center;justify-content:center;margin-bottom:8px;border-radius:2px;">
              <img id="preview-img-hero" src="${esc(b.heroImage || '/assets/hero.png')}" style="max-height:100%;max-width:100%;object-fit:cover;" onerror="this.src='/assets/hero.png'">
            </div>
            <label style="font-weight:600;font-size:12px;display:block;margin-bottom:4px;">Ảnh đại diện Hoàn Makeup (Booking)</label>
            <input name="heroImage" value="${esc(b.heroImage || '/assets/hero.png')}" style="font-size:12px;">
            <div style="display:flex;gap:6px;margin-top:6px;">
              <button type="button" class="btn btn-sm" data-action="set-sample-image" data-target="heroImage" data-val="/assets/hero.png">Mặc định</button>
            </div>
          </div>
          <div style="border:1px solid var(--line);padding:12px;background:#fafafa;border-radius:4px;">
            <div style="height:120px;overflow:hidden;background:#050505;display:flex;align-items:center;justify-content:center;margin-bottom:8px;border-radius:2px;">
              <img id="preview-img-bridal" src="/assets/${esc(b.bridalImage || 'bridal-new.png')}" style="max-height:100%;max-width:100%;object-fit:cover;" onerror="this.src='/assets/bridal-new.png'">
            </div>
            <label style="font-weight:600;font-size:12px;display:block;margin-bottom:4px;">Ảnh phong cách Cô dâu</label>
            <input name="bridalImage" value="${esc(b.bridalImage || 'bridal-new.png')}" style="font-size:12px;">
            <div style="display:flex;gap:6px;margin-top:6px;">
              <button type="button" class="btn btn-sm" data-action="set-sample-image" data-target="bridalImage" data-val="bridal-new.png">Mặc định</button>
            </div>
          </div>
          <div style="border:1px solid var(--line);padding:12px;background:#fafafa;border-radius:4px;">
            <div style="height:120px;overflow:hidden;background:#050505;display:flex;align-items:center;justify-content:center;margin-bottom:8px;border-radius:2px;">
              <img id="preview-img-party" src="/assets/${esc(b.partyImage || 'evening.png')}" style="max-height:100%;max-width:100%;object-fit:cover;" onerror="this.src='/assets/evening.png'">
            </div>
            <label style="font-weight:600;font-size:12px;display:block;margin-bottom:4px;">Ảnh phong cách Dự tiệc</label>
            <input name="partyImage" value="${esc(b.partyImage || 'evening.png')}" style="font-size:12px;">
            <div style="display:flex;gap:6px;margin-top:6px;">
              <button type="button" class="btn btn-sm" data-action="set-sample-image" data-target="partyImage" data-val="evening.png">Mặc định</button>
            </div>
          </div>
          <div style="border:1px solid var(--line);padding:12px;background:#fafafa;border-radius:4px;">
            <div style="height:120px;overflow:hidden;background:#050505;display:flex;align-items:center;justify-content:center;margin-bottom:8px;border-radius:2px;">
              <img id="preview-img-about" src="${esc(b.aboutImage || '/assets/about-process.png')}" style="max-height:100%;max-width:100%;object-fit:cover;" onerror="this.src='/assets/about-process.png'">
            </div>
            <label style="font-weight:600;font-size:12px;display:block;margin-bottom:4px;">Ảnh trang Về Hoàn (Quy trình)</label>
            <input name="aboutImage" value="${esc(b.aboutImage || '/assets/about-process.png')}" style="font-size:12px;">
            <div style="display:flex;gap:6px;margin-top:6px;">
              <button type="button" class="btn btn-sm" data-action="set-sample-image" data-target="aboutImage" data-val="/assets/about-process.png">Mặc định</button>
            </div>
          </div>
          <div style="border:1px solid var(--line);padding:12px;background:#fafafa;border-radius:4px;">
            <div style="height:120px;overflow:hidden;background:#050505;display:flex;align-items:center;justify-content:center;margin-bottom:8px;border-radius:2px;">
              <div class="brand-text" style="display:flex;flex-direction:column;align-items:center;color:#fff;">
                <span style="font-family:var(--didone,'Bodoni Moda',serif);font-size:26px;letter-spacing:0.16em;font-weight:500;">HOÀN</span>
                <span style="font-family:var(--sans,Inter,sans-serif);font-size:9.5px;letter-spacing:0.28em;color:rgba(255,255,255,0.75);margin-top:4px;padding-left:0.28em;">MAKEUP ARTIST</span>
              </div>
            </div>
            <label style="font-weight:600;font-size:12px;display:block;margin-bottom:4px;">Logo Thương hiệu HOÀN</label>
            <input value="Typography Text Logo (HOÀN · MAKEUP ARTIST)" disabled style="font-size:12px;background:#eee;">
            <small class="muted" style="display:block;margin-top:6px;font-size:11px;">Định dạng Text Typography cao cấp, sắc nét trên mọi thiết bị</small>
          </div>
        </div>
      `;
    } else if (curTab === 'theme') {
      tabHtml = `
        <div class="content-tab-head">
          <h2>8. Màu sắc Thương hiệu & Chân trang</h2>
          <p class="muted" style="margin:0;font-size:13px;">Tùy chỉnh tông màu nhấn chủ đạo xuyên suốt toàn bộ website, các nút hành động và câu thông điệp chân trang.</p>
        </div>
        <div class="form-grid">
          <div class="field">
            <label>Mã màu nhấn (Hex code)</label>
            <div style="display:flex;gap:8px;align-items:center;">
              <input type="color" id="picker-accent-color" value="${esc(b.accent || '#7A1832')}" style="width:42px;height:40px;padding:2px;border:1px solid var(--line);border-radius:4px;cursor:pointer;" onchange="document.getElementById('input-accent-color').value=this.value;document.documentElement.style.setProperty('--wine',this.value);">
              <input name="accent" id="input-accent-color" value="${esc(b.accent || '#7A1832')}" style="flex:1;" oninput="document.getElementById('picker-accent-color').value=this.value;document.documentElement.style.setProperty('--wine',this.value);">
            </div>
          </div>
          <div class="field">
            <label>Nền chủ đạo website</label>
            <input value="Trắng tinh khôi (#FFFFFF)" disabled>
          </div>
          <div class="field full">
            <label>Lời kết chân trang (Footer Tagline)</label>
            <input name="tagline" value="${esc(b.tagline || 'Vẻ đẹp bắt đầu từ sự thấu hiểu')}">
          </div>
        </div>
        <div style="margin-top:20px;">
          <label style="font-size:13px;font-weight:600;display:block;margin-bottom:8px;">Bảng màu Haute Couture đề xuất:</label>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;">
            <button type="button" class="btn btn-sm" data-action="set-preset-color" data-color="#7A1832" style="border-left:4px solid #7A1832;text-align:left;">Rượu vang đỏ</button>
            <button type="button" class="btn btn-sm" data-action="set-preset-color" data-color="#111827" style="border-left:4px solid #111827;text-align:left;">Đen Onyx</button>
            <button type="button" class="btn btn-sm" data-action="set-preset-color" data-color="#9E7D47" style="border-left:4px solid #9E7D47;text-align:left;">Vàng Champagne</button>
            <button type="button" class="btn btn-sm" data-action="set-preset-color" data-color="#9D4456" style="border-left:4px solid #9D4456;text-align:left;">Hồng Nude</button>
            <button type="button" class="btn btn-sm" data-action="set-preset-color" data-color="#2C4C3E" style="border-left:4px solid #2C4C3E;text-align:left;">Xanh Ngọc Lục</button>
            <button type="button" class="btn btn-sm" data-action="set-preset-color" data-color="#1E293B" style="border-left:4px solid #1E293B;text-align:left;">Xanh Navy</button>
          </div>
        </div>
      `;
    }

    const previewMode = state.contentPreviewMode || (['home','about','services','booking','policies','contact'].includes(curTab) ? curTab : 'home');
    const previewRouteMap = {
      home: '#/',
      about: '#/about',
      services: '#/services',
      booking: '#/booking/service',
      policies: '#/policies',
      contact: '#/contact'
    };

    let previewHtml = '';
    if (previewMode === 'home') {
      previewHtml = `
        <div class="preview-home-box" style="padding:16px;background:#fff;min-height:460px;font-size:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;padding-bottom:10px;margin-bottom:12px;">
            <b style="font-family:var(--serif);font-size:16px;">${esc(b.name || 'HOÀN')}</b>
            <span style="font-size:11px;color:var(--wine);font-weight:600;">${esc(b.role || 'MAKEUP ARTIST')}</span>
          </div>
          <div style="position:relative;height:160px;background:#111;overflow:hidden;border-radius:4px;margin-bottom:14px;">
            <img src="${esc(b.campaignImage || '/assets/campaign.png')}" style="width:100%;height:100%;object-fit:cover;opacity:0.85;" onerror="this.src='/assets/campaign.png'">
            <div style="position:absolute;bottom:12px;left:14px;right:14px;color:#fff;">
              <h4 id="preview-home-title" style="font-size:13px;margin:0 0 2px;line-height:1.3;">${esc(b.homeTitle || 'Một ngày của bạn. Một dấu ấn của Hoàn.')}</h4>
              <p id="preview-home-subtitle" style="font-size:10px;margin:0;opacity:0.8;">${esc(b.homeSubtitle || 'TRANG ĐIỂM CÁ NHÂN & CÔ DÂU')}</p>
            </div>
          </div>
          <div style="text-align:center;padding:10px 14px;background:#fafafa;border-radius:4px;margin-bottom:12px;">
            <p id="preview-home-overline" style="font-size:10px;letter-spacing:0.1em;color:var(--wine);margin:0 0 4px;font-weight:600;">${esc(b.editorialOverline || 'NGHỆ THUẬT CỦA SỰ TINH TẾ')}</p>
            <h4 id="preview-home-edtitle" style="font-size:14px;margin:0 0 6px;font-family:var(--serif);">${esc(b.editorialTitle || 'Đẹp từ những điều rất riêng')}</h4>
            <p style="font-size:11px;color:#6b7280;margin:0;line-height:1.5;">${esc(b.description || 'Mỗi diện mạo được thiết kế riêng.')}</p>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div style="border:1px solid #eee;border-radius:4px;padding:8px;text-align:center;">
              <b style="font-size:11px;display:block;margin-bottom:2px;">${esc(b.bridalStoryTitle || 'Khoảnh khắc cô dâu')}</b>
              <small style="color:#6b7280;font-size:10px;">${esc(b.bridalStoryDesc || 'Tôn lên đường nét.')}</small>
            </div>
            <div style="border:1px solid #eee;border-radius:4px;padding:8px;text-align:center;">
              <b style="font-size:11px;display:block;margin-bottom:2px;">${esc(b.eveningTitle || 'Sắc thái buổi tối')}</b>
              <small style="color:#6b7280;font-size:10px;">Phong cách dự tiệc</small>
            </div>
          </div>
        </div>
      `;
    } else if (previewMode === 'about') {
      previewHtml = `
        <div class="preview-about-box" style="padding:16px;background:#fff;min-height:460px;font-size:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;padding-bottom:10px;margin-bottom:12px;">
            <b style="font-family:var(--serif);font-size:15px;">Về Hoàn</b>
            <span style="font-size:11px;color:var(--wine);font-weight:600;">MAKEUP ARTIST</span>
          </div>
          <h3 id="preview-about-title" style="font-size:15px;margin:0 0 10px;font-family:var(--serif);">${esc(b.aboutTitle || 'Vẻ đẹp bắt đầu từ sự thấu hiểu')}</h3>
          <div style="height:120px;overflow:hidden;background:#222;border-radius:4px;margin-bottom:6px;">
            <img src="${esc(b.aboutImage || '/assets/about-process.png')}" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='/assets/about-process.png'">
          </div>
          <p style="font-size:10px;color:#9ca3af;margin:0 0 12px;font-style:italic;">${esc(b.aboutCaption || 'Ảnh minh họa quá trình trang điểm')}</p>
          <div style="padding:10px;background:#fafafa;border-left:3px solid var(--wine);margin-bottom:10px;line-height:1.5;">
            <p style="margin:0 0 6px;color:#374151;">${esc(b.aboutBio1 || b.aboutBio || 'Mỗi người có đường nét, phong cách và mong muốn riêng.')}</p>
            <p style="margin:0;color:#6b7280;font-size:11px;">${esc(b.aboutBio2 || 'Từ lớp nền đến điểm nhấn cuối cùng...')}</p>
          </div>
          <b style="font-size:11px;display:block;margin-bottom:6px;color:#111827;">Quy trình 4 bước:</b>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:10.5px;">
            <div style="background:#f3f4f6;padding:6px;border-radius:3px;">01. ${esc(b.processStep1Title || 'Lắng nghe')}</div>
            <div style="background:#f3f4f6;padding:6px;border-radius:3px;">02. ${esc(b.processStep2Title || 'Thống nhất')}</div>
            <div style="background:#f3f4f6;padding:6px;border-radius:3px;">03. ${esc(b.processStep3Title || 'Trang điểm')}</div>
            <div style="background:#f3f4f6;padding:6px;border-radius:3px;">04. ${esc(b.processStep4Title || 'Kiểm tra')}</div>
          </div>
        </div>
      `;
    } else if (previewMode === 'services') {
      previewHtml = `
        <div class="preview-services-box" style="padding:16px;background:#fff;min-height:460px;font-size:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;padding-bottom:10px;margin-bottom:12px;">
            <b id="preview-services-title" style="font-family:var(--serif);font-size:15px;">${esc(b.servicesPageTitle || 'Dịch vụ trang điểm')}</b>
            <span style="font-size:10px;color:var(--wine);font-weight:600;">HOÀN</span>
          </div>
          <p style="color:#6b7280;font-size:11px;margin:0 0 12px;">${esc(b.servicesPageSubtitle || 'Lựa chọn dành cho khoảnh khắc của bạn.')}</p>
          <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
            ${state.services.filter(s=>s.enabled).slice(0,3).map((sv,idx)=>`
              <div style="border:1px solid #e5e7eb;border-radius:4px;padding:10px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <b style="font-size:12.5px;display:block;">${esc(sv.name)}</b>
                  <small style="color:#6b7280;font-size:10.5px;">${sv.duration} phút</small>
                </div>
                <span class="numeric" style="font-weight:700;color:var(--wine);font-size:12px;">${sv.contact ? 'Tư vấn riêng' : money(sv.price)}</span>
              </div>
            `).join('')}
          </div>
          <div style="background:#f9fafb;border:1px dashed #d1d5db;border-radius:4px;padding:10px;text-align:center;">
            <b style="font-size:11px;display:block;margin-bottom:2px;">${esc(b.consultTitle || 'Tìm phong cách phù hợp')}</b>
            <p style="font-size:10px;color:#6b7280;margin:0;">${esc(b.consultDesc || 'Chia sẻ dịp tham dự cùng Hoàn.')}</p>
          </div>
        </div>
      `;
    } else if (previewMode === 'booking') {
      previewHtml = `
        <div class="preview-site" id="live-preview-box">
          <div class="preview-art">
            <img src="${esc(b.heroImage || '/assets/hero.png')}" alt="Ảnh đại diện" onerror="this.src='/assets/hero.png'">
            <span id="preview-brand-name">${esc(b.name || 'HOÀN')}</span>
          </div>
          <div class="preview-ui">
            <div class="preview-progress">
              <i></i><i></i><i></i><i></i><i></i><i></i>
            </div>
            <h3 id="preview-headline" style="font-size:1.15rem;margin-top:16px;line-height:1.3;">${esc(b.headline || 'Chọn trải nghiệm trang điểm')}</h3>
            <p id="preview-desc" style="color:#6b7280;font-size:11px;margin:6px 0 14px;">${esc(b.description || 'Mỗi diện mạo được thiết kế theo đường nét riêng bạn.')}</p>
            <div class="preview-services">
              ${state.services.filter(x => x.enabled).map((sv, idx) => `
                <div class="preview-service ${idx===0?'selected':''}" style="${idx===0?`background:#111827;color:#fff;border-left:3px solid ${b.accent || '#7A1832'}`:''}">
                  <b>${esc(sv.name)}</b><br>
                  <small style="opacity:0.8;">${sv.duration} phút · ${sv.contact ? 'Liên hệ' : money(sv.price)}</small>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    } else if (previewMode === 'policies') {
      previewHtml = `
        <div class="preview-policies-box" style="padding:16px;background:#fff;min-height:460px;font-size:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;padding-bottom:10px;margin-bottom:12px;">
            <b id="preview-policies-title" style="font-family:var(--serif);font-size:15px;">${esc(b.policiesPageTitle || 'Chính sách dịch vụ')}</b>
            <span style="font-size:10px;color:var(--wine);font-weight:600;">HOÀN</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="border-left:3px solid var(--wine);padding-left:10px;">
              <b style="font-size:12px;display:block;margin-bottom:2px;">01. Đặt cọc tiêu chuẩn</b>
              <p style="font-size:11px;color:#4b5563;margin:0;line-height:1.4;">${esc(b.policyDeposit || `Mức cọc: ${money(Number(s.deposit || 200000))}. Trừ vào tổng chi phí.`)}</p>
            </div>
            <div style="border-left:3px solid #9ca3af;padding-left:10px;">
              <b style="font-size:12px;display:block;margin-bottom:2px;">02. Đổi ngày giờ</b>
              <p style="font-size:11px;color:#4b5563;margin:0;line-height:1.4;">${esc(b.policyChange || 'Hỗ trợ đổi miễn phí trước 24 giờ tùy lịch trống.')}</p>
            </div>
            <div style="border-left:3px solid #9ca3af;padding-left:10px;">
              <b style="font-size:12px;display:block;margin-bottom:2px;">03. Hủy lịch & hoàn cọc</b>
              <p style="font-size:11px;color:#4b5563;margin:0;line-height:1.4;">${esc(b.policyCancel || 'Yêu cầu hủy trước 48 giờ được xem xét hoàn cọc.')}</p>
            </div>
            <div style="border-left:3px solid #9ca3af;padding-left:10px;">
              <b style="font-size:12px;display:block;margin-bottom:2px;">04. Phục vụ tận nơi</b>
              <p style="font-size:11px;color:#4b5563;margin:0;line-height:1.4;">${esc(b.policyTravel || 'Phí di chuyển báo trước khi đặt cọc.')}</p>
            </div>
          </div>
        </div>
      `;
    } else if (previewMode === 'contact') {
      previewHtml = `
        <div class="preview-contact-box" style="padding:16px;background:#fff;min-height:460px;font-size:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;padding-bottom:10px;margin-bottom:12px;">
            <b id="preview-contact-title" style="font-family:var(--serif);font-size:15px;">${esc(b.contactPageTitle || 'Trao đổi cùng Hoàn')}</b>
            <span style="font-size:10px;color:var(--wine);font-weight:600;">HOÀN</span>
          </div>
          <p style="font-size:11px;color:#6b7280;margin:0 0 14px;">${esc(b.contactPageSubtitle || 'Chia sẻ mong muốn hoặc vấn đề bạn cần hỗ trợ.')}</p>
          <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
            <div style="background:#fafafa;padding:8px 10px;border-radius:4px;display:flex;justify-content:space-between;">
              <span style="color:#6b7280;">Hotline / Điện thoại</span>
              <b id="preview-contact-phone">${esc(b.phone || '0912 345 678')}</b>
            </div>
            <div style="background:#fafafa;padding:8px 10px;border-radius:4px;display:flex;justify-content:space-between;">
              <span style="color:#6b7280;">Zalo tư vấn</span>
              <b>${esc(b.zaloPhone || b.phone || '0912 345 678')}</b>
            </div>
            <div style="background:#fafafa;padding:8px 10px;border-radius:4px;display:flex;justify-content:space-between;">
              <span style="color:#6b7280;">Email</span>
              <b id="preview-contact-email">${esc(b.email || 'contact@hoanmakeup.vn')}</b>
            </div>
            <div style="background:#fafafa;padding:8px 10px;border-radius:4px;display:flex;justify-content:space-between;">
              <span style="color:#6b7280;">Địa chỉ</span>
              <b>${esc(b.address || 'Hà Nội & phục vụ tận nơi')}</b>
            </div>
          </div>
          <div style="background:#f3f4f6;padding:10px;border-radius:4px;text-align:center;font-size:11px;color:#4b5563;">
            Form gửi lời nhắn trực tuyến kết nối đến mục Quản trị & Yêu cầu
          </div>
        </div>
      `;
    }

    const previewTabs = [
      { id: 'home', label: 'Trang chủ' },
      { id: 'about', label: 'Về Hoàn' },
      { id: 'services', label: 'Dịch vụ' },
      { id: 'booking', label: 'Đặt lịch' },
      { id: 'policies', label: 'Chính sách' },
      { id: 'contact', label: 'Liên hệ' }
    ];

    const body = siteTools
      ? siteTools.cmsWorkspaceHtml()
      : '<div class="cms-workspace"><p>Đang tải CMS…</p></div>';
    /* Legacy general-content editor retained only for data compatibility. */
    void `
      <section class="content-editor">
        <nav class="content-tabs">
          ${tabs.filter(t => t.id !== 'pages').map((t) => `
            <button type="button" class="content-tab-btn ${curTab === t.id ? 'active' : ''}" data-action="content-tab" data-tab="${t.id}">
              <span style="font-size:16px;">${t.icon}</span>
              <div style="text-align:left;line-height:1.2;">
                <small style="font-size:10px;color:#9ca3af;display:block;letter-spacing:0.05em;font-weight:700;">TAB ${t.num}</small>
                <span style="font-size:13px;font-weight:600;">${t.name}</span>
              </div>
            </button>
          `).join('')}
        </nav>
        <form class="content-form" data-form="content">
          ${tabHtml}
          <div style="margin-top:24px;display:flex;gap:10px;position:sticky;bottom:0;background:#ffffff;padding-top:12px;border-top:1px solid #eee;">
            <button type="submit" class="btn btn-dark btn-wide" style="flex:1;">
              ${icon('check')} Lưu nội dung tab này
            </button>
          </div>
        </form>
        <div class="content-preview">
          <div class="section-head" style="margin-bottom:12px;">
            <div>
              <h2 style="font-size:15px;margin:0;">Xem trước trực tiếp</h2>
              <small class="muted">Hiển thị mô phỏng phản hồi tức thì</small>
            </div>
            <a class="link" href="${previewRouteMap[previewMode] || '#/'}" target="_blank" style="font-size:12px;white-space:nowrap;">Mở trang thật ↗</a>
          </div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:12px;">
            ${previewTabs.map(pt => `
              <button type="button" class="preview-nav-btn ${previewMode === pt.id ? 'active' : ''}" data-action="set-preview-mode" data-mode="${pt.id}">${pt.label}</button>
            `).join('')}
          </div>
          <div class="preview-browser">
            <div class="preview-bar">
              <i class="preview-dot"></i><i class="preview-dot"></i><i class="preview-dot"></i>
              <span style="margin:auto;font-weight:500;">hoanmakeup.com / ${previewRouteMap[previewMode] || ''}</span>
            </div>
            ${previewHtml}
          </div>
        </div>
      </section>
      `;

    return adminShell(
      'content',
      body,
      'Nội dung website',
      'Chỉnh sửa thông tin, hình ảnh và chính sách hiển thị cho khách hàng.',
      ''
    );
  }

  function adminNotifications() {
    const notifications = (state.notifications || []).slice().sort((a,b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    const unread = notifications.filter(n => n.status === 'unread').length;
    const appointments = notifications.filter(n => String(n.type || '').startsWith('appointment.')).length;
    const consultations = notifications.filter(n => n.type === 'consultation.created').length;
    const href = n => n.entityType === 'appointment' ? `#/admin/appointments?code=${encodeURIComponent(n.entityId || '')}` : '#/admin/requests';
    const typeLabel = n => n.type === 'payment.reported' || n.type === 'payment.refund' ? 'Tiền cọc' : n.type === 'consultation.created' ? 'Tư vấn' : n.type === 'appointment.request' ? 'Yêu cầu lịch' : 'Lịch đặt';
    const body = `<section class="stat-grid"><div class="stat-card"><small>Chưa đọc</small><strong class="numeric">${String(unread).padStart(2,'0')}</strong><span>Cần xử lý</span></div><div class="stat-card"><small>Lịch đặt</small><strong class="numeric">${String(appointments).padStart(2,'0')}</strong><span>Lịch mới hoặc tiền cọc</span></div><div class="stat-card"><small>Yêu cầu tư vấn</small><strong class="numeric">${String(consultations).padStart(2,'0')}</strong><span>Tách khỏi lịch đã đặt</span></div><div class="stat-card"><small>Tổng sự kiện</small><strong class="numeric">${String(notifications.length).padStart(2,'0')}</strong><span>Dữ liệu thật từ hệ thống</span></div></section><div class="table-wrap"><table class="data-table"><thead><tr><th>Loại</th><th>Thông báo</th><th>Chi tiết</th><th>Thời gian</th><th>Trạng thái</th></tr></thead><tbody>${notifications.length ? notifications.map(n => `<tr><td><span class="badge ${n.status === 'unread' ? 'warning' : ''}">${esc(typeLabel(n))}</span></td><td><b>${esc(n.title || 'Thông báo')}</b><div class="muted">${esc(n.message || '')}</div></td><td><a class="link" href="${href(n)}">${n.entityType === 'appointment' ? 'Mở lịch hẹn' : 'Mở yêu cầu'}</a></td><td class="numeric">${formatReqTime(n.createdAt)}</td><td>${n.status === 'unread' ? 'Chưa đọc' : 'Đã xem'}</td></tr>`).join('') : '<tr><td colspan="5"><div class="empty-table">Chưa có sự kiện cần thông báo.</div></td></tr>'}</tbody></table></div>`;
    return adminShell('notifications',body,'Thông báo','Theo dõi đúng sự kiện lịch đặt, tiền cọc và yêu cầu tư vấn.', `<button class="btn" data-action="mark-all-notifications-read" ${unread ? '' : 'disabled'}>${icon('check')} Đánh dấu đã đọc</button>`);
  }

  function adminReports() {
    const active=state.appointments.filter(a=>a.status!=='cancelled');
    const revenue=state.appointments.reduce((sum,appointment)=>sum+Number(appointment.finance?.netReceived ?? appointment.deposit ?? 0),0);
    const average=active.length?Math.round(active.reduce((sum,appointment)=>sum+Number(appointment.total||0),0)/active.length):0;
    const repeat=state.customers.length?Math.round(state.customers.filter(c=>c.visits>1).length/state.customers.length*100):0;
    const districts={};active.forEach(a=>{const key=a.district||'Chưa xác định';districts[key]=(districts[key]||0)+1});
    const body = `<div class="toolbar"><a class="btn" href="#/admin/payments">Xem sổ giao dịch & lọc kỳ thu chi →</a></div><section class="stat-grid"><div class="stat-card"><small>Tổng thực nhận</small><strong class="numeric">${money(revenue)}</strong><span>Số đã thu trừ số đã hoàn, gồm số dư cũ</span></div><div class="stat-card"><small>Số lịch</small><strong class="numeric">${String(active.length).padStart(2,'0')}</strong><span>Lịch thực tế</span></div><div class="stat-card"><small>Giá trị lịch trung bình</small><strong class="numeric">${money(average)}</strong></div><div class="stat-card"><small>Tỷ lệ quay lại</small><strong class="numeric">${repeat}%</strong></div></section><section class="admin-grid"><div class="admin-section"><h2>Thu ròng 7 ngày</h2>${lineChart()}</div><div class="admin-section"><h2>Cơ cấu dịch vụ</h2>${barChart()}<h2 style="margin-top:28px">Khu vực phổ biến</h2>${Object.entries(districts).length?Object.entries(districts).sort((a,b)=>b[1]-a[1]).slice(0,4).map(r=>`<div class="summary-row"><span>${r[0]}</span><b class="numeric">${Math.round(r[1]/Math.max(active.length,1)*100)}%</b></div>`).join(''):'<div class="empty-table">Chưa có dữ liệu khu vực.</div>'}</div></section>`;
    return adminShell('reports',body,'Báo cáo','Theo dõi doanh thu, dịch vụ và hành vi đặt lịch.',`<button class="btn btn-dark" data-action="export-report">${icon('download')} Xuất báo cáo</button>`);
  }

  function adminPermissions() {
    const roles = [{name:'Chủ hệ thống',members:1,rights:['Toàn quyền','Thanh toán','Phân quyền']},{name:'Quản lý lịch',members:1,rights:['Lịch hẹn','Khách hàng','Thông báo']},{name:'Kế toán',members:1,rights:['Thanh toán','Báo cáo']},{name:'Cộng tác viên',members:2,rights:['Xem lịch được giao']}];
    const body = `<div class="admin-card-grid">${roles.map((r,i)=>`<article class="admin-card"><div class="section-head"><h3>${r.name}</h3><span class="badge">${r.members} thành viên</span></div><p class="muted">${r.rights.join(' · ')}</p><div class="summary-row"><span>Truy cập trang quản trị</span><button class="toggle ${i<3?'on':''}" data-action="permission-toggle"></button></div><div class="admin-card-actions"><button class="btn btn-sm" data-action="edit-role" data-role="${r.name}">Chỉnh quyền</button><button class="btn btn-sm" data-action="role-members" data-role="${r.name}">Thành viên</button></div></article>`).join('')}</div><div class="manage-card"><h2>Nguyên tắc bảo mật</h2><p class="muted">Mỗi người chỉ nhìn thấy dữ liệu cần thiết cho vai trò. Các thay đổi về quyền được ghi lại trong Nhật ký hoạt động.</p></div>`;
    return adminShell('permissions',body,'Phân quyền','Kiểm soát quyền truy cập và phạm vi thao tác.',`<button class="btn btn-dark" data-action="add-role">${icon('plus')} Tạo vai trò</button>`);
  }

  function adminAudit() {
    const body = `<div class="toolbar"><input id="audit-search" placeholder="Tìm hành động hoặc đối tượng..."><select><option>Tất cả người dùng</option><option>Hoàn Nguyễn</option></select><input type="date"></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Đối tượng</th><th>Địa chỉ truy cập</th></tr></thead><tbody>${state.audit.map(a=>`<tr><td>${a.time}</td><td>${a.user}</td><td><b>${a.action}</b></td><td>${a.target}</td><td>Hà Nội · 14.177.xxx.xxx</td></tr>`).join('')}</tbody></table></div>`;
    return adminShell('audit',body,'Nhật ký hoạt động','Lịch sử thay đổi quan trọng trong hệ thống.',`<button class="btn" data-action="export-audit">${icon('download')} Xuất nhật ký</button>`);
  }

  function adminSettings() {
    const s=state.settings;
    const input=(name,label,type='text')=>{const seedBank=s.bankAccount==='0901234567'&&s.bankOwner==='NGUYEN HOAN';return `<div class="field"><label>${label}</label><input name="${name}" type="${type}" value="${esc(seedBank&&['bankAccount','bankOwner'].includes(name)?'':s[name]??'')}"></div>`;};
    return adminShell('settings',`<form class="manage-card" data-form="settings"><h2>Thiết lập đặt lịch</h2><div class="form-grid">${input('bookingWindow','Số ngày mở lịch','number')}${input('deposit','Mức cọc tiêu chuẩn','number')}${input('travelFee','Phí di chuyển mặc định','number')}</div><h2 style="margin-top:30px">Tài khoản nhận cọc</h2><p>Chỉ nhập tài khoản thật do bạn quản lý. Khách sẽ nhận nội dung chuyển khoản theo mã lịch.</p><div class="form-grid">${input('bankName','Ngân hàng')}${input('bankAccount','Số tài khoản')}${input('bankOwner','Chủ tài khoản')}${input('bankCode','Mã ngân hàng VietQR (ví dụ MB, VCB)')}</div><h3>Mã QR nhận tiền của bạn</h3><p>Tải ảnh QR gốc từ ứng dụng ngân hàng. Ảnh sẽ hiển thị ở bước đặt cọc và chi tiết lịch hẹn.</p>${paymentQR()}<label class="btn">Tải / thay ảnh QR<input type="file" accept="image/png,image/jpeg,image/webp" data-payment-qr hidden></label><p>Đối soát thủ công tại mục Tiền cọc. Chưa kết nối thanh toán tự động hoặc MoMo.</p><button class="btn btn-dark">Lưu thiết lập</button></form><form class="manage-card" data-form="contact-settings" style="margin-top:25px"><h2>Thông tin liên hệ</h2><div class="form-grid"><div class="field"><label>Số điện thoại / Zalo</label><input name="phone" value="${esc(state.brand.phone==='0901 234 567'?'':state.brand.phone)}"></div><div class="field"><label>Email</label><input name="email" type="email" value="${esc(state.brand.email||'')}"></div></div><button class="btn btn-dark">Lưu thông tin liên hệ</button></form>`,'Cài đặt','Thiết lập lịch, tài khoản nhận tiền và thông tin liên hệ.');
  }

  function modal(title, content, confirmLabel = 'Lưu', onConfirm = '', confirmClass = 'btn-dark') {
    const isWide = content.includes('admin-preview-grid');
    adminLocations?.beforeRender($('#modal-root'));
    const actions = !onConfirm || onConfirm === 'close-modal' ? `<button class="btn ${confirmClass}" data-action="close-modal">${confirmLabel === 'Lưu' ? 'Đóng' : confirmLabel}</button>` : `<button class="btn" data-action="close-modal">Hủy</button><button class="btn ${confirmClass}" data-action="modal-confirm" data-confirm="${onConfirm}">${confirmLabel}</button>`;
    $('#modal-root').innerHTML = `<div class="modal-backdrop" role="presentation" data-action="modal-backdrop"><section class="modal ${isWide ? 'modal-wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><h2 id="modal-title">${title}</h2><div>${content}</div><div class="modal-actions">${actions}</div></section></div>`;
    bindAdminRecordForm();
    adminLocations?.mount(document);
    setTimeout(() => $('.modal input, .modal select, .modal textarea')?.focus(), 0);
  }
  const closeModal = () => { adminLocations?.beforeRender($('#modal-root')); $('#modal-root').innerHTML = ''; };

  function downloadText(filename, content) {
    const blob = new Blob([content], {type:'text/plain;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),500);
  }

  function exportAdminRecords(action) {
    if (action === 'export-payments') return financeAdmin?.exportLedger();
    const rows = action === 'export-report'
      ? [['Mã chứng từ','Mã lịch','Loại','Tiền vào','Tiền ra','Thời gian giao dịch','Phương thức','Mã đối chiếu','Ghi chú'], ...(state.paymentTransactions || []).map(entry => [entry.id,entry.appointmentCode,({deposit:'Thu cọc',balance:'Thu phần còn lại',refund:'Hoàn tiền',opening:'Số dư chuyển sang',opening_refund:'Khoản hoàn chuyển sang'})[entry.kind] || entry.kind,['refund','opening_refund'].includes(entry.kind)?0:entry.amount,['refund','opening_refund'].includes(entry.kind)?entry.amount:0,entry.kind.startsWith('opening')?'Không xác định (dữ liệu cũ)':entry.occurredAt,entry.method,entry.reference,entry.note])]
      : action === 'export-appointments'
      ? [['Mã lịch','Khách hàng','Điện thoại','Ngày hẹn','Giờ','Địa chỉ','Tổng chi phí','Thực nhận', ...(adminLocations?.exportHeaders || [])], ...state.appointments.map(appointment => [appointment.code,appointment.customer,appointment.phone,appointment.date,appointment.time,[appointment.address,appointment.ward,state.bookingDetails?.[appointment.code]?.city].filter(Boolean).join(', '),appointment.total,appointment.finance?.netReceived ?? appointment.deposit,...(adminLocations?.exportColumns(appointment,state.bookingDetails?.[appointment.code]) || [])])]
      : action === 'export-customers' ? [['Khách hàng','Điện thoại','Email','Số lần đặt','Ghi chú'], ...state.customers.map(customer => [customer.name,customer.phone,customer.email,customer.visits,customer.note])]
      : [['Thời gian','Người thực hiện','Hành động','Đối tượng'], ...(state.audit || []).map(entry => [entry.time,entry.user,entry.action,entry.target])];
    const quote = value => { const text = String(value ?? ''); return '"' + (/^[=+@\-\t\r]/.test(text) ? "'" : '') + text.replaceAll('"','""') + '"'; };
    downloadText(action+'-'+localIso()+'.csv', '\uFEFF'+rows.map(row => row.map(quote).join(',')).join('\r\n'));
  }

  const transactionDay = entry => {
    const date = new Date(entry.occurredAt);
    return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date) : '';
  };
  const actualCashEntries = () => (state.paymentTransactions || []).filter(entry => ['deposit','balance','refund'].includes(entry.kind));
  const cashNet = entries => entries.reduce((sum, entry) => sum + (entry.kind === 'refund' ? -1 : 1) * Number(entry.amount || 0), 0);

  // Progressive motion: content and navigation remain usable without animation APIs.
  let motionObserver = null;
  let motionRoute = null;
  let motionCleanup = () => {};
  function mountCoutureMotion(path) {
    if (!window.matchMedia) return;
    motionObserver?.disconnect();
    motionCleanup();
    const previous = motionRoute;
    motionRoute = location.hash;
    const main = document.querySelector('.couture main');
    if (!main || new URLSearchParams(location.search).get('cmsPreview') === '1' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (main.querySelector('.policy-document, .support-desk, .support-article')) return;
    const cleanups = [];
    const animations = new Set();
    const animate = (node, frames, options) => {
      if (!node.animate) return;
      const animation = node.animate(frames, options);
      animations.add(animation);
      animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
    };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stop = () => {
      motionObserver?.disconnect();
      animations.forEach(animation => animation.cancel());
      cleanups.forEach(fn => fn());
    };
    const preferenceChanged = () => { if (reduced.matches) stop(); };
    reduced.addEventListener?.('change', preferenceChanged);
    motionCleanup = () => { stop(); reduced.removeEventListener?.('change', preferenceChanged); };
    // Keep the masthead still; turn the content plane into its new position.
    if (previous !== motionRoute) {
      animate(main, [
        { opacity: 0.12, transform: 'perspective(1600px) translate3d(0,26px,-85px) rotateY(-1.2deg)' },
        { opacity: 1, transform: 'perspective(1600px) translate3d(0,0,0) rotateY(0deg)' }
      ], { duration: 620, easing: 'cubic-bezier(.2,.75,.2,1)' });
    }
    if ('IntersectionObserver' in window) {
      motionObserver = new IntersectionObserver(entries => {
        entries.forEach(({target, isIntersecting}) => {
          if (!isIntersecting) return;
          const photo = target.matches('.fashion-photo, .ct-campaign > img, .ct-about > img, .ct-consult > img');
          animate(target, [
            { opacity: 0, transform: photo ? 'perspective(1100px) translateY(38px) rotateX(5deg) scale(.97)' : 'perspective(900px) translateY(22px) rotateX(-4deg)' },
            { opacity: 1, transform: 'perspective(1100px) translateY(0) rotateX(0deg) scale(1)' }
          ], { duration: photo ? 950 : 760, delay: photo ? 40 : 110, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
          motionObserver.unobserve(target);
        });
      }, { threshold: 0.08 });
      main.querySelectorAll('h1, h2, .ct-overline, .ct-subtitle, .fashion-photo, .ct-campaign > img, .ct-about > img, .ct-consult > img').forEach(node => motionObserver.observe(node));
    }
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      main.querySelectorAll('.fashion-photo').forEach(photo => {
        // Tilt the link, leaving the image free for its own reveal / zoom.
        const surface = photo.parentElement;
        if (!surface || surface.tagName !== 'A') return;
        surface.classList.add('ct-depth-surface');
        let frame = 0;
        const reset = () => {
          cancelAnimationFrame(frame);
          frame = 0;
          surface.style.removeProperty('--depth-x');
          surface.style.removeProperty('--depth-y');
        };
        const move = event => {
          if (event.pointerType !== 'mouse') return;
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => {
            const r = surface.getBoundingClientRect();
            const x = Math.max(-1, Math.min(1, (event.clientX-r.left)/r.width*2-1));
            const y = Math.max(-1, Math.min(1, (event.clientY-r.top)/r.height*2-1));
            surface.style.setProperty('--depth-x', `${-y*3}deg`);
            surface.style.setProperty('--depth-y', `${x*4}deg`);
          });
        };
        surface.addEventListener('pointermove', move);
        surface.addEventListener('pointerleave', reset);
        surface.addEventListener('pointercancel', reset);
        cleanups.push(() => {
          reset();
          surface.classList.remove('ct-depth-surface');
          surface.removeEventListener('pointermove', move);
          surface.removeEventListener('pointerleave', reset);
          surface.removeEventListener('pointercancel', reset);
        });
      });
    }
  }

  function renderPathHtml(rawPath) {
    const raw = (rawPath || '/').replace(/^#/, '');
    const [path, queryString=''] = raw.split('?');
    const query = new URLSearchParams(queryString);
    const parts = path.split('/').filter(Boolean);
    if (path.startsWith('/pages/')) return siteTools?.customPageHtml(path) || '';
    if (path === '/') return pageHome();
    if (path === '/services') {
      const legacyService = query.get('filter');
      return legacyService && legacyService !== 'all' ? pageServiceDetail(legacyService) : pageServices();
    }
    if (parts[0] === 'services' && parts[1]) return pageServiceDetail(parts[1], parts[2]);
    if (path === '/gallery') return pageGallery(query.get('filter') || 'all');
    if (parts[0] === 'look') return pageLook(parts[1]);
    if (path === '/about') return pageAbout();
    if (path === '/support') return pageSupport();
    if (path === '/policies') return pagePolicies(query.get('tab'));
    if (parts[0] === 'policies' && parts[1]) return pagePolicies(parts[1]);
    if (parts[0] === 'support' && parts[1]) return pageHelpArticle(parts[1]);
    if (path === '/contact') return pageContact();
    if (path === '/search') return pageSearch();
    if (path === '/booking/service') return pageBookingService();
    if (path === '/booking/time') return pageBookingTime();
    if (path === '/booking/location') return pageBookingLocation();
    if (path === '/booking/info') return pageBookingInfo();
    if (path === '/booking/deposit') return pageBookingDeposit();
    if (path === '/booking/confirm') return pageBookingConfirm();
    if (path === '/booking/success') return pageBookingSuccess();
    if (path === '/lookup') return pageLookup();
    if (parts[0] === 'booking' && parts[1] && parts[2] === 'reschedule') return pageReschedule(parts[1]);
    if (parts[0] === 'booking' && parts[1] && parts[2] === 'cancel') return pageCancel(parts[1]);
    if (parts[0] === 'booking' && parts[1] && parts[2] === 'receipt') return pageReceipt(parts[1]);
    if (parts[0] === 'booking' && parts[1]) return pageBookingDetail(parts[1]);
    return '';
  }

  let policyContentsCleanup = () => {};
  function mountPolicyContents() {
    policyContentsCleanup();
    policyContentsCleanup = policyNavigation ? policyNavigation(document) : () => {};
  }

  let lastRenderedPath = '';

  function render() {
    siteTools?.beforeRender();
    adminLocations?.beforeRender($('#app'));
    const raw = location.hash.slice(1) || '/';
    const [path, queryString=''] = raw.split('?');
    const query = new URLSearchParams(queryString);
    const parts = path.split('/').filter(Boolean);
    const appRoot = $('#app');
    const serviceFilter = path === '/services' ? query.get('filter') : null;
    const routeKey = serviceFilter && serviceFilter !== 'all' ? `/services/${serviceFilter}` : path;
    const routeChanged = routeKey !== lastRenderedPath;
    const policyContentsOpen = !routeChanged && appRoot.querySelector('.policy-mobile-contents')?.open;
    const previousScroll = { x: window.scrollX, y: window.scrollY };
    const activeField = typeof appRoot?.contains === 'function' && appRoot.contains(document.activeElement) && document.activeElement?.matches?.('input, textarea, select, [data-support-panel]')
      ? document.activeElement
      : null;
    const focusState = activeField ? {
      id: activeField.id,
      name: activeField.getAttribute('name'),
      start: activeField.selectionStart,
      end: activeField.selectionEnd
    } : null;
    const needsFullContentEditor = path === '/admin/content' || path === '/admin/content-pages';
    let html = path.startsWith('/admin') && !needsFullContentEditor && window.HoanMobileAdmin?.matches()
      ? window.HoanMobileAdmin.render(raw, state)
      : renderPathHtml(raw);
    if (!html) {
      if (path === '/admin/requests') html = adminRequests();
      else if (path === '/admin' || path === '/admin/') html = adminOverview();
      else if (path === '/admin/appointments') html = adminAppointments();
      else if (path === '/admin/schedule') html = adminSchedule();
      else if (path === '/admin/services') html = adminServices();
      else if (path === '/admin/customers') html = adminCustomers();
      else if (path === '/admin/payments') html = adminPayments();
      else if (path === '/admin/promotions') html = adminPromotions();
      else if (path === '/admin/gallery') html = adminGallery();
      else if (path === '/admin/content' || path === '/admin/content-pages') {
        state.contentViewMode = 'pages';
        state.contentActiveTab = 'pages';
        html = adminContent();
      }
      else if (path === '/admin/visitors') html = siteTools?.visitorsPage() || adminShell('visitors','<p>Đang tải thống kê…</p>','Khách truy cập','');
      else if (path === '/admin/notifications') html = adminNotifications();
      else if (path === '/admin/reports') html = adminReports();
      else if (path === '/admin/permissions') html = adminPermissions();
      else if (path === '/admin/audit') html = adminAudit();
      else if (path === '/admin/settings') html = adminSettings();
      else html = `<div class="page">${publicHeader()}<main class="help-wrap"><h1>Không tìm thấy trang</h1><a class="btn btn-dark" href="#/">Về trang chủ</a></main></div>`;
    }
    bookingLocation?.beforeRender(path);
    appRoot.innerHTML = html;
    if (policyContentsOpen) {
      const contents = appRoot.querySelector('.policy-mobile-contents');
      if (contents) contents.open = true;
    }
    lastRenderedPath = routeKey;
    siteTools?.mount(path);
    if (path === '/admin/appointments' && query.get('code')) {
      setTimeout(() => document.querySelector(`[data-action="admin-view-appointment"][data-code="${CSS.escape(query.get('code'))}"]`)?.click(), 0);
    }
    mountCoutureMotion(path);
    if (path === '/booking/deposit') {
      initDepositSync();
    }
    document.title = path.startsWith('/admin') ? 'Quản trị — HOÀN' : 'HOÀN — Makeup Artist';
    if (routeChanged) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    } else {
      if (focusState) {
        const field = focusState.id
          ? document.getElementById(focusState.id)
          : focusState.name ? appRoot.querySelector(`[name="${CSS.escape(focusState.name)}"]`) : null;
        if (field) {
          field.focus({ preventScroll: true });
          if (typeof field.setSelectionRange === 'function' && focusState.start != null) {
            try { field.setSelectionRange(focusState.start, focusState.end ?? focusState.start); } catch { /* unsupported input type */ }
          }
        }
      }
      window.scrollTo(previousScroll.x, previousScroll.y);
    }
    mountPolicyContents();
    bookingLocation?.mount(path);
    adminLocations?.mount(document);
    financeAdmin?.mount();
  }

  function initDepositSync() {
    if (typeof setInterval === 'undefined') return;
    if (window._depositSyncInterval) clearInterval(window._depositSyncInterval);
    const update = async () => {
      if (location.hash.split('?')[0] !== '#/booking/deposit') { clearInterval(window._depositSyncInterval); return; }
      const { code, phone } = state.booking;
      if (!code || !phone || depositPreparation) return;
      try {
        const before = getAppointment(code);
        const previous = JSON.stringify([before?.deposit,before?.paymentStatus,before?.finance,state.paymentInstructionsByCode?.[code]]);
        const appointment = await lookupOwnBooking(code, phone);
        if (location.hash.split('?')[0] !== '#/booking/deposit') return;
        if (previous !== JSON.stringify([appointment.deposit,appointment.paymentStatus,appointment.finance,state.paymentInstructionsByCode?.[code]])) render();
      } catch { /* Keep the last verified instructions until a retry succeeds. */ }
    };
    if (!state.paymentInstructionsByCode?.[state.booking.code]) update();
    window._depositSyncInterval = setInterval(update, 7000);
  }

  let requestFilterState = { status: 'all', kind: 'all', search: '' };

  function getInitials(name) {
    if (!name) return 'KH';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function formatReqTime(iso) {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      const day = String(d.getDate()).padStart(2, '0');
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const y = d.getFullYear();
      const hr = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${hr}:${min} · ${day}/${m}/${y}`;
    } catch(e) { return iso; }
  }

  function modalViewRequest(id) {
    const r = (state.requests || []).find(x => x.id === id);
    if (!r) return toast('Không tìm thấy yêu cầu');
    const curStatus = r.status || 'pending';
    const badgeCls = curStatus === 'resolved' ? 'success' : (curStatus === 'pending' ? 'warning' : (curStatus === 'in_progress' ? 'info' : ''));
    const statusLabel = curStatus === 'resolved' ? 'Đã hoàn thành' : (curStatus === 'in_progress' ? 'Đang xử lý' : (curStatus === 'cancelled' ? 'Đã hủy' : 'Chờ xử lý'));
    const cleanPhone = (r.phone || '').replace(/\D/g, '');

    modal(`Chi tiết yêu cầu ${r.id}`, `
      <div style="display:flex;flex-direction:column;gap:12px;font-size:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:1px solid #e5e7eb;">
          <div>
            <div style="font-size:17px;font-weight:700;color:#111827;">${esc(r.name || 'Khách hàng')}</div>
            <div style="font-size:13px;color:#6b7280;margin-top:2px;">Mã yêu cầu: <span class="numeric">${esc(r.id)}</span></div>
          </div>
          <span class="badge ${badgeCls}" style="font-size:12px;padding:4px 10px;">${statusLabel}</span>
        </div>
        <div class="summary-row"><span>Số điện thoại</span><b class="numeric">${esc(r.phone || '—')}</b></div>
        <div class="summary-row"><span>Email</span><b class="numeric">${esc(r.email || '—')}</b></div>
        <div class="summary-row"><span>Chủ đề</span><b>${esc(r.subject || 'Yêu cầu tư vấn')}</b></div>
        <div class="summary-row"><span>Thời gian</span><b class="numeric">${formatReqTime(r.createdAt)}</b></div>
        ${r.code ? `<div class="summary-row"><span>Mã lịch liên quan</span><b class="numeric">${esc(r.code)}</b></div>` : ''}
        ${r.date ? `<div class="summary-row"><span>Đề xuất đổi lịch</span><b class="numeric">${esc(r.date)}${r.time ? ' lúc ' + esc(r.time) : ''}</b></div>` : ''}
        <div class="summary-row"><span>Lời nhắn</span><b style="max-width:65%;font-weight:500;">${esc(r.message || '—')}</b></div>
        <div class="summary-row"><span>Ghi chú</span><b style="max-width:65%;font-weight:500;">${esc(r.reply || 'Chưa có ghi chú')}</b></div>
        <div style="display:flex;gap:10px;margin-top:12px;padding-top:10px;border-top:1px solid #f3f4f6;flex-wrap:wrap;">
          <button class="btn btn-sm btn-dark" data-action="req-status" data-id="${esc(r.id)}">Đổi trạng thái</button>
          <button class="btn btn-sm btn-edit" data-action="req-edit-full" data-id="${esc(r.id)}">Chỉnh sửa</button>
          <button class="btn btn-sm btn-danger" data-action="req-delete-confirm" data-id="${esc(r.id)}">Xóa yêu cầu</button>
          ${cleanPhone ? `<a class="btn btn-sm" href="https://zalo.me/${cleanPhone}" target="_blank" style="text-decoration:none;display:inline-flex;align-items:center;">Nhắn Zalo →</a>` : ''}
          ${r.code ? `<a class="btn btn-sm" href="#/booking/${esc(r.code)}" target="_blank" style="text-decoration:none;display:inline-flex;align-items:center;">Xem trang khách →</a>` : ''}
        </div>
      </div>
    `, 'Đóng');
  }

  function modalReqStatus(id) {
    const r = (state.requests || []).find(x => x.id === id);
    if (!r) return toast('Không tìm thấy yêu cầu');
    const curStatus = r.status || 'pending';
    modal(`Cập nhật trạng thái`, `
      <div style="display:flex;flex-direction:column;gap:14px;font-size:14px;">
        <div class="field">
          <label>Trạng thái mới</label>
          <select id="modal-req-status">
            <option value="pending" ${curStatus==='pending'?'selected':''}>Chờ xử lý</option>
            <option value="in_progress" ${curStatus==='in_progress'?'selected':''}>Đang xử lý</option>
            <option value="resolved" ${curStatus==='resolved'?'selected':''}>Đã hoàn thành</option>
            <option value="cancelled" ${curStatus==='cancelled'?'selected':''}>Đã hủy</option>
          </select>
        </div>
        <div class="field">
          <label>Ghi chú vận hành</label>
          <textarea id="modal-req-status-reply" rows="3" placeholder="Nhập ghi chú hoặc kết quả xử lý...">${esc(r.reply || '')}</textarea>
        </div>
      </div>
    `, 'Cập nhật', `update-req-status:${r.id}`);
  }

  function modalEditRequest(id) {
    const r = (state.requests || []).find(x => x.id === id);
    if (!r) return toast('Không tìm thấy yêu cầu');
    const curStatus = r.status || 'pending';
    modal(`Chỉnh sửa yêu cầu — ${r.id}`, `
      <div class="form-grid">
        <div class="field full">
          <label>Khách hàng *</label>
          <input id="modal-edit-req-name" value="${esc(r.name || '')}" placeholder="Họ và tên khách hàng">
        </div>
        <div class="field">
          <label>Số điện thoại *</label>
          <input id="modal-edit-req-phone" value="${esc(r.phone || '')}" placeholder="Số điện thoại">
        </div>
        <div class="field">
          <label>Email liên hệ</label>
          <input id="modal-edit-req-email" type="email" value="${esc(r.email || '')}" placeholder="Email khách hàng">
        </div>
        <div class="field full">
          <label>Chủ đề</label>
          <input id="modal-edit-req-subject" value="${esc(r.subject || 'Yêu cầu tư vấn')}" placeholder="Chủ đề tư vấn">
        </div>
        <div class="field full">
          <label>Trạng thái xử lý</label>
          <select id="modal-edit-req-status">
            <option value="pending" ${curStatus==='pending'?'selected':''}>Chờ xử lý</option>
            <option value="in_progress" ${curStatus==='in_progress'?'selected':''}>Đang xử lý</option>
            <option value="resolved" ${curStatus==='resolved'?'selected':''}>Đã hoàn thành</option>
            <option value="cancelled" ${curStatus==='cancelled'?'selected':''}>Đã hủy</option>
          </select>
        </div>
        <div class="field full">
          <label>Lời nhắn của khách</label>
          <textarea id="modal-edit-req-message" rows="2" placeholder="Nội dung lời nhắn...">${esc(r.message || '')}</textarea>
        </div>
        <div class="field full">
          <label>Ghi chú vận hành</label>
          <textarea id="modal-edit-req-reply" rows="2" placeholder="Ghi chú nội bộ...">${esc(r.reply || '')}</textarea>
        </div>
      </div>
    `, 'Lưu thay đổi', `edit-req-save:${r.id}`);
  }

  function modalDeleteRequest(id) {
    const r = (state.requests || []).find(x => x.id === id);
    if (!r) return toast('Không tìm thấy yêu cầu');
    modal('Xác nhận xóa yêu cầu', `
      <div style="font-size:14px;line-height:1.6;color:#1f2937;">
        <p style="font-size:15px;color:#1f2937;margin-bottom:14px;line-height:1.5;">
          Bạn có chắc chắn muốn xóa yêu cầu hỗ trợ của khách hàng <b>${esc(r.name || 'Khách')}</b>?
        </p>
        <div style="margin-bottom:16px;">
          <div class="summary-row"><span>Mã yêu cầu</span><b class="numeric">${esc(r.id)}</b></div>
          <div class="summary-row"><span>Khách hàng</span><b>${esc(r.name || '—')}</b></div>
          <div class="summary-row"><span>Số điện thoại</span><b class="numeric">${esc(r.phone || '—')}</b></div>
          <div class="summary-row"><span>Chủ đề</span><b>${esc(r.subject || 'Yêu cầu tư vấn')}</b></div>
          <div class="summary-row"><span>Thời gian gửi</span><b class="numeric">${formatReqTime(r.createdAt)}</b></div>
        </div>
        <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.5;">
          Dữ liệu yêu cầu sau khi xóa sẽ được gỡ hoàn toàn khỏi danh sách quản trị và không thể khôi phục.
        </p>
      </div>
    `, 'Xác nhận xóa', `delete-request:${r.id}`, 'btn-danger');
  }

  function adminRequests() {
    const all = (state.requests || []).slice().sort((a,b) => String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    const filter = requestFilterState;
    
    const countPending = all.filter(r => !r.status || r.status === 'pending').length;
    const countInProgress = all.filter(r => r.status === 'in_progress').length;
    const countResolved = all.filter(r => r.status === 'resolved').length;
    const countCancelled = all.filter(r => r.status === 'cancelled').length;

    const filtered = all.filter(r => {
      const st = r.status || 'pending';
      if (filter.status !== 'all' && st !== filter.status) return false;
      const kind = r.kind || (r.code ? 'appointment' : 'consultation');
      if (filter.kind !== 'all' && kind !== filter.kind) return false;
      if (filter.search) {
        const q = filter.search.toLowerCase();
        const str = `${r.name || ''} ${r.phone || ''} ${r.email || ''} ${r.id || ''} ${r.code || ''} ${r.subject || ''} ${r.message || ''}`.toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });

    const body = `
      <section class="stat-grid">
        <div class="stat-card">
          <small>Tổng yêu cầu tiếp nhận</small>
          <strong class="numeric">${String(all.length).padStart(2, '0')}</strong>
          <span>Tất cả liên hệ từ website</span>
        </div>
        <div class="stat-card">
          <small>Chờ tiếp nhận & xử lý</small>
          <strong class="numeric" style="color:var(--wine);">${String(countPending).padStart(2, '0')}</strong>
          <span>${countPending ? 'Cần phản hồi khách hàng' : 'Không có yêu cầu chờ'}</span>
        </div>
        <div class="stat-card">
          <small>Đang liên hệ tư vấn</small>
          <strong class="numeric">${String(countInProgress).padStart(2, '0')}</strong>
          <span>Đang trao đổi & xếp lịch</span>
        </div>
        <div class="stat-card">
          <small>Đã hoàn thành / Chốt lịch</small>
          <strong class="numeric" style="color:var(--green);">${String(countResolved).padStart(2, '0')}</strong>
          <span>Đã hoàn tất hỗ trợ</span>
        </div>
      </section>

      <div class="toolbar">
        <input id="req-search" placeholder="Tìm theo tên khách hàng, số điện thoại, email, mã yêu cầu..." value="${esc(filter.search || '')}">
        <select id="req-status-filter">
          <option value="all" ${filter.status === 'all' ? 'selected' : ''}>Tất cả trạng thái (${all.length})</option>
          <option value="pending" ${filter.status === 'pending' ? 'selected' : ''}>Chờ xử lý (${countPending})</option>
          <option value="in_progress" ${filter.status === 'in_progress' ? 'selected' : ''}>Đang xử lý (${countInProgress})</option>
          <option value="resolved" ${filter.status === 'resolved' ? 'selected' : ''}>Đã hoàn thành (${countResolved})</option>
          <option value="cancelled" ${filter.status === 'cancelled' ? 'selected' : ''}>Đã hủy (${countCancelled})</option>
        </select>
        <select id="req-kind-filter">
          <option value="all" ${filter.kind === 'all' ? 'selected' : ''}>Tất cả loại yêu cầu</option>
          <option value="consultation" ${filter.kind === 'consultation' ? 'selected' : ''}>Chỉ tư vấn</option>
          <option value="appointment" ${filter.kind === 'appointment' ? 'selected' : ''}>Theo lịch hẹn</option>
        </select>
        <button class="btn btn-sm" data-action="reset-req-filter">Đặt lại bộ lọc</button>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th style="min-width:130px;">Mã yêu cầu</th>
              <th style="min-width:200px;">Khách hàng</th>
              <th style="min-width:180px;">Email liên hệ</th>
              <th style="min-width:260px;">Chủ đề & Lời nhắn</th>
              <th style="min-width:130px;">Trạng thái</th>
              <th style="min-width:160px;">Ghi chú vận hành</th>
              <th style="min-width:190px;text-align:right;">Thao tác</th>
            </tr>
          </thead>
          <tbody id="requests-table-body">
            ${filtered.length ? filtered.map(r => {
              const curStatus = r.status || 'pending';
              const badgeCls = curStatus === 'resolved' ? 'success' : (curStatus === 'pending' ? 'warning' : (curStatus === 'in_progress' ? 'info' : ''));
              const statusLabel = curStatus === 'resolved' ? 'Đã hoàn thành' : (curStatus === 'in_progress' ? 'Đang xử lý' : (curStatus === 'cancelled' ? 'Đã hủy' : 'Chờ xử lý'));
              const cleanPhone = (r.phone || '').replace(/\D/g, '');
              return `
                <tr class="clickable-row" data-action="req-open-modal" data-id="${esc(r.id)}" data-status="${curStatus}" title="Nhấp vào dòng để xem chi tiết yêu cầu">
                  <td class="numeric">
                    <b>${esc(r.id)}</b>
                    <small class="numeric" style="color:#6b7280;display:block;margin-top:2px;">${formatReqTime(r.createdAt)}</small>
                    ${r.code ? `<small class="numeric" style="display:block;margin-top:2px;"><a href="#/booking/${r.code}" class="link" style="font-size:11px;" onclick="event.stopPropagation()">Lịch: ${esc(r.code)}</a></small>` : ''}
                  </td>
                  <td>
                    <b class="row-hover-link">${esc(r.name || 'Khách hàng')}</b>
                    <br><small class="numeric" style="color:#6b7280;">${esc(r.phone || '—')}</small>
                  </td>
                  <td class="numeric">
                    ${r.email ? `<a href="mailto:${esc(r.email)}" style="color:inherit;text-decoration:none;" onclick="event.stopPropagation()">${esc(r.email)}</a>` : '<span style="color:#9ca3af;">—</span>'}
                  </td>
                  <td>
                    <b>${esc(r.subject || 'Yêu cầu tư vấn')}</b>
                    ${r.message ? `<div style="color:#6b7280;font-size:12px;margin-top:2px;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(r.message)}</div>` : ''}
                    ${r.date ? `<small style="color:var(--wine);display:block;margin-top:2px;">Đề xuất: ${esc(r.date)} ${esc(r.time || '')}</small>` : ''}
                  </td>
                  <td>
                    <span class="badge ${badgeCls}">${statusLabel}</span>
                  </td>
                  <td>
                    ${r.reply ? `<span style="font-size:13px;color:#374151;">${esc(r.reply)}</span>` : '<span style="color:#9ca3af;">—</span>'}
                  </td>
                  <td style="text-align:right;">
                    <div class="table-actions" style="justify-content:flex-end;">
                      <button class="action-btn action-btn-edit" data-action="req-edit-full" data-id="${esc(r.id)}" title="Chỉnh sửa thông tin">
                        ${icon('edit')}<span>Sửa</span>
                      </button>
                      <button class="action-btn action-btn-status" data-action="req-status" data-id="${esc(r.id)}" title="Đổi trạng thái">
                        ${icon('clock')}<span>Trạng thái</span>
                      </button>
                      <button class="action-btn action-btn-delete" data-action="req-delete-confirm" data-id="${esc(r.id)}" title="Xóa yêu cầu">
                        ${icon('trash')}<span>Xóa</span>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('') : `
              <tr>
                <td colspan="7">
                  <div class="empty-table" style="padding:48px 16px;">Không tìm thấy yêu cầu hỗ trợ nào phù hợp với bộ lọc hiện tại.</div>
                </td>
              </tr>
            `}
          </tbody>
        </table>
      </div>
    `;

    return adminShell(
      'requests',
      body,
      'Yêu cầu hỗ trợ & Tư vấn',
      'Tiếp nhận lời nhắn, tư vấn dịch vụ và giải quyết yêu cầu đổi/hủy lịch từ khách hàng.'
    );
  }
  document.addEventListener('submit',async event=>{
    const form=event.target,kind=form.dataset.form;
    if(!['contact','booking-request','site-search','support-search','resolve-request','contact-settings','content'].includes(kind))return;
    event.preventDefault();event.stopImmediatePropagation();const data=Object.fromEntries(new FormData(form));
    if(kind==='site-search'||kind==='support-search')return route('/'+(kind==='site-search'?'search':'support')+'?q='+encodeURIComponent(data.q||'')+(kind==='support-search'&&data.category?'&category='+encodeURIComponent(data.category):''));
    if(kind==='contact-settings'){try{await api({action:'saveContent',key:'brand',value:{...state.brand,...data}});Object.assign(state.brand,data);toast('Đã lưu thông tin liên hệ');}catch(error){toast(error.message);}return;}
    if(kind==='content'){
      try {
        Object.assign(state.brand, data);
        if (data.deposit !== undefined) state.settings.deposit = String(data.deposit);
        if (data.travelFee !== undefined) state.settings.travelFee = String(data.travelFee);
        if (data.accent) document.documentElement.style.setProperty('--wine', data.accent);
        await api({ action: 'saveContent', key: 'brand', value: state.brand });
        await api({ action: 'saveContent', key: 'settings', value: state.settings });
        toast('Đã lưu nội dung website thành công');
        render();
      } catch(error) {
        toast(error.message || 'Lỗi lưu nội dung');
      }
      return;
    }
    const button=form.querySelector('button[type=submit],button:not([type])');if(button)button.disabled=true;
    try{
      const r=await api(kind==='resolve-request'?{action:'resolveRequest',...data}:{action:'createRequest',...data});
      await hydrateBackend(true);
      if(kind==='resolve-request'){closeModal();render();toast('Đã lưu kết quả xử lý');return;}
      const status=form.querySelector('[role=status]');if(status)status.textContent='Đã nhận yêu cầu '+r.request.id+'. Hoàn sẽ kiểm tra và liên hệ với bạn.';
      form.reset();toast('Đã gửi yêu cầu '+r.request.id);
    }catch(error){const status=form.querySelector('[role=status]');if(status)status.textContent=error.message;else toast(error.message);}
    finally{if(button)button.disabled=false;}
  });
  document.addEventListener('change',async event=>{
    const input=event.target;
    if(input.matches('[data-payment-qr]')){
      const file=input.files[0];if(!file)return;
      if(file.size>5*1024*1024)return toast('Ảnh QR không quá 5 MB.');
      const data=new FormData();data.append('files',file);input.disabled=true;
      try{
        const response=await fetch('/api/uploads',{method:'POST',body:data});const result=await response.json();
        if(!response.ok)throw Error(result.error);
        const settings={...state.settings,paymentQrUrl:result.paths[0]};
        await api({action:'saveContent',key:'settings',value:settings});
        state.settings=settings;saveState();render();toast('Đã lưu mã QR nhận tiền');
      }catch(error){toast(error.message);input.disabled=false;}
      return;
    }
    if(input.matches('[data-action="mockup-upload-single"]')){
      const file=input.files[0];if(!file)return;
      if(file.size>5*1024*1024)return toast('Ảnh không quá 5 MB.');
      const data=new FormData();data.append('files',file);input.disabled=true;
      try{
        const response=await fetch('/api/uploads',{method:'POST',body:data});const r=await response.json();if(!response.ok)throw Error(r.error);
        state.booking.references=state.booking.references||[];
        const idx=Number(input.dataset.index);
        state.booking.references[idx]=r.paths[0];
        saveState();render();toast('Đã tải ảnh tham khảo');
      }catch(error){toast(error.message);input.disabled=false;}
      return;
    }
    if(input.matches('[data-ct-upload]')){
      const files=[...input.files];if(files.length>3||files.some(f=>f.size>5*1024*1024)){input.value='';return toast('Chọn tối đa 3 ảnh, mỗi ảnh không quá 5 MB.');}
      const data=new FormData();files.forEach(f=>data.append('files',f));input.disabled=true;
      try{const response=await fetch('/api/uploads',{method:'POST',body:data});const r=await response.json();if(!response.ok)throw Error(r.error);state.booking.references=r.paths;saveState();render();toast('Đã lưu ảnh tham khảo');}
      catch(error){toast(error.message);input.disabled=false;}
    }
    if(input.id==='contact-file-input'){
      const files=[...input.files];
      const statusEl=document.querySelector('.contact-file-status');
      if(statusEl){
        if(files.length>0){
          statusEl.textContent=`Đã chọn: ${files.map(f=>f.name).join(', ')}`;
          statusEl.hidden=false;
        }else{
          statusEl.textContent='';
          statusEl.hidden=true;
        }
      }
    }
    if(input.id==='deposit-receipt-file'){
      const file=input.files?.[0];
      if(file){
        if(file.size > 5 * 1024 * 1024) return toast('Kích thước ảnh vượt quá 5MB');
        const reader = new FileReader();
        reader.onload = e => {
          state.booking.receiptData = e.target.result;
          state.booking.receiptName = file.name;
          saveState();
          render();
          toast('✓ Đã đính kèm ảnh bill chuyển khoản: ' + file.name);
        };
        reader.readAsDataURL(file);
      }
    }
    if(input.id==='deposit-policy-consent'){
      state.booking.depositConsent=input.checked;
      saveState();
    }
  });
  document.addEventListener('click',async event=>{
    const el=event.target.closest('[data-action]');if(!el)return;
    const _a=el.dataset.action;
    const _handledInThisListener = _a === 'start-booking' || _a.startsWith('ct-') || _a.startsWith('req-') || _a==='reset-req-filter' || _a==='admin-confirm-deposit' || _a==='admin-reset-deposit' || _a==='look-book';
    if(!_handledInThisListener) return;
    const action=el.dataset.action;event.preventDefault();event.stopImmediatePropagation();
    try{
      if(action==='start-booking'){
        startNewBooking();
      }else if(action==='admin-confirm-deposit'||action==='ct-admin-confirm-deposit'){
        if (!financeAdmin) return toast('Đang tải sổ thu chi. Vui lòng thử lại.');
        financeAdmin.open(el.dataset.code || state.booking.code || '', 'deposit');
      }else if(action==='admin-reset-deposit'||action==='ct-admin-reset-deposit'){
        if (!financeAdmin) return toast('Đang tải sổ thu chi. Vui lòng thử lại.');
        financeAdmin.open(el.dataset.code || state.booking.code || '', 'refund');
      }else if(action==='ct-copy-transfer'){
        const val=document.getElementById('transfer-code-val')?.value||'';
        if(val){
          await navigator.clipboard.writeText(val);
          toast('Đã sao chép nội dung: '+val);
          const orig=el.innerHTML;
          el.innerHTML='<span style="font-size:12px;font-weight:600;color:#2e7d32;">✓ Đã chép</span>';
          setTimeout(()=>{el.innerHTML=orig;},1800);
        }
      }else if(action==='ct-copy-account'){
        const val=el.dataset.value||'0901234567';
        await navigator.clipboard.writeText(val);
        toast('Đã sao chép số tài khoản: '+val);
        const orig=el.innerHTML;
        el.innerHTML='<span style="font-size:11px;font-weight:600;color:#2e7d32;">✓ Đã chép</span>';
        setTimeout(()=>{el.innerHTML=orig;},1800);
      }else if(action==='ct-tab-momo'){
        toast('Cổng thanh toán MoMo đang kết nối đối soát. Vui lòng chuyển khoản qua VietQR.');
      }else if(action==='ct-open-deposit-policy'){
        modal('Chính sách đặt cọc giữ lịch', `
          <div style="font-size:14px;line-height:1.6;color:#333;text-align:left;">
            <p style="margin-bottom:12px;"><strong>1. Mức cọc tiêu chuẩn:</strong> Mức cọc là <strong>${money(state.booking.deposit ?? state.settings.deposit ?? 200000)}</strong> theo lịch hẹn đã tạo. Khoản cọc này đảm bảo chuyên viên dành trọn khung giờ phục vụ riêng cho bạn và sẽ được trừ 100% vào tổng chi phí dịch vụ.</p>
            <p style="margin-bottom:12px;"><strong>2. Đối soát & Giữ chỗ:</strong> Khi bạn bấm <em>"Tôi đã chuyển khoản"</em>, hệ thống ghi nhận lịch ở trạng thái <em>"Chờ đối soát"</em>. Hoàn sẽ đối soát giao dịch và cập nhật xác nhận trên trang lịch hẹn.</p>
            <p style="margin-bottom:0;"><strong>3. Thời gian hoàn tất:</strong> Lịch được xác nhận sau khi Hoàn đối soát khoản cọc và kiểm tra khung giờ.</p>
          </div>
        `, 'Đã hiểu', 'close-modal');
      }else if(action==='ct-open-reschedule-policy'){
        modal('Chính sách đổi lịch & hoàn cọc', `
          <div style="font-size:14px;line-height:1.6;color:#333;text-align:left;">
            <p style="margin-bottom:12px;"><strong>1. Đổi lịch hẹn:</strong> Khách hàng được đổi lịch hẹn miễn phí trước ít nhất <strong>24 giờ</strong> so với thời gian bắt đầu đã hẹn.</p>
            <p style="margin-bottom:12px;"><strong>2. Hủy lịch & Hoàn cọc:</strong> Yêu cầu hủy lịch được gửi trước ít nhất <strong>48 giờ</strong> sẽ được hoàn 100% tiền cọc về tài khoản của bạn.</p>
            <p style="margin-bottom:0;"><strong>3. Trường hợp khẩn cấp:</strong> Nếu có việc đột xuất phát sinh, vui lòng liên hệ trực tiếp số hotline hoặc Zalo của Hoàn để được hỗ trợ linh hoạt nhất.</p>
          </div>
        `, 'Đã hiểu', 'close-modal');
      }else if(action==='ct-trigger-receipt'){
        document.getElementById('deposit-receipt-file')?.click();
      }else if(action==='ct-remove-receipt'){
        delete state.booking.receiptData;
        delete state.booking.receiptName;
        saveState();
        render();
        toast('Đã gỡ ảnh đính kèm');
      }else if(action==='ct-report-transfer'){
        const b = state.booking;
        const consent = document.querySelector ? document.querySelector('#deposit-policy-consent') : null;
        if(consent&&!consent.checked){
          toast('Vui lòng đọc và đồng ý chính sách đặt cọc.');
          if (consent.scrollIntoView) consent.scrollIntoView({behavior:'smooth',block:'center'});
          if (consent.focus) consent.focus();
          return;
        }
        if (!b.code || !getAppointment(b.code)?.phone) return toast('Vui lòng tạo mã lịch trước khi báo chuyển khoản.');
        el.disabled = true;
        const result = await api({ action: 'reportPayment', code: b.code, phone: b.phone });
        if (!result.appointment) throw new Error('Chưa gửi được thông báo chuyển khoản.');
        Object.assign(getAppointment(b.code), result.appointment);
        b.depositConsent = true; b.depositReported = true; b.depositStatus = 'pending_verification';
        saveState(); render(); toast('Đã gửi thông báo. Hoàn sẽ kiểm tra giao dịch thực tế.');
      }else if(action==='ct-deposit-confirmed-proceed'){
        const consent = document.querySelector ? document.querySelector('#deposit-policy-consent') : null;
        if(consent && !consent.checked){
          toast('Vui lòng đọc và đồng ý chính sách đặt cọc.');
          if (consent.scrollIntoView) consent.scrollIntoView({behavior:'smooth',block:'center'});
          if (consent.focus) consent.focus();
          return;
        }
        state.booking.depositConsent = true;
        saveState();
        route('/booking/confirm');
      }else if(action==='ct-deposit-view'){
        route('/booking/deposit');
      }else if(action==='ct-contact-attach'){
        document.getElementById('contact-file-input')?.click();
      }else if(action==='ct-prepare-deposit'){
        el.disabled = true;
        try { await prepareDepositBooking(true); render(); } catch (error) { render(); toast(error.message); }
      }else if(action==='ct-next'){

        const step=Number(el.dataset.step),form=document.querySelector('.ct-booking form');
        if(step===3 && !bookingLocation?.validate()) return;
        if(form){
          if(!form.reportValidity())return;
          Object.assign(state.booking,Object.fromEntries(new FormData(form)));
          for(const box of form.querySelectorAll('input[type=checkbox][name]'))state.booking[box.name]=box.checked;
        }
        if(step===1&&service().contact)return route('/contact');
        if(step===2){if(!state.booking.time||slotUnavailable(state.booking.date,state.booking.time)||!state.settings.scheduleOpen)return toast('Vui lòng chọn một khung giờ còn trống.');}
        if(step===3){state.booking.locationType='client';state.booking.district='';state.booking.travelFee=Math.max(0,Number(state.settings.travelFee??50000)||0);}
        saveState();
        if (step === 4) { el.disabled = true; el.textContent = 'Đang tạo mã lịch…'; await prepareDepositBooking(true); }
        route(el.dataset.next);
      }else if(action==='ct-date'){state.booking.date=el.dataset.date;state.booking.time=defaultBookingTime(el.dataset.date);saveState();render();}
      else if(action==='ct-month'){const d=new Date((state.calendarMonth||state.booking.date).slice(0,7)+'-01T12:00:00');d.setMonth(d.getMonth()+Number(el.dataset.delta));state.calendarMonth=localIso(d);render();}
      else if(action==='look-book'){state.booking.serviceId=el.dataset.id;state.booking.style=el.dataset.style;saveState();route(service().contact?'/contact':'/booking/time');}
      else if(action==='ct-copy'){await navigator.clipboard.writeText(el.dataset.value);toast('Đã sao chép');}
      else if(action==='ct-refresh'){const code=(location.hash.match(/^#\/booking\/([^/?]+)/)||[])[1];const appointment=code&&getAppointment(code);if(appointment?.phone){await lookupOwnBooking(code,appointment.phone);render();}else await hydrateBackend();toast('Đã cập nhật trạng thái');}
      else if(action==='ct-payment-report'){
        el.disabled=true;
        try {
          const requestedCode = el.dataset.code;
          const phone = getAppointment(requestedCode)?.phone || verifiedBookings.get(requestedCode)?.appointment?.phone || (state.booking.code === requestedCode ? state.booking.phone : '');
          if (!requestedCode || !phone) { route('/lookup'); throw new Error('Vui lòng tra cứu lịch bằng mã và số điện thoại trước khi báo chuyển khoản.'); }
          const appointment = await lookupOwnBooking(requestedCode, phone);
          const result = await api({action:'reportPayment',code:appointment.code,phone:appointment.phone});
          if (!result.appointment) throw new Error('Không thể gửi yêu cầu đối soát.');
          Object.assign(appointment, result.appointment);
          state.booking.depositReported = true;
          state.booking.depositStatus = 'pending_verification';
          saveState();
          render();
          toast('Đã gửi thông báo chuyển khoản cho Hoàn. Đang chờ đối soát.');
        } catch (error) {
          el.disabled = false;
          toast(error.message || 'Không thể gửi thông báo chuyển khoản.');
        }
      }
      else if(action==='ct-calendar-download'){const c=el.dataset.code||'HOAN-MAU-001';const a=getAppointment(c)||{code:c,date:localIso(),time:'10:00',serviceId:'party',status:'confirmed'};const sObj=service(a.serviceId)||{name:'Trang điểm dự tiệc',duration:90};const d=new Date((a.date||localIso())+'T'+(a.time||'10:00')+':00+07:00'),end=new Date(d.getTime()+(sObj.duration||90)*60000),fmt=d=>d.toISOString().replace(/[-:]/g,'').replace('.000','');downloadText('lich-'+a.code+'.ics',['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//HOAN//Booking//VI','BEGIN:VEVENT','UID:'+a.code+'@hoan','DTSTAMP:'+fmt(new Date()),'DTSTART:'+fmt(d),'DTEND:'+fmt(end),'SUMMARY:'+sObj.name+' - HOÀN','STATUS:'+(a.status==='confirmed'?'CONFIRMED':'TENTATIVE'),'END:VEVENT','END:VCALENDAR'].join('\r\n'));toast('Đã tải lịch hẹn vào máy');}
      else if(action==='ct-resolve' || action==='req-open-modal'){
        modalViewRequest(el.dataset.id);
      }
      else if(action==='req-status'){
        modalReqStatus(el.dataset.id);
      }
      else if(action==='req-edit-reply' || action==='req-edit-full'){
        modalEditRequest(el.dataset.id);
      }
      else if(action==='req-delete' || action==='req-delete-confirm'){
        modalDeleteRequest(el.dataset.id);
      }
      else if(action==='reset-req-filter'){
        requestFilterState = { status: 'all', kind: 'all', search: '' };
        render();
      }
    }catch(error){toast(error.message);el.disabled=false;}
  });

  document.addEventListener('input', (event) => {
    if (event.target && event.target.id === 'req-search') {
      requestFilterState.search = event.target.value;
      render();
      const inp = document.getElementById('req-search');
      if (inp) {
        inp.focus();
        inp.setSelectionRange(inp.value.length, inp.value.length);
      }
    }
  });

  document.addEventListener('change', (event) => {
    if (event.target && event.target.id === 'req-status-filter') {
      requestFilterState.status = event.target.value;
      render();
    }
    if (event.target && event.target.id === 'req-kind-filter') {
      requestFilterState.kind = event.target.value;
      render();
    }
  });

  document.addEventListener('submit', async (event) => {
    const form = event.target;
    if (!form.dataset.form) return;
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (form.dataset.form === 'location') {
      Object.assign(state.booking, data);
      state.booking.travelFee = state.booking.locationType === 'artist' ? 0 : 50000;
      saveState('Đã lưu địa chỉ phục vụ');
    } else if (form.dataset.form === 'info') {
      Object.assign(state.booking, data);
      saveState('Đã lưu thông tin của bạn');
    } else if (form.dataset.form === 'lookup') {
      try {
        const response = await fetch('/api/data?code=' + encodeURIComponent(String(data.code || '')) + '&phone=' + encodeURIComponent(String(data.phone || '')));
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Chưa tìm thấy lịch phù hợp.');
        retainVerifiedBooking(result);
        route('/booking/' + result.appointment.code);
      } catch (error) {
        const status = form.querySelector('[role=status]');
        if (status) status.textContent = error.message;
      }
    } else if (form.dataset.form === 'help-search') {
      const q = String(data.q || '').toLowerCase();
      $$('.accordion-item').forEach((item,i)=>item.style.display = faqItems[i].join(' ').toLowerCase().includes(q) ? '' : 'none');
      toast(q ? 'Đã lọc câu hỏi phù hợp' : 'Đang hiển thị tất cả câu hỏi');
    } else if (form.dataset.form === 'content') {
      const dataObj = Object.fromEntries(new FormData(form));
      if (dataObj.deposit !== undefined) {
        state.settings.deposit = Number(dataObj.deposit);
        delete dataObj.deposit;
      }
      if (dataObj.travelFee !== undefined) {
        state.settings.travelFee = Number(dataObj.travelFee);
        delete dataObj.travelFee;
      }
      Object.assign(state.brand, dataObj);
      try {
        await api({action:'saveContent',key:'brand',value:state.brand});
        await api({action:'saveContent',key:'settings',value:state.settings});
        toast('Đã lưu nội dung website vào dữ liệu thật');
        render();
      }
      catch(error){ toast(error.message); }
    } else if (form.dataset.form === 'settings') {
      Object.assign(state.settings, data);
      try { await api({action:'saveContent',key:'settings',value:state.settings}); toast('Đã lưu cài đặt'); }
      catch(error){ toast(error.message); }
    }
  });

  document.addEventListener('input', (event) => {
    if (event.target.matches('[data-support-search]')) { filterSupportAnswers(event.target.value); return; }
    if (event.target.tagName === 'SELECT') return;
    const bookingForm=event.target.closest('form[data-form="info"]');
    if(bookingForm && event.target.name) {
      state.booking[event.target.name]=event.target.type==='checkbox'?event.target.checked:event.target.value;
      saveState();
    }
    const contentForm = event.target.closest('form[data-form="content"]');
    if (contentForm && event.target.name) {
      const name = event.target.name;
      const val = event.target.value;
      if (name === 'deposit' || name === 'travelFee') {
        state.settings[name] = Number(val);
      } else {
        state.brand[name] = val;
      }
      if (name === 'name') {
        const el = document.getElementById('preview-brand-name');
        if (el) el.textContent = val;
      } else if (name === 'headline') {
        const el = document.getElementById('preview-headline');
        if (el) el.textContent = val;
      } else if (name === 'description') {
        const el = document.getElementById('preview-desc');
        if (el) el.textContent = val;
      } else if (name === 'homeTitle') {
        const el = document.getElementById('preview-home-title');
        if (el) el.textContent = val;
      } else if (name === 'homeSubtitle') {
        const el = document.getElementById('preview-home-subtitle');
        if (el) el.textContent = val;
      } else if (name === 'editorialOverline') {
        const el = document.getElementById('preview-home-overline');
        if (el) el.textContent = val;
      } else if (name === 'editorialTitle') {
        const el = document.getElementById('preview-home-edtitle');
        if (el) el.textContent = val;
      } else if (name === 'aboutTitle') {
        const el = document.getElementById('preview-about-title');
        if (el) el.textContent = val;
      } else if (name === 'servicesPageTitle') {
        const el = document.getElementById('preview-services-title');
        if (el) el.textContent = val;
      } else if (name === 'policiesPageTitle') {
        const el = document.getElementById('preview-policies-title');
        if (el) el.textContent = val;
      } else if (name === 'contactPageTitle') {
        const el = document.getElementById('preview-contact-title');
        if (el) el.textContent = val;
      } else if (name === 'phone') {
        const el = document.getElementById('preview-contact-phone');
        if (el) el.textContent = val;
      } else if (name === 'email') {
        const el = document.getElementById('preview-contact-email');
        if (el) el.textContent = val;
      } else if (name === 'accent') {
        document.documentElement.style.setProperty('--wine', val);
      }
    }
    if (event.target.id === 'appointment-search' || event.target.id === 'appointment-status') {
      const q = ($('#appointment-search')?.value || '').toLowerCase();
      const status = $('#appointment-status')?.value || 'all';
      const rows = state.appointments.filter(a => (a.customer+' '+a.code+' '+a.phone).toLowerCase().includes(q) && (status==='all'||a.status===status));
      $('#appointments-table').innerHTML = appointmentsTable(rows);
    }
    if (event.target.id === 'customer-search') {
      const q = event.target.value.toLowerCase();
      $$('#customer-body tr').forEach(row => row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none');
    }
  });

  document.addEventListener('change', (event) => {
    if (event.target.matches('[data-action="reference-upload"]')) toast('Đã thêm '+event.target.files.length+' ảnh tham khảo');
    if (event.target.matches('[data-action="gallery-upload"]')) {
      toast('Đã chọn '+event.target.files.length+' ảnh. Ảnh sẽ xuất hiện sau khi đăng.');
    }
    if (event.target.closest('form[data-form="info"]') && event.target.name) {
      state.booking[event.target.name]=event.target.type==='checkbox'?event.target.checked:event.target.value;
      saveState();
    }
  });

  function renderAdminRecordForm({ title = '', desc = '', price = 450000, duration = 60, image = 'natural.png', tag = 'Tự nhiên', serviceId = '', isService = true }) {
    const input = (id, label, value, attrs = '') => `<label class="record-field" for="${id}"><span>${label}</span><input id="${id}" value="${esc(value)}" ${attrs}></label>`;
    if (isService) return `<div class="admin-record-form" data-record-kind="service">
      ${input('modal-service-name', 'Tên dịch vụ', title, 'required maxlength="140" placeholder="Nhập tên dịch vụ"')}
      <label class="record-field" for="modal-service-desc"><span>Mô tả</span><textarea id="modal-service-desc" rows="4" maxlength="3000" placeholder="Nội dung giới thiệu dịch vụ">${esc(desc)}</textarea></label>
      <div class="record-field-grid">${input('modal-service-price','Giá (VNĐ)',price,'type="number" min="0" step="1" required')}${input('modal-service-duration','Thời lượng (phút)',duration,'type="number" min="1" max="1440" step="1" required')}</div>
    </div>`;
    return `<div class="admin-preview-grid admin-record-form" data-record-kind="portfolio"><div>
      ${input('modal-port-title', 'Tên ảnh', title, 'required maxlength="140" placeholder="Nhập tên ảnh hoặc phong cách"')}
      <label class="record-field" for="modal-port-note"><span>Mô tả</span><textarea id="modal-port-note" rows="4" maxlength="3000" placeholder="Ghi chú về phong cách hoặc bộ ảnh">${esc(desc)}</textarea></label>
      <div class="record-field-grid"><label class="record-field" for="modal-port-tag"><span>Phong cách</span><select id="modal-port-tag">${['Cô dâu','Dự tiệc','Tự nhiên','Chụp ảnh'].map(value => `<option ${value === tag ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label class="record-field" for="modal-port-service"><span>Dịch vụ</span><select id="modal-port-service">${state.services.map(service => `<option value="${esc(service.id)}" ${service.id === serviceId ? 'selected' : ''}>${esc(service.name)}</option>`).join('')}</select></label></div>
      <div class="record-image-tools"><span>Ảnh bộ sưu tập</span><label class="btn">Tải ảnh lên<input type="file" id="modal-card-file-upload" accept="image/png,image/jpeg,image/webp" hidden></label><small>JPG, PNG, WebP · Tối đa 5 MB</small><p id="card-upload-file-status" role="status">${esc(image?.split('/').pop() || '')}</p></div>
      <details class="record-image-library"><summary>Chọn ảnh có sẵn</summary><div>${[['natural.png','Tự nhiên'],['evening.png','Dự tiệc'],['bridal-new.png','Cô dâu'],['campaign.png','Chụp ảnh']].map(([src,label]) => `<button type="button" data-record-image="${src}" aria-label="${label}"><img src="/assets/${src}" alt=""><span>${label}</span></button>`).join('')}</div></details>
      <input id="modal-port-img" type="hidden" value="${esc(image)}">
    </div><figure class="record-image-preview"><img id="card-live-preview-img" src="${esc(assetUrl(image || 'natural.png'))}" alt="Ảnh bộ sưu tập"><figcaption>Ảnh đã chọn</figcaption></figure></div>`;
  }

  function bindAdminRecordForm() {
    const form = document.querySelector('.admin-record-form');
    if (!form) return;
    const input = form.querySelector('#modal-port-img'), preview = form.querySelector('#card-live-preview-img'), status = form.querySelector('#card-upload-file-status');
    form.querySelectorAll('[data-record-image]').forEach(button => button.addEventListener('click', () => {
      input.value = button.dataset.recordImage; preview.src = assetUrl(input.value); status.textContent = 'Ảnh đã chọn: ' + button.getAttribute('aria-label');
    }));
    form.querySelector('#modal-card-file-upload')?.addEventListener('change', async event => {
      const file = event.target.files[0]; if (!file) return;
      if (file.size > 5 * 1024 * 1024 || !['image/jpeg','image/png','image/webp'].includes(file.type)) { status.textContent = 'Chọn ảnh JPG, PNG hoặc WebP, tối đa 5 MB.'; event.target.value = ''; return; }
      const controls = [...form.querySelectorAll('[data-record-image], #modal-card-file-upload'), document.querySelector('.modal [data-action="modal-confirm"]')];
      form.dataset.uploading = '1'; controls.forEach(button => { button.disabled = true; }); status.textContent = 'Đang tải ảnh…';
      try {
        const data = new FormData(); data.append('files', file);
        let token = ''; try { token = localStorage.getItem('hoanAdminToken') || sessionStorage.getItem('hoanAdminToken') || ''; } catch {}
        const response = await fetch('/api/uploads', { method:'POST', body:data, headers:token ? { Authorization:'Bearer ' + token } : {} });
        const result = await response.json(); if (!response.ok || !result.paths?.[0]) throw new Error(result.error || 'Không tải được ảnh.');
        input.value = result.paths[0]; preview.src = input.value; status.textContent = 'Đã tải ảnh: ' + file.name;
      } catch (error) { status.textContent = error.message; }
      finally { delete form.dataset.uploading; controls.forEach(button => { button.disabled = false; }); event.target.value = ''; }
    });
  }

  document.addEventListener('click', async (event) => {
    const el = event.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    if (action === 'mobile-menu') {const on=$('#site-header')?.classList.toggle('menu-open');el.setAttribute('aria-expanded',String(!!on));}
    else if (action === 'choose-service' || action === 'booking-service') {
      const selected = state.services.find(s => s.id === el.dataset.id && s.enabled);
      if (!selected) return toast('Dịch vụ hiện không khả dụng. Vui lòng chọn dịch vụ khác.');
      if (state.booking.serviceId !== selected.id) state.booking.style = '';
      state.booking.serviceId = selected.id;
      if (el.dataset.style) state.booking.style = el.dataset.style;
      saveState();
      route(action === 'choose-service' ? (selected.contact ? '/contact' : '/booking/time') : '/booking/service');
      render();
    }
    else if (action === 'go-step') {
      const form = document.querySelector('.ct-booking form');
      if (location.hash.split('?')[0] === '#/booking/location' && ['/booking/info','/booking/deposit','/booking/confirm'].includes(el.dataset.target) && !bookingLocation?.validate()) return;
      if (form && form.dataset.form !== 'location') {
        Object.assign(state.booking, Object.fromEntries(new FormData(form)));
        for (const box of form.querySelectorAll('input[type=checkbox][name]')) state.booking[box.name] = box.checked;
        saveState();
      }
      route(el.dataset.target);
    }
    else if (action === 'booking-back') {
      const step = Number(el.dataset.step) || (
        location.hash.includes('/booking/confirm') ? 6 :
        location.hash.includes('/booking/deposit') ? 5 :
        location.hash.includes('/booking/info') ? 4 :
        location.hash.includes('/booking/location') ? 3 :
        location.hash.includes('/booking/time') ? 2 :
        location.hash.includes('/booking/service') ? 1 : 1
      );
      const form = document.querySelector('.ct-booking form');
      if (form && form.dataset.form !== 'location') {
        Object.assign(state.booking, Object.fromEntries(new FormData(form)));
        for (const box of form.querySelectorAll('input[type=checkbox][name]')) state.booking[box.name] = box.checked;
        saveState();
      }
      const prevStepRoutes = {
        6: '/booking/deposit',
        5: '/booking/info',
        4: '/booking/location',
        3: '/booking/time',
        2: '/booking/service',
        1: '/'
      };
      const prevRoute = prevStepRoutes[step] || '/';
      route(prevRoute);
    }
    else if (action === 'remove-ref-photo') {
      const idx = Number(el.dataset.index);
      if (state.booking.references && state.booking.references[idx] != null) {
        state.booking.references.splice(idx, 1);
        saveState();
        render();
        toast('Đã gỡ ảnh tham khảo');
      }
    }
    else if (action === 'date-select') { const m = (state.calendarMonth || state.booking.date || localIso()).slice(0,7); state.booking.date = `${m}-${String(el.dataset.day).padStart(2,'0')}`; saveState(); render(); }
    else if (action === 'time-select') {
      if (el.disabled || slotUnavailable(state.booking.date, el.dataset.time)) {
        toast('Khung giờ này đã có khách hoặc không còn khả dụng. Vui lòng chọn giờ khác.');
        return;
      }
      state.booking.time = el.dataset.time; saveState(); render();
    }
    else if (action === 'location-type') { state.booking.locationType = el.dataset.type; state.booking.travelFee = el.dataset.type==='artist'?0:50000; saveState(); render(); }
    else if (action === 'payment-method') { state.booking.payment = el.dataset.method; saveState(); render(); }
    else if (action === 'complete-booking') {
      const b=state.booking;
      // Tự động set consent nếu user đã đồng ý chính sách đặt cọc
      if (b.depositConsent && !b.consent) { b.consent = true; saveState(); }
      if(!b.consent){toast('Vui lòng đồng ý chính sách đặt lịch.');return route('/booking/info');}
      if(!b.name||!b.name.trim()||!b.phone||!b.phone.trim()) { toast('Vui lòng nhập họ tên và số điện thoại.'); return route('/booking/info'); }
      if(b.locationType==='client'&&(!b.address||!b.address.trim())) { toast('Vui lòng nhập địa chỉ phục vụ.'); return route('/booking/location'); }
      el.disabled=true;
      const origText = el.textContent;
      el.textContent='Đang gửi yêu cầu...';
      try {
        if (b.code && getAppointment(b.code)?.phone) {
          if (b.serverBookingFingerprint && b.serverBookingFingerprint !== bookingFingerprint(b)) { toast('Lịch đã được gửi trước đó. Vui lòng gửi yêu cầu thay đổi tại trang lịch hẹn.'); route('/booking/' + b.code); return; }
          bookingCode = b.code; saveState(); route('/booking/success'); return;
        }
        requireBookingLocation(b);
        const result=await api({action:'createAppointment',...b,customer:b.name,paymentStatus:b.depositReported?'pending_verification':'not_paid'});
        bookingCode=result.appointment.code;
        try { if (!isPreview) localStorage.setItem('hoanLastBookingCode',bookingCode); } catch {}
        state.appointments.unshift(result.appointment);
        // Xóa draft cũ
        state.booking.depositReported=false;
        state.booking.depositStatus=null;
        await hydrateBackend(true);
        route('/booking/success'); render();
      } catch(error) { toast(error.message); el.disabled=false; el.textContent=origText; }
    }
    else if (action === 'save-look') { el.textContent = '♥ Đã lưu phong cách'; toast('Đã lưu phong cách vào lịch đặt'); }
    else if (action === 'gallery-filter') route('/gallery?filter='+el.dataset.filter);
    else if (action === 'accordion') { const open = el.getAttribute('aria-expanded')==='true'; el.setAttribute('aria-expanded', String(!open)); el.lastElementChild.textContent = open?'+':'−'; el.nextElementSibling.classList.toggle('open',!open); }
    else if (action === 'support-select') {
      const mobile = window.matchMedia('(max-width: 700px)').matches;
      selectSupportAnswer(el.dataset.id, { scroll: mobile, focus: mobile || event.detail === 0 });
      return;
    }
    else if (action === 'policy-scroll') {
      const contents = el.closest('.policy-mobile-contents');
      if (contents) {
        contents.open = false;
        if (event.detail === 0) contents.querySelector('summary').focus({ preventScroll: true });
      }
      document.getElementById('policy-'+el.dataset.id)?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      return;
    }
    else if (action === 'policy-tab') route('/policies?tab='+el.dataset.tab);
    else if (action === 'filter-policy') {
      const cat = el.dataset.cat || 'all';
      document.querySelectorAll('.ct-policy-filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.cat === cat));
      document.querySelectorAll('.ct-policy-card').forEach(card => {
        const match = cat === 'all' || card.dataset.category === cat;
        card.style.display = match ? '' : 'none';
      });
    }
    else if (action === 'copy-policy-link') {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(location.href).then(() => toast('Đã sao chép liên kết chính sách')).catch(() => toast('Liên kết: ' + location.href));
      } else {
        toast('Liên kết: ' + location.href);
      }
    }
    else if (action === 'download-policy') downloadText('chinh-sach-hoan-makeup.txt','CHÍNH SÁCH ĐẶT LỊCH HOÀN MAKEUP\\n\\nCọc tiêu chuẩn: 200.000đ. Đổi lịch miễn phí trước 24 giờ. Yêu cầu hủy trước 48 giờ được xem xét hoàn cọc.');
    else if (action === 'support-lookup') route('/booking/'+($('#support-code')?.value || bookingCode));
    else if (action === 'add-calendar') { const s=service(); const start=state.booking.date.replaceAll('-','')+'T'+state.booking.time.replace(':','')+'00'; location.href=`data:text/calendar;charset=utf-8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ADTSTART:${start}%0ASUMMARY:${encodeURIComponent(s.name+' - HOÀN')}%0AEND:VEVENT%0AEND:VCALENDAR`; }
    else if (action === 'download-confirmation') downloadText('xac-nhan-'+bookingCode+'.txt','XÁC NHẬN LỊCH HẸN\\nMã: '+bookingCode+'\\nDịch vụ: '+service().name+'\\nNgày: '+dateLabel()+' '+state.booking.time);
    else if (action === 'download-receipt') route('/booking/'+bookingCode+'/receipt');
    else if (action === 'print') window.print();
    else if (action === 'confirm-reschedule') { try{const a=getAppointment(el.dataset.code);const result=await api({action:'updateAppointment',code:a.code,date:'2026-09-19',time:'10:00'});Object.assign(a,result.appointment);toast('Đổi lịch thành công');route('/booking/'+a.code);}catch(error){toast(error.message)} }
    else if (action === 'confirm-cancel') { if (!$('#cancel-confirm')?.checked) return toast('Vui lòng xác nhận điều kiện hủy lịch'); try{const a=getAppointment(el.dataset.code);const result=await api({action:'updateAppointment',code:a.code,status:'cancelled'});Object.assign(a,result.appointment);toast('Đã hủy lịch hẹn');route('/booking/'+a.code);}catch(error){toast(error.message)} }
    else if (action === 'new-appointment') { modal('Tạo lịch hẹn mới',`<div class="form-grid"><div class="field full"><label>Khách hàng</label><input id="modal-customer" placeholder="Họ và tên"></div><div class="field"><label>Dịch vụ</label><select id="modal-service">${state.services.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></div><div class="field"><label>Ngày</label><input id="modal-date" type="date" value="${localIso()}"></div><div class="field"><label>Giờ</label><input id="modal-time" type="time" value="09:30"></div><div class="field"><label>Số điện thoại</label><input id="modal-phone" placeholder="Số điện thoại"></div></div>`,'Tạo lịch','create-appointment'); }
    else if (action === 'admin-status') {
      const a=getAppointment(el.dataset.code);
      if (!a) return toast('Không tìm thấy lịch hẹn');
      const transitions = { pending: ['confirmed','cancelled'], confirmed: ['pending','completed','cancelled'], completed: ['completed'], cancelled: ['cancelled'] };
      const statusNames = { pending:'Chờ xác nhận', confirmed:'Đã xác nhận', completed:'Đã hoàn thành', cancelled:'Đã hủy' };
      const options = [a.status, ...(transitions[a.status] || [])].filter((status, index, list) => list.indexOf(status) === index).map(status => `<option value="${status}" ${status === a.status ? 'selected' : ''}>${statusNames[status]}</option>`).join('');
      const paymentLabel = a.paymentStatus === 'received' ? 'Đã nhận' : a.paymentStatus === 'pending_verification' ? 'Chờ đối soát' : 'Chưa thanh toán';
      modal('Cập nhật trạng thái',`<div class="field"><label>Trạng thái lịch</label><select id="modal-status">${options}</select><small style="display:block;margin-top:8px;color:#6b7280;">Chỉ thay đổi trạng thái phục vụ. Tiền cọc hiện tại: <b>${paymentLabel}</b>.</small></div><div class="form-grid"><div class="field"><label>Ngày hẹn</label><input id="modal-appointment-date" type="date" value="${a.date}"></div><div class="field"><label>Giờ bắt đầu</label><input id="modal-appointment-time" type="time" value="${a.time}"></div></div>`,'Cập nhật','update-status:'+a.code);
    }
    else if (action === 'admin-edit-appointment') {
      modalEditAppointment(el.dataset.code);
    }
    else if (action === 'admin-delete-appointment') {
      modalDeleteAppointment(el.dataset.code);
    }
    else if (action === 'admin-view-appointment') {
      const code = el.dataset.code;
      const a = getAppointment(code);
      if (!a) { route('/booking/' + code); }
      else {
        const s = service(a.serviceId) || { name: 'Dịch vụ', duration: 60, price: a.total };
        const dur = s.duration || 60;
        const endTime = a.endTime || addMinutes(a.time, dur);
        modal('Chi tiết lịch hẹn ' + a.code, `
          <div style="display:flex;flex-direction:column;gap:12px;font-size:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:1px solid #e5e7eb;">
              <div>
                <div style="font-size:17px;font-weight:700;color:#111827;">${esc(a.customer)}</div>
                <div style="font-size:13px;color:#6b7280;margin-top:2px;">Mã lịch: <span class="numeric">${a.code}</span></div>
              </div>
              <span class="badge ${a.status==='confirmed'?'success':a.status==='pending'?'warning':''}" style="font-size:12px;padding:4px 10px;">${statusLabel(a.status)}</span>
            </div>
            <div class="summary-row" style="display:flex;justify-content:space-between;padding:4px 0;"><span>Số điện thoại</span><b class="numeric">${a.phone || '—'}</b></div>
            <div class="summary-row" style="display:flex;justify-content:space-between;padding:4px 0;"><span>Dịch vụ</span><b>${s.name} (${dur} phút)</b></div>
            <div class="summary-row" style="display:flex;justify-content:space-between;padding:4px 0;"><span>Thời gian</span><b class="numeric">${a.time} – ${endTime}, ${a.date}</b></div>
            ${adminLocations?.html(a, state.bookingDetails?.[a.code]) || `<div class="summary-row"><span>Địa điểm</span><b>${esc(a.address || a.district || 'Chưa cung cấp địa chỉ')}</b></div>`}
            <div class="summary-row" style="display:flex;justify-content:space-between;padding:4px 0;"><span>Tổng chi phí</span><b class="numeric">${money(a.total)}</b></div>
            <div class="summary-row" style="display:flex;justify-content:space-between;padding:4px 0;"><span>Thực nhận sau hoàn</span><b class="numeric">${money(a.finance?.netReceived ?? a.deposit)}</b></div>
            ${a.note ? `<div style="background:#f9fafb;padding:8px 12px;border-radius:6px;font-size:13px;color:#4b5563;"><b>Ghi chú:</b> ${esc(a.note)}</div>` : ''}
            <div style="display:flex;gap:10px;margin-top:12px;padding-top:10px;border-top:1px solid #f3f4f6;flex-wrap:wrap;">
              <button class="btn btn-sm btn-dark" data-action="admin-status" data-code="${a.code}">Đổi trạng thái</button>
              <button class="btn btn-sm btn-edit" data-action="admin-edit-appointment" data-code="${a.code}">Chỉnh sửa</button>
              <button class="btn btn-sm btn-danger" data-action="admin-delete-appointment" data-code="${a.code}">Xóa lịch</button>
              <a class="btn btn-sm" href="#/booking/${a.code}" target="_blank" style="text-decoration:none;display:inline-flex;align-items:center;">Xem trang khách →</a>
            </div>
          </div>
        `, 'Đóng');
      }
    }
    else if (action === 'toggle-service') { const s=service(el.dataset.id); try{const result=await api({action:'saveService',...s,enabled:!s.enabled});Object.assign(s,result.service);toast('Đã cập nhật trạng thái dịch vụ');render();}catch(error){toast(error.message)} }
    else if (action === 'edit-service') {
      const s = service(el.dataset.id);
      modal('Chỉnh sửa dịch vụ', renderAdminRecordForm({
        title: s.name,
        desc: s.description,
        price: s.price,
        duration: s.duration,
        image: imageFor(s),
        isService: true
      }), 'Lưu thay đổi', 'edit-service:' + s.id);
    }
    else if (action === 'add-service') {
      modal('Thêm dịch vụ', renderAdminRecordForm({
        title: '',
        desc: '',
        price: '',
        duration: 60,
        image: 'natural.png',
        isService: true
      }), 'Thêm dịch vụ', 'add-service');
    }
    else if (action === 'delete-service') { if(state.services.length<=1)return toast('Cần giữ ít nhất một dịch vụ');try{await api({action:'deleteService',id:el.dataset.id});state.services=state.services.filter(s=>s.id!==el.dataset.id);toast('Đã xóa dịch vụ');render();}catch(error){toast(error.message)} }
    else if (action === 'edit-customer') { const c=state.customers[Number(el.dataset.index)]; modal('Chỉnh sửa khách hàng',`<div class="field"><label>Họ tên</label><input id="modal-customer-name" value="${c.name}"></div><div class="field"><label>Ghi chú</label><textarea id="modal-customer-note">${c.note}</textarea></div>`,'Lưu','edit-customer:'+el.dataset.index); }
    else if (action === 'add-customer') modal('Thêm khách hàng',`<div class="field"><label>Họ tên</label><input id="modal-customer-name"></div><div class="field"><label>Số điện thoại</label><input id="modal-customer-phone"></div><div class="field"><label>Email</label><input id="modal-customer-email" type="email"></div>`,'Thêm','add-customer');
    else if (action === 'toggle-promo') { state.promotions[Number(el.dataset.index)].active=!state.promotions[Number(el.dataset.index)].active; saveState('Đã cập nhật mã ưu đãi'); render(); }
    else if (action === 'add-promo') modal('Tạo mã ưu đãi',`<div class="field"><label>Mã ưu đãi</label><input id="modal-promo-code" value="NEWCLIENT"></div><div class="field"><label>Giá trị</label><input id="modal-promo-value" value="100.000đ"></div>`,'Tạo mã','add-promo');
    else if (action === 'delete-promo') { state.promotions.splice(Number(el.dataset.index),1); saveState('Đã xóa mã ưu đãi'); render(); }
    else if (action === 'edit-promo') toast('Đã mở chỉnh sửa mã '+state.promotions[Number(el.dataset.index)].code);
    else if (action === 'filter-admin-gallery') {
      state.adminGalleryFilter = el.dataset.val;
      render();
    }
    else if (action === 'open-add-portfolio-modal') {
      modal('Thêm ảnh vào bộ sưu tập', renderAdminRecordForm({
        title: '',
        desc: '',
        image: 'bridal-new.png',
        tag: 'Cô dâu',
        isService: false
      }), 'Thêm vào website', 'add-portfolio-confirm');
    }
    else if (action === 'delete-portfolio-item') {
      const id = el.dataset.id;
      if (confirm('Bạn có chắc chắn muốn xóa ảnh này khỏi website?')) {
        state.portfolio = (state.portfolio || []).filter(p => p.id !== id);
        saveState('Đã xóa ảnh khỏi website');
        render();
      }
    }
    else if (action === 'edit-portfolio-item') {
      const id = el.dataset.id;
      const p = (state.portfolio || []).find(x => x.id === id);
      if (p) {
        modal('Chỉnh sửa ảnh bộ sưu tập', renderAdminRecordForm({
          title: p.title,
          desc: p.note,
          image: p.image,
          tag: p.tag,
          serviceId: p.serviceId,
          isService: false
        }), 'Lưu thay đổi', 'edit-portfolio-confirm:' + id);
      }
    }
    else if (action === 'view-photo') {
      const src = el.dataset.src;
      const title = el.dataset.title;
      const tag = el.dataset.tag;
      const note = el.dataset.note;
      modal(title || 'Chi tiết hình ảnh', `
        <div style="text-align:center;">
          <img src="${esc(src)}" alt="${esc(title)}" style="max-height:65vh;max-width:100%;object-fit:contain;border-radius:4px;box-shadow:0 10px 30px rgba(0,0,0,0.15);">
          <div style="margin-top:16px;text-align:left;background:#f9f9f9;padding:14px 18px;border-radius:6px;">
            <p style="font-size:12px;font-weight:700;letter-spacing:1px;color:#7A1832;text-transform:uppercase;margin:0 0 4px;">${esc(tag)}</p>
            <h4 style="margin:0 0 6px;font-size:17px;font-family:Tinos,Georgia,serif;">${esc(title)}</h4>
            <p style="margin:0;font-size:13px;color:#555;">${esc(note || 'Lựa chọn phong cách cá nhân hóa cùng HOÀN Makeup Artist.')}</p>
          </div>
        </div>
      `, 'Đặt lịch phong cách này', 'book-this-style:' + (tag || ''));
    }
    else if (action === 'hide-gallery') { el.closest('.admin-card').style.opacity='.35'; toast('Đã ẩn ảnh khỏi website'); }
    else if (action === 'publish-content') {
      try {
        const form = document.querySelector('form[data-form="content"]');
        if (form) {
          const dataObj = Object.fromEntries(new FormData(form));
          if (dataObj.deposit !== undefined) {
            state.settings.deposit = Number(dataObj.deposit);
            delete dataObj.deposit;
          }
          if (dataObj.travelFee !== undefined) {
            state.settings.travelFee = Number(dataObj.travelFee);
            delete dataObj.travelFee;
          }
          Object.assign(state.brand, dataObj);
        }
        await api({action:'saveContent',key:'brand',value:state.brand});
        await api({action:'saveContent',key:'settings',value:state.settings});
        await hydrateBackend(true);
        toast('Đã đăng thay đổi lên website công khai');
        render();
      } catch(error) { toast(error.message); }
    }
    else if (action === 'set-preview-mode') {
      state.contentPreviewMode = el.dataset.mode;
      render();
    }
    else if (action === 'toggle-service-status') {
      const svc = state.services.find(s => s.id === el.dataset.id);
      if (svc) {
        svc.enabled = !svc.enabled;
        try {
          await api({ action: 'saveService', ...svc });
          toast(svc.enabled ? `Đã bật hiển thị ${svc.name}` : `Đã ẩn ${svc.name}`);
          render();
        } catch(e) { toast(e.message); }
      }
    }
    else if (action === 'set-preset-color') {
      const color = el.dataset.color;
      state.brand.accent = color;
      document.documentElement.style.setProperty('--wine', color);
      const inputColor = document.getElementById('input-accent-color');
      const pickerColor = document.getElementById('picker-accent-color');
      if (inputColor) inputColor.value = color;
      if (pickerColor) pickerColor.value = color;
      toast(`Đã chọn mã màu ${color}`);
      render();
    }
    else if (action === 'set-sample-image') {
      const target = el.dataset.target;
      const val = el.dataset.val;
      state.brand[target] = val;
      toast('Đã áp dụng ảnh mẫu');
      render();
    }
    else if (action === 'goto-notifications') {
      route('/admin/notifications');
    }
    else if (action === 'mark-all-notifications-read') {
      const unread = (state.notifications || []).filter(notification => notification.status === 'unread');
      if (!unread.length) return;
      try {
        await api({ action: 'markNotificationsRead' });
        state.notifications = state.notifications.map(notification => notification.status === 'unread' ? { ...notification, status: 'read', readAt: new Date().toISOString() } : notification);
        render();
        toast('Đã đánh dấu toàn bộ thông báo là đã đọc.');
      } catch (error) {
        toast(error.message || 'Không thể cập nhật thông báo.');
      }
    }
    else if (action === 'goto-profile') {
      route('/admin/permissions');
    }
    else if (action === 'resend-notification') toast('Đã gửi lại thông báo');
    else if (action === 'permission-toggle') { el.classList.toggle('on'); toast('Đã cập nhật quyền hiển thị'); }
    else if (action === 'setting-toggle' || action === 'toggle-schedule') { el.classList.toggle('on'); if(action==='setting-toggle') state.settings[el.dataset.key]=el.classList.contains('on'); else state.settings.scheduleOpen=el.classList.contains('on'); try{await api({action:'saveContent',key:'settings',value:state.settings});toast('Đã cập nhật thiết lập');render();}catch(error){toast(error.message)} }
    else if (action === 'reset-settings') { state.settings=structuredClone(defaultState.settings); saveState('Đã khôi phục cài đặt mặc định'); render(); }
    else if (action === 'week-prev') { state.adminWeekOffset--; saveState(); render(); }
    else if (action === 'week-next') { state.adminWeekOffset++; saveState(); render(); }
    else if (action === 'week-today') { state.adminWeekOffset = 0; saveState(); render(); }
    else if (action === 'toggle-weekday') {
      const idx = Number(el.dataset.index);
      if (!state.settings.weekDayOpen) state.settings.weekDayOpen = [true,true,true,true,true,true,false];
      state.settings.weekDayOpen[idx] = !state.settings.weekDayOpen[idx];
      try { await api({action:'saveContent',key:'settings',value:state.settings}); } catch(e){}
      saveState(); render();
      toast(state.settings.weekDayOpen[idx] ? 'Đã bật nhận lịch ngày này' : 'Đã tắt nhận lịch ngày này');
    }
    else if (action === 'copy-week') { toast('Đã sao chép thiết lập sang tuần sau'); }
    else if (action === 'schedule-cell-v2') {
      const { date, hour, status } = el.dataset;
      const newStatus = status === 'available' ? 'blocked' : 'available';
      try {
        await api({action:'setScheduleSlot', date, time: hour, status: newStatus});
        const existing = slotRecord(date, hour);
        if (existing) existing.status = newStatus;
        else state.scheduleSlots.push({slotDate: date, slotTime: hour, status: newStatus});
        toast(newStatus === 'available' ? 'Đã mở khung giờ' : 'Đã chặn khung giờ');
        render();
      } catch(error) { toast(error.message); }
    }
    else if (action === 'schedule-cell') { const status=el.dataset.status==='available'?'blocked':'available';try{await api({action:'setScheduleSlot',date:el.dataset.date,time:el.dataset.time,status});const existing=slotRecord(el.dataset.date,el.dataset.time);if(existing)existing.status=status;else state.scheduleSlots.push({slotDate:el.dataset.date,slotTime:el.dataset.time,status});toast(status==='available'?'Đã mở khung giờ':'Đã chặn khung giờ');render();}catch(error){toast(error.message)} }
    else if (action === 'save-schedule') toast('Lịch làm việc đã được lưu trực tiếp');
    else if (action === 'add-slot') modalAddSlot(localIso(), '09:00', '10:15');
    else if (action === 'add-slot-at') modalAddSlot(el.dataset.date, el.dataset.hour, addMinutes(el.dataset.hour, 75));
    else if (action === 'view-conflicts') {
      const activeAppts = (state.appointments || []).filter(activeAppointment);
      const conflicts = [];
      for (let i = 0; i < activeAppts.length; i++) {
        for (let j = i + 1; j < activeAppts.length; j++) {
          const a1 = activeAppts[i], a2 = activeAppts[j];
          if (a1.date === a2.date) {
            const timeToMin = (t) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); };
            const s1 = timeToMin(a1.time), e1 = a1.endTime ? timeToMin(a1.endTime) : (s1 + (service(a1.serviceId)?.duration || 75));
            const s2 = timeToMin(a2.time), e2 = a2.endTime ? timeToMin(a2.endTime) : (s2 + (service(a2.serviceId)?.duration || 75));
            if (s1 < e2 && s2 < e1) {
              conflicts.push({ a1, a2 });
            }
          }
        }
      }
      if (conflicts.length === 0) {
        modal('Trạng thái lịch làm việc', `
          <div style="font-size:14px;line-height:1.6;color:#374151;">
            <p style="margin-bottom:8px;color:#166534;font-weight:600;">✓ Toàn bộ lịch làm việc đang thông suốt!</p>
            <p style="margin-bottom:0;">Không có bất kỳ khung giờ hoặc lịch hẹn nào bị xung đột hay trùng lặp.</p>
          </div>
        `, 'Đã hiểu', 'close-modal');
      } else {
        const conflictList = conflicts.map((c, i) => `
          <p style="margin-bottom:8px;"><strong style="color:#b91c1c;">Xung đột ${i+1}:</strong> ${esc(c.a1.customer)} (${c.a1.time}) và ${esc(c.a2.customer)} (${c.a2.time}) ngày ${dateLabel(c.a1.date)}.</p>
        `).join('');
        modal('Chi tiết xung đột cần xử lý', `
          <div style="font-size:14px;line-height:1.6;color:#374151;">
            ${conflictList}
            <p style="margin-top:12px;margin-bottom:0;font-size:13px;color:#6b7280;">Bạn có thể bấm vào từng lịch hẹn trên bảng để chỉnh sửa hoặc sắp xếp lại thời gian.</p>
          </div>
        `, 'Đã hiểu', 'close-modal');
      }
    }
    else if (action === 'block-time') modal('Chặn khung giờ',`<div class="form-grid"><div class="field"><label>Ngày</label><input id="modal-block-date" type="date" value="${localIso()}"></div><div class="field"><label>Giờ bắt đầu</label><input id="modal-block-time" type="time" value="07:00"></div></div><div class="field"><label>Lý do</label><input id="modal-block-reason" value="Việc cá nhân"></div>`,'Chặn giờ','block-time');
    else if (action === 'manual-payment') { financeAdmin ? financeAdmin.open(el.dataset.code || '', 'deposit') : toast('Đang tải sổ thu chi. Vui lòng thử lại.'); }
    else if (action === 'payment-receipt') route('/booking/'+el.dataset.code+'/receipt');
    else if (action?.startsWith('export')) exportAdminRecords(action);
    else if (action === 'refresh-report') toast('Đã cập nhật số liệu báo cáo');
    else if (action === 'edit-role' || action === 'role-members' || action === 'add-role') toast('Đã mở thiết lập phân quyền');
    else if (action === 'close-modal') closeModal();
    else if (action === 'modal-backdrop' && event.target===el) closeModal();
    else if (action === 'modal-confirm') await handleModalConfirm(el.dataset.confirm);
  });

  async function handleModalConfirm(action) {
    const recordForm = document.querySelector('.admin-record-form');
    if (recordForm) {
      if (recordForm.dataset.uploading) return toast('Đang tải ảnh. Vui lòng đợi ảnh tải xong.');
      for (const field of recordForm.querySelectorAll('input:not([type="hidden"]):not([type="file"]), textarea, select')) {
        if (field.required && field.type === 'text') field.value = field.value.trim();
        if (!field.reportValidity()) return;
      }
    }
    if (action.startsWith('update-req-status:')) {
      const id = action.split(':')[1];
      const newStatus = $('#modal-req-status')?.value || 'pending';
      const reply = $('#modal-req-status-reply')?.value?.trim();
      try {
        await api({ action: 'resolveRequest', id, status: newStatus, ...(reply ? { reply } : {}) });
        const r = (state.requests || []).find(x => x.id === id);
        if (r) {
          r.status = newStatus;
          if (reply) r.reply = reply;
        }
        saveState();
        toast('Đã cập nhật trạng thái yêu cầu');
      } catch (err) {
        toast(err.message || 'Lỗi khi cập nhật trạng thái');
        return;
      }
    } else if (action.startsWith('edit-req-save:')) {
      const id = action.split(':')[1];
      const name = $('#modal-edit-req-name')?.value?.trim();
      const phone = $('#modal-edit-req-phone')?.value?.trim();
      const email = $('#modal-edit-req-email')?.value?.trim();
      const subject = $('#modal-edit-req-subject')?.value?.trim();
      const status = $('#modal-edit-req-status')?.value;
      const message = $('#modal-edit-req-message')?.value?.trim();
      const reply = $('#modal-edit-req-reply')?.value?.trim();

      if (!name || !phone) { toast('Vui lòng nhập họ tên và số điện thoại'); return; }

      try {
        await api({ action: 'resolveRequest', id, name, phone, email, subject, status, message, reply });
        const r = (state.requests || []).find(x => x.id === id);
        if (r) {
          Object.assign(r, { name, phone, email, subject, status, message, reply });
        }
        saveState();
        toast('Đã cập nhật thông tin yêu cầu');
      } catch (err) {
        toast(err.message || 'Lỗi khi cập nhật yêu cầu');
        return;
      }
    } else if (action.startsWith('delete-request:')) {
      const id = action.split(':')[1];
      try {
        await api({ action: 'deleteRequest', id });
        state.requests = (state.requests || []).filter(x => x.id !== id);
        saveState();
        toast('Đã xóa yêu cầu thành công');
      } catch (err) {
        toast(err.message || 'Lỗi khi xóa yêu cầu');
        return;
      }
    } else if (action.startsWith('edit-appointment:')) {
      const code = action.split(':')[1];
      const customer = $('#modal-edit-customer')?.value?.trim();
      const phone = $('#modal-edit-phone')?.value?.trim();
      const serviceId = $('#modal-edit-service')?.value;
      const date = $('#modal-edit-date')?.value;
      const time = $('#modal-edit-time')?.value;
      const status = $('#modal-edit-status')?.value;
      const total = Number($('#modal-edit-total')?.value || 0);
      const address = $('#modal-edit-address')?.value?.trim();
      const note = $('#modal-edit-note')?.value?.trim();

      if (!customer || !phone) { toast('Vui lòng nhập họ tên và số điện thoại'); return; }
      if (!date || !time) { toast('Vui lòng chọn ngày và giờ hẹn'); return; }

      try {
        const result = await api({
          action: 'updateAppointment',
          code,
          customer,
          phone,
          serviceId,
          date,
          time,
          status,
          total,
          address,
          note
        });
        const a = getAppointment(code);
        if (a) Object.assign(a, result.appointment);
        saveState();
        toast('✓ Đã cập nhật thông tin lịch hẹn');
      } catch (err) {
        toast(err.message || 'Lỗi khi cập nhật lịch hẹn');
        return;
      }
    } else if (action.startsWith('delete-appointment:')) {
      const code = action.split(':')[1];
      try {
        const deletedApt = state.appointments.find(x => x.code === code);
        await api({ action: 'deleteAppointment', code });
        state.appointments = state.appointments.filter(x => x.code !== code);
        // Xóa khách hàng khỏi danh sách nếu không còn lịch hẹn nào
        if (deletedApt) {
          const stillHasApt = state.appointments.some(x => x.phone === deletedApt.phone || x.customer === deletedApt.customer);
          if (!stillHasApt) {
            state.customers = (state.customers || []).filter(c => c.phone !== deletedApt.phone && c.name !== deletedApt.customer);
          }
        }
        saveState();
        toast('✓ Đã xóa lịch hẹn thành công');
      } catch (err) {
        toast(err.message || 'Lỗi khi xóa lịch hẹn');
        return;
      }
    } else if (action === 'create-appointment') {
      try {
        const result=await api({action:'createAppointment',customer:$('#modal-customer').value,phone:$('#modal-phone').value,serviceId:$('#modal-service').value,date:$('#modal-date').value,time:$('#modal-time').value,travelFee:0});
        state.appointments.unshift(result.appointment); await hydrateBackend(true); toast('Đã tạo lịch hẹn mới');
      } catch(error) { toast(error.message); return; }
    } else if (action === 'create-slot') {
      const date = $('#modal-slot-date')?.value || localIso();
      const type = $('#modal-slot-type')?.value || 'available';
      const start = $('#modal-slot-start')?.value || '09:00';
      const end = $('#modal-slot-end')?.value || '10:15';
      const title = $('#modal-slot-title')?.value?.trim() || '';
      const serviceId = $('#modal-slot-service')?.value || 'party';
      const phone = $('#modal-slot-phone')?.value?.trim() || '';
      const note = $('#modal-slot-note')?.value?.trim() || '';

      if (type === 'appointment') {
        const cust = title || 'Khách hẹn';
        const sObj = service(serviceId) || state.services[0];
        const newApt = {
          code: 'HOAN-' + Date.now().toString(36).toUpperCase().slice(-6),
          customer: cust,
          phone: phone || '0901234567',
          serviceId: sObj.id,
          date: date,
          time: start,
          endTime: end,
          address: note || 'Tại studio HOÀN',
          status: 'confirmed',
          paymentStatus: 'received',
          deposit: Number(state.settings.deposit || 200000),
          total: sObj.price || 650000
        };
        try {
          const res = await api({ action: 'createAppointment', ...newApt });
          if (res && res.appointment) Object.assign(newApt, res.appointment);
        } catch(e){}
        state.appointments.unshift(newApt);
        saveState();
        toast(`✓ Đã thêm lịch hẹn cho ${cust} (${start} – ${end})`);
      } else {
        const slotStatus = type;
        const slotNote = title || note || (type === 'travel' ? 'Di chuyển' : type === 'break' ? 'Nghỉ giữa lịch' : 'Không khả dụng');
        const newSlot = {
          slotDate: date,
          slotTime: start,
          endTime: end,
          status: slotStatus,
          note: slotNote
        };
        try {
          await api({ action: 'setScheduleSlot', date, time: start, endTime: end, status: slotStatus, note: slotNote });
        } catch(e){}
        const existing = slotRecord(date, start);
        if (existing) {
          existing.status = slotStatus;
          existing.endTime = end;
          existing.note = slotNote;
        } else {
          state.scheduleSlots.push(newSlot);
        }
        saveState();
        toast(`✓ Đã thêm khung giờ ${slotNote} (${start} – ${end})`);
      }
      closeModal();
      render();
      return;
    } else if (action.startsWith('update-status:')) {
      try {
        const code=action.split(':')[1];
        const newStatus=$('#modal-status').value;
        const result=await api({action:'updateAppointment',code,status:newStatus,date:$('#modal-appointment-date')?.value,time:$('#modal-appointment-time')?.value});
        const appt = getAppointment(code);
        if (appt) Object.assign(appt, result.appointment);
        if (newStatus === 'confirmed') {
          if (state.booking.code === code || bookingCode === code) {
            state.booking.statusMode = 'confirmed';
          }
        }
        saveState();
        toast('Đã cập nhật trạng thái lịch: ' + (newStatus === 'confirmed' ? 'Đã xác nhận' : newStatus));
      }
      catch(error){toast(error.message);return;}
    } else if (action.startsWith('edit-service:')) {
      try { const s=service(action.split(':')[1]);const result=await api({action:'saveService',...s,name:$('#modal-service-name').value,duration:Number($('#modal-service-duration').value),price:Number($('#modal-service-price').value),description:$('#modal-service-desc').value});Object.assign(s,result.service);toast('Đã lưu dịch vụ'); }
      catch(error){toast(error.message);return;}
    } else if (action === 'add-service') {
      const name=$('#modal-service-name').value.trim(); if(!name)return toast('Vui lòng nhập tên dịch vụ');
      try { const result=await api({action:'saveService',id:'service-'+Date.now(),name,duration:Number($('#modal-service-duration').value),price:Number($('#modal-service-price').value),description:$('#modal-service-desc').value,enabled:true,sortOrder:state.services.length+1});state.services.push(result.service);toast('Đã thêm dịch vụ'); }
      catch(error){toast(error.message);return;}
    } else if (action.startsWith('edit-customer:')) {
      const c=state.customers[Number(action.split(':')[1])]; c.name=$('#modal-customer-name').value; c.note=$('#modal-customer-note').value; saveState('Đã lưu khách hàng');
    } else if (action === 'add-customer') {
      state.customers.push({name:$('#modal-customer-name').value,phone:$('#modal-customer-phone').value,email:$('#modal-customer-email').value,visits:0,spent:0,note:''}); saveState('Đã thêm khách hàng');
    } else if (action === 'add-promo') {
      state.promotions.push({code:$('#modal-promo-code').value.toUpperCase(),type:'Giảm cố định',value:$('#modal-promo-value').value,used:0,limit:30,active:true}); saveState('Đã tạo mã ưu đãi');
    } else if (action === 'send-notification') {
      state.notifications.unshift({title:$('#modal-notification-title').value,channel:$('#modal-notification-channel').value,audience:'Khách đã chọn',sent:'Vừa xong',status:'Đã gửi'}); saveState('Đã gửi thông báo');
    } else if (action === 'block-time') {
      try { const date=$('#modal-block-date').value,time=$('#modal-block-time').value;await api({action:'setScheduleSlot',date,time,status:'blocked',note:$('#modal-block-reason').value});const existing=slotRecord(date,time);if(existing)existing.status='blocked';else state.scheduleSlots.push({slotDate:date,slotTime:time,status:'blocked'});toast('Đã chặn khung giờ'); }
      catch(error){toast(error.message);return;}
    }
    else if (action === 'add-portfolio-confirm') {
      const title = $('#modal-port-title')?.value.trim();
      if (!title) { toast('Vui lòng nhập tiêu đề ảnh'); return; }
      const tag = $('#modal-port-tag')?.value || 'Cô dâu';
      const serviceId = $('#modal-port-service')?.value || 'bridal';
      const image = $('#modal-port-img')?.value.trim() || 'bridal-new.png';
      const note = $('#modal-port-note')?.value.trim() || '';
      const newItem = {
        id: 'port-' + Date.now(),
        serviceId,
        title,
        tag,
        image,
        note
      };
      if (!state.portfolio) state.portfolio = [];
      state.portfolio.unshift(newItem);
      saveState('Đã thêm ảnh vào Website và Dịch vụ thành công!');
    }
    else if (action.startsWith('edit-portfolio-confirm:')) {
      const id = action.split(':')[1];
      const p = (state.portfolio || []).find(x => x.id === id);
      if (p) {
        p.title = $('#modal-port-title')?.value.trim() || p.title;
        p.tag = $('#modal-port-tag')?.value || p.tag;
        p.serviceId = $('#modal-port-service')?.value || p.serviceId;
        p.image = $('#modal-port-img')?.value.trim() || p.image;
        p.note = $('#modal-port-note')?.value.trim() || p.note;
        saveState('Đã cập nhật ảnh thành công!');
      }
    }
    else if (action.startsWith('book-this-style:')) {
      const tag = action.split(':')[1];
      const matched = state.services.find(s => s.name.includes(tag) || (tag === 'Cô dâu' && s.id === 'bridal') || (tag === 'Dự tiệc' && s.id === 'party'));
      if (matched) state.booking.serviceId = matched.id;
      saveState();
      route(service().contact ? '/contact' : '/booking/time');
    }

    closeModal(); render();
  }

  let navCloseTimer;
  const finePointer = () => window.innerWidth > 1100;
  function closeEditorial(focusBack=false) {
    clearTimeout(navCloseTimer);
    const trigger=document.querySelector('[data-nav][aria-expanded="true"]');
    document.querySelectorAll('.editorial-menu').forEach(p=>{p.hidden=true;});
    document.querySelectorAll('[data-nav],[data-nav-toggle]').forEach(t=>t.setAttribute('aria-expanded','false'));
    const veil=document.querySelector('.nav-veil');if(veil)veil.hidden=true;
    if(focusBack)trigger?.focus();
  }
  function openEditorial(key) {
    clearTimeout(navCloseTimer);
    document.querySelectorAll('.editorial-menu').forEach(p=>{p.hidden=p.id!=='nav-panel-'+key;});
    document.querySelectorAll('[data-nav],[data-nav-toggle]').forEach(t=>t.setAttribute('aria-expanded',String((t.dataset.nav||t.dataset.navToggle)===key)));
    const veil=document.querySelector('.nav-veil');if(veil)veil.hidden=true;
  }
  function previewEditorial(link) {
    const panel=link.closest('.editorial-menu');
    panel.querySelectorAll('[data-preview]').forEach(a=>a.classList.toggle('is-preview',a===link));
    panel.querySelectorAll('[data-image]').forEach(a=>{const on=a.dataset.image===link.dataset.preview;a.classList.toggle('is-visible',on);a.inert=!on;});
  }
  document.addEventListener('pointerover',e=>{
    const header=e.target.closest('.site-header');if(header)clearTimeout(navCloseTimer);
    const trigger=e.target.closest('[data-nav]');if(trigger&&finePointer())openEditorial(trigger.dataset.nav);
    const preview=e.target.closest('[data-preview]');if(preview&&finePointer())previewEditorial(preview);
    if(e.target.closest('.nav-label:not([data-nav])')&&finePointer())closeEditorial();
  });
  document.addEventListener('pointerout',e=>{
    if(finePointer()&&e.target.closest('.site-header')&&!e.relatedTarget?.closest?.('.site-header'))navCloseTimer=setTimeout(()=>closeEditorial(),180);
  });
  document.addEventListener('focusin',e=>{
    const preview=e.target.closest('[data-preview]');if(preview)previewEditorial(preview);
    if(!e.target.closest('.site-header'))closeEditorial();
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){closeEditorial(true);return;}
    const trigger=e.target.closest('[data-nav]');
    if(trigger&&e.key==='ArrowDown'){e.preventDefault();openEditorial(trigger.dataset.nav);document.querySelector('#nav-panel-'+trigger.dataset.nav+' a')?.focus();}
  });
  document.addEventListener('click',e=>{
    const toggle=e.target.closest('[data-nav-toggle]');
    if(toggle){const opened=toggle.getAttribute('aria-expanded')==='true';opened?closeEditorial():openEditorial(toggle.dataset.navToggle);}
    if(e.target.closest('.editorial-close'))closeEditorial(true);
    if(e.target.closest('.nav-veil')||e.target.closest('[data-action="mobile-menu"]'))closeEditorial();
    if(e.target.closest('.editorial-menu a'))closeEditorial();
  });
  window.addEventListener('resize',()=>closeEditorial());
  window.addEventListener('hashchange',()=>closeEditorial());
  window.addEventListener('hashchange', render);
  window.addEventListener('storage', async (event) => {
    if (isPreview) return;
    if (event.url && event.url.includes('cmsPreview=1')) return;
    if (event.key && !['hoanDepositSyncTrigger', 'hoanMakeupDraft', 'hoanLastBookingCode'].includes(event.key)) return;
    const currentRoute = (location.hash.slice(1) || '/').split('?')[0];
    if (currentRoute === '/admin/content' || currentRoute === '/admin/content-pages') return;
    const currentBooking = state.booking;
    state = loadState();
    if (currentRoute.startsWith('/booking/')) state.booking = currentBooking;
    if (typeof window !== 'undefined') window.state = state;
    await hydrateBackend(true);
    render();
  });
  if (!location.hash) location.hash = '#/';
  if (typeof document.createElement === 'function' && location.origin) {
    import('/policy-navigation.js?v=1.0').then(({ mountPolicyNavigation }) => {
      policyNavigation = mountPolicyNavigation;
      mountPolicyContents();
    }).catch(error => console.error('Không tải được mục lục chính sách:', error));
    import('/admin-location.js?v=3.5').then(({ createAdminLocations }) => {
      adminLocations = createAdminLocations({ getState: () => state, modal, toast });
      window.HoanAdminLocations = adminLocations;
      if (location.hash.startsWith('#/admin')) render();
    }).catch(error => console.error('Không tải được bản đồ quản trị:', error));
    import('/finance-admin.js?v=2.0').then(({ createFinanceAdmin }) => {
      financeAdmin = createFinanceAdmin({ getState: () => state, api, refresh: () => hydrateBackend(), toast, esc, money });
      window.HoanFinanceAdmin = financeAdmin;
      if (location.hash.startsWith('#/admin')) render();
    }).catch(error => console.error('Không tải được quản lý thu chi:', error));
    import('/booking-location.js?v=9.3').then(({ createBookingLocation }) => {
      bookingLocation = createBookingLocation({ getBooking: () => state.booking, getService: service, getSettings: () => state.settings, save: saveState, render, esc, money });
      if (location.hash.split('?')[0] === '#/booking/location') render();
      return bookingLocation.load();
    }).catch(() => {
      if (location.hash.split('?')[0] === '#/booking/location') {
        const status = document.querySelector('.ct-subtitle');
        if (status) status.textContent = 'Chưa tải được biểu mẫu địa chỉ. Vui lòng tải lại trang.';
      }
    });
    import('/site-tools.js?v=146.0').then(({ createSiteTools }) => {
      siteTools = createSiteTools({ getState: () => state, render, renderPathHtml, hydrateBackend, adminShell, publicHeader, publicFooter, esc, toast, icon });
      siteTools.start();
    }).catch(error => console.error('Không tải được công cụ website:', error));
    import('/scroll-enhancements.js?v=1.4').then(() => {
      if (typeof window.initHoanScroll === 'function') window.initHoanScroll();
    }).catch(() => {});
  }
  render();
  hydrateBackend();
  if (typeof window.initHoanScroll === 'function') window.initHoanScroll();
})();
