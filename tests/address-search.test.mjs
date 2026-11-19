import assert from 'node:assert/strict';
import test from 'node:test';
import { createAddressSearch, normalizeSearchResults } from '../lib/address-search.mjs';

const feature = (properties = {}, coordinates = [105.500987654321, 21.100123456789]) => ({ type: 'Feature', geometry: { type: 'Point', coordinates }, properties: { countrycode: 'VN', name: 'Địa điểm kiểm thử', street: 'Đường kiểm thử', housenumber: '14', city: 'Hà Nội', ...properties } });
const request = query => new Request('http://localhost/api/address-search?' + new URLSearchParams({ q: query }));

test('only valid Vietnamese results survive with precise coordinates, bounded labels and no fabricated house', () => {
  const results = normalizeSearchResults({ features: [feature({ countrycode: 'DE' }), feature({}, ['105', 21]), feature({}, {}), { ...feature(), geometry: { type: 'LineString', coordinates: [] } }, feature(), feature(), feature({ name: 'Một xã', osm_key: 'place', street: '', housenumber: '999' }, [106, 22])] });
  assert.equal(results.length, 2);
  assert.deepEqual(results[0].point, { lat: 21.100123456789, lon: 105.500987654321, mode: 'pin', accuracy: null });
  assert.equal(results[0].address, '14 Đường kiểm thử');
  assert.equal(results[1].address, '');
  assert.equal(normalizeSearchResults({ features: Array.from({ length: 12 }, (_, i) => feature({ name: 'a'.repeat(1000) }, [105, 20 + i / 100])) }).length, 5);
  assert.ok(normalizeSearchResults({ features: [feature({ name: 'a'.repeat(1000) })] })[0].label.length <= 500);
});

test('query validation makes no upstream call; requests use fixed Photon endpoint and Vietnam filter', async () => {
  let calls = 0;
  const search = createAddressSearch({ fetcher: async (url, options) => {
    calls++; const parsed = new URL(url);
    assert.equal(parsed.origin, 'https://photon.komoot.io'); assert.equal(parsed.pathname, '/api/');
    assert.equal(parsed.searchParams.get('q'), 'Nhà hát Hà Nội'); assert.equal(parsed.searchParams.get('countrycode'), 'VN'); assert.equal(parsed.searchParams.get('limit'), '5');
    assert.equal(parsed.searchParams.has('lang'), false); assert.ok(options.signal instanceof AbortSignal);
    return Response.json({ features: [feature()] });
  } });
  for (const query of ['', 'ab', 'a'.repeat(201)]) assert.equal((await search(request(query))).status, 400);
  assert.equal(calls, 0);
  const response = await search(request(' Nhà hát   Hà Nội '));
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store'); assert.equal(calls, 1);
  assert.equal((await response.json()).results[0].address, '14 Đường kiểm thử');
});

test('duplicate inflight queries share one request, cache expires and failures permit a retry', async () => {
  let calls = 0, release, time = 100000;
  const search = createAddressSearch({ now: () => time, fetcher: () => { calls++; return new Promise(resolve => { release = resolve; }); } });
  const first = search(request('Hà Nội')), second = search(request('hà nội'));
  release(Response.json({ features: [feature()] }));
  assert.equal((await first).status, 200); assert.equal((await second).status, 200); assert.equal(calls, 1);
  assert.equal((await search(request('Hà Nội'))).status, 200); assert.equal(calls, 1);
  time += 300001; const afterExpiry = search(request('Hà Nội')); release(new Response('', { status: 429 }));
  assert.equal((await afterExpiry).status, 503);
  const retry = search(request('Hà Nội')); release(Response.json({ features: [] })); assert.equal((await retry).status, 200); assert.equal(calls, 3);
});

test('unavailable/malformed upstream returns a bounded generic error; concurrent unique requests are limited', async () => {
  for (const fetcher of [async () => { throw new Error('private upstream details'); }, async () => Response.json({ invalid: [] }), async () => new Response('', { status: 500 })]) {
    const response = await createAddressSearch({ fetcher })(request('Hà Nội'));
    assert.equal(response.status, 503); assert.doesNotMatch(JSON.stringify(await response.json()), /private|stack|Google/);
  }
  const releases = [];
  const search = createAddressSearch({ fetcher: () => new Promise(resolve => releases.push(resolve)) });
  const pending = Array.from({ length: 4 }, (_, i) => search(request('Hà Nội ' + i)));
  assert.equal((await search(request('Một truy vấn khác'))).status, 503); assert.equal(releases.length, 4);
  releases.forEach(release => release(Response.json({ features: [] }))); await Promise.all(pending);
});
