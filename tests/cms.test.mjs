import assert from 'node:assert/strict';
import test from 'node:test';
import { BLOCK_SCHEMAS, validateBlockData } from '../public/cms/block-schema.js';
import { createContentBlock, normalizeContentBlocks } from '../public/content-blocks.js';
import { inspectPage } from '../public/cms/publish.js';
import { createPageFields } from '../public/cms/pages.js';
import { resolveBlock, mediaUsage, copyTemplateBlocks } from '../public/cms/resources.js';
import { createContentPersistence } from '../public/cms/persistence.js';

let counter = 0;
const makeId = () => 'test-' + ++counter;
const services = [{ id: 'party', enabled: true, name: 'Dự tiệc', price: 650000, duration: 90, description: 'Makeup dự tiệc' }];
const inspect = blocks => inspectPage({ path: '/', fields: { blocks: JSON.stringify(blocks) }, services });

test('every registered block has a valid starter and passes required publish checks', () => {
  for (const type of Object.keys(BLOCK_SCHEMAS)) {
    const block = createContentBlock(type, makeId);
    assert.equal(validateBlockData([block]), '', type);
    assert.deepEqual(inspect([block]).filter(issue => issue.severity === 'error'), [], type);
  }
});
test('legacy blocks remain readable with defaults and shared sources survive normalization', () => {
  const blocks = normalizeContentBlocks([{ type: 'gallery', source: { kind: 'albums', id: 'album-1' } }], makeId);
  assert.equal(blocks[0].schemaVersion, 1);
  assert.equal(blocks[0].settings.columns, '3');
  assert.deepEqual(blocks[0].source, { kind: 'albums', id: 'album-1' });
});
test('rejects duplicate IDs, scripts, malformed collections and unsupported sources', () => {
  const block = createContentBlock('split', makeId);
  for (const invalid of [[block, block], [{ ...block, buttonHref: 'javascript:alert(1)' }], [{ ...block, image: '//evil.test/a.png' }], [{ ...block, items: [null] }], [{ ...block, source: { kind: 'albums', id: 'a' } }], [{ ...block, schemaVersion: 2 }]]) assert.ok(validateBlockData(invalid));
});
test('publish blocks incomplete visible content while keeping incomplete drafts and hidden blocks possible', () => {
  const block = { ...createContentBlock('cta', makeId), title: '', buttonHref: '' };
  assert.equal(validateBlockData([block]), '');
  assert.ok(inspect([block]).some(issue => issue.severity === 'error'));
  assert.deepEqual(inspect([{ ...block, hidden: true }]), []);
  assert.ok(inspectPage({ path: '/', fields: { 'txt-h1-1': '' }, descriptors: [{ key: 'txt-h1-1', original: 'Tên trang' }] }).some(issue => issue.severity === 'error'));
});
test('linked albums and reviews use the latest records and flag missing records', () => {
  const block = { ...createContentBlock('gallery', makeId), source: { kind: 'albums', id: 'album-1' } };
  const shared = { albums: [{ id: 'album-1', title: 'Mùa cưới', images: [{ src: '/assets/bridal.png', alt: 'Cô dâu' }] }] };
  assert.equal(resolveBlock(block, shared).title, 'Mùa cưới');
  shared.albums[0].title = 'Mùa cưới mới';
  assert.equal(resolveBlock(block, shared).title, 'Mùa cưới mới');
  assert.equal(resolveBlock(block, {}).hidden, true);
  assert.ok(inspectPage({ path: '/', fields: { blocks: JSON.stringify([block]) } }).some(issue => issue.message.includes('nguồn dữ liệu')));
});
test('pricing uses enabled booking services and immediately reflects changed prices', () => {
  const block = createContentBlock('services', makeId);
  assert.match(resolveBlock(block, {}, services).items[0].text, /650.000/);
  assert.equal(resolveBlock(block, {}, [{ ...services[0], enabled: false }]).items.length, 0);
  assert.match(resolveBlock(block, {}, [{ ...services[0], price: 700000 }]).items[0].text, /700.000/);
});
test('template copies have independent data and new IDs while preserving linked sources', () => {
  const block = { ...createContentBlock('gallery', makeId), source: { kind: 'albums', id: 'album-1' } };
  const copy = copyTemplateBlocks([block], makeId, 2)[0];
  assert.notEqual(copy.id, block.id); assert.equal(copy.slot, 2);
  copy.images[0].alt = 'Changed'; assert.notEqual(copy.images[0].alt, block.images[0].alt);
  const fields = createPageFields('Trang mới', 'saved', makeId, null, [{ id: 'saved', kind: 'page', fields: { blocks: JSON.stringify([block]), 'page-title': 'Cũ' } }]);
  assert.equal(fields['page-title'], 'Trang mới');
  assert.notEqual(JSON.parse(fields.blocks)[0].id, block.id);
  assert.deepEqual(JSON.parse(fields.blocks)[0].source, block.source);
});
test('media usage includes published pages, drafts, albums, templates, packs and brand', () => {
  const src = '/assets/bridal.png', fields = { blocks: JSON.stringify([{ image: src }]) };
  const uses = mediaUsage(src, { '/': { fields } }, { '/about': { fields } }, { albums: [{ title: 'Album', images: [{ src }] }] }, [{ name: 'Mẫu', fields }], [{ title: 'Pack', image: src }], { heroImage: src });
  assert.equal(uses.length, 6);
});
test('draft persistence captures the page before a navigation and serializes writes', async () => {
  let resolve, state = { path: '/', fields: { title: 'A' }, revision: '', dirty: true }, saved;
  const persistence = createContentPersistence({ request: () => new Promise(done => { resolve = done; }), snapshot: () => structuredClone(state), setBusy: () => {}, onDraft: (request, draft) => { saved = { request, draft }; }, onStatus: () => {}, toast: () => {} });
  const pending = persistence.saveDraft();
  assert.equal(await persistence.saveDraft(), false);
  state.path = '/about'; state.fields.title = 'B';
  resolve({ draft: { fields: { title: 'A' } } }); await pending;
  assert.equal(saved.request.path, '/'); assert.equal(saved.request.fields.title, 'A');
});
