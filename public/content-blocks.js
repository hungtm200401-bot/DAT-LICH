const TYPES = new Set(['text', 'image', 'split', 'gallery', 'features', 'process', 'testimonial', 'faq', 'cta']);
const WIDTHS = new Set(['narrow', 'standard', 'wide', 'full']);
const SPACING = new Set(['compact', 'normal', 'airy']);
const THEMES = new Set(['white', 'soft', 'dark', 'wine']);
const ALIGNS = new Set(['left', 'center']);
const RATIOS = new Set(['auto', 'landscape', 'portrait', 'square']);
const IMAGE_POSITIONS = new Set(['left', 'right', 'top', 'background']);
const COLUMNS = new Set(['2', '3', '4']);

export const CONTENT_BLOCK_TEMPLATES = [
  { type: 'text', name: 'Tiêu đề & nội dung', description: 'Một phần giới thiệu hoặc câu chuyện ngắn.', preview: 'Aa' },
  { type: 'image', name: 'Ảnh nổi bật', description: 'Ảnh lớn kèm tiêu đề và chú thích.', preview: '▣' },
  { type: 'split', name: 'Ảnh & nội dung', description: 'Bố cục hai cột, có nút hành động.', preview: '◧' },
  { type: 'gallery', name: 'Bộ sưu tập ảnh', description: 'Lưới từ hai đến bốn ảnh.', preview: '▦' },
  { type: 'features', name: 'Điểm nổi bật', description: 'Danh sách lợi ích hoặc cam kết.', preview: '✓' },
  { type: 'process', name: 'Quy trình', description: 'Các bước thực hiện theo thứ tự.', preview: '01' },
  { type: 'testimonial', name: 'Đánh giá khách hàng', description: 'Trích dẫn và tên khách hàng.', preview: '“”' },
  { type: 'faq', name: 'Câu hỏi thường gặp', description: 'Danh sách câu hỏi có thể mở rộng.', preview: '?' },
  { type: 'cta', name: 'Kêu gọi hành động', description: 'Khối đặt lịch hoặc liên hệ nổi bật.', preview: '→' },
];

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
    id: makeId(), type, eyebrow: '', title: '', text: '', image: '', alt: '', caption: '',
    buttonLabel: '', buttonHref: '', items: [], images: [], hidden: false, slot,
    settings: { width: 'standard', spacing: 'normal', theme: 'white', align: 'left', ratio: 'portrait', imagePosition: 'left', columns: '3' },
  };
  const presets = {
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

function appendText(parent, tag, className, text) {
  if (!text) return null;
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text;
  parent.append(node);
  return node;
}

function appendButton(parent, block) {
  if (!block.buttonLabel || !block.buttonHref) return;
  const link = document.createElement('a');
  link.className = 'btn cms-content-button';
  link.href = block.buttonHref;
  link.textContent = block.buttonLabel;
  parent.append(link);
}

function createImage(block, source = block) {
  const figure = document.createElement('figure');
  const image = document.createElement('img');
  image.src = source.src || source.image || '/assets/campaign.png';
  image.alt = source.alt || block.alt || block.title || 'Hình ảnh nội dung';
  image.loading = 'lazy';
  figure.append(image);
  if (source.caption) appendText(figure, 'figcaption', '', source.caption);
  return figure;
}

function fillBlock(section, block) {
  const inner = document.createElement('div');
  inner.className = 'cms-content-inner';
  section.append(inner);
  const copy = () => {
    const node = document.createElement('div');
    node.className = 'cms-content-copy';
    appendText(node, 'p', 'cms-content-eyebrow', block.eyebrow);
    appendText(node, 'h2', '', block.title);
    const body = appendText(node, 'p', 'cms-content-text', block.text);
    if (body) body.style.whiteSpace = 'pre-line';
    appendButton(node, block);
    return node;
  };

  if (block.type === 'image') {
    appendText(inner, 'h2', '', block.title);
    inner.append(createImage(block, { image: block.image, alt: block.alt, caption: block.caption }));
  } else if (block.type === 'split') {
    inner.classList.add('cms-content-split-layout');
    const media = createImage(block, { image: block.image, alt: block.alt, caption: block.caption });
    const content = copy();
    if (block.settings.imagePosition === 'right') inner.append(content, media);
    else inner.append(media, content);
  } else if (block.type === 'gallery') {
    appendText(inner, 'p', 'cms-content-eyebrow', block.eyebrow);
    appendText(inner, 'h2', '', block.title);
    appendText(inner, 'p', 'cms-content-text', block.text);
    const gallery = document.createElement('div');
    gallery.className = 'cms-content-gallery';
    for (const image of block.images.filter(item => item.src)) gallery.append(createImage(block, image));
    inner.append(gallery);
  } else if (block.type === 'features' || block.type === 'process') {
    appendText(inner, 'p', 'cms-content-eyebrow', block.eyebrow);
    appendText(inner, 'h2', '', block.title);
    appendText(inner, 'p', 'cms-content-text', block.text);
    const list = document.createElement('div');
    list.className = 'cms-content-items';
    block.items.forEach((item, index) => {
      const article = document.createElement('article');
      if (block.type === 'process') appendText(article, 'span', 'cms-content-number', String(index + 1).padStart(2, '0'));
      appendText(article, 'h3', '', item.title);
      appendText(article, 'p', '', item.text);
      list.append(article);
    });
    inner.append(list);
  } else if (block.type === 'testimonial') {
    appendText(inner, 'p', 'cms-content-eyebrow', block.eyebrow);
    const quote = appendText(inner, 'blockquote', '', block.text);
    if (quote) quote.style.whiteSpace = 'pre-line';
    appendText(inner, 'p', 'cms-content-author', block.caption);
  } else if (block.type === 'faq') {
    appendText(inner, 'p', 'cms-content-eyebrow', block.eyebrow);
    appendText(inner, 'h2', '', block.title);
    appendText(inner, 'p', 'cms-content-text', block.text);
    const list = document.createElement('div');
    list.className = 'cms-content-faq';
    block.items.forEach((item, index) => {
      const detail = document.createElement('details');
      if (index === 0) detail.open = true;
      appendText(detail, 'summary', '', item.title);
      appendText(detail, 'p', '', item.text);
      list.append(detail);
    });
    inner.append(list);
  } else {
    inner.append(copy());
  }
}

function sectionLabel(section, index) {
  const heading = section.querySelector('h1, h2');
  if (heading?.textContent.trim()) return heading.textContent.trim().slice(0, 42);
  const className = [...section.classList].find(name => name.startsWith('ct-'));
  if (className) return className.replace(/^ct-/, '').replace(/-/g, ' ');
  return `Mục ${index + 1}`;
}

export function contentSlots(main) {
  if (!main) return [];
  return [...main.children]
    .filter(node => node.matches('section') && !node.classList.contains('cms-content-section'))
    .map((node, index) => ({ index, label: sectionLabel(node, index) }));
}

export function renderContentBlocks(main, blocks) {
  if (!main) return [];
  main.querySelectorAll(':scope > .cms-content-section').forEach(node => node.remove());
  const anchors = [...main.children].filter(node => node.matches('section'));
  for (const block of blocks) {
    if (block.hidden) continue;
    const section = document.createElement('section');
    section.className = [
      'cms-content-section', `cms-content-${block.type}`,
      `cms-width-${block.settings.width}`, `cms-space-${block.settings.spacing}`,
      `cms-theme-${block.settings.theme}`, `cms-align-${block.settings.align}`,
      `cms-ratio-${block.settings.ratio}`, `cms-columns-${block.settings.columns}`,
      `cms-image-${block.settings.imagePosition}`,
    ].join(' ');
    section.dataset.cmsBlockId = block.id;
    section.setAttribute('aria-label', block.title || CONTENT_BLOCK_TEMPLATES.find(item => item.type === block.type)?.name || 'Nội dung bổ sung');
    fillBlock(section, block);
    const slot = Math.max(0, Math.min(block.slot, anchors.length));
    main.insertBefore(section, anchors[slot] || null);
  }
  return contentSlots(main);
}
