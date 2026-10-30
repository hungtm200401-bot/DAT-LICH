export const RESOURCE_DEFAULTS = { shared: { albums: [], testimonials: [] }, media: [], templates: [] };
export const makeContentId = () => 'cms-' + crypto.randomUUID();

export function resolveBlock(block, shared = {}, services = []) {
  if (block.type === 'services') return { ...block, items: services.filter(s => s.enabled).slice(0, 12).map(s => ({ title: s.name, text: `${s.contact ? 'Liên hệ tư vấn' : new Intl.NumberFormat('vi-VN').format(s.price) + ' ₫'} · ${s.duration} phút\n${s.description || ''}` })) };
  if (!block.source) return block;
  const record = shared[block.source.kind]?.find(item => item.id === block.source.id);
  // A removed source must never silently fall back to stale published data.
  if (!record) return { ...block, hidden: true, missingSource: true };
  if (block.source.kind === 'albums') return { ...block, title: record.title, images: record.images };
  return { ...block, text: record.text, caption: record.author };
}

export function mediaUsage(src, pages = {}, drafts = {}, shared = {}, templates = [], portfolio = [], brand = {}) {
  const uses = new Set();
  const scan = (fields, label) => {
    if (Object.entries(fields || {}).some(([key, value]) => key.startsWith('img-') && value === src)) uses.add(label);
    try {
      for (const block of JSON.parse(fields?.blocks || '[]')) {
        const linked = resolveBlock(block, shared);
        if (block.image === src || block.images?.some(image => image.src === src) || linked.images?.some(image => image.src === src)) uses.add(label);
      }
    } catch { /* invalid drafts have their own validation */ }
  };
  for (const [path, page] of Object.entries(pages)) scan(page.fields, 'Đã đăng: ' + path);
  for (const [path, page] of Object.entries(drafts)) scan(page.fields, 'Bản nháp: ' + path);
  for (const album of shared.albums || []) if (album.images.some(image => image.src === src)) uses.add('Album: ' + album.title);
  for (const template of templates) scan(template.fields || { blocks: JSON.stringify(template.blocks || []) }, 'Mẫu: ' + template.name);
  for (const item of portfolio) if (item.image === src) uses.add('Pack: ' + item.title);
  if (Object.values(brand).includes(src)) uses.add('Cài đặt thương hiệu');
  return [...uses];
}

export function copyTemplateBlocks(blocks, makeId, slot) {
  return structuredClone(blocks).map(block => ({ ...block, id: makeId(), ...(slot === undefined ? {} : { slot }) }));
}
