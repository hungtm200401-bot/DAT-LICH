export const PACK_CATEGORIES = [['personal', 'Cá nhân'], ['party', 'Dự tiệc'], ['bridal', 'Cô dâu'], ['photo', 'Chụp ảnh']];
export const packImageUrl = image => !image ? '/assets/natural.png' : /^(?:\/|https?:|blob:)/.test(image) ? image : '/assets/' + image;

export function packEditorHtml({ pack, serviceId, services, esc }) {
  const service = services.find(item => item.id === serviceId);
  const defaults = { personal: ['natural.png', 'Tự nhiên'], party: ['evening.png', 'Dự tiệc'], bridal: ['bridal-new.png', 'Cô dâu'], photo: ['campaign.png', 'Chụp ảnh'] }[serviceId] || ['natural.png', 'Tự nhiên'];
  const value = {
    title: pack?.title ?? service?.name ?? 'Gói trang điểm mới', note: pack?.note ?? service?.description ?? '',
    price: pack?.price ?? (service?.contact ? 'Liên hệ tư vấn' : new Intl.NumberFormat('vi-VN').format(service?.price || 0) + 'đ'),
    duration: pack?.duration ?? `${service?.duration || 60} phút`, tag: pack?.tag ?? defaults[1], image: pack?.image || defaults[0],
  };
  const field = (id, label, val, extra = '') => `<label class="pack-field" for="modal-new-pack-${id}"><span>${label}</span><input id="modal-new-pack-${id}" value="${esc(val)}" ${extra}></label>`;
  return `<div class="cms-modal-overlay cms-section-overlay cms-pack-overlay">
    <section class="cms-section-dialog cms-pack-dialog" role="dialog" aria-modal="true" aria-labelledby="pack-editor-title" tabindex="-1">
      <header class="pack-editor-header"><div><h2 id="pack-editor-title">${pack ? 'Chỉnh sửa gói dịch vụ' : 'Thêm gói dịch vụ'}</h2></div><div><button type="button" data-pack-preview aria-expanded="false">Xem trước</button><button type="button" class="cms-modal-close" data-action="close-block-modal" aria-label="Đóng">×</button></div></header>
      <nav class="pack-step-tabs" aria-label="Các bước chỉnh sửa gói">${[['info','Thông tin'],['pricing','Giá & thời lượng'],['image','Hình ảnh']].map(([id,label], index) => `<button type="button" data-pack-step="${id}" aria-controls="pack-step-${id}" aria-current="${index === 0 ? 'step' : 'false'}"><span>${index + 1}</span>${label}</button>`).join('')}</nav>
      <div class="pack-editor-body">
        <form id="cms-new-pack-form" ${pack ? `data-edit-id="${esc(pack.id)}"` : ''}>
          <section class="pack-step-panel" id="pack-step-info" data-pack-panel="info">
            <div class="pack-section-heading"><h3>Thông tin gói</h3></div>
            <label class="pack-field" for="modal-new-pack-service"><span>Nhóm dịch vụ</span><select id="modal-new-pack-service">${PACK_CATEGORIES.map(([id,label]) => `<option value="${id}" ${id === serviceId ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
            ${field('title', 'Tên gói dịch vụ', value.title, 'required maxlength="140" placeholder="Ví dụ: Makeup cô dâu trong trẻo"')}
            <label class="pack-field" for="modal-new-pack-note"><span>Mô tả ngắn</span><textarea id="modal-new-pack-note" rows="4" maxlength="3000" placeholder="Phong cách trang điểm, điểm nổi bật của gói…">${esc(value.note)}</textarea></label>
            ${field('tag', 'Nhãn phong cách', value.tag, 'maxlength="60" placeholder="Ví dụ: Tự nhiên"')}
          </section>
          <section class="pack-step-panel" id="pack-step-pricing" data-pack-panel="pricing" hidden>
            <div class="pack-section-heading"><h3>Giá & thời lượng</h3></div>
            ${field('price', 'Giá hiển thị', value.price, 'maxlength="80" placeholder="450.000đ hoặc Liên hệ tư vấn"')}<p class="pack-field-hint">Có thể nhập “Liên hệ tư vấn” nếu chưa có giá cố định.</p>
            ${field('duration', 'Thời lượng', value.duration, 'maxlength="80" placeholder="Ví dụ: 60 phút"')}
          </section>
          <section class="pack-step-panel" id="pack-step-image" data-pack-panel="image" hidden>
            <div class="pack-section-heading"><h3>Hình ảnh đại diện</h3></div>
            <label class="pack-upload-zone" for="modal-pack-file-upload"><span class="pack-upload-icon">↑</span><b>Tải ảnh từ máy</b><span>JPG, PNG hoặc WebP · Tối đa 5 MB</span><input type="file" id="modal-pack-file-upload" accept="image/png,image/jpeg,image/webp"></label>
            <div id="pack-upload-filename-badge" class="pack-file-status"><span>Ảnh đã chọn: <b id="pack-upload-active-filename">${esc(value.image.split('/').pop())}</b></span><span id="pack-upload-status-pill" role="status">Sẵn sàng</span></div>
            <details class="pack-sample-library"><summary>Chọn ảnh có sẵn</summary><div class="pack-sample-grid">${[['natural.png','Tự nhiên'],['evening.png','Dự tiệc'],['bridal-new.png','Cô dâu'],['natural-detail.png','Cận cảnh'],['campaign.png','Chụp ảnh']].map(([image,label]) => `<button type="button" class="${value.image === image ? 'is-selected' : ''}" data-action="pick-pack-sample" data-img="${image}" aria-pressed="${value.image === image}"><img src="/assets/${image}" alt="" loading="lazy"><span>${label}</span></button>`).join('')}</div></details>
            <input id="modal-new-pack-img" value="${esc(value.image)}" type="hidden">
          </section>
        </form>
        <aside class="pack-preview-column" aria-label="Xem trước gói dịch vụ"><div class="pack-preview-heading"><b>Xem trước trên website</b></div>
          <article class="pack-preview-card"><button type="button" id="modal-pack-photo-container" title="Đổi ảnh đại diện"><img id="modal-pack-preview-img" src="${esc(packImageUrl(value.image))}" alt="Ảnh đại diện gói"><span>Đổi ảnh</span></button><div class="pack-preview-copy"><span id="card-preview-live-tag">${esc(value.tag)}</span><h3 id="card-preview-live-title">${esc(value.title)}</h3><p id="card-preview-live-note">${esc(value.note)}</p><div class="pack-preview-meta"><b id="card-preview-live-price">${esc(value.price)}</b><span id="card-preview-live-duration">${esc(value.duration)}</span></div><div class="pack-preview-cta" aria-hidden="true">Xem chi tiết gói <span>→</span></div></div></article>
          
        </aside>
      </div>
      <footer class="pack-editor-footer"><div>${pack ? `<details class="pack-danger-menu"><summary>Thao tác khác</summary><button type="button" class="btn" data-action="delete-pack-from-modal" data-id="${esc(pack.id)}">Xóa gói dịch vụ</button></details>` : ''}</div><div class="pack-footer-actions"><button type="button" class="btn" data-action="close-block-modal">Hủy</button><button type="button" class="btn" data-pack-back hidden>Quay lại</button><button type="button" class="btn btn-dark" data-pack-next>Tiếp tục</button><button type="submit" form="cms-new-pack-form" class="btn btn-dark" data-pack-save hidden>${pack ? 'Lưu thay đổi' : 'Lưu gói dịch vụ'}</button></div></footer>
    </section>
  </div>`;
}

export function bindPackEditor(root) {
  const steps = ['info', 'pricing', 'image']; let active = 0;
  const showStep = index => {
    const title = root.querySelector('#modal-new-pack-title');
    title.setCustomValidity(title.value.trim() ? '' : 'Vui lòng nhập tên gói dịch vụ.');
    if (index > active && !title.value.trim()) { showStep(0); title.reportValidity(); return; }
    active = index;
    root.querySelector('#cms-new-pack-form').dataset.step = steps[index];
    root.querySelector('.cms-pack-dialog').classList.remove('is-preview-open');
    root.querySelector('[data-pack-preview]').setAttribute('aria-expanded', 'false');
    root.querySelector('[data-pack-preview]').textContent = 'Xem trước';
    root.querySelectorAll('[data-pack-panel]').forEach(panel => { panel.hidden = panel.dataset.packPanel !== steps[index]; });
    root.querySelectorAll('[data-pack-step]').forEach(button => button.setAttribute('aria-current', button.dataset.packStep === steps[index] ? 'step' : 'false'));
    root.querySelector('[data-pack-back]').hidden = index === 0;
    root.querySelector('[data-pack-next]').hidden = index === 2;
    root.querySelector('[data-pack-save]').hidden = index !== 2;
    root.querySelector('.pack-editor-body').scrollTop = 0;
  };
  root.querySelectorAll('[data-pack-step]').forEach(button => button.addEventListener('click', () => showStep(steps.indexOf(button.dataset.packStep))));
  root.querySelector('[data-pack-next]').addEventListener('click', () => showStep(Math.min(2, active + 1)));
  root.querySelector('[data-pack-back]').addEventListener('click', () => showStep(Math.max(0, active - 1)));
  for (const [key, target, fallback] of [['title','title','Tên gói dịch vụ'],['note','note',''],['price','price','Liên hệ tư vấn'],['duration','duration',''],['tag','tag','']]) {
    root.querySelector('#modal-new-pack-' + key).addEventListener('input', event => { event.target.setCustomValidity(''); root.querySelector('#card-preview-live-' + target).textContent = event.target.value.trim() || fallback; });
  }
  root.querySelector('[data-pack-preview]').addEventListener('click', event => {
    const open = root.querySelector('.cms-pack-dialog').classList.toggle('is-preview-open');
    event.target.setAttribute('aria-expanded', String(open)); event.target.textContent = open ? 'Tiếp tục sửa' : 'Xem trước';
  });
  root.querySelector('#modal-pack-photo-container').addEventListener('click', () => { showStep(2); root.querySelector('#modal-pack-file-upload').click(); });
  const dialog = root.querySelector('[role="dialog"]');
  const keydown = event => {
    if (!dialog.isConnected) { document.removeEventListener('keydown', keydown, true); return; }
    if (document.querySelector('dialog[open]')) return;
    if (event.key === 'Escape') { event.preventDefault(); root.querySelector('button[data-action="close-block-modal"]').click(); return; }
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('button, input, select, textarea, summary, [tabindex="0"]')].filter(node => !node.disabled && node.getClientRects().length && !node.closest('details:not([open]) :not(summary)'));
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  document.addEventListener('keydown', keydown, true);
  showStep(0);
  root.querySelector('#modal-new-pack-title').focus({ preventScroll: true });
}
