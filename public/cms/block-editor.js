import { BLOCK_SCHEMAS } from './block-schema.js';
import { CONTENT_BLOCK_TEMPLATES } from '../content-blocks.js';
export function createBlockEditor({ esc, getBlocks, blockModalContainer, blockSlotOptions, option, sourceFields, onActive }) {
  function blockCommonFields(block) {
    const fields = BLOCK_SCHEMAS[block.type].fields;
    const showEyebrow = fields.includes('eyebrow');
    const showTitle = fields.includes('title');
    const showText = fields.includes('text');
    const showImage = fields.includes('image');
    const showButton = fields.includes('buttonHref');
    return `
      ${showEyebrow ? `<label class="cms-field">Dòng dẫn nhỏ<input data-block-field="eyebrow" data-block-id="${esc(block.id)}" value="${esc(block.eyebrow)}" maxlength="80" placeholder="Ví dụ: CÂU CHUYỆN"></label>` : ''}
      ${showTitle ? `<label class="cms-field">Tiêu đề<input data-block-field="title" data-block-id="${esc(block.id)}" value="${esc(block.title)}" maxlength="140"><small>Tối đa 140 ký tự để bảo toàn bố cục.</small></label>` : ''}
      ${showText ? `<label class="cms-field">Nội dung<textarea data-block-field="text" data-block-id="${esc(block.id)}" rows="5" maxlength="3000">${esc(block.text)}</textarea></label>` : ''}
      ${showImage ? `<div class="cms-editor-image"><img src="${esc(block.image || '/assets/campaign.png')}" alt=""><div><label class="cms-field">Đường dẫn ảnh<input data-block-field="image" data-block-id="${esc(block.id)}" value="${esc(block.image)}"></label><label class="btn btn-sm cms-btn-upload">Tải ảnh từ máy<input type="file" data-block-upload="${esc(block.id)}" accept="image/png,image/jpeg,image/webp" hidden></label><button type="button" class="btn btn-sm" data-action="block-media-library" data-id="${esc(block.id)}">Chọn từ thư viện</button></div></div><label class="cms-field">Mô tả ảnh<input data-block-field="alt" data-block-id="${esc(block.id)}" value="${esc(block.alt)}" maxlength="300"></label><label class="cms-field">Chú thích<input data-block-field="caption" data-block-id="${esc(block.id)}" value="${esc(block.caption)}" maxlength="300"></label>` : ''}
      ${block.type === 'testimonial' ? `<label class="cms-field">Tên khách hàng / nguồn<input data-block-field="caption" data-block-id="${esc(block.id)}" value="${esc(block.caption)}" maxlength="120"></label>` : ''}
      ${showButton ? `<div class="cms-editor-grid two"><label class="cms-field">Nhãn nút<input data-block-field="buttonLabel" data-block-id="${esc(block.id)}" value="${esc(block.buttonLabel)}" maxlength="60"></label><label class="cms-field">Liên kết<input data-block-field="buttonHref" data-block-id="${esc(block.id)}" value="${esc(block.buttonHref)}" placeholder="#/booking/service"></label></div>` : ''}
    `;
  }

  function blockCollectionFields(block) {
    if (block.type === 'gallery') return `
      <div class="cms-collection-head"><b>Ảnh trong bộ sưu tập</b><button type="button" class="btn btn-sm" data-action="add-block-image" data-id="${esc(block.id)}">+ Thêm ảnh</button></div>
      <div class="cms-collection-list">${block.images.map((image, index) => `<div class="cms-collection-row image-row"><img src="${esc(image.src || '/assets/campaign.png')}" alt=""><div><input data-block-image-field="src" data-block-id="${esc(block.id)}" data-index="${index}" value="${esc(image.src)}" placeholder="Đường dẫn ảnh"><input data-block-image-field="alt" data-block-id="${esc(block.id)}" data-index="${index}" value="${esc(image.alt)}" placeholder="Mô tả ảnh"></div><label class="cms-icon-action" title="Tải ảnh">↑<input type="file" data-block-gallery-upload="${esc(block.id)}" data-index="${index}" accept="image/png,image/jpeg,image/webp" hidden></label><button type="button" class="cms-icon-action cms-danger-btn" data-action="remove-block-image" data-id="${esc(block.id)}" data-index="${index}">×</button></div>`).join('')}</div>`;
    if (!['features', 'process', 'faq'].includes(block.type)) return '';
    return `
      <div class="cms-collection-head"><b>${block.type === 'faq' ? 'Câu hỏi' : 'Các mục nội dung'}</b><button type="button" class="btn btn-sm" data-action="add-block-item" data-id="${esc(block.id)}">+ Thêm mục</button></div>
      <div class="cms-collection-list">${block.items.map((item, index) => `<div class="cms-collection-row"><span>${String(index + 1).padStart(2, '0')}</span><div><input data-block-item-field="title" data-block-id="${esc(block.id)}" data-index="${index}" value="${esc(item.title)}" placeholder="${block.type === 'faq' ? 'Câu hỏi' : 'Tiêu đề'}"><textarea data-block-item-field="text" data-block-id="${esc(block.id)}" data-index="${index}" rows="2" placeholder="Nội dung">${esc(item.text)}</textarea></div><button type="button" class="cms-icon-action cms-danger-btn" data-action="remove-block-item" data-id="${esc(block.id)}" data-index="${index}">×</button></div>`).join('')}</div>`;
  }

  function openBlockEditor(id) {
    const block = getBlocks().find(item => item.id === id);
    const container = blockModalContainer();
    if (!block || !container) return;
    onActive(id);
    const template = CONTENT_BLOCK_TEMPLATES.find(item => item.type === block.type);
    container.innerHTML = `
      <div class="cms-modal-overlay cms-section-overlay" data-action="close-block-modal">
        <div class="cms-section-dialog cms-block-editor" role="dialog" aria-modal="true" aria-labelledby="cms-block-editor-title">
          <header><div><span class="cms-dialog-kicker">${esc(template?.name || 'NỘI DUNG')}</span><h2 id="cms-block-editor-title">Chỉnh sửa nội dung</h2><p>Nội dung được lưu vào bản nháp.</p></div><button type="button" class="cms-modal-close" data-action="close-block-modal" aria-label="Đóng">&times;</button></header>
          <div class="cms-block-editor-body">
            <section><h3>Nội dung</h3>${sourceFields(block)}${blockCommonFields(block)}${blockCollectionFields(block)}</section>
            <aside><h3>Trình bày</h3>
              <label class="cms-field">Vị trí trong trang<select data-block-setting="slot" data-block-id="${esc(block.id)}">${blockSlotOptions(block.slot)}</select></label>
              <label class="cms-field">Chiều rộng<select data-block-setting="width" data-block-id="${esc(block.id)}">${option('narrow','Hẹp',block.settings.width)}${option('standard','Tiêu chuẩn',block.settings.width)}${option('wide','Rộng',block.settings.width)}${option('full','Toàn màn hình',block.settings.width)}</select></label>
              <label class="cms-field">Khoảng cách<select data-block-setting="spacing" data-block-id="${esc(block.id)}">${option('compact','Nhỏ',block.settings.spacing)}${option('normal','Vừa',block.settings.spacing)}${option('airy','Lớn',block.settings.spacing)}</select></label>
              <label class="cms-field">Nền<select data-block-setting="theme" data-block-id="${esc(block.id)}">${option('white','Trắng',block.settings.theme)}${option('soft','Sáng nhẹ',block.settings.theme)}${option('dark','Đen',block.settings.theme)}${option('wine','Đỏ rượu',block.settings.theme)}</select></label>
              <label class="cms-field">Căn nội dung<select data-block-setting="align" data-block-id="${esc(block.id)}">${option('left','Trái',block.settings.align)}${option('center','Giữa',block.settings.align)}</select></label>
              ${['image','split','gallery'].includes(block.type) ? `<label class="cms-field">Tỷ lệ ảnh<select data-block-setting="ratio" data-block-id="${esc(block.id)}">${option('auto','Tự nhiên',block.settings.ratio)}${option('landscape','Ngang 16:9',block.settings.ratio)}${option('portrait','Dọc 4:5',block.settings.ratio)}${option('square','Vuông 1:1',block.settings.ratio)}</select></label>` : ''}
              ${block.type === 'split' ? `<label class="cms-field">Vị trí ảnh<select data-block-setting="imagePosition" data-block-id="${esc(block.id)}">${option('left','Bên trái',block.settings.imagePosition)}${option('right','Bên phải',block.settings.imagePosition)}${option('top','Phía trên trên mobile',block.settings.imagePosition)}</select></label>` : ''}
              ${['gallery','features','process'].includes(block.type) ? `<label class="cms-field">Số cột<select data-block-setting="columns" data-block-id="${esc(block.id)}">${option('2','2 cột',block.settings.columns)}${option('3','3 cột',block.settings.columns)}${option('4','4 cột',block.settings.columns)}</select></label>` : ''}
            </aside>
          </div>
          <footer><button type="button" class="btn" data-action="save-block-template" data-id="${esc(block.id)}">Lưu làm mẫu</button><button type="button" class="btn btn-dark" data-action="close-block-modal">Xong</button></footer>
        </div>
      </div>`;
    if (block.source) container.querySelectorAll('[data-block-field], [data-block-image-field], [data-block-item-field], [data-block-gallery-upload], [data-action="add-block-image"], [data-action="remove-block-image"], [data-action="block-media-library"]').forEach(input => { input.disabled = true; });
    container.querySelector('.cms-block-editor input:not(:disabled), .cms-block-editor textarea:not(:disabled), [data-cms-source]')?.focus();
  }

  return { openBlockEditor };
}
