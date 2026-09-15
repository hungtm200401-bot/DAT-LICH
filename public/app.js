(() => {
  'use strict';

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

  const defaultBookingTime = (dateIso = localIso()) => {
    const today = localIso();
    const defaultTimes = ['07:00','08:00','09:30','10:00','13:00','14:00','15:30','16:00','18:00'];
    if (dateIso > today) return '09:30';
    const now = new Date();
    const curMinutes = now.getHours() * 60 + now.getMinutes();
    const nextSlot = defaultTimes.find(t => {
      const [h, m] = t.split(':').map(Number);
      return (h * 60 + m) > curMinutes + 15;
    });
    return nextSlot || '18:00';
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
      city: 'Hà Nội',
      district: '',
      ward: '',
      detectedAddress: '',
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
    backendReady: false,
    backendError: ''
  };

  const loadState = () => {
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
        adminWeekOffset: saved.adminWeekOffset === undefined ? 0 : Number(saved.adminWeekOffset)
      };
      if (!loaded.booking.date || loaded.booking.date < today) {
        loaded.booking.date = today;
        loaded.booking.time = defaultBookingTime(today);
      }
      if (!loaded.booking.time) {
        loaded.booking.time = defaultBookingTime(loaded.booking.date);
      }
      return loaded;
    } catch {
      const s = structuredClone(defaultState);
      s.booking.date = today;
      s.booking.time = defaultBookingTime(today);
      return s;
    }
  };
  let state = loadState();
  let siteTools;
  if (typeof window !== 'undefined') window.state = state;
  const saveState = (message) => {
    try {
      localStorage.setItem('hoanMakeupDraft', JSON.stringify({ booking: state.booking, adminWeekOffset: state.adminWeekOffset }));
      localStorage.setItem('hoanDepositSyncTrigger', String(Date.now()));
    } catch { /* storage may be blocked in iframe / test sandbox */ }
    if (message) toast(message);
  };
  const currentToday = localIso();
  if (!state.booking.date || state.booking.date < currentToday) {
    state.booking.date = currentToday;
    state.booking.time = defaultBookingTime(currentToday);
    saveState();
  }
  if (!state.booking.time) {
    state.booking.time = defaultBookingTime(state.booking.date);
    saveState();
  }
  const service = (id = state.booking.serviceId) => state.services.find(s => s.id === id) || state.services[0];
  const currentTotal = () => service().price + Number(state.booking.travelFee || 0);
  const dateLabel = (iso = state.booking.date) => {
    const [y,m,d] = (iso || localIso()).split('-');
    return `${d}/${m}/${y}`;
  };
  let bookingCode = 'CHƯA TẠO';
  try { bookingCode = localStorage.getItem('hoanLastBookingCode') || 'CHƯA TẠO'; } catch {}

  async function api(payload) {
    if (payload && window.parent !== window && new URLSearchParams(location.search).get('cmsPreview') === '1') throw new Error('Bản xem trước không gửi dữ liệu nghiệp vụ.');
    const options = payload ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) } : {};
    const response = await fetch('/api/data', options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không thể kết nối dữ liệu');
    if (payload?.action === 'createAppointment') siteTools?.conversion('Đã gửi yêu cầu đặt lịch');
    if (payload?.action === 'createRequest') siteTools?.conversion('Đã gửi yêu cầu liên hệ');
    if (payload?.action === 'saveContent') siteTools?.contentSaved();
    return data;
  }

  async function hydrateBackend(silent = false) {
    try {
      const data = await api();
      state.services = data.services || [];
      state.bookingDetails = data.bookingDetails || {};
      state.requests = data.requests || [];
      state.appointments = data.appointments || [];
      state.customers = data.customers || [];
      state.scheduleSlots = data.scheduleSlots || [];
      state.brand = { ...state.brand, ...(data.brand || {}) };
      state.settings = { ...state.settings, ...(data.settings || {}) };
      ensureScheduleSeedData();
      state.backendReady = true;
      state.backendError = '';
      if (!silent) render();
    } catch (error) {
      state.backendError = error.message;
      ensureScheduleSeedData();
      if (!silent) render();
    }
  }

  const slotRecord = (date, time) => state.scheduleSlots.find(slot => slot.slotDate === date && slot.slotTime === time);
  const slotUnavailable = (date, time) => {
    const blocked = slotRecord(date, time)?.status === 'blocked';
    const minutes=t=>Number(t.slice(0,2))*60+Number(t.slice(3));
    const start=minutes(time),duration=service().duration;
    const booked = state.appointments.some(a => a.date === date && a.status !== 'cancelled' && start<minutes(a.time)+service(a.serviceId).duration && start+duration>minutes(a.time));
    const day=new Date(date+'T'+time+':00+07:00');
    return blocked || booked || day.getTime()<Date.now();
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
    ['calendar','Đặt & quản lý lịch',[['booking','Hướng dẫn đặt lịch'],['lookup','Tra cứu và xem lịch hẹn']]],
    ['card','Đặt cọc & thanh toán',[['deposit','Cách chuyển khoản đặt cọc'],['verification','Đã chuyển tiền nhưng chưa xác nhận'],['receipt','Xem và tải biên nhận']]],
    ['clock','Đổi, hủy & hoàn cọc',[['reschedule','Gửi yêu cầu đổi lịch'],['cancel','Gửi yêu cầu hủy lịch'],['refund','Theo dõi hoàn cọc']]],
    ['star','Chuẩn bị cho buổi hẹn',[['preparation','Chuẩn bị trước khi trang điểm'],['reference','Gửi ảnh phong cách tham khảo']]]
  ];
  const lookItems = [
    ['bridal','Ngày của riêng bạn','bridal-new.png','bridal'],['natural','Nét trong trẻo','natural.png','personal'],
    ['evening','Sắc thái cuốn hút','evening.png','party'],['detail','Ánh nhìn cuốn hút','bridal-new.png','bridal'],['portrait','Sắc thái tự nhiên','natural.png','personal']
  ];
  const assetUrl = value => /^(\/assets\/|\/api\/uploads\?|https:\/\/)/.test(value || '') ? value : '/assets/' + (value || 'natural.png');
  const imageFor = s => s.id==='bridal'?(state.brand.bridalImage||'bridal-new.png'):s.id==='personal'||s.id==='photo'?(state.brand.personalImage||'natural.png'):(state.brand.partyImage||'evening.png');
  const field = (name,label,type='text',required=false,value=state.booking[name]||'') => `<label class="ct-field">${label}${required?' *':''}<input name="${name}" type="${type}" value="${esc(value)}" ${required?'required':''} ${type==='tel'?'inputmode="tel" pattern="[+0-9 ()-]{9,16}"':''}></label>`;
  const selectField = (name,label,options,value=state.booking[name]) => `<label class="ct-field">${label}<select name="${name}">${options.map(x=>`<option ${value===x?'selected':''}>${esc(x)}</option>`).join('')}</select></label>`;
  function brandMarkup() {
    return `<a class="brand approved-brand" href="#/" aria-label="HOÀN Makeup Artist — Trang chủ"><img src="/assets/hoan-logo.png" width="155" height="69" alt="HOÀN MAKEUP ARTIST"></a>`;
  }
  function publicHeader(active='') {
    const nav=[['home','/','Trang chủ'],['services','/services','Dịch vụ'],['bridal','/services/bridal','Cô dâu'],['gallery','/gallery','Bộ sưu tập'],['about','/about','Về Hoàn']];
    return `<a class="skip-link" href="#main">Đến nội dung</a><header class="site-header couture-header" id="site-header"><div class="ct-masthead"><a class="ct-search" href="#/search">${icon('search')}<span>Tìm kiếm…</span></a><button class="icon-btn mobile-menu" data-action="mobile-menu" aria-label="Mở menu" aria-expanded="false">${icon('menu')}</button>${brandMarkup()}<a class="ct-book" href="#/booking/service">${icon('calendar')}<span>Đặt lịch</span></a></div><nav class="main-nav" aria-label="Điều hướng chính">${nav.map(([key,path,label])=>`<div class="nav-entry"><a class="nav-label ${active===key?'active':''}" href="#${path}" ${['services','gallery','about'].includes(key)?`data-nav="${key}" aria-controls="nav-panel-${key}" aria-expanded="false"`:''}>${label}</a>${['services','gallery','about'].includes(key)?`<button class="nav-expand" data-nav-toggle="${key}" aria-label="Mở nhánh ${label}" aria-expanded="false">+</button>${editorialMenu(key)}`:''}</div>`).join('')}</nav></header><div class="nav-veil" hidden></div>`;
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
    return `<footer class="public-footer couture-footer ${isAbout?'ct-about-footer':''}">${brandMarkup()}<nav aria-label="Thông tin và hỗ trợ">${footerNav.map(([p,t],i)=>`${i>0?'<span class="footer-sep">|</span>':''}<a ${current.startsWith('/'+p)?'aria-current="page"':''} href="#/${p}">${t}</a>`).join('')}</nav>${socialLinks}${tagline}</footer>`;
  }
  function ctPage(active,title,body,breadcrumb=title,wide=false) {
    return `<div class="page couture ct-page-${active||'default'}">${publicHeader(active)}<main id="main" class="ct-main ${wide?'ct-wide':''}"><div class="breadcrumbs"><a href="#/">Trang chủ</a><span>›</span>${esc(breadcrumb)}</div>${title?`<h1 class="ct-title">${title}</h1>`:''}${body}</main>${publicFooter()}</div>`;
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
    const srvTitle = b.servicesPageTitle || 'Dịch vụ trang điểm';
    const srvSubtitle = b.servicesPageSubtitle || 'Lựa chọn dành cho khoảnh khắc của bạn.';
    const consultTitle = b.consultTitle || 'Tìm phong cách phù hợp';
    const consultDesc = b.consultDesc || 'Chia sẻ dịp tham dự, trang phục và mong muốn của bạn cùng Hoàn.';
    const filter=new URLSearchParams(location.hash.split('?')[1]).get('filter')||'all';
    return ctPage('services',srvTitle,`<p class="ct-subtitle">${esc(srvSubtitle)}</p><nav class="ct-tabs">${[['all','Tất cả'],['personal','Cá nhân'],['party','Dự tiệc'],['bridal','Cô dâu']].map(([v,t])=>`<a class="${filter===v?'active':''}" href="#/services?filter=${v}">${t}</a>`).join('')}</nav><section class="ct-service-grid">${state.services.filter(s=>s.enabled&&(filter==='all'||s.id===filter)).map(s=>`<article><a href="#/services/${s.id}">${fashionPhoto(imageFor(s),esc(s.name))}</a><h2>${esc(s.name)}</h2><p>${esc(s.description)}</p><p class="ct-service-meta">${s.contact?'Tư vấn riêng':`${money(s.price)} · ${s.duration} phút`}</p><a class="link" href="#/services/${s.id}">Xem chi tiết ${icon('arrow')}</a><button class="btn btn-wide" data-action="choose-service" data-id="${s.id}">CHỌN DỊCH VỤ</button></article>`).join('')}</section><section class="ct-consult"><img src="/assets/natural.png" alt="Phong cách trang điểm tự nhiên" loading="lazy"><div><h2>${esc(consultTitle)}</h2><p>${esc(consultDesc)}</p><a class="btn" href="#/contact">NHẬN TƯ VẤN</a></div></section>`,'Dịch vụ',true);
  }
  function pageServiceDetail(id) {
    const s=state.services.find(s=>s.id===id);if(!s)return ctPage('services','Không tìm thấy dịch vụ','<a href="#/services">Xem các dịch vụ</a>');
    return ctPage(id==='bridal'?'bridal':'services','',`<section class="ct-product-detail"><div>${fashionPhoto(imageFor(s),esc(s.name))}</div><article><p class="ct-overline">${esc(state.brand?.name||'HOÀN')} MAKEUP ARTIST</p><h1>${esc(s.name)}</h1><p>${esc(s.description)}</p><p class="ct-price">${s.contact?'Trao đổi để nhận tư vấn':money(s.price)}</p><p>${icon('clock')} ${s.duration} phút · Phí di chuyển được báo trước khi đặt cọc.</p><h3>Trải nghiệm của bạn</h3><ul><li>Trao đổi phong cách, trang phục và dịp tham dự.</li><li>Chuẩn bị da và trang điểm theo đường nét.</li><li>Kiểm tra và hoàn thiện diện mạo.</li></ul><button class="btn btn-dark btn-wide" data-action="choose-service" data-id="${s.id}">${s.contact?'YÊU CẦU TƯ VẤN':'CHỌN NGÀY VÀ GIỜ'}</button><a class="link" href="#/policies/deposit">Chính sách đặt cọc ${icon('arrow')}</a></article></section>`,`Dịch vụ / ${s.name}`,true);
  }
  function pageGallery(filter='all') {
    const visible=lookItems.filter(x=>filter==='all'||x[3]===filter);
    return ctPage('gallery','Những sắc thái của vẻ đẹp',`<p class="ct-subtitle">Tìm cảm hứng cho phong cách của bạn.</p><nav class="ct-tabs">${[['all','Tất cả'],['personal','Trong trẻo'],['party','Dự tiệc'],['bridal','Cô dâu']].map(([v,t])=>`<a class="${filter===v?'active':''}" href="#/gallery?filter=${v}">${t}</a>`).join('')}</nav><section class="ct-gallery">${visible.map(([id,title,photo])=>`<article class="ct-look-${id}"><a href="#/look/${id}">${fashionPhoto(photo,title)}</a><div><h2>${title}</h2><a class="link" href="#/look/${id}">Xem bộ ảnh ${icon('arrow')}</a></div></article>`).join('')}</section>`,'Bộ sưu tập',true);
  }
  function pageLook() {
    const id=location.hash.split('/')[2];const x=lookItems.find(x=>x[0]===id)||lookItems[0];
    return ctPage('gallery',x[1],`<section class="ct-product-detail"><div class="${x[0]==='detail'?'ct-detail-crop':''}">${fashionPhoto(x[2],x[1])}</div><article><p class="ct-overline">${esc(service(x[3]).name)}</p><h2>${x[1]}</h2><p>Lựa chọn điểm nhấn theo đường nét, trang phục và mong muốn của bạn.</p><button class="btn btn-dark" data-action="look-book" data-id="${x[3]}" data-style="${x[1]}">ĐẶT LỊCH PHONG CÁCH NÀY</button><a class="link" href="#/gallery">Trở về bộ sưu tập</a></article></section>`,'Bộ sưu tập / '+x[1]);
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
  function pageSupport() {
    const q=new URLSearchParams(location.hash.split('?')[1]).get('q')||'';
    return ctPage('support','Trung tâm hỗ trợ',`<p class="ct-subtitle">Chọn nội dung bạn cần hướng dẫn.</p><form class="ct-search-form" data-form="support-search">${icon('search')}<input name="q" aria-label="Tìm hướng dẫn" placeholder="Tìm hướng dẫn…" value="${esc(q)}"><button class="btn">Tìm kiếm</button></form><section class="ct-help-grid">${helpSections.map(([ic,title,links])=>`<article><h2>${icon(ic)} ${title}</h2>${links.filter(x=>x[1].toLocaleLowerCase('vi').includes(q.toLocaleLowerCase('vi'))).map(([id,t])=>`<a href="#/support/${id}">${t} ${icon('arrow')}</a>`).join('')}</article>`).join('')}</section><div class="ct-center-cta"><span>Chưa tìm thấy câu trả lời?</span><a class="btn" href="#/contact">ĐẾN TRANG LIÊN HỆ ${icon('arrow')}</a></div>`,'Hỗ trợ');
  }
  function pageHelpArticle(id) {
    const label=helpSections.flatMap(x=>x[2]).find(x=>x[0]===id)?.[1];if(!label)return pageSupport();
    const articles={booking:['Chọn dịch vụ phù hợp và xem giá, thời lượng.','Chọn ngày, giờ còn trống và nhập địa điểm phục vụ.','Điền thông tin, mong muốn trang điểm và ảnh tham khảo nếu có.','Kiểm tra chi phí, hướng dẫn đặt cọc và gửi yêu cầu. Theo dõi trạng thái tại trang lịch hẹn.'],lookup:['Mở trang Tra cứu lịch và nhập mã lịch cùng số điện thoại đã đặt.','Chọn lịch để xem trạng thái, khoản cọc và các thao tác quản lý.'],deposit:['Kiểm tra tổng chi phí, mức cọc và thông tin người nhận trước khi chuyển khoản.','Chuyển khoản đúng nội dung gắn với mã lịch.','Thông báo đã chuyển khoản tại trang lịch hẹn. Khoản cọc chỉ được ghi nhận sau khi kiểm tra giao dịch.'],verification:['Kiểm tra mã lịch và nội dung chuyển khoản.','Bổ sung thông tin giao dịch tại trang lịch hoặc liên hệ Hoàn. Không cần chuyển lại khi đang chờ đối soát.'],receipt:['Tra cứu và mở lịch hẹn của bạn.','Khi khoản cọc đã được xác minh, chọn Xem biên nhận.','Dùng In / Lưu PDF để lưu biên nhận trên thiết bị.'],reschedule:['Tra cứu lịch hiện tại, chọn Yêu cầu đổi lịch.','Chọn ngày giờ mới và nhập lý do.','Hoàn kiểm tra khả năng sắp xếp trước khi cập nhật lịch.'],cancel:['Mở lịch hẹn và chọn Yêu cầu hủy / hoàn cọc.','Đọc điều kiện áp dụng và nhập lý do.','Gửi yêu cầu, theo dõi phản hồi trong lịch hẹn.'],refund:['Mở lịch hẹn đã gửi yêu cầu hủy.','Theo dõi phản hồi của Hoàn về khoản cọc và phương thức hoàn.','Khoản hoàn chỉ được ghi nhận khi giao dịch đã thực hiện.'],preparation:['Giữ da sạch và dưỡng ẩm nhẹ trước buổi hẹn.','Chuẩn bị trang phục và ảnh phong cách tham khảo.','Báo trước tình trạng da hoặc dị ứng mỹ phẩm để Hoàn chuẩn bị.'],reference:['Ở bước Thông tin, chọn tối đa 3 ảnh phong cách tham khảo.','Ghi rõ điểm bạn thích: lớp nền, màu mắt, môi hoặc kiểu tóc.','Ảnh được gửi kèm yêu cầu để Hoàn trao đổi cùng bạn.']};
    return ctPage('support',label,`<article class="ct-article"><ol>${(articles[id]||[]).map(t=>`<li>${t}</li>`).join('')}</ol><div class="ct-actions"><a class="btn btn-dark" href="#/${id==='booking'?'booking/service':'lookup'}">${id==='booking'?'BẮT ĐẦU ĐẶT LỊCH':'TRA CỨU LỊCH'}</a><a class="btn" href="#/contact">LIÊN HỆ HOÀN</a></div><a class="link" href="#/support">${icon('back')} Tất cả hướng dẫn</a></article>`,'Hỗ trợ / '+label);
  }
  function pagePolicies(tab) {
    const b = state.brand || {};
    const s = state.settings || {};
    const depositStandard = money(Number(s.deposit || 200000));
    const title = b.policiesPageTitle || 'Chính sách dịch vụ';
    const subtitle = b.policiesPageSubtitle || 'Chọn mục để xem đầy đủ điều kiện áp dụng.';
    if(!tab)return ctPage('policies',title,`<p class="ct-subtitle">${esc(subtitle)}</p><section class="ct-policy-list">${policySections.map(([id,pTitle,pDesc],i)=>`<a href="#/policies/${id}"><span class="ct-index">0${i+1}</span><div><h2>${pTitle}</h2><p>${pDesc}</p></div>${icon('arrow')}</a>`).join('')}</section><div class="ct-center-cta">Cần giải thích thêm? <a class="link" href="#/contact">Liên hệ Hoàn ${icon('arrow')}</a></div>`,'Chính sách');
    const policy=policySections.find(p=>p[0]===tab);if(!policy)return pagePolicies();
    const content={
      booking:[
        b.policyBooking1 || 'Chọn dịch vụ, ngày giờ và địa điểm. Giá dịch vụ và phí di chuyển được hiển thị trước khi gửi yêu cầu.',
        b.policyBooking2 || 'Yêu cầu được lưu vào hệ thống. Lịch chỉ được xác nhận sau khi Hoàn kiểm tra thông tin và khoản cọc theo thỏa thuận.'
      ],
      deposit:[
        b.policyDeposit || `Mức cọc tiêu chuẩn hiện tại: ${depositStandard}. Khoản cọc được trừ vào tổng chi phí.`,
        'Thông báo chuyển khoản không đồng nghĩa đã nhận tiền. Hoàn kiểm tra giao dịch thực tế trước khi ghi nhận.',
        'Số tiền còn lại hiển thị trên trang lịch hẹn và được thanh toán sau buổi hẹn.'
      ],
      change:[
        b.policyChange || 'Bạn có thể gửi yêu cầu đổi ngày giờ trong trang quản lý lịch.',
        'Yêu cầu trước giờ hẹn ít nhất 24 giờ được xem xét đổi miễn phí một lần, tùy lịch còn trống. Khoản cọc được chuyển sang lịch mới khi yêu cầu được duyệt.'
      ],
      cancel:[
        b.policyCancel || 'Yêu cầu hủy trước 48 giờ được xem xét hoàn cọc. Trong vòng 48 giờ, khoản cọc có thể không được hoàn.',
        'Số tiền và phương thức hoàn được Hoàn trao đổi trước khi xử lý. Trường hợp bất khả kháng được xem xét riêng.'
      ],
      late:[
        b.policyLate || 'Hãy liên hệ Hoàn nếu bạn dự kiến đến muộn hoặc cần thay đổi thời gian.',
        'Nếu muộn quá 15 phút, thời lượng dịch vụ có thể cần điều chỉnh theo lịch tiếp theo.'
      ],
      travel:[
        b.policyTravel || 'Hoàn phục vụ tại địa chỉ khách cung cấp trong khu vực đã thống nhất.',
        'Phí di chuyển được thông báo trước khi đặt cọc. Nếu địa điểm thay đổi, chi phí cần được kiểm tra lại.'
      ],
      privacy:[
        b.policyPrivacy || 'Thông tin liên hệ, địa điểm, lịch hẹn và mong muốn trang điểm được dùng để tổ chức buổi hẹn và hỗ trợ khách hàng.',
        'Thông tin tình trạng da, dị ứng và ảnh tham khảo do bạn cung cấp giúp chuẩn bị dịch vụ.',
        'Bạn có thể liên hệ Hoàn để yêu cầu kiểm tra, cập nhật hoặc xóa thông tin của mình.'
      ]
    };
    return ctPage('policies',policy[1],`<article class="ct-article">${(content[tab]||[]).map((t,i)=>`<section><h2>0${i+1}</h2><p>${t}</p></section>`).join('')}<div class="ct-actions"><a class="btn" href="#/policies">TẤT CẢ CHÍNH SÁCH</a><a class="btn" href="#/contact">LIÊN HỆ HOÀN</a></div></article>`,'Chính sách / '+policy[1]);
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
  function bookingShell(step,body,nextPath,nextLabel,summary='',hasCustomFooter=false) {
    return `<div class="page couture">${publicHeader()}<main id="main" class="ct-main ct-booking">${progress(step)}${body}${hasCustomFooter?'':`<footer class="ct-booking-footer"><div>${summary||`${esc(service().name)} · ${service().contact?'Tư vấn riêng':money(currentTotal())}`}</div><div class="ct-actions"><button class="btn" data-action="booking-back" data-step="${step}">Quay lại</button>${nextPath?`<button class="btn btn-dark" data-action="ct-next" data-next="${nextPath}" data-step="${step}">${nextLabel}</button>`:''}</div></footer>`}</main>${publicFooter()}</div>`;
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
    return [...new Set(['07:00','08:00','09:30','10:00','13:00','14:00','15:30','16:00','18:00',...state.scheduleSlots.filter(s=>s.slotDate===state.booking.date).map(s=>s.slotTime)])].sort();
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
    return bookingShell(2,`<h1 class="ct-title">Chọn ngày và giờ</h1><p class="ct-subtitle">Thời gian hiển thị theo giờ Việt Nam.</p><section class="ct-time-layout">${calendarMarkup()}<div><h2>Giờ bắt đầu · ${dateLabel()}</h2><div class="ct-time-slots">${times.map(t=>{const no=slotUnavailable(state.booking.date,t)||!state.settings.scheduleOpen;return `<button class="btn ${state.booking.time===t&&!no?'btn-dark':''}" data-action="time-select" data-time="${t}" ${no?'disabled':''}>${t}</button>`}).join('')}</div><p>${icon('clock')} Thời lượng: ${service().duration} phút</p><p class="muted">Giờ đã có lịch hoặc được chặn sẽ không thể chọn.</p></div></section>`,'/booking/location','TIẾP TỤC · ĐỊA ĐIỂM');
  }

  const VIETNAM_LOCATIONS = {
    provinces: [
      'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
      'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
      'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
      'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
      'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
      'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
      'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
      'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định',
      'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên',
      'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
      'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
      'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang',
      'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái'
    ],
    districts: {
      'Hà Nội': [
        'Nam Từ Liêm', 'Ba Đình', 'Hoàn Kiếm', 'Cầu Giấy', 'Đống Đa', 'Hai Bà Trưng',
        'Tây Hồ', 'Thanh Xuân', 'Bắc Từ Liêm', 'Hà Đông', 'Long Biên', 'Hoàng Mai',
        'Thị xã Sơn Tây', 'Huyện Ba Vì', 'Huyện Chương Mỹ', 'Huyện Đan Phượng', 'Huyện Đông Anh',
        'Huyện Gia Lâm', 'Huyện Hoài Đức', 'Huyện Mê Linh', 'Huyện Mỹ Đức', 'Huyện Phú Xuyên',
        'Huyện Phúc Thọ', 'Huyện Quốc Oai', 'Huyện Sóc Sơn', 'Huyện Thạch Thất', 'Huyện Thanh Oai',
        'Huyện Thanh Trì', 'Huyện Thường Tín', 'Huyện Ứng Hòa'
      ],
      'TP. Hồ Chí Minh': [
        'Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8',
        'Quận 10', 'Quận 11', 'Quận 12', 'TP. Thủ Đức', 'Quận Bình Thạnh', 'Quận Gò Vấp',
        'Quận Phú Nhuận', 'Quận Tân Bình', 'Quận Tân Phú', 'Quận Bình Tân',
        'Huyện Bình Chánh', 'Huyện Hóc Môn', 'Huyện Nhà Bè', 'Huyện Củ Chi', 'Huyện Cần Giờ'
      ],
      'Đà Nẵng': [
        'Quận Hải Châu', 'Quận Thanh Khê', 'Quận Sơn Trà', 'Quận Ngũ Hành Sơn',
        'Quận Liên Chiểu', 'Quận Cẩm Lệ', 'Huyện Hòa Vang', 'Huyện Hoàng Sa'
      ],
      'Hải Phòng': [
        'Quận Hồng Bàng', 'Quận Ngô Quyền', 'Quận Lê Chân', 'Quận Hải An',
        'Quận Kiến An', 'Quận Đồ Sơn', 'Quận Dương Kinh', 'Huyện Thủy Nguyên',
        'Huyện An Dương', 'Huyện An Lão', 'Huyện Kiến Thụy', 'Huyện Tiên Lãng',
        'Huyện Vĩnh Bảo', 'Huyện Cát Hải', 'Huyện Bạch Long Vĩ'
      ],
      'Cần Thơ': [
        'Quận Ninh Kiều', 'Quận Bình Thủy', 'Quận Cái Răng', 'Quận Ô Môn',
        'Quận Thốt Nốt', 'Huyện Phong Điền', 'Huyện Cờ Đỏ', 'Huyện Thới Lai', 'Huyện Vĩnh Thạnh'
      ],
      'Bình Dương': ['TP. Thủ Dầu Một', 'TP. Thuận An', 'TP. Dĩ An', 'TP. Tân Uyên', 'TP. Bến Cát', 'Huyện Bàu Bàng', 'Huyện Bắc Tân Uyên', 'Huyện Dầu Tiếng', 'Huyện Phú Giáo'],
      'Đồng Nai': ['TP. Biên Hòa', 'TP. Long Khánh', 'Huyện Long Thành', 'Huyện Nhơn Trạch', 'Huyện Trảng Bom', 'Huyện Thống Nhất', 'Huyện Cẩm Mỹ', 'Huyện Vĩnh Cửu', 'Huyện Định Quán', 'Huyện Tân Phú', 'Huyện Xuân Lộc'],
      'Quảng Ninh': ['TP. Hạ Long', 'TP. Cẩm Phả', 'TP. Uông Bí', 'TP. Móng Cái', 'Thị xã Đông Triều', 'Thị xã Quảng Yên', 'Huyện Vân Đồn', 'Huyện Tiên Yên', 'Huyện Hải Hà', 'Huyện Đầm Hà', 'Huyện Ba Chẽ', 'Huyện Bình Liêu', 'Huyện Cô Tô'],
      'Khánh Hòa': ['TP. Nha Trang', 'TP. Cam Ranh', 'Thị xã Ninh Hòa', 'Huyện Cam Lâm', 'Huyện Diên Khánh', 'Huyện Vạn Ninh', 'Huyện Khánh Vĩnh', 'Huyện Khánh Sơn', 'Huyện Trường Sa'],
      'Bà Rịa - Vũng Tàu': ['TP. Vũng Tàu', 'TP. Bà Rịa', 'Thị xã Phú Mỹ', 'Huyện Châu Đức', 'Huyện Xuyên Mộc', 'Huyện Long Điền', 'Huyện Đất Đỏ', 'Huyện Côn Đảo'],
      'Lâm Đồng': ['TP. Đà Lạt', 'TP. Bảo Lộc', 'Huyện Đức Trọng', 'Huyện Đơn Dương', 'Huyện Lạc Dương', 'Huyện Di Linh', 'Huyện Bảo Lâm', 'Huyện Lâm Hà', 'Huyện Đạ Huoai', 'Huyện Đạ Tẻh', 'Huyện Đam Rông'],
      'Thừa Thiên Huế': ['TP. Huế', 'Thị xã Hương Thủy', 'Thị xã Hương Trà', 'Huyện Phong Điền', 'Huyện Quảng Điền', 'Huyện Phú Vang', 'Huyện Phú Lộc', 'Huyện A Lưới', 'Huyện Nam Đông'],
      'Bắc Ninh': ['TP. Bắc Ninh', 'TP. Từ Sơn', 'Thị xã Quế Võ', 'Thị xã Thuận Thành', 'Huyện Tiên Du', 'Huyện Yên Phong', 'Huyện Gia Bình', 'Huyện Lương Tài'],
      'Hải Dương': ['TP. Hải Dương', 'TP. Chí Linh', 'Thị xã Kinh Môn', 'Huyện Bình Giang', 'Huyện Cẩm Giàng', 'Huyện Gia Lộc', 'Huyện Kim Thành', 'Huyện Nam Sách', 'Huyện Ninh Giang', 'Huyện Thanh Hà', 'Huyện Thanh Miện', 'Huyện Tứ Kỳ'],
      'Hưng Yên': ['TP. Hưng Yên', 'Thị xã Mỹ Hào', 'Huyện Văn Giang', 'Huyện Văn Lâm', 'Huyện Yên Mỹ', 'Huyện Khoái Châu', 'Huyện Kim Động', 'Huyện Ân Thi', 'Huyện Phù Cừ', 'Huyện Tiên Lữ'],
      'Vĩnh Phúc': ['TP. Vĩnh Yên', 'TP. Phúc Yên', 'Huyện Bình Xuyên', 'Huyện Vĩnh Tường', 'Huyện Yên Lạc', 'Huyện Tam Dương', 'Huyện Tam Đảo', 'Huyện Lập Thạch', 'Huyện Sông Lô'],
      'Nam Định': ['TP. Nam Định', 'Huyện Giao Thủy', 'Huyện Hải Hậu', 'Huyện Mỹ Lộc', 'Huyện Nam Trực', 'Huyện Nghĩa Hưng', 'Huyện Trực Ninh', 'Huyện Vụ Bản', 'Huyện Xuân Trường', 'Huyện Ý Yên'],
      'Thái Bình': ['TP. Thái Bình', 'Huyện Đông Hưng', 'Huyện Hưng Hà', 'Huyện Kiến Xương', 'Huyện Quỳnh Phụ', 'Huyện Thái Thụy', 'Huyện Tiền Hải', 'Huyện Vũ Thư'],
      'Ninh Bình': ['TP. Ninh Bình', 'TP. Tam Điệp', 'Huyện Gia Viễn', 'Huyện Hoa Lư', 'Huyện Kim Sơn', 'Huyện Nho Quan', 'Huyện Yên Khánh', 'Huyện Yên Mô'],
      'Thanh Hóa': ['TP. Thanh Hóa', 'TP. Sầm Sơn', 'Thị xã Bỉm Sơn', 'Thị xã Nghi Sơn', 'Huyện Đông Sơn', 'Huyện Hoằng Hóa', 'Huyện Hậu Lộc', 'Huyện Nga Sơn', 'Huyện Quảng Xương', 'Huyện Thọ Xuân', 'Huyện Triệu Sơn', 'Huyện Tĩnh Gia', 'Huyện Yên Định'],
      'Nghệ An': ['TP. Vinh', 'Thị xã Cửa Lò', 'Thị xã Hoàng Mai', 'Thị xã Thái Hòa', 'Huyện Diễn Châu', 'Huyện Đô Lương', 'Huyện Hưng Nguyên', 'Huyện Nam Đàn', 'Huyện Nghi Lộc', 'Huyện Quỳnh Lưu', 'Huyện Thanh Chương', 'Huyện Yên Thành'],
      'Hà Tĩnh': ['TP. Hà Tĩnh', 'Thị xã Hồng Lĩnh', 'Thị xã Kỳ Anh', 'Huyện Cẩm Xuyên', 'Huyện Can Lộc', 'Huyện Đức Thọ', 'Huyện Hương Khê', 'Huyện Hương Sơn', 'Huyện Nghi Xuân', 'Huyện Thạch Hà'],
      'Quảng Bình': ['TP. Đồng Hới', 'Thị xã Ba Đồn', 'Huyện Bố Trạch', 'Huyện Lệ Thủy', 'Huyện Quảng Ninh', 'Huyện Quảng Trạch', 'Huyện Tuyên Hóa'],
      'Quảng Trị': ['TP. Đông Hà', 'Thị xã Quảng Trị', 'Huyện Cam Lộ', 'Huyện Gio Linh', 'Huyện Hải Lăng', 'Huyện Hướng Hóa', 'Huyện Triệu Phong', 'Huyện Vĩnh Linh'],
      'Quảng Nam': ['TP. Tam Kỳ', 'TP. Hội An', 'Thị xã Điện Bàn', 'Huyện Đại Lộc', 'Huyện Duy Xuyên', 'Huyện Núi Thành', 'Huyện Thăng Bình', 'Huyện Quế Sơn'],
      'Quảng Ngãi': ['TP. Quảng Ngãi', 'Thị xã Đức Phổ', 'Huyện Bình Sơn', 'Huyện Lý Sơn', 'Huyện Mộ Đức', 'Huyện Tư Nghĩa'],
      'Bình Định': ['TP. Quy Nhơn', 'Thị xã An Nhơn', 'Thị xã Hoài Nhơn', 'Huyện Phù Cát', 'Huyện Phù Mỹ', 'Huyện Tây Sơn', 'Huyện Tuy Phước'],
      'Phú Yên': ['TP. Tuy Hòa', 'Thị xã Sông Cầu', 'Thị xã Đông Hòa', 'Huyện Tuy An', 'Huyện Tây Hòa', 'Huyện Phú Hòa'],
      'Ninh Thuận': ['TP. Phan Rang - Tháp Chàm', 'Huyện Ninh Hải', 'Huyện Ninh Phước', 'Huyện Ninh Sơn', 'Huyện Thuận Bắc', 'Huyện Thuận Nam'],
      'Bình Thuận': ['TP. Phan Thiết', 'Thị xã La Gi', 'Huyện Hàm Thuận Bắc', 'Huyện Hàm Thuận Nam', 'Huyện Tuy Phong', 'Huyện Bắc Bình', 'Huyện Phú Quý'],
      'Tây Ninh': ['TP. Tây Ninh', 'Thị xã Hòa Thành', 'Thị xã Trảng Bàng', 'Huyện Gò Dầu', 'Huyện Bến Cầu', 'Huyện Châu Thành', 'Huyện Dương Minh Châu'],
      'Bình Phước': ['TP. Đồng Xoài', 'Thị xã Bình Long', 'Thị xã Phước Long', 'Thị xã Chơn Thành', 'Huyện Đồng Phú', 'Huyện Hớn Quản', 'Huyện Lộc Ninh'],
      'Long An': ['TP. Tân An', 'Thị xã Kiến Tường', 'Huyện Bến Lức', 'Huyện Cần Đước', 'Huyện Cần Giuộc', 'Huyện Đức Hòa', 'Huyện Châu Thành', 'Huyện Thủ Thừa'],
      'Tiền Giang': ['TP. Mỹ Tho', 'Thị xã Gò Công', 'Thị xã Cai Lậy', 'Huyện Châu Thành', 'Huyện Chợ Gạo', 'Huyện Cái Bè', 'Huyện Gò Công Đông'],
      'Bến Tre': ['TP. Bến Tre', 'Huyện Châu Thành', 'Huyện Ba Tri', 'Huyện Bình Đại', 'Huyện Giồng Trôm', 'Huyện Mỏ Cày Nam', 'Huyện Thạnh Phú'],
      'Trà Vinh': ['TP. Trà Vinh', 'Thị xã Duyên Hải', 'Huyện Châu Thành', 'Huyện Càng Long', 'Huyện Cầu Kè', 'Huyện Tiểu Cần'],
      'Vĩnh Long': ['TP. Vĩnh Long', 'Thị xã Bình Minh', 'Huyện Long Hồ', 'Huyện Mang Thít', 'Huyện Tam Bình', 'Huyện Trà Ôn'],
      'Đồng Tháp': ['TP. Cao Lãnh', 'TP. Sa Đéc', 'TP. Hồng Ngự', 'Huyện Cao Lãnh', 'Huyện Châu Thành', 'Huyện Lấp Vò', 'Huyện Lai Vung', 'Huyện Tháp Mười'],
      'An Giang': ['TP. Long Xuyên', 'TP. Châu Đốc', 'Thị xã Tân Châu', 'Thị xã Tịnh Biên', 'Huyện Châu Phú', 'Huyện Châu Thành', 'Huyện Chợ Mới', 'Huyện Phú Tân', 'Huyện Thoại Sơn'],
      'Kiên Giang': ['TP. Rạch Giá', 'TP. Hà Tiên', 'TP. Phú Quốc', 'Huyện Châu Thành', 'Huyện Kiên Lương', 'Huyện Hòn Đất', 'Huyện Tân Hiệp', 'Huyện Giồng Riềng'],
      'Hậu Giang': ['TP. Vị Thanh', 'TP. Ngã Bảy', 'Thị xã Long Mỹ', 'Huyện Châu Thành', 'Huyện Phụng Hiệp', 'Huyện Vị Thủy'],
      'Sóc Trăng': ['TP. Sóc Trăng', 'Thị xã Ngã Năm', 'Thị xã Vĩnh Châu', 'Huyện Châu Thành', 'Huyện Kế Sách', 'Huyện Mỹ Xuyên', 'Huyện Trần Đề'],
      'Bạc Liêu': ['TP. Bạc Liêu', 'Thị xã Giá Rai', 'Huyện Vĩnh Lợi', 'Huyện Hòa Bình', 'Huyện Phước Long', 'Huyện Đông Hải'],
      'Cà Mau': ['TP. Cà Mau', 'Huyện Năm Căn', 'Huyện Đầm Dơi', 'Huyện Trần Văn Thời', 'Huyện Cái Nước', 'Huyện U Minh', 'Huyện Phú Tân'],
      'Gia Lai': ['TP. Pleiku', 'Thị xã An Khê', 'Thị xã Ayun Pa', 'Huyện Chư Sê', 'Huyện Đak Đoa', 'Huyện Ia Grai', 'Huyện Mang Yang'],
      'Kon Tum': ['TP. Kon Tum', 'Huyện Đắk Hà', 'Huyện Ngọc Hồi', 'Huyện Kon Plông', 'Huyện Sa Thầy'],
      'Đắk Lắk': ['TP. Buôn Ma Thuột', 'Thị xã Buôn Hồ', 'Huyện Cư M\'gar', 'Huyện Krông Pắc', 'Huyện Ea Kar', 'Huyện Buôn Đôn'],
      'Đắk Nông': ['TP. Gia Nghĩa', 'Huyện Cư Jút', 'Huyện Đắk Mil', 'Huyện Đắk R\'lấp', 'Huyện Krông Nô'],
      'Thái Nguyên': ['TP. Thái Nguyên', 'TP. Sông Công', 'TP. Phổ Yên', 'Huyện Đại Từ', 'Huyện Đồng Hỷ', 'Huyện Phú Bình'],
      'Phú Thọ': ['TP. Việt Trì', 'Thị xã Phú Thọ', 'Huyện Lâm Thao', 'Huyện Phù Ninh', 'Huyện Thanh Ba', 'Huyện Tam Nông'],
      'Bắc Giang': ['TP. Bắc Giang', 'Thị xã Việt Yên', 'Huyện Hiệp Hòa', 'Huyện Lạng Giang', 'Huyện Lục Nam', 'Huyện Tân Yên', 'Huyện Yên Dũng'],
      'Hòa Bình': ['TP. Hòa Bình', 'Huyện Lương Sơn', 'Huyện Kim Bôi', 'Huyện Mai Châu', 'Huyện Cao Phong', 'Huyện Tân Lạc'],
      'Sơn La': ['TP. Sơn La', 'Huyện Mộc Châu', 'Huyện Mai Sơn', 'Huyện Thuận Châu', 'Huyện Mường La', 'Huyện Yên Châu'],
      'Điện Biên': ['TP. Điện Biên Phủ', 'Thị xã Mường Lay', 'Huyện Điện Biên', 'Huyện Tuần Giáo', 'Huyện Mường Ảng'],
      'Lai Châu': ['TP. Lai Châu', 'Huyện Tam Đường', 'Huyện Phong Thổ', 'Huyện Tân Uyên', 'Huyện Than Uyên'],
      'Lào Cai': ['TP. Lào Cai', 'Thị xã Sa Pa', 'Huyện Bát Xát', 'Huyện Bảo Thắng', 'Huyện Bắc Hà', 'Huyện Văn Bàn'],
      'Yên Bái': ['TP. Yên Bái', 'Thị xã Nghĩa Lộ', 'Huyện Trấn Yên', 'Huyện Văn Yên', 'Huyện Lục Yên', 'Huyện Yên Bình'],
      'Hà Giang': ['TP. Hà Giang', 'Huyện Vị Xuyên', 'Huyện Bắc Quang', 'Huyện Đồng Văn', 'Huyện Mèo Vạc', 'Huyện Hoàng Su Phì'],
      'Cao Bằng': ['TP. Cao Bằng', 'Huyện Trùng Khánh', 'Huyện Quảng Hòa', 'Huyện Hòa An', 'Huyện Hà Quảng'],
      'Bắc Kạn': ['TP. Bắc Kạn', 'Huyện Ba Bể', 'Huyện Chợ Đồn', 'Huyện Bạch Thông', 'Huyện Chợ Mới'],
      'Lạng Sơn': ['TP. Lạng Sơn', 'Huyện Cao Lộc', 'Huyện Chi Lăng', 'Huyện Hữu Lũng', 'Huyện Lộc Bình'],
      'Tuyên Quang': ['TP. Tuyên Quang', 'Huyện Yên Sơn', 'Huyện Sơn Dương', 'Huyện Hàm Yên', 'Huyện Chiêm Hóa'],
      'Hà Nam': ['TP. Phủ Lý', 'Thị xã Duy Tiên', 'Huyện Kim Bảng', 'Huyện Thanh Liêm', 'Huyện Lý Nhân', 'Huyện Bình Lục']
    },
    wards: {
      'Nam Từ Liêm': ['Phường Phú Đô', 'Phường Mễ Trì', 'Phường Mỹ Đình 1', 'Phường Mỹ Đình 2', 'Phường Cầu Diễn', 'Phường Trung Văn', 'Phường Đại Mỗ', 'Phường Tây Mỗ', 'Phường Xuân Phương', 'Phường Phương Canh'],
      'Bắc Từ Liêm': ['Phường Cổ Nhuế 1', 'Phường Cổ Nhuế 2', 'Phường Đông Ngạc', 'Phường Đức Thắng', 'Phường Liên Mạc', 'Phường Minh Khai', 'Phường Phú Diễn', 'Phường Phúc Diễn', 'Phường Tây Tựu', 'Phường Thượng Cát', 'Phường Thụy Phương', 'Phường Xuân Đỉnh', 'Phường Xuân Tảo'],
      'Cầu Giấy': ['Phường Dịch Vọng', 'Phường Dịch Vọng Hậu', 'Phường Mai Dịch', 'Phường Nghĩa Đô', 'Phường Nghĩa Tân', 'Phường Quan Hoa', 'Phường Trung Hòa', 'Phường Yên Hòa'],
      'Ba Đình': ['Phường Cống Vị', 'Phường Điện Biên', 'Phường Đội Cấn', 'Phường Giảng Võ', 'Phường Kim Mã', 'Phường Liễu Giai', 'Phường Ngọc Hà', 'Phường Ngọc Khánh', 'Phường Nguyễn Trung Trực', 'Phường Phúc Xá', 'Phường Quán Thánh', 'Phường Thành Công', 'Phường Trúc Bạch', 'Phường Vĩnh Phúc'],
      'Hoàn Kiếm': ['Phường Hàng Bạc', 'Phường Hàng Đào', 'Phường Hàng Bông', 'Phường Hàng Gai', 'Phường Hàng Mã', 'Phường Tràng Tiền', 'Phường Lý Thái Tổ', 'Phường Cửa Đông', 'Phường Cửa Nam', 'Phường Đồng Xuân', 'Phường Phan Chu Trinh', 'Phường Phúc Tân', 'Phường Trần Hưng Đạo', 'Phường Hàng Trống', 'Phường Hàng Buồm', 'Phường Hàng Bồ', 'Phường Chương Dương'],
      'Đống Đa': ['Phường Cát Linh', 'Phường Hàng Bột', 'Phường Khâm Thiên', 'Phường Khương Thượng', 'Phường Kim Liên', 'Phường Láng Hạ', 'Phường Láng Thượng', 'Phường Nam Đồng', 'Phường Ngã Tư Sở', 'Phường Ô Chợ Dừa', 'Phường Phương Mai', 'Phường Quang Trung', 'Phường Quốc Tử Giám', 'Phường Thịnh Quang', 'Phường Trung Liệt', 'Phường Trung Tự', 'Phường Văn Miếu', 'Phường Phương Liên', 'Phường Thổ Quan', 'Phường Văn Chương'],
      'Hai Bà Trưng': ['Phường Bạch Đằng', 'Phường Bách Khoa', 'Phường Bạch Mai', 'Phường Cầu Dền', 'Phường Đống Mác', 'Phường Đồng Nhân', 'Phường Đồng Tâm', 'Phường Lê Đại Hành', 'Phường Minh Khai', 'Phường Nguyễn Du', 'Phường Phạm Đình Hổ', 'Phường Phố Huế', 'Phường Quỳnh Lôi', 'Phường Quỳnh Mai', 'Phường Thanh Lương', 'Phường Thanh Nhàn', 'Phường Trương Định', 'Phường Vĩnh Tuy'],
      'Thanh Xuân': ['Phường Hạ Đình', 'Phường Khương Đình', 'Phường Khương Mai', 'Phường Khương Trung', 'Phường Kim Giang', 'Phường Nhân Chính', 'Phường Phương Liệt', 'Phường Thanh Xuân Bắc', 'Phường Thanh Xuân Nam', 'Phường Thanh Xuân Trung', 'Phường Thượng Đình'],
      'Tây Hồ': ['Phường Bưởi', 'Phường Nhật Tân', 'Phường Phú Thượng', 'Phường Quảng An', 'Phường Thụy Khuê', 'Phường Tứ Liên', 'Phường Xuân La', 'Phường Yên Phụ'],
      'Hoàng Mai': ['Phường Đại Kim', 'Phường Định Công', 'Phường Giáp Bát', 'Phường Hoàng Liệt', 'Phường Hoàng Văn Thụ', 'Phường Lĩnh Nam', 'Phường Mai Động', 'Phường Tân Mai', 'Phường Thanh Trì', 'Phường Thịnh Liệt', 'Phường Trần Phú', 'Phường Tương Mai', 'Phường Vĩnh Hưng', 'Phường Yên Sở'],
      'Hà Đông': ['Phường Biên Giang', 'Phường Đồng Mai', 'Phường Dương Nội', 'Phường Hà Cầu', 'Phường Kiến Hưng', 'Phường La Khê', 'Phường Mộ Lao', 'Phường Nguyễn Trãi', 'Phường Phú La', 'Phường Phúc La', 'Phường Quang Trung', 'Phường Vạn Phúc', 'Phường Văn Quán', 'Phường Yên Nghĩa', 'Phường Yết Kiêu'],
      'Long Biên': ['Phường Bồ Đề', 'Phường Cự Khối', 'Phường Đức Giang', 'Phường Gia Thụy', 'Phường Giang Biên', 'Phường Long Biên', 'Phường Ngọc Lâm', 'Phường Ngọc Thụy', 'Phường Phúc Đồng', 'Phường Phúc Lợi', 'Phường Sài Đồng', 'Phường Thạch Bàn', 'Phường Thượng Thanh', 'Phường Việt Hưng'],
      'Thị xã Sơn Tây': ['Phường Lê Lợi', 'Phường Ngô Quyền', 'Phường Phú Thịnh', 'Phường Quang Trung', 'Phường Sơn Lộc', 'Phường Trung Hưng', 'Phường Trung Sơn Trầm', 'Phường Viên Sơn', 'Phường Xuân Khanh', 'Xã Đường Lâm', 'Xã Sơn Đông', 'Xã Cổ Đông'],
      'Huyện Thanh Trì': ['Thị trấn Văn Điển', 'Xã Tân Triều', 'Xã Thanh Liệt', 'Xã Tả Thanh Oai', 'Xã Vĩnh Quỳnh', 'Xã Tam Hiệp', 'Xã Tứ Hiệp', 'Xã Ngũ Hiệp', 'Xã Ngọc Hồi', 'Xã Đại Áng'],
      'Huyện Gia Lâm': ['Thị trấn Trâu Quỳ', 'Thị trấn Yên Viên', 'Xã Bát Tràng', 'Xã Đa Tốn', 'Xã Kiêu Kỵ', 'Xã Ninh Hiệp', 'Xã Phù Đổng', 'Xã Cổ Bi', 'Xã Đặng Xá'],
      'Huyện Đông Anh': ['Thị trấn Đông Anh', 'Xã Kim Chung', 'Xã Hải Bối', 'Xã Vĩnh Ngọc', 'Xã Cổ Loa', 'Xã Tiên Dương', 'Xã Uy Nỗ', 'Xã Bắc Hồng', 'Xã Nam Hồng'],
      'Huyện Hoài Đức': ['Thị trấn Trạm Trôi', 'Xã An Khánh', 'Xã An Thượng', 'Xã Vân Canh', 'Xã Di Trạch', 'Xã Kim Chung', 'Xã La Phù', 'Xã Đức Giang', 'Xã Lại Yên'],
      'Huyện Đan Phượng': ['Thị trấn Phùng', 'Xã Tân Lập', 'Xã Tân Hội', 'Xã Đan Phượng', 'Xã Song Phượng', 'Xã Đồng Tháp'],
      'Quận 1': ['Phường Bến Nghé', 'Phường Bến Thành', 'Phường Cầu Kho', 'Phường Cầu Ông Lãnh', 'Phường Cô Giang', 'Phường Đa Kao', 'Phường Nguyễn Cư Trinh', 'Phường Nguyễn Thái Bình', 'Phường Phạm Ngũ Lão', 'Phường Tân Định'],
      'Quận 3': ['Phường Võ Thị Sáu', 'Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 14'],
      'Quận 4': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 6', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 18'],
      'Quận 5': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14'],
      'Quận 6': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14'],
      'Quận 7': ['Phường Tân Phong', 'Phường Tân Phú', 'Phường Tân Thuận Đông', 'Phường Tân Thuận Tây', 'Phường Tân Kiểng', 'Phường Tân Quy', 'Phường Bình Thuận', 'Phường Phú Thuận', 'Phường Phú Mỹ'],
      'Quận 8': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16'],
      'Quận 10': ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15'],
      'Quận 11': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16'],
      'Quận 12': ['Phường An Phú Đông', 'Phường Đông Hưng Thuận', 'Phường Hiệp Thành', 'Phường Tân Chánh Hiệp', 'Phường Tân Hưng Thuận', 'Phường Tân Thới Hiệp', 'Phường Tân Thới Nhất', 'Phường Thạnh Lộc', 'Phường Thạnh Xuân', 'Phường Thới An', 'Phường Trung Mỹ Tây'],
      'TP. Thủ Đức': ['Phường Thảo Điền', 'Phường An Phú', 'Phường Thủ Thiêm', 'Phường An Khánh', 'Phường Bình Trưng Đông', 'Phường Bình Trưng Tây', 'Phường Hiệp Phú', 'Phường Tăng Nhơn Phú A', 'Phường Phước Long B', 'Phường Linh Trung', 'Phường Linh Chiểu', 'Phường Hiệp Bình Chánh', 'Phường Hiệp Bình Phước', 'Phường Tam Bình', 'Phường Tam Phú', 'Phường Trường Thọ'],
      'Quận Bình Thạnh': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 17', 'Phường 19', 'Phường 21', 'Phường 22', 'Phường 24', 'Phường 25', 'Phường 26', 'Phường 27', 'Phường 28'],
      'Quận Gò Vấp': ['Phường 1', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 17'],
      'Quận Phú Nhuận': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 13', 'Phường 15', 'Phường 17'],
      'Quận Tân Bình': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15'],
      'Quận Tân Phú': ['Phường Hiệp Tân', 'Phường Hòa Thạnh', 'Phường Phú Thạnh', 'Phường Phú Thọ Hòa', 'Phường Phú Trung', 'Phường Sơn Kỳ', 'Phường Tân Quý', 'Phường Tân Sơn Nhì', 'Phường Tân Thành', 'Phường Tân Thới Hòa', 'Phường Tây Thạnh'],
      'Quận Bình Tân': ['Phường An Lạc', 'Phường An Lạc A', 'Phường Bình Hưng Hòa', 'Phường Bình Hưng Hòa A', 'Phường Bình Hưng Hòa B', 'Phường Bình Trị Đông', 'Phường Bình Trị Đông A', 'Phường Bình Trị Đông B', 'Phường Tân Tạo', 'Phường Tân Tạo A'],
      'Huyện Bình Chánh': ['Thị trấn Tân Túc', 'Xã An Phú Tây', 'Xã Bình Chánh', 'Xã Bình Hưng', 'Xã Bình Lợi', 'Xã Đa Phước', 'Xã Hưng Long', 'Xã Lê Minh Xuân', 'Xã Phong Phú', 'Xã Vĩnh Lộc A', 'Xã Vĩnh Lộc B'],
      'Huyện Hóc Môn': ['Thị trấn Hóc Môn', 'Xã Bà Điểm', 'Xã Đông Thạnh', 'Xã Nhị Bình', 'Xã Tân Hiệp', 'Xã Tân Thới Nhì', 'Xã Tân Xuân', 'Xã Thới Tam Thôn', 'Xã Trung Chánh', 'Xã Xuân Thới Thượng'],
      'Huyện Nhà Bè': ['Thị trấn Nhà Bè', 'Xã Hiệp Phước', 'Xã Long Thới', 'Xã Nhơn Đức', 'Xã Phú Xuân', 'Xã Phước Kiển', 'Xã Phước Lộc'],
      'Quận Hải Châu': ['Phường Hải Châu 1', 'Phường Hải Châu 2', 'Phường Thạch Thang', 'Phường Thanh Bình', 'Phường Thuận Phước', 'Phường Hòa Thuận Đông', 'Phường Hòa Thuận Tây', 'Phường Nam Dương', 'Phường Phước Ninh', 'Phường Bình Thuận', 'Phường Bình Hiên', 'Phường Hòa Cường Bắc', 'Phường Hòa Cường Nam'],
      'Quận Thanh Khê': ['Phường Vĩnh Trung', 'Phường Tân Chính', 'Phường Thạc Gián', 'Phường Chính Gián', 'Phường Tam Thuận', 'Phường Xuân Hà', 'Phường An Khê', 'Phường Hòa Khê', 'Phường Thanh Khê Đông', 'Phường Thanh Khê Tây'],
      'Quận Sơn Trà': ['Phường An Hải Bắc', 'Phường An Hải Đông', 'Phường An Hải Tây', 'Phường Mân Thái', 'Phường Nại Hiên Đông', 'Phường Phước Mỹ', 'Phường Thọ Quang'],
      'Quận Ngũ Hành Sơn': ['Phường Mỹ An', 'Phường Khuê Mỹ', 'Phường Hòa Hải', 'Phường Hòa Quý'],
      'Quận Liên Chiểu': ['Phường Hòa Hiệp Bắc', 'Phường Hòa Hiệp Nam', 'Phường Hòa Khánh Bắc', 'Phường Hòa Khánh Nam', 'Phường Hòa Minh'],
      'Quận Cẩm Lệ': ['Phường Khuê Trung', 'Phường Hòa Thọ Đông', 'Phường Hòa Thọ Tây', 'Phường Hòa An', 'Phường Hòa Phát', 'Phường Hòa Xuân'],
      'Quận Hồng Bàng': ['Phường Hạ Lý', 'Phường Hoàng Văn Thụ', 'Phường Minh Khai', 'Phường Phan Bội Châu', 'Phường Quán Toan', 'Phường Sở Dầu', 'Phường Thượng Lý', 'Phường Trại Chuối'],
      'Quận Lê Chân': ['Phường An Biên', 'Phường An Dương', 'Phường Cát Dài', 'Phường Dư Hàng', 'Phường Dư Hàng Kênh', 'Phường Hàng Kênh', 'Phường Kênh Dương', 'Phường Lam Sơn', 'Phường Niệm Nghĩa', 'Phường Nghĩa Xá', 'Phường Trại Cau', 'Phường Trần Nguyên Hãn', 'Phường Vĩnh Niệm'],
      'Quận Ngô Quyền': ['Phường Cầu Đất', 'Phường Cầu Tre', 'Phường Đằng Giang', 'Phường Đông Khê', 'Phường Gia Viên', 'Phường Lạc Viên', 'Phường Lạch Tray', 'Phường Lê Lợi', 'Phường Máy Chai', 'Phường Máy Tơ', 'Phường Vạn Mỹ'],
      'Quận Hải An': ['Phường Cát Bi', 'Phường Đằng Hải', 'Phường Đằng Lâm', 'Phường Đông Hải 1', 'Phường Đông Hải 2', 'Phường Nam Hải', 'Phường Thành Tô', 'Phường Tràng Cát'],
      'Quận Ninh Kiều': ['Phường An Bình', 'Phường An Cư', 'Phường An Hòa', 'Phường An Khánh', 'Phường An Nghiệp', 'Phường Cái Khế', 'Phường Hưng Lợi', 'Phường Tân An', 'Phường Thới Bình', 'Phường Xuân Khánh'],
      'Quận Bình Thủy': ['Phường An Thới', 'Phường Bình Thủy', 'Phường Bùi Hữu Nghĩa', 'Phường Long Hòa', 'Phường Long Tuyền', 'Phường Thới An Đông', 'Phường Trà An', 'Phường Trà Nóc'],
      'Quận Cái Răng': ['Phường Ba Láng', 'Phường Hưng Phú', 'Phường Hưng Thạnh', 'Phường Lê Bình', 'Phường Phú Thứ', 'Phường Tân Phú', 'Phường Yên Đỗ'],
      'TP. Nha Trang': ['Phường Lộc Thọ', 'Phường Phước Hải', 'Phường Phước Hòa', 'Phường Phước Tân', 'Phường Phước Tiến', 'Phường Phương Sài', 'Phường Phương Sơn', 'Phường Tân Lập', 'Phường Vạn Thắng', 'Phường Vạn Thạnh', 'Phường Vĩnh Hải', 'Phường Vĩnh Hòa', 'Phường Vĩnh Phước', 'Phường Vĩnh Thọ', 'Phường Vĩnh Nguyên', 'Phường Vĩnh Trường', 'Xã Phước Đồng', 'Xã Vĩnh Ngọc', 'Xã Vĩnh Thạnh'],
      'TP. Thủ Dầu Một': ['Phường Chánh Mỹ', 'Phường Chánh Nghĩa', 'Phường Định Hòa', 'Phường Hiệp An', 'Phường Hiệp Thành', 'Phường Hòa Phú', 'Phường Phú Cường', 'Phường Phú Hòa', 'Phường Phú Lợi', 'Phường Phú Mỹ', 'Phường Phú Tân', 'Phường Phú Thọ', 'Phường Tân An', 'Phường Tương Bình Hiệp'],
      'TP. Biên Hòa': ['Phường An Bình', 'Phường An Hòa', 'Phường Bửu Long', 'Phường Hiệp Hòa', 'Phường Hố Nai', 'Phường Long Bình', 'Phường Quang Vinh', 'Phường Quyết Thắng', 'Phường Tam Hiệp', 'Phường Tam Hòa', 'Phường Tân Biên', 'Phường Tân Hiệp', 'Phường Tân Mai', 'Phường Tân Phong', 'Phường Tân Tiến', 'Phường Thống Nhất', 'Phường Trảng Dài', 'Phường Trung Dũng'],
      'TP. Hạ Long': ['Phường Bạch Đằng', 'Phường Bãi Cháy', 'Phường Cao Thắng', 'Phường Cao Xanh', 'Phường Giếng Đáy', 'Phường Hà Khánh', 'Phường Hà Khẩu', 'Phường Hà Lầm', 'Phường Hà Phong', 'Phường Hồng Gai', 'Phường Hồng Hà', 'Phường Hồng Hải', 'Phường Hùng Thắng', 'Phường Tuần Châu', 'Phường Việt Hưng', 'Phường Yết Kiêu'],
      'TP. Huế': ['Phường An Cựu', 'Phường An Đông', 'Phường An Hòa', 'Phường Đông Ba', 'Phường Gia Hội', 'Phường Kim Long', 'Phường Phú Hậu', 'Phường Phú Hội', 'Phường Phú Nhuận', 'Phường Phước Vĩnh', 'Phường Thuận Hòa', 'Phường Thuận Lộc', 'Phường Thủy Biều', 'Phường Thủy Xuân', 'Phường Vĩnh Ninh', 'Phường Vỹ Dạ', 'Phường Xuân Phú'],
      'TP. Đà Lạt': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Xã Tà Nung', 'Xã Trạm Hành', 'Xã Xuân Thọ', 'Xã Xuân Trường'],
      'TP. Vũng Tàu': ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường Thắng Nhất', 'Phường Thắng Nhì', 'Phường Thắng Tam', 'Phường Nguyễn An Ninh', 'Phường Rạch Dừa'],
      'TP. Bắc Ninh': ['Phường Đại Phúc', 'Phường Đáp Cầu', 'Phường Hạp Lĩnh', 'Phường Khắc Niệm', 'Phường Kinh Bắc', 'Phường Ninh Xá', 'Phường Suối Hoa', 'Phường Tiền An', 'Phường Thị Cầu', 'Phường Vệ An', 'Phường Võ Cường', 'Phường Vũ Ninh'],
      'TP. Hải Dương': ['Phường Bình Hàn', 'Phường Cẩm Thượng', 'Phường Hải Tân', 'Phường Lê Thanh Nghị', 'Phường Ngọc Châu', 'Phường Nguyễn Trãi', 'Phường Quang Trung', 'Phường Tân Bình', 'Phường Thanh Bình', 'Phường Trần Hưng Đạo', 'Phường Trần Phú', 'Phường Tứ Minh', 'Phường Việt Hòa']
    }
  };

  function getDistricts(cityName) {
    if (!cityName || cityName === 'Khác') return ['Khác'];
    const list = VIETNAM_LOCATIONS.districts[cityName];
    if (list && list.length) return [...list, 'Khác'];
    return ['Thành phố trung tâm', 'Thị xã', 'Huyện trung tâm', 'Khác'];
  }

  function getWards(cityName, districtName) {
    if (!districtName || districtName === 'Khác') return ['Khác'];
    const normalizedKey = districtName.replace(/^(Quận|Huyện|Thị xã|TP\.)\s+/i, '').trim();
    const list = VIETNAM_LOCATIONS.wards[districtName]
      || VIETNAM_LOCATIONS.wards[normalizedKey]
      || VIETNAM_LOCATIONS.wards['Quận ' + normalizedKey]
      || VIETNAM_LOCATIONS.wards['Huyện ' + normalizedKey]
      || VIETNAM_LOCATIONS.wards['TP. ' + normalizedKey];
    if (list && list.length) return [...list, 'Khác'];
    if (districtName.startsWith('Huyện')) {
      return ['Thị trấn Trung tâm', 'Xã Trung tâm', 'Xã 1', 'Xã 2', 'Khác'];
    }
    return ['Phường 1', 'Phường 2', 'Phường 3', 'Phường Trung tâm', 'Xã Trung tâm', 'Khác'];
  }

  function pageBookingLocation() {
    const s = service();
    const servicePrice = s.price || 650000;
    const travelFee = Number(state.settings.travelFee || 50000);
    const totalIllustrated = servicePrice + travelFee;
    const chevronSvg = `<svg class="mockup-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    const carSvg = `<svg class="mockup-car-icon" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 10.5 L6.8 5 A2 2 0 0 1 8.7 3.8 h6.6 a2 2 0 0 1 1.9 1.2 l2.3 5.5"></path><rect x="3" y="10" width="18" height="7" rx="1.5"></rect><circle cx="6.8" cy="13.5" r="1.1" fill="currentColor" stroke="none"></circle><circle cx="17.2" cy="13.5" r="1.1" fill="currentColor" stroke="none"></circle><path d="M5.5 17 v2.2" stroke-width="2.2"></path><path d="M18.5 17 v2.2" stroke-width="2.2"></path></svg>`;

    const curCity = state.booking.city || 'Hà Nội';
    const cities = [...VIETNAM_LOCATIONS.provinces, 'Khác'];
    if (state.booking.city && !cities.includes(state.booking.city)) {
      cities.unshift(state.booking.city);
    }

    const districts = getDistricts(curCity);
    let curDistrict = state.booking.district;
    if (!curDistrict || (!districts.includes(curDistrict) && curDistrict !== 'Khác')) {
      curDistrict = districts[0] !== 'Khác' ? districts[0] : '';
      state.booking.district = curDistrict;
    }

    const wards = getWards(curCity, curDistrict);
    let curWard = state.booking.ward;
    if (!curWard || (!wards.includes(curWard) && curWard !== 'Khác')) {
      curWard = wards[0] !== 'Khác' ? wards[0] : '';
      state.booking.ward = curWard;
    }

    const ggMapPinSvg = `<svg class="mockup-map-pin" viewBox="0 0 24 24" width="15" height="15" fill="#111" style="vertical-align:-2.5px;margin-right:6px;display:inline-block;flex-shrink:0;" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>`;
    const ggMapPinSmallSvg = `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" style="vertical-align:-1.5px;margin-right:4px;display:inline-block;" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>`;

    const body = `
    <h1 class="ct-title">Địa điểm trang điểm</h1>
    <p class="ct-subtitle">Vui lòng cung cấp địa chỉ để Hoàn có thể di chuyển đến bạn.</p>
    <div class="mockup-container">
      <form class="ct-form" data-form="location">
        <div class="mockup-option-card ${state.booking.detectedAddress ? 'is-detected' : ''}" data-action="detect-location" role="button" tabindex="0" title="Nhấp để tự động xác định vị trí của bạn">
          <div class="mockup-radio-indicator">
            <div class="mockup-radio-dot"></div>
          </div>
          <div class="mockup-option-text">
            <div class="mockup-option-title">
              <span>Vị trí của bạn</span>
              ${state.booking.isDetectingLocation 
                ? '<span class="mockup-gps-tag loading">⏳ ĐANG XÁC ĐỊNH...</span>' 
                : (state.booking.detectedAddress ? `<span class="mockup-gps-tag detected">${ggMapPinSmallSvg} ĐÃ XÁC ĐỊNH</span>` : `<span class="mockup-gps-tag">${ggMapPinSmallSvg} ĐỊNH VỊ</span>`)}
            </div>
            <div class="mockup-option-desc">
              ${state.booking.isDetectingLocation
                ? '<span style="color:#6b7280;font-weight:500;">Đang xác định tọa độ GPS và địa chỉ của bạn, vui lòng đợi trong giây lát...</span>'
                : (state.booking.detectedAddress 
                    ? `<span style="color:#111;font-weight:600;display:inline-flex;align-items:center;">${ggMapPinSvg}<span>${esc(state.booking.detectedAddress)}</span></span> <span style="font-size:12px;color:#7A1832;text-decoration:underline;margin-left:6px;cursor:pointer;">(Cập nhật lại)</span>`
                    : 'Nhấn vào đây để tự động xác định vị trí của bạn và điền vào bảng thông tin bên dưới.')}
            </div>
          </div>
        </div>

        <div class="mockup-grid-2">
          <label class="mockup-field">
            <span class="mockup-label">Số nhà, tên đường <span class="mockup-req">*</span></span>
            <input class="mockup-input" type="text" name="address" placeholder="Nhập số nhà, tên đường..." value="${esc(state.booking.address || '')}" required>
          </label>

          <label class="mockup-field">
            <span class="mockup-label">Tỉnh / thành phố <span class="mockup-req">*</span></span>
            <div class="mockup-select-wrapper">
              <select class="mockup-select" name="city" required>
                <option value="" disabled ${!state.booking.city ? 'selected' : ''}>Chọn tỉnh / thành phố</option>
                ${cities.map(c => `<option value="${c}" ${(state.booking.city || 'Hà Nội') === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
              ${chevronSvg}
            </div>
          </label>
        </div>

        <div class="mockup-grid-2">
          <label class="mockup-field">
            <span class="mockup-label">Quận / huyện <span class="mockup-req">*</span></span>
            <div class="mockup-select-wrapper">
              <select class="mockup-select" name="district" required>
                <option value="" disabled ${!state.booking.district ? 'selected' : ''}>Chọn quận / huyện</option>
                ${districts.map(d => `<option value="${d}" ${state.booking.district === d ? 'selected' : ''}>${d}</option>`).join('')}
              </select>
              ${chevronSvg}
            </div>
          </label>

          <label class="mockup-field">
            <span class="mockup-label">Phường / xã</span>
            <div class="mockup-select-wrapper">
              <select class="mockup-select" name="ward">
                <option value="" ${!state.booking.ward ? 'selected' : ''}>Chọn phường / xã</option>
                ${wards.map(w => `<option value="${w}" ${state.booking.ward === w ? 'selected' : ''}>${w}</option>`).join('')}
              </select>
              ${chevronSvg}
            </div>
          </label>
        </div>

        <label class="mockup-field full">
          <span class="mockup-label">Tòa nhà, tầng, hướng dẫn di chuyển</span>
          <input class="mockup-input" type="text" name="locationNote" placeholder="Ví dụ: tên tòa nhà, số tầng, màu cửa, điểm nhận biết..." value="${esc(state.booking.locationNote || '')}">
        </label>

        <label class="mockup-check-box">
          <input type="checkbox" name="saveLocation" ${state.booking.saveLocation ? 'checked' : ''}>
          <div>
            <div class="mockup-check-label">Lưu địa chỉ cho lần sau (tùy chọn)</div>
            <div class="mockup-check-sub">Thông tin sẽ được lưu an toàn trong tài khoản của bạn.</div>
          </div>
        </label>

        <div class="mockup-summary-box">
          <div class="mockup-summary-left">
            ${carSvg}
            <div class="mockup-summary-left-text">
              <div class="mockup-summary-title">Phí di chuyển</div>
              <div class="mockup-summary-desc">Được tính theo khu vực trước khi đặt cọc.</div>
            </div>
          </div>
          <div class="mockup-summary-divider"></div>
          <div class="mockup-summary-right">
            <div class="mockup-right-tag">Chi phí minh họa theo bản cũ</div>
            <div class="mockup-price-line">
              <span>Dịch vụ trang điểm</span>
              <span>${money(servicePrice)}</span>
            </div>
            <div class="mockup-price-line">
              <span>Phí di chuyển (ví dụ)</span>
              <span>${money(travelFee)}</span>
            </div>
            <div class="mockup-summary-sep"></div>
            <div class="mockup-total-line">
              <span>Tổng cộng (minh họa)</span>
              <span>${money(totalIllustrated)}</span>
            </div>
          </div>
        </div>
      </form>
    </div>`;

    return bookingShell(3, body, '/booking/info', 'TIẾP TỤC · THÔNG TIN');
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
                ${['Tự nhiên · Trong trẻo', 'Thanh lịch · Cuốn hút', 'Hiện đại · Cá tính', 'Cô dâu lộng lẫy', 'Theo ảnh tham khảo'].map(s => `<option value="${s}" ${state.booking.style === s ? 'selected' : ''}>${s}</option>`).join('')}
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
    return `<div class="ct-money-row"><span>Giá dịch vụ</span><strong>${money(total-Number(travel||0))}</strong></div><div class="ct-money-row"><span>Phí di chuyển</span><strong>${money(Number(travel||0))}</strong></div><div class="ct-money-row"><span>Tổng chi phí</span><strong>${money(total)}</strong></div><div class="ct-money-row ct-emphasis"><span>Cọc cần thanh toán</span><strong>${money(deposit)}</strong></div><div class="ct-money-row"><span>Cọc đã nhận</span><strong>${money(received)}</strong></div><div class="ct-money-row"><span>${received?'Còn phải thanh toán':'Còn lại sau khi nhận đủ cọc'}</span><strong>${money(Math.max(0,total-(received||deposit)))}</strong></div>`;
  }
  function paymentQR() {
    const url = state.settings.paymentQrUrl || '';
    if (!/^\/api\/uploads\?key=references(?:%2F|\/)[a-zA-Z0-9.-]+$/.test(url)) return '';
    return `<figure class="ct-payment-qr"><img src="${esc(url)}" alt="Mã QR nhận tiền của Hoàn"><figcaption>Mã QR nhận tiền · HOÀN</figcaption><a class="link" href="${esc(url)}" target="_blank" rel="noopener">Mở ảnh QR</a></figure>`;
  }
  function bankReady() { return !!(state.settings.bankName&&state.settings.bankAccount&&state.settings.bankOwner); }
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
    const s = service();
    const servicePrice = s.price > 0 ? s.price : (s.id === 'bridal' ? 850000 : 650000);
    const travelFee = Number(state.booking.travelFee || (state.booking.locationType === 'client' ? 50000 : 0));
    const total = servicePrice + travelFee;
    const deposit = Math.min(Number(state.settings.deposit || 200000), currentTotal());
    state.booking.deposit = deposit;
    const code = state.booking.code || (state.appointments[0]?.code) || ('LK' + Math.floor(1000 + Math.random() * 9000));
    state.booking.code = code;
    const apt = getAppointment(code) || state.appointments.find(x => x.code === code);
    const isPaid = apt
      ? (apt.paymentStatus === 'received' || apt.status === 'confirmed')
      : (!!state.booking.depositPaid || state.booking.depositStatus === 'received');
    const isPending = !isPaid && (
      (apt && apt.paymentStatus === 'pending_verification') ||
      !!state.booking.depositReported ||
      state.booking.depositStatus === 'pending_verification'
    );
    const paid = isPaid ? deposit : (apt?.deposit || 0);
    const remaining = Math.max(0, total - paid);
    const receiptData = state.booking.receiptData || '';
    const receiptName = state.booking.receiptName || '';

    const bankName = state.settings.bankName || '';
    const bankOwner = state.settings.bankOwner || '';
    const bankAccount = state.settings.bankAccount || '';
    const customQr = state.settings.paymentQrUrl && /^\/api\/uploads\?key=references(?:%2F|\/)[a-zA-Z0-9.-]+$/.test(state.settings.paymentQrUrl) ? state.settings.paymentQrUrl : '';
    const vietQrUrl = bankAccount ? `https://img.vietqr.io/image/MB-${bankAccount}-compact2.png?amount=${deposit}&addInfo=HOAN%20${code}&accountName=${encodeURIComponent(bankOwner)}` : '';
    const qrUrl = customQr || vietQrUrl;
    const canPay = !!(bankAccount || customQr);

    const body = `
      <div class="ct-deposit-page">
        <!-- Top header row -->
        <div class="ct-deposit-top-bar">
          <div class="ct-deposit-header-left">
            <div class="ct-deposit-overline">05 / ĐẶT CỌC — THIẾT KẾ ĐỀ XUẤT</div>
            <h1 class="ct-deposit-title">Đặt cọc giữ lịch</h1>
            <p class="ct-deposit-subtitle">Kiểm tra chi phí trước khi chuyển khoản.</p>
          </div>
          
          <div class="ct-deposit-timer-badge">
            <div class="timer-top">
              <svg class="timer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span class="timer-label">Giữ chỗ:</span>
              <span class="timer-countdown" id="deposit-timer">15:00</span>
            </div>
            <div class="timer-sub">Thời gian minh họa; căn cơ chế giữ chỗ thực tế.</div>
          </div>
        </div>

        <!-- Mobile Deposit Amount Banner -->
        <div class="ct-deposit-mobile-banner">
          <div class="mb-label">Cọc cần thanh toán</div>
          <div class="mb-amount">${money(deposit)}</div>
          <div class="mb-sub">Cọc minh họa</div>
        </div>

        <!-- Main 2-Column Grid -->
        <div class="ct-deposit-grid">
          <!-- Left Column: Payment Details Card -->
          <div class="ct-deposit-payment-card">
            <!-- Tabs -->
            <div class="ct-deposit-tabs">
              <button type="button" class="deposit-tab active">Chuyển khoản / VietQR</button>
              <button type="button" class="deposit-tab disabled" data-action="ct-tab-momo" title="Cổng thanh toán MoMo">MoMo · Chưa kết nối</button>
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
              <div class="bank-note">Thông tin nhận tiền sẽ do Hoàn thiết lập.</div>
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

            <!-- Receipt Upload Box -->
            <div class="ct-deposit-field-group">
              <label class="deposit-field-label">Đính kèm ảnh chuyển khoản (không bắt buộc)</label>
              <div class="deposit-upload-dropzone" data-action="ct-trigger-receipt">
                <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <div class="upload-prompt">${receiptData ? '✓ ' + esc(receiptName || 'Đã tải ảnh') : 'Chọn ảnh hoặc kéo thả vào đây'}</div>
                <div class="upload-hint">JPG, PNG (tối đa 5MB)</div>
                <input type="file" id="deposit-receipt-file" accept="image/*" style="display:none;">
              </div>
              ${receiptData ? `
                <div class="receipt-attached-card">
                  <img src="${receiptData}" class="receipt-thumb" alt="Bill đính kèm">
                  <div class="receipt-info">
                    <span class="receipt-name">✓ ${esc(receiptName || 'bill-chuyen-khoan.jpg')}</span>
                    <span class="receipt-status">Đã tải ảnh bill chuyển khoản thành công</span>
                  </div>
                  <button type="button" class="btn-remove-receipt" data-action="ct-remove-receipt" title="Gỡ ảnh">×</button>
                </div>
              ` : ''}
              <div class="deposit-field-sub">Ảnh chuyển khoản giúp kiểm tra, không thay thế xác nhận giao dịch.</div>
            </div>

            <!-- Action Buttons: report transfer or proceed -->
            <div class="ct-deposit-actions">
              ${isPaid ? `
                <button type="button" class="btn-deposit-paid btn-deposit-confirmed" data-action="ct-deposit-confirmed-proceed">TIẾP TỤC XÁC NHẬN LỊCH →</button>
              ` : isPending ? `
                <button type="button" class="btn-deposit-paid btn-deposit-pending" data-action="ct-deposit-confirmed-proceed">ĐANG CHỜ ĐỐI SOÁT · TIẾP TỤC →</button>
              ` : `
                <button type="button" class="btn-deposit-paid" data-action="ct-report-transfer">TÔI ĐÃ CHUYỂN KHOẢN</button>
              `}
              <a href="#/contact" class="btn-deposit-contact">Liên hệ Hoàn</a>
            </div>
            <div class="deposit-actions-sub ${isPaid ? 'deposit-confirmed-note' : ''}">
              ${isPaid 
                ? '✓ Quản trị viên đã xác nhận nhận cọc — nhấn để hoàn tất lịch hẹn.' 
                : isPending
                ? 'Đã ghi nhận thông báo chuyển khoản — đang chờ đối soát.'
                : 'Vui lòng quét mã QR hoặc chuyển khoản, sau đó nhấn "Tôi đã chuyển khoản".'}
            </div>
          </div>

          <!-- Right Column: Invoice & Breakdown -->
          <div class="ct-deposit-summary-card">
            <div class="summary-card-header">
              <h2>Chi tiết thanh toán</h2>
              <span class="summary-sub">Số tiền minh họa theo bản cũ.</span>
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
                <span>Còn lại sau khi nhận cọc</span>
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

            <!-- Footnote with Info Icon -->
            <div class="ct-deposit-footer-info">
              <div class="info-row">
                <span class="info-icon">ⓘ</span>
                <span>Hết thời gian giữ chỗ: kiểm tra lại lịch trước khi thanh toán.</span>
              </div>
              <div class="info-row sub-indent">
                <span>Đã chuyển nhưng hết hạn: liên hệ Hoàn để đối soát.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    return bookingShell(5, body, null, '', '', true);
  }

  function pageBookingConfirm() {

    const b = state.booking;
    const apt = getAppointment(b.code) || state.appointments.find(x => x.code === b.code);
    const isPaid = apt
      ? (apt.paymentStatus === 'received' || apt.status === 'confirmed')
      : (!!b.depositPaid || b.depositStatus === 'received');
    const isPending = !isPaid && (
      (apt && apt.paymentStatus === 'pending_verification') ||
      !!b.depositReported ||
      b.depositStatus === 'pending_verification'
    );
    return bookingShell(6, `<h1 class="ct-title">Kiểm tra lịch hẹn</h1><section class="ct-two-col"><article><h2>Thông tin buổi hẹn</h2>${[['Dịch vụ',service().name,'service'],['Ngày giờ',dateLabel()+' · '+b.time,'time'],['Địa điểm',[b.address,b.ward,b.district,b.city].filter(Boolean).join(', '),'location'],['Phong cách',b.style,'info'],['Tình trạng da',b.skin,'info'],['Dị ứng',[b.allergy,b.allergyNote].filter(Boolean).join(' · '),'info'],['Khách hàng',b.name+' · '+b.phone,'info'],['Lời nhắn',b.note||'Không có','info']].map(([t,v,p])=>`<div class="ct-review-row"><span>${t}</span><b>${esc(v)}</b><a href="#/booking/${p}">Chỉnh sửa</a></div>`).join('')}<div class="ct-upload-previews">${(b.references||[]).map(r=>`<img src="${r}" alt="Ảnh phong cách đã chọn">`).join('')}</div></article><aside class="ct-summary"><h2>Yêu cầu đặt lịch</h2>${statusTrack(isPaid, isPending)}${paymentRows(currentTotal(),b.deposit,isPaid?b.deposit:0)}<p>Lịch được tạo ở trạng thái chờ xác nhận. Bạn theo dõi và thanh toán cọc tại trang lịch hẹn.</p><button class="btn btn-dark btn-wide" data-action="complete-booking">GỬI YÊU CẦU ĐẶT LỊCH</button></aside></section>`, null, '');
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
    const needed = Number(meta.depositRequired || Math.min(Number(state.settings.deposit), a.total));
    const isPaid = a.paymentStatus === 'received' || a.deposit >= needed || a.status === 'confirmed';
    const isPending = !isPaid && a.paymentStatus === 'pending_verification';
    return ctPage('lookup', 'Chi tiết lịch hẹn', `<div class="ct-detail-top"><b>${esc(a.code)}</b><span class="ct-status">${statusLabel(a.status)}</span><span class="ct-status">${isPaid ? 'Đã nhận cọc' : isPending ? 'Chờ đối soát' : 'Chưa thanh toán'}</span></div><section class="ct-two-col"><article><h2>Thông tin buổi hẹn</h2>${[['Dịch vụ',s.name],['Ngày',dateLabel(a.date)],['Giờ bắt đầu',a.time],['Địa điểm',[a.address,a.ward,a.district,meta.city].filter(Boolean).join(', ')],['Khách hàng',a.customer],['Điện thoại',a.phone],['Phong cách',a.style],['Ghi chú',a.note]].map(([t,v])=>`<div class="ct-money-row"><span>${t}</span><b>${esc(v||'—')}</b></div>`).join('')}<div class="ct-upload-previews">${(meta.references||[]).map(r=>`<img src="${r}" alt="Ảnh phong cách tham khảo">`).join('')}</div>${meta.skin?`<p>Tình trạng da: ${esc(meta.skin)} · Dị ứng: ${esc(meta.allergy)} ${esc(meta.allergyNote||'')}</p>`:''}<div class="ct-actions">${a.status!=='cancelled'&&a.status!=='completed'?`<a class="btn" href="#/booking/${code}/reschedule">Yêu cầu đổi lịch</a><a class="btn" href="#/booking/${code}/cancel">Yêu cầu hủy / hoàn cọc</a>`:''}<button class="btn" data-action="ct-calendar-download" data-code="${code}">Thêm vào lịch</button></div><h3>Chuẩn bị cho buổi hẹn</h3><p>Giữ da sạch và dưỡng ẩm nhẹ. Chuẩn bị ảnh trang phục, phong cách nếu có.</p><a class="link" href="#/contact">Liên hệ Hoàn ${icon('arrow')}</a>${(state.requests||[]).filter(r=>r.code===code).map(r=>`<div class="ct-notice"><b>${esc(r.subject)}</b><p>${esc(r.status==='resolved'?'Đã xử lý':'Chờ xử lý')}</p>${r.reply?`<p>${esc(r.reply)}</p>`:''}</div>`).join('')}</article><aside class="ct-summary"><h2>Thanh toán</h2>${statusTrack(isPaid, isPending)}${paymentRows(a.total,needed,a.deposit,meta.travelFee??Math.max(0,a.total-s.price))}${a.deposit>0?`<a class="btn btn-dark btn-wide" href="#/booking/${code}/receipt">XEM BIÊN NHẬN</a>`:''}${a.deposit<needed&&a.status!=='cancelled'?paymentInstructions(a):''}<button class="btn btn-wide" data-action="ct-refresh">KIỂM TRA TRẠNG THÁI</button></aside></section>`, 'Tra cứu lịch / ' + code);
  }
  function paymentInstructions(a) {
    if(!bankReady()&&!paymentQR())return `<div class="ct-notice">Hoàn sẽ cung cấp thông tin nhận tiền khi liên hệ với bạn.</div><a class="btn btn-wide" href="#/contact">LIÊN HỆ HOÀN</a>`;
    return `${paymentQR()}<h3>Thông tin chuyển khoản</h3>${[['Ngân hàng',state.settings.bankName],['Chủ tài khoản',state.settings.bankOwner],['Số tài khoản',state.settings.bankAccount],['Nội dung','HOAN '+a.code]].map(([t,v])=>`<div class="ct-money-row"><span>${t}</span><strong>${esc(v)}</strong><button class="icon-btn" aria-label="Sao chép ${t}" data-action="ct-copy" data-value="${esc(v)}">${icon('content')}</button></div>`).join('')}<p class="muted">Chuyển đúng nội dung. Chỉ thông báo sau khi bạn đã thực hiện giao dịch.</p><button class="btn btn-dark btn-wide" data-action="ct-payment-report" data-code="${a.code}" ${a.paymentStatus==='pending_verification'?'disabled':''}>${a.paymentStatus==='pending_verification'?'ĐANG CHỜ ĐỐI SOÁT':'TÔI ĐÃ CHUYỂN KHOẢN'}</button>`;
  }
  function pageReceipt(code) {
    const a=getAppointment(code);if(!a)return missingBooking();if(!a.deposit)return ctPage('lookup','Chưa có biên nhận',`<p class="ct-subtitle">Khoản cọc chưa được xác minh.</p><a class="btn" href="#/booking/${code}">QUAY LẠI LỊCH HẸN</a>`);
    return ctPage('lookup','Biên nhận đặt cọc',`<article class="ct-receipt">${brandMarkup()}<p class="ct-status">ĐÃ NHẬN CỌC</p><h2>${esc(a.code)}</h2>${[['Khách hàng',a.customer],['Dịch vụ',service(a.serviceId).name],['Ngày giờ',dateLabel(a.date)+' · '+a.time]].map(([t,v])=>`<div class="ct-money-row"><span>${t}</span><b>${esc(v)}</b></div>`).join('')}<div class="ct-money-row"><span>Tổng chi phí</span><b>${money(a.total)}</b></div><div class="ct-money-row ct-emphasis"><span>Khoản cọc đã nhận</span><b>${money(a.deposit)}</b></div><div class="ct-money-row"><span>Còn phải thanh toán</span><b>${money(Math.max(0,a.total-a.deposit))}</b></div><p>Khoản cọc được trừ vào tổng chi phí của buổi hẹn.</p></article><div class="ct-center-cta"><button class="btn btn-dark" data-action="print">IN / LƯU PDF</button><a class="btn" href="#/booking/${code}">TRỞ VỀ LỊCH HẸN</a></div>`,'Lịch hẹn / Biên nhận');
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
    ['services','tag','Dịch vụ'],['customers','user','Khách hàng'],['payments','card','Tiền cọc'],['promotions','ticket','Mã ưu đãi'],
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
    const headHtml = active === 'schedule' ? '' : `<header class="admin-head"><div>${active==='overview'?'<div class="admin-kicker">TRUNG TÂM VẬN HÀNH</div>':''}<h1>${title}</h1><p>${subtitle}</p></div><div class="admin-head-actions">${actions}</div></header>`;
    return `<div class="admin-page"><header class="admin-top"><a class="admin-brand" href="#/admin">HOÀN <small>QUẢN TRỊ VẬN HÀNH</small></a><label class="admin-search-wrap">${icon('search')}<input class="admin-search" id="admin-global-search" placeholder="Tìm lịch hẹn, khách hàng hoặc giao dịch..."></label><div class="admin-user"><a class="admin-view-site-btn" href="#/" target="_blank" title="Xem website khách đặt lịch"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg><span>Xem website</span></a><button class="admin-notification" aria-label="Thông báo" data-action="goto-notifications" title="3 thông báo mới">${icon('bell')}<b>3</b></button><span class="system-label"><i class="status-dot"></i> Hệ thống ổn định</span><span class="admin-profile" data-action="goto-profile" title="Hoàn Nguyễn - Quản trị viên"><i>HN</i><span>Hoàn Nguyễn<small>Quản trị viên</small></span></span></div></header><div class="admin-layout"><aside class="admin-sidebar">${groups.map(g=>`<div class="admin-group-title">${g[0]}</div>${g[1].map(key=>{const l=adminLinks.find(x=>x[0]===key);return `<a class="admin-link ${active===key?'active':''}" href="#/admin/${key==='overview'?'':key}">${icon(l[1],l[2])}<span>${l[2]}</span></a>`}).join('')}`).join('')}</aside><main id="main" class="admin-content" data-admin-page="${active}">${headHtml}${body}</main></div></div>`;
  }

  function adminOverview() {
    const appts = state.appointments;
    const today = localIso(new Date());
    const currentMonth = today.slice(0,7);
    const todayRows = appts.filter(a=>a.date===today && a.status!=='cancelled');
    const pending = appts.filter(a=>a.status==='pending').length;
    const paymentPending = appts.filter(a=>a.paymentStatus==='pending_verification').length;
    const deposits = appts.reduce((n,a)=>n+Number(a.deposit||0),0);
    const revenue = appts.filter(a=>a.date.startsWith(currentMonth)&&a.status!=='cancelled').reduce((n,a)=>n+Number(a.total||0),0);
    const body = `${state.backendError?`<div class="data-alert">Không thể tải dữ liệu: ${state.backendError}</div>`:''}<section class="stat-grid"><div class="stat-card"><small>Lịch hôm nay</small><strong class="numeric">${String(todayRows.length).padStart(2,'0')}</strong><span>Dữ liệu cập nhật trực tiếp</span></div><div class="stat-card"><small>Chờ xác nhận</small><strong class="numeric">${String(pending).padStart(2,'0')}</strong><span>${pending?'Cần kiểm tra lịch mới':'Không có lịch chờ'}</span></div><div class="stat-card"><small>Tiền cọc đã nhận</small><strong class="numeric">${money(deposits)}</strong><span>${paymentPending} giao dịch chờ đối soát</span></div><div class="stat-card"><small>Doanh thu tháng</small><strong class="numeric">${money(revenue)}</strong><span>Không gồm lịch đã hủy</span></div></section><section class="admin-grid"><div class="admin-section"><div class="section-head"><h2>Dòng lịch hôm nay</h2><a class="link wine" href="#/admin/appointments">Xem toàn bộ lịch hẹn →</a></div>${appointmentsTable(todayRows)}</div><aside class="admin-section"><h2>Cần xử lý</h2><div class="task-item"><span class="task-num numeric">${String(pending).padStart(2,'0')}</span><div><b>Lịch chờ xác nhận</b><small class="muted">Cập nhật theo dữ liệu thật</small></div>→</div><div class="task-item"><span class="task-num numeric">${String(paymentPending).padStart(2,'0')}</span><div><b>Giao dịch cần đối soát</b><small class="muted">Chưa ghi nhận tiền cọc</small></div>→</div><div class="task-item"><span class="task-num numeric">00</span><div><b>Yêu cầu đổi lịch</b><small class="muted">Không có yêu cầu mới</small></div>→</div></aside></section><section class="admin-grid rule"><div class="admin-section"><h2>Doanh thu 7 ngày</h2>${lineChart()}</div><div class="admin-section"><h2>Hiệu suất dịch vụ</h2>${barChart()}</div></section>`;
    return adminShell('overview',body,'Tổng quan hôm nay',formatLongDate(new Date()),`<button class="btn" data-action="export-report">${icon('download')} Xuất báo cáo</button><button class="btn btn-dark" data-action="new-appointment">${icon('plus')} Tạo lịch hẹn</button>`);
  }

  function appointmentsTable(rows) {
    return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Giờ</th><th>Khách hàng</th><th>Dịch vụ</th><th>Khu vực</th><th>Thanh toán</th><th>Trạng thái</th><th style="min-width:320px;">Thao tác</th></tr></thead><tbody>${rows.length?rows.map(a=>{
      const isConf = (a.status === 'confirmed' || a.paymentStatus === 'received');
      return `<tr class="clickable-row" data-action="admin-view-appointment" data-code="${a.code}" title="Nhấp vào dòng để xem chi tiết lịch hẹn"><td class="numeric"><b>${a.time}</b></td><td><b class="row-hover-link">${esc(a.customer)}</b><br><small class="numeric" style="color:#6b7280;">${a.phone}</small></td><td>${service(a.serviceId).name}</td><td>${a.district||'—'}</td><td class="numeric">${a.deposit>0?'Đã cọc '+money(a.deposit):'Chờ đối soát'}</td><td><span class="badge ${a.status==='confirmed'?'success':a.status==='pending'?'warning':''}">${statusLabel(a.status)}</span></td><td><div class="table-actions"><button class="action-btn action-btn-view" data-action="admin-view-appointment" data-code="${a.code}" title="Xem chi tiết lịch hẹn">${icon('eye')}<span>Xem</span></button><button class="action-btn action-btn-edit" data-action="admin-edit-appointment" data-code="${a.code}" title="Chỉnh sửa thông tin lịch hẹn">${icon('edit')}<span>Sửa</span></button><button class="action-btn action-btn-delete" data-action="admin-delete-appointment" data-code="${a.code}" title="Xóa lịch hẹn khỏi hệ thống">${icon('trash')}<span>Xóa</span></button><button class="action-btn action-btn-status" data-action="admin-status" data-code="${a.code}" title="Đổi trạng thái lịch">${icon('clock')}<span>Trạng thái</span></button>${!isConf?`<button class="action-btn action-btn-deposit" data-action="admin-confirm-deposit" data-code="${a.code}" title="Quản trị duyệt cọc">${icon('check')}<span>Duyệt cọc</span></button>`:`<button class="action-btn action-btn-reset" data-action="admin-reset-deposit" data-code="${a.code}" title="Trả về chờ đối soát"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg><span>Hoàn cọc</span></button>`}</div></td></tr>`;
    }).join(''):'<tr><td colspan="7"><div class="empty-table">Chưa có lịch hẹn. Lịch khách đặt sẽ xuất hiện tại đây.</div></td></tr>'}</tbody></table></div>`;
  }

  function lineChart() {
    const days = Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return localIso(d)});
    const values = days.map(day=>state.appointments.filter(a=>a.date===day&&a.status!=='cancelled').reduce((n,a)=>n+Number(a.total||0),0));
    const max = Math.max(...values,1);
    const points = values.map((v,i)=>[i*95,150-(v/max)*112]);
    return `<div class="chart"><div class="chart-line"><svg viewBox="0 0 600 180" role="img" aria-label="Doanh thu thực tế trong bảy ngày"><polyline fill="none" stroke="#7a1832" stroke-width="3" points="${points.map(p=>p.join(',')).join(' ')}"></polyline>${points.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#7a1832"></circle>`).join('')}</svg></div></div>`;
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

    const mockNames = [
      'Nguyễn Minh Anh', 'Trần Ngọc Hà', 'Lê Thu Trang', 'Phạm Mai Linh', 'Hà Vy',
      'Đỗ Quỳnh Chi', 'Bùi Thảo Nguyên', 'Nguyễn Thùy Dung', 'Vũ Hoàng Yến',
      'Cầu Giấy', 'Tây Hồ', 'Nam Từ Liêm', 'Đặng Thu Trang', 'Đinh Mai Anh',
      'Hoàng Phương Linh', 'Thanh Xuân', 'Mai Anh', 'Lưu Gia Hân', 'Phương Thảo',
      'Hải Yến', 'Kim Ngân', 'Thu Phương', 'Ngọc Anh', 'Khánh Linh', 'Ngọc Diệp',
      'Hương Giang', 'Bảo Trâm', 'Quỳnh Anh'
    ];

    // Purge only legacy mock/seed appointments
    const staleCodes = ['HMA-090926-BQ0', 'HMA-090926-MQ3', 'HMA-100926-MS7', 'HMA-090926-BIQ', 'HMA-180926-6W2'];
    state.appointments = (state.appointments || []).filter(a =>
      !mockNames.includes(a.customer) &&
      !staleCodes.includes(a.code)
    );
    // Purge mock schedule slots
    state.scheduleSlots = (state.scheduleSlots || []).filter(s =>
      s.note !== 'Di chuyển' && s.note !== 'Nghỉ giữa lịch' && s.note !== 'Không khả dụng' && s.note
    );
    // Purge mock customers
    state.customers = (state.customers || []).filter(c => !mockNames.includes(c.name));
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
        <div class="field">
          <label>Trạng thái thanh toán</label>
          <select id="modal-edit-payment">
            <option value="received" ${a.paymentStatus === 'received' ? 'selected' : ''}>Đã nhận cọc</option>
            <option value="pending_verification" ${a.paymentStatus === 'pending_verification' ? 'selected' : ''}>Chờ đối soát</option>
            <option value="unverified" ${a.paymentStatus === 'unverified' ? 'selected' : ''}>Chưa thanh toán</option>
          </select>
        </div>
        <div class="field">
          <label>Tiền cọc (VNĐ)</label>
          <input id="modal-edit-deposit" type="number" step="10000" value="${a.deposit || 0}">
        </div>
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
    const ALL_HOURS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];
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
    const START_MIN = 420;  // 07:00 in minutes

    // Render day column with continuous timeline events
    const renderDayColumn = (dateObj, dayIdx) => {
      const iso = localIso(dateObj);
      const isOpen = Boolean(dayOpen[dayIdx]);

      // 1. Clickable background slots for each hour
      const bgSlots = ALL_HOURS.map(h => {
        const isOff = !isOpen || h >= '20:00';
        if (isOff) {
          return `<div class="schv2-day-bg-slot schv2-slot-off" data-action="add-slot-at" data-date="${iso}" data-hour="${h}" title="Ngoài giờ làm việc"></div>`;
        }
        return `<div class="schv2-day-bg-slot" data-action="add-slot-at" data-date="${iso}" data-hour="${h}" title="Bấm để thêm khung giờ tại ${h}"></div>`;
      });

      // 2. Events on this day
      const eventCards = [];

      if (isOpen) {
        // Appointments
        const dayApts = state.appointments.filter(a => a.date === iso && a.status !== 'cancelled' && !staleCodes.includes(a.code));
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
        <div class="schv2-day-col ${!isOpen ? 'schv2-off-col' : ''}" data-date="${iso}">
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
    const activeAppts = (state.appointments || []).filter(a => a.status !== 'cancelled');
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
    const body = `<div class="toolbar"><input id="customer-search" placeholder="Tìm tên, số điện thoại, email..."><select><option>Tất cả khách hàng</option><option>Khách quay lại</option><option>Khách mới</option></select></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Khách hàng</th><th>Liên hệ</th><th>Số lần đặt</th><th>Tổng chi tiêu</th><th>Ghi chú</th><th style="min-width:120px;">Thao tác</th></tr></thead><tbody id="customer-body">${state.customers.map((c,i)=>`<tr><td><b>${c.name}</b></td><td>${c.phone}<br><small>${c.email}</small></td><td>${c.visits}</td><td>${money(c.spent)}</td><td>${c.note}</td><td><button class="action-btn action-btn-edit" data-action="edit-customer" data-index="${i}">${icon('edit')}<span>Chỉnh sửa</span></button></td></tr>`).join('')}</tbody></table></div>`;
    return adminShell('customers',body,'Khách hàng','Lịch sử đặt lịch, thông tin liên hệ và ghi chú phục vụ.',`<button class="btn" data-action="export-customers">${icon('download')} Xuất danh sách</button><button class="btn btn-dark" data-action="add-customer">${icon('plus')} Thêm khách hàng</button>`);
  }

  function adminPayments() {
    const rows = state.appointments;
    const received=rows.filter(r=>r.paymentStatus==='received').reduce((n,r)=>n+Number(r.deposit||0),0);
    const pending=rows.filter(r=>r.paymentStatus==='pending_verification').length;
    const refund=rows.filter(r=>r.status==='cancelled'&&r.deposit>0).reduce((n,r)=>n+Number(r.deposit),0);
    const due=rows.filter(r=>r.status!=='cancelled').reduce((n,r)=>n+Math.max(0,Number(r.total)-Number(r.deposit||0)),0);
    const body = `<section class="stat-grid"><div class="stat-card"><small>Đã nhận tháng này</small><strong class="numeric">${money(received)}</strong></div><div class="stat-card"><small>Chờ đối soát</small><strong class="numeric">${String(pending).padStart(2,'0')}</strong></div><div class="stat-card"><small>Cần hoàn</small><strong class="numeric">${money(refund)}</strong></div><div class="stat-card"><small>Còn phải thu</small><strong class="numeric">${money(due)}</strong></div></section><div class="toolbar"><input id="payment-search" placeholder="Tìm mã lịch hoặc khách hàng..."><select><option>Tất cả giao dịch</option><option>Đã nhận</option><option>Chờ đối soát</option><option>Hoàn cọc</option></select></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Mã lịch</th><th>Khách hàng</th><th>Số tiền</th><th>Thời gian tạo</th><th>Trạng thái</th><th style="min-width:140px;">Thao tác</th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td class="numeric">${r.code}</td><td>${r.customer}</td><td><b class="numeric">${money(r.deposit||0)}</b></td><td class="numeric">${r.createdAt||'—'}</td><td><span class="badge ${r.paymentStatus==='received'?'success':'warning'}">${r.paymentStatus==='received'?'Đã nhận':r.paymentStatus==='pending_verification'?'Chờ đối soát':'Chưa thanh toán'}</span></td><td>${r.paymentStatus==='received'?`<button class="action-btn action-btn-view" data-action="payment-receipt" data-code="${r.code}">${icon('card')}<span>Biên nhận</span></button>`:`<button class="action-btn action-btn-deposit" data-action="admin-confirm-deposit" data-code="${r.code}">${icon('check')}<span>Duyệt cọc</span></button>`}</td></tr>`).join(''):'<tr><td colspan="6"><div class="empty-table">Chưa có giao dịch đặt cọc.</div></td></tr>'}</tbody></table></div>`;
    return adminShell('payments',body,'Tiền cọc & thanh toán','Đối soát giao dịch, theo dõi công nợ và xử lý hoàn cọc.',`<button class="btn" data-action="export-payments">${icon('download')} Xuất giao dịch</button><button class="btn btn-dark" data-action="manual-payment">${icon('plus')} Ghi nhận thanh toán</button>`);
  }

  function adminPromotions() {
    const body = `<div class="toolbar"><input id="promo-search" placeholder="Tìm mã ưu đãi..."><select><option>Tất cả trạng thái</option><option>Đang hoạt động</option><option>Đã kết thúc</option></select></div><div class="admin-card-grid">${state.promotions.map((p,i)=>`<article class="admin-card"><div class="section-head"><span class="badge ${p.active?'success':''}">${p.active?'Đang hoạt động':'Đã tắt'}</span><button class="toggle ${p.active?'on':''}" data-action="toggle-promo" data-index="${i}"></button></div><h3 class="wine">${p.code}</h3><p>${p.type} · <b>${p.value}</b></p><div class="summary-row"><span>Đã sử dụng</span><b>${p.used}/${p.limit}</b></div><div class="admin-card-actions"><button class="btn btn-sm" data-action="edit-promo" data-index="${i}">Chỉnh sửa</button><button class="btn btn-sm btn-danger" data-action="delete-promo" data-index="${i}">Xóa</button></div></article>`).join('')}</div>`;
    return adminShell('promotions',body,'Mã ưu đãi','Tạo và kiểm soát chương trình ưu đãi cho khách hàng.',`<button class="btn btn-dark" data-action="add-promo">${icon('plus')} Tạo mã ưu đãi</button>`);
  }

  function adminGallery() {
    const body = `<div class="toolbar"><button class="filter-btn active">Tất cả</button><button class="filter-btn">Tự nhiên</button><button class="filter-btn">Dự tiệc</button><button class="filter-btn">Chụp ảnh</button><button class="filter-btn">Cô dâu</button><label class="btn btn-dark" style="margin-left:auto">+ Tải ảnh lên<input type="file" accept="image/*" multiple hidden data-action="gallery-upload"></label></div><div class="admin-card-grid" id="admin-gallery">${galleryItems.map((g,i)=>`<article class="admin-card"><div style="height:220px;overflow:hidden">${img(g.image,g.title)}</div><h3 style="margin-top:14px">${g.title}</h3><p class="muted">${g.tag} · 0${i+1}</p><div class="admin-card-actions"><button class="btn btn-sm" data-action="edit-gallery" data-index="${i}">Chỉnh sửa</button><button class="btn btn-sm btn-danger" data-action="hide-gallery" data-index="${i}">Ẩn ảnh</button></div></article>`).join('')}</div>`;
    return adminShell('gallery',body,'Bộ sưu tập','Sắp xếp hình ảnh và nội dung hiển thị trên website.',`<a class="btn" href="#/gallery">Xem trên website</a>`);
  }

  function adminContent() {
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
              <img id="preview-img-logo" src="/assets/hoan-logo.png" style="max-height:60px;max-width:100%;object-fit:contain;">
            </div>
            <label style="font-weight:600;font-size:12px;display:block;margin-bottom:4px;">Logo Thương hiệu HOÀN</label>
            <input value="/assets/hoan-logo.png" disabled style="font-size:12px;background:#eee;">
            <small class="muted" style="display:block;margin-top:6px;font-size:11px;">Được cố định chuẩn bộ nhận diện thương hiệu</small>
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

    const isPagesMode = viewMode === 'pages' || curTab === 'pages';

    const modeSwitcher = `
      <div class="content-header-modes">
        <div class="mode-switch-pills">
          <button type="button" class="mode-pill ${isPagesMode ? 'active' : ''}" data-action="switch-content-view" data-view="pages">
            <svg class="ui-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <span>Nội dung từng trang (CMS 42 trang)</span>
          </button>
          <button type="button" class="mode-pill ${!isPagesMode ? 'active' : ''}" data-action="switch-content-view" data-view="general">
            <svg class="ui-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            <span>Cấu hình chung & Thương hiệu</span>
          </button>
        </div>
      </div>
    `;

    const body = `
      ${modeSwitcher}
      ${isPagesMode
        ? (siteTools ? siteTools.cmsWorkspaceHtml() : '<div class="cms-workspace"><p>Đang tải CMS…</p></div>')
        : `
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
      `}
    `;

    return adminShell(
      'content',
      body,
      'Nội dung website',
      'Chỉnh sửa thông tin, hình ảnh và chính sách hiển thị cho khách hàng.',
      `<a class="btn" href="#/" target="_blank">${icon('eye')} Xem trước website</a>
       <button class="btn btn-dark" data-action="publish-content">${icon('check')} Đăng thay đổi</button>`
    );
  }

  function adminNotifications() {
    const sent=state.notifications.filter(n=>n.status==='Đã gửi').length;
    const waiting=state.notifications.filter(n=>n.status!=='Đã gửi').length;
    const body = `<section class="stat-grid"><div class="stat-card"><small>Đã gửi hôm nay</small><strong class="numeric">${String(sent).padStart(2,'0')}</strong></div><div class="stat-card"><small>Chờ gửi</small><strong class="numeric">${String(waiting).padStart(2,'0')}</strong></div><div class="stat-card"><small>Tỷ lệ nhận</small><strong class="numeric">${sent?'100%':'0%'}</strong></div><div class="stat-card"><small>Cần kiểm tra</small><strong class="numeric">00</strong></div></section><div class="toolbar"><select><option>Tất cả kênh</option><option>Zalo</option><option>Email</option></select><select><option>Tất cả trạng thái</option><option>Đã gửi</option><option>Chờ gửi</option></select></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Nội dung</th><th>Kênh</th><th>Người nhận</th><th>Thời gian</th><th>Trạng thái</th><th></th></tr></thead><tbody>${state.notifications.length?state.notifications.map((n,i)=>`<tr><td><b>${n.title}</b></td><td>${n.channel}</td><td>${n.audience}</td><td>${n.sent}</td><td><span class="badge ${n.status==='Đã gửi'?'success':'warning'}">${n.status}</span></td><td><button class="mini-action" data-action="resend-notification" data-index="${i}">Gửi lại</button></td></tr>`).join(''):'<tr><td colspan="6"><div class="empty-table">Chưa có thông báo nào được gửi.</div></td></tr>'}</tbody></table></div>`;
    return adminShell('notifications',body,'Thông báo','Theo dõi nhắc lịch và gửi thông tin đến khách hàng.',`<button class="btn btn-dark" data-action="new-notification">${icon('plus')} Soạn thông báo</button>`);
  }

  function adminReports() {
    const active=state.appointments.filter(a=>a.status!=='cancelled');
    const revenue=active.reduce((n,a)=>n+Number(a.total||0),0);
    const average=active.length?Math.round(revenue/active.length):0;
    const repeat=state.customers.length?Math.round(state.customers.filter(c=>c.visits>1).length/state.customers.length*100):0;
    const districts={};active.forEach(a=>{const key=a.district||'Chưa xác định';districts[key]=(districts[key]||0)+1});
    const body = `<div class="toolbar"><select id="report-range"><option>30 ngày gần nhất</option><option>7 ngày gần nhất</option><option>Quý này</option></select><button class="btn btn-sm" data-action="refresh-report">Cập nhật</button></div><section class="stat-grid"><div class="stat-card"><small>Tổng doanh thu</small><strong class="numeric">${money(revenue)}</strong><span>Dữ liệu lịch không hủy</span></div><div class="stat-card"><small>Số lịch</small><strong class="numeric">${String(active.length).padStart(2,'0')}</strong><span>Lịch thực tế</span></div><div class="stat-card"><small>Giá trị trung bình</small><strong class="numeric">${money(average)}</strong></div><div class="stat-card"><small>Tỷ lệ quay lại</small><strong class="numeric">${repeat}%</strong></div></section><section class="admin-grid"><div class="admin-section"><h2>Doanh thu theo ngày</h2>${lineChart()}</div><div class="admin-section"><h2>Cơ cấu dịch vụ</h2>${barChart()}<h2 style="margin-top:28px">Khu vực phổ biến</h2>${Object.entries(districts).length?Object.entries(districts).sort((a,b)=>b[1]-a[1]).slice(0,4).map(r=>`<div class="summary-row"><span>${r[0]}</span><b class="numeric">${Math.round(r[1]/Math.max(active.length,1)*100)}%</b></div>`).join(''):'<div class="empty-table">Chưa có dữ liệu khu vực.</div>'}</div></section>`;
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
    const input=(name,label,type='text')=>`<div class="field"><label>${label}</label><input name="${name}" type="${type}" value="${esc(s[name]||'')}"></div>`;
    return adminShell('settings',`<form class="manage-card" data-form="settings"><h2>Thiết lập đặt lịch</h2><div class="form-grid">${input('bookingWindow','Số ngày mở lịch','number')}${input('deposit','Mức cọc tiêu chuẩn','number')}${input('travelFee','Phí di chuyển mặc định','number')}</div><h2 style="margin-top:30px">Tài khoản nhận cọc</h2><p>Chỉ nhập tài khoản thật do bạn quản lý. Khách sẽ nhận nội dung chuyển khoản theo mã lịch.</p><div class="form-grid">${input('bankName','Ngân hàng')}${input('bankAccount','Số tài khoản')}${input('bankOwner','Chủ tài khoản')}</div><h3>Mã QR nhận tiền của bạn</h3><p>Tải ảnh QR gốc từ ứng dụng ngân hàng. Ảnh sẽ hiển thị ở bước đặt cọc và chi tiết lịch hẹn.</p>${paymentQR()}<label class="btn">Tải / thay ảnh QR<input type="file" accept="image/png,image/jpeg,image/webp" data-payment-qr hidden></label><p>Đối soát thủ công tại mục Tiền cọc. Chưa kết nối thanh toán tự động hoặc MoMo.</p><button class="btn btn-dark">Lưu thiết lập</button></form><form class="manage-card" data-form="contact-settings" style="margin-top:25px"><h2>Thông tin liên hệ</h2><div class="form-grid"><div class="field"><label>Số điện thoại / Zalo</label><input name="phone" value="${esc(state.brand.phone==='0901 234 567'?'':state.brand.phone)}"></div><div class="field"><label>Email</label><input name="email" type="email" value="${esc(state.brand.email||'')}"></div></div><button class="btn btn-dark">Lưu thông tin liên hệ</button></form>`,'Cài đặt','Thiết lập lịch, tài khoản nhận tiền và thông tin liên hệ.');
  }

  function modal(title, content, confirmLabel = 'Lưu', onConfirm = '', confirmClass = 'btn-dark') {
    $('#modal-root').innerHTML = `<div class="modal-backdrop" role="presentation" data-action="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><h2 id="modal-title">${title}</h2><div>${content}</div><div class="modal-actions"><button class="btn" data-action="close-modal">Hủy</button><button class="btn ${confirmClass}" data-action="modal-confirm" data-confirm="${onConfirm}">${confirmLabel}</button></div></section></div>`;
    setTimeout(() => $('.modal input, .modal select, .modal textarea')?.focus(), 0);
  }
  const closeModal = () => { $('#modal-root').innerHTML = ''; };

  function downloadText(filename, content) {
    const blob = new Blob([content], {type:'text/plain;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),500);
  }

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
    if (path === '/') return pageHome();
    if (path === '/services') return pageServices();
    if (parts[0] === 'services' && parts[1]) return pageServiceDetail(parts[1]);
    if (path === '/gallery') return pageGallery(query.get('filter') || 'all');
    if (parts[0] === 'look') return pageLook();
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

  function render() {
    siteTools?.beforeRender();
    const raw = location.hash.slice(1) || '/';
    const [path, queryString=''] = raw.split('?');
    const query = new URLSearchParams(queryString);
    const parts = path.split('/').filter(Boolean);
    let html = renderPathHtml(raw);
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
        if (!state.contentViewMode) state.contentViewMode = 'pages';
        if (!state.contentActiveTab) state.contentActiveTab = 'pages';
        if (path === '/admin/content-pages') {
          state.contentViewMode = 'pages';
          state.contentActiveTab = 'pages';
        }
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
    $('#app').innerHTML = html;
    siteTools?.mount(path);
    window.scrollTo(0,0);
    mountCoutureMotion(path);
    if (path === '/booking/deposit') {
      initDepositTimer();
      initDepositSync();
    }
    document.title = path.startsWith('/admin') ? 'Quản trị — HOÀN' : 'HOÀN — Makeup Artist';
  }

  function initDepositTimer() {
    if (typeof setInterval === 'undefined') return;
    if (window._depositTimerInterval) clearInterval(window._depositTimerInterval);
    let seconds = 15 * 60;
    const el = document.querySelector ? document.querySelector('#deposit-timer') : null;
    if (!el) return;
    window._depositTimerInterval = setInterval(() => {
      const target = document.querySelector ? document.querySelector('#deposit-timer') : null;
      if (!target) { clearInterval(window._depositTimerInterval); return; }
      if (seconds <= 0) {
        clearInterval(window._depositTimerInterval);
        target.textContent = '00:00';
        return;
      }
      seconds--;
      const m = String(Math.floor(seconds / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      target.textContent = `${m}:${s}`;
    }, 1000);
  }

  function initDepositSync() {
    if (typeof setInterval === 'undefined') return;
    if (window._depositSyncInterval) clearInterval(window._depositSyncInterval);
    window._depositSyncInterval = setInterval(async () => {
      if (location.hash !== '#/booking/deposit') {
        clearInterval(window._depositSyncInterval);
        return;
      }
      try {
        const raw = localStorage.getItem('hoanMakeupDraft');
        if (raw) {
          const draft = JSON.parse(raw);
          if (draft.booking && !!draft.booking.depositPaid !== !!state.booking.depositPaid) {
            state.booking.depositPaid = draft.booking.depositPaid;
            state.booking.depositStatus = draft.booking.depositStatus;
            render();
            return;
          }
        }
        const data = await api();
        if (data && data.appointments) {
          state.appointments = data.appointments;
          const code = state.booking.code || (state.appointments[0]?.code);
          const apt = state.appointments.find(a => a.code === code);
          const isPaidNow = !!state.booking.depositPaid || state.booking.depositStatus === 'received' || (apt && (apt.paymentStatus === 'received' || apt.status === 'confirmed'));
          if (isPaidNow !== !!state.booking.depositPaid) {
            state.booking.depositPaid = isPaidNow;
            if (isPaidNow) state.booking.depositStatus = 'received';
            saveState();
            render();
          }
        }
      } catch(e){}
    }, 1200);
  }

  let requestFilterState = { status: 'all', search: '' };

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
    if(kind==='site-search'||kind==='support-search')return route('/'+(kind==='site-search'?'search':'support')+'?q='+encodeURIComponent(data.q||''));
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
    const _handledInThisListener = _a.startsWith('ct-') || _a.startsWith('req-') || _a==='reset-req-filter' || _a==='admin-confirm-deposit' || _a==='admin-reset-deposit' || _a==='look-book';
    if(!_handledInThisListener) return;
    const action=el.dataset.action;event.preventDefault();event.stopImmediatePropagation();
    try{
      if(action==='admin-confirm-deposit'||action==='ct-admin-confirm-deposit'){
        const c=el.dataset.code||bookingCode||'HOAN-MAU-001';
        el.disabled=true;
        try{
          let a=getAppointment(c);
          const dep=(a&&Number(a.deposit)>0)?Number(a.deposit):Number(state.settings.deposit||200000);
          const res=await api({action:'updateAppointment',code:c,status:'confirmed',deposit:dep,paymentStatus:'received'});
          if(a){
            Object.assign(a,res.appointment||{status:'confirmed',paymentStatus:'received',deposit:dep});
          }else{
            a=res.appointment||{code:c,customer:state.booking.name||'Khách hàng',phone:state.booking.phone||'0901234567',serviceId:state.booking.serviceId||'party',date:state.booking.date||localIso(),time:state.booking.time||'10:00',address:'Đường Châu Văn Liêm, Phường Phú Đô, Nam Từ Liêm',total:700000,deposit:dep,status:'confirmed',paymentStatus:'received'};
            state.appointments.unshift(a);
          }
          if(state.booking.code===c || bookingCode===c || !state.booking.code || (state.appointments[0] && state.appointments[0].code === c)){
            state.booking.depositPaid=true;
            state.booking.depositStatus='received';
            state.booking.code=c;
          }
          saveState();
          toast(`✓ Quản trị viên đã xác nhận cọc & duyệt lịch hẹn ${c}!`);
          render();
        }catch(err){
          toast(err.message||'Lỗi khi xác nhận cọc');
          el.disabled=false;
        }
      }else if(action==='admin-reset-deposit'||action==='ct-admin-reset-deposit'){
        const c=el.dataset.code||bookingCode||'HOAN-MAU-001';
        el.disabled=true;
        try{
          let a=getAppointment(c);
          const res=await api({action:'updateAppointment',code:c,status:'pending',deposit:0,paymentStatus:'pending_verification'});
          if(a){
            Object.assign(a,res.appointment||{status:'pending',paymentStatus:'pending_verification',deposit:0});
          }
          if(state.booking.code===c || bookingCode===c || !state.booking.code || (state.appointments[0] && state.appointments[0].code === c)){
            state.booking.depositPaid=false;
            state.booking.depositStatus='pending_verification';
          }
          saveState();
          toast(`↺ Đã chuyển lịch ${c} về trạng thái Chờ đối soát!`);
          render();
        }catch(err){
          toast(err.message||'Lỗi khi chuyển trạng thái');
          el.disabled=false;
        }
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
            <p style="margin-bottom:12px;"><strong>1. Mức cọc tiêu chuẩn:</strong> Mức cọc là <strong>200.000đ</strong> cho mỗi lịch hẹn. Khoản cọc này đảm bảo chuyên viên dành trọn khung giờ phục vụ riêng cho bạn và sẽ được trừ 100% vào tổng chi phí dịch vụ.</p>
            <p style="margin-bottom:12px;"><strong>2. Đối soát & Giữ chỗ:</strong> Khi bạn bấm <em>"Tôi đã chuyển khoản"</em>, hệ thống ghi nhận lịch ở trạng thái <em>"Chờ đối soát"</em>. Chuyên viên sẽ đối soát giao dịch và gửi xác nhận chính thức qua SMS/Zalo.</p>
            <p style="margin-bottom:0;"><strong>3. Thời gian hoàn tất:</strong> Vui lòng chuyển khoản trong thời gian giữ chỗ 15 phút để đảm bảo khung giờ không bị giải phóng cho khách hàng khác.</p>
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
        b.depositConsent=true;
        b.depositReported=true;
        b.depositStatus='pending_verification';

        let a = getAppointment(b.code);
        if(a){
          a.paymentStatus = 'pending_verification';
          try { api({action:'reportPayment', code: a.code}).catch(()=>{}); } catch(e){}
        }
        saveState();
        toast('✓ Đã ghi nhận! Vui lòng chờ Hoàn kiểm tra và xác nhận cọc.');
        render();
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
      }else if(action==='ct-next'){
        const step=Number(el.dataset.step),form=document.querySelector('.ct-booking form');
        if(form){if(!form.reportValidity())return;Object.assign(state.booking,Object.fromEntries(new FormData(form)));for(const box of form.querySelectorAll('input[type=checkbox][name]'))state.booking[box.name]=box.checked;}
        if(step===1&&service().contact)return route('/contact');
        if(step===2){if(!state.booking.time||slotUnavailable(state.booking.date,state.booking.time)||!state.settings.scheduleOpen)return toast('Vui lòng chọn một khung giờ còn trống.');}
        if(step===3){state.booking.locationType='client';state.booking.travelFee=Number(state.settings.travelFee||50000);}
        saveState();route(el.dataset.next);
      }else if(action==='ct-date'){state.booking.date=el.dataset.date;state.booking.time=defaultBookingTime(el.dataset.date);saveState();render();}
      else if(action==='ct-month'){const d=new Date((state.calendarMonth||state.booking.date).slice(0,7)+'-01T12:00:00');d.setMonth(d.getMonth()+Number(el.dataset.delta));state.calendarMonth=localIso(d);render();}
      else if(action==='look-book'){state.booking.serviceId=el.dataset.id;state.booking.style=el.dataset.style;saveState();route(service().contact?'/contact':'/booking/time');}
      else if(action==='ct-copy'){await navigator.clipboard.writeText(el.dataset.value);toast('Đã sao chép');}
      else if(action==='ct-refresh'){await hydrateBackend();toast('Đã cập nhật trạng thái');}
      else if(action==='ct-payment-report'){el.disabled=true;const r=await api({action:'reportPayment',code:el.dataset.code});Object.assign(getAppointment(el.dataset.code),r.appointment);render();toast('Đã thông báo, đang chờ đối soát');}
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
        requestFilterState = { status: 'all', search: '' };
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
      const a = state.appointments.find(x=>x.code.toLowerCase()===String(data.code).toLowerCase() && x.phone.replaceAll(' ','')===String(data.phone).replaceAll(' ',''));
      if (a) route('/booking/'+a.code); else {const status=form.querySelector('[role=status]');if(status)status.textContent='Chưa tìm thấy lịch phù hợp. Kiểm tra lại mã lịch và số điện thoại.';}
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
    if (event.target.tagName === 'SELECT') return;
    const bookingForm=event.target.closest('form[data-form="info"], form[data-form="location"]');
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
    if (event.target.closest('form[data-form="info"], form[data-form="location"]') && event.target.name) {
      state.booking[event.target.name]=event.target.type==='checkbox'?event.target.checked:event.target.value;

      if (event.target.name === 'city') {
        const newCity = event.target.value;
        state.booking.city = newCity;
        const availableDistricts = getDistricts(newCity);
        state.booking.district = availableDistricts[0] !== 'Khác' ? availableDistricts[0] : '';
        const availableWards = getWards(newCity, state.booking.district);
        state.booking.ward = availableWards[0] !== 'Khác' ? availableWards[0] : '';
        saveState();
        render();
        return;
      }

      if (event.target.name === 'district') {
        const newDistrict = event.target.value;
        state.booking.district = newDistrict;
        state.booking.travelFee = newDistrict ? 50000 : 0;
        const availableWards = getWards(state.booking.city, newDistrict);
        state.booking.ward = availableWards[0] !== 'Khác' ? availableWards[0] : '';
        saveState();
        render();
        return;
      }

      if (event.target.name === 'ward') {
        state.booking.ward = event.target.value;
        saveState();
        render();
        return;
      }

      saveState();
    }
  });

  document.addEventListener('click', async (event) => {
    const el = event.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    if (action === 'mobile-menu') {const on=$('#site-header')?.classList.toggle('menu-open');el.setAttribute('aria-expanded',String(!!on));}
    else if (action === 'choose-service' || action === 'booking-service') { state.booking.serviceId = el.dataset.id; saveState(); route(action==='choose-service'?(service().contact?'/contact':'/booking/time'):'/booking/service'); render(); }
    else if (action === 'go-step') {
      const form = document.querySelector('.ct-booking form');
      if (form) {
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
      if (form) {
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
    else if (action === 'time-select') { state.booking.time = el.dataset.time; saveState(); render(); }
    else if (action === 'location-type') { state.booking.locationType = el.dataset.type; state.booking.travelFee = el.dataset.type==='artist'?0:50000; saveState(); render(); }
    else if (action === 'detect-location') {
      if (state.booking.isDetectingLocation) return;
      state.booking.isDetectingLocation = true;
      render();
      toast('Đang kích hoạt GPS để xác định vị trí chuẩn xác của bạn...');

      const applyLocationResult = (data) => {
        state.booking.isDetectingLocation = false;
        if (!data || (!data.address && !data.fullAddress && !data.city)) {
          render();
          toast('Không thể nhận diện vị trí. Vui lòng tự nhập địa chỉ bên dưới.');
          return;
        }

        let address = data.address || '';
        let city = data.city || 'Hà Nội';
        let district = data.district || '';
        let ward = data.ward || '';

        // Standardize Nam Tu Liem & Chau Van Liem
        if (address.includes('Châu Văn Liêm') || data.fullAddress?.includes('Châu Văn Liêm')) {
          address = address || 'Đường Châu Văn Liêm';
          city = 'Hà Nội';
          district = 'Nam Từ Liêm';
          ward = 'Phường Phú Đô';
        }
        if (district === 'Từ Liêm' || district === 'Phường Từ Liêm') district = 'Nam Từ Liêm';
        if (ward === 'Xuân Phong') ward = 'Phường Phú Đô';
        // Normalize against VIETNAM_LOCATIONS
        const matchedCity = VIETNAM_LOCATIONS.provinces.find(p => p.toLowerCase() === city.toLowerCase() || city.toLowerCase().includes(p.toLowerCase()));
        if (matchedCity) city = matchedCity;

        const distList = getDistricts(city);
        const normDist = district.replace(/^(Quận|Huyện|Thị xã|TP\.)\s+/i, '').trim();
        const matchedDist = distList.find(d => {
          const dNorm = d.replace(/^(Quận|Huyện|Thị xã|TP\.)\s+/i, '').trim();
          return d.toLowerCase() === district.toLowerCase() || dNorm.toLowerCase() === normDist.toLowerCase();
        });
        if (matchedDist) district = matchedDist;

        const wardList = getWards(city, district);
        const normWard = ward.replace(/^(Phường|Xã|Thị trấn)\s+/i, '').trim();
        const matchedWard = wardList.find(w => {
          const wNorm = w.replace(/^(Phường|Xã|Thị trấn)\s+/i, '').trim();
          return w.toLowerCase() === ward.toLowerCase() || wNorm.toLowerCase() === normWard.toLowerCase();
        });
        if (matchedWard) ward = matchedWard;

        const fullAddr = [address, ward, district ? (district.startsWith('Quận') || district.startsWith('Huyện') || district.startsWith('Thị xã') || district.startsWith('TP.') ? district : 'Quận ' + district) : '', city].filter(Boolean).join(', ');

        state.booking.detectedAddress = fullAddr;
        state.booking.address = address;
        state.booking.city = city;
        state.booking.district = district;
        state.booking.ward = ward;

        saveState();
        render();
        toast('Đã xác định vị trí chuẩn xác: ' + fullAddr);
      };

      if (!navigator.geolocation) {
        try {
          const res = await api({ action: 'reverseGeocode' });
          applyLocationResult(res);
        } catch (e) {
          applyLocationResult(null);
        }
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          try {
            const res = await api({ action: 'reverseGeocode', lat, lon });
            applyLocationResult(res);
          } catch (e) {
            try {
              const bdcRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=vi`);
              const bdc = await bdcRes.json();
              const city = bdc.city || bdc.principalSubdivision || 'Hà Nội';
              applyLocationResult({
                fullAddress: [bdc.locality, city].filter(Boolean).join(', '),
                address: '',
                city,
                district: bdc.locality || '',
                ward: ''
              });
            } catch (err2) {
              applyLocationResult(null);
            }
          }
        },
        async (err) => {
          console.warn('Geolocation error:', err);
          try {
            const res = await api({ action: 'reverseGeocode' });
            applyLocationResult(res);
          } catch (e) {
            applyLocationResult(null);
          }
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    }
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
        const result=await api({action:'createAppointment',...b,customer:b.name,paymentStatus:b.depositReported?'pending_verification':'not_paid'});
        bookingCode=result.appointment.code;
        try { localStorage.setItem('hoanLastBookingCode',bookingCode); } catch {}
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
    else if (action === 'policy-tab') route('/policies?tab='+el.dataset.tab);
    else if (action === 'download-policy') downloadText('chinh-sach-hoan-makeup.txt','CHÍNH SÁCH ĐẶT LỊCH HOÀN MAKEUP\\n\\nCọc tiêu chuẩn: 200.000đ. Đổi lịch miễn phí trước 24 giờ. Yêu cầu hủy trước 48 giờ được xem xét hoàn cọc.');
    else if (action === 'support-lookup') route('/booking/'+($('#support-code')?.value || bookingCode));
    else if (action === 'add-calendar') { const s=service(); const start=state.booking.date.replaceAll('-','')+'T'+state.booking.time.replace(':','')+'00'; location.href=`data:text/calendar;charset=utf-8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ADTSTART:${start}%0ASUMMARY:${encodeURIComponent(s.name+' - HOÀN')}%0AEND:VEVENT%0AEND:VCALENDAR`; }
    else if (action === 'download-confirmation') downloadText('xac-nhan-'+bookingCode+'.txt','XÁC NHẬN LỊCH HẸN\\nMã: '+bookingCode+'\\nDịch vụ: '+service().name+'\\nNgày: '+dateLabel()+' '+state.booking.time);
    else if (action === 'download-receipt') downloadText('bien-nhan-'+bookingCode+'.txt','BIÊN NHẬN ĐẶT CỌC\\nMã lịch: '+bookingCode+'\\nĐã nhận: '+money(state.booking.deposit)+'\\nMã giao dịch: MB2409120930');
    else if (action === 'print') window.print();
    else if (action === 'confirm-reschedule') { try{const a=getAppointment(el.dataset.code);const result=await api({action:'updateAppointment',code:a.code,date:'2026-09-19',time:'10:00'});Object.assign(a,result.appointment);toast('Đổi lịch thành công');route('/booking/'+a.code);}catch(error){toast(error.message)} }
    else if (action === 'confirm-cancel') { if (!$('#cancel-confirm')?.checked) return toast('Vui lòng xác nhận điều kiện hủy lịch'); try{const a=getAppointment(el.dataset.code);const result=await api({action:'updateAppointment',code:a.code,status:'cancelled'});Object.assign(a,result.appointment);toast('Đã hủy lịch hẹn');route('/booking/'+a.code);}catch(error){toast(error.message)} }
    else if (action === 'new-appointment') { modal('Tạo lịch hẹn mới',`<div class="form-grid"><div class="field full"><label>Khách hàng</label><input id="modal-customer" placeholder="Họ và tên"></div><div class="field"><label>Dịch vụ</label><select id="modal-service">${state.services.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></div><div class="field"><label>Ngày</label><input id="modal-date" type="date" value="${localIso()}"></div><div class="field"><label>Giờ</label><input id="modal-time" type="time" value="09:30"></div><div class="field"><label>Số điện thoại</label><input id="modal-phone" placeholder="Số điện thoại"></div></div>`,'Tạo lịch','create-appointment'); }
    else if (action === 'admin-status') { const a=getAppointment(el.dataset.code); modal('Cập nhật trạng thái',`<div class="field"><label>Trạng thái mới</label><select id="modal-status"><option value="confirmed">Đã xác nhận</option><option value="pending">Chờ xác nhận</option><option value="completed">Đã hoàn thành</option><option value="cancelled">Đã hủy</option></select></div><div class="form-grid"><div class="field"><label>Ngày hẹn</label><input id="modal-appointment-date" type="date" value="${a.date}"></div><div class="field"><label>Giờ bắt đầu</label><input id="modal-appointment-time" type="time" value="${a.time}"></div></div>`,'Cập nhật','update-status:'+a.code); }
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
            <div class="summary-row" style="display:flex;justify-content:space-between;padding:4px 0;"><span>Địa điểm</span><b>${a.address || a.district || 'Tại Studio HOÀN'}</b></div>
            <div class="summary-row" style="display:flex;justify-content:space-between;padding:4px 0;"><span>Tổng chi phí</span><b class="numeric">${money(a.total)}</b></div>
            <div class="summary-row" style="display:flex;justify-content:space-between;padding:4px 0;"><span>Tiền cọc</span><b class="numeric">${a.deposit > 0 ? 'Đã nhận ' + money(a.deposit) : 'Chờ đối soát'}</b></div>
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
    else if (action === 'edit-service') { const s=service(el.dataset.id); modal('Chỉnh sửa dịch vụ',`<div class="field"><label>Tên dịch vụ</label><input id="modal-service-name" value="${s.name}"></div><div class="form-grid"><div class="field"><label>Thời lượng</label><input id="modal-service-duration" type="number" value="${s.duration}"></div><div class="field"><label>Giá</label><input id="modal-service-price" type="number" value="${s.price}"></div></div><div class="field"><label>Mô tả</label><textarea id="modal-service-desc">${s.description}</textarea></div>`,'Lưu thay đổi','edit-service:'+s.id); }
    else if (action === 'add-service') modal('Thêm dịch vụ',`<div class="field"><label>Tên dịch vụ</label><input id="modal-service-name"></div><div class="form-grid"><div class="field"><label>Thời lượng</label><input id="modal-service-duration" type="number" value="60"></div><div class="field"><label>Giá</label><input id="modal-service-price" type="number" value="500000"></div></div><div class="field"><label>Mô tả</label><textarea id="modal-service-desc"></textarea></div>`,'Thêm dịch vụ','add-service');
    else if (action === 'delete-service') { if(state.services.length<=1)return toast('Cần giữ ít nhất một dịch vụ');try{await api({action:'deleteService',id:el.dataset.id});state.services=state.services.filter(s=>s.id!==el.dataset.id);toast('Đã xóa dịch vụ');render();}catch(error){toast(error.message)} }
    else if (action === 'edit-customer') { const c=state.customers[Number(el.dataset.index)]; modal('Chỉnh sửa khách hàng',`<div class="field"><label>Họ tên</label><input id="modal-customer-name" value="${c.name}"></div><div class="field"><label>Ghi chú</label><textarea id="modal-customer-note">${c.note}</textarea></div>`,'Lưu','edit-customer:'+el.dataset.index); }
    else if (action === 'add-customer') modal('Thêm khách hàng',`<div class="field"><label>Họ tên</label><input id="modal-customer-name"></div><div class="field"><label>Số điện thoại</label><input id="modal-customer-phone"></div><div class="field"><label>Email</label><input id="modal-customer-email" type="email"></div>`,'Thêm','add-customer');
    else if (action === 'toggle-promo') { state.promotions[Number(el.dataset.index)].active=!state.promotions[Number(el.dataset.index)].active; saveState('Đã cập nhật mã ưu đãi'); render(); }
    else if (action === 'add-promo') modal('Tạo mã ưu đãi',`<div class="field"><label>Mã ưu đãi</label><input id="modal-promo-code" value="NEWCLIENT"></div><div class="field"><label>Giá trị</label><input id="modal-promo-value" value="100.000đ"></div>`,'Tạo mã','add-promo');
    else if (action === 'delete-promo') { state.promotions.splice(Number(el.dataset.index),1); saveState('Đã xóa mã ưu đãi'); render(); }
    else if (action === 'edit-promo') toast('Đã mở chỉnh sửa mã '+state.promotions[Number(el.dataset.index)].code);
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
    else if (action === 'switch-content-view') {
      state.contentViewMode = el.dataset.view;
      if (el.dataset.view === 'pages') {
        state.contentActiveTab = 'pages';
      } else {
        if (state.contentActiveTab === 'pages') state.contentActiveTab = 'home';
      }
      render();
    }
    else if (action === 'content-tab') {
      state.contentActiveTab = el.dataset.tab;
      if (el.dataset.tab === 'pages') {
        state.contentViewMode = 'pages';
      } else {
        state.contentViewMode = 'general';
        if (['home','about','services','booking','policies','contact'].includes(el.dataset.tab)) {
          state.contentPreviewMode = el.dataset.tab;
        }
      }
      render();
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
      const activeAppts = (state.appointments || []).filter(a => a.status !== 'cancelled');
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
    else if (action === 'manual-payment') { const paymentCode=el.dataset.code || (bookingCode==='CHƯA TẠO'?'':bookingCode);modal('Ghi nhận thanh toán',`<div class="field"><label>Mã lịch</label><input id="modal-payment-code" value="${paymentCode}"></div><div class="field"><label>Số tiền</label><input id="modal-payment-amount" type="number" value="${state.settings.deposit||200000}"></div>`,'Ghi nhận','manual-payment'); }
    else if (action === 'payment-receipt') route('/booking/'+el.dataset.code+'/receipt');
    else if (action?.startsWith('export')) downloadText(action+'.csv','HOÀN Makeup Artist\\nDữ liệu xuất ngày 04/09/2026');
    else if (action === 'refresh-report') toast('Đã cập nhật số liệu báo cáo');
    else if (action === 'edit-role' || action === 'role-members' || action === 'add-role') toast('Đã mở thiết lập phân quyền');
    else if (action === 'close-modal') closeModal();
    else if (action === 'modal-backdrop' && event.target===el) closeModal();
    else if (action === 'modal-confirm') await handleModalConfirm(el.dataset.confirm);
  });

  async function handleModalConfirm(action) {
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
      const paymentStatus = $('#modal-edit-payment')?.value;
      const deposit = Number($('#modal-edit-deposit')?.value || 0);
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
          paymentStatus,
          deposit,
          total,
          address,
          note
        });
        const a = getAppointment(code);
        if (a) {
          Object.assign(a, result.appointment);
          if (status === 'confirmed') a.paymentStatus = 'received';
        }
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
        if (appt) {
          Object.assign(appt, result.appointment);
          if (newStatus === 'confirmed') {
            appt.paymentStatus = 'received';
          }
        }
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
    else if (action === 'manual-payment') {
      try { const code=$('#modal-payment-code').value.trim();const result=await api({action:'updateAppointment',code,deposit:Number($('#modal-payment-amount').value)});const a=getAppointment(code);if(a)Object.assign(a,result.appointment);toast('Đã ghi nhận tiền cọc vào dữ liệu thật'); }
      catch(error){toast(error.message);return;}
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
    if (event.key && !['hoanDepositSyncTrigger', 'hoanMakeupDraft', 'hoanLastBookingCode'].includes(event.key)) return;
    state = loadState();
    if (typeof window !== 'undefined') window.state = state;
    await hydrateBackend(true);
    render();
  });
  if (!location.hash) location.hash = '#/';
  if (typeof document.createElement === 'function' && location.origin) {
    import('/site-tools.js?v=140.0').then(({ createSiteTools }) => {
      siteTools = createSiteTools({ getState: () => state, render, renderPathHtml, hydrateBackend, adminShell, esc, toast, icon });
      siteTools.start();
    }).catch(error => console.error('Không tải được công cụ website:', error));
    import('/scroll-enhancements.js?v=1.0').then(() => {
      if (typeof window.initHoanScroll === 'function') window.initHoanScroll();
    }).catch(() => {});
  }
  render();
  hydrateBackend();
  if (typeof window.initHoanScroll === 'function') window.initHoanScroll();
})();
