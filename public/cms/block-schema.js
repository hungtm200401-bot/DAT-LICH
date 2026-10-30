// Shared by the editor, renderer and API. Add a type here before adding its renderer.
export const BLOCK_SCHEMA_VERSION = 1;
export const BLOCK_SCHEMAS = {
  text: { name: 'Tiêu đề & nội dung', description: 'Một phần giới thiệu hoặc câu chuyện ngắn.', preview: 'Aa', fields: ['title', 'text'], required: ['title', 'text'] },
  image: { name: 'Ảnh nổi bật', description: 'Ảnh lớn kèm tiêu đề và chú thích.', preview: '▣', fields: ['title', 'image', 'alt', 'caption'], required: ['image'] },
  split: { name: 'Ảnh & nội dung', description: 'Bố cục hai cột, có nút hành động.', preview: '◧', fields: ['eyebrow', 'title', 'text', 'image', 'alt', 'caption', 'buttonLabel', 'buttonHref'], required: ['title', 'image'] },
  gallery: { name: 'Bộ sưu tập ảnh', description: 'Lưới ảnh hoặc album dùng chung.', preview: '▦', fields: ['eyebrow', 'title', 'text'], required: ['title'], collection: 'images' },
  features: { name: 'Điểm nổi bật', description: 'Danh sách lợi ích hoặc cam kết.', preview: '✓', fields: ['eyebrow', 'title', 'text'], required: ['title'], collection: 'items' },
  process: { name: 'Quy trình', description: 'Các bước thực hiện theo thứ tự.', preview: '01', fields: ['eyebrow', 'title', 'text'], required: ['title'], collection: 'items' },
  testimonial: { name: 'Đánh giá khách hàng', description: 'Trích dẫn hoặc đánh giá dùng chung.', preview: '“”', fields: ['eyebrow', 'text', 'caption'], required: ['text', 'caption'] },
  faq: { name: 'Câu hỏi thường gặp', description: 'Danh sách câu hỏi có thể mở rộng.', preview: '?', fields: ['eyebrow', 'title', 'text'], required: ['title'], collection: 'items' },
  cta: { name: 'Kêu gọi hành động', description: 'Khối đặt lịch hoặc liên hệ nổi bật.', preview: '→', fields: ['eyebrow', 'title', 'text', 'buttonLabel', 'buttonHref'], required: ['title', 'buttonLabel', 'buttonHref'] },
  services: { name: 'Dịch vụ & bảng giá', description: 'Giá và thời lượng cập nhật từ dịch vụ đặt lịch.', preview: '₫', fields: ['eyebrow', 'title', 'text'], required: ['title'] },
};
export const BLOCK_SETTINGS = {
  width: ['narrow', 'standard', 'wide', 'full'], spacing: ['compact', 'normal', 'airy'],
  theme: ['white', 'soft', 'dark', 'wine'], align: ['left', 'center'],
  ratio: ['auto', 'landscape', 'portrait', 'square'], imagePosition: ['left', 'right', 'top', 'background'], columns: ['2', '3', '4'],
};
export const validImage = value => typeof value === 'string' && (!value || /^(?:\/(?!\/)|https:\/\/)[^\s<>"']+$/.test(value));
export const validLink = value => typeof value === 'string' && (!value || /^(?:#\/[a-z0-9/?=&_-]*|https:\/\/[^\s<>"']+|mailto:[^\s<>"']+|tel:[+0-9 ()-]+)$/.test(value));

// Structural validation also applies to drafts. Completeness is checked on publish.
export function validateBlockData(blocks) {
  if (!Array.isArray(blocks) || blocks.length > 30) return 'Danh sách khối không hợp lệ (tối đa 30 khối).';
  const ids = new Set();
  for (const block of blocks) {
    if (!block || typeof block !== 'object' || Array.isArray(block) || !Object.hasOwn(BLOCK_SCHEMAS, block.type) || typeof block.id !== 'string' || !block.id || block.id.length > 100 || ids.has(block.id)) return 'Loại hoặc mã khối không hợp lệ / bị trùng.';
    ids.add(block.id);
    if (block.schemaVersion !== undefined && block.schemaVersion !== BLOCK_SCHEMA_VERSION) return 'Phiên bản khối chưa được hỗ trợ.';
    for (const field of ['eyebrow', 'title', 'text', 'image', 'alt', 'caption', 'buttonLabel', 'buttonHref']) {
      if (block[field] !== undefined && (typeof block[field] !== 'string' || block[field].length > 6000)) return 'Nội dung khối quá dài.';
    }
    if (!validImage(block.image || '') || !validLink(block.buttonHref || '')) return 'Đường dẫn ảnh hoặc nút không hợp lệ.';
    if (block.slot !== undefined && (!Number.isInteger(block.slot) || block.slot < 0 || block.slot > 40)) return 'Vị trí khối không hợp lệ.';
    if (block.hidden !== undefined && typeof block.hidden !== 'boolean') return 'Trạng thái khối không hợp lệ.';
    if (block.source !== undefined && (!block.source || !['albums', 'testimonials'].includes(block.source.kind) || (block.type === 'gallery' ? block.source.kind !== 'albums' : block.type === 'testimonial' ? block.source.kind !== 'testimonials' : true) || typeof block.source.id !== 'string' || !/^[a-z0-9-]{1,100}$/.test(block.source.id))) return 'Nguồn dùng chung không hợp lệ.';
    if (block.settings !== undefined) {
      if (!block.settings || typeof block.settings !== 'object' || Array.isArray(block.settings)) return 'Thiết lập khối không hợp lệ.';
      for (const [key, allowed] of Object.entries(BLOCK_SETTINGS)) if (block.settings[key] !== undefined && !allowed.includes(block.settings[key])) return 'Thiết lập trình bày không hợp lệ.';
    }
    for (const [key, limit, fields] of [['items', 12, ['title', 'text']], ['images', 8, ['src', 'alt', 'caption']]]) {
      if (block[key] === undefined) continue;
      if (!Array.isArray(block[key]) || block[key].length > limit) return 'Danh sách nội dung quá dài.';
      for (const entry of block[key]) {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return 'Mục nội dung không hợp lệ.';
        for (const field of fields) if (entry[field] !== undefined && (typeof entry[field] !== 'string' || entry[field].length > 3000)) return 'Mục nội dung quá dài.';
        if (key === 'images' && (typeof entry.src !== 'string' || !validImage(entry.src))) return 'Ảnh trong bộ sưu tập không hợp lệ.';
      }
    }
  }
  return '';
}
