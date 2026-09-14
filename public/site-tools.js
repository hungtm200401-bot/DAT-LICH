// Shared CMS preview and first-party pseudonymous visit analytics. No Meta pixel,
// fingerprinting, IP storage, form-field harvesting, or inferred identity.
export const publicPages = [
  ['/', 'Trang chủ'], ['/about', 'Về Hoàn'], ['/services', 'Danh sách dịch vụ'],
  ...['personal', 'party', 'photo', 'bridal'].map((id, i) => ['/services/' + id, ['Cá nhân', 'Dự tiệc', 'Chụp ảnh', 'Cô dâu'][i]]),
  ['/gallery', 'Bộ sưu tập'], ...['natural', 'evening', 'bridal', 'detail', 'portrait'].map(id => ['/look/' + id, 'Bộ ảnh · ' + id]),
  ['/contact', 'Liên hệ'], ['/support', 'Trung tâm hỗ trợ'],
  ...['booking', 'lookup', 'deposit', 'verification', 'receipt', 'reschedule', 'cancel', 'refund', 'preparation', 'reference'].map((id, i) => ['/support/' + id, 'Hướng dẫn · ' + ['Đặt lịch', 'Tra cứu', 'Đặt cọc', 'Đối soát', 'Biên nhận', 'Đổi lịch', 'Hủy lịch', 'Hoàn cọc', 'Chuẩn bị', 'Ảnh tham khảo'][i]]),
  ['/policies', 'Danh sách chính sách'], ...['booking', 'deposit', 'change', 'cancel', 'late', 'travel', 'privacy'].map((id, i) => ['/policies/' + id, 'Chính sách · ' + ['Đặt lịch', 'Đặt cọc', 'Đổi lịch', 'Hủy lịch', 'Đến trễ', 'Di chuyển', 'Bảo mật'][i]]),
  ['/lookup', 'Tra cứu lịch'], ['/search', 'Tìm kiếm'],
  ...['service', 'time', 'location', 'info', 'deposit', 'confirm', 'success'].map((id, i) => ['/booking/' + id, 'Đặt lịch · ' + ['Dịch vụ', 'Thời gian', 'Địa điểm', 'Thông tin', 'Đặt cọc', 'Xác nhận', 'Kết quả'][i]]),
];

export function createSiteTools(ctx) {
  const { esc, toast, icon } = ctx;
  const q = selector => document.querySelector(selector);
  const currentPath = () => (location.hash.slice(1) || '/').split('?')[0];
  const isPreview = window.parent !== window && new URLSearchParams(location.search).get('cmsPreview') === '1';
  const isAdmin = () => currentPath().startsWith('/admin');
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* storage may be blocked */ } },
  };
  let pages = {}, selected = '/', draft = {}, revision = '', dirty = false, descriptors = [], framePath = '';
  let report = null, reportError = '', reportLoading = false, offset = 0, days = '7', source = '', onlyActive = false;
  let detailSession = '', detailOffset = 0;
  let activeVisitorTab = 'all', visitorSearchQuery = '', visitorQuickFilter = 'all', lastGeneratedQrSvg = '';
  let tracking = false, starting = null, lastPage = '', lastActivity = Date.now(), lastBeat = Date.now();
  let consent = storage.get('hoanAnalyticsConsent') === 'no' ? 'no' : 'yes';
  let refreshTimer, polling = false, previewDraft = null;

  const adminHeaders = () => {
    let token = '';
    try { token = sessionStorage.getItem('hoanAdminToken') || ''; } catch { /* local */ }
    return token ? { Authorization: 'Bearer ' + token } : {};
  };
  async function request(url, data, admin = false) {
    const response = await fetch(url, { cache: 'no-store', ...(data ? { method: 'POST', body: JSON.stringify(data) } : {}), headers: { ...(data ? { 'Content-Type': 'application/json' } : {}), ...(admin ? adminHeaders() : {}) } });
    const result = await response.json();
    if (!response.ok) throw Object.assign(new Error(result.error || 'Không thể kết nối máy chủ.'), { status: response.status });
    return result;
  }
  async function loadPages() { pages = (await request('/api/site-content')).pages || {}; }
  const previewUrl = path => location.pathname + '?cmsPreview=1#' + path;
  const cleanPath = p => String(p || '/').split('?')[0].replace(/\/+$/, '') || '/';
  const pageName = path => {
    const clean = cleanPath(path);
    const friendlyMap = {
      '/': 'Trang chủ',
      '/about': 'Về Hoàn',
      '/services': 'Danh sách dịch vụ',
      '/services/bridal': 'Makeup Cô dâu',
      '/services/party': 'Makeup Dự tiệc',
      '/services/personal': 'Makeup Cá nhân',
      '/services/photo': 'Makeup Chụp ảnh',
      '/gallery': 'Bộ sưu tập',
      '/look/natural': 'Tone Tự nhiên',
      '/look/evening': 'Tone Dạ hội',
      '/look/bridal': 'Tone Cô dâu',
      '/look/portrait': 'Tone Chân dung',
      '/look/detail': 'Chi tiết Makeup',
      '/contact': 'Liên hệ',
      '/support': 'Trung tâm hỗ trợ',
      '/lookup': 'Tra cứu lịch hẹn',
      '/search': 'Tìm kiếm',
      '/policies': 'Chính sách',
      '/booking': 'Đặt lịch hẹn',
      '/booking/service': 'Đặt lịch · Chọn dịch vụ',
      '/booking/time': 'Đặt lịch · Chọn thời gian',
      '/booking/location': 'Đặt lịch · Chọn địa điểm',
      '/booking/info': 'Đặt lịch · Nhập thông tin',
      '/booking/deposit': 'Đặt lịch · Đặt cọc',
      '/booking/confirm': 'Đặt lịch · Xác nhận',
      '/booking/success': 'Đặt lịch · Hoàn tất'
    };
    if (friendlyMap[clean]) return friendlyMap[clean];
    const match = publicPages.find(([p]) => p === clean);
    if (match) return match[1];
    if (clean.startsWith('/booking/')) return 'Đặt lịch · ' + clean.replace('/booking/', '');
    if (clean.startsWith('/services/')) return 'Dịch vụ · ' + clean.replace('/services/', '');
    if (clean.startsWith('/look/')) return 'Bộ sưu tập · ' + clean.replace('/look/', '');
    return clean.replace(/^\//, '') || 'Trang chủ';
  };
  const frame = () => q('#cms-real-preview');
  function sendPreview() {
    frame()?.contentWindow?.postMessage({ type: 'hoan:preview', brand: ctx.getState().brand, settings: ctx.getState().settings, path: selected, fields: draft }, location.origin);
  }

  const studioMediaCatalog = [
    { src: '/assets/bridal-user.png', title: 'Cô dâu thanh lịch (Tone Hàn Quốc VIP)', category: 'bridal', tag: 'Ảnh mới tải', ratio: '3:4', desc: 'Chân dung cô dâu góc nghiêng sang trọng tinh tế' },
    { src: '/assets/campaign.png', title: 'Chiến dịch chính (Hero Fashion)', category: 'campaign', tag: 'Banner chính', ratio: '16:9', desc: 'Ảnh chất lượng cao cho đầu trang web' },
    { src: '/assets/bridal-new.png', title: 'Cô dâu Haute Couture', category: 'bridal', tag: 'Cô dâu', ratio: '3:4', desc: 'Váy cưới lộng lẫy phong cách sang trọng' },
    { src: '/assets/bridal.png', title: 'Cô dâu Studio truyền thống', category: 'bridal', tag: 'Cô dâu', ratio: '4:5', desc: 'Tone trang điểm cô dâu nhẹ nhàng' },
    { src: '/assets/evening.png', title: 'Trang điểm Dạ hội & Dự tiệc', category: 'party', tag: 'Dự tiệc', ratio: '3:4', desc: 'Tone makeup quyến rũ cho tiệc đêm' },
    { src: '/assets/natural.png', title: 'Trang điểm Tự nhiên Trong trẻo', category: 'natural', tag: 'Tự nhiên', ratio: '3:4', desc: 'Phong cách makeup Hàn Quốc hàng ngày' },
    { src: '/assets/hero.png', title: 'Chân dung nghệ thuật Studio', category: 'portrait', tag: 'Chân dung', ratio: '1:1', desc: 'Chân dung cận cảnh ánh sáng studio' },
    { src: '/assets/about-process.png', title: 'Quy trình tư vấn chuyên nghiệp', category: 'process', tag: 'Quy trình', ratio: '16:9', desc: 'Góc tư vấn cọ và màu trang điểm' },
    { src: '/assets/about-brushes.png', title: 'Bộ cọ chuyên nghiệp cao cấp', category: 'process', tag: 'Dụng cụ', ratio: '4:3', desc: 'Dụng cụ và mỹ phẩm chính hãng' },
    { src: '/assets/about-eye.png', title: 'Điểm nhấn chi tiết ánh nhìn', category: 'natural', tag: 'Chi tiết', ratio: '4:3', desc: 'Makeup mắt và lông mày tinh tế' },
    { src: '/assets/contact-brushes.jpg', title: 'Không gian Studio & Bàn phấn', category: 'campaign', tag: 'Không gian', ratio: '16:9', desc: 'Không gian đón tiếp khách hàng sang trọng' },
  ];

  function detectSection(node, path) {
    if (node.closest('header, .ct-editorial > header, .hero, .booking-art, .ct-hero')) {
      return { id: 'sec-hero', title: 'Đầu trang', icon: '' };
    }
    if (node.closest('.ct-process, .ct-philosophy, .ct-story, .ct-about, .ct-intro')) {
      return { id: 'sec-intro', title: 'Giới thiệu & Triết lý nghệ thuật', icon: '' };
    }
    if (node.closest('.couture-gallery, .fashion-photo, .ct-gallery, .ct-look, .ct-media')) {
      return { id: 'sec-gallery', title: 'Bộ sưu tập & Hình ảnh thực tế', icon: '' };
    }
    if (node.closest('.ct-services, .ct-card, .ct-pricing')) {
      return { id: 'sec-services', title: 'Dịch vụ & Bảng giá', icon: '' };
    }
    if (node.closest('footer, .couture-footer, .ct-contact, .visit-policy, .ct-policy')) {
      return { id: 'sec-footer', title: 'Chân trang & Thông tin hỗ trợ', icon: '' };
    }
    let prev = node.previousElementSibling;
    while (prev) {
      if (prev.matches('h2, h1')) {
        const txt = prev.textContent.trim().slice(0, 32);
        if (txt) return { id: 'sec-' + txt.toLowerCase().replace(/[^a-z0-9]+/g, '-'), title: `Mục: "${txt}"`, icon: '' };
      }
      prev = prev.previousElementSibling;
    }
    const parentHeading = node.parentElement?.querySelector('h2, h1');
    if (parentHeading && parentHeading !== node) {
      const txt = parentHeading.textContent.trim().slice(0, 32);
      if (txt) return { id: 'sec-' + txt.toLowerCase().replace(/[^a-z0-9]+/g, '-'), title: `Mục: "${txt}"`, icon: '' };
    }
    return { id: 'sec-content', title: 'Nội dung chi tiết trang', icon: '' };
  }

  function detectRole(node, type) {
    if (type === 'img') return { tag: 'IMG', roleName: 'Hình ảnh chính', badgeClass: 'role-img' };
    if (type === 'h1') return { tag: 'H1', roleName: 'Tiêu đề chính trang', badgeClass: 'role-h1' };
    if (type === 'h2') return { tag: 'H2', roleName: 'Tiêu đề mục lớn', badgeClass: 'role-h2' };
    if (type === 'h3') return { tag: 'H3', roleName: 'Tiêu đề nhóm nhỏ', badgeClass: 'role-h3' };
    if (node.classList?.contains('ct-subtitle') || node.parentElement?.matches('header')) return { tag: 'SUB', roleName: 'Slogan / Dòng phụ', badgeClass: 'role-sub' };
    if (type === 'li') return { tag: 'LI', roleName: 'Gạch đầu dòng', badgeClass: 'role-li' };
    return { tag: 'P', roleName: 'Đoạn văn bản', badgeClass: 'role-p' };
  }

  function scanNodes(root, path) {
    if (!publicPages.some(([p]) => p === path)) return [];
    const booking = path.startsWith('/booking/') || ['/lookup', '/search'].includes(path);
    const selector = booking ? '#main h1, #main .ct-subtitle' : '#main h1, #main h2, #main h3, #main p, #main li, #main figcaption, #main img';
    const counters = {};
    return [...root.querySelectorAll(selector)].filter(node => {
      if (node.closest('.ct-service-grid, .ct-service-meta, .ct-price, .ct-select-services, .ct-summary, .booking-summary, form, .breadcrumbs')) return false;
      if (node.matches('img') && (node.getAttribute('aria-hidden') === 'true' || node.classList.contains('fashion-detail'))) return false;
      if (!node.matches('img') && [...node.children].some(child => child.tagName !== 'BR')) return false;
      return node.matches('img') || node.textContent.trim().length > 0;
    }).flatMap(node => {
      // Keys use semantic element order within a fixed page template; no CSS selectors or HTML are accepted from storage.
      const type = node.tagName.toLowerCase();
      const index = counters[type] = (counters[type] || 0) + 1;
      const section = detectSection(node, path);
      const role = detectRole(node, type);
      if (type === 'img') return [
        { key: `img-${index}`, label: 'Ảnh · ' + (node.alt || index), original: node.getAttribute('src'), node, attr: 'src', section, role: { tag: 'IMG', roleName: 'Hình ảnh chính', badgeClass: 'role-img' } },
        { key: `alt-${index}`, label: 'Mô tả ảnh · ' + index, original: node.alt || '', node, attr: 'alt', section, role: { tag: 'ALT', roleName: 'Mô tả ảnh (Alt)', badgeClass: 'role-alt' } },
      ];
      return [{ key: `txt-${type}-${index}`, label: ({ h1: 'Tiêu đề trang', h2: 'Tiêu đề mục', h3: 'Tiêu đề nhỏ', p: 'Đoạn văn', li: 'Nội dung danh sách' }[type] || 'Nội dung') + ' · ' + index, original: node.innerText || node.textContent, node, section, role }];
    });
  }
  function editableNodes(path) {
    return scanNodes(document, path);
  }
  function extractDescriptors(path) {
    if (!ctx.renderPathHtml) return [];
    try {
      const html = ctx.renderPathHtml(path);
      if (!html) return [];
      const div = document.createElement('div');
      div.innerHTML = html;
      const items = scanNodes(div, path);
      const fields = pages[path]?.fields || {};
      return items.map(({ node, ...item }) => ({
        ...item,
        value: fields[item.key] ?? item.original
      }));
    } catch {
      return [];
    }
  }
  function applyContent(path) {
    const nodes = editableNodes(path);
    const fields = pages[path]?.fields || {};
    for (const item of nodes) {
      if (isPreview && item.node) {
        item.node.dataset.cmsKey = item.key;
        item.node.dataset.cmsLabel = item.label;
        item.node.classList.add('cms-preview-node');
      }
      const value = fields[item.key];
      if (typeof value !== 'string') continue;
      if (item.attr === 'src') {
        if (!/^(?:\/(?!\/)|https:\/\/)[^\s<>"']+$/.test(value)) continue;
        item.node.src = value;
        const paired = item.node.closest('.fashion-photo')?.querySelector('.fashion-detail');
        if (paired) paired.src = value;
      } else if (item.attr) item.node.setAttribute(item.attr, value);
      else { item.node.textContent = value; item.node.style.whiteSpace = 'pre-line'; }
    }
    if (isPreview) window.parent.postMessage({ type: 'hoan:fields', path, fields: nodes.map(({ node, ...item }) => ({ ...item, value: fields[item.key] ?? item.original })) }, location.origin);
  }
  function linkedFields(path) {
    const b = ctx.getState().brand;
    if (/^#[0-9a-f]{6}$/i.test(b.accent || '')) document.documentElement.style.setProperty('--wine', b.accent);
    if (path === '/') {
      const header = q('.ct-editorial > header');
      if (header && b.description) { const p = document.createElement('p'); p.className = 'ct-subtitle'; p.textContent = b.description; header.append(p); }
    }
    if (path === '/booking/service') {
      if (b.headline && q('#main h1')) q('#main h1').textContent = b.headline;
      if (b.description && q('#main .ct-subtitle')) q('#main .ct-subtitle').textContent = b.description;
    }
    if (path === '/contact') {
      if (b.contactPageTitle && q('#main h1')) q('#main h1').textContent = b.contactPageTitle;
      if (b.contactPageSubtitle && q('#main .ct-subtitle')) q('#main .ct-subtitle').textContent = b.contactPageSubtitle;
      if (b.address) { const p = document.createElement('p'); p.textContent = b.address; q('.ct-contact-sidebar')?.append(p); }
    }
    if (b.heroImage) for (const image of document.querySelectorAll('.booking-art img, .ct-booking img[src="/assets/hero.png"]')) image.src = b.heroImage;
    if (path.startsWith('/booking/') && b.imageMessage && q('.booking-art')) {
      const quote = document.createElement('p'); quote.className = 'booking-quote'; quote.textContent = b.imageMessage; q('.booking-art').append(quote);
    }
    for (const image of document.querySelectorAll('img[src^="/assets//"]')) image.src = image.getAttribute('src').slice('/assets/'.length);
    const footer = q('.couture-footer');
    if (footer) {
      const socials = q('.ct-footer-socials') || document.createElement('div');
      socials.className = 'ct-footer-socials';
      socials.innerHTML = [['facebookUrl', 'Facebook'], ['instagramUrl', 'Instagram'], ['tiktokUrl', 'TikTok']].filter(([key]) => /^https:\/\//.test(b[key] || '')).map(([key, label]) => `<a href="${esc(b[key])}" target="_blank" rel="noopener noreferrer">${label}</a>`).join('');
      if (!socials.parentNode && socials.innerHTML) footer.append(socials);
      if (!isPreview) { const button = document.createElement('button'); button.className = 'link visit-preferences'; button.dataset.visitAction = 'preferences'; button.textContent = 'Quyền riêng tư & thống kê'; footer.append(button); }
    }
    if (path === '/policies/privacy') {
      const notice = document.createElement('section'); notice.className = 'visit-policy';
      notice.innerHTML = '<h2>Thống kê truy cập website</h2><p>Website tự ghi nhận nguồn truy cập, trang đã xem, thời gian hoạt động và thao tác với các nút điều hướng. Thông tin được lưu tối đa 90 ngày để đánh giá nội dung và nhu cầu tư vấn. Không thu thập địa chỉ IP, nội dung bạn đang gõ hoặc tự lấy tài khoản Facebook. Bạn có thể tắt thống kê và xóa phiên hiện tại tại “Quyền riêng tư & thống kê” ở chân trang.</p>';
      q('#main').append(notice);
    }
  }

  let activeFilter = 'all', searchQuery = '', activeMediaKey = '', activeTextKey = '', activeFocusKey = '';
  let activeEditorMode = 'all';

  function cmsWorkspaceHtml() {
    return `
      <div class="cms-workspace">
        <section class="cms-panel cms-editor-panel">
          <div class="cms-page-selector-card">
            <label class="field cms-main-select-field">
              <span class="field-title">Trang cần chỉnh sửa:</span>
              <div class="cms-select-wrap">
                <select id="cms-page-select">
                  ${publicPages.map(([path, name]) => `<option value="${path}" ${selected === path ? 'selected' : ''}>${esc(name)} (${path})</option>`).join('')}
                </select>
              </div>
            </label>
          </div>

          <div class="cms-view-tab-bar">
            <button type="button" class="cms-tab-btn ${activeFilter === 'all' ? 'active' : ''}" data-filter="all">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>Tất cả</span>
              <span class="tab-badge" id="count-all">0</span>
            </button>
            <button type="button" class="cms-tab-btn ${activeFilter === 'image' ? 'active' : ''}" data-filter="image">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span>Chỉ hình ảnh</span>
              <span class="tab-badge" id="count-image">0</span>
            </button>
            <button type="button" class="cms-tab-btn ${activeFilter === 'text' ? 'active' : ''}" data-filter="text">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>Chỉ văn bản & chữ</span>
              <span class="tab-badge" id="count-text">0</span>
            </button>
          </div>

          <div class="cms-status-bar">
            <div id="cms-status" role="status">Sẵn sàng chỉnh sửa nội dung</div>
          </div>

          <div class="cms-toolbar">
            <div class="cms-search-box">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input id="cms-field-search" type="text" placeholder="Tìm kiếm văn bản hoặc tên mục..." value="${esc(searchQuery)}" autocomplete="off">
              <button type="button" id="cms-search-clear" title="Xóa tìm kiếm" style="${searchQuery ? '' : 'display:none;'}">✕</button>
            </div>
            <div class="cms-quick-actions">
              <button type="button" class="cms-link-btn" data-action="expand-all">Mở tất cả</button>
              <span class="dot-sep">·</span>
              <button type="button" class="cms-link-btn" data-action="collapse-all">Thu gọn</button>
            </div>
          </div>

          <div class="cms-hidden-pills" style="display:none;" aria-hidden="true">
            <button type="button" class="cms-filter-pill ${activeFilter === 'all' ? 'active' : ''}" data-filter="all">Tất cả</button>
            <button type="button" class="cms-filter-pill ${activeFilter === 'image' ? 'active' : ''}" data-filter="image">Ảnh</button>
            <button type="button" class="cms-filter-pill ${activeFilter === 'heading' ? 'active' : ''}" data-filter="heading">Tiêu đề</button>
            <button type="button" class="cms-filter-pill ${activeFilter === 'text' ? 'active' : ''}" data-filter="text">Đoạn văn</button>
          </div>

          <form id="cms-page-form">
            <div id="cms-fields"></div>
            <div class="cms-save-bar">
              <button class="btn btn-dark btn-save-primary" type="submit">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Lưu thay đổi lên website</span>
              </button>
              <button class="btn btn-reload-secondary" type="button" data-cms-action="reload">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                <span>Tải lại bản đã lưu</span>
              </button>
            </div>
          </form>
          <details class="cms-auth">
            <summary>Khóa quản trị khi dùng tên miền công khai</summary>
            <label class="field">Khóa quản trị<input id="cms-admin-token" type="password" autocomplete="off"></label>
            <button class="btn" data-cms-action="token">Dùng khóa trong phiên này</button>
          </details>
        </section>
        <section class="cms-panel cms-preview-panel">
          <div class="section-head preview-panel-header">
            <div>
              <h2>Trang thật · Xem trước trực quan (Live Preview)</h2>
              <div class="cms-preview-guide-badge">
                <span class="guide-badge-pill guide-img"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> Bấm vào ảnh để ĐỔI ẢNH</span>
                <span class="guide-badge-pill guide-txt"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Bấm vào chữ để SỬA CHỮ</span>
              </div>
            </div>
            <a class="link" id="cms-open-page" href="#${selected}" target="_blank" rel="noopener">Mở trang đã lưu</a>
          </div>
          <iframe id="cms-real-preview" title="Xem trước trang website thật" src="${previewUrl(selected)}"></iframe>
        </section>
      </div>
      <div id="cms-media-modal-container"></div>
      <div id="cms-text-modal-container"></div>
    `;
  }

  function contentPage() {
    return ctx.adminShell('content', cmsWorkspaceHtml(), 'Nội dung website', 'Chỉnh sửa toàn bộ các trang và thiết lập chung.', '<a class="btn" href="#/" target="_blank">Xem website </a>');
  }

  function updateFilterCounts() {
    const total = descriptors.length;
    const imgCount = descriptors.filter(d => d.key.startsWith('img-') || d.key.startsWith('alt-')).length;
    const headingCount = descriptors.filter(d => d.key.includes('-h1-') || d.key.includes('-h2-') || d.key.includes('-h3-')).length;
    const textCount = total - imgCount - headingCount;
    if (q('#count-all')) q('#count-all').textContent = total;
    if (q('#count-image')) q('#count-image').textContent = imgCount;
    if (q('#count-heading')) q('#count-heading').textContent = headingCount;
    if (q('#count-text')) q('#count-text').textContent = textCount;
  }

  function highlightFieldInEditor(key) {
    activeFocusKey = key;
    if (activeEditorMode === 'focus') {
      drawFields();
      return;
    }
    const card = q(`[data-cms-card="${key}"]`) || q(`[data-cms-field="${key}"]`)?.closest('.cms-field-card, .cms-image-field-card, .cms-field');
    if (!card) return;
    const sec = card.closest('.cms-section-group');
    if (sec && sec.classList.contains('collapsed')) {
      sec.classList.remove('collapsed');
      const content = sec.querySelector('.cms-section-content');
      if (content) content.style.display = '';
    }
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.remove('cms-pulse-focus');
    void card.offsetWidth;
    card.classList.add('cms-pulse-focus');
    const input = card.querySelector('[data-cms-field]');
    if (input) input.focus();
    const item = descriptors.find(d => d.key === key);
    if (item) toast(` Đang sửa: ${item.label}`);
  }

  function highlightNodeInPreview(key) {
    frame()?.contentWindow?.postMessage({ type: 'hoan:highlight-node', key }, location.origin);
  }
  function clearHighlightInPreview() {
    frame()?.contentWindow?.postMessage({ type: 'hoan:clear-highlight' }, location.origin);
  }

  function openTextModal(targetKey) {
    activeTextKey = targetKey;
    let modalWrap = q('#cms-text-modal-container');
    if (!modalWrap) {
      modalWrap = document.createElement('div');
      modalWrap.id = 'cms-text-modal-container';
      document.body.append(modalWrap);
    }
    const item = descriptors.find(d => d.key === targetKey);
    if (!item) return;
    const currentVal = draft[targetKey] ?? item.value ?? item.original;
    const role = item.role || { tag: 'TXT', roleName: 'Văn bản', badgeClass: 'role-p' };

    modalWrap.innerHTML = `
      <div class="cms-modal-overlay" data-action="close-text-modal">
        <div class="cms-modal-box cms-text-modal-box" onclick="event.stopPropagation()">
          <div class="cms-modal-header">
            <div class="cms-modal-title">
              <span class="cms-role-badge ${role.badgeClass}">${role.tag}</span>
              <h3>Chỉnh sửa văn bản trực tiếp</h3>
            </div>
            <button type="button" class="cms-modal-close" data-action="close-text-modal" title="Đóng">&times;</button>
          </div>
          <div class="cms-text-modal-body">
            <div class="cms-text-modal-meta">
              <div class="cms-text-target-name">
                <strong class="cms-target-title">${esc(item.label)}</strong>
                <span class="cms-target-key">#${esc(targetKey)}</span>
              </div>
              <span class="cms-live-sync-badge">Thay đổi hiển thị trực tiếp trên website</span>
            </div>
            <label class="cms-text-input-label" for="modal-quick-text">Nội dung văn bản hiển thị:</label>
            <textarea id="modal-quick-text" rows="${item.original.length > 100 ? 6 : 4}" maxlength="6000" placeholder="Nhập nội dung mới...">${esc(currentVal)}</textarea>
            <div class="cms-char-counter"><span id="modal-char-count">${currentVal.length}</span> ký tự</div>
            <div class="cms-original-hint" style="margin-top:12px;">
              <span class="hint-tag">Nội dung gốc ban đầu:</span>
              <span class="hint-text">${esc(item.original)}</span>
            </div>
          </div>
          <div class="cms-modal-footer">
            <button type="button" class="btn btn-sm" data-action="modal-reset-text" data-key="${targetKey}" data-orig="${esc(item.original)}">Khôi phục chữ gốc</button>
            <div style="display:flex;gap:10px;">
              <button type="button" class="btn btn-sm" data-action="close-text-modal">Xong (giữ nháp)</button>
              <button type="button" class="btn btn-sm btn-dark" data-action="modal-save-and-close">Áp dụng & Lưu lên web</button>
            </div>
          </div>
        </div>
      </div>
    `;
    const textarea = q('#modal-quick-text');
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  }

  function openMediaModal(targetKey) {
    activeMediaKey = targetKey;
    let modalWrap = q('#cms-media-modal-container');
    if (!modalWrap) {
      modalWrap = document.createElement('div');
      modalWrap.id = 'cms-media-modal-container';
      document.body.append(modalWrap);
    }
    const currentVal = draft[targetKey] || '';
    const item = descriptors.find(d => d.key === targetKey);
    modalWrap.innerHTML = `
      <div class="cms-modal-overlay" data-action="close-media-modal">
        <div class="cms-modal-box" onclick="event.stopPropagation()">
          <div class="cms-modal-header">
            <div class="cms-modal-title">
              <span class="cms-role-badge role-img">ẢNH</span>
              <h3>Thư viện ảnh Haute Couture — HOÀN Studio</h3>
            </div>
            <button type="button" class="cms-modal-close" data-action="close-media-modal" title="Đóng">&times;</button>
          </div>
          <div class="cms-modal-target-notice">
            <span>Bạn đang đổi ảnh cho mục: <b>${esc(item?.label || targetKey)}</b>. Click vào ảnh bất kỳ dưới đây để thay thế ngay:</span>
          </div>
          <div class="cms-modal-toolbar">
            <div class="cms-modal-tabs">
              <button type="button" class="modal-tab-btn active" data-tab="all">Tất cả ảnh</button>
              <button type="button" class="modal-tab-btn" data-tab="bridal">Cô dâu</button>
              <button type="button" class="modal-tab-btn" data-tab="party">Dự tiệc</button>
              <button type="button" class="modal-tab-btn" data-tab="campaign">Chiến dịch</button>
              <button type="button" class="modal-tab-btn" data-tab="process">Quy trình & Không gian</button>
            </div>
            <label class="btn btn-dark btn-sm modal-upload-btn">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span>Tải ảnh từ máy tính</span>
              <input type="file" id="modal-file-input" accept="image/png,image/jpeg,image/webp,image/gif" style="display:none;">
            </label>
          </div>
          <div class="cms-modal-grid">
            ${studioMediaCatalog.map(img => `
              <div class="cms-gallery-item ${currentVal === img.src ? 'selected' : ''}" data-action="select-media-item" data-src="${img.src}" data-category="${img.category}">
                <div class="cms-gallery-thumb-wrap">
                  <img src="${img.src}" alt="${esc(img.title)}">
                  <span class="cms-gallery-ratio">${img.ratio}</span>
                  <div class="cms-gallery-hover-overlay">
                    <span>✓ Chọn ảnh này</span>
                  </div>
                </div>
                <div class="cms-gallery-info">
                  <strong class="cms-gallery-item-title">${esc(img.title)}</strong>
                  <span class="cms-gallery-tag">${img.tag}</span>
                  <small class="cms-gallery-desc">${esc(img.desc)}</small>
                </div>
                <button type="button" class="btn btn-sm cms-btn-choose">Chọn ảnh này</button>
              </div>
            `).join('')}
          </div>
          <div class="cms-modal-footer">
            <div class="cms-modal-custom-url">
              <span>Hoặc dán URL link ảnh trực tiếp:</span>
              <input id="modal-custom-url-input" placeholder="https://... hoặc /assets/..." value="${esc(currentVal)}">
              <button type="button" class="btn btn-sm btn-dark" data-action="apply-custom-url">Áp dụng link</button>
            </div>
            <button type="button" class="btn" data-action="close-media-modal">Đóng</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderFieldCard(item, isFocused = false) {
    const val = draft[item.key] ?? item.value;
    const role = item.role || { tag: 'TXT', roleName: 'Văn bản', badgeClass: 'role-p' };

    if (item.key.startsWith('img-')) {
      const isUploaded = typeof val === 'string' && val.startsWith('/uploads/');
      const isExternal = typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'));
      const badgeLabel = isUploaded ? 'Ảnh tải lên' : isExternal ? 'Link ngoài' : 'Ảnh hệ thống';
      return `
        <div class="cms-field-card cms-image-field-card ${isFocused ? 'cms-focused-card' : ''}" data-cms-card="${item.key}">
          <div class="cms-card-header">
            <div class="cms-card-title-group">
              <span class="cms-role-badge role-img">HÌNH ẢNH</span>
              <b class="cms-card-label">${esc(item.label)}</b>
            </div>
            <div class="cms-card-header-actions">
              <span class="cms-image-badge">${badgeLabel}</span>
              <button type="button" class="cms-btn-locate" data-action="locate-element" data-key="${item.key}" title="Xem vị trí ảnh này trên website">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
                <span>Xem vị trí</span>
              </button>
            </div>
          </div>
          <div class="cms-image-card-body">
            <div class="cms-image-preview-thumb" data-action="open-media-modal" data-key="${item.key}" title="Bấm trực tiếp vào ảnh này để mở thư viện đổi ngay">
              <img id="thumb-${item.key}" src="${esc(val)}" alt="${esc(item.label)}" onerror="this.src='/assets/campaign.png'" class="cms-thumb-img">
              <div class="cms-thumb-overlay">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <span>Đổi ảnh</span>
              </div>
            </div>
            <div class="cms-image-details">
              <div class="cms-image-actions-row">
                <button type="button" class="btn btn-dark btn-sm cms-btn-gallery" data-action="open-media-modal" data-key="${item.key}">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span>Thư viện ảnh</span>
                </button>
                <label class="btn btn-sm cms-btn-upload">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span>Tải từ máy</span>
                  <input type="file" data-cms-upload="${item.key}" accept="image/png,image/jpeg,image/webp,image/gif" style="display:none;">
                </label>
                <button type="button" class="btn btn-sm cms-btn-reset-img" data-action="reset-img" data-key="${item.key}" data-orig="${esc(item.original)}" title="Khôi phục ảnh gốc">
                  <span>Mặc định</span>
                </button>
              </div>
              <div class="cms-image-presets-drawer">
                <span class="preset-label">CHỌN NHANH ẢNH MẪU (1 CLICK):</span>
                <div class="cms-preset-chips">
                  ${[
                    ['/assets/bridal-user.png', 'Cô dâu VIP'],
                    ['/assets/campaign.png', 'Chiến dịch'],
                    ['/assets/bridal-new.png', 'Cô dâu'],
                    ['/assets/evening.png', 'Dự tiệc'],
                    ['/assets/natural.png', 'Tự nhiên'],
                    ['/assets/about-process.png', 'Quy trình'],
                    ['/assets/hero.png', 'Chân dung']
                  ].map(([p, name]) => `
                    <button type="button" class="preset-chip ${val === p ? 'active' : ''}" data-action="apply-preset-image" data-key="${item.key}" data-src="${p}">
                      <img src="${p}" alt="${name}">
                      <span>${name}</span>
                    </button>
                  `).join('')}
                </div>
              </div>
              <details class="cms-advanced-url">
                <summary>Link file ảnh trực tiếp (URL)</summary>
                <div class="cms-advanced-url-body">
                  <input class="cms-url-input" data-cms-field="${item.key}" value="${esc(val)}" placeholder="/assets/... hoặc https://..." autocomplete="off">
                </div>
              </details>
            </div>
          </div>
        </div>
      `;
    }

    if (item.key.startsWith('alt-')) {
      return `
        <div class="cms-field-card cms-alt-field-card" data-cms-card="${item.key}" style="padding:10px 14px;">
          <label class="cms-field" style="margin-bottom:0;display:flex;flex-direction:row;align-items:center;gap:10px;">
            <span class="cms-sub-label" style="font-size:12px;color:#64748b;white-space:nowrap;">Mô tả ảnh (Alt):</span>
            <input class="cms-url-input" data-cms-field="${item.key}" value="${esc(val)}" placeholder="Mô tả ngắn gọn nội dung ảnh...">
          </label>
        </div>
      `;
    }

    return `
      <div class="cms-field-card cms-text-field-card ${isFocused ? 'cms-focused-card' : ''}" data-cms-card="${item.key}">
        <div class="cms-card-header">
          <div class="cms-card-title-group">
            <span class="cms-role-badge ${role.badgeClass}">${esc(role.roleName || role.tag)}</span>
            <b class="cms-card-label">${esc(item.label)}</b>
          </div>
          <div style="display:flex;gap:6px;">
            <button type="button" class="btn btn-sm btn-quick-edit" data-action="open-text-modal" data-key="${item.key}" title="Mở hộp sửa chữ lớn">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span>Sửa chữ</span>
            </button>
            <button type="button" class="cms-btn-locate" data-action="locate-element" data-key="${item.key}" title="Xem vị trí mục này trên website">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
              <span>Xem vị trí</span>
            </button>
            <button type="button" class="btn btn-sm btn-reset-card-text" data-action="card-reset-text" data-key="${item.key}" data-orig="${esc(item.original)}" title="Khôi phục chữ ban đầu">
              <span>Khôi phục</span>
            </button>
          </div>
        </div>
        <div class="cms-card-body">
          <textarea class="cms-text-input-field" rows="${item.original.length > 120 ? 4 : 2}" maxlength="6000" data-cms-field="${item.key}" placeholder="Nhập nội dung mới...">${esc(val)}</textarea>
          <div class="cms-original-hint">
            <span class="hint-tag">Bản gốc:</span>
            <span class="hint-text">${esc(item.original.slice(0, 180))}</span>
          </div>
        </div>
      </div>
    `;
  }

  function drawFields() {
    const container = q('#cms-fields'); if (!container) return;
    updateFilterCounts();

    if (descriptors.length === 0) {
      container.innerHTML = '<div class="cms-no-results">Đang đồng bộ cấu trúc trang…</div>';
      return;
    }

    if (!activeFocusKey || !descriptors.some(d => d.key === activeFocusKey)) {
      activeFocusKey = descriptors[0].key;
    }

    const sectionMap = new Map();
    for (const item of descriptors) {
      const sec = item.section || { id: 'sec-general', title: 'Nội dung trang', icon: '' };
      if (!sectionMap.has(sec.id)) {
        sectionMap.set(sec.id, { ...sec, items: [] });
      }
      sectionMap.get(sec.id).items.push(item);
    }

    const sLower = searchQuery.trim().toLowerCase();
    let renderedSectionsHtml = '';

    for (const [secId, sec] of sectionMap.entries()) {
      const matchedItems = sec.items.filter(item => {
        if (activeFilter === 'image' && !item.key.startsWith('img-') && !item.key.startsWith('alt-')) return false;
        if (activeFilter === 'heading' && !item.key.includes('-h1-') && !item.key.includes('-h2-') && !item.key.includes('-h3-')) return false;
        if (activeFilter === 'text' && (item.key.startsWith('img-') || item.key.startsWith('alt-'))) return false;
        if (sLower) {
          const val = String(draft[item.key] ?? item.value ?? '').toLowerCase();
          const orig = String(item.original ?? '').toLowerCase();
          const label = String(item.label ?? '').toLowerCase();
          const role = String(item.role?.roleName ?? '').toLowerCase();
          if (!val.includes(sLower) && !orig.includes(sLower) && !label.includes(sLower) && !role.includes(sLower) && !item.key.includes(sLower)) {
            return false;
          }
        }
        return true;
      });

      if (matchedItems.length === 0 && (sLower || activeFilter !== 'all')) continue;

      const itemsHtml = matchedItems.map(item => renderFieldCard(item, false)).join('');

      renderedSectionsHtml += `
        <div class="cms-section-group" data-section-id="${sec.id}">
          <div class="cms-section-header" data-action="toggle-section">
            <div class="cms-section-title-wrap">
              <span class="cms-section-icon">${sec.icon}</span>
              <strong class="cms-section-title">${esc(sec.title)}</strong>
              <span class="cms-section-count">${matchedItems.length} trường</span>
            </div>
            <span class="cms-section-chevron">▾</span>
          </div>
          <div class="cms-section-content">
            ${itemsHtml || '<p class="cms-empty-section">Không có trường nào phù hợp.</p>'}
          </div>
        </div>
      `;
    }

    container.innerHTML = renderedSectionsHtml || '<div class="cms-no-results">Không tìm thấy trường nội dung nào khớp với bộ lọc hoặc từ khóa tìm kiếm.</div>';
    q('#cms-status').textContent = `${descriptors.length} trường liên kết · ${pages[selected]?.updatedAt ? 'Lưu lúc ' + time(pages[selected].updatedAt) : 'Đang dùng nội dung gốc'}${dirty ? ' · Có thay đổi chưa lưu' : ''}`;
  }
  async function selectPage(path) {
    selected = path; draft = { ...(pages[path]?.fields || {}) }; revision = pages[path]?.revision || ''; dirty = false; framePath = '';
    if (q('#cms-page-select')) q('#cms-page-select').value = path;
    if (q('#cms-open-page')) q('#cms-open-page').href = '#' + path;

    const instant = extractDescriptors(path);
    if (instant.length > 0) {
      descriptors = instant;
      drawFields();
    } else {
      descriptors = [];
      if (q('#cms-status')) q('#cms-status').textContent = 'Đang đồng bộ cấu trúc trang…';
    }

    if (frame()) frame().src = previewUrl(path);
  }
  async function savePage() {
    const button = q('#cms-page-form button[type="submit"]');
    if (button) button.disabled = true;
    try {
      const result = await request('/api/site-content', { path: selected, fields: draft, revision }, true);
      pages[selected] = result.page; revision = result.page.revision; dirty = false;
      contentSaved(); drawFields(); toast('Đã lưu nội dung trang lên website.');
    } catch (error) { toast(error.message); if (q('#cms-status')) q('#cms-status').textContent = error.message; }
    finally { if (button) button.disabled = false; }
  }
  function contentSaved() { storage.set('hoanContentRevision', String(Date.now())); }

  // Pure JS Executive QR Code Generator (Haute Couture SVG)
  const QRMath = {
    glog(n) { if (n < 1) return 0; return QRMath.LOG_TABLE[n]; },
    gexp(n) { while (n < 0) n += 255; while (n >= 255) n -= 255; return QRMath.EXP_TABLE[n]; },
    EXP_TABLE: new Array(256),
    LOG_TABLE: new Array(256)
  };
  for (let i = 0; i < 8; i++) QRMath.EXP_TABLE[i] = 1 << i;
  for (let i = 8; i < 256; i++) QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
  for (let i = 0; i < 255; i++) QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;

  function QRPolynomial(num, shift) {
    let offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
    for (let i = num.length - offset; i < this.num.length; i++) this.num[i] = 0;
  }
  QRPolynomial.prototype = {
    get(i) { return this.num[i]; },
    getLength() { return this.num.length; },
    multiply(e) {
      const num = new Array(this.getLength() + e.getLength() - 1).fill(0);
      for (let i = 0; i < this.getLength(); i++) {
        for (let j = 0; j < e.getLength(); j++) {
          num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
        }
      }
      return new QRPolynomial(num, 0);
    },
    mod(e) {
      if (this.getLength() - e.getLength() < 0) return this;
      const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
      const num = new Array(this.getLength());
      for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
      for (let i = 0; i < e.getLength(); i++) num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
      return new QRPolynomial(num, 0).mod(e);
    }
  };

  const QR_RS_BLOCK_TABLE = [
    [1, 26, 19], [1, 44, 34], [1, 70, 55], [1, 100, 80], [1, 134, 108],
    [2, 86, 68], [2, 98, 78], [2, 121, 97], [2, 146, 116], [2, 86, 68, 2, 87, 69]
  ];

  function createQrSvg(data, size = 180) {
    const bytes = new TextEncoder().encode(data);
    let typeNumber = 1;
    while (typeNumber <= 10) {
      const rs = QR_RS_BLOCK_TABLE[typeNumber - 1];
      let totalData = 0;
      for (let i = 0; i < rs.length; i += 3) totalData += rs[i] * rs[i + 2];
      if (bytes.length + 3 <= totalData) break;
      typeNumber++;
    }
    if (typeNumber > 10) typeNumber = 10;

    const buffer = { buffer: [], length: 0,
      put(num, len) { for (let i = 0; i < len; i++) this.putBit(((num >>> (len - i - 1)) & 1) === 1); },
      putBit(b) { const idx = Math.floor(this.length / 8); if (this.buffer.length <= idx) this.buffer.push(0); if (b) this.buffer[idx] |= (0x80 >>> (this.length % 8)); this.length++; }
    };
    buffer.put(4, 4);
    buffer.put(bytes.length, typeNumber < 10 ? 8 : 16);
    for (const b of bytes) buffer.put(b, 8);

    const rs = QR_RS_BLOCK_TABLE[typeNumber - 1];
    let totalDataCount = 0;
    const blocks = [];
    for (let i = 0; i < rs.length; i += 3) {
      for (let j = 0; j < rs[i]; j++) blocks.push({ totalCount: rs[i + 1], dataCount: rs[i + 2] });
      totalDataCount += rs[i] * rs[i + 2];
    }
    while (buffer.length + 4 <= totalDataCount * 8) buffer.put(0, 4);
    while (buffer.length % 8 !== 0) buffer.putBit(false);
    while (buffer.length < totalDataCount * 8) {
      buffer.put(0xec, 8);
      if (buffer.length < totalDataCount * 8) buffer.put(0x11, 8);
    }

    const dcdata = [];
    let offset = 0;
    for (const block of blocks) {
      const dc = [];
      for (let i = 0; i < block.dataCount; i++) dc.push(buffer.buffer[offset++]);
      const ecCount = block.totalCount - block.dataCount;
      let a = new QRPolynomial([1], 0);
      for (let i = 0; i < ecCount; i++) a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
      const modPoly = new QRPolynomial(dc, a.getLength() - 1).mod(a);
      const ec = [];
      for (let i = 0; i < a.getLength() - 1; i++) {
        const modIndex = i + modPoly.getLength() - a.getLength() + 1;
        ec.push(modIndex >= 0 ? modPoly.get(modIndex) : 0);
      }
      dcdata.push({ dc, ec });
    }

    const finalData = [];
    let maxDc = 0, maxEc = 0;
    for (const d of dcdata) { maxDc = Math.max(maxDc, d.dc.length); maxEc = Math.max(maxEc, d.ec.length); }
    for (let i = 0; i < maxDc; i++) for (const d of dcdata) if (i < d.dc.length) finalData.push(d.dc[i]);
    for (let i = 0; i < maxEc; i++) for (const d of dcdata) if (i < d.ec.length) finalData.push(d.ec[i]);

    const moduleCount = typeNumber * 4 + 17;
    const matrix = Array.from({ length: moduleCount }, () => new Array(moduleCount).fill(null));

    function setFinder(row, col) {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const nr = row + r, nc = col + c;
          if (nr < 0 || nr >= moduleCount || nc < 0 || nc >= moduleCount) continue;
          matrix[nr][nc] = ((0 <= r && r <= 6 && (c === 0 || c === 6)) || (0 <= c && c <= 6 && (r === 0 || r === 6)) || (2 <= r && r <= 4 && 2 <= c && c <= 4));
        }
      }
    }
    setFinder(0, 0); setFinder(moduleCount - 7, 0); setFinder(0, moduleCount - 7);
    for (let i = 8; i < moduleCount - 8; i++) {
      if (matrix[6][i] === null) matrix[6][i] = i % 2 === 0;
      if (matrix[i][6] === null) matrix[i][6] = i % 2 === 0;
    }
    if (typeNumber >= 2) {
      const pos = [6, typeNumber * 4 + 10];
      for (const r of pos) for (const c of pos) {
        if (matrix[r][c] !== null) continue;
        for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) matrix[r + dr][c + dc] = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
      }
    }
    const formatBits = [1,0,1,0,1,0,0,0,0,0,1,0,0,1,0];
    for (let i = 0; i < 15; i++) {
      const bit = formatBits[i] === 1;
      if (i < 6) matrix[i][8] = bit; else if (i < 8) matrix[i + 1][8] = bit; else matrix[moduleCount - 15 + i][8] = bit;
      if (i < 8) matrix[8][moduleCount - i - 1] = bit; else if (i < 9) matrix[8][15 - i] = bit; else matrix[8][15 - i - 1] = bit;
    }
    matrix[moduleCount - 8][8] = true;

    let bitIdx = 0;
    const totalBits = finalData.length * 8;
    for (let col = moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      for (let c = 0; c < 2; c++) {
        const x = col - c;
        for (let r = 0; r < moduleCount; r++) {
          const y = ((col + 1) & 2) === 0 ? moduleCount - 1 - r : r;
          if (matrix[y][x] === null) {
            let dark = false;
            if (bitIdx < totalBits) dark = ((finalData[Math.floor(bitIdx / 8)] >>> (7 - (bitIdx % 8))) & 1) === 1, bitIdx++;
            if ((y + x) % 2 === 0) dark = !dark;
            matrix[y][x] = dark;
          }
        }
      }
    }
    let path = '';
    for (let r = 0; r < moduleCount; r++) for (let c = 0; c < moduleCount; c++) if (matrix[r][c]) path += `M${c + 2},${r + 2}h1v1h-1z `;
    const viewSize = moduleCount + 4;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewSize} ${viewSize}" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="Mã QR liên kết"><rect width="${viewSize}" height="${viewSize}" fill="#ffffff"/><path d="${path}" fill="#0a0a0a"/></svg>`;
  }

  function updateVisitorTabVisibility() {
    const kpiSec = q('.visit-kpi-grid');
    const analyticsSec = q('.visit-analytics-grid');
    const tableArea = q('.visitor-section-table-area');
    const campaignSec = q('.visitor-section-campaign');
    const paginationSec = q('.visit-pagination');

    if (activeVisitorTab === 'live') {
      if (kpiSec) kpiSec.style.display = '';
      if (analyticsSec) analyticsSec.style.display = 'none';
      if (tableArea) tableArea.style.display = '';
      if (paginationSec) paginationSec.style.display = '';
      if (campaignSec) campaignSec.style.display = 'none';
    } else if (activeVisitorTab === 'campaign') {
      if (kpiSec) kpiSec.style.display = 'none';
      if (analyticsSec) analyticsSec.style.display = 'none';
      if (tableArea) tableArea.style.display = 'none';
      if (paginationSec) paginationSec.style.display = 'none';
      if (campaignSec) campaignSec.style.display = '';
    } else if (activeVisitorTab === 'analytics') {
      if (kpiSec) kpiSec.style.display = '';
      if (analyticsSec) analyticsSec.style.display = '';
      if (tableArea) tableArea.style.display = 'none';
      if (paginationSec) paginationSec.style.display = 'none';
      if (campaignSec) campaignSec.style.display = 'none';
    } else {
      // 'all'
      if (kpiSec) kpiSec.style.display = '';
      if (analyticsSec) analyticsSec.style.display = '';
      if (tableArea) tableArea.style.display = '';
      if (paginationSec) paginationSec.style.display = '';
      if (campaignSec) campaignSec.style.display = '';
    }
  }

  const time = value => new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
  const duration = seconds => `${Math.floor(Number(seconds || 0) / 60)} phút ${Number(seconds || 0) % 60} giây`;
  function visitorsPage() {
    return ctx.adminShell('visitors', `
      <div class="visit-page-container">
        <div class="visit-overview-header">
          <div class="visit-title-area">
            <div class="visit-badge-live">
              <span class="pulse-indicator"></span>
              <strong>Dữ liệu lưu lượng trực tuyến thời gian thực</strong>
            </div>
            <p class="visit-subtitle">Theo dõi nguồn truy cập, thời gian hoạt động và hành trình khách hàng trên website (Giờ Việt Nam UTC+7).</p>
          </div>
          <div class="visit-status-chips">
            <span class="status-chip">Cập nhật mỗi 10 giây</span>
            <span class="status-chip">Nguồn Facebook & đa kênh</span>
            <span class="status-chip">Lưu lịch sử 90 ngày</span>
          </div>
        </div>

        <!-- Segmented Tab Navigation -->
        <div class="visitor-tab-bar" role="tablist">
          <button class="visitor-tab-btn ${activeVisitorTab === 'all' ? 'active' : ''}" data-action="set-visitor-tab" data-tab="all">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            <span>Tất cả không gian</span>
          </button>
          <button class="visitor-tab-btn ${activeVisitorTab === 'live' ? 'active' : ''}" data-action="set-visitor-tab" data-tab="live">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Khách & Hành trình</span>
            <span class="visitor-tab-badge" id="tab-live-badge">${report?.summary?.active || 0}</span>
          </button>
          <button class="visitor-tab-btn ${activeVisitorTab === 'campaign' ? 'active' : ''}" data-action="set-visitor-tab" data-tab="campaign">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <span>Tạo link & Mã QR Hub</span>
          </button>
          <button class="visitor-tab-btn ${activeVisitorTab === 'analytics' ? 'active' : ''}" data-action="set-visitor-tab" data-tab="analytics">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <span>Biểu đồ & Báo cáo</span>
          </button>
        </div>

        <div class="toolbar visit-filters">
          <label>
            <span>Thời gian:</span>
            <select id="visit-days">
              ${[1, 7, 30, 90].map(value => `<option value="${value}" ${days === String(value) ? 'selected' : ''}>${value} ngày gần nhất</option>`).join('')}
            </select>
          </label>
          <label>
            <span>Nguồn:</span>
            <select id="visit-source">
              <option value="">Tất cả nguồn</option>
              <option value="facebook" ${source === 'facebook' ? 'selected' : ''}>Facebook & MXH</option>
              <option value="direct" ${source === 'direct' ? 'selected' : ''}>Trực tiếp</option>
            </select>
          </label>
          <label class="active-toggle-label">
            <input id="visit-active" type="checkbox" ${onlyActive ? 'checked' : ''}>
            <span>Chỉ khách đang online</span>
          </label>
          <div class="filter-actions-group">
            <button class="btn btn-refresh" data-visit-admin="refresh">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
              <span>Làm mới</span>
            </button>
            <button class="btn btn-export" data-visit-admin="export">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Xuất CSV</span>
            </button>
          </div>
        </div>

        <div id="visit-report" aria-live="polite">
          <div class="visit-loading">
            <div class="loading-spinner"></div>
            <span>Đang kết nối dữ liệu máy chủ…</span>
          </div>
        </div>

        <div class="visit-pagination">
          <button class="btn" data-visit-admin="prev">← Trang trước</button>
          <span id="visit-page-label" class="page-indicator">Đang tải...</span>
          <button class="btn" data-visit-admin="next">Trang sau →</button>
        </div>

        <section id="visit-detail" hidden></section>

        <!-- Upgraded Campaign Link & QR Hub -->
        <section class="cms-panel visit-share visitor-section-campaign" data-section="campaign,all" ${activeVisitorTab === 'live' || activeVisitorTab === 'analytics' ? 'style="display:none;"' : ''}>
          <div class="share-head-group">
            <span class="share-tag">CHIẾN DỊCH QUẢNG BÁ & QR MARKETING</span>
            <h2>Tạo link chia sẻ Facebook & Mã QR tiếp thị</h2>
            <p>Chọn trang đích cần quảng bá, chọn kênh và đặt tên chiến dịch để phân biệt lưu lượng khách hàng tự động.</p>
          </div>
          
          <div class="campaign-builder-grid">
            <div class="campaign-form-col">
              <form id="visit-share-form">
                <label class="field">
                  <span>Trang đích cần quảng bá:</span>
                  <select name="targetPage" id="visit-target-page" class="admin-select-field">
                    <option value="#/">Trang chủ — Giới thiệu tổng quan (#/)</option>
                    <option value="#/services">Bảng giá & Tất cả dịch vụ (#/services)</option>
                    <option value="#/services/bridal">Dịch vụ Makeup Cô dâu cao cấp (#/services/bridal)</option>
                    <option value="#/services/party">Dịch vụ Makeup Dự tiệc & Sự kiện (#/services/party)</option>
                    <option value="#/gallery">Bộ sưu tập tác phẩm thực tế (#/gallery)</option>
                    <option value="#/about">Về Hoàn & Triết lý vẻ đẹp (#/about)</option>
                    <option value="#/book">Đặt lịch hẹn trực tuyến (#/book)</option>
                  </select>
                </label>
                <label class="field">
                  <span>Website công khai:</span>
                  <input name="website" type="url" placeholder="https://ten-mien-cua-ban.vn/" value="${esc(location.protocol === 'https:' && !location.hostname.includes('localhost') ? location.origin + '/' : 'https://hoanmakeup.com/')}" required>
                </label>
                <label class="field">
                  <span>Tên bài đăng / chiến dịch:</span>
                  <input name="campaign" placeholder="vi-du: makeup-co-dau-thang-9" maxlength="120" required>
                </label>
                <div class="share-presets-row">
                  <span class="presets-label">Gợi ý nhanh:</span>
                  <span class="share-chip" role="button" tabindex="0" data-action="set-campaign-preset" data-source="facebook" data-val="facebook-post-co-dau">Bài viết Facebook</span>
                  <span class="share-chip" role="button" tabindex="0" data-action="set-campaign-preset" data-source="instagram" data-val="instagram-bio-link">Link Bio Instagram</span>
                  <span class="share-chip" role="button" tabindex="0" data-action="set-campaign-preset" data-source="tiktok" data-val="tiktok-video-review">Video TikTok</span>
                  <span class="share-chip" role="button" tabindex="0" data-action="set-campaign-preset" data-source="zalo" data-val="zalo-tu-van-khach">Tư vấn Zalo</span>
                </div>
                <button class="btn btn-dark" type="submit">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  <span>Tạo link & Mã QR</span>
                </button>
              </form>
            </div>

            <div class="campaign-output-col">
              <div class="qr-preview-card">
                <div class="qr-preview-header">
                  <span class="qr-card-title">MÃ QR & LINK TIẾP THỊ</span>
                  <span class="qr-card-badge">Quét tức thì</span>
                </div>
                <div class="qr-canvas-area" id="visit-qr-container">
                  <div class="qr-placeholder">
                    <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    <span>Mã QR sẽ hiển thị tại đây sau khi tạo link</span>
                  </div>
                </div>
                <div class="visit-share-copy-row">
                  <label class="field" style="width:100%;">
                    <span>Đường dẫn UTM hoàn chỉnh:</span>
                    <div class="copy-input-wrap">
                      <input id="visit-share-link" readonly placeholder="Link UTM sau khi tạo sẽ hiển thị tại đây..." style="flex:1;">
                      <button class="btn btn-dark" data-visit-admin="copy">Sao chép link</button>
                      <button class="btn btn-download-qr" data-action="download-qr" disabled title="Tải mã QR SVG">Tải mã QR</button>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        <details class="cms-auth">
          <summary>Khóa quản trị hệ thống</summary>
          <div style="display:flex;gap:10px;margin-top:10px;">
            <input id="cms-admin-token" type="password" autocomplete="off" aria-label="Khóa quản trị" placeholder="Nhập khóa quản trị...">
            <button class="btn" data-cms-action="token">Áp dụng khóa quản trị</button>
          </div>
        </details>
      </div>
    `, 'Khách truy cập website', 'Theo dõi nguồn vào, thời gian và hành trình trên website. Giờ Việt Nam (UTC+7).', '<a class="btn" href="#/admin/content">Nội dung website</a>');
  }
  async function loadReport() {
    if (reportLoading || currentPath() !== '/admin/visitors') return;
    reportLoading = true;
    try {
      const params = new URLSearchParams({ days, source, active: onlyActive ? '1' : '0', offset: String(offset) });
      report = await request('/api/visits?' + params, null, true); reportError = '';
    } catch (error) { reportError = error.message; }
    finally { reportLoading = false; drawReport(); }
  }
  function buildTrafficChart(sessions, daysParam, totalVisits) {
    const numDays = Math.min(Number(daysParam) || 7, 7);
    const dayLabels = [];
    const dayCounts = [];
    const now = new Date();

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString('vi-VN', { weekday: 'narrow', day: 'numeric', month: 'numeric' });
      dayLabels.push(dayName);
      const count = sessions.filter(s => s.started_at && s.started_at.slice(0, 10) === dateStr).length;
      dayCounts.push(count);
    }

    const maxVal = Math.max(...dayCounts, 1);
    const width = 540;
    const height = 135;
    const padL = 30;
    const padR = 25;
    const padT = 20;
    const padB = 26;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;

    const points = dayCounts.map((val, idx) => {
      const x = padL + (idx / Math.max(numDays - 1, 1)) * chartW;
      const y = padT + chartH - (val / maxVal) * chartH;
      return [Math.round(x), Math.round(y), val];
    });

    let pathD = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const mx = (p0[0] + p1[0]) / 2;
      pathD += ` C ${mx} ${p0[1]}, ${mx} ${p1[1]}, ${p1[0]} ${p1[1]}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1][0]} ${padT + chartH} L ${points[0][0]} ${padT + chartH} Z`;

    return `
      <svg viewBox="0 0 ${width} ${height}" class="traffic-svg" role="img" aria-label="Biểu đồ lưu lượng truy cập">
        <defs>
          <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#7a1832" stop-opacity="0.22"/>
            <stop offset="85%" stop-color="#7a1832" stop-opacity="0.03"/>
            <stop offset="100%" stop-color="#7a1832" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <line x1="${padL}" y1="${padT}" x2="${width - padR}" y2="${padT}" stroke="#f0f0f2" stroke-dasharray="3 3"/>
        <line x1="${padL}" y1="${padT + chartH / 2}" x2="${width - padR}" y2="${padT + chartH / 2}" stroke="#f0f0f2" stroke-dasharray="3 3"/>
        <line x1="${padL}" y1="${padT + chartH}" x2="${width - padR}" y2="${padT + chartH}" stroke="#e4e4e7"/>
        <path d="${areaD}" fill="url(#trafficGradient)"/>
        <path d="${pathD}" fill="none" stroke="#7a1832" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${points.map((p, idx) => `
          <g class="chart-point-group">
            <circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#ffffff" stroke="#7a1832" stroke-width="2"/>
            ${p[2] > 0 ? `<text x="${p[0]}" y="${p[1] - 8}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#7a1832">${p[2]}</text>` : ''}
            <text x="${p[0]}" y="${height - 8}" text-anchor="middle" font-size="9.5" fill="#71717a" font-weight="500">${dayLabels[idx]}</text>
          </g>
        `).join('')}
      </svg>
    `;
  }

  function drawReport() {
    const root = q('#visit-report'); if (!root) return;
    if (reportError) { root.innerHTML = `<p class="visit-error" role="alert">${esc(reportError)}</p>`; return; }
    if (!report) return;
    const summary = report.summary;

    const totalCount = Number(summary.total) || 0;
    const fbCount = Number(summary.facebook) || 0;
    const directCount = Math.max(0, totalCount - fbCount);
    const fbPercent = totalCount > 0 ? Math.round((fbCount / totalCount) * 100) : 0;
    const directPercent = totalCount > 0 ? Math.max(0, 100 - fbPercent) : 0;

    const mobileCount = report.sessions.filter(s => s.device === 'mobile').length;
    const desktopCount = report.sessions.filter(s => s.device !== 'mobile').length;
    const totalDevices = Math.max(report.sessions.length, 1);
    const mobilePercent = Math.round((mobileCount / totalDevices) * 100);
    const desktopPercent = Math.max(0, 100 - mobilePercent);

    const identifiedCount = Number(summary.identified) || 0;
    const identifiedPercent = totalCount > 0 ? Math.round((identifiedCount / totalCount) * 100) : 0;

    const trafficSvgChart = buildTrafficChart(report.sessions, days, totalCount);

    const totalSessionsCount = report.sessions.length;
    const onlineSessionsCount = report.sessions.filter(s => s.last_seen_at >= report.activeSince).length;
    const leadsCount = report.sessions.filter(s => (s.display_name && s.display_name.trim()) || (s.declared_purpose && s.declared_purpose.trim()) || (s.facebook_url && s.facebook_url.trim())).length;
    const fbSessionsCount = report.sessions.filter(s => s.source === 'facebook').length;

    let filteredSessions = report.sessions || [];
    if (visitorQuickFilter === 'online') {
      filteredSessions = filteredSessions.filter(s => s.last_seen_at >= report.activeSince);
    } else if (visitorQuickFilter === 'leads') {
      filteredSessions = filteredSessions.filter(s => (s.display_name && s.display_name.trim()) || (s.declared_purpose && s.declared_purpose.trim()) || (s.facebook_url && s.facebook_url.trim()));
    } else if (visitorQuickFilter === 'facebook') {
      filteredSessions = filteredSessions.filter(s => s.source === 'facebook');
    }

    if (visitorSearchQuery.trim()) {
      const qLower = visitorSearchQuery.trim().toLowerCase();
      filteredSessions = filteredSessions.filter(s => {
        const name = (s.display_name || '').toLowerCase();
        const id = (s.id || '').toLowerCase();
        const purpose = (s.declared_purpose || '').toLowerCase();
        const fb = (s.facebook_url || '').toLowerCase();
        const camp = (s.campaign || '').toLowerCase();
        const page = (pageName(s.current_page) || '').toLowerCase();
        return name.includes(qLower) || id.includes(qLower) || purpose.includes(qLower) || fb.includes(qLower) || camp.includes(qLower) || page.includes(qLower);
      });
    }

    const isSearchFocused = document.activeElement && document.activeElement.id === 'visitor-search-input';
    const cursorStart = isSearchFocused ? document.activeElement.selectionStart : 0;
    const cursorEnd = isSearchFocused ? document.activeElement.selectionEnd : 0;

    root.innerHTML = `
      <section class="stat-grid visit-kpi-grid">
        <div class="stat-card kpi-total">
          <div class="kpi-icon-wrap">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="kpi-info">
            <small>Phiên truy cập</small>
            <strong class="numeric">${Number(summary.total)}</strong>
            <span class="kpi-desc">Tổng lượt ghé thăm</span>
          </div>
          <span class="kpi-corner-tag">Theo chu kỳ</span>
        </div>

        <div class="stat-card kpi-active">
          <div class="kpi-icon-wrap live-pulse">
            <span class="pulse-indicator"></span>
          </div>
          <div class="kpi-info">
            <small>Đang hoạt động</small>
            <strong class="numeric">${Number(summary.active)}</strong>
            <span class="kpi-desc">Khách đang online</span>
          </div>
          <span class="kpi-corner-tag tag-live">Trực tiếp</span>
        </div>

        <div class="stat-card kpi-facebook">
          <div class="kpi-icon-wrap fb-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </div>
          <div class="kpi-info">
            <small>Nguồn Facebook</small>
            <strong class="numeric">${Number(summary.facebook)}</strong>
            <span class="kpi-desc">Từ bài đăng & quảng cáo</span>
          </div>
          <span class="kpi-corner-tag tag-fb">${fbPercent}% tỷ trọng</span>
        </div>

        <div class="stat-card kpi-identified">
          <div class="kpi-icon-wrap lead-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="kpi-info">
            <small>Có thông tin tự khai</small>
            <strong class="numeric">${Number(summary.identified)}</strong>
            <span class="kpi-desc">Khách để lại lời nhắn</span>
          </div>
          <span class="kpi-corner-tag tag-lead">${identifiedPercent}% chuyển đổi</span>
        </div>
      </section>

      <!-- Visual Analytics & Traffic Charts (Haute Couture Executive Design) -->
      <section class="visit-analytics-grid">
        <div class="analytics-card traffic-trend-card">
          <div class="analytics-card-header">
            <div>
              <h3 class="analytics-title">Xu hướng lưu lượng truy cập</h3>
              <p class="analytics-subtitle">Biểu đồ phiên truy cập trong ${days} ngày gần nhất</p>
            </div>
            <div class="trend-summary-pill">
              <span class="trend-dot"></span>
              <span>Tổng: <b>${totalCount}</b> lượt ghé thăm</span>
            </div>
          </div>
          <div class="analytics-chart-wrap">
            ${trafficSvgChart}
          </div>
        </div>

        <div class="analytics-card traffic-breakdown-card">
          <div class="analytics-card-header">
            <div>
              <h3 class="analytics-title">Cơ cấu nguồn & Thiết bị</h3>
              <p class="analytics-subtitle">Phân bổ nguồn truy cập và kênh chuyển đổi</p>
            </div>
          </div>
          <div class="breakdown-body">
            <div class="breakdown-item">
              <div class="breakdown-label-row">
                <span class="breakdown-name">Mạng xã hội (Facebook / Ads)</span>
                <span class="breakdown-val"><b>${fbPercent}%</b> (${fbCount} phiên)</span>
              </div>
              <div class="breakdown-track">
                <div class="breakdown-fill fb-fill" style="width: ${fbPercent}%"></div>
              </div>
            </div>

            <div class="breakdown-item">
              <div class="breakdown-label-row">
                <span class="breakdown-name">Truy cập trực tiếp & Kênh khác</span>
                <span class="breakdown-val"><b>${directPercent}%</b> (${directCount} phiên)</span>
              </div>
              <div class="breakdown-track">
                <div class="breakdown-fill direct-fill" style="width: ${directPercent}%"></div>
              </div>
            </div>

            <div class="breakdown-item">
              <div class="breakdown-label-row">
                <span class="breakdown-name">Thiết bị người dùng</span>
                <span class="breakdown-val">Máy tính <b>${desktopPercent}%</b> · Di động <b>${mobilePercent}%</b></span>
              </div>
              <div class="breakdown-dual-track">
                <div class="dual-fill desktop-fill" style="width: ${desktopPercent}%" title="Máy tính: ${desktopCount}"></div>
                <div class="dual-fill mobile-fill" style="width: ${mobilePercent}%" title="Di động: ${mobileCount}"></div>
              </div>
            </div>

            <div class="breakdown-conversion-box">
              <div class="conv-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div class="conv-text">
                <span class="conv-title">Tỷ lệ để lại thông tin tự nguyện</span>
                <span class="conv-sub"><b>${identifiedPercent}%</b> khách hàng gửi nhu cầu tư vấn hoặc liên kết Facebook</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Table & Quick Filter Area -->
      <div class="visitor-section-table-area" data-section="live,all">
        <div class="visitor-filter-toolbar">
          <div class="visitor-search-box">
            <svg class="search-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="visitor-search-input" placeholder="Tìm theo tên khách, mã phiên, Facebook, nhu cầu..." value="${esc(visitorSearchQuery)}">
            <button type="button" class="btn-clear-search" data-action="clear-visitor-search" style="${visitorSearchQuery ? '' : 'display:none;'}" title="Xóa tìm kiếm">✕</button>
          </div>
          <div class="visitor-filter-pills">
            <button type="button" class="visitor-filter-pill ${visitorQuickFilter === 'all' ? 'active' : ''}" data-action="set-visitor-filter" data-filter="all">
              <span>Tất cả</span>
              <span class="pill-count">${totalSessionsCount}</span>
            </button>
            <button type="button" class="visitor-filter-pill ${visitorQuickFilter === 'online' ? 'active' : ''}" data-action="set-visitor-filter" data-filter="online">
              <span class="pill-online-dot"></span>
              <span>Đang online</span>
              <span class="pill-count">${onlineSessionsCount}</span>
            </button>
            <button type="button" class="visitor-filter-pill ${visitorQuickFilter === 'leads' ? 'active' : ''}" data-action="set-visitor-filter" data-filter="leads">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>Khách tiềm năng</span>
              <span class="pill-count">${leadsCount}</span>
            </button>
            <button type="button" class="visitor-filter-pill ${visitorQuickFilter === 'facebook' ? 'active' : ''}" data-action="set-visitor-filter" data-filter="facebook">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              <span>Facebook</span>
              <span class="pill-count">${fbSessionsCount}</span>
            </button>
          </div>
        </div>

        <div class="visit-meta-row">
          <p class="muted">Cập nhật lúc ${time(report.serverTime)} · Đang hoạt động: có tín hiệu trong 90 giây. ${filteredSessions.length < report.sessions.length ? `Đang hiển thị <b>${filteredSessions.length}</b> / ${report.sessions.length} phiên truy cập.` : 'Mỗi phiên không nhất thiết là một người.'}</p>
        </div>

        <div class="visit-table-wrap">
          <table class="visit-table">
            <thead>
              <tr>
                <th>Phiên / thông tin khách</th>
                <th>Nguồn</th>
                <th>Thời gian vào / gần nhất</th>
                <th>Trang hiện tại</th>
                <th>Hoạt động</th>
                <th>Mục đích khách tự khai</th>
                <th style="min-width:140px; text-align:center;">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSessions.length ? filteredSessions.map(session => {
                const isOnline = session.last_seen_at >= report.activeSince;
                const isLead = Boolean((session.display_name && session.display_name.trim()) || (session.declared_purpose && session.declared_purpose.trim()) || (session.facebook_url && session.facebook_url.trim()));
                const isFb = session.source === 'facebook';
                const deviceIcon = session.device === 'mobile' 
                  ? '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>' 
                  : '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>';
                return `
                  <tr class="${isOnline ? 'row-online' : ''} ${isLead ? 'row-lead' : ''}">
                    <td>
                      <div class="visitor-profile-cell">
                        <div class="visitor-avatar ${isOnline ? 'avatar-online' : ''} ${isLead ? 'avatar-lead' : ''}">
                          <span>${session.display_name ? session.display_name.charAt(0).toUpperCase() : 'K'}</span>
                        </div>
                        <div class="visitor-info-text">
                          <div class="visitor-name-lead-row">
                            <b>${esc(session.display_name || 'Khách vãng lai')}</b>
                            ${isLead ? '<span class="lead-badge"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Khách tiềm năng</span>' : ''}
                          </div>
                          <small>Mã phiên: ${esc(session.id.slice(0, 8))}</small>
                          ${session.facebook_url ? `<a href="${esc(session.facebook_url)}" target="_blank" rel="noopener noreferrer">Facebook tự khai</a>` : ''}
                          ${session.display_name || session.facebook_url ? '<small class="unverified-tag">Chưa xác minh danh tính</small>' : ''}
                          <small class="device-tag">${deviceIcon} ${esc(session.device || 'Thiết bị')} · ${esc(session.browser || 'Trình duyệt')}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="source-cell">
                        <span class="source-tag source-${esc(session.source)}">
                          ${isFb ? '<svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> Facebook' : esc(session.source)}
                        </span>
                        ${session.campaign ? `<small class="campaign-tag">${esc(session.campaign)}</small>` : ''}
                        ${session.referrer ? `<small class="referrer-tag">${esc(session.referrer)}</small>` : ''}
                      </div>
                    </td>
                    <td>
                      <div class="time-cell">
                        <span>${time(session.started_at)}</span>
                        <small>Lần cuối: ${time(session.last_seen_at)}</small>
                        <span class="visit-state ${isOnline ? 'online' : ''}">${isOnline ? 'Đang hoạt động' : 'Không hoạt động'}</span>
                      </div>
                    </td>
                    <td>
                      <div class="page-cell">
                        <b>${esc(pageName(session.current_page))}</b>
                        <small>Vào từ: ${esc(pageName(session.landing_page))}</small>
                      </div>
                    </td>
                    <td>
                      <div class="stats-cell">
                        <b>${Number(session.pageviews)}</b> lượt xem
                        <small>${duration(session.active_seconds)}</small>
                      </div>
                    </td>
                    <td>
                      <div class="purpose-cell">
                        ${session.declared_purpose ? `<span class="purpose-quote">“${esc(session.declared_purpose)}”</span>` : esc(session.declared_purpose || '—')}
                      </div>
                    </td>
                    <td style="text-align:center;">
                      <button class="btn btn-sm btn-action-journey" data-visit-session="${session.id}">
                        <svg class="ui-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span>Xem hành trình</span>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('') : `<tr><td colspan="7" class="empty-table">${visitorSearchQuery || visitorQuickFilter !== 'all' ? 'Không tìm thấy khách truy cập nào phù hợp với từ khóa/bộ lọc.' : 'Chưa có phiên truy cập nào phù hợp với bộ lọc hiện tại.'}</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (isSearchFocused) {
      const searchInput = q('#visitor-search-input');
      if (searchInput) {
        searchInput.focus();
        try { searchInput.setSelectionRange(cursorStart, cursorEnd); } catch {}
      }
    }

    q('#visit-page-label').textContent = `Trang ${Math.floor(offset / 25) + 1} · ${summary.total} phiên`;
    q('[data-visit-admin="prev"]').disabled = offset === 0;
    q('[data-visit-admin="next"]').disabled = offset + 25 >= Number(summary.total);
    const tabLiveBadge = q('#tab-live-badge');
    if (tabLiveBadge) tabLiveBadge.textContent = Number(summary.active) || 0;
    updateVisitorTabVisibility();
  }
  function closeDetail() {
    const detail = q('#visit-detail');
    if (!detail || detail.hidden) return;
    detail.classList.add('closing');
    setTimeout(() => {
      detail.hidden = true;
      detail.classList.remove('closing');
    }, 240);
  }
  async function showDetail(id, eventOffset = 0) {
    const root = q('#visit-detail'); if (!root) return;
    root.classList.remove('closing');
    root.hidden = false; detailSession = id; detailOffset = eventOffset;
    try {
      const result = await request('/api/visits?' + new URLSearchParams({ session: id, offset: String(eventOffset) }), null, true);
      if (detailSession !== id) return;

      const session = report?.sessions?.find(s => s.id === id) || {};
      const isOnline = session.last_seen_at && report && session.last_seen_at >= report.activeSince;

      const formatClock = d => new Date(d).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
      const formatDate = d => new Date(d).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });

      const typeMeta = {
        pageview: { label: 'XEM TRANG', badgeClass: 'badge-pageview', titlePrefix: 'Khách xem trang' },
        click: { label: 'THAO TÁC', badgeClass: 'badge-click', titlePrefix: 'Khách tương tác' },
        conversion: { label: 'CHUYỂN ĐỔI', badgeClass: 'badge-conversion', titlePrefix: 'Hoàn tất mục tiêu' },
        identify: { label: 'TỰ KHAI', badgeClass: 'badge-identify', titlePrefix: 'Cung cấp thông tin' }
      };

      const durationText = session.active_seconds 
        ? `${Math.floor(session.active_seconds / 60)} phút ${session.active_seconds % 60} giây` 
        : 'Ít hơn 1 phút';

      root.innerHTML = `
        <div class="visit-detail-card" role="dialog" aria-modal="true" aria-labelledby="timeline-modal-title">
          <div class="timeline-modal-header">
            <div class="timeline-title-wrap">
              <div class="timeline-badge-title">
                <span class="pulse-status-dot ${isOnline ? 'online' : 'offline'}"></span>
                <h2 id="timeline-modal-title">Hành trình chi tiết phiên truy cập</h2>
                <span class="timeline-status-pill ${isOnline ? 'online' : 'offline'}">
                  ${isOnline ? 'Đang trực tuyến' : 'Đã rời trang'}
                </span>
              </div>
              <div class="timeline-session-tag">
                <span class="tag-label">Mã phiên:</span>
                <code class="tag-code">${esc(id)}</code>
              </div>
            </div>
            <button type="button" class="timeline-close-btn" data-visit-admin="close-detail" title="Đóng hành trình">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div class="timeline-body-grid">
            <aside class="timeline-sidebar-col">
              <div class="sidebar-visitor-header">
                <div class="sidebar-avatar ${isOnline ? 'online' : ''}">
                  ${session.display_name ? session.display_name.charAt(0).toUpperCase() : 'K'}
                </div>
                <div class="sidebar-name-wrap">
                  <h3 class="sidebar-visitor-name">${esc(session.display_name || 'Khách vãng lai')}</h3>
                  ${session.display_name || session.facebook_url ? '<span class="unverified-tag">Chưa xác minh danh tính</span>' : '<span class="unverified-tag unverified-muted">Khách ẩn danh</span>'}
                </div>
              </div>

              ${(session.declared_purpose || session.facebook_url) ? `
                <div class="sidebar-intent-card">
                  <span class="intent-card-title">NHU CẦU TỰ NGUYỆN</span>
                  ${session.declared_purpose ? `<p class="intent-quote">“${esc(session.declared_purpose)}”</p>` : ''}
                  ${session.facebook_url ? `<a href="${esc(session.facebook_url)}" target="_blank" rel="noopener noreferrer" class="intent-link">Mở link Facebook khách gửi <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>` : ''}
                </div>
              ` : ''}

              <div class="sidebar-stats-list">
                <div class="sidebar-stat-item">
                  <span class="stat-label">Nguồn truy cập:</span>
                  <strong class="stat-value">${session.source === 'facebook' ? 'Facebook / MXH' : (session.source || 'Trực tiếp')}</strong>
                  ${session.campaign ? `<span class="stat-tag">Chiến dịch: ${esc(session.campaign)}</span>` : ''}
                </div>

                <div class="sidebar-stat-item">
                  <span class="stat-label">Thiết bị & Trình duyệt:</span>
                  <strong class="stat-value">${session.device === 'mobile' ? 'Điện thoại di động' : 'Máy tính để bàn'}</strong>
                  <span class="stat-sub">${esc(session.browser || 'Trình duyệt Web')}</span>
                </div>

                <div class="sidebar-stat-item">
                  <span class="stat-label">Thời gian trên web:</span>
                  <strong class="stat-value">${durationText}</strong>
                  <span class="stat-sub">${result.events.length} bước ghi nhận</span>
                </div>

                <div class="sidebar-stat-item">
                  <span class="stat-label">Trang bắt đầu & Gần nhất:</span>
                  <div class="route-preview-flow">
                    <div class="route-chip">Bắt đầu: <b>${esc(pageName(session.landing_page || '/'))}</b></div>
                    <div class="route-chip">Gần nhất: <b>${esc(pageName(session.current_page || '/'))}</b></div>
                  </div>
                </div>
              </div>

              <div class="sidebar-actions">
                <button type="button" class="btn btn-sm btn-sidebar-close" data-visit-admin="close-detail">
                  Đóng hành trình
                </button>
              </div>
            </aside>

            <main class="timeline-feed-col">
              <div class="feed-header-bar">
                <span class="feed-title">Dòng thời gian các bước tương tác</span>
                <span class="feed-badge">${result.events.length} thao tác</span>
              </div>

              <div class="feed-scroll-container">
                <ol class="visit-timeline">
                  ${result.events.length ? result.events.map((event, idx) => {
                    const meta = typeMeta[event.type] || { label: event.type.toUpperCase(), badgeClass: 'badge-default', titlePrefix: 'Sự kiện' };
                    const stepNum = result.events.length - idx;
                    const curName = pageName(event.page);
                    let actionTitle = '';
                    let actionContext = '';

                    if (event.type === 'pageview') {
                      actionTitle = `Khách xem trang: <strong>${esc(curName)}</strong>`;
                    } else if (event.type === 'click') {
                      const raw = event.label || '';
                      if (raw.startsWith('Đi tới /') || raw.startsWith('Đi tới #/')) {
                        const targetPath = raw.replace(/^Đi tới [#\/]+/, '/');
                        actionTitle = `Bấm chuyển sang: <strong>${esc(pageName(targetPath))}</strong>`;
                      } else if (raw.startsWith('Chuyển sang ')) {
                        actionTitle = `Bấm <strong>${esc(raw)}</strong>`;
                      } else if (raw === 'Bấm gọi điện') {
                        actionTitle = `Bấm <strong>Gọi hotline studio</strong>`;
                      } else if (raw === 'Bấm email') {
                        actionTitle = `Bấm <strong>Gửi email liên hệ</strong>`;
                      } else if (raw === 'Mở kênh liên hệ') {
                        actionTitle = `Bấm mở <strong>Kênh mạng xã hội</strong>`;
                      } else if (raw === 'Chọn dịch vụ / bước đặt lịch') {
                        actionTitle = `Bấm chọn <strong>Dịch vụ / Bước đặt lịch</strong>`;
                      } else if (raw) {
                        actionTitle = `Thao tác: <strong>${esc(raw)}</strong>`;
                      } else {
                        actionTitle = `Tương tác trên trang <strong>${esc(curName)}</strong>`;
                      }
                      actionContext = `<div class="tl-card-context">Tại: ${esc(curName)}</div>`;
                    } else if (event.type === 'identify') {
                      actionTitle = `Khách tự nguyện gửi: <strong>Thông tin & Nhu cầu tư vấn</strong>`;
                      actionContext = `<div class="tl-card-context">Tại: ${esc(curName)}</div>`;
                    } else if (event.type === 'conversion') {
                      actionTitle = `Hoàn tất mục tiêu: <strong>${esc(event.label || 'Đặt lịch hẹn làm đẹp')}</strong>`;
                      actionContext = `<div class="tl-card-context">Tại: ${esc(curName)}</div>`;
                    } else {
                      actionTitle = `Thao tác: <strong>${esc(event.label || curName)}</strong>`;
                    }

                    return `
                      <li class="timeline-item" style="animation-delay: ${Math.min(idx * 45, 360)}ms;">
                        <div class="tl-node">
                          <span class="tl-step-badge ${meta.badgeClass}">${stepNum}</span>
                          <div class="tl-line"></div>
                        </div>
                        <div class="tl-content">
                          <div class="tl-card ${meta.badgeClass}">
                            <div class="tl-card-header">
                              <span class="tl-type-pill ${meta.badgeClass}">${meta.label}</span>
                              <time class="tl-time">${formatClock(event.occurred_at)} · ${formatDate(event.occurred_at)}</time>
                            </div>
                            <div class="tl-card-title">
                              ${actionTitle}
                            </div>
                            ${actionContext}
                          </div>
                        </div>
                      </li>
                    `;
                  }).join('') : '<li class="timeline-empty"><p>Chưa ghi nhận sự kiện nào trong phiên này.</p></li>'}
                </ol>
              </div>

              <div class="timeline-modal-footer">
                <div class="timeline-nav-group">
                  <button class="btn-timeline-nav" data-visit-admin="events-prev" ${eventOffset === 0 ? 'disabled' : ''}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg> Mới hơn
                  </button>
                  <span class="timeline-page-info">Trang ${Math.floor(eventOffset / 100) + 1}</span>
                  <button class="btn-timeline-nav" data-visit-admin="events-next" ${result.events.length < 100 ? 'disabled' : ''}>
                    Cũ hơn <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </button>
                </div>
                <button type="button" class="btn btn-sm btn-footer-close" data-visit-admin="close-detail">Đóng hành trình</button>
              </div>
            </main>
          </div>
        </div>
      `;
    } catch (error) { root.innerHTML = `<div class="visit-detail-card" style="padding:24px;"><p class="visit-error">${esc(error.message)}</p><button class="btn" data-visit-admin="close-detail">Đóng</button></div>`; }
  }
  function exportCsv() {
    if (!report || reportError) return toast('Chưa có dữ liệu để xuất.');
    const cell = value => '"' + String(value ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"';
    const rows = [['Phiên', 'Tên tự khai', 'Facebook tự khai - chưa xác minh', 'Nguồn', 'Chiến dịch', 'Giờ vào', 'Gần nhất', 'Trang vào', 'Trang hiện tại', 'Số lượt xem', 'Giây hoạt động', 'Mục đích tự khai'], ...report.sessions.map(s => [s.id, s.display_name, s.facebook_url, s.source, s.campaign, time(s.started_at), time(s.last_seen_at), s.landing_page, s.current_page, s.pageviews, s.active_seconds, s.declared_purpose])];
    const url = URL.createObjectURL(new Blob(['\ufeff' + rows.map(row => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'hoan-truy-cap-trang-' + (offset / 25 + 1) + '.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function consentPanel(preferences = false) {
    if (isAdmin() || isPreview) return;
    document.getElementById('visit-consent')?.remove();
    if (!preferences) return;
    const panel = document.createElement('section'); panel.id = 'visit-consent'; panel.className = 'visit-consent'; panel.setAttribute('aria-label', 'Lựa chọn thống kê truy cập');
    panel.innerHTML = `<b>Giúp Hoàn hiểu nhu cầu của bạn</b><p>Cho phép ghi nhận trang đã xem, thời gian và nút đã bấm để cải thiện website. Không tự thu thập tài khoản Facebook hoặc nội dung bạn nhập. Dữ liệu lưu tối đa 90 ngày.</p><div class="visit-consent-actions"><button class="btn btn-dark" data-visit-action="accept">Đồng ý thống kê</button><button class="btn" data-visit-action="decline">${consent === 'yes' ? 'Rút đồng ý & xóa phiên' : 'Không đồng ý'}</button><a class="link" href="#/policies/privacy">Chi tiết</a>${preferences ? '<button class="btn" data-visit-action="close">Đóng</button>' : ''}</div>${consent === 'yes' ? `<details><summary>Tự nguyện giới thiệu nhu cầu (không bắt buộc)</summary><form id="visit-identity-form"><label class="field">Tên bạn muốn Hoàn gọi<input name="name" maxlength="80" autocomplete="off"></label><label class="field">Link Facebook của bạn<input name="facebookUrl" type="url" placeholder="https://www.facebook.com/…" maxlength="300"></label><label class="field">Bạn vào website để làm gì?<textarea name="purpose" maxlength="300" placeholder="Ví dụ: xem giá makeup cô dâu, tìm phong cách dự tiệc…"></textarea></label><label><input type="checkbox" name="identityConsent" required> Tôi đồng ý gửi thông tin này kèm phiên truy cập cho Hoàn.</label><button class="btn btn-dark">Gửi thông tin tự nguyện</button><p data-identity-status role="status"></p></form></details>` : ''}`;
    document.body.append(panel);
  }
  async function ensureTracking() {
    if (isAdmin() || isPreview || consent !== 'yes' || document.visibilityState === 'hidden') return false;
    if (tracking) return true;
    if (starting) return starting;
    const params = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.split('?')[1]);
    starting = request('/api/visits', { type: 'start', mode: 'anonymous', page: currentPath(), referrer: document.referrer, source: params.get('utm_source') || hashParams.get('utm_source'), medium: params.get('utm_medium') || hashParams.get('utm_medium'), campaign: params.get('utm_campaign') || hashParams.get('utm_campaign'), facebookClick: params.has('fbclid') }).then(result => { tracking = !result.ignored; lastBeat = Date.now(); return tracking; }).catch(() => false).finally(() => { starting = null; });
    return starting;
  }
  async function track(type, extra = {}) {
    if (!await ensureTracking()) return;
    try { await request('/api/visits', { type, page: currentPath(), ...extra }); }
    catch (error) { if (error.status === 401) { tracking = false; lastPage = ''; } }
  }
  function trackPage() {
    if (isAdmin() || isPreview || consent !== 'yes') return;
    const path = currentPath();
    if (lastPage === path) return;
    lastPage = path; void track('pageview');
  }
  const conversion = label => { if (!isAdmin() && !isPreview) void track('conversion', { label }); };
  function heartbeat() {
    const now = Date.now();
    if (consent === 'yes' && !isAdmin() && !isPreview && document.visibilityState === 'visible' && now - lastActivity < 60000) {
      void track('heartbeat', { activeSeconds: Math.min(25, Math.floor((now - lastBeat) / 1000)) });
    }
    lastBeat = now;
  }

  function mount(path) {
    clearInterval(refreshTimer);
    if (isAdmin()) {
      document.getElementById('visit-consent')?.remove();
      const sidebar = q('.admin-sidebar');
      if (sidebar) {
        if (!sidebar.querySelector('a[href="#/admin/visitors"]')) {
          const iconVisitor = icon ? icon('user') : '';
          sidebar.insertAdjacentHTML('beforeend', `<div class="admin-group-title">KHÁCH TRUY CẬP</div><a class="admin-link ${path === '/admin/visitors' ? 'active' : ''}" href="#/admin/visitors">${iconVisitor}<span>Khách truy cập website</span></a>`);
        }
        if (path === '/admin/visitors') {
          sidebar.querySelectorAll('.admin-link').forEach(link => {
            if (link.getAttribute('href') === '#/admin/visitors') {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      }
      if (path === '/admin/content' || path === '/admin/content-pages') {
        const state = ctx.getState();
        const isPages = path === '/admin/content-pages' || state.contentViewMode === 'pages' || state.contentActiveTab === 'pages' || (path === '/admin/content' && state.contentViewMode !== 'general');
        if (isPages) {
          draft = { ...(pages[selected]?.fields || {}), ...(dirty ? draft : {}) }; revision = pages[selected]?.revision || ''; framePath = '';
          const select = q('#cms-page-select');
          if (select) {
            select.value = selected;
            void selectPage(selected);
          }
        } else {
          const preview = q('.preview-browser');
          if (preview) {
            const paths = { home: '/', about: '/about', services: '/services', booking: '/booking/service', policies: '/policies', contact: '/contact' };
            const p = paths[state.contentPreviewMode || state.contentActiveTab] || '/';
            preview.innerHTML = `<iframe id="cms-real-preview" title="Xem trước nội dung trên trang thật" src="${previewUrl(p)}"></iframe>`;
            const caption = q('.content-preview .section-head small'); if (caption) caption.textContent = 'Trang thật · phản hồi bản nháp · chưa lưu lên website';
          }
        }
      }
      if (path === '/admin/visitors') { drawReport(); void loadReport(); refreshTimer = setInterval(() => { if (!document.hidden) void loadReport(); }, 10000); }
      return;
    }
    linkedFields(path); applyContent(path); consentPanel(); trackPage();
  }

  function start() {
    const refinements = document.createElement('link'); refinements.rel = 'stylesheet'; refinements.href = '/admin-refinements.css?v=6';
    const style = document.createElement('link'); style.rel = 'stylesheet'; style.href = '/site-tools.css?v=144.0'; document.head.append(style);
    document.head.append(refinements);
    loadPages().then(() => ctx.render()).catch(error => { toast(error.message); ctx.render(); });

    if (isPreview) {
      const s = document.createElement('style');
      s.textContent = `
        .cms-preview-node {
          position: relative !important;
          transition: outline 0.15s ease, box-shadow 0.15s ease, background 0.15s ease !important;
          cursor: pointer !important;
        }
        .cms-preview-node:hover {
          outline: 2px dashed #7a1832 !important;
          outline-offset: 3px !important;
          box-shadow: 0 0 14px rgba(122, 24, 50, 0.35) !important;
          background: rgba(122, 24, 50, 0.05) !important;
          border-radius: 3px !important;
        }
        .cms-preview-node[data-cms-key^="img-"],
        img.cms-preview-node {
          cursor: pointer !important;
          transition: transform 0.2s ease, outline 0.15s ease, box-shadow 0.15s ease !important;
        }
        .cms-preview-node[data-cms-key^="img-"]:hover,
        img.cms-preview-node:hover {
          outline: 3px solid #7a1832 !important;
          outline-offset: 4px !important;
          box-shadow: 0 0 0 6px rgba(184, 151, 88, 0.65), 0 10px 25px rgba(0,0,0,0.3) !important;
        }
        .cms-preview-highlight {
          outline: 3px solid #7a1832 !important;
          outline-offset: 4px !important;
          box-shadow: 0 0 0 6px rgba(184, 151, 88, 0.5) !important;
          border-radius: 4px !important;
          animation: cmsGlowPulse 1.5s ease-in-out infinite alternate !important;
        }
        @keyframes cmsGlowPulse {
          from { box-shadow: 0 0 0 4px rgba(184, 151, 88, 0.3); }
          to { box-shadow: 0 0 0 8px rgba(122, 24, 50, 0.6); }
        }
      `;
      document.head.append(s);

      const hoverTip = document.createElement('div');
      hoverTip.id = 'cms-hover-tip';
      hoverTip.style.cssText = 'position:fixed; display:none; pointer-events:none; z-index:999999; background:#7a1832; color:#fff; font-size:12px; font-weight:600; padding:6px 14px; border-radius:20px; box-shadow:0 4px 14px rgba(0,0,0,0.35); border:1.5px solid #b89758; font-family:sans-serif; letter-spacing:0.02em;';
      document.body.append(hoverTip);

      document.addEventListener('mousemove', event => {
        const node = event.target.closest('[data-cms-key]');
        if (node) {
          const isImg = node.dataset.cmsKey?.startsWith('img-');
          hoverTip.innerHTML = isImg ? 'Bấm vào ảnh để ĐỔI ẢNH này' : 'Bấm vào chữ để SỬA CHỮ này';
          hoverTip.style.display = 'block';
          hoverTip.style.left = Math.min(window.innerWidth - 280, event.clientX + 15) + 'px';
          hoverTip.style.top = Math.max(10, event.clientY - 38) + 'px';
        } else {
          hoverTip.style.display = 'none';
        }
      }, { passive: true });

      document.addEventListener('click', event => {
        const target = event.target.closest('[data-cms-key]');
        if (!target) return;
        event.preventDefault();
        event.stopPropagation();
        const key = target.dataset.cmsKey;
        if (key.startsWith('img-')) {
          window.parent.postMessage({ type: 'hoan:quick-change-image', key }, location.origin);
        } else {
          window.parent.postMessage({ type: 'hoan:quick-edit-text', key }, location.origin);
        }
      }, true);
    }

    window.addEventListener('message', event => {
      if (event.origin !== location.origin) return;
      const message = event.data;
      if (isPreview && message?.type === 'hoan:highlight-node') {
        document.querySelectorAll('.cms-preview-highlight').forEach(el => el.classList.remove('cms-preview-highlight'));
        if (message.key) {
          const target = document.querySelector(`[data-cms-key="${message.key}"]`);
          if (target) {
            target.classList.add('cms-preview-highlight');
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
        return;
      }
      if (isPreview && message?.type === 'hoan:clear-highlight') {
        document.querySelectorAll('.cms-preview-highlight').forEach(el => el.classList.remove('cms-preview-highlight'));
        return;
      }
      if (isAdmin() && message?.type === 'hoan:quick-change-image') {
        activeFocusKey = message.key;
        highlightFieldInEditor(message.key);
        highlightNodeInPreview(message.key);
        openMediaModal(message.key);
        toast('Đang mở thư viện ảnh — Bấm chọn ảnh mới để thay thế ngay.');
        return;
      }
      if (isAdmin() && (message?.type === 'hoan:quick-edit-text' || message?.type === 'hoan:select-field')) {
        activeFocusKey = message.key;
        highlightFieldInEditor(message.key);
        highlightNodeInPreview(message.key);
        openTextModal(message.key);
        toast('Đang mở hộp sửa chữ — Nhập chữ mới rồi bấm áp dụng.');
        return;
      }
      if (isPreview && event.source === window.parent && message?.type === 'hoan:preview') {
        previewDraft = message;
        if (message.brand) ctx.getState().brand = message.brand;
        if (message.settings) ctx.getState().settings = message.settings;
        if (message.path === currentPath() && message.fields) pages[message.path] = { ...pages[message.path], fields: message.fields };
        ctx.render(); return;
      }
      if (!isAdmin() || event.source !== frame()?.contentWindow || message?.type !== 'hoan:fields') return;
      const state = ctx.getState();
      const isPages = currentPath() === '/admin/content-pages' || (currentPath() === '/admin/content' && (state.contentViewMode === 'pages' || state.contentActiveTab === 'pages'));
      if (!isPages) {
        if (framePath !== message.path) { framePath = message.path; sendPreview(); }
        return;
      }
      if (!publicPages.some(([p]) => p === message.path)) return;
      if (message.path !== selected) { selected = message.path; draft = { ...(pages[selected]?.fields || {}) }; revision = pages[selected]?.revision || ''; dirty = false; if (q('#cms-page-select')) q('#cms-page-select').value = selected; if (q('#cms-open-page')) q('#cms-open-page').href = '#' + selected; }
      descriptors = message.fields;
      if (!activeFocusKey || !descriptors.some(d => d.key === activeFocusKey)) {
        activeFocusKey = descriptors[0]?.key || '';
      }
      if (framePath !== message.path) {
        framePath = message.path;
        if (!dirty) drawFields();
      }
      if (dirty) sendPreview();
    });

    document.addEventListener('focusin', event => {
      const field = event.target.closest('[data-cms-field]');
      if (field && isAdmin()) highlightNodeInPreview(field.dataset.cmsField);
    });
    document.addEventListener('focusout', () => {
      if (isAdmin()) clearHighlightInPreview();
    });

    document.addEventListener('input', event => {
      if (event.target.id === 'visitor-search-input') {
        visitorSearchQuery = event.target.value;
        const clearBtn = q('[data-action="clear-visitor-search"]');
        if (clearBtn) clearBtn.style.display = visitorSearchQuery ? '' : 'none';
        drawReport();
        return;
      }
      if (event.target.id === 'cms-field-search') {
        searchQuery = event.target.value;
        const clearBtn = q('#cms-search-clear');
        if (clearBtn) clearBtn.style.display = searchQuery ? '' : 'none';
        drawFields();
        return;
      }
      if (event.target.id === 'modal-quick-text' && activeTextKey) {
        const val = event.target.value;
        draft[activeTextKey] = val;
        dirty = true;
        const leftInput = q(`[data-cms-field="${activeTextKey}"]`);
        if (leftInput) leftInput.value = val;
        q('#cms-status').textContent = 'Có thay đổi chưa lưu · xem trước bản nháp';
        sendPreview();
        return;
      }
      if (event.target.matches('[data-cms-field]')) {
        const key = event.target.dataset.cmsField;
        const val = event.target.value;
        draft[key] = val;
        dirty = true;
        q('#cms-status').textContent = 'Có thay đổi chưa lưu · xem trước bản nháp';
        if (key.startsWith('img-')) {
          const thumb = q('#thumb-' + key);
          if (thumb) thumb.src = val;
        }
        sendPreview();
      }
      if (event.target.closest('form[data-form="content"]')) queueMicrotask(sendPreview);
    });
    document.addEventListener('change', async event => {
      if (event.target.id === 'visit-target-page') {
        const form = q('#visit-share-form');
        const linkInput = q('#visit-share-link');
        if (form && linkInput && linkInput.value) {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
        return;
      }
      if (event.target.id === 'cms-focus-item-select') {
        activeFocusKey = event.target.value;
        drawFields();
        highlightNodeInPreview(activeFocusKey);
        return;
      }
      if (event.target.id === 'cms-page-select') {
        if (dirty && !confirm('Rời trang và bỏ các thay đổi chưa lưu?')) { event.target.value = selected; return; }
        await selectPage(event.target.value);
      }
      if (event.target.id === 'modal-file-input') {
        const file = event.target.files[0]; if (!file) return;
        if (file.size > 5 * 1024 * 1024) return toast('Ảnh tối đa 5 MB.');
        const data = new FormData(); data.append('files', file);
        try {
          const response = await fetch('/api/uploads', { method: 'POST', body: data });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          const uploadedPath = result.paths[0];
          if (activeMediaKey) {
            draft[activeMediaKey] = uploadedPath;
            dirty = true;
            const input = q(`input[data-cms-field="${activeMediaKey}"]`);
            if (input) input.value = uploadedPath;
            const thumb = q('#thumb-' + activeMediaKey);
            if (thumb) thumb.src = uploadedPath;
            q('#cms-status').textContent = 'Có thay đổi chưa lưu · xem trước bản nháp';
            sendPreview();
          }
          const container = q('#cms-media-modal-container');
          if (container) container.innerHTML = '';
          toast('Đã tải ảnh lên thành công.');
        } catch (error) { toast(error.message); }
      }
      if (event.target.matches('[data-cms-upload]')) {
        const file = event.target.files[0]; if (!file) return;
        if (file.size > 5 * 1024 * 1024) return toast('Ảnh tối đa 5 MB.');
        const key = event.target.dataset.cmsUpload;
        const data = new FormData(); data.append('files', file);
        try {
          const response = await fetch('/api/uploads', { method: 'POST', body: data });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          draft[key] = result.paths[0];
          dirty = true;
          const input = q(`input[data-cms-field="${key}"]`);
          if (input) input.value = result.paths[0];
          const thumb = q('#thumb-' + key);
          if (thumb) thumb.src = result.paths[0];
          q('#cms-status').textContent = 'Có thay đổi chưa lưu · xem trước bản nháp';
          sendPreview();
          toast('Đã tải ảnh lên thành công.');
        } catch (error) { toast(error.message); }
      }
      if (event.target.matches('#visit-days, #visit-source, #visit-active')) { days = q('#visit-days').value; source = q('#visit-source').value; onlyActive = q('#visit-active').checked; offset = 0; await loadReport(); }
    });
    document.addEventListener('submit', async event => {
      if (isPreview) { event.preventDefault(); event.stopImmediatePropagation(); return; }
      const form = event.target;
      if (!['cms-page-form', 'visit-share-form', 'visit-identity-form'].includes(form.id)) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (form.id === 'cms-page-form') return savePage();
      const data = Object.fromEntries(new FormData(form));
      if (form.id === 'visit-share-form') {
        const rawWebsite = (data.website || '').trim();
        if (!rawWebsite) return toast('Vui lòng nhập tên miền website (bắt đầu bằng https://).');
        let url;
        try {
          url = new URL(rawWebsite);
        } catch {
          return toast('Đường dẫn website không hợp lệ. Vui lòng nhập link HTTPS công khai.');
        }
        if (url.protocol !== 'https:' || /^(localhost|127\.|\[::1\]|0\.0\.0\.0)/.test(url.hostname)) return toast('Nhập tên miền HTTPS công khai đã triển khai, không dùng link local.');
        url.searchParams.set('utm_source', 'facebook');
        url.searchParams.set('utm_medium', 'social');
        url.searchParams.set('utm_campaign', data.campaign);
        const targetPage = (data.targetPage || '').trim() || '#/';
        url.hash = targetPage.startsWith('#') ? targetPage : '#' + targetPage;
        const fullUrl = url.href;
        q('#visit-share-link').value = fullUrl;

        try {
          const qrSvg = createQrSvg(fullUrl, 170);
          lastGeneratedQrSvg = qrSvg;
          const qrContainer = q('#visit-qr-container');
          if (qrContainer) {
            qrContainer.innerHTML = `
              <div class="qr-render-box">
                ${qrSvg}
                <span class="qr-scan-hint">Quét bằng camera điện thoại để mở link</span>
              </div>
            `;
          }
          const downloadBtn = q('[data-action="download-qr"]');
          if (downloadBtn) downloadBtn.disabled = false;
          toast('Đã tạo liên kết UTM và mã QR tiếp thị thành công.');
        } catch (qrErr) {
          console.error('QR generation error:', qrErr);
          toast('Đã tạo liên kết UTM thành công.');
        }
      }
      if (form.id === 'visit-identity-form') {
        const status = form.querySelector('[data-identity-status]');
        try { if (!await ensureTracking()) throw new Error('Hãy đồng ý thống kê trước khi gửi thông tin.'); await request('/api/visits', { type: 'identify', page: currentPath(), ...data, identityConsent: data.identityConsent === 'on' }); status.textContent = 'Đã gửi thông tin tự nguyện cho Hoàn.'; }
        catch (error) { status.textContent = error.message; }
      }
    }, true);
    document.addEventListener('click', async event => {
      const modeBtn = event.target.closest('[data-action="set-editor-mode"]');
      if (modeBtn) {
        event.preventDefault();
        activeEditorMode = modeBtn.dataset.mode;
        document.querySelectorAll('.cms-mode-btn').forEach(b => b.classList.remove('active'));
        modeBtn.classList.add('active');
        const toolbar = q('.cms-toolbar');
        if (toolbar) toolbar.style.display = activeEditorMode === 'focus' ? 'none' : '';
        drawFields();
        return;
      }
      const openTextBtn = event.target.closest('[data-action="open-text-modal"]');
      if (openTextBtn) {
        event.preventDefault();
        openTextModal(openTextBtn.dataset.key);
        return;
      }
      if (event.target.closest('[data-action="close-text-modal"]')) {
        event.preventDefault();
        const container = q('#cms-text-modal-container');
        if (container) container.innerHTML = '';
        return;
      }
      if (event.target.closest('[data-action="modal-save-and-close"]')) {
        event.preventDefault();
        const container = q('#cms-text-modal-container');
        if (container) container.innerHTML = '';
        await savePage();
        return;
      }
      const resetModalBtn = event.target.closest('[data-action="modal-reset-text"]');
      if (resetModalBtn) {
        event.preventDefault();
        const key = resetModalBtn.dataset.key;
        const orig = resetModalBtn.dataset.orig;
        if (key && orig) {
          draft[key] = orig;
          dirty = true;
          const modalTextarea = q('#modal-quick-text');
          if (modalTextarea) modalTextarea.value = orig;
          const input = q(`[data-cms-field="${key}"]`);
          if (input) input.value = orig;
          q('#cms-status').textContent = 'Có thay đổi chưa lưu · xem trước bản nháp';
          sendPreview();
          toast('Đã khôi phục chữ gốc.');
        }
        return;
      }
      if (event.target.id === 'cms-search-clear') {
        searchQuery = '';
        const input = q('#cms-field-search');
        if (input) input.value = '';
        event.target.style.display = 'none';
        drawFields();
        return;
      }
      const tabBtn = event.target.closest('.cms-tab-btn');
      if (tabBtn) {
        event.preventDefault();
        activeFilter = tabBtn.dataset.filter;
        document.querySelectorAll('.cms-tab-btn').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');
        document.querySelectorAll('.cms-filter-pill').forEach(p => {
          if (p.dataset.filter === activeFilter) p.classList.add('active');
          else p.classList.remove('active');
        });
        drawFields();
        return;
      }
      const filterPill = event.target.closest('.cms-filter-pill');
      if (filterPill) {
        event.preventDefault();
        activeFilter = filterPill.dataset.filter;
        document.querySelectorAll('.cms-filter-pill').forEach(p => p.classList.remove('active'));
        filterPill.classList.add('active');
        document.querySelectorAll('.cms-tab-btn').forEach(b => {
          if (b.dataset.filter === activeFilter) b.classList.add('active');
          else b.classList.remove('active');
        });
        drawFields();
        return;
      }
      const cardResetText = event.target.closest('[data-action="card-reset-text"]');
      if (cardResetText) {
        event.preventDefault();
        const key = cardResetText.dataset.key;
        const orig = cardResetText.dataset.orig;
        if (key && orig) {
          draft[key] = orig;
          dirty = true;
          const input = q(`[data-cms-field="${key}"]`);
          if (input) input.value = orig;
          q('#cms-status').textContent = 'Có thay đổi chưa lưu · xem trước bản nháp';
          sendPreview();
          toast('Đã khôi phục chữ gốc.');
        }
        return;
      }
      const campaignPreset = event.target.closest('[data-action="set-campaign-preset"]');
      if (campaignPreset) {
        event.preventDefault();
        const campaign = campaignPreset.dataset.val || campaignPreset.dataset.campaign;
        const form = q('#visit-share-form');
        if (form) {
          const campInput = form.querySelector('[name=campaign]');
          if (campInput) campInput.value = campaign;
          document.querySelectorAll('.share-chip, .campaign-preset-btn').forEach(b => b.classList.remove('active'));
          campaignPreset.classList.add('active');
          const webInput = form.querySelector('[name=website]');
          if (webInput && webInput.value.trim()) {
            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
          } else if (webInput) {
            webInput.focus();
            toast('Đã chọn: ' + (campaignPreset.textContent || campaign) + '. Vui lòng nhập link website để tạo link.');
          } else {
            toast('Đã chọn chiến dịch: ' + campaign);
          }
        }
        return;
      }
      const sectionToggle = event.target.closest('[data-action="toggle-section"]');
      if (sectionToggle) {
        event.preventDefault();
        const group = sectionToggle.closest('.cms-section-group');
        if (group) group.classList.toggle('collapsed');
        return;
      }
      if (event.target.closest('[data-action="expand-all"]')) {
        event.preventDefault();
        document.querySelectorAll('.cms-section-group').forEach(g => g.classList.remove('collapsed'));
        return;
      }
      if (event.target.closest('[data-action="collapse-all"]')) {
        event.preventDefault();
        document.querySelectorAll('.cms-section-group').forEach(g => g.classList.add('collapsed'));
        return;
      }
      const locateBtn = event.target.closest('[data-action="locate-element"]');
      if (locateBtn) {
        event.preventDefault();
        const key = locateBtn.dataset.key;
        highlightNodeInPreview(key);
        toast('Đã định vị phần tử trên website xem trước.');
        return;
      }
      const openMediaBtn = event.target.closest('[data-action="open-media-modal"]');
      if (openMediaBtn) {
        event.preventDefault();
        openMediaModal(openMediaBtn.dataset.key);
        return;
      }
      if (event.target.closest('[data-action="close-media-modal"]')) {
        event.preventDefault();
        const container = q('#cms-media-modal-container');
        if (container) container.innerHTML = '';
        return;
      }
      const modalTab = event.target.closest('.modal-tab-btn');
      if (modalTab) {
        event.preventDefault();
        const tab = modalTab.dataset.tab;
        modalTab.parentElement.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
        modalTab.classList.add('active');
        document.querySelectorAll('.cms-gallery-item').forEach(item => {
          item.style.display = (tab === 'all' || item.dataset.category === tab) ? '' : 'none';
        });
        return;
      }
      const selectMediaItem = event.target.closest('[data-action="select-media-item"]');
      if (selectMediaItem) {
        event.preventDefault();
        const src = selectMediaItem.dataset.src;
        if (src && activeMediaKey) {
          draft[activeMediaKey] = src;
          dirty = true;
          const input = q(`input[data-cms-field="${activeMediaKey}"]`);
          if (input) input.value = src;
          const thumb = q('#thumb-' + activeMediaKey);
          if (thumb) thumb.src = src;
          q('#cms-status').textContent = 'Có thay đổi chưa lưu · xem trước bản nháp';
          sendPreview();
          const container = q('#cms-media-modal-container');
          if (container) container.innerHTML = '';
          toast('Đã chọn ảnh từ thư viện.');
        }
        return;
      }
      if (event.target.closest('[data-action="apply-custom-url"]')) {
        event.preventDefault();
        const url = q('#modal-custom-url-input')?.value.trim();
        if (url && activeMediaKey) {
          draft[activeMediaKey] = url;
          dirty = true;
          const input = q(`input[data-cms-field="${activeMediaKey}"]`);
          if (input) input.value = url;
          const thumb = q('#thumb-' + activeMediaKey);
          if (thumb) thumb.src = url;
          q('#cms-status').textContent = 'Có thay đổi chưa lưu · xem trước bản nháp';
          sendPreview();
          const container = q('#cms-media-modal-container');
          if (container) container.innerHTML = '';
          toast('Đã áp dụng link ảnh.');
        }
        return;
      }
      const presetBtn = event.target.closest('[data-action="apply-preset-image"]');
      if (presetBtn) {
        event.preventDefault();
        const key = presetBtn.dataset.key;
        const src = presetBtn.dataset.src;
        draft[key] = src;
        dirty = true;
        const input = q(`input[data-cms-field="${key}"]`);
        if (input) input.value = src;
        const thumb = q('#thumb-' + key);
        if (thumb) thumb.src = src;
        presetBtn.parentElement?.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
        presetBtn.classList.add('active');
        q('#cms-status').textContent = 'Có thay đổi chưa lưu · xem trước bản nháp';
        sendPreview();
        toast('Đã chọn ảnh mẫu.');
        return;
      }
      const resetImgBtn = event.target.closest('[data-action="reset-img"]');
      if (resetImgBtn) {
        event.preventDefault();
        const key = resetImgBtn.dataset.key;
        const orig = resetImgBtn.dataset.orig;
        draft[key] = orig;
        dirty = true;
        const input = q(`input[data-cms-field="${key}"]`);
        if (input) input.value = orig;
        const thumb = q('#thumb-' + key);
        if (thumb) thumb.src = orig;
        q('#cms-status').textContent = 'Có thay đổi chưa lưu · xem trước bản nháp';
        sendPreview();
        toast('Đã khôi phục ảnh gốc.');
        return;
      }
      const visitorTabBtn = event.target.closest('[data-action="set-visitor-tab"]');
      if (visitorTabBtn) {
        event.preventDefault();
        activeVisitorTab = visitorTabBtn.dataset.tab;
        document.querySelectorAll('.visitor-tab-btn').forEach(b => {
          if (b.dataset.tab === activeVisitorTab) b.classList.add('active');
          else b.classList.remove('active');
        });
        updateVisitorTabVisibility();
        return;
      }
      const visitorFilterPill = event.target.closest('[data-action="set-visitor-filter"]');
      if (visitorFilterPill) {
        event.preventDefault();
        visitorQuickFilter = visitorFilterPill.dataset.filter;
        drawReport();
        return;
      }
      if (event.target.closest('[data-action="clear-visitor-search"]')) {
        event.preventDefault();
        visitorSearchQuery = '';
        const searchInput = q('#visitor-search-input');
        if (searchInput) searchInput.value = '';
        drawReport();
        return;
      }
      if (event.target.closest('[data-action="download-qr"]')) {
        event.preventDefault();
        if (!lastGeneratedQrSvg) return toast('Vui lòng tạo link và mã QR trước.');
        const blob = new Blob([lastGeneratedQrSvg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hoan-qr-code.svg';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast('Đã tải mã QR SVG chất lượng cao.');
        return;
      }
      const button = event.target.closest('[data-cms-action], [data-visit-action], [data-visit-admin], [data-visit-session]');
      if (!button) return;
      event.preventDefault();
      if (button.dataset.cmsAction === 'token') { try { sessionStorage.setItem('hoanAdminToken', q('#cms-admin-token').value); toast('Đã dùng khóa trong phiên quản trị.'); await loadReport(); } catch { toast('Trình duyệt không cho lưu khóa phiên.'); } }
      if (button.dataset.cmsAction === 'reload') { if (dirty && !confirm('Bỏ thay đổi chưa lưu và tải lại bản đã lưu?')) return; await loadPages(); await selectPage(selected); }
      const action = button.dataset.visitAction;
      if (action === 'preferences') consentPanel(true);
      if (action === 'close') q('#visit-consent')?.remove();
      if (action === 'accept') { consent = 'yes'; storage.set('hoanAnalyticsConsent', consent); q('#visit-consent')?.remove(); lastPage = ''; trackPage(); toast('Bạn có thể giới thiệu nhu cầu tại Quyền riêng tư & thống kê ở chân trang.'); }
      if (action === 'decline') {
        consent = 'no'; storage.set('hoanAnalyticsConsent', consent); tracking = false; lastPage = '';
        try { await request('/api/visits', { type: 'revoke' }); q('#visit-consent')?.remove(); }
        catch { toast('Đã ngừng thống kê. Chưa xóa được phiên trên máy chủ; hãy thử lại khi có mạng.'); }
      }
      const admin = button.dataset.visitAdmin;
      if (admin === 'refresh') await loadReport();
      if (admin === 'prev' || admin === 'next') { offset = Math.max(0, offset + (admin === 'next' ? 25 : -25)); await loadReport(); }
      if (admin === 'export') exportCsv();
      if (admin === 'close-detail') closeDetail();
      if (admin === 'events-prev' || admin === 'events-next') await showDetail(detailSession, Math.max(0, detailOffset + (admin === 'events-next' ? 100 : -100)));
      if (admin === 'copy') { const value = q('#visit-share-link').value; if (!value) return toast('Tạo link trước khi sao chép.'); try { await navigator.clipboard.writeText(value); toast('Đã sao chép link Facebook.'); } catch { q('#visit-share-link').select(); toast('Nhấn Ctrl+C để sao chép.'); } }
      if (button.dataset.visitSession) await showDetail(button.dataset.visitSession);
    });
    document.addEventListener('click', event => {
      const detail = q('#visit-detail');
      if (!detail || detail.hidden) return;
      if (event.target.closest('.visit-detail-card') || event.target.closest('[data-visit-session]')) return;
      closeDetail();
    });
    window.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeDetail();
      }
    });
    document.addEventListener('click', event => {
      if (isAdmin() || isPreview || consent !== 'yes') return;
      const target = event.target.closest('a[href], button[data-action]');
      if (!target) return;
      const href = target.getAttribute('href') || '';
      if (href.startsWith('#/admin')) return;
      let label = '';
      if (href.startsWith('#/')) label = 'Đi tới ' + href.slice(1).split('?')[0].replace(/HMA-[^/]+/g, 'detail');
      else if (href.startsWith('tel:')) label = 'Bấm gọi điện';
      else if (href.startsWith('mailto:')) label = 'Bấm email';
      else if (/https:\/\/(?:www\.)?(facebook\.com|zalo\.me|instagram\.com|tiktok\.com)/.test(href)) label = 'Mở kênh liên hệ';
      else if (['choose-service', 'booking-service', 'look-book', 'ct-next', 'ct-prev', 'ct-book-next'].includes(target.dataset.action)) label = 'Chọn dịch vụ / bước đặt lịch';
      if (label) void track('click', { label });
    }, true);
    for (const event of ['pointerdown', 'keydown', 'scroll']) window.addEventListener(event, () => { lastActivity = Date.now(); }, { passive: true });
    window.addEventListener('pagehide', () => {
      if (tracking && !isAdmin() && !isPreview && consent === 'yes') navigator.sendBeacon('/api/visits', new Blob([JSON.stringify({ type: 'leave', page: currentPath(), activeSeconds: Math.min(25, Math.floor((Date.now() - lastBeat) / 1000)) })], { type: 'application/json' }));
    });
    window.addEventListener('beforeunload', event => { if (dirty && currentPath() === '/admin/content-pages') { event.preventDefault(); event.returnValue = ''; } });
    window.addEventListener('storage', event => {
      if (event.key === 'hoanAnalyticsConsent') { consent = storage.get('hoanAnalyticsConsent'); tracking = false; lastPage = ''; if (!isAdmin()) consentPanel(); }
      if (event.key === 'hoanContentRevision' && !isAdmin() && !isPreview) void syncContent();
    });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { lastActivity = Date.now(); lastBeat = Date.now(); if (!isAdmin() && !isPreview) void syncContent(); } });
    setInterval(heartbeat, 20000);
    setInterval(() => { if (!document.hidden && !isAdmin() && !isPreview) void syncContent(); }, 30000);
  }
  async function syncContent() {
    if (polling) return; polling = true;
    try {
      const before = JSON.stringify([pages, ctx.getState().brand, ctx.getState().services]);
      await loadPages(); await ctx.hydrateBackend(true);
      if (before !== JSON.stringify([pages, ctx.getState().brand, ctx.getState().services]) && !document.activeElement?.closest('form')) ctx.render();
    } catch { /* Retain last working page during temporary network errors. */ }
    finally { polling = false; }
  }
  function beforeRender() {
    if (!isPreview || !previewDraft) return;
    if (previewDraft.brand) ctx.getState().brand = previewDraft.brand;
    if (previewDraft.settings) ctx.getState().settings = previewDraft.settings;
  }
  return { start, mount, beforeRender, contentPage, cmsWorkspaceHtml, visitorsPage, conversion, contentSaved };
}
