import { BLOCK_SCHEMAS, BLOCK_SCHEMA_VERSION, BLOCK_SETTINGS } from './block-schema.js';
const TYPES = new Set(Object.keys(BLOCK_SCHEMAS));
const WIDTHS = new Set(BLOCK_SETTINGS.width);
const SPACING = new Set(BLOCK_SETTINGS.spacing);
const THEMES = new Set(BLOCK_SETTINGS.theme);
const ALIGNS = new Set(BLOCK_SETTINGS.align);
const RATIOS = new Set(BLOCK_SETTINGS.ratio);
const IMAGE_POSITIONS = new Set(BLOCK_SETTINGS.imagePosition);
const COLUMNS = new Set(BLOCK_SETTINGS.columns);


const stringValue = (value, fallback = '') => typeof value === 'string' ? value : fallback;
const enumValue = (value, values, fallback) => values.has(value) ? value : fallback;

function normalizeImage(image = {}) {
  return {
    src: stringValue(image.src || image.image),
    alt: stringValue(image.alt),
    caption: stringValue(image.caption),
  };
}

function normalizeItem(item = {}) {
  return {
    title: stringValue(item.title),
    text: stringValue(item.text),
  };
}

export function normalizeContentBlocks(raw, makeId) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 30).map(source => {
    const block = source && typeof source === 'object' ? source : {};
    const type = TYPES.has(block.type) ? block.type : 'text';
    return {
      id: stringValue(block.id) || makeId(),
      type,
      schemaVersion: BLOCK_SCHEMA_VERSION,
      ...(block.source ? { source: { kind: block.source.kind, id: block.source.id } } : {}),
      eyebrow: stringValue(block.eyebrow),
      title: stringValue(block.title),
      text: stringValue(block.text),
      image: stringValue(block.image),
      alt: stringValue(block.alt),
      caption: stringValue(block.caption),
      buttonLabel: stringValue(block.buttonLabel),
      buttonHref: stringValue(block.buttonHref),
      items: Array.isArray(block.items) ? block.items.slice(0, 12).map(normalizeItem) : [],
      images: Array.isArray(block.images) ? block.images.slice(0, 8).map(normalizeImage) : [],
      hidden: block.hidden === true,
      slot: Number.isInteger(block.slot) ? Math.max(0, Math.min(40, block.slot)) : 40,
      settings: {
        width: enumValue(block.settings?.width, WIDTHS, type === 'cta' ? 'wide' : 'standard'),
        spacing: enumValue(block.settings?.spacing, SPACING, 'normal'),
        theme: enumValue(block.settings?.theme, THEMES, type === 'cta' ? 'wine' : 'white'),
        align: enumValue(block.settings?.align, ALIGNS, type === 'cta' || type === 'testimonial' ? 'center' : 'left'),
        ratio: enumValue(block.settings?.ratio, RATIOS, type === 'image' ? 'landscape' : 'portrait'),
        imagePosition: enumValue(block.settings?.imagePosition, IMAGE_POSITIONS, 'left'),
        columns: enumValue(String(block.settings?.columns || ''), COLUMNS, '3'),
      },
    };
  });
}

export function createContentBlock(type, makeId, slot = 40) {
  const base = {
    id: makeId(), type: TYPES.has(type) ? type : 'text', schemaVersion: BLOCK_SCHEMA_VERSION, eyebrow: '', title: '', text: '', image: '', alt: '', caption: '',
    buttonLabel: '', buttonHref: '', items: [], images: [], hidden: false, slot,
    settings: { width: 'standard', spacing: 'normal', theme: 'white', align: 'left', ratio: 'portrait', imagePosition: 'left', columns: '3' },
  };
  const presets = {
    services: { title: 'Dịch vụ & bảng giá', text: 'Chọn dịch vụ phù hợp với bạn.', settings: { ...base.settings, width: 'wide' } },
    text: { title: 'Tiêu đề nội dung', text: 'Nhập nội dung bạn muốn chia sẻ tại đây.', settings: { ...base.settings, width: 'narrow' } },
    image: { title: 'Hình ảnh nổi bật', image: '/assets/campaign.png', alt: 'Hình ảnh nổi bật', settings: { ...base.settings, width: 'wide', ratio: 'landscape' } },
    split: { eyebrow: 'CÂU CHUYỆN', title: 'Vẻ đẹp mang dấu ấn riêng', text: 'Chia sẻ câu chuyện, phong cách hoặc giá trị nổi bật.', image: '/assets/bridal-new.png', alt: 'Phong cách trang điểm', buttonLabel: 'ĐẶT LỊCH', buttonHref: '#/booking/service' },
    gallery: { title: 'Bộ sưu tập', images: ['/assets/bridal-new.png', '/assets/natural.png', '/assets/evening.png'].map((src, index) => ({ src, alt: `Hình ảnh bộ sưu tập ${index + 1}`, caption: '' })), settings: { ...base.settings, width: 'wide', ratio: 'portrait' } },
    features: { title: 'Điểm khác biệt', items: [{ title: 'Tư vấn riêng', text: 'Phong cách được lựa chọn theo đường nét và dịp tham dự.' }, { title: 'Sản phẩm chọn lọc', text: 'Ưu tiên độ bền, sự thoải mái và vẻ đẹp tự nhiên.' }, { title: 'Hoàn thiện tinh tế', text: 'Mọi chi tiết được kiểm tra trước khi kết thúc.' }], settings: { ...base.settings, width: 'wide' } },
    process: { title: 'Quy trình trải nghiệm', items: [{ title: 'Lắng nghe', text: 'Trao đổi mong muốn và phong cách.' }, { title: 'Thiết kế', text: 'Thống nhất tone màu và điểm nhấn.' }, { title: 'Hoàn thiện', text: 'Kiểm tra tổng thể và chỉnh sửa.' }], settings: { ...base.settings, width: 'wide' } },
    testimonial: { eyebrow: 'TRẢI NGHIỆM KHÁCH HÀNG', text: 'Mình cảm thấy tự tin và vẫn là chính mình trong ngày đặc biệt.', caption: 'Khách hàng của HOÀN', settings: { ...base.settings, width: 'narrow', align: 'center', theme: 'soft' } },
    faq: { title: 'Câu hỏi thường gặp', items: [{ title: 'Tôi nên đặt lịch trước bao lâu?', text: 'Bạn nên đặt sớm để có nhiều lựa chọn về ngày và giờ.' }, { title: 'Tôi cần chuẩn bị gì?', text: 'Giữ da sạch, dưỡng ẩm nhẹ và chuẩn bị ảnh phong cách mong muốn.' }], settings: { ...base.settings, width: 'narrow' } },
    cta: { eyebrow: 'DÀNH RIÊNG CHO BẠN', title: 'Sẵn sàng cho một diện mạo thật riêng?', text: 'Chọn thời gian phù hợp và bắt đầu buổi tư vấn cùng HOÀN.', buttonLabel: 'ĐẶT LỊCH', buttonHref: '#/booking/service', settings: { ...base.settings, width: 'wide', align: 'center', theme: 'wine' } },
  };
  return { ...base, ...(presets[type] || presets.text) };
}

