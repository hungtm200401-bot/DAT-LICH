import { like } from 'drizzle-orm';
import { getDb } from '../../../db';
import { siteContent } from '../../../db/schema';
import { privateHeaders, siteAdmin } from '../../../lib/site-admin';
import { readResource, writeResource, validateResource, type ResourceName } from '../../../lib/cms-resources';

export async function GET(request: Request) {
  const admin = new URL(request.url).searchParams.get('admin') === '1';
  if (admin && !await siteAdmin(request)) return Response.json({ error: 'Cần quyền quản trị.' }, { status: 401, headers: privateHeaders });
  const names: ResourceName[] = admin ? ['shared', 'media', 'templates'] : ['shared'];
  const entries = await Promise.all(names.map(async name => [name, await readResource(name)]));
  return Response.json(Object.fromEntries(entries), { headers: privateHeaders });
}

export async function POST(request: Request) {
  if (!await siteAdmin(request)) return Response.json({ error: 'Cần quyền quản trị.' }, { status: 401, headers: privateHeaders });
  try {
    const raw = await request.text();
    if (raw.length > 1500000) return Response.json({ error: 'Dữ liệu quá lớn.' }, { status: 413, headers: privateHeaders });
    const { name, value, revision = '' } = JSON.parse(raw);
    if (!['shared', 'media', 'templates'].includes(name) || typeof revision !== 'string') return Response.json({ error: 'Thư viện không hợp lệ.' }, { status: 400, headers: privateHeaders });
    const error = validateResource(name, value);
    if (error) return Response.json({ error }, { status: 400, headers: privateHeaders });
    if (name === 'shared') {
      const previous = await readResource('shared');
      const removed = ['albums', 'testimonials'].flatMap(kind => previous.value[kind].filter((item: { id: string }) => !value[kind].some((next: { id: string }) => next.id === item.id)).map((item: { id: string }) => ({ kind, id: item.id })));
      if (removed.length) {
        const rows = await getDb().select().from(siteContent).where(like(siteContent.key, 'cms%'));
        const used = rows.some(row => {
          if (!row.key.startsWith('cms:/') && !row.key.startsWith('cms-draft:/') && row.key !== 'cms-resource:templates') return false;
          const stored = JSON.parse(row.value);
          const blocks = row.key === 'cms-resource:templates'
            ? stored.value.flatMap((template: { fields?: { blocks?: string }; blocks?: unknown[] }) => template.blocks || JSON.parse(template.fields?.blocks || '[]'))
            : JSON.parse(stored.fields?.blocks || '[]');
          return blocks.some((block: { source?: { kind: string; id: string } }) => removed.some(source => block.source?.kind === source.kind && block.source?.id === source.id));
        });
        if (used) return Response.json({ error: 'Dữ liệu đang được trang hoặc mẫu sử dụng. Hãy bỏ liên kết trước khi xóa.' }, { status: 409, headers: privateHeaders });
      }
    }
    const resource = await writeResource(name, value, revision);
    if (!resource) return Response.json({ error: 'Thư viện đã thay đổi ở cửa sổ khác. Đóng và mở lại thư viện trước khi lưu.' }, { status: 409, headers: privateHeaders });
    return Response.json({ resource }, { headers: privateHeaders });
  } catch { return Response.json({ error: 'Không thể lưu thư viện.' }, { status: 400, headers: privateHeaders }); }
}
