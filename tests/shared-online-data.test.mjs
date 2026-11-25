import assert from 'node:assert/strict';
import { createServer as httpServer, request as httpRequest } from 'node:http';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createServer as viteServer } from 'vite';
import { sharedOnlineData, ONLINE_ORIGIN, dataSourceMode } from '../build/shared-online-data.mjs';

test('shared dev data forwards booking, authentication and images to one upstream without fallback', async t => {
  const bookings = [];
  const seen = [];
  let activeSession = false;
  let localRequests = 0;
  const upstream = httpServer(async (req, res) => {
    seen.push({ path: req.url, headers: req.headers });
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bytes = Buffer.concat(chunks);
    const reply = (value, status = 200) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(value));
    };
    if (req.url === '/api/admin-session' && req.method === 'POST') {
      if (JSON.parse(bytes).key !== 'fixture-online-key') return reply({ error: 'Wrong key' }, 401);
      activeSession = true;
      res.setHeader('Set-Cookie', [
        '__Host-hoan_admin=fixture-session; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=28800',
        'hoan_visit=fixture-visitor; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=1800',
        'unrelated_secret=must-not-reach-browser; Secure; HttpOnly',
      ]);
      return reply({ ok: true });
    }
    const authorized = activeSession && /(?:^|; )__Host-hoan_admin=fixture-session(?:;|$)/.test(req.headers.cookie || '');
    if (req.url === '/api/admin-session' && req.method === 'DELETE') {
      activeSession = false;
      res.setHeader('Set-Cookie', '__Host-hoan_admin=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0');
      return reply({ ok: true });
    }
    if (req.url === '/api/admin-session') return reply({ ok: authorized }, authorized ? 200 : 401);
    if (req.url === '/api/data?admin=1') return reply(authorized ? { appointments: bookings } : { error: 'Unauthorized' }, authorized ? 200 : 401);
    if (req.url === '/api/data' && req.method === 'POST') {
      const payload = JSON.parse(bytes);
      assert.equal(payload.action, 'createAppointment');
      const appointment = { code: 'HMA-SHARED-FIXTURE', customer: payload.customer, status: 'pending', deposit: 0 };
      bookings.push(appointment);
      return reply({ appointment }, 201);
    }
    if (req.url === '/api/uploads' && req.method === 'POST') {
      if (!authorized) return reply({ error: 'Unauthorized' }, 401);
      return reply({ contentType: req.headers['content-type'], bytes: bytes.toString('base64'), paths: ['/api/uploads?key=fixture'] });
    }
    if (req.url === '/api/uploads?key=fixture') {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      return res.end(Buffer.from([137, 80, 78, 71, 0, 255]));
    }
    if (req.url === '/api/reject') return reply({ error: 'Booking conflict', fields: { time: 'Unavailable' } }, 409);
    if (req.url === '/api/redirect') {
      res.writeHead(302, { Location: upstreamOrigin + '/api/admin-session' });
      return res.end();
    }
    if (req.url.startsWith('/api/external-redirect')) {
      res.writeHead(Number(new URL(req.url, upstreamOrigin).searchParams.get('status')) || 302, { Location: 'https://example.invalid/other' });
      return res.end();
    }
    if (req.url === '/api/unreachable') return req.socket.destroy();
    if (req.url === '/api/timeout') return; // Proxy must close this and report uncertain result, without retry.
    return reply({ services: [{ id: 'personal', name: 'Shared fixture' }] });
  });
  upstream.listen(0, '127.0.0.1');
  await once(upstream, 'listening');
  const upstreamOrigin = 'http://127.0.0.1:' + upstream.address().port;
  const root = await mkdtemp(join(tmpdir(), 'hoan-shared-data-'));
  const server = await viteServer({
    configFile: false, root, logLevel: 'silent', appType: 'custom',
    server: { host: '127.0.0.1', port: 0, cors: false },
    plugins: [sharedOnlineData('online', { origin: upstreamOrigin, allowInsecureLoopback: true, timeout: 150 })],
  });
  await server.listen();
  server.middlewares.use((req, res) => { localRequests++; res.end('LOCAL FALLBACK'); });
  const origin = 'http://127.0.0.1:' + server.httpServer.address().port;
  const request = (path, options = {}) => fetch(origin + path, { ...options, redirect: 'manual' });
  const headers = { Origin: origin, 'Content-Type': 'application/json' };
  t.after(async () => {
    await server.close(); upstream.closeAllConnections(); await new Promise(resolve => upstream.close(resolve));
    await rm(root, { recursive: true, force: true });
  });

  await t.test('reports selected source and forwards public data and queries', async () => {
    const runtime = await request('/__hoan/runtime');
    assert.deepEqual(await runtime.json(), { version: 1, mode: 'online', origin: upstreamOrigin });
    const response = await request('/api/data?availability=2026-11-25&service=personal');
    assert.equal(response.headers.get('X-Hoan-Data-Source'), 'online');
    assert.equal((await response.json()).services[0].name, 'Shared fixture');
    assert.equal(seen.at(-1).path, '/api/data?availability=2026-11-25&service=personal');
  });
  await t.test('saves a booking once in the upstream shared store, not in local fallback', async () => {
    const response = await request('/api/data', { method: 'POST', headers, body: JSON.stringify({ action: 'createAppointment', customer: 'FIXTURE' }) });
    assert.equal(response.status, 201);
    assert.deepEqual((await response.json()).appointment, bookings[0]);
    assert.equal(bookings.length, 1);
    assert.equal(localRequests, 0);
    assert.equal(seen.at(-1).headers.origin, upstreamOrigin);
  });
  await t.test('does not send an old local session or spoofed privileged headers upstream', async () => {
    const response = await request('/api/data?admin=1', { headers: {
      Cookie: 'hoan_admin_local=old-local-session; unrelated=value', Authorization: 'Bearer LOCAL',
      Forwarded: 'host=attacker.invalid', 'X-Forwarded-For': '203.0.113.1', 'CF-Connecting-IP': '203.0.113.2',
    } });
    assert.equal(response.status, 401);
    for (const name of ['cookie', 'authorization', 'forwarded', 'x-forwarded-for', 'cf-connecting-ip']) assert.equal(seen.at(-1).headers[name], undefined);
  });
  let cookie;
  await t.test('uses online login with private alias cookies and reads the same booking', async () => {
    const response = await request('/api/admin-session', { method: 'POST', headers, body: JSON.stringify({ key: 'fixture-online-key' }) });
    assert.equal(response.status, 200);
    const cookies = response.headers.getSetCookie();
    assert.equal(cookies.length, 2);
    assert.match(cookies[0], /^hoan_shared_admin=fixture-session;/);
    for (const value of cookies) {
      assert.match(value, /; HttpOnly/i); assert.match(value, /; SameSite=Strict/i); assert.match(value, /; Path=\//i);
      assert.doesNotMatch(value, /; Secure|; Domain=|__Host-/i);
    }
    cookie = cookies.map(value => value.split(';')[0]).join('; ');
    const privateResponse = await request('/api/data?admin=1', { headers: { Cookie: cookie } });
    assert.equal(privateResponse.status, 200);
    assert.deepEqual((await privateResponse.json()).appointments, bookings);
    assert.match(seen.at(-1).headers.cookie, /__Host-hoan_admin=fixture-session/);
    assert.match(seen.at(-1).headers.cookie, /hoan_visit=fixture-visitor/);
  });
  await t.test('preserves multipart upload bytes and binary image response', async () => {
    const body = Buffer.from('--fixture\r\nContent-Disposition: form-data; name="files"; filename="x.png"\r\n\r\nPNG\x00\xff\r\n--fixture--\r\n', 'latin1');
    const response = await request('/api/uploads', { method: 'POST', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'multipart/form-data; boundary=fixture' }, body });
    const value = await response.json();
    assert.equal(value.bytes, body.toString('base64')); assert.equal(value.contentType, 'multipart/form-data; boundary=fixture');
    const image = await request(value.paths[0]);
    assert.equal(image.headers.get('content-type'), 'image/png');
    assert.deepEqual(Buffer.from(await image.arrayBuffer()), Buffer.from([137, 80, 78, 71, 0, 255]));
  });
  await t.test('rejects foreign Origin, Referer, fetch site and Host before touching upstream', async () => {
    for (const bad of [
      { Origin: 'https://attacker.invalid' }, { Origin: 'null' }, { Referer: 'https://attacker.invalid/' },
      { 'Sec-Fetch-Site': 'cross-site' }, { 'Sec-Fetch-Site': 'same-site' }, { Host: 'attacker.invalid' },
      { Host: '127.0.0.1:1' },
    ]) {
      const count = seen.length;
      // Fetch normalizes Host; use a raw HTTP client to exercise DNS-rebinding input.
      const response = bad.Host ? await new Promise((resolve, reject) => {
        const request = httpRequest(origin + '/api/admin-session', { method: 'POST', headers: { ...headers, ...bad } }, response => {
          response.resume(); response.on('end', () => resolve({ status: response.statusCode }));
        });
        request.on('error', reject); request.end('{}');
      }) : await request('/api/admin-session', { method: 'POST', headers: { ...headers, ...bad }, body: '{}' });
      assert.equal(response.status, 403, JSON.stringify(bad)); assert.equal(seen.length, count);
    }
  });
  await t.test('preserves validation status and does not follow redirects', async () => {
    const rejected = await request('/api/reject');
    assert.equal(rejected.status, 409); assert.equal((await rejected.json()).fields.time, 'Unavailable');
    const count = seen.length;
    const response = await request('/api/redirect');
    assert.equal(response.status, 302); assert.equal(response.headers.get('Location'), origin + '/api/admin-session'); assert.equal(seen.length, count + 1);
  });
  await t.test('never exposes external redirects that could replay a password or booking body', async () => {
    for (const status of [302, 307, 308]) {
      const count = seen.length;
      const response = await request('/api/external-redirect?status=' + status, { method: 'POST', headers, body: JSON.stringify({ key: 'fixture' }) });
      assert.equal(response.status, 502); assert.equal(response.headers.get('Location'), null);
      assert.ok((await response.json()).error); assert.equal(seen.length, count + 1);
    }
  });
  await t.test('malformed or encoded API paths cannot fall through to a local backend', async () => {
    for (const path of ['/api%2fdata', '/other/../api/data', '/other/%2e%2e/api/data', '//attacker.invalid/api/data', '/api\\data', 'http://attacker.invalid/api/data', '/foo%2f..%2fapi/data', '/foo%5c..%5capi/data', '/%2561pi/data']) {
      const count = seen.length;
      const response = await new Promise((resolve, reject) => {
        const req = httpRequest({ hostname: '127.0.0.1', port: server.httpServer.address().port, method: 'POST', path, headers }, response => {
          response.resume(); response.on('end', () => resolve(response.statusCode));
        });
        req.on('error', reject); req.end('{}');
      });
      assert.equal(response, 403, path); assert.equal(seen.length, count); assert.equal(localRequests, 0);
    }
  });
  await t.test('network errors/timeouts never use local data or retry a write', async () => {
    for (const path of ['/api/unreachable', '/api/timeout']) {
      const count = seen.filter(value => value.path === path).length;
      const response = await request(path, { method: 'POST', headers, body: '{}' });
      assert.ok([502, 504].includes(response.status)); assert.match(response.headers.get('content-type'), /json/);
      assert.ok((await response.json()).error); assert.equal(localRequests, 0);
      assert.equal(seen.filter(value => value.path === path).length, count + 1);
    }
  });
  await t.test('logout expires the alias and revokes the upstream session', async () => {
    const response = await request('/api/admin-session', { method: 'DELETE', headers: { Origin: origin, Cookie: cookie } });
    assert.equal(response.status, 200); assert.match(response.headers.getSetCookie()[0], /^hoan_shared_admin=;/);
    assert.match(response.headers.getSetCookie()[0], /Max-Age=0/i);
    assert.equal((await request('/api/data?admin=1', { headers: { Cookie: cookie } })).status, 401);
  });
  await t.test('keeps escaped Windows frontend module URLs local and usable', async () => {
    const count = seen.length;
    const response = await request('/@id/__x00__virtual:vite-rsc/client/C%3A%2FUsers%2Fowner%2Fproject%2Fcomponent.js');
    assert.equal(response.status, 200); assert.equal(await response.text(), 'LOCAL FALLBACK');
    assert.equal(seen.length, count); assert.equal(localRequests, 1);
  });
});

test('isolated local mode does not install a proxy and shared mode refuses network exposure', async () => {
  assert.equal(dataSourceMode(undefined), 'local'); // direct Vite/test default; dev CLI selects online explicitly.
  assert.equal(dataSourceMode('online'), 'online'); assert.equal(dataSourceMode('local'), 'local');
  assert.throws(() => dataSourceMode('typo'));
  assert.equal(new URL(ONLINE_ORIGIN).protocol, 'https:');
  assert.throws(() => sharedOnlineData('online', { origin: 'http://example.invalid' }));
  const server = await viteServer({ configFile: false, logLevel: 'silent', appType: 'custom', server: { host: '0.0.0.0', port: 0 }, plugins: [sharedOnlineData('online')] }).then(server => server.close(), error => error);
  assert.ok(server instanceof Error, 'shared mode must refuse a non-loopback bind before listening');
  const root = await mkdtemp(join(tmpdir(), 'hoan-isolated-data-'));
  const local = await viteServer({ configFile: false, root, logLevel: 'silent', appType: 'custom', server: { host: '127.0.0.1', port: 0 }, plugins: [sharedOnlineData('local')] });
  try {
    await local.listen();
    local.middlewares.use((_req, res) => res.end('ISOLATED LOCAL DATA'));
    const origin = 'http://127.0.0.1:' + local.httpServer.address().port;
    const descriptor = await fetch(origin + '/__hoan/runtime').then(r => r.json());
    assert.deepEqual(descriptor, { version: 1, mode: 'local', origin: null });
    const response = await fetch(origin + '/api/data');
    assert.equal(response.headers.get('X-Hoan-Data-Source'), 'local');
    assert.equal(await response.text(), 'ISOLATED LOCAL DATA');
  } finally { await local.close(); await rm(root, { recursive: true, force: true }); }
});
