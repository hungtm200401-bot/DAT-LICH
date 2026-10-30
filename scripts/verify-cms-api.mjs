import assert from 'node:assert/strict';
import { createContentBlock } from '../public/content-blocks.js';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';
const call = async (path, body, headers = {}) => {
  const response = await fetch(base + path, { ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}), headers: { 'Content-Type': 'application/json', ...headers } });
  const raw = await response.text();
  return { status: response.status, data: response.headers.get('Content-Type')?.includes('json') ? JSON.parse(raw) : { error: raw } };
};
const initial = (await call('/api/cms-resources?admin=1')).data;
const suffix = crypto.randomUUID(), reviewId = 'test-' + suffix, templateId = 'template-' + suffix;
let sharedChanged = false, templateChanged = false, mediaChanged = false;
let uploadPath = '';
try {
  const publicRead = await call('/api/cms-resources');
  assert.deepEqual(Object.keys(publicRead.data), ['shared']);
  assert.ok([401, 403].includes((await call('/api/cms-resources?admin=1', undefined, { Origin: 'https://foreign.invalid' })).status));
  assert.ok([401, 403].includes((await call('/api/cms-resources', { name: 'shared', value: {}, revision: '' }, { Origin: 'https://foreign.invalid' })).status));
  assert.equal((await call('/api/cms-resources', { name: 'shared', value: { albums: [], testimonials: [{ id: 'bad', author: '', text: '' }] }, revision: initial.shared.revision })).status, 400);
  const shared = structuredClone(initial.shared.value); shared.testimonials.push({ id: reviewId, author: 'API test', text: 'Temporary verification record' });
  const saveShared = await call('/api/cms-resources', { name: 'shared', value: shared, revision: initial.shared.revision });
  assert.equal(saveShared.status, 200); sharedChanged = true;
  assert.equal((await call('/api/cms-resources', { name: 'shared', value: shared, revision: initial.shared.revision })).status, 409);
  assert.ok((await call('/api/cms-resources')).data.shared.value.testimonials.some(item => item.id === reviewId));
  const block = { ...createContentBlock('testimonial', () => 'api-test'), source: { kind: 'testimonials', id: reviewId } };
  const templates = [...initial.templates.value, { id: templateId, kind: 'block', name: 'API test template', blocks: [block] }];
  assert.equal((await call('/api/cms-resources', { name: 'templates', value: templates, revision: initial.templates.revision })).status, 200); templateChanged = true;
  const latestShared = (await call('/api/cms-resources?admin=1')).data.shared;
  const removal = await call('/api/cms-resources', { name: 'shared', value: { ...shared, testimonials: shared.testimonials.filter(item => item.id !== reviewId) }, revision: latestShared.revision });
  assert.equal(removal.status, 409); assert.match(removal.data.error, /sử dụng/);
  const media = [...initial.media.value, { src: '/assets/cms-api-test-' + suffix + '.png', title: 'API verification', category: 'test', alt: '', desc: '' }];
  assert.equal((await call('/api/cms-resources', { name: 'media', value: media, revision: initial.media.revision })).status, 200); mediaChanged = true;
  // The local explorer lets us remove the exact test object after verifying R2 upload.
  if (['localhost', '127.0.0.1'].includes(new URL(base).hostname)) {
    const buckets = await (await fetch(base + '/cdn-cgi/local/explorer/api/r2/buckets')).json();
    assert.ok(buckets.result.buckets.some(bucket => bucket.name === 'site-creator-r2'));
    const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aB9sAAAAASUVORK5CYII=', 'base64');
    const form = new FormData(); form.append('files', new File([image], 'cms-upload-' + suffix + '.png', { type: 'image/png' }));
    const response = await fetch(base + '/api/uploads', { method: 'POST', body: form });
    assert.equal(response.status, 200); const uploaded = await response.json(); uploadPath = uploaded.paths[0];
    assert.equal(uploaded.libraryWarning, undefined);
    const resource = (await call('/api/cms-resources?admin=1')).data.media;
    assert.ok(resource.value.some(item => item.src === uploadPath && item.title === 'cms-upload-' + suffix + '.png'));
    const downloaded = await fetch(base + uploadPath); assert.equal(downloaded.status, 200);
    assert.deepEqual(Buffer.from(await downloaded.arrayBuffer()), image);
  }
  const invalid = { ...createContentBlock('cta', () => 'invalid'), buttonHref: '' };
  const publish = await call('/api/site-content', { action: 'publish', path: '/pages/api-validation-test', fields: { 'page-title': 'API validation', blocks: JSON.stringify([invalid]) }, revision: '' });
  assert.equal(publish.status, 400); assert.match(publish.data.error, /liên kết/);
  console.log('PASS real API authentication, public/private separation, resource persistence, R2 upload/catalog registration, revision conflicts, linked-source deletion protection and server-side publication checks');
} finally {
  // Remove only this test's records, preserving any concurrent administrator edits.
  for (const name of ['templates', 'shared', 'media']) {
    if (!(name === 'templates' ? templateChanged : name === 'shared' ? sharedChanged : mediaChanged)) continue;
    const current = (await call('/api/cms-resources?admin=1')).data[name];
    const value = name === 'shared' ? { ...current.value, testimonials: current.value.testimonials.filter(item => item.id !== reviewId) } : name === 'templates' ? current.value.filter(item => item.id !== templateId) : current.value.filter(item => item.src !== '/assets/cms-api-test-' + suffix + '.png' && item.src !== uploadPath);
    assert.equal((await call('/api/cms-resources', { name, value, revision: current.revision })).status, 200, 'Test cleanup failed: ' + name);
  }
  if (uploadPath) {
    const key = new URL(uploadPath, base).searchParams.get('key');
    assert.match(key, /^references\/[a-f0-9-]{36}$/);
    const response = await fetch(base + '/cdn-cgi/local/explorer/api/r2/buckets/site-creator-r2/objects', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify([key]) });
    assert.equal(response.status, 200, 'Could not remove test upload');
    assert.equal((await fetch(base + uploadPath)).status, 404);
  }
}
