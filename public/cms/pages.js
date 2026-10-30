import { createContentBlock } from '../content-blocks.js';
import { copyTemplateBlocks } from './resources.js';

export function collectPageEntries(publicPages, pages, drafts) {
  const custom = [...new Set([...Object.keys(pages), ...Object.keys(drafts)])]
    .filter(path => /^\/pages\/[a-z0-9-]+$/.test(path))
    .map(path => [path, drafts[path]?.fields?.['page-title'] || pages[path]?.fields?.['page-title'] || path]);
  return [...publicPages, ...custom];
}

export function createPageFields(title, template, makeId, copiedFields, templates = []) {
  const types = { story: ['split', 'testimonial', 'cta'], campaign: ['image', 'features', 'services', 'cta'], gallery: ['gallery', 'cta'], blank: [] };
  const saved = templates.find(item => item.id === template && item.kind === 'page');
  const fields = structuredClone(copiedFields || saved?.fields || {});
  const blocks = fields.blocks ? copyTemplateBlocks(JSON.parse(fields.blocks), makeId) : (types[template] || []).map(type => createContentBlock(type, makeId, 1));
  return { ...fields, blocks: JSON.stringify(blocks), 'page-title': title };
}

export function pageDialogHtml({ settings, title, selected, templates, esc }) {
  return `<div class="cms-modal-overlay cms-section-overlay"><div class="cms-section-dialog studio-page-dialog" role="dialog" aria-modal="true" aria-labelledby="studio-page-title"><header><div><h2 id="studio-page-title">${settings ? 'Thiết lập trang' : 'Tạo một trang mới'}</h2><p>Đặt tên, đường dẫn và chọn bố cục ban đầu.</p></div><button class="cms-modal-close" type="button" data-action="close-block-modal" aria-label="Đóng">×</button></header><form id="studio-page-form" data-settings="${settings}"><label class="cms-field">Tên trang<input name="title" required maxlength="100" placeholder="Ví dụ: Mùa cưới 2026" value="${settings ? esc(title) : ''}"></label>${settings ? `<p class="studio-url">Đường dẫn: #${esc(selected)}</p>` : `<label class="cms-field">Đường dẫn<span class="studio-url">#/pages/<input name="slug" required maxlength="70" pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="mua-cuoi-2026"></span></label><label class="cms-field">Mẫu khởi đầu<select name="template"><option value="story">Câu chuyện thương hiệu</option><option value="campaign">Giới thiệu dịch vụ / chiến dịch</option><option value="gallery">Bộ sưu tập ảnh</option><option value="blank">Trang trống</option>${templates.filter(t => t.kind === 'page').map(t => `<option value="${esc(t.id)}">Mẫu của bạn: ${esc(t.name)}</option>`).join('')}</select></label>`}<p class="studio-sidebar-tip">Trang mới được lưu thành bản nháp. Xuất bản khi bạn đã kiểm tra xong.</p><p id="studio-page-error" role="alert"></p><footer>${settings ? '<button class="btn" type="button" data-studio="duplicate-page">Nhân bản trang</button>' : ''}<button type="submit" class="btn btn-dark">${settings ? 'Lưu tên trang' : 'Tạo trang & chỉnh sửa →'}</button></footer></form></div></div>`;
}
