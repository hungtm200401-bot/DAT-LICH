import { and, eq } from 'drizzle-orm';
import { getDb } from '../db';
import { siteContent } from '../db/schema';
import { validateBlockData, validImage } from '../public/cms/block-schema.js';

export type ResourceName = 'shared' | 'media' | 'templates';
export const resourceDefaults = { shared: { albums: [], testimonials: [] }, media: [], templates: [] };
export const resourceKey = (name: ResourceName) => 'cms-resource:' + name;
export async function readResource(name: ResourceName) {
  const [row] = await getDb().select().from(siteContent).where(eq(siteContent.key, resourceKey(name)));
  return row ? JSON.parse(row.value) : { value: resourceDefaults[name], revision: '' };
}
export async function writeResource(name: ResourceName, value: unknown, revision: string) {
  const db = getDb(), key = resourceKey(name);
  const [row] = await db.select().from(siteContent).where(eq(siteContent.key, key));
  if ((row ? JSON.parse(row.value).revision : '') !== revision) return null;
  const result = { value, revision: crypto.randomUUID(), updatedAt: new Date().toISOString() };
  const values = { key, value: JSON.stringify(result), updatedAt: result.updatedAt };
  const changed = row
    ? await db.update(siteContent).set(values).where(and(eq(siteContent.key, key), eq(siteContent.value, row.value))).returning({ key: siteContent.key })
    : await db.insert(siteContent).values(values).onConflictDoNothing().returning({ key: siteContent.key });
  return changed.length ? result : null;
}

const record = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown, max = 3000) => typeof value === 'string' && value.length <= max;
const list = (value: unknown, max: number): value is Record<string, any>[] => Array.isArray(value) && value.length <= max && value.every(record);
const id = (value: unknown) => typeof value === 'string' && /^[a-z0-9-]{1,100}$/.test(value);
const unique = (values: Record<string, any>[]) => values.every(v => id(v.id)) && new Set(values.map(v => v.id)).size === values.length;
export function validateResource(name: ResourceName, value: unknown): string {
  if (name === 'shared') {
    if (!record(value) || !list(value.albums, 100) || !list(value.testimonials, 100) || !unique(value.albums) || !unique(value.testimonials)) return 'Danh sách dữ liệu dùng chung không hợp lệ.';
    for (const album of value.albums) {
      if (!text(album.title, 140) || !album.title.trim() || !list(album.images, 8) || !album.images.length || album.images.some(i => !text(i.src, 2000) || !i.src || !validImage(i.src) || !text(i.alt, 300) || !text(i.caption, 300))) return 'Album cần tên và 1–8 ảnh có đường dẫn hợp lệ.';
    }
    for (const review of value.testimonials) if (!text(review.author, 120) || !review.author.trim() || !text(review.text) || !review.text.trim()) return 'Đánh giá cần tên khách hàng và nội dung.';
  } else if (name === 'media') {
    if (!list(value, 1000) || new Set(value.map(v => v.src)).size !== value.length) return 'Thư viện ảnh không hợp lệ.';
    for (const image of value) if (!text(image.src, 2000) || !image.src || !validImage(image.src) || !text(image.title, 140) || !image.title.trim() || !text(image.category, 80) || !text(image.alt, 300) || !text(image.desc, 1000)) return 'Thông tin ảnh không hợp lệ.';
  } else {
    if (!list(value, 100) || !unique(value)) return 'Danh sách mẫu không hợp lệ.';
    for (const template of value) {
      if (!text(template.name, 100) || !template.name.trim() || !['page', 'block'].includes(template.kind)) return 'Tên hoặc loại mẫu không hợp lệ.';
      const fields = template.kind === 'page' ? template.fields : { blocks: JSON.stringify(template.blocks) };
      if (!record(fields) || Object.keys(fields).length > 200 || Object.entries(fields).some(([key, val]) => !/^[a-z0-9_-]{1,100}$/.test(key) || !text(val, key === 'blocks' ? 120000 : 6000) || (key.startsWith('img-') && !validImage(val)))) return 'Nội dung mẫu không hợp lệ.';
      try { const error = validateBlockData(JSON.parse(fields.blocks || '[]')); if (error) return error; } catch { return 'Cấu trúc mẫu không hợp lệ.'; }
    }
  }
  return '';
}

// Uploads register themselves, retrying if an editor changes metadata concurrently.
export async function registerMedia(images: Record<string, string>[]) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const resource = await readResource('media');
    const value = [...resource.value, ...images];
    if (value.length > 1000) throw new Error('Thư viện đã đủ 1000 ảnh.');
    if (await writeResource('media', value, resource.revision)) return;
  }
  throw new Error('Thư viện vừa thay đổi, vui lòng tải ảnh lại.');
}
