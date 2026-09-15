const clamp = value => Math.min(100, Math.max(0, Math.round(value * 100) / 100));

export function parsePosition(value = '50% 50%') {
  const keywords = { left: 0, top: 0, center: 50, right: 100, bottom: 100 };
  let parts = value.trim().split(/\s+/);
  if (parts.length === 1) parts = /top|bottom/.test(parts[0]) ? ['center', parts[0]] : [parts[0], 'center'];
  if (/top|bottom/.test(parts[0])) parts.reverse();
  return parts.slice(0, 2).map(part => clamp(keywords[part] ?? (Number.isFinite(parseFloat(part)) ? parseFloat(part) : 50)));
}

export const positionValue = position => position.map(value => `${clamp(value)}%`).join(' ');

export function imageGeometry(img) {
  const style = img.ownerDocument.defaultView.getComputedStyle(img);
  const width = parseFloat(style.width) || img.clientWidth;
  const height = parseFloat(style.height) || img.clientHeight;
  const nw = img.naturalWidth || width;
  const nh = img.naturalHeight || height;
  const cover = Math.max(width / nw, height / nh);
  const contain = Math.min(width / nw, height / nh);
  const fit = style.objectFit;
  const ratio = fit === 'cover' ? cover : fit === 'contain' ? contain : fit === 'scale-down' ? Math.min(1, contain) : 1;
  const matrix = new DOMMatrixReadOnly(style.transform === 'none' ? undefined : style.transform);
  return {
    width, height, fit, transform: style.transform,
    origin: style.transformOrigin.split(' ').slice(0, 2).map((v, i) => `${parseFloat(v) / (i ? height : width) * 100}%`).join(' '),
    // Percentage positioning moves through the leftover space, not the frame width.
    travelX: (width - (fit === 'fill' ? width : nw * ratio)) * matrix.a,
    travelY: (height - (fit === 'fill' ? height : nh * ratio)) * matrix.d,
  };
}

export function panPosition(start, dx, dy, geometry) {
  return [dx, dy].map((delta, i) => {
    const travel = i ? geometry.travelY : geometry.travelX;
    return Math.abs(travel) > 0.5 ? clamp(start[i] + delta / travel * 100) : start[i];
  });
}

export function setImagePosition(img, value) {
  img.style.setProperty('object-position', value, 'important');
  const paired = img.closest('.fashion-photo')?.querySelector('.fashion-detail');
  if (paired) paired.style.setProperty('object-position', value, 'important');
}

export function bindImagePan(surface, { resolve, change, commit = () => {}, mouseOnly = false }) {
  let drag = null, suppressClick = false;
  surface.addEventListener('dragstart', event => { if (resolve(event)) event.preventDefault(); });
  surface.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary || (mouseOnly && event.pointerType !== 'mouse')) return;
    const img = resolve(event);
    if (!img || !img.complete || !img.naturalWidth) return;
    suppressClick = false;
    drag = { img, id: event.pointerId, x: event.clientX, y: event.clientY,
      start: parsePosition(img.ownerDocument.defaultView.getComputedStyle(img).objectPosition), geometry: imageGeometry(img), moved: false };
  });
  surface.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 3) return;
    if (!drag.moved) { drag.moved = true; drag.img.setPointerCapture(event.pointerId); }
    event.preventDefault();
    change(drag.img, panPosition(drag.start, dx, dy, drag.geometry));
  });
  function finish(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const current = drag;
    drag = null;
    if (current.img.hasPointerCapture(current.id)) current.img.releasePointerCapture(current.id);
    if (!current.moved) return;
    suppressClick = true;
    if (event.type === 'pointercancel' || event.type === 'lostpointercapture') change(current.img, current.start);
    else commit(current.img);
  }
  surface.addEventListener('pointerup', finish);
  surface.addEventListener('pointercancel', finish);
  surface.addEventListener('lostpointercapture', finish);
  return () => { const result = suppressClick; suppressClick = false; return result; };
}

export function openImageEditor({ container, liveImage, label, source, catalog, esc, icon, onPreview, onApply, onCancel }) {
  const geometry = imageGeometry(liveImage);
  const initial = { source, position: parsePosition(liveImage.ownerDocument.defaultView.getComputedStyle(liveImage).objectPosition), alt: liveImage.alt };
  let current = { ...initial, position: [...initial.position] }, ready = false, committed = false, requestId = 0, disposed = false;
  const previousFocus = document.activeElement;
  const scroll = { x: window.scrollX, y: window.scrollY, xFrame: liveImage.ownerDocument.defaultView.scrollX, yFrame: liveImage.ownerDocument.defaultView.scrollY };
  container.innerHTML = `
    <dialog class="cms-image-dialog" aria-labelledby="cms-image-title">
      <header class="cms-image-header">
        <div><h2 id="cms-image-title">Chỉnh sửa ảnh</h2><p>${esc(label)}</p></div>
        <button type="button" class="cms-image-icon" data-image-close aria-label="Đóng" title="Đóng">${icon('close')}</button>
      </header>
      <div class="cms-image-tabs" role="tablist" aria-label="Chỉnh sửa ảnh">
        <button type="button" id="image-crop-tab" role="tab" aria-selected="true" aria-controls="image-crop-panel" data-image-tab="crop">Căn ảnh</button>
        <button type="button" id="image-library-tab" role="tab" aria-selected="false" aria-controls="image-library-panel" data-image-tab="library" tabindex="-1">Thay ảnh</button>
      </div>
      <div class="cms-image-body">
        <section id="image-crop-panel" role="tabpanel" aria-labelledby="image-crop-tab">
          <div class="cms-image-stage" tabindex="0" aria-label="Vị trí ảnh" title="Kéo ảnh để căn vị trí">
            <div class="cms-image-frame"><img id="cms-focal-target-img" alt="Ảnh đang chỉnh" draggable="false"><div class="cms-image-grid" hidden></div></div>
          </div>
          <div class="cms-image-tools">
            <span class="cms-image-size">${Math.round(geometry.width)} × ${Math.round(geometry.height)} px</span>
            <label class="cms-image-grid-toggle"><input type="checkbox" data-image-grid> Lưới căn</label>
            <button type="button" class="cms-image-icon" data-image-reset title="Khôi phục vị trí ban đầu" aria-label="Khôi phục vị trí ban đầu">${icon('back')}</button>
          </div>
          <div class="cms-image-controls">
            ${['Ngang', 'Dọc'].map((text, i) => `<div class="cms-image-axis"><label for="focal-slider-${i ? 'y' : 'x'}">${text}</label><input type="range" id="focal-slider-${i ? 'y' : 'x'}" data-image-axis="${i}" min="0" max="100" step="0.01"><input type="number" data-image-number="${i}" min="0" max="100" step="1" aria-label="Vị trí ${text.toLowerCase()} (%)"><span>%</span></div>`).join('')}
          </div>
          <label class="cms-image-alt" for="cms-image-alt">Mô tả ảnh<input id="cms-image-alt" maxlength="1000" value="${esc(initial.alt)}"></label>
        </section>
        <section id="image-library-panel" role="tabpanel" aria-labelledby="image-library-tab" hidden>
          <div class="cms-image-library-tools">
            <label class="cms-image-upload">${icon('plus')} Tải ảnh lên<input type="file" data-image-upload accept="image/png,image/jpeg,image/webp,image/gif" hidden></label>
            <select data-image-category aria-label="Nhóm ảnh"><option value="all">Tất cả ảnh</option><option value="bridal">Cô dâu</option><option value="party">Dự tiệc</option><option value="campaign">Chiến dịch</option><option value="process">Không gian</option></select>
          </div>
          <div class="cms-image-library">${catalog.map(img => `<button type="button" class="cms-image-choice" data-image-source="${esc(img.src)}" data-category="${img.category}" aria-label="${esc(img.title)}" title="${esc(img.title)}" aria-pressed="${img.src === source}"><img src="${esc(img.src)}" alt="${esc(img.title)}" loading="lazy"></button>`).join('')}</div>
          <form class="cms-image-url"><label for="cms-image-url">Đường dẫn ảnh</label><div><input id="cms-image-url" type="text" placeholder="https://..." value="${esc(source)}"><button type="submit" class="btn">Chọn ảnh</button></div></form>
        </section>
      </div>
      <footer class="cms-image-footer"><span class="cms-image-message" role="status">Bản nháp</span><div><button type="button" class="btn" data-image-close>Hủy</button><button type="button" class="btn btn-dark" data-image-apply disabled>${icon('check')} Áp dụng</button></div></footer>
    </dialog>`;
  const dialog = container.querySelector('dialog');
  const find = selector => dialog.querySelector(selector);
  const image = find('#cms-focal-target-img');
  const stage = find('.cms-image-stage');
  const crop = find('.cms-image-frame');
  const apply = find('[data-image-apply]');
  const message = find('.cms-image-message');
  image.style.objectFit = geometry.fit;
  image.style.transform = geometry.transform;
  image.style.transformOrigin = geometry.origin;
  function resize() {
    const ratio = geometry.width / geometry.height;
    const width = Math.min(stage.clientWidth, stage.clientHeight * ratio);
    crop.style.width = `${width}px`;
    crop.style.height = `${width / ratio}px`;
  }
  function syncControls() {
    const measured = imageGeometry(image);
    for (let i = 0; i < 2; i++) {
      const range = find(`[data-image-axis="${i}"]`), number = find(`[data-image-number="${i}"]`);
      range.value = number.value = current.position[i];
      range.disabled = number.disabled = !ready || Math.abs(i ? measured.travelY : measured.travelX) <= 0.5;
    }
    apply.disabled = !ready;
  }
  function update(position) {
    current.position = position.map(clamp);
    setImagePosition(image, positionValue(current.position));
    syncControls();
    if (ready) onPreview({ ...current, position: positionValue(current.position) });
  }
  function setTab(tab) {
    dialog.querySelectorAll('[data-image-tab]').forEach(button => {
      const active = button.dataset.imageTab === tab;
      button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1;
      find(`#image-${button.dataset.imageTab}-panel`).hidden = !active;
    });
    resize(); syncControls();
  }
  async function selectSource(src, switchTab = true) {
    if (!/^(?:\/(?!\/)|https:\/\/)[^\s<>"']+$/.test(src)) { message.textContent = 'Đường dẫn ảnh không hợp lệ.'; return; }
    const id = ++requestId;
    ready = false; syncControls(); message.textContent = 'Đang tải ảnh...';
    const candidate = new Image();
    candidate.src = src;
    try {
      await candidate.decode();
      if (disposed || id !== requestId) return;
      current.source = src;
      image.src = src;
      await image.decode();
      if (disposed || id !== requestId) return;
      ready = true;
      find('#cms-image-url').value = src;
      dialog.querySelectorAll('[data-image-source]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.imageSource === src)));
      if (switchTab) setTab('crop');
      resize(); update(current.position); message.textContent = 'Bản nháp';
    } catch {
      if (disposed || id !== requestId) return;
      ready = image.complete && image.naturalWidth > 0;
      syncControls(); message.textContent = 'Không tải được ảnh. Vui lòng chọn lại.';
    }
  }
  const observer = new ResizeObserver(() => { resize(); syncControls(); });
  observer.observe(stage);
  bindImagePan(stage, { resolve: () => ready ? image : null, change: (_, position) => update(position) });
  dialog.addEventListener('input', event => {
    const index = event.target.dataset.imageAxis ?? event.target.dataset.imageNumber;
    if (index !== undefined && event.target.value !== '') { const next = [...current.position]; next[Number(index)] = Number(event.target.value); update(next); }
    if (event.target.id === 'cms-image-alt') { current.alt = event.target.value; if (ready) onPreview({ ...current, position: positionValue(current.position) }); }
  });
  dialog.addEventListener('change', async event => {
    if (event.target.matches('[data-image-grid]')) find('.cms-image-grid').hidden = !event.target.checked;
    if (event.target.matches('[data-image-category]')) dialog.querySelectorAll('[data-image-source]').forEach(button => { button.hidden = event.target.value !== 'all' && button.dataset.category !== event.target.value; });
    if (event.target.matches('[data-image-upload]')) {
      const file = event.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { message.textContent = 'Ảnh tối đa 5 MB.'; return; }
      const id = ++requestId;
      event.target.disabled = true; ready = false; syncControls(); message.textContent = 'Đang tải ảnh lên...';
      const data = new FormData(); data.append('files', file);
      try {
        const response = await fetch('/api/uploads', { method: 'POST', body: data });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Không tải được ảnh.');
        if (!disposed && id === requestId) await selectSource(result.paths[0]);
      } catch (error) { if (!disposed && id === requestId) { ready = image.complete && image.naturalWidth > 0; syncControls(); message.textContent = error.message; } }
      finally { event.target.disabled = false; event.target.value = ''; }
    }
  });
  dialog.addEventListener('submit', event => { event.preventDefault(); event.stopPropagation(); void selectSource(find('#cms-image-url').value.trim()); });
  dialog.addEventListener('click', event => {
    if (event.target.closest('[data-image-close]')) dialog.close();
    if (event.target.closest('[data-image-reset]')) update(initial.position);
    const tab = event.target.closest('[data-image-tab]');
    if (tab) setTab(tab.dataset.imageTab);
    const choice = event.target.closest('[data-image-source]');
    if (choice) void selectSource(choice.dataset.imageSource);
    if (event.target.closest('[data-image-apply]') && ready) { onApply({ ...current, position: positionValue(current.position) }); committed = true; dialog.close(); }
  });
  dialog.addEventListener('keydown', event => {
    if (event.target.matches('[role="tab"]') && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault(); const tab = event.target.dataset.imageTab === 'crop' ? 'library' : 'crop'; setTab(tab); find(`[data-image-tab="${tab}"]`).focus({ preventScroll: true });
    }
    if (event.target !== stage || !ready || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const delta = event.shiftKey ? 10 : 1;
    update(panPosition(current.position, event.key === 'ArrowLeft' ? -delta : event.key === 'ArrowRight' ? delta : 0, event.key === 'ArrowUp' ? -delta : event.key === 'ArrowDown' ? delta : 0, imageGeometry(image)));
  });
  const previousOverflow = document.documentElement.style.overflow;
  dialog.addEventListener('close', () => {
    disposed = true; observer.disconnect();
    if (!committed) onCancel();
    document.documentElement.style.overflow = previousOverflow;
    previousFocus?.focus({ preventScroll: true });
    window.scrollTo({ left: scroll.x, top: scroll.y, behavior: 'instant' });
    liveImage.ownerDocument.defaultView.scrollTo({ left: scroll.xFrame, top: scroll.yFrame, behavior: 'instant' });
    dialog.remove();
  }, { once: true });
  dialog.showModal();
  document.documentElement.style.overflow = 'hidden';
  resize(); void selectSource(source, false);
  return () => { if (dialog.open) dialog.close(); };
}
