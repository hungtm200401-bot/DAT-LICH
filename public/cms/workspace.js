import { PACK_CATEGORIES, packImageUrl } from './pack-editor.js';

export function studioIcon(name) {
  const paths = {
    page: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    desktop: '<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M8 21h8M12 16v5"/>',
    tablet: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M11 18h2"/>',
    mobile: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    panel: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    text: '<path d="M4 5h16M12 5v14M8 19h8"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    external: '<path d="M15 3h6v6M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
  };
  return `<svg class="studio-ui-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.page}</svg>`;
}

export function packManagerHtml(packs, { category = '', search = '', esc }) {
  const term = search.trim().toLocaleLowerCase('vi');
  const filtered = packs.filter(pack => (!category || pack.serviceId === category) && [pack.title, pack.tag, pack.note].join(' ').toLocaleLowerCase('vi').includes(term));
  return `<div class="studio-pack-results-heading"><span>${filtered.length} gói dịch vụ${category || term ? ' phù hợp' : ''}</span></div><div class="studio-pack-list">${filtered.map(pack => `<article class="studio-pack-item"><img src="${esc(packImageUrl(pack.image))}" alt="" loading="lazy"><div class="studio-pack-info"><span class="studio-pack-category">${esc(PACK_CATEGORIES.find(([id]) => id === pack.serviceId)?.[1] || 'Khác')}</span><h3>${esc(pack.title)}</h3><p>${esc(pack.note || pack.tag || 'Chưa có mô tả')}</p><div><b>${esc(pack.price || 'Liên hệ tư vấn')}</b><span>${esc(pack.duration || '')}</span></div></div><button class="btn" type="button" data-action="edit-pack-item" data-id="${esc(pack.id)}">Chỉnh sửa</button></article>`).join('') || `<div class="studio-empty-state"><b>${packs.length ? 'Không tìm thấy gói phù hợp' : 'Chưa có gói dịch vụ'}</b><p>${packs.length ? 'Thử tìm bằng từ khóa khác hoặc chọn tất cả nhóm.' : 'Thêm gói đầu tiên để giới thiệu phong cách trang điểm của bạn.'}</p>${packs.length ? '<button class="btn" type="button" data-reset-pack-filters>Xóa bộ lọc</button>' : '<button class="btn btn-dark" type="button" data-action="open-add-pack-template">Thêm gói dịch vụ</button>'}</div>`}</div>`;
}

export function workspaceHtml({ selected, selectedName, entries, previewUrl, previewDevice, view, sidebarView, outlineHidden = false, esc }) {
  return `<div class="cms-workspace full-live-mode cms-studio cms-simple-studio cms-editor-refined ${outlineHidden ? 'is-outline-hidden' : ''}">
    <nav class="studio-workspace-tabs" aria-label="Khu vực quản lý nội dung">${[['pages','Sửa trang web','Chữ, ảnh và bố cục trang'],['packs','Gói dịch vụ','Các gói trang điểm'],['resources','Thư viện & dữ liệu','Ảnh, mẫu và nội dung dùng chung']].map(([id,label,hint]) => `<button type="button" data-studio-view="${id}" aria-controls="studio-panel-${id}" aria-pressed="${view === id}"><span>${label}</span></button>`).join('')}</nav>
    <section id="studio-panel-pages" data-studio-panel="pages" ${view !== 'pages' ? 'hidden' : ''} aria-label="Sửa trang web">
      <form id="cms-page-form" class="cms-live-main-form">
        <header class="studio-toolbar">
          <div class="studio-toolbar-page">${studioIcon('page')}<div><label class="studio-page-label" for="cms-page-select">Chọn trang cần sửa</label><select id="cms-page-select" class="studio-page-select-control" aria-label="Chọn nhanh trang">${entries.map(([path,name]) => `<option value="${esc(path)}" ${path === selected ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select><strong id="studio-current-page" class="sr-only">${esc(selectedName)}</strong></div></div>
          <div id="cms-status" class="studio-save-status" role="status">Đang tải nội dung…</div>
          <div class="studio-toolbar-actions">
            <details class="studio-more"><summary class="btn">Tùy chọn</summary><div>
              <span class="studio-menu-label">Bản nháp & xuất bản</span><button class="btn" type="button" data-action="save-cms-draft">Lưu nháp ngay</button><button class="btn" type="button" data-action="check-cms-publish">Kiểm tra trước khi đăng</button>
              <span class="studio-menu-label">Lịch sử chỉnh sửa</span><button class="btn" type="button" data-action="undo-cms">Hoàn tác</button><button class="btn" type="button" data-action="redo-cms">Làm lại</button><button class="btn" type="button" data-action="compare-cms">Xem thay đổi</button><button class="btn" type="button" data-action="open-cms-history">Phiên bản đã đăng</button>
              <span class="studio-menu-label">Khác</span><button class="btn" type="button" data-action="save-page-template">Lưu trang làm mẫu</button><button class="btn" type="button" data-cms-action="reload">Tải lại nội dung</button>
            </div></details>
            <a class="btn studio-preview-button" id="cms-open-page" href="#${esc(selected)}" target="_blank" rel="noopener" aria-label="Xem trang khách (mở tab mới)" title="Xem trang khách"><span>Xem trang khách</span>${studioIcon('external')}</a><button class="btn btn-dark btn-save-primary" type="submit">Đăng lên website</button>
          </div>
        </header>
        <div class="studio-layout">
          <aside id="studio-editor-sidebar" class="studio-sidebar" aria-label="Quản lý trang và nội dung" ${outlineHidden ? 'hidden' : ''}>
            <nav class="studio-sidebar-tabs" aria-label="Danh sách trong trình sửa trang"><button type="button" data-sidebar-view="content" aria-pressed="${sidebarView === 'content'}">Nội dung trang</button><button type="button" data-sidebar-view="pages" aria-pressed="${sidebarView === 'pages'}">Danh sách trang</button></nav>
            <div data-sidebar-panel="pages" ${sidebarView !== 'pages' ? 'hidden' : ''}><input id="studio-page-search" class="studio-search" type="search" placeholder="Tìm trang…" aria-label="Tìm trang"><nav id="studio-page-list" aria-label="Danh sách trang"></nav><button class="btn studio-new-page" type="button" data-studio="new-page">+ Tạo trang mới</button></div>
            <div data-sidebar-panel="content" ${sidebarView !== 'content' ? 'hidden' : ''}>
              <div class="studio-content-heading"><b>Chọn nội dung cần sửa</b><button type="button" class="btn btn-sm" data-action="open-block-picker" aria-label="Thêm phần nội dung">${studioIcon('plus')} Thêm</button></div>
              <div id="studio-outline"></div><div class="studio-added-content"><span class="studio-list-caption">NỘI DUNG BỔ SUNG</span><div id="cms-block-manager" class="cms-block-manager"></div></div>
            </div>
          </aside>
          <section class="studio-canvas" aria-label="Trình chỉnh sửa trực quan"><div class="studio-canvas-bar"><button type="button" class="studio-outline-toggle" data-outline-toggle aria-expanded="${!outlineHidden}" aria-controls="studio-editor-sidebar" title="Ẩn hoặc hiện danh sách nội dung">${studioIcon('panel')}<span>Danh sách</span></button><span class="studio-preview-title">Xem trước</span><div class="cms-device-switch" role="group" aria-label="Kích thước xem trước">${[['desktop','Máy tính'],['tablet','Máy tính bảng'],['mobile','Điện thoại']].map(([id,label]) => `<button type="button" class="cms-device-btn ${previewDevice === id ? 'active' : ''}" data-cms-device="${id}" aria-label="${label}" title="${label}" aria-pressed="${previewDevice === id}">${studioIcon(id)}<span>${label}</span></button>`).join('')}</div></div><div class="live-preview-viewport" data-device="${previewDevice}"><iframe id="cms-real-preview" title="Xem trước trang website thật" src="${previewUrl}"></iframe></div><footer class="studio-canvas-footer"><span class="studio-page-address">${studioIcon('page')}<span id="studio-path">${esc(selectedName)}</span></span><span>Bấm vào chữ hoặc ảnh để chỉnh sửa</span></footer></section>
        </div><div class="cms-sync-fields-hidden" hidden inert><div id="cms-fields"></div></div>
      </form>
    </section>
    <section id="studio-panel-packs" class="studio-management-panel" data-studio-panel="packs" ${view !== 'packs' ? 'hidden' : ''} aria-label="Gói dịch vụ"><header class="studio-panel-heading"><div><h2>Gói dịch vụ</h2><p>Tên gói, giá và ảnh hiển thị trên website.</p></div><button type="button" class="btn btn-dark" data-action="open-add-pack-template">+ Thêm gói dịch vụ</button></header><div class="studio-pack-filters"><label><span class="sr-only">Tìm gói dịch vụ</span><input type="search" id="studio-pack-search" placeholder="Tìm tên gói, phong cách…"></label><label><span class="sr-only">Nhóm dịch vụ</span><select id="studio-pack-category"><option value="">Tất cả nhóm dịch vụ</option>${PACK_CATEGORIES.map(([id,label]) => `<option value="${id}">${label}</option>`).join('')}</select></label></div><div id="studio-pack-manager"></div></section>
    <section id="studio-panel-resources" class="studio-management-panel" data-studio-panel="resources" ${view !== 'resources' ? 'hidden' : ''} aria-label="Thư viện và dữ liệu"><header class="studio-panel-heading"><div><h2>Thư viện & dữ liệu</h2><p>Chọn nội dung cần quản lý.</p></div></header><div class="cms-library-shortcuts studio-resource-cards">${[['media','Thư viện ảnh','Tải ảnh lên, tìm ảnh và xem ảnh đang dùng ở đâu.','▧'],['shared','Dữ liệu dùng chung','Dịch vụ, bảng giá, album, đánh giá và liên hệ.','◫'],['templates','Mẫu của bạn','Lưu bố cục thành mẫu để tạo nội dung nhanh hơn.','▤']].map(([id,label,description,symbol]) => `<button type="button" class="studio-resource-card" data-action="open-content-library" data-tab="${id}"><h3>${label}</h3><p>${description}</p><span class="studio-resource-link">Mở</span></button>`).join('')}</div></section>
  </div><div id="cms-media-modal-container"></div><div id="cms-text-modal-container"></div><div id="cms-block-modal-container"></div>`;
}
