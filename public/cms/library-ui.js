import { RESOURCE_DEFAULTS, makeContentId, mediaUsage, copyTemplateBlocks } from './resources.js';
import { validImage } from './block-schema.js';

export function createContentLibrary({ request, esc, toast, isAdmin, getState, getContext, builtinMedia, onChange, onInsert, onSelectMedia, adminHeaders }) {
  let resources = Object.fromEntries(Object.entries(RESOURCE_DEFAULTS).map(([name, value]) => [name, { value: structuredClone(value), revision: '' }]));
  let dialog, tab = 'shared', busy = false, loaded = false, mediaTarget = null;
  const shared = () => resources.shared.value;
  const templates = () => resources.templates.value;
  function catalog() {
    const map = new Map(builtinMedia.map(image => [image.src, { alt: image.title, ...image }]));
    for (const image of resources.media.value) map.set(image.src, image);
    const context = getContext();
    const discover = fields => {
      for (const [key, value] of Object.entries(fields || {})) if (key.startsWith('img-') && value && validImage(value) && !map.has(value)) map.set(value, { src: value, title: 'Ảnh đang sử dụng', category: 'khac', alt: '', desc: '' });
      try { for (const block of JSON.parse(fields?.blocks || '[]')) for (const image of [{ src: block.image, alt: block.alt }, ...(block.images || [])]) if (image.src && !map.has(image.src)) map.set(image.src, { title: block.title || 'Ảnh nội dung', category: 'khac', desc: '', ...image }); } catch { /* checked on publish */ }
    };
    Object.values(context.pages).forEach(page => discover(page.fields));
    Object.values(context.drafts).forEach(page => discover(page.fields));
    discover(context.fields);
    for (const album of shared().albums) for (const image of album.images) if (!map.has(image.src)) map.set(image.src, { title: album.title, category: 'album', desc: '', ...image });
    for (const item of getState().portfolio || []) if (item.image && !map.has(item.image)) map.set(item.image, { src: item.image, title: item.title, category: 'pack', alt: '', desc: '' });
    return [...map.values()];
  }
  async function load() {
    const result = await request('/api/cms-resources' + (isAdmin() ? '?admin=1' : ''), undefined, isAdmin());
    for (const name of Object.keys(resources)) if (result[name]) resources[name] = result[name];
    loaded = true;
  }
  async function save(name, value) {
    const result = await request('/api/cms-resources', { name, value, revision: resources[name].revision }, true);
    resources[name] = result.resource;
    onChange();
  }
  const field = (label, name, value = '', { type = 'text', max = 3000, required = false } = {}) => `<label class="cms-field">${label}${type === 'textarea' ? `<textarea name="${name}" maxlength="${max}" ${required ? 'required' : ''} rows="3">${esc(value)}</textarea>` : `<input name="${name}" type="${type}" value="${esc(value)}" maxlength="${max}" ${required ? 'required' : ''} ${type === 'number' ? 'min="0" step="1"' : ''}>`}</label>`;
  const button = (action, label, id = '') => `<button type="button" class="btn btn-sm" data-lib="${action}" data-id="${esc(id)}">${label}</button>`;
  function close() { dialog?.close(); }
  async function open(nextTab = 'shared', target = null) {
    mediaTarget = target;
    if (!isAdmin()) return;
    try { await load(); } catch (error) { toast(error.message); return; }
    dialog?.remove();
    dialog = document.createElement('dialog'); dialog.className = 'cms-library-dialog';
    document.body.append(dialog);
    dialog.addEventListener('close', () => { dialog.remove(); });
    dialog.addEventListener('click', event => { const control = event.target.closest('[data-lib]'); if (control) { event.preventDefault(); void act(control.dataset.lib, control.dataset.id); } });
    dialog.addEventListener('submit', event => { event.preventDefault(); event.stopPropagation(); if (!busy) void submit(event.target); });
    dialog.addEventListener('input', event => { if (event.target.matches('[data-lib-search]')) filterMedia(); });
    dialog.addEventListener('change', event => {
      if (event.target.matches('[data-lib-category]')) filterMedia();
      if (event.target.matches('[data-lib-upload]')) void upload(event.target);
    });
    tab = nextTab; draw(); dialog.showModal();
  }
  function draw(body = '') {
    dialog.innerHTML = `<header class="cms-library-header"><div><h2>${{ shared: 'Dữ liệu dùng chung', media: 'Thư viện ảnh', templates: 'Mẫu tái sử dụng' }[tab]}</h2></div>${button('close', 'Đóng')}</header><nav class="cms-library-tabs" aria-label="Thư viện nội dung">${[['shared','Dữ liệu dùng chung'],['media','Thư viện ảnh'],['templates','Mẫu tái sử dụng']].map(([id,label]) => `<button type="button" class="btn ${tab === id ? 'btn-dark' : ''}" data-lib="tab" data-id="${id}">${label}</button>`).join('')}</nav><p data-lib-status role="status"></p><div class="cms-library-body">${body || (tab === 'shared' ? sharedHtml() : tab === 'media' ? mediaHtml() : templatesHtml())}</div>`;
  }
  function sharedHtml() {
    const state = getState();
    return `<p>Chỉnh sửa và đăng một lần, các khối liên kết sẽ cập nhật theo. Dịch vụ và liên hệ dùng chung với hệ thống đặt lịch.</p><div class="cms-library-section"><h3>Dịch vụ & bảng giá</h3>${button('add-pricing', '+ Chèn bảng giá vào trang')}<div class="cms-library-list">${state.services.map(service => `<article><div><b>${esc(service.name)}</b><p>${service.contact ? 'Liên hệ tư vấn' : new Intl.NumberFormat('vi-VN').format(service.price) + ' ₫'} · ${service.duration} phút · ${service.enabled ? 'Đang hiện' : 'Đang ẩn'}</p></div>${button('service', 'Chỉnh sửa', service.id)}</article>`).join('')}</div><a class="btn btn-sm" href="#/admin/services" data-lib="goto-services">Quản lý toàn bộ dịch vụ</a></div><div class="cms-library-section"><h3>Thông tin liên hệ</h3><p>${esc(state.brand.phone || 'Chưa có số điện thoại')} · ${esc(state.brand.email || 'Chưa có email')}</p>${button('brand', 'Chỉnh sửa liên hệ')}</div><div class="cms-library-section"><h3>Album dùng chung</h3>${button('album', '+ Tạo album')}<div class="cms-library-list">${shared().albums.map(album => `<article><div><b>${esc(album.title)}</b><p>${album.images.length} ảnh</p></div><div>${button('bind-album', 'Chèn vào trang', album.id)}${button('album', 'Sửa', album.id)}${button('delete-album', 'Xóa', album.id)}</div></article>`).join('') || '<p>Chưa có album dùng chung.</p>'}</div></div><div class="cms-library-section"><h3>Đánh giá khách hàng</h3>${button('review', '+ Thêm đánh giá')}<div class="cms-library-list">${shared().testimonials.map(review => `<article><div><b>${esc(review.author)}</b><p>${esc(review.text)}</p></div><div>${button('bind-review', 'Chèn vào trang', review.id)}${button('review', 'Sửa', review.id)}${button('delete-review', 'Xóa', review.id)}</div></article>`).join('') || '<p>Chưa có đánh giá dùng chung.</p>'}</div></div>`;
  }
  function usage(src) {
    const context = getContext();
    return mediaUsage(src, context.pages, { ...context.drafts, [context.path]: { fields: context.fields } }, shared(), templates(), getState().portfolio, getState().brand);
  }
  function mediaHtml() {
    const images = catalog();
    return `<div class="cms-library-tools"><input type="search" data-lib-search placeholder="Tìm tên, mô tả hoặc đường dẫn ảnh" aria-label="Tìm ảnh"><select data-lib-category aria-label="Phân loại ảnh"><option value="">Tất cả nhóm</option>${[...new Set(images.map(i => i.category || 'khac'))].sort().map(category => `<option value="${esc(category)}">${esc(category)}</option>`).join('')}</select><label class="btn">Tải ảnh lên<input type="file" data-lib-upload accept="image/png,image/jpeg,image/webp" multiple hidden></label>${button('media-new', '+ Thêm bằng đường dẫn')}</div><p>Chọn tối đa 3 ảnh mỗi lần, JPG/PNG/WebP, tối đa 5 MB mỗi ảnh.</p><div class="cms-library-grid">${images.map(image => {
      const uses = usage(image.src);
      return `<article class="cms-library-image" data-media-category="${esc(image.category || 'khac')}" data-media-search="${esc([image.title, image.alt, image.desc, image.src].join(' ').toLocaleLowerCase('vi'))}"><img src="${esc(image.src)}" alt="${esc(image.alt || image.title)}" loading="lazy"><b>${esc(image.title)}</b><small>${esc(image.category || 'khac')}</small><p>${esc(image.alt || 'Chưa có mô tả ảnh')}</p><details><summary>Đang dùng tại ${uses.length} nơi</summary>${uses.map(use => `<p>${esc(use)}</p>`).join('') || '<p>Chưa thấy trong dữ liệu nội dung đã lưu.</p>'}</details><div>${button('media-use', mediaTarget ? 'Chọn ảnh này' : 'Chèn khối ảnh', image.src)}${button('media-edit', 'Sửa thông tin', image.src)}</div></article>`;
    }).join('')}</div><p data-media-empty hidden>Không tìm thấy ảnh phù hợp.</p>`;
  }
  function templatesHtml() {
    return `<p>Lưu nội dung thành mẫu và chèn lại khi cần. Bản sao có thể chỉnh sửa riêng; nguồn album và đánh giá được giữ liên kết.</p>${button('save-page', '+ Lưu trang đang sửa làm mẫu')}<div class="cms-library-list">${templates().map(template => `<article><div><b>${esc(template.name)}</b><p>${template.kind === 'page' ? 'Mẫu trang · chọn khi tạo trang mới' : 'Mẫu khối'}</p></div><div>${template.kind === 'block' ? button('insert-template', 'Chèn vào trang', template.id) : ''}${button('rename-template', 'Đổi tên', template.id)}${button('delete-template', 'Xóa mẫu', template.id)}</div></article>`).join('') || '<p>Chưa có mẫu tùy chỉnh. Mở một khối và chọn “Lưu làm mẫu”.</p>'}</div>`;
  }
  function filterMedia() {
    const query = dialog.querySelector('[data-lib-search]').value.toLocaleLowerCase('vi').trim(), category = dialog.querySelector('[data-lib-category]').value;
    let count = 0;
    dialog.querySelectorAll('[data-media-search]').forEach(card => { card.hidden = !(card.dataset.mediaSearch.includes(query) && (!category || card.dataset.mediaCategory === category)); if (!card.hidden) count++; });
    dialog.querySelector('[data-media-empty]').hidden = count > 0;
  }
  const formHtml = (kind, title, body, id = '') => `<form data-library-form="${kind}" data-id="${esc(id)}"><h3>${title}</h3>${body}<footer>${button('back', 'Quay lại')}<button type="submit" class="btn btn-dark">${['service','brand','album','review'].includes(kind) ? 'Lưu & đăng dữ liệu dùng chung' : 'Lưu'}</button></footer></form>`;
  async function act(action, id) {
    if (busy) return;
    try {
      if (action === 'close') return close();
      if (action === 'tab') { tab = id; draw(); return; }
      if (action === 'back') return draw();
      if (action === 'goto-services') { close(); location.hash = '/admin/services'; return; }
      if (action === 'service') {
        const s = getState().services.find(s => s.id === id);
        draw(formHtml('service', 'Chỉnh sửa dịch vụ', field('Tên dịch vụ', 'name', s.name, { max: 140, required: true }) + field('Giá (VNĐ)', 'price', s.price, { type: 'number', required: true }) + field('Thời lượng (phút)', 'duration', s.duration, { type: 'number', required: true }) + field('Mô tả', 'description', s.description, { type: 'textarea' }) + `<label><input type="checkbox" name="contact" ${s.contact ? 'checked' : ''}> Hiện “Liên hệ tư vấn” thay cho giá</label><label><input type="checkbox" name="enabled" ${s.enabled ? 'checked' : ''}> Hiển thị dịch vụ</label>`, id));
      } else if (action === 'brand') {
        const b = getState().brand;
        draw(formHtml('brand', 'Thông tin liên hệ', ['phone', 'email', 'address', 'facebookUrl', 'instagramUrl', 'tiktokUrl'].map((key, index) => field(['Số điện thoại','Email','Địa chỉ','Facebook (HTTPS)','Instagram (HTTPS)','TikTok (HTTPS)'][index], key, b[key] || '', { max: 500, type: key === 'email' ? 'email' : 'text' })).join('')));
      } else if (action === 'album') {
        const album = shared().albums.find(a => a.id === id) || { title: '', images: [] };
        draw(formHtml('album', id ? 'Chỉnh sửa album' : 'Tạo album', field('Tên album', 'title', album.title, { max: 140, required: true }) + '<p>Mỗi dòng: đường dẫn ảnh | mô tả ảnh | chú thích. Tối đa 8 ảnh. Có thể lấy đường dẫn từ thư viện ảnh.</p>' + field('Danh sách ảnh', 'images', album.images.map(i => [i.src, i.alt, i.caption].join(' | ')).join('\n'), { type: 'textarea', max: 16000, required: true }), id));
      } else if (action === 'review') {
        const review = shared().testimonials.find(r => r.id === id) || { author: '', text: '' };
        draw(formHtml('review', 'Đánh giá khách hàng', field('Tên khách hàng', 'author', review.author, { max: 120, required: true }) + field('Nội dung đánh giá', 'text', review.text, { type: 'textarea', required: true }), id));
      } else if (action === 'media-new' || action === 'media-edit') {
        const image = catalog().find(i => i.src === id) || { src: '', title: '', category: 'khac', alt: '', desc: '' };
        draw(formHtml('media', 'Thông tin ảnh', field('Đường dẫn ảnh', 'src', image.src, { max: 2000, required: true }) + field('Tên ảnh', 'title', image.title, { max: 140, required: true }) + field('Nhóm ảnh', 'category', image.category, { max: 80, required: true }) + field('Mô tả ảnh (alt)', 'alt', image.alt, { max: 300 }) + field('Ghi chú / từ khóa', 'desc', image.desc, { type: 'textarea', max: 1000 }) + '<p>Mô tả được dùng khi chọn ảnh lần sau. Ảnh đã đặt trên trang giữ mô tả riêng.</p>', id));
        if (id) dialog.querySelector('[name="src"]').readOnly = true;
      } else if (action === 'media-use') {
        const image = catalog().find(i => i.src === id);
        onSelectMedia(image, mediaTarget); close();
      } else if (action === 'add-pricing') { onInsert('services'); close();
      } else if (action === 'bind-album' || action === 'bind-review') { onInsert(action === 'bind-album' ? 'gallery' : 'testimonial', { source: { kind: action === 'bind-album' ? 'albums' : 'testimonials', id } }); close();
      } else if (action === 'save-page') return saveTemplate('page');
      else if (action === 'insert-template') { onInsert(null, { blocks: copyTemplateBlocks(templates().find(t => t.id === id).blocks, makeContentId) }); close();
      } else if (action === 'rename-template') {
        const template = templates().find(t => t.id === id);
        draw(formHtml('template-rename', 'Đổi tên mẫu', field('Tên mẫu', 'name', template.name, { max: 100, required: true }), id));
      } else if (action.startsWith('delete-')) {
        const kind = action === 'delete-album' ? 'albums' : action === 'delete-review' ? 'testimonials' : 'templates';
        draw(`<h3>Xóa ${kind === 'templates' ? 'mẫu' : 'dữ liệu dùng chung'}?</h3><p>${kind === 'templates' ? 'Những bản sao đã chèn trên trang vẫn được giữ.' : 'Chỉ xóa được khi không còn trang hoặc mẫu nào liên kết.'}</p>${button('back', 'Quay lại')}${button('confirm-delete-' + kind, 'Xóa', id)}`);
      } else if (action.startsWith('confirm-delete-')) {
        busy = true;
        const kind = action.slice('confirm-delete-'.length);
        if (kind === 'templates') await save('templates', templates().filter(t => t.id !== id));
        else await save('shared', { ...shared(), [kind]: shared()[kind].filter(item => item.id !== id) });
        draw(); toast('Đã xóa.');
      }
    } catch (error) { status(error.message); } finally { busy = false; }
  }
  function status(message) { const node = dialog?.querySelector('[data-lib-status]'); if (node) node.textContent = message; else toast(message); }
  async function submit(form) {
    busy = true; const button = form.querySelector('[type="submit"]'); button.disabled = true;
    const values = Object.fromEntries(new FormData(form)), id = form.dataset.id, kind = form.dataset.libraryForm;
    try {
      if (kind === 'service') {
        const original = getState().services.find(s => s.id === id);
        const price = Number(values.price), duration = Number(values.duration);
        if (!Number.isSafeInteger(price) || price < 0 || !Number.isSafeInteger(duration) || duration < 1 || duration > 1440) throw new Error('Giá phải từ 0 và thời lượng từ 1 đến 1440 phút.');
        const result = await request('/api/data', { ...original, ...values, id, action: 'saveService', price, duration, enabled: values.enabled === 'on', contact: values.contact === 'on' }, true);
        Object.assign(original, result.service); onChange();
      } else if (kind === 'brand') {
        for (const key of ['facebookUrl','instagramUrl','tiktokUrl']) if (values[key] && !/^https:\/\/[^\s<>"']+$/.test(values[key])) throw new Error('Liên kết mạng xã hội cần bắt đầu bằng HTTPS.');
        const brand = { ...getState().brand, ...values };
        await request('/api/data', { action: 'saveContent', key: 'brand', value: brand }, true);
        getState().brand = brand; onChange();
      } else if (kind === 'album' || kind === 'review') {
        const key = kind === 'album' ? 'albums' : 'testimonials';
        const entry = kind === 'album' ? { id: id || makeContentId(), title: values.title.trim(), images: values.images.split('\n').filter(line => line.trim()).map(line => { const [src = '', alt = '', caption = ''] = line.split('|').map(v => v.trim()); return { src, alt, caption }; }) } : { id: id || makeContentId(), author: values.author.trim(), text: values.text.trim() };
        const items = shared()[key].filter(item => item.id !== id); items.push(entry);
        await save('shared', { ...shared(), [key]: items });
      } else if (kind === 'media') {
        if (!validImage(values.src) || !values.src) throw new Error('Ảnh cần đường dẫn nội bộ hoặc HTTPS.');
        const items = resources.media.value.filter(item => item.src !== values.src); items.push(values);
        await save('media', items);
      } else if (kind === 'template-save' || kind === 'template-rename') {
        if (kind === 'template-rename') await save('templates', templates().map(item => item.id === id ? { ...item, name: values.name.trim() } : item));
        else {
          const context = getContext(), templateKind = form.dataset.templateKind;
          const block = context.blocks.find(block => block.id === id);
          if (templateKind === 'block' && !block) throw new Error('Khối đã thay đổi. Mở lại và lưu mẫu.');
          const pageFields = context.path.startsWith('/pages/') ? { ...context.fields } : { blocks: context.fields.blocks || '[]', 'page-title': context.fields['page-title'] || '' };
          const entry = { id: makeContentId(), name: values.name.trim(), kind: templateKind, ...(templateKind === 'page' ? { fields: pageFields } : { blocks: [block] }) };
          await save('templates', [...templates(), entry]);
        }
      }
      draw(); toast('Đã lưu.');
    } catch (error) { status(error.message); } finally { busy = false; button.disabled = false; }
  }
  async function upload(input) {
    const files = [...input.files];
    if (!files.length) return;
    if (files.length > 3 || files.some(file => file.size > 5 * 1024 * 1024 || !['image/jpeg','image/png','image/webp'].includes(file.type))) { status('Chọn tối đa 3 ảnh JPG/PNG/WebP, mỗi ảnh tối đa 5 MB.'); input.value = ''; return; }
    busy = true; input.disabled = true; status('Đang tải ảnh…');
    try {
      const data = new FormData(); files.forEach(file => data.append('files', file));
      const response = await fetch('/api/uploads', { method: 'POST', body: data, headers: adminHeaders() });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Không tải được ảnh.');
      await load(); draw();
      if (result.libraryWarning) status(result.libraryWarning + '\n' + result.paths.join('\n'));
      else toast('Đã thêm ảnh vào thư viện.');
    } catch (error) { status(error.message); } finally { busy = false; input.disabled = false; input.value = ''; }
  }
  async function saveTemplate(kind, id = '') {
    if (!dialog?.open) await open('templates');
    if (!dialog?.open) return;
    tab = 'templates';
    const context = getContext();
    draw(formHtml('template-save', kind === 'page' ? 'Lưu trang làm mẫu' : 'Lưu khối làm mẫu', (kind === 'page' && !context.path.startsWith('/pages/') ? '<p>Mẫu lưu các khối nội dung bổ sung để tạo trang mới. Phần giao diện cố định của trang hệ thống không được sao chép.</p>' : '') + field('Tên mẫu', 'name', kind === 'page' ? context.fields['page-title'] || 'Mẫu trang mới' : context.blocks.find(b => b.id === id)?.title || 'Mẫu khối mới', { max: 100, required: true }), id));
    dialog.querySelector('form').dataset.templateKind = kind;
  }
  function sourceFields(block) {
    if (!['gallery', 'testimonial'].includes(block.type)) return '';
    const kind = block.type === 'gallery' ? 'albums' : 'testimonials';
    return `<label class="cms-field">Nguồn nội dung<select data-cms-source="${esc(block.id)}"><option value="">Nội dung riêng của khối</option>${shared()[kind].map(item => `<option value="${esc(item.id)}" ${block.source?.id === item.id ? 'selected' : ''}>Dùng chung: ${esc(item.title || item.author)}</option>`).join('')}${block.source && !shared()[kind].some(item => item.id === block.source.id) ? `<option value="${esc(block.source.id)}" selected>Nguồn đã bị xóa</option>` : ''}</select><small>Khi liên kết, nội dung hiển thị lấy từ Dữ liệu dùng chung. Chọn nội dung riêng để sửa tại khối.</small></label>`;
  }
  return { load, shared, templates, catalog, open, close, saveTemplate, sourceFields, setShared: value => { resources.shared.value = value; }, get loaded() { return loaded; } };
}
