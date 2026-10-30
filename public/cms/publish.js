import { BLOCK_SCHEMAS, validateBlockData, validImage } from './block-schema.js';
import { resolveBlock } from './resources.js';

/** @param {{path: string, fields: Record<string, string>, descriptors?: Array<any>, shared?: any, services?: Array<any>}} input */
export function inspectPage({ path, fields, descriptors = [], shared = {}, services = [] }) {
  const issues = [];
  const add = (severity, message, blockId = '') => issues.push({ severity, message, blockId });
  let blocks;
  try { blocks = JSON.parse(fields.blocks || '[]'); } catch { add('error', 'Không đọc được cấu trúc nội dung.'); return issues; }
  const structural = validateBlockData(blocks);
  if (structural) { add('error', structural); return issues; }
  if (path.startsWith('/pages/') && !fields['page-title']?.trim()) add('error', 'Trang mới cần có tên trang.');
  const title = descriptors.find(item => item.key.startsWith('txt-h1-') || item.tag === 'h1' || item.role === 'title');
  if (title && !(fields[title.key] ?? title.value ?? title.original ?? '').trim()) add('error', 'Tiêu đề chính của trang đang trống.');
  for (const descriptor of descriptors) {
    const value = fields[descriptor.key] ?? descriptor.value ?? descriptor.original ?? '';
    if (descriptor.attr === 'src' && !value.trim()) add('error', descriptor.label + ': chưa chọn ảnh.');
  }
  for (const [key, value] of Object.entries(fields)) if (key.startsWith('img-') && !validImage(value)) add('error', 'Đường dẫn ảnh không hợp lệ: ' + key);
  for (const [key, value] of Object.entries(fields)) {
    if (key.startsWith('img-') && !value.trim()) add('error', 'Chưa chọn ảnh: ' + key);
    if (key.startsWith('txt-h1-') && !value.trim() && title?.key !== key) add('error', 'Tiêu đề chính của trang đang trống.');
  }
  for (const original of blocks) {
    if (original.hidden) continue;
    const block = resolveBlock(original, shared, services);
    const schema = BLOCK_SCHEMAS[block.type];
    const prefix = (block.title || schema.name) + ': ';
    if (block.missingSource) { add('error', prefix + 'nguồn dữ liệu dùng chung đã bị xóa.', block.id); continue; }
    for (const key of schema.required) if (!String(block[key] || '').trim()) add('error', prefix + ({ title: 'thiếu tiêu đề.', text: 'thiếu nội dung.', image: 'chưa chọn ảnh.', caption: 'thiếu tên khách hàng.', buttonLabel: 'thiếu nhãn nút.', buttonHref: 'thiếu liên kết nút.' }[key] || 'thiếu dữ liệu.'), block.id);
    if (!!block.buttonLabel?.trim() !== !!block.buttonHref?.trim()) add('error', prefix + 'nút cần có cả nhãn và liên kết.', block.id);
    if (block.image && !block.alt?.trim()) add('warning', prefix + 'nên bổ sung mô tả ảnh.', block.id);
    if (schema.collection && !block[schema.collection]?.length) add('error', prefix + 'chưa có mục nội dung.', block.id);
    if (schema.collection === 'items' && block.items?.some(item => !item.title?.trim() || !item.text?.trim())) add('error', prefix + 'có mục thiếu tiêu đề hoặc nội dung.', block.id);
    if (block.type === 'services' && !block.items.length) add('error', prefix + 'chưa có dịch vụ đang hiển thị.', block.id);
    for (const image of block.images || []) {
      if (!image.src?.trim()) add('error', prefix + 'có ảnh chưa có đường dẫn.', block.id);
      else if (!image.alt?.trim()) add('warning', prefix + 'có ảnh chưa có mô tả.', block.id);
    }
  }
  return issues;
}

export function publishReportHtml(issues, esc, { dirty, saved } = {}) {
  const errors = issues.filter(issue => issue.severity === 'error').length;
  return `<div class="cms-preflight"><p role="status">${errors ? `${errors} lỗi cần sửa trước khi đăng.` : 'Nội dung đã qua kiểm tra bắt buộc.'}</p><p>${dirty ? (saved ? 'Bản nháp hiện tại đã được lưu trên máy chủ.' : 'Có thay đổi chưa được lưu thành bản nháp.') : 'Trang chưa có thay đổi mới.'}</p>${issues.length ? `<ul>${issues.map(issue => `<li class="cms-issue-${issue.severity}"><b>${issue.severity === 'error' ? 'Cần sửa' : 'Gợi ý'}:</b> ${esc(issue.message)}${issue.blockId ? ` <button class="btn btn-sm" type="button" data-action="edit-cms-block" data-id="${esc(issue.blockId)}">Mở khối</button>` : ''}</li>`).join('')}</ul>` : '<p>Không phát hiện lỗi nội dung.</p>'}</div>`;
}
