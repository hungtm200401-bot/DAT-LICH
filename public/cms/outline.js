import { studioIcon } from './workspace.js';
import { validImage } from './block-schema.js';

export function outlineHtml(groups, { esc, expanded, initial, selectedKey }) {
  return [...groups.entries()].map(([title, items], index) => `<details class="studio-outline-group" data-outline-group="${esc(title)}" ${(initial ? index === 0 : expanded.has(title)) ? 'open' : ''}>
    <summary><span class="studio-outline-chevron">${studioIcon('chevron')}</span><span class="studio-outline-title" title="${esc(title)}">${esc(title)}</span><small>${items.length}</small></summary>
    <div class="studio-outline-fields">${items.map(item => {
      const isImage = item.key.startsWith('img-');
      const source = item.value || item.original || '';
      const label = isImage ? item.label.replace(/^Ảnh · /, '') : (item.value || item.original || item.label || 'Nội dung');
      const role = isImage ? 'Hình ảnh' : item.key.startsWith('txt-h1-') || item.key === 'page-title' ? 'Tiêu đề chính' : item.key.startsWith('txt-h') ? 'Tiêu đề' : 'Văn bản';
      return `<button type="button" class="studio-outline-item ${selectedKey === item.key ? 'is-selected' : ''}" data-studio="edit-field" data-key="${esc(item.key)}" aria-current="${selectedKey === item.key ? 'true' : 'false'}" title="${esc(label)}"><span class="studio-outline-thumb">${isImage && validImage(source) ? `<img src="${esc(source)}" alt="" loading="lazy">` : studioIcon('text')}</span><span class="studio-outline-copy"><b>${esc(label)}</b><small>${role}</small></span></button>`;
    }).join('')}</div>
  </details>`).join('');
}
