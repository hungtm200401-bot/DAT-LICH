import { BLOCK_SCHEMAS } from './cms/block-schema.js';
export { createContentBlock, normalizeContentBlocks } from './cms/block-model.js';
export const CONTENT_BLOCK_TEMPLATES = Object.entries(BLOCK_SCHEMAS).map(([type, schema]) => ({ type, ...schema }));

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
  } else if (block.type === 'features' || block.type === 'process' || block.type === 'services') {
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
