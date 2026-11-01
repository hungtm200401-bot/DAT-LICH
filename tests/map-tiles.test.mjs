import test from 'node:test';
import assert from 'node:assert/strict';
import { createMapTileProxy } from '../lib/map-tiles.mjs';

const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
const tileRequest = (query = 'z=13&x=6496&y=3604', headers = {}) => new Request(`https://booking.example/api/map-tiles?${query}`, { headers });
const tile = (headers = {}, body = png) => new Response(body, { headers: { 'content-type': 'image/png', ...headers } });

test('only single integer XYZ coordinates within the supported tile pyramid reach the fixed provider', async () => {
  let calls = 0;
  const proxy = createMapTileProxy({ fetcher: async url => { calls++; assert.match(url, /^https:\/\/tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/); return tile(); } });
  for (const query of ['', 'z=&x=0&y=0', 'z=-1&x=0&y=0', 'z=20&x=0&y=0', 'z=1.1&x=0&y=0', 'z=1&x=2&y=0', 'z=1&x=0&y=-1', 'z=1&x=0&y=2', 'z=1&x=0&y=0&z=1', 'z=1&x=0&y=0&url=https://evil.example', 'z=1&x=01&y=0', 'z=1&x=1e0&y=0']) {
    const response = await proxy(tileRequest(query));
    assert.equal(response.status, 400, query);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  assert.equal(calls, 0);
  assert.equal((await proxy(tileRequest('z=0&x=0&y=0'))).status, 200);
  assert.equal((await proxy(tileRequest('z=19&x=524287&y=524287'))).status, 200);
  assert.equal(calls, 2);
});

test('upstream identity includes app origin and preserves the actual Referer without default no-cache headers', async () => {
  const seen = [];
  const proxy = createMapTileProxy({ fetcher: async (url, options) => { seen.push({ url, ...options }); return tile({ 'cache-control': 'no-store' }); } });
  const response = await proxy(tileRequest(undefined, { referer: 'https://booking.example/book?step=2' }));
  assert.equal(response.status, 200);
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), png);
  assert.equal(seen[0].url, 'https://tile.openstreetmap.org/13/6496/3604.png');
  assert.equal(seen[0].headers.get('user-agent'), 'HoanMakeupArtist/1.0 (+https://booking.example)');
  assert.equal(seen[0].headers.get('referer'), 'https://booking.example/book?step=2');
  assert.equal(seen[0].headers.get('cache-control'), null);
  assert.equal(seen[0].headers.get('pragma'), null);
  assert.equal(seen[0].redirect, 'error');
  assert.ok(seen[0].signal instanceof AbortSignal);
  await proxy(tileRequest());
  assert.equal(seen[1].headers.get('referer'), 'https://booking.example/');
});

test('fresh cache honors origin Age and forwards validators and freshness headers', async () => {
  let time = Date.parse('2026-10-31T00:00:00Z'), calls = 0;
  const proxy = createMapTileProxy({ now: () => time, fetcher: async () => { calls++; return tile({ 'cache-control': 'public, max-age=60', age: '20', date: new Date(time).toUTCString(), etag: '"one"', 'last-modified': 'Fri, 30 Oct 2026 00:00:00 GMT' }); } });
  await proxy(tileRequest());
  time += 30000;
  const cached = await proxy(tileRequest());
  assert.equal(calls, 1);
  assert.equal(cached.headers.get('age'), '50');
  assert.equal(cached.headers.get('etag'), '"one"');
  assert.equal(cached.headers.get('cache-control'), 'public, max-age=60');
  assert.equal((await proxy(tileRequest(undefined, { 'if-none-match': 'W/"one"' }))).status, 304);
  assert.equal((await proxy(tileRequest(undefined, { 'if-modified-since': 'Fri, 30 Oct 2026 00:00:00 GMT' }))).status, 304);
  assert.equal((await proxy(tileRequest(undefined, { 'if-none-match': '"other"', 'if-modified-since': 'Fri, 30 Oct 2026 00:00:00 GMT' }))).status, 200);
});

test('expired entries conditionally revalidate and merge a 304 before serving cached PNG bytes', async () => {
  let time = Date.parse('2026-10-31T00:00:00Z'), calls = 0;
  const modified = 'Fri, 30 Oct 2026 00:00:00 GMT';
  const proxy = createMapTileProxy({ now: () => time, fetcher: async (_, options) => {
    calls++;
    if (calls === 1) return tile({ 'cache-control': 'max-age=1', date: new Date(time).toUTCString(), etag: '"one"', 'last-modified': modified });
    assert.equal(options.headers.get('if-none-match'), '"one"');
    assert.equal(options.headers.get('if-modified-since'), modified);
    return new Response(null, { status: 304, headers: { 'cache-control': 'max-age=60', etag: '"two"' } });
  } });
  await proxy(tileRequest());
  time += 2000;
  const validated = await proxy(tileRequest());
  assert.deepEqual(new Uint8Array(await validated.arrayBuffer()), png);
  assert.equal(validated.headers.get('etag'), '"two"');
  assert.equal(validated.headers.get('age'), '0');
  time += 30000;
  await proxy(tileRequest());
  assert.equal(calls, 2);
});

test('Expires and Last-Modified work without ETag, and client refresh triggers validation', async () => {
  let time = Date.parse('2026-10-31T00:00:00Z'), calls = 0;
  const proxy = createMapTileProxy({ now: () => time, fetcher: async (_, options) => {
    calls++;
    if (calls > 1) assert.equal(options.headers.get('if-modified-since'), 'Fri, 30 Oct 2026 00:00:00 GMT');
    return tile({ date: new Date(time).toUTCString(), expires: new Date(time + 60000).toUTCString(), 'last-modified': 'Fri, 30 Oct 2026 00:00:00 GMT' });
  } });
  await proxy(tileRequest());
  time += 30000;
  await proxy(tileRequest());
  assert.equal(calls, 1);
  await proxy(tileRequest(undefined, { 'cache-control': 'no-cache' }));
  assert.equal(calls, 2);
  time += 61000;
  await proxy(tileRequest());
  assert.equal(calls, 3);
});

test('no-store, private, unknown Vary and no-cache prevent unvalidated reuse', async () => {
  for (const headers of [{ 'cache-control': 'no-store' }, { 'cache-control': 'private, max-age=60' }, { 'cache-control': 'max-age=60', vary: 'Referer' }, { 'cache-control': 'no-cache', etag: '"one"' }]) {
    let calls = 0;
    const proxy = createMapTileProxy({ fetcher: async (_, options) => { calls++; if (headers.etag && calls === 2) assert.equal(options.headers.get('if-none-match'), '"one"'); return tile(headers); } });
    await proxy(tileRequest()); await proxy(tileRequest());
    assert.equal(calls, 2);
  }
});

test('identical concurrent requests share one fetch; distinct in-flight work and cached bytes are bounded', async () => {
  let calls = 0, release;
  const gate = new Promise(resolve => { release = resolve; });
  const proxy = createMapTileProxy({ maxInflight: 1, maxEntries: 1, maxCacheBytes: png.length, fetcher: async () => { calls++; await gate; return tile(); } });
  const first = proxy(tileRequest()), second = proxy(tileRequest());
  assert.equal((await proxy(tileRequest('z=0&x=0&y=0'))).status, 503);
  release();
  assert.equal((await first).status, 200);
  assert.equal((await second).status, 200);
  assert.equal(calls, 1);
  await proxy(tileRequest('z=0&x=0&y=0'));
  await proxy(tileRequest());
  assert.equal(calls, 3);
});

test('concurrent callers with different Referers cannot share a private or varied response', async () => {
  let calls = 0, release;
  const gate = new Promise(resolve => { release = resolve; });
  const proxy = createMapTileProxy({ fetcher: async (_, options) => {
    calls++;
    const marker = options.headers.get('referer').endsWith('/a') ? 1 : 2;
    await gate;
    return tile({ vary: 'Referer', 'cache-control': 'private' }, Uint8Array.from([...png, marker]));
  } });
  const a = proxy(tileRequest(undefined, { referer: 'https://booking.example/a' }));
  const b = proxy(tileRequest(undefined, { referer: 'https://booking.example/b' }));
  release();
  assert.equal(new Uint8Array(await (await a).arrayBuffer()).at(-1), 1);
  assert.equal(new Uint8Array(await (await b).arrayBuffer()).at(-1), 2);
  assert.equal(calls, 2);
});

test('upstream errors, wrong MIME/signature, redirects and oversized bodies are never cached', async () => {
  const failures = [() => new Response('unavailable', { status: 503 }), () => new Response(null, { status: 302, headers: { location: 'https://evil.example/' } }), () => new Response(png, { headers: { 'content-type': 'text/html' } }), () => tile({}, new Uint8Array(10)), () => tile({ 'content-length': String(512 * 1024 + 1) }), () => tile({}, new Uint8Array(512 * 1024 + 1)), () => { throw new Error('ECONNREFUSED'); }];
  for (const failure of failures) {
    let calls = 0;
    const proxy = createMapTileProxy({ fetcher: async () => { calls++; return calls === 1 ? failure() : tile(); } });
    const response = await proxy(tileRequest());
    assert.equal(response.status, 502);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal((await proxy(tileRequest())).status, 200);
    assert.equal(calls, 2);
  }
});

test('deadline covers an unresponsive fetch and a stalled response body', async () => {
  for (const fetcher of [() => new Promise(() => {}), async () => tile({}, new ReadableStream({ start(controller) { controller.enqueue(png); } }))]) {
    const started = Date.now();
    const response = await createMapTileProxy({ fetcher, timeoutMs: 25 })(tileRequest());
    assert.equal(response.status, 502);
    assert.ok(Date.now() - started < 500);
  }
});

test('live same-origin tile route serves a PNG for the authorized fixed test tile', { skip: !process.env.MAP_TILES_LIVE_URL }, async () => {
  const url = new URL('/api/map-tiles?z=13&x=6496&y=3604', process.env.MAP_TILES_LIVE_URL);
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  assert.equal(response.status, 200, `Tile route returned ${response.status}: ${await (response.ok ? Promise.resolve('') : response.text())}`);
  assert.match(response.headers.get('content-type') || '', /^image\/png/);
  const bytes = new Uint8Array(await response.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 8)], [...png.slice(0, 8)]);
});
