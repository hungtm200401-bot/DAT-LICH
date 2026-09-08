(() => {
  'use strict';

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
      upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>'
    };
    const title = label ? `<title>${label}</title>` : '';
    return `<svg class="ui-icon ui-icon-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${title}${paths[name] || paths.more}</svg>`;
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
      date: new Date(Date.now()+86400000).toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'}),
      time: '09:30',
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
    adminWeekOffset: 1,
    backendReady: false,
    backendError: ''
  };

  const loadState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('hoanMakeupDraft'));
      if (!saved) return structuredClone(defaultState);
      return { ...structuredClone(defaultState), booking: { ...defaultState.booking, ...(saved.booking || {}) }, adminWeekOffset: saved.adminWeekOffset === undefined ? 1 : Number(saved.adminWeekOffset) };
    } catch {
      return structuredClone(defaultState);
    }
  };
  let state = loadState();
  const saveState = (message) => {
    localStorage.setItem('hoanMakeupDraft', JSON.stringify({ booking: state.booking, adminWeekOffset: state.adminWeekOffset }));
    if (message) toast(message);
  };
  const service = (id = state.booking.serviceId) => state.services.find(s => s.id === id) || state.services[0];
  const currentTotal = () => service().price + Number(state.booking.travelFee || 0);
  const dateLabel = (iso = state.booking.date) => {
    const [y,m,d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };
  let bookingCode = localStorage.getItem('hoanLastBookingCode') || 'CHƯA TẠO';

  async function api(payload) {
    const options = payload ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) } : {};
    const response = await fetch('/api/data', options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không thể kết nối dữ liệu');
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
      state.backendReady = true;
      state.backendError = '';
      if (!silent) render();
    } catch (error) {
      state.backendError = error.message;
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

  const localIso = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

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
      services: {title:'Dịch vụ trang điểm',intro:'Một diện mạo dành riêng cho bạn.',all:'/services',links:[['Trang điểm cá nhân','/services/personal','natural.png','Trong trẻo mỗi ngày'],['Trang điểm dự tiệc','/services/party','evening.png','Sắc nét trong từng khoảnh khắc'],['Trang điểm chụp ảnh','/services/photo','natural.png','Vẻ đẹp trước ống kính'],['Trang điểm cô dâu','/services/bridal','bridal-new.png','Dành cho ngày đặc biệt']]},
      gallery: {title:'Bộ sưu tập',intro:'Khám phá dấu ấn của HOÀN.',all:'/gallery',links:[['Khám phá các diện mạo','/gallery','evening.png','Những diện mạo của HOÀN'],['Phong cách cá nhân','/services/personal','natural.png','Vẻ đẹp tự nhiên'],['Cảm hứng cô dâu','/services/bridal','bridal.png','Thanh lịch và tinh tế']]},
      about: {title:'Thế giới của HOÀN',intro:'Lắng nghe gương mặt. Tôn vinh nét riêng.',all:'/about',links:[['Câu chuyện của tôi','/about','hero.png','Vẻ đẹp được thiết kế riêng'],['Trải nghiệm dịch vụ','/services','natural.png','Chăm chút từng chi tiết'],['Tư vấn và hỗ trợ','/support','bridal.png','Đồng hành cùng bạn']]}
    };
    const g=groups[key]; if(!g)return '';
    return `<section class="editorial-menu" id="nav-panel-${key}" aria-label="${g.title}" hidden><div class="editorial-inner"><div class="editorial-copy"><p class="editorial-eyebrow">HOÀN MAKEUP ARTIST</p><h2>${g.title}</h2><p class="editorial-intro">${g.intro}</p><div class="editorial-links">${g.links.map((l,i)=>`<a href="#${l[1]}" data-preview="${i}" class="${i===0?'is-preview':''}"><span>${l[0]}</span>${icon('arrow')}</a>`).join('')}</div><a class="editorial-all" href="#${g.all}">Khám phá tất cả ${icon('arrow')}</a></div><div class="editorial-images">${g.links.map((l,i)=>`<a class="editorial-image ${i===0?'is-visible':''}" href="#${l[1]}" data-image="${i}" ${i!==0?'inert':''}><img src="/assets/${l[2]}" alt="${l[3]}" width="800" height="1000"><span>${l[3]} ${icon('arrow')}</span></a>`).join('')}</div><button class="editorial-close" aria-label="Đóng menu">×</button></div></section>`;
  }

  function fashionPhoto(name, label) {
    return `<span class="fashion-photo"><img class="fashion-full" src="/assets/${name}" alt="${label}" loading="lazy" width="1024" height="1536"><img class="fashion-detail" src="/assets/${name}" alt="" aria-hidden="true" loading="lazy" width="1024" height="1536"><span class="photo-discover">Xem chi tiết ${icon('arrow')}</span></span>`;
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
  const imageFor = s => s.id==='bridal'?'bridal-new.png':s.id==='personal'||s.id==='photo'?'natural.png':'evening.png';
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
    const socialLinks=isAbout?`<div class="ct-footer-socials" aria-label="Kênh mạng xã hội của Hoàn"><span class="ct-social-instagram" aria-label="Instagram" role="img"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg></span><span class="ct-social-facebook" aria-label="Facebook" role="img">f</span><span class="ct-social-youtube" aria-label="YouTube" role="img"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12c0 2.75-.32 4.45-.72 5.37a2.5 2.5 0 0 1-1.4 1.4C17.95 19.18 16.24 19.5 12 19.5s-5.95-.32-6.88-.73a2.5 2.5 0 0 1-1.4-1.4C3.32 16.45 3 14.75 3 12s.32-4.45.72-5.37a2.5 2.5 0 0 1 1.4-1.4C6.05 4.82 7.76 4.5 12 4.5s5.95.32 6.88.73a2.5 2.5 0 0 1 1.4 1.4C20.68 7.55 21 9.25 21 12Z"/><path d="m10 8.8 5 3.2-5 3.2Z" fill="currentColor" stroke="none"/></svg></span><span class="ct-social-tiktok" aria-label="TikTok" role="img">♪</span></div>`:'';
    const tagline=isAbout?'<p class="ct-footer-tagline">Vẻ đẹp bắt đầu từ sự thấu hiểu</p>':'';
    return `<footer class="public-footer couture-footer ${isAbout?'ct-about-footer':''}">${brandMarkup()}<nav aria-label="Thông tin và hỗ trợ">${[['support','Hỗ trợ'],['lookup','Tra cứu lịch'],['policies','Chính sách'],['contact','Liên hệ']].map(([p,t])=>`<a ${current.startsWith('/'+p)?'aria-current="page"':''} href="#/${p}">${t}</a>`).join('')}</nav>${socialLinks}${tagline}</footer>`;
  }
  function ctPage(active,title,body,breadcrumb=title,wide=false) {
    return `<div class="page couture ct-page-${active||'default'}">${publicHeader(active)}<main id="main" class="ct-main ${wide?'ct-wide':''}"><div class="breadcrumbs"><a href="#/">Trang chủ</a><span>/</span>${esc(breadcrumb)}</div>${title?`<h1 class="ct-title">${title}</h1>`:''}${body}</main>${publicFooter()}</div>`;
  }
  function bookingInvite() {
    return `<section class="ct-invite"><h2>Cuộc hẹn dành riêng cho bạn</h2><a class="btn" href="#/booking/service">Chọn dịch vụ ${icon('chevron')}</a><a class="btn" href="#/booking/time">${icon('calendar')} Chọn ngày</a><a class="btn btn-dark" href="#/booking/service">ĐẶT LỊCH</a></section>`;
  }
  function pageHome() {
    return `<div class="page couture">${publicHeader('home')}<main id="main"><section class="ct-campaign"><img src="/assets/campaign.png" alt="Cảm hứng trang điểm cô dâu HOÀN" fetchpriority="high" width="1536" height="1024"><div class="ct-campaign-copy"><h1>Một ngày của bạn.<br>Một dấu ấn của Hoàn.</h1><p>TRANG ĐIỂM CÁ NHÂN & CÔ DÂU</p><a class="link" href="#/services">Khám phá ${icon('arrow')}</a></div></section><section class="ct-editorial"><header><p class="ct-overline">NGHỆ THUẬT CỦA SỰ TINH TẾ</p><h2>Đẹp từ những điều rất riêng</h2></header><div class="ct-bridal-story"><a href="#/services/bridal">${fashionPhoto('bridal-new.png','Trang điểm cô dâu')}</a><div><h2>Khoảnh khắc<br>cô dâu</h2><p>Tôn lên đường nét.<br>Giữ trọn nét riêng.</p><a class="btn" href="#/services/bridal">KHÁM PHÁ</a></div><a class="ct-detail-crop" href="#/look/detail">${fashionPhoto('bridal-new.png','Chi tiết phong cách cô dâu')}</a></div></section><section class="ct-evening"><div><h2>Sắc thái của buổi tối</h2><a class="link" href="#/services/party">Trang điểm dự tiệc ${icon('arrow')}</a></div><a href="#/services/party">${fashionPhoto('evening.png','Phong cách dự tiệc')}</a></section>${bookingInvite()}</main>${publicFooter()}</div>`;
  }
  function pageServices() {
    const filter=new URLSearchParams(location.hash.split('?')[1]).get('filter')||'all';
    return ctPage('services','Dịch vụ trang điểm',`<p class="ct-subtitle">Lựa chọn dành cho khoảnh khắc của bạn.</p><nav class="ct-tabs">${[['all','Tất cả'],['personal','Cá nhân'],['party','Dự tiệc'],['bridal','Cô dâu']].map(([v,t])=>`<a class="${filter===v?'active':''}" href="#/services?filter=${v}">${t}</a>`).join('')}</nav><section class="ct-service-grid">${state.services.filter(s=>s.enabled&&(filter==='all'||s.id===filter)).map(s=>`<article><a href="#/services/${s.id}">${fashionPhoto(imageFor(s),esc(s.name))}</a><h2>${esc(s.name)}</h2><p>${esc(s.description)}</p><p class="ct-service-meta">${s.contact?'Tư vấn riêng':`${money(s.price)} · ${s.duration} phút`}</p><a class="link" href="#/services/${s.id}">Xem chi tiết ${icon('arrow')}</a><button class="btn btn-wide" data-action="choose-service" data-id="${s.id}">CHỌN DỊCH VỤ</button></article>`).join('')}</section><section class="ct-consult"><img src="/assets/natural.png" alt="Phong cách trang điểm tự nhiên" loading="lazy"><div><h2>Tìm phong cách phù hợp</h2><p>Chia sẻ dịp tham dự, trang phục và mong muốn của bạn cùng Hoàn.</p><a class="btn" href="#/contact">NHẬN TƯ VẤN</a></div></section>`,'Dịch vụ',true);
  }
  function pageServiceDetail(id) {
    const s=state.services.find(s=>s.id===id);if(!s)return ctPage('services','Không tìm thấy dịch vụ','<a href="#/services">Xem các dịch vụ</a>');
    return ctPage(id==='bridal'?'bridal':'services','',`<section class="ct-product-detail"><div>${fashionPhoto(imageFor(s),esc(s.name))}</div><article><p class="ct-overline">HOÀN MAKEUP ARTIST</p><h1>${esc(s.name)}</h1><p>${esc(s.description)}</p><p class="ct-price">${s.contact?'Trao đổi để nhận tư vấn':money(s.price)}</p><p>${icon('clock')} ${s.duration} phút · Phí di chuyển được báo trước khi đặt cọc.</p><h3>Trải nghiệm của bạn</h3><ul><li>Trao đổi phong cách, trang phục và dịp tham dự.</li><li>Chuẩn bị da và trang điểm theo đường nét.</li><li>Kiểm tra và hoàn thiện diện mạo.</li></ul><button class="btn btn-dark btn-wide" data-action="choose-service" data-id="${s.id}">${s.contact?'YÊU CẦU TƯ VẤN':'CHỌN NGÀY VÀ GIỜ'}</button><a class="link" href="#/policies/deposit">Chính sách đặt cọc ${icon('arrow')}</a></article></section>`,`Dịch vụ / ${s.name}`,true);
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
    return ctPage('about','Vẻ đẹp bắt đầu từ sự thấu hiểu',`<section class="ct-about"><div class="ct-about-img-wrap"><img src="/assets/about-process.png" alt="Quá trình trang điểm môi" loading="lazy" width="342" height="174"><p class="ct-about-caption">Ảnh minh họa quá trình trang điểm</p></div><article><h2>HOÀN MAKEUP ARTIST</h2><p>Mỗi người có đường nét, phong cách và mong muốn riêng. Buổi trang điểm bắt đầu từ việc lắng nghe những điều đó.</p><hr><p>Từ lớp nền đến điểm nhấn cuối cùng, hướng thiết kế của Hoàn là sự hài hòa với gương mặt, trang phục và dịp tham dự.</p></article></section><section class="ct-process"><h2>Một buổi hẹn cùng Hoàn</h2><div>${[['Lắng nghe mong muốn','Hiểu nhu cầu, phong cách và dịp tham dự.'],['Thống nhất phong cách','Tư vấn và lựa chọn hướng trang điểm phù hợp.'],['Trang điểm & hoàn thiện','Thực hiện theo phong cách đã thống nhất.'],['Kiểm tra diện mạo','Cùng xem lại và điều chỉnh để bạn tự tin.']].map(([t,d],i)=>`<article><span>0${i+1}</span><h3>${t}</h3><p>${d}</p></article>`).join('')}</div></section><div class="ct-about-photos"><img src="/assets/about-brushes.png" alt="Cọ trang điểm" loading="lazy" width="385" height="91"><img src="/assets/about-eye.png" alt="Trang điểm mắt" loading="lazy" width="330" height="91"></div><div class="ct-center-cta"><h2>Cùng tìm nét đẹp của bạn</h2><a class="btn btn-dark" href="#/booking/service">ĐẶT LỊCH</a><a class="btn" href="#/contact">TRAO ĐỔI VỚI HOÀN</a></div>`,'Về Hoàn',true);
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
    if(!tab)return ctPage('policies','Chính sách dịch vụ',`<p class="ct-subtitle">Chọn mục để xem đầy đủ điều kiện áp dụng.</p><section class="ct-policy-list">${policySections.map(([id,title,desc],i)=>`<a href="#/policies/${id}"><span class="ct-index">0${i+1}</span><div><h2>${title}</h2><p>${desc}</p></div>${icon('arrow')}</a>`).join('')}</section><div class="ct-center-cta">Cần giải thích thêm? <a class="link" href="#/contact">Liên hệ Hoàn ${icon('arrow')}</a></div>`,'Chính sách');
    const policy=policySections.find(p=>p[0]===tab);if(!policy)return pagePolicies();
    const content={booking:['Chọn dịch vụ, ngày giờ và địa điểm. Giá dịch vụ và phí di chuyển được hiển thị trước khi gửi yêu cầu.','Yêu cầu được lưu vào hệ thống. Lịch chỉ được xác nhận sau khi Hoàn kiểm tra thông tin và khoản cọc theo thỏa thuận.'],deposit:[`Mức cọc tiêu chuẩn hiện tại: ${money(Number(state.settings.deposit))}. Khoản cọc được trừ vào tổng chi phí.`,`Thông báo chuyển khoản không đồng nghĩa đã nhận tiền. Hoàn kiểm tra giao dịch thực tế trước khi ghi nhận.`,`Số tiền còn lại hiển thị trên trang lịch hẹn và được thanh toán sau buổi hẹn.`],change:['Bạn có thể gửi yêu cầu đổi ngày giờ trong trang quản lý lịch.','Yêu cầu trước giờ hẹn ít nhất 24 giờ được xem xét đổi miễn phí một lần, tùy lịch còn trống. Khoản cọc được chuyển sang lịch mới khi yêu cầu được duyệt.'],cancel:['Yêu cầu hủy trước 48 giờ được xem xét hoàn cọc. Trong vòng 48 giờ, khoản cọc có thể không được hoàn.','Số tiền và phương thức hoàn được Hoàn trao đổi trước khi xử lý. Trường hợp bất khả kháng được xem xét riêng.'],late:['Hãy liên hệ Hoàn nếu bạn dự kiến đến muộn hoặc cần thay đổi thời gian.','Nếu muộn quá 15 phút, thời lượng dịch vụ có thể cần điều chỉnh theo lịch tiếp theo.'],travel:['Hoàn phục vụ tại địa chỉ khách cung cấp trong khu vực đã thống nhất.','Phí di chuyển được thông báo trước khi đặt cọc. Nếu địa điểm thay đổi, chi phí cần được kiểm tra lại.'],privacy:['Thông tin liên hệ, địa điểm, lịch hẹn và mong muốn trang điểm được dùng để tổ chức buổi hẹn và hỗ trợ khách hàng.','Thông tin tình trạng da, dị ứng và ảnh tham khảo do bạn cung cấp giúp chuẩn bị dịch vụ.','Bạn có thể liên hệ Hoàn để yêu cầu kiểm tra, cập nhật hoặc xóa thông tin của mình.']};
    return ctPage('policies',policy[1],`<article class="ct-article">${(content[tab]||[]).map((t,i)=>`<section><h2>0${i+1}</h2><p>${t}</p></section>`).join('')}<div class="ct-actions"><a class="btn" href="#/policies">TẤT CẢ CHÍNH SÁCH</a><a class="btn" href="#/contact">LIÊN HỆ HOÀN</a></div></article>`,'Chính sách / '+policy[1]);
  }
  function contactLinks() {
    const b=state.brand;const phone=(b.phone||'').replace(/\D/g,'');const validPhone=phone&&phone!=='0901234567';
    return `${validPhone?`<a class="btn" href="https://zalo.me/${phone}" target="_blank" rel="noreferrer">${icon('mail')} Nhắn qua Zalo ${icon('arrow')}</a><a class="btn" href="tel:${phone}">${icon('phone')} ${esc(b.phone)}</a>`:''}${b.email?`<a class="btn" href="mailto:${esc(b.email)}">${icon('mail')} Gửi email</a>`:''}${!validPhone&&!b.email?'<p>Gửi lời nhắn bên cạnh để Hoàn liên hệ lại với bạn.</p>':''}`;
  }
  function pageContact() {
    return ctPage('contact','Trao đổi cùng Hoàn',`<p class="ct-subtitle">Chia sẻ mong muốn hoặc vấn đề bạn cần hỗ trợ.</p><section class="ct-contact"><aside><h2>Kết nối trực tiếp</h2>${contactLinks()}<hr><p>Bạn đã đặt lịch?</p><a class="link" href="#/lookup">Đến trang tra cứu lịch ${icon('arrow')}</a></aside><form data-form="contact" class="ct-form"><h2>Gửi lời nhắn</h2><div class="ct-form-grid">${field('name','Họ và tên','text',true,'')}${field('phone','Số điện thoại','tel',true,'')}</div>${field('email','Email (không bắt buộc)','email',false,'')}${selectField('subject','Nội dung cần trao đổi',['Tư vấn trang điểm','Đặt lịch','Đặt cọc & thanh toán','Đổi / hủy lịch','Vấn đề khác'])}${field('code','Mã lịch hẹn (nếu có)','text',false,'')}<label class="ct-field">Lời nhắn *<textarea name="message" required rows="5" maxlength="4000"></textarea></label><label class="ct-check"><input type="checkbox" required> Tôi đồng ý <a href="#/policies/privacy">chính sách bảo mật</a>.</label><button class="btn btn-dark btn-wide">GỬI LỜI NHẮN</button><p class="ct-form-status" role="status"></p></form></section>`,'Liên hệ');
  }
  function pageLookup() {
    return ctPage('lookup','Tra cứu lịch hẹn',`<p class="ct-subtitle">Xem trạng thái và quản lý lịch đã đặt cùng Hoàn.</p><form class="ct-lookup ct-form" data-form="lookup">${field('code','Mã lịch hẹn','text',true,'')}${field('phone','Số điện thoại đặt lịch','tel',true,'')}<button class="btn btn-dark btn-wide">TRA CỨU LỊCH HẸN</button><p class="ct-form-status" role="status"></p><p class="ct-secure">${icon('lock')} Thông tin được dùng để xác minh lịch của bạn.</p><p>Không nhớ mã lịch? <a class="link" href="#/contact">Liên hệ Hoàn ${icon('arrow')}</a></p></form>`,'Tra cứu lịch');
  }
  function progress(step) {
    const names=['Dịch vụ','Thời gian','Địa điểm','Thông tin','Đặt cọc','Xác nhận'];
    const stepRoutes = ['/booking/service', '/booking/time', '/booking/location', '/booking/info', '/booking/deposit', '/booking/confirm'];
    return `<nav class="booking-progress ct-progress" aria-label="Tiến trình đặt lịch">${names.map((t,i)=>`<div class="progress-step ${i+1===step?'active':''}" ${i+1===step?'aria-current="step"':''} data-action="go-step" data-target="${stepRoutes[i]}" style="cursor:pointer;" title="${t}"><b class="step-num">0${i+1}</b><span class="step-label">${t}</span></div>`).join('')}</nav>`;
  }
  function bookingShell(step,body,nextPath,nextLabel,summary='',hasCustomFooter=false) {
    return `<div class="page couture">${publicHeader()}<main id="main" class="ct-main ct-booking">${progress(step)}${body}${hasCustomFooter?'':`<footer class="ct-booking-footer"><div>${summary||`${esc(service().name)} · ${service().contact?'Tư vấn riêng':money(currentTotal())}`}</div><div class="ct-actions"><button class="btn" data-action="booking-back" data-step="${step}">Quay lại</button>${nextPath?`<button class="btn btn-dark" data-action="ct-next" data-next="${nextPath}" data-step="${step}">${nextLabel}</button>`:''}</div></footer>`}</main>${publicFooter()}</div>`;
  }
  function pageBookingService() {
    return bookingShell(1,`<h1 class="ct-title">Chọn dịch vụ trang điểm</h1><p class="ct-subtitle">Lựa chọn dành cho khoảnh khắc của bạn.</p><section class="ct-service-grid ct-select-services">${state.services.filter(s=>s.enabled).map(s=>`<button class="ct-service-option ${s.id===state.booking.serviceId?'selected':''}" data-action="booking-service" data-id="${s.id}"><img src="/assets/${imageFor(s)}" alt="${esc(s.name)}"><h2>${esc(s.name)}</h2><p>${s.contact?'Tư vấn riêng':`${money(s.price)} · ${s.duration} phút`}</p><span>${s.id===state.booking.serviceId?'✓ Đã chọn':'Chọn dịch vụ'}</span></button>`).join('')}</section>`,'/booking/time','TIẾP TỤC · THỜI GIAN');
  }
  function calendarMarkup() {
    const d=new Date((state.calendarMonth||state.booking.date).slice(0,7)+'-01T12:00:00');const y=d.getFullYear(),m=d.getMonth(),offset=(d.getDay()+6)%7;
    const today=localIso(new Date()),end=new Date();end.setDate(end.getDate()+Number(state.settings.bookingWindow||60));
    return `<div class="ct-calendar"><header><button class="icon-btn" data-action="ct-month" data-delta="-1" aria-label="Tháng trước">${icon('back')}</button><h3>Tháng ${m+1}, ${y}</h3><button class="icon-btn" data-action="ct-month" data-delta="1" aria-label="Tháng sau">${icon('arrow')}</button></header><div class="ct-calendar-grid">${['T2','T3','T4','T5','T6','T7','CN'].map(t=>`<span>${t}</span>`).join('')}${'<span></span>'.repeat(offset)}${Array.from({length:new Date(y,m+1,0).getDate()},(_,i)=>{const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;return `<button class="${iso===state.booking.date?'selected':''}" data-action="ct-date" data-date="${iso}" ${iso<today||iso>localIso(end)?'disabled':''} aria-label="${dateLabel(iso)}" aria-pressed="${iso===state.booking.date}">${i+1}</button>`}).join('')}</div></div>`;
  }
  function availableTimes() {
    return [...new Set(['07:00','08:00','09:30','10:00','13:00','14:00','15:30','16:00','18:00',...state.scheduleSlots.filter(s=>s.slotDate===state.booking.date).map(s=>s.slotTime)])].sort();
  }
  function pageBookingTime() {
    return bookingShell(2,`<h1 class="ct-title">Chọn ngày và giờ</h1><p class="ct-subtitle">Thời gian hiển thị theo giờ Việt Nam.</p><section class="ct-time-layout">${calendarMarkup()}<div><h2>Giờ bắt đầu · ${dateLabel()}</h2><div class="ct-time-slots">${availableTimes().map(t=>{const no=slotUnavailable(state.booking.date,t)||!state.settings.scheduleOpen;return `<button class="btn ${state.booking.time===t&&!no?'btn-dark':''}" data-action="time-select" data-time="${t}" ${no?'disabled':''}>${t}</button>`}).join('')}</div><p>${icon('clock')} Thời lượng: ${service().duration} phút</p><p class="muted">Giờ đã có lịch hoặc được chặn sẽ không thể chọn.</p></div></section>`,'/booking/location','TIẾP TỤC · ĐỊA ĐIỂM');
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
  function pageBookingDeposit() {
    const deposit=Math.min(Number(state.settings.deposit||200000),currentTotal());state.booking.deposit=deposit;
    return bookingShell(5,`<h1 class="ct-title">Đặt cọc giữ lịch</h1><p class="ct-subtitle">Kiểm tra toàn bộ chi phí trước khi gửi yêu cầu.</p><section class="ct-two-col"><article><p class="ct-overline">THANH TOÁN ĐẶT CỌC</p><h2>Quét mã. Giữ khoảnh khắc.</h2>${paymentQR()}${bankReady()?`<div class="ct-notice">Thông tin nhận tiền sẽ được hiển thị cùng mã lịch sau khi bạn hoàn tất yêu cầu.</div><div class="ct-money-row"><span>Ngân hàng</span><b>${esc(state.settings.bankName)}</b></div><div class="ct-money-row"><span>Chủ tài khoản</span><b>${esc(state.settings.bankOwner)}</b></div>`:`<div class="ct-notice">Hoàn sẽ gửi thông tin chuyển khoản khi tiếp nhận yêu cầu đặt lịch.</div>`}<p>Khoản cọc chỉ được ghi nhận sau khi Hoàn kiểm tra giao dịch thật.</p><a class="link" href="#/policies/deposit">Đặt cọc & thanh toán ${icon('arrow')}</a><form data-form="deposit" class="ct-form"><label class="ct-check"><input type="checkbox" name="depositConsent" ${state.booking.depositConsent?'checked':''} required> Tôi đã đọc và đồng ý chính sách đặt cọc.</label></form></article><aside class="ct-summary"><h2>Chi tiết thanh toán</h2><p>${esc(service().name)}<br>${dateLabel()} · ${state.booking.time}</p>${paymentRows(currentTotal(),deposit)}<p class="muted">Khoản cọc được trừ vào tổng chi phí.</p></aside></section>`,'/booking/confirm','TIẾP TỤC · XÁC NHẬN');
  }
  function pageBookingConfirm() {
    const b=state.booking;
    return bookingShell(6,`<h1 class="ct-title">Kiểm tra lịch hẹn</h1><section class="ct-two-col"><article><h2>Thông tin buổi hẹn</h2>${[['Dịch vụ',service().name,'service'],['Ngày giờ',dateLabel()+' · '+b.time,'time'],['Địa điểm',[b.address,b.ward,b.district,b.city].filter(Boolean).join(', '),'location'],['Phong cách',b.style,'info'],['Tình trạng da',b.skin,'info'],['Dị ứng',[b.allergy,b.allergyNote].filter(Boolean).join(' · '),'info'],['Khách hàng',b.name+' · '+b.phone,'info'],['Lời nhắn',b.note||'Không có','info']].map(([t,v,p])=>`<div class="ct-review-row"><span>${t}</span><b>${esc(v)}</b><a href="#/booking/${p}">Chỉnh sửa</a></div>`).join('')}<div class="ct-upload-previews">${(b.references||[]).map(r=>`<img src="${r}" alt="Ảnh phong cách đã chọn">`).join('')}</div></article><aside class="ct-summary"><h2>Yêu cầu đặt lịch</h2>${paymentRows(currentTotal(),b.deposit)}<p>Lịch được tạo ở trạng thái chờ xác nhận. Bạn theo dõi và thanh toán cọc tại trang lịch hẹn.</p><button class="btn btn-dark btn-wide" data-action="complete-booking">GỬI YÊU CẦU ĐẶT LỊCH</button></aside></section>`,null,'');
  }
  function getAppointment(code=bookingCode) {
    return state.appointments.find(a=>a.code===code);
  }
  function missingBooking() {
    return ctPage('lookup','Không tìm thấy lịch hẹn',`<div class="ct-center-cta"><p>Vui lòng tra cứu lại bằng mã lịch và số điện thoại của bạn.</p><a class="btn btn-dark" href="#/lookup">TRA CỨU LỊCH</a></div>`);
  }
  function pageBookingSuccess() {
    const a=getAppointment();if(!a)return missingBooking();
    return ctPage('lookup','Yêu cầu đặt lịch đã được ghi nhận',`<section class="ct-result"><div class="success-icon">${icon('check')}</div><p>Hoàn sẽ kiểm tra thông tin và khoản cọc để xác nhận lịch của bạn.</p><p class="ct-overline">MÃ LỊCH HẸN</p><h2>${esc(a.code)}</h2><div class="ct-status">${a.paymentStatus==='pending_verification'?'Chờ đối soát':'Chưa thanh toán cọc'} · ${statusLabel(a.status)}</div><div class="ct-summary"><h2>${esc(service(a.serviceId).name)}</h2><p>${dateLabel(a.date)} · ${a.time}</p><p>${esc([a.address,a.ward,a.district].filter(Boolean).join(', '))}</p><div class="ct-money-row"><span>Tổng chi phí</span><strong>${money(a.total)}</strong></div></div><a class="btn btn-dark" href="#/booking/${a.code}">XEM & QUẢN LÝ LỊCH HẸN</a></section>`,'Đặt lịch / Kết quả');
  }
  function pageBookingDetail(code) {
    const a=getAppointment(code);if(!a)return missingBooking();const meta=state.bookingDetails?.[code]||{};const s=service(a.serviceId);const needed=Number(meta.depositRequired||Math.min(Number(state.settings.deposit),a.total));
    return ctPage('lookup','Chi tiết lịch hẹn',`<div class="ct-detail-top"><b>${esc(a.code)}</b><span class="ct-status">${statusLabel(a.status)}</span><span class="ct-status">${a.paymentStatus==='received'?'Đã nhận cọc':a.paymentStatus==='pending_verification'?'Chờ đối soát':'Chưa thanh toán'}</span></div><section class="ct-two-col"><article><h2>Thông tin buổi hẹn</h2>${[['Dịch vụ',s.name],['Ngày',dateLabel(a.date)],['Giờ bắt đầu',a.time],['Địa điểm',[a.address,a.ward,a.district,meta.city].filter(Boolean).join(', ')],['Khách hàng',a.customer],['Điện thoại',a.phone],['Phong cách',a.style],['Ghi chú',a.note]].map(([t,v])=>`<div class="ct-money-row"><span>${t}</span><b>${esc(v||'—')}</b></div>`).join('')}<div class="ct-upload-previews">${(meta.references||[]).map(r=>`<img src="${r}" alt="Ảnh phong cách tham khảo">`).join('')}</div>${meta.skin?`<p>Tình trạng da: ${esc(meta.skin)} · Dị ứng: ${esc(meta.allergy)} ${esc(meta.allergyNote||'')}</p>`:''}<div class="ct-actions">${a.status!=='cancelled'&&a.status!=='completed'?`<a class="btn" href="#/booking/${code}/reschedule">Yêu cầu đổi lịch</a><a class="btn" href="#/booking/${code}/cancel">Yêu cầu hủy / hoàn cọc</a>`:''}<button class="btn" data-action="ct-calendar-download" data-code="${code}">Thêm vào lịch</button></div><h3>Chuẩn bị cho buổi hẹn</h3><p>Giữ da sạch và dưỡng ẩm nhẹ. Chuẩn bị ảnh trang phục, phong cách nếu có.</p><a class="link" href="#/contact">Liên hệ Hoàn ${icon('arrow')}</a>${(state.requests||[]).filter(r=>r.code===code).map(r=>`<div class="ct-notice"><b>${esc(r.subject)}</b><p>${esc(r.status==='resolved'?'Đã xử lý':'Chờ xử lý')}</p>${r.reply?`<p>${esc(r.reply)}</p>`:''}</div>`).join('')}</article><aside class="ct-summary"><h2>Thanh toán</h2>${paymentRows(a.total,needed,a.deposit,meta.travelFee??Math.max(0,a.total-s.price))}${a.deposit>0?`<a class="btn btn-dark btn-wide" href="#/booking/${code}/receipt">XEM BIÊN NHẬN</a>`:''}${a.deposit<needed&&a.status!=='cancelled'?paymentInstructions(a):''}<button class="btn btn-wide" data-action="ct-refresh">KIỂM TRA TRẠNG THÁI</button></aside></section>`,'Tra cứu lịch / '+code);
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
    ['reports','report','Báo cáo'],['permissions','shield','Phân quyền'],['audit','log','Nhật ký'],['settings','settings','Cài đặt']
  ];

  function adminShell(active, body, title, subtitle, actions = '') {
    const groups = [
      ['VẬN HÀNH',['overview','appointments','schedule']],
      ['DỮ LIỆU',['services','customers','payments','promotions']],
      ['NỘI DUNG',['gallery','content','notifications']],
      ['HỆ THỐNG',['reports','permissions','audit','settings']]
    ];
    return `<div class="admin-page"><header class="admin-top"><a class="admin-brand" href="#/admin">HOÀN <small>QUẢN TRỊ VẬN HÀNH</small></a><label class="admin-search-wrap">${icon('search')}<input class="admin-search" id="admin-global-search" placeholder="Tìm lịch hẹn, khách hàng hoặc giao dịch..."></label><div class="admin-user"><button class="admin-notification" aria-label="Thông báo">${icon('bell')}<b>3</b></button><span class="system-label"><i class="status-dot"></i> Hệ thống ổn định</span><span class="admin-profile"><i>HN</i><span>Hoàn Nguyễn<small>Quản trị viên</small></span></span></div></header><div class="admin-layout"><aside class="admin-sidebar">${groups.map(g=>`<div class="admin-group-title">${g[0]}</div>${g[1].map(key=>{const l=adminLinks.find(x=>x[0]===key);return `<a class="admin-link ${active===key?'active':''}" href="#/admin/${key==='overview'?'':key}">${icon(l[1],l[2])}<span>${l[2]}</span></a>`}).join('')}`).join('')}</aside><main id="main" class="admin-content"><header class="admin-head"><div>${active==='overview'?'<div class="admin-kicker">TRUNG TÂM VẬN HÀNH</div>':''}<h1>${title}</h1><p>${subtitle}</p></div><div class="admin-head-actions">${actions}</div></header>${body}</main></div></div>`;
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
    return `<div class="table-wrap"><table class="data-table"><thead><tr><th>Giờ</th><th>Khách hàng</th><th>Dịch vụ</th><th>Khu vực</th><th>Thanh toán</th><th>Trạng thái</th><th></th></tr></thead><tbody>${rows.length?rows.map(a=>`<tr><td class="numeric">${a.time}</td><td><b>${a.customer}</b><br><small class="numeric">${a.phone}</small></td><td>${service(a.serviceId).name}</td><td>${a.district||'—'}</td><td class="numeric">${a.deposit>0?'Đã cọc '+money(a.deposit):'Chờ đối soát'}</td><td><span class="badge ${a.status==='confirmed'?'success':a.status==='pending'?'warning':''}">${statusLabel(a.status)}</span></td><td><div class="table-actions"><button class="mini-action" data-action="admin-view-appointment" data-code="${a.code}">Xem</button><button class="mini-action" data-action="admin-status" data-code="${a.code}">Đổi trạng thái</button></div></td></tr>`).join(''):'<tr><td colspan="7"><div class="empty-table">Chưa có lịch hẹn. Lịch khách đặt sẽ xuất hiện tại đây.</div></td></tr>'}</tbody></table></div>`;
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

  function adminSchedule() {
    const times = ['08:00','09:30','11:00','13:00','15:00','16:30','19:00'];
    const monday=mondayForOffset(state.adminWeekOffset);
    const dayDates=Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);return d});
    const dayNames=['T2','T3','T4','T5','T6','T7','CN'];
    const defaultOpen=[[0,1,3,5,6],[0,2,4,5],[1,3,4],[0,2,3,6],[1,2,5],[0,1,4],[0,3,6]];
    const range=`${String(dayDates[0].getDate()).padStart(2,'0')}—${String(dayDates[6].getDate()).padStart(2,'0')} tháng ${dayDates[6].getMonth()+1}, ${dayDates[6].getFullYear()}`;
    const cell=(time,ri,date,di)=>{
      const iso=localIso(date);
      const appointment=state.appointments.find(a=>a.date===iso&&a.time===time&&a.status!=='cancelled');
      const record=slotRecord(iso,time);
      const available=record?record.status==='available':defaultOpen[ri].includes(di);
      if(appointment)return `<button class="schedule-cell occupied" disabled><span class="schedule-slot busy">Đã có lịch</span></button>`;
      return `<button class="schedule-cell ${available?'is-available':''}" data-action="schedule-cell" data-time="${time}" data-date="${iso}" data-status="${available?'available':'blocked'}">${available?'<span class="schedule-slot">Còn trống</span>':''}</button>`;
    };
    const body = `<div class="schedule-toolbar"><div class="week-controls"><button class="btn btn-sm" data-action="week-prev">${icon('back')} Tuần trước</button><b class="numeric">${range}</b><button class="btn btn-sm" data-action="week-next">Tuần sau ${icon('arrow')}</button></div><div class="schedule-state"><span><i class="status-dot"></i> ${state.settings.scheduleOpen?'Đang mở nhận lịch':'Đang tạm dừng nhận lịch'}</span><button class="toggle ${state.settings.scheduleOpen?'on':''}" data-action="toggle-schedule" aria-label="Bật tắt nhận lịch"></button></div></div><div class="schedule-wrap"><div class="schedule-grid"><div class="schedule-cell head">Giờ</div>${dayDates.map((d,i)=>`<div class="schedule-cell head">${dayNames[i]} · ${String(d.getDate()).padStart(2,'0')}</div>`).join('')}${times.map((t,ri)=>`<div class="schedule-cell head numeric">${t}</div>${dayDates.map((d,di)=>cell(t,ri,d,di)).join('')}`).join('')}</div></div><p class="schedule-note">Nhấp vào ô để mở hoặc chặn khung giờ. Thay đổi được lưu trực tiếp vào dữ liệu lịch làm việc.</p>`;
    return adminShell('schedule',body,'Lịch làm việc','Thiết lập khung giờ nhận lịch, ngày nghỉ và thời gian di chuyển.',`<button class="btn" data-action="block-time">${icon('plus')} Chặn khung giờ</button><button class="btn btn-dark" data-action="save-schedule">${icon('check')} Lưu lịch làm việc</button>`);
  }

  function adminServices() {
    const body = `<div class="admin-card-grid">${state.services.map((s,i)=>`<article class="admin-card"><div class="section-head"><span class="wine">0${i+1}</span><button class="toggle ${s.enabled?'on':''}" data-action="toggle-service" data-id="${s.id}" aria-label="Bật tắt ${s.name}"></button></div><h3>${s.name}</h3><p class="muted">${s.description}</p><div class="summary-row"><span>Thời lượng</span><b>${s.duration} phút</b></div><div class="summary-row"><span>Giá</span><b>${s.contact?'Liên hệ':money(s.price)}</b></div><div class="admin-card-actions"><button class="btn btn-sm" data-action="edit-service" data-id="${s.id}">${icon('edit')} Chỉnh sửa</button><button class="btn btn-sm btn-danger" data-action="delete-service" data-id="${s.id}">${icon('trash')} Xóa</button></div></article>`).join('')}</div>`;
    return adminShell('services',body,'Dịch vụ','Quản lý nội dung, thời lượng, giá và trạng thái hiển thị.',`<button class="btn btn-dark" data-action="add-service">${icon('plus')} Thêm dịch vụ</button>`);
  }

  function adminCustomers() {
    const body = `<div class="toolbar"><input id="customer-search" placeholder="Tìm tên, số điện thoại, email..."><select><option>Tất cả khách hàng</option><option>Khách quay lại</option><option>Khách mới</option></select></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Khách hàng</th><th>Liên hệ</th><th>Số lần đặt</th><th>Tổng chi tiêu</th><th>Ghi chú</th><th></th></tr></thead><tbody id="customer-body">${state.customers.map((c,i)=>`<tr><td><b>${c.name}</b></td><td>${c.phone}<br><small>${c.email}</small></td><td>${c.visits}</td><td>${money(c.spent)}</td><td>${c.note}</td><td><button class="mini-action" data-action="edit-customer" data-index="${i}">Chỉnh sửa</button></td></tr>`).join('')}</tbody></table></div>`;
    return adminShell('customers',body,'Khách hàng','Lịch sử đặt lịch, thông tin liên hệ và ghi chú phục vụ.',`<button class="btn" data-action="export-customers">${icon('download')} Xuất danh sách</button><button class="btn btn-dark" data-action="add-customer">${icon('plus')} Thêm khách hàng</button>`);
  }

  function adminPayments() {
    const rows = state.appointments;
    const received=rows.filter(r=>r.paymentStatus==='received').reduce((n,r)=>n+Number(r.deposit||0),0);
    const pending=rows.filter(r=>r.paymentStatus==='pending_verification').length;
    const refund=rows.filter(r=>r.status==='cancelled'&&r.deposit>0).reduce((n,r)=>n+Number(r.deposit),0);
    const due=rows.filter(r=>r.status!=='cancelled').reduce((n,r)=>n+Math.max(0,Number(r.total)-Number(r.deposit||0)),0);
    const body = `<section class="stat-grid"><div class="stat-card"><small>Đã nhận tháng này</small><strong class="numeric">${money(received)}</strong></div><div class="stat-card"><small>Chờ đối soát</small><strong class="numeric">${String(pending).padStart(2,'0')}</strong></div><div class="stat-card"><small>Cần hoàn</small><strong class="numeric">${money(refund)}</strong></div><div class="stat-card"><small>Còn phải thu</small><strong class="numeric">${money(due)}</strong></div></section><div class="toolbar"><input id="payment-search" placeholder="Tìm mã lịch hoặc khách hàng..."><select><option>Tất cả giao dịch</option><option>Đã nhận</option><option>Chờ đối soát</option><option>Hoàn cọc</option></select></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Mã lịch</th><th>Khách hàng</th><th>Số tiền</th><th>Thời gian tạo</th><th>Trạng thái</th><th></th></tr></thead><tbody>${rows.length?rows.map(r=>`<tr><td class="numeric">${r.code}</td><td>${r.customer}</td><td><b class="numeric">${money(r.deposit||0)}</b></td><td class="numeric">${r.createdAt||'—'}</td><td><span class="badge ${r.paymentStatus==='received'?'success':'warning'}">${r.paymentStatus==='received'?'Đã nhận':r.paymentStatus==='pending_verification'?'Chờ đối soát':'Chưa thanh toán'}</span></td><td>${r.deposit>0?`<button class="mini-action" data-action="payment-receipt" data-code="${r.code}">Biên nhận</button>`:`<button class="mini-action" data-action="manual-payment" data-code="${r.code}">Ghi nhận cọc</button>`}</td></tr>`).join(''):'<tr><td colspan="6"><div class="empty-table">Chưa có giao dịch đặt cọc.</div></td></tr>'}</tbody></table></div>`;
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
    const b = state.brand;
    const body = `<section class="content-editor"><nav class="content-tabs">${['Trang đặt lịch','Hình ảnh đại diện','Thông điệp','Dịch vụ hiển thị','Màu giao diện','Liên kết hỗ trợ','Chính sách đặt lịch'].map((t,i)=>`<button class="${i===0?'active':''}">${t}</button>`).join('')}</nav><form class="content-form" data-form="content"><h2>Trang đặt lịch</h2><div class="form-grid"><div class="field"><label>Tên thương hiệu</label><input name="name" value="${b.name}"></div><div class="field"><label>Vai trò</label><input name="role" value="${b.role}"></div><div class="field full"><label>Tiêu đề chính</label><input name="headline" value="${b.headline}"></div><div class="field full"><label>Mô tả</label><textarea name="description">${b.description}</textarea></div><div class="field full"><label>Thông điệp trên ảnh</label><input name="imageMessage" value="${b.imageMessage}"></div></div><h3>Dịch vụ hiển thị</h3>${state.services.map((s,i)=>`<div class="summary-row"><span>⋮⋮ 0${i+1} · ${s.name}</span><span>${s.duration} phút · ${s.contact?'Liên hệ':money(s.price)}</span><button type="button" class="mini-action icon-only" data-action="edit-service" data-id="${s.id}" aria-label="Chỉnh sửa ${s.name}">${icon('edit')}</button></div>`).join('')}<div class="form-grid" style="margin-top:18px"><div class="field"><label>Màu nhấn</label><input name="accent" value="${b.accent}"></div><div class="field"><label>Nền</label><input value="Trắng tinh" disabled></div></div><button class="btn btn-dark btn-wide" style="margin-top:18px">${icon('check')} Lưu nội dung</button></form><div class="content-preview"><div class="section-head"><h2>Xem trước trang đặt lịch</h2><a class="link" href="#/booking/service">Mở đầy đủ</a></div><div class="preview-browser"><div class="preview-bar"><i class="preview-dot"></i><i class="preview-dot"></i><i class="preview-dot"></i><span style="margin:auto">hoanmakeup.com</span></div><div class="preview-site"><div class="preview-art">${img('hero.png','Ảnh đại diện')}<span>HOÀN</span></div><div class="preview-ui"><div class="preview-progress">${[1,2,3,4,5,6].map(()=>'<i></i>').join('')}</div><h3>Chọn trải nghiệm trang điểm</h3><p>${b.description}</p><div class="preview-services">${state.services.map(s=>`<div class="preview-service ${s.id==='party'?'selected':''}"><b>${s.name}</b><br>${s.duration} phút · ${s.contact?'Liên hệ':money(s.price)}</div>`).join('')}</div></div></div></div></div></section>`;
    return adminShell('content',body,'Nội dung website','Chỉnh sửa thông tin hiển thị cho khách hàng.',`<a class="btn" href="#/">${icon('eye')} Xem trước website</a><button class="btn btn-dark" data-action="publish-content">${icon('check')} Đăng thay đổi</button>`);
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

  function modal(title, content, confirmLabel = 'Lưu', onConfirm = '') {
    $('#modal-root').innerHTML = `<div class="modal-backdrop" role="presentation" data-action="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><h2 id="modal-title">${title}</h2><div>${content}</div><div class="modal-actions"><button class="btn" data-action="close-modal">Hủy</button><button class="btn btn-dark" data-action="modal-confirm" data-confirm="${onConfirm}">${confirmLabel}</button></div></section></div>`;
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
    if (!main || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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

  function render() {
    const raw = location.hash.slice(1) || '/';
    const [path, queryString=''] = raw.split('?');
    const query = new URLSearchParams(queryString);
    const parts = path.split('/').filter(Boolean);
    let html = '';
    if (path === '/') html = pageHome();
    else if (path === '/services') html = pageServices();
    else if (parts[0] === 'services' && parts[1]) html = pageServiceDetail(parts[1]);
    else if (path === '/gallery') html = pageGallery(query.get('filter') || 'all');
    else if (parts[0] === 'look') html = pageLook();
    else if (path === '/about') html = pageAbout();
    else if (path === '/support') html = pageSupport();
    else if (path === '/policies') html = pagePolicies(query.get('tab'));
    else if (parts[0] === 'policies' && parts[1]) html = pagePolicies(parts[1]);
    else if (parts[0] === 'support' && parts[1]) html = pageHelpArticle(parts[1]);
    else if (path === '/contact') html = pageContact();
    else if (path === '/search') html = pageSearch();
    else if (path === '/admin/requests') html = adminRequests();
    else if (path === '/booking/service') html = pageBookingService();
    else if (path === '/booking/time') html = pageBookingTime();
    else if (path === '/booking/location') html = pageBookingLocation();
    else if (path === '/booking/info') html = pageBookingInfo();
    else if (path === '/booking/deposit') html = pageBookingDeposit();
    else if (path === '/booking/confirm') html = pageBookingConfirm();
    else if (path === '/booking/success') html = pageBookingSuccess();
    else if (path === '/lookup') html = pageLookup();
    else if (parts[0] === 'booking' && parts[1] && parts[2] === 'reschedule') html = pageReschedule(parts[1]);
    else if (parts[0] === 'booking' && parts[1] && parts[2] === 'cancel') html = pageCancel(parts[1]);
    else if (parts[0] === 'booking' && parts[1] && parts[2] === 'receipt') html = pageReceipt(parts[1]);
    else if (parts[0] === 'booking' && parts[1]) html = pageBookingDetail(parts[1]);
    else if (path === '/admin' || path === '/admin/') html = adminOverview();
    else if (path === '/admin/appointments') html = adminAppointments();
    else if (path === '/admin/schedule') html = adminSchedule();
    else if (path === '/admin/services') html = adminServices();
    else if (path === '/admin/customers') html = adminCustomers();
    else if (path === '/admin/payments') html = adminPayments();
    else if (path === '/admin/promotions') html = adminPromotions();
    else if (path === '/admin/gallery') html = adminGallery();
    else if (path === '/admin/content') html = adminContent();
    else if (path === '/admin/notifications') html = adminNotifications();
    else if (path === '/admin/reports') html = adminReports();
    else if (path === '/admin/permissions') html = adminPermissions();
    else if (path === '/admin/audit') html = adminAudit();
    else if (path === '/admin/settings') html = adminSettings();
    else html = `<div class="page">${publicHeader()}<main class="help-wrap"><h1>Không tìm thấy trang</h1><a class="btn btn-dark" href="#/">Về trang chủ</a></main></div>`;
    $('#app').innerHTML = html;
    window.scrollTo(0,0);
    mountCoutureMotion(path);
    document.title = path.startsWith('/admin') ? 'Quản trị — HOÀN' : 'HOÀN — Makeup Artist';
  }

  function adminRequests() {
    const rows=(state.requests||[]).slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
    return adminShell('requests',`<div class="table-wrap"><table class="data-table"><thead><tr><th>Mã</th><th>Khách hàng</th><th>Nội dung</th><th>Trạng thái</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.id)}<br>${esc(r.code)}</td><td>${esc(r.name)}<br>${esc(r.phone)}</td><td><b>${esc(r.subject)}</b><p>${esc(r.message)}</p>${r.date?`<p>Ngày giờ đề nghị: ${esc(r.date)} ${esc(r.time)}</p>`:''}${r.reply?`<p>Phản hồi: ${esc(r.reply)}</p>`:''}</td><td>${r.status==='resolved'?'Đã xử lý':'Chờ xử lý'}</td><td>${r.code?`<a class="btn btn-sm" href="#/booking/${r.code}">Xem lịch</a>`:''}<button class="btn btn-sm" data-action="ct-resolve" data-id="${esc(r.id)}">Ghi nhận xử lý</button></td></tr>`).join('')||'<tr><td colspan="5">Chưa có yêu cầu hỗ trợ.</td></tr>'}</tbody></table></div>`,'Yêu cầu hỗ trợ','Lời nhắn, yêu cầu đổi lịch và hủy / hoàn cọc từ website.');
  }
  document.addEventListener('submit',async event=>{
    const form=event.target,kind=form.dataset.form;
    if(!['contact','booking-request','site-search','support-search','resolve-request','contact-settings'].includes(kind))return;
    event.preventDefault();event.stopImmediatePropagation();const data=Object.fromEntries(new FormData(form));
    if(kind==='site-search'||kind==='support-search')return route('/'+(kind==='site-search'?'search':'support')+'?q='+encodeURIComponent(data.q||''));
    if(kind==='contact-settings'){try{await api({action:'saveContent',key:'brand',value:{...state.brand,...data}});Object.assign(state.brand,data);toast('Đã lưu thông tin liên hệ');}catch(error){toast(error.message);}return;}
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
  });
  document.addEventListener('click',async event=>{
    const el=event.target.closest('[data-action]');if(!el||!el.dataset.action.startsWith('ct-')&&el.dataset.action!=='look-book')return;
    const action=el.dataset.action;event.preventDefault();event.stopImmediatePropagation();
    try{
      if(action==='ct-next'){
        const step=Number(el.dataset.step),form=document.querySelector('.ct-booking form');
        if(form){if(!form.reportValidity())return;Object.assign(state.booking,Object.fromEntries(new FormData(form)));for(const box of form.querySelectorAll('input[type=checkbox][name]'))state.booking[box.name]=box.checked;}
        if(step===1&&service().contact)return route('/contact');
        if(step===2){if(!state.booking.time||slotUnavailable(state.booking.date,state.booking.time)||!state.settings.scheduleOpen)return toast('Vui lòng chọn một khung giờ còn trống.');}
        if(step===3){state.booking.locationType='client';state.booking.travelFee=Number(state.settings.travelFee||50000);}
        saveState();route(el.dataset.next);
      }else if(action==='ct-date'){state.booking.date=el.dataset.date;state.booking.time='';saveState();render();}
      else if(action==='ct-month'){const d=new Date((state.calendarMonth||state.booking.date).slice(0,7)+'-01T12:00:00');d.setMonth(d.getMonth()+Number(el.dataset.delta));state.calendarMonth=localIso(d);render();}
      else if(action==='look-book'){state.booking.serviceId=el.dataset.id;state.booking.style=el.dataset.style;saveState();route(service().contact?'/contact':'/booking/time');}
      else if(action==='ct-copy'){await navigator.clipboard.writeText(el.dataset.value);toast('Đã sao chép');}
      else if(action==='ct-refresh'){await hydrateBackend();toast('Đã cập nhật trạng thái');}
      else if(action==='ct-payment-report'){el.disabled=true;const r=await api({action:'reportPayment',code:el.dataset.code});Object.assign(getAppointment(el.dataset.code),r.appointment);render();toast('Đã thông báo, đang chờ đối soát');}
      else if(action==='ct-calendar-download'){const a=getAppointment(el.dataset.code);const d=new Date(a.date+'T'+a.time+':00+07:00'),end=new Date(d.getTime()+service(a.serviceId).duration*60000),fmt=d=>d.toISOString().replace(/[-:]/g,'').replace('.000','');downloadText('lich-'+a.code+'.ics',['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//HOAN//Booking//VI','BEGIN:VEVENT','UID:'+a.code+'@hoan','DTSTAMP:'+fmt(new Date()),'DTSTART:'+fmt(d),'DTEND:'+fmt(end),'SUMMARY:'+service(a.serviceId).name+' - HOÀN','STATUS:'+(a.status==='confirmed'?'CONFIRMED':'TENTATIVE'),'END:VEVENT','END:VCALENDAR'].join('\r\n'));}
      else if(action==='ct-resolve'){const r=state.requests.find(x=>x.id===el.dataset.id);modal('Ghi nhận xử lý yêu cầu',`<p>${esc(r.subject)} · ${esc(r.code)}</p><p>Để đổi thời gian hoặc hủy lịch, cập nhật lịch hẹn trong quản trị trước khi ghi nhận kết quả.</p><form data-form="resolve-request" class="ct-form"><input type="hidden" name="id" value="${esc(r.id)}"><label>Kết quả xử lý<textarea name="reply" required>${esc(r.reply||'')}</textarea></label><button class="btn btn-dark">LƯU KẾT QUẢ</button></form>`,'Đóng','ct-dismiss');document.querySelector('[data-confirm="ct-dismiss"]')?.remove();}
    }catch(error){toast(error.message);el.disabled=false;}
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
      Object.assign(state.brand, data);
      try { await api({action:'saveContent',key:'brand',value:state.brand}); toast('Đã lưu nội dung website vào dữ liệu thật'); render(); }
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
    else if (action === 'date-select') { state.booking.date = '2026-09-'+String(el.dataset.day).padStart(2,'0'); saveState(); render(); }
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
      if(!b.consent||!b.depositConsent){toast('Vui lòng kiểm tra và đồng ý các chính sách trước khi gửi.');return route('/booking/info');}
      if(!b.name.trim()||!b.phone.trim()) { toast('Vui lòng nhập họ tên và số điện thoại trước khi hoàn tất'); return route('/booking/info'); }
      if(b.locationType==='client'&&!b.address.trim()) { toast('Vui lòng nhập địa chỉ phục vụ'); return route('/booking/location'); }
      el.disabled=true; el.textContent='Đang lưu lịch hẹn...';
      try {
        const result=await api({action:'createAppointment',...b,customer:b.name});
        bookingCode=result.appointment.code;
        localStorage.setItem('hoanLastBookingCode',bookingCode);
        state.appointments.unshift(result.appointment);
        await hydrateBackend(true);
        route('/booking/success'); render();
      } catch(error) { toast(error.message); el.disabled=false; render(); }
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
    else if (action === 'new-appointment') { const d=new Date();d.setDate(d.getDate()+1);modal('Tạo lịch hẹn mới',`<div class="form-grid"><div class="field full"><label>Khách hàng</label><input id="modal-customer" placeholder="Họ và tên"></div><div class="field"><label>Dịch vụ</label><select id="modal-service">${state.services.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</select></div><div class="field"><label>Ngày</label><input id="modal-date" type="date" value="${localIso(d)}"></div><div class="field"><label>Giờ</label><input id="modal-time" type="time" value="09:30"></div><div class="field"><label>Số điện thoại</label><input id="modal-phone" placeholder="Số điện thoại"></div></div>`,'Tạo lịch','create-appointment'); }
    else if (action === 'admin-status') { const a=getAppointment(el.dataset.code); modal('Cập nhật trạng thái',`<div class="field"><label>Trạng thái mới</label><select id="modal-status"><option value="confirmed">Đã xác nhận</option><option value="pending">Chờ xác nhận</option><option value="completed">Đã hoàn thành</option><option value="cancelled">Đã hủy</option></select></div><div class="form-grid"><div class="field"><label>Ngày hẹn</label><input id="modal-appointment-date" type="date" value="${a.date}"></div><div class="field"><label>Giờ bắt đầu</label><input id="modal-appointment-time" type="time" value="${a.time}"></div></div>`,'Cập nhật','update-status:'+a.code); }
    else if (action === 'admin-view-appointment') route('/booking/'+el.dataset.code);
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
    else if (action === 'edit-gallery') toast('Đã chọn ảnh để chỉnh sửa nội dung');
    else if (action === 'publish-content') { try{await api({action:'saveContent',key:'brand',value:state.brand});toast('Đã đăng thay đổi lên website');}catch(error){toast(error.message)} }
    else if (action === 'new-notification') modal('Soạn thông báo',`<div class="field"><label>Tiêu đề</label><input id="modal-notification-title" value="Nhắc lịch hẹn"></div><div class="field"><label>Kênh</label><select id="modal-notification-channel"><option>Zalo</option><option>Email</option><option>Zalo + Email</option></select></div><div class="field"><label>Nội dung</label><textarea id="modal-notification-body">Lịch hẹn của bạn sẽ diễn ra vào ngày mai.</textarea></div>`,'Gửi thông báo','send-notification');
    else if (action === 'resend-notification') toast('Đã gửi lại thông báo');
    else if (action === 'permission-toggle') { el.classList.toggle('on'); toast('Đã cập nhật quyền hiển thị'); }
    else if (action === 'setting-toggle' || action === 'toggle-schedule') { el.classList.toggle('on'); if(action==='setting-toggle') state.settings[el.dataset.key]=el.classList.contains('on'); else state.settings.scheduleOpen=el.classList.contains('on'); try{await api({action:'saveContent',key:'settings',value:state.settings});toast('Đã cập nhật thiết lập');render();}catch(error){toast(error.message)} }
    else if (action === 'reset-settings') { state.settings=structuredClone(defaultState.settings); saveState('Đã khôi phục cài đặt mặc định'); render(); }
    else if (action === 'week-prev') { state.adminWeekOffset--; saveState(); render(); }
    else if (action === 'week-next') { state.adminWeekOffset++; saveState(); render(); }
    else if (action === 'schedule-cell') { const status=el.dataset.status==='available'?'blocked':'available';try{await api({action:'setScheduleSlot',date:el.dataset.date,time:el.dataset.time,status});const existing=slotRecord(el.dataset.date,el.dataset.time);if(existing)existing.status=status;else state.scheduleSlots.push({slotDate:el.dataset.date,slotTime:el.dataset.time,status});toast(status==='available'?'Đã mở khung giờ':'Đã chặn khung giờ');render();}catch(error){toast(error.message)} }
    else if (action === 'save-schedule') toast('Lịch làm việc đã được lưu trực tiếp');
    else if (action === 'block-time') modal('Chặn khung giờ',`<div class="form-grid"><div class="field"><label>Ngày</label><input id="modal-block-date" type="date"></div><div class="field"><label>Giờ bắt đầu</label><input id="modal-block-time" type="time"></div></div><div class="field"><label>Lý do</label><input id="modal-block-reason" value="Việc cá nhân"></div>`,'Chặn giờ','block-time');
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
    if (action === 'create-appointment') {
      try {
        const result=await api({action:'createAppointment',customer:$('#modal-customer').value,phone:$('#modal-phone').value,serviceId:$('#modal-service').value,date:$('#modal-date').value,time:$('#modal-time').value,travelFee:0});
        state.appointments.unshift(result.appointment); await hydrateBackend(true); toast('Đã tạo lịch hẹn mới');
      } catch(error) { toast(error.message); return; }
    } else if (action.startsWith('update-status:')) {
      try { const code=action.split(':')[1];const result=await api({action:'updateAppointment',code,status:$('#modal-status').value,date:$('#modal-appointment-date')?.value,time:$('#modal-appointment-time')?.value});Object.assign(getAppointment(code),result.appointment);toast('Đã cập nhật trạng thái lịch'); }
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
  const finePointer = () => matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1101px)').matches;
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
    const veil=document.querySelector('.nav-veil');if(veil)veil.hidden=false;
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
  if (!location.hash) location.hash = '#/';
  render();
  hydrateBackend();
})();
