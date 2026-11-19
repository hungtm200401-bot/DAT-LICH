import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { unstable_splitSqlQuery } from 'wrangler';
import { chromium } from '../.sites-runtime/browser-tests/node_modules/playwright/index.mjs';

// This runner has no remote-target option. All writes go to a new local D1/R2
// namespace, using the real built Worker and real HTTP/browser requests.
await mkdir('scratch', { recursive: true });
const directory = await mkdtemp(resolve('scratch/security-audit-'));
const output = resolve('outputs/security-audit');
await mkdir(output, { recursive: true });
const token = randomBytes(32).toString('hex');
const modules = ['index.js', ...(await readdir('dist/server', { recursive: true })).filter(path => path.endsWith('.js') && path !== 'index.js')]
  .map(path => ({ type: 'ESModule', path: resolve('dist/server', path) }));
const options = convertV4MiniflareOptions({
  name: 'hoan-security-audit', modules, modulesRoot: resolve('dist/server'),
  compatibilityDate: '2024-09-23', compatibilityFlags: ['nodejs_compat', 'enable_weak_ref'],
  host: '127.0.0.1', port: 0, logRequests: false,
  bindings: { HOAN_LOCAL_DEV: '0', ADMIN_TOKEN: token },
  d1Databases: { DB: 'security-audit-db' }, d1Persist: resolve(directory, 'd1'),
  r2Buckets: { BUCKET: 'security-audit-bucket' }, r2Persist: resolve(directory, 'r2'),
  assets: { directory: resolve('dist/client'), binding: 'ASSETS', routerConfig: { has_user_worker: true } },
  outboundService: () => new Response('External network disabled for audit', { status: 502 }),
});
const mf = new Miniflare(options);
const cases = [], requests = [];
let browser, base, db;
const result = async (id, label, expected, run) => {
  const start = Date.now();
  try { const actual = await run(); cases.push({ id, parent: id.slice(0, 6), label, expected, status: 'PASS', actual: actual ?? 'Assertions satisfied', ms: Date.now() - start }); }
  catch (error) { cases.push({ id, parent: id.slice(0, 6), label, expected, status: error.name === 'AssertionError' ? 'FAIL' : 'BLOCKED', actual: String(error.message).replaceAll(token, '[redacted]'), ms: Date.now() - start }); }
  console.log(`${cases.at(-1).status} ${id} ${label}`);
};
const request = async (path, { admin = false, body, headers = {}, method, raw, form } = {}) => {
  const response = await fetch(base + path, {
    method: method || (body !== undefined || raw !== undefined || form ? 'POST' : 'GET'),
    headers: { Connection: 'close', ...(body !== undefined || raw !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(admin ? { Authorization: 'Bearer ' + token } : {}), ...headers },
    body: form || (raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined),
    signal: AbortSignal.timeout(20000), redirect: 'manual',
  });
  const text = await response.text();
  let data; try { data = JSON.parse(text); } catch { data = null; }
  requests.push({ method: method || (body !== undefined || raw !== undefined || form ? 'POST' : 'GET'), path, status: response.status, actor: admin ? 'test-admin' : 'anonymous' });
  return { status: response.status, data, text, headers: response.headers };
};
const post = (body, admin = false, headers = {}) => request('/api/data', { body, admin, headers });
const snapshot = async () => (await request('/api/data', { admin: true })).data;
const query = async (sql, ...args) => (await db.prepare(sql).bind(...args).all()).results;
const day = offset => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(Date.now() + offset * 86400000));
const booking = (offset, time, extra = {}) => ({ action: 'createAppointment', customer: 'SECURITY FIXTURE ONLY', phone: '0900000001', email: 'fixture@example.invalid', serviceId: 'personal', date: day(offset), time, locationType: 'client', address: 'Địa chỉ kiểm thử, không phải khách thật', ward: 'Phường kiểm thử', city: 'Thành phố Hà Nội', ...extra });
const rejected = response => assert.ok([400, 401, 403, 404, 409, 413, 415, 422].includes(response.status), `Expected rejection, got HTTP ${response.status}`);
const payment = code => ({ action: 'recordPayment', code, kind: 'deposit', amount: 100000, method: 'cash', reference: '', note: 'SIMULATED TEST ONLY / isolated DB', occurredAt: new Date(Date.now() - 60000).toISOString(), idempotencyKey: randomUUID() });

try {
  db = await mf.getD1Database('DB');
  for (const name of ['0000_broken_jubilee.sql', '0001_visit_analytics.sql', '0002_refund_status.sql', '0003_payment_ledger.sql', '0004_visit_session_codes.sql', '0005_visit_departure.sql']) {
    for (const sql of unstable_splitSqlQuery(await readFile('drizzle/' + name, 'utf8'))) await db.prepare(sql).run();
  }
  base = String(await mf.ready).replace(/\/$/, '');
  const initial = await snapshot();
  assert.equal(initial.appointments.length, 0, 'Fresh test DB required');
  assert.equal(initial.customers.length, 0, 'Never run on owner data');
  assert.equal((await request('/api/visits')).status, 401, 'Test runtime must require real admin authorization');
  const A = (await post(booking(7, '09:00', { customer: 'SECURITY_A_PRIVATE' }))).data.appointment;
  const B = (await post(booking(7, '12:00', { customer: 'SECURITY_B_PRIVATE', phone: '0900000002' }))).data.appointment;
  assert.ok(A?.code && B?.code, 'Create controlled A/B fixtures before testing');
  const baselineB = JSON.stringify((await snapshot()).appointments.find(row => row.code === B.code));

  for (const path of ['/api/visits', '/api/cms-resources?admin=1', '/api/site-content?admin=1', '/api/site-content?history=/']) {
    for (const variant of ['missing', 'invalid', 'cookie-only']) await result('G04-03.' + cases.length, `${variant} authorization ${path}`, '401/403, no private payload', async () => {
      const r = await request(path, { headers: variant === 'invalid' ? { Authorization: 'Bearer invalid-security-fixture' } : variant === 'cookie-only' ? { Cookie: 'hoanAdminToken=invalid-security-fixture' } : {} });
      assert.ok([401, 403].includes(r.status), `HTTP ${r.status}`); return { http: r.status };
    });
    await result('G08-05.' + cases.length, 'Foreign Origin with valid test credential ' + path, 'Cross-origin request denied', async () => {
      const r = await request(path, { admin: true, headers: { Origin: 'https://foreign.example.invalid' } });
      assert.ok([401, 403].includes(r.status), `HTTP ${r.status}`); return { http: r.status };
    });
  }
  for (const action of ['updateAppointment', 'deleteAppointment', 'setScheduleSlot', 'saveContent', 'saveService', 'deleteService', 'resolveRequest', 'updateRequest', 'deleteRequest', 'markNotificationsRead', 'recordPayment']) {
    await result('G04-03.' + action, 'Anonymous admin action ' + action, '401 and no changes to controlled booking B', async () => {
      const r = await post({ action, code: B.code, key: 'brand', value: { name: 'UNAUTHORIZED' } });
      assert.equal(r.status, 401); assert.equal(JSON.stringify((await snapshot()).appointments.find(row => row.code === B.code)), baselineB);
      return { http: r.status, bookingBUnchanged: true };
    });
  }
  for (const path of ['/api/site-content', '/api/cms-resources']) await result('G04-03.post-' + path.split('/').at(-1), 'Anonymous content-management POST ' + path, '401 before writes', async () => { const r = await request(path, { body: {} }); assert.equal(r.status, 401); return { http: r.status }; });
  for (const method of ['PUT', 'PATCH', 'DELETE']) await result('G04-06.' + method, 'Unsupported API method ' + method, '405 and protected B unchanged', async () => { const r = await request('/api/data', { method, raw: JSON.stringify({ action: 'deleteAppointment', code: B.code }) }); assert.equal(r.status, 405); assert.equal(JSON.stringify((await snapshot()).appointments.find(row => row.code === B.code)), baselineB); return { http: r.status }; });
  await result('G04-05.public-snapshot', 'Public data minimizes private fields', 'No customer/contact/ledger fields in public list', async () => {
    const r = await request('/api/data');
    assert.equal(r.data.customers, undefined); assert.equal(r.data.paymentTransactions, undefined); assert.equal(r.data.requests, undefined);
    assert.ok(r.data.appointments.every(row => !('customer' in row) && !('phone' in row) && !('address' in row)));
    assert.ok(r.data.appointments.every(row => !('code' in row)));
    assert.ok(r.data.scheduleSlots.every(row => !('note' in row)));
    return { http: r.status, publicBookingCodesPresent: r.data.appointments.some(row => row.code === B.code) };
  });
  await result('G04-01.lookup-own', 'Own fixture lookup', 'Correct code and phone return the matching fixture only', async () => {
    const r = await request('/api/data?' + new URLSearchParams({ code: A.code, phone: A.phone })); assert.equal(r.status, 200); assert.equal(r.data.appointment.code, A.code); return { http: r.status };
  });
  await result('G04-01.lookup-other', 'A phone combined with B code', '404, no B data', async () => {
    const r = await request('/api/data?' + new URLSearchParams({ code: B.code, phone: A.phone })); assert.equal(r.status, 404); assert.ok(!r.text.includes(B.customer) && !r.text.includes(B.phone)); return { http: r.status };
  });
  await result('G04-01.request-leak', 'Create support request using public B code without B phone', 'No owner details disclosed without ownership proof', async () => {
    const before = (await query("SELECT key FROM site_content WHERE key LIKE 'request:%'")).length;
    const r = await post({ action: 'createRequest', code: B.code, subject: 'SECURITY OWNERSHIP TEST', message: 'Harmless test, do not process' });
    const leaked = r.data?.request?.phone === B.phone || r.data?.request?.name === B.customer;
    assert.equal(leaked, false, `HTTP ${r.status}; response disclosed controlled B name/phone without a phone credential`);
    assert.equal(r.status,404); assert.equal((await query("SELECT key FROM site_content WHERE key LIKE 'request:%'")).length,before);
    return { http: r.status, leaked: false, writes:0 };
  });
  await result('G04-02.request-other', 'A submits a request associated with booking B', 'Reject mismatched owner phone', async () => {
    const r = await post({ action: 'createRequest', code: B.code, name: A.customer, phone: A.phone, subject: 'SECURITY WRONG OWNER', message: 'Harmless test, do not process' }); rejected(r); return { http: r.status };
  });
  await result('G04-02.request-own', 'Correct owner submits support request', '201, minimal receipt, matching record persisted', async () => {
    const r = await post({action:'createRequest',code:B.code,phone:B.phone,subject:'SECURITY VALID OWNER',message:'Harmless valid request'});
    assert.equal(r.status,201); assert.deepEqual(Object.keys(r.data.request).sort(),['id','status']);
    const rows=await query('SELECT value FROM site_content WHERE key=?','request:'+r.data.request.id);assert.equal(JSON.parse(rows[0].value).code,B.code);return{http:201,minimized:true};
  });
  await result('G04-02.consultation', 'Public consultation without a booking', '201 with required contact data; no private booking data', async () => {
    const r=await post({action:'createRequest',name:'SECURITY CONSULTATION',phone:'0900000099',subject:'Consultation fixture',message:'No external messages'});assert.equal(r.status,201);assert.deepEqual(Object.keys(r.data.request).sort(),['id','status']);return{http:201};
  });
  await result('G09-02.request-date','Invalid reschedule request date/time','400 before request insert',async()=>{
    const before=(await query("SELECT key FROM site_content WHERE key LIKE 'request:%'")).length;
    const r=await post({action:'createRequest',code:B.code,phone:B.phone,subject:'Yêu cầu đổi lịch',message:'Fixture',date:day(8),time:'99:99'});assert.equal(r.status,400);assert.equal((await query("SELECT key FROM site_content WHERE key LIKE 'request:%'")).length,before);return{http:400,writes:0};
  });
  await result('G09-02.admin-date','Admin update cannot persist impossible date/time','400 and original fixture unchanged',async()=>{
    const r=await post({action:'updateAppointment',code:B.code,date:day(8),time:'99:99'},true);assert.equal(r.status,400);assert.equal(JSON.stringify((await snapshot()).appointments.find(a=>a.code===B.code)),baselineB);return{http:400};
  });
  await result('G04-02.report-other', 'A reports payment for B', 'Reject and leave B unchanged', async () => {
    const r = await post({ action: 'reportPayment', code: B.code, phone: A.phone }); assert.equal(r.status, 404); assert.equal(JSON.stringify((await snapshot()).appointments.find(row => row.code === B.code)), baselineB); return { http: r.status };
  });
  await result('G05-01.lookup', 'SQL-shaped lookup inputs', 'No extra rows or database error disclosure', async () => {
    for (const fields of [{ code: B.code, phone: "' OR 1=1 --" }, { code: "' OR 1=1 --", phone: B.phone }]) {
      const r = await request('/api/data?' + new URLSearchParams(fields)); assert.equal(r.status, 404); assert.ok(!/SQLITE|select .* from|stack|Failed query/i.test(r.text));
    } return { testedInputs: 2, http: 404 };
  });
  await result('G04-04.booking', 'Price/status/owner mass assignment at booking creation', 'Server derives price, unpaid and pending; ignores extra privilege fields', async () => {
    const r = await post(booking(8, '09:00', { total: 1, travelFee: 1, deposit: 999999, paymentStatus: 'received', status: 'completed', role: 'admin', ownerId: B.code, code: 'FORGED-CODE' }));
    assert.equal(r.status, 201); const a = r.data.appointment;
    assert.equal(a.total, initial.services.find(s => s.id === 'personal').price + Number(initial.settings.travelFee)); assert.equal(a.deposit, 0); assert.equal(a.status, 'pending'); assert.equal(a.paymentStatus, 'unverified'); assert.notEqual(a.code, 'FORGED-CODE'); assert.equal(a.role, undefined);
    return { http: r.status, priceRecalculated: true, receivedMoney: 0 };
  });
  await result('G11-04.slot-race', 'Two concurrent fixture bookings for one slot', 'One succeeds and one conflicts; one persisted booking', async () => {
    const body = booking(9, '10:00'); const r = await Promise.all([post(body), post({ ...body, phone: '0900000003' })]);
    assert.deepEqual(r.map(x => x.status).sort(), [201, 409]); assert.equal((await query('SELECT code FROM appointments WHERE date=? AND time=?', body.date, body.time)).length, 1); return { http: r.map(x => x.status), persisted: 1 };
  });
  await result('G11-05.booking-replay', 'Replay same booking slot', 'No duplicate booking on replay', async () => {
    const before = (await query('SELECT code FROM appointments')).length; const r = await post(booking(9, '10:00')); assert.equal(r.status, 409); assert.equal((await query('SELECT code FROM appointments')).length, before); return { http: r.status };
  });
  for (const [label, body] of [['invalid-clock', booking(13, '99:99')], ['invalid-calendar', booking(14, '10:00', { date: '2099-99-99' })], ['past-date', booking(1, '10:00', { date: '2000-01-01' })], ['object-name', booking(15, '10:00', { customer: { role: 'admin' } })]]) {
    await result('G09-02.' + label, 'Booking validation ' + label, '400 and no booking created', async () => { const before = (await query('SELECT code FROM appointments')).length; const r = await post(body); assert.equal(r.status, 400, `HTTP ${r.status}; bookingCreated=${Boolean(r.data?.appointment)}`); assert.equal((await query('SELECT code FROM appointments')).length, before); return { http: r.status }; });
  }
  await result('G11-02.booking-window', 'Booking beyond configured open window', 'Reject dates beyond configured bookingWindow', async () => { const r = await post(booking(Number(initial.settings.bookingWindow) + 5, '11:00')); rejected(r); return { http: r.status }; });
  await result('G11-02.last-window-day', 'Last allowed booking day', '201 on inclusive final calendar day', async () => { const r=await post(booking(Number(initial.settings.bookingWindow),'11:00'));assert.equal(r.status,201);return{http:201}; });
  for(const raw of ['null','[]','"text"']) await result('G09-02.body-'+raw,'Non-object JSON body '+raw,'400 without a mutation',async()=>{const before=(await query('SELECT code FROM appointments')).length;const r=await request('/api/data',{raw});assert.equal(r.status,400);assert.equal((await query('SELECT code FROM appointments')).length,before);return{http:400};});
  await result('G11-10.payment-report', 'Customer report does not record received money', 'Only pending verification; no payment transaction', async () => {
    const r = await post({ action: 'reportPayment', code: A.code, phone: A.phone }); assert.equal(r.status, 200); assert.equal(r.data.appointment.deposit, 0); assert.equal(r.data.appointment.paymentStatus, 'pending_verification'); assert.equal((await query('SELECT id FROM payment_transactions')).length, 0); return { http: r.status, simulatedReportOnly: true, ledgerRows: 0 };
  });
  for (const amount of [-1, 0, 0.5, 1000000001, 'NaN']) await result('G11-03.money-' + amount, 'Reject invalid payment amount ' + amount, '400, no ledger entry', async () => { const r = await post({ ...payment(A.code), amount }, true); assert.equal(r.status, 400); return { http: r.status }; });
  const receipt = payment(A.code);
  await result('G11-05.payment-replay', 'SIMULATED local payment idempotency', 'One local ledger row and replay returns original result', async () => {
    const r1 = await post(receipt, true), r2 = await post(receipt, true); assert.equal(r1.status, 201); assert.equal(r2.status, 200); assert.equal(r2.data.replayed, true); assert.equal((await query('SELECT id FROM payment_transactions WHERE idempotency_key=?', receipt.idempotencyKey)).length, 1); return { http: [r1.status, r2.status], simulatedOnly: true };
  });
  await result('G09-08.payment-key-conflict', 'Same payment key with changed body', '409, no second payment', async () => { const r = await post({ ...receipt, amount: 100001 }, true); assert.equal(r.status, 409); return { http: r.status }; });
  await result('G11-03.overpayment', 'Receive more than remaining balance', '409 and no extra ledger row', async () => { const r = await post({ ...payment(A.code), amount: A.total + 1 }, true); assert.equal(r.status, 409); return { http: r.status }; });
  await result('G11-07.overrefund', 'Refund more than simulated retained money', '409 and no refund', async () => { const r = await post({ ...payment(A.code), kind: 'refund', amount: 100001 }, true); assert.equal(r.status, 409); return { http: r.status }; });
  await result('G11-02.fake-received', 'Directly change deposit/paid status without a ledger transaction', '409', async () => { const r = await post({ action: 'updateAppointment', code: B.code, deposit: 200000, paymentStatus: 'received' }, true); assert.equal(r.status, 409); return { http: r.status }; });
  await result('G08-05.write-origin', 'Cross-origin admin update with valid test token', '401 and protected B unchanged', async () => { const r = await post({ action: 'updateAppointment', code: B.code, customer: 'WRONG ORIGIN' }, true, { Origin: 'https://foreign.example.invalid' }); assert.equal(r.status, 401); assert.equal(JSON.stringify((await snapshot()).appointments.find(row => row.code === B.code)), baselineB); return { http: r.status }; });
  await result('G09-02.malformed-json', 'Malformed JSON', '400 client error without stack/SQL', async () => { const r = await request('/api/data', { raw: '{' }); assert.ok(!/Failed query|SQLITE|(?:^|\n)\s*at\s+\S+.*\(/i.test(r.text), 'Error exposed internals'); assert.equal(r.status, 400, `HTTP ${r.status}; expected a controlled client error`); return { http: r.status }; });
  for (const path of ['/api/visits', '/api/cms-resources?admin=1', '/api/site-content?admin=1', '/api/data']) await result('G14-02.' + cases.length, 'Private response cache controls ' + path, 'no-store', async () => { const r = await request(path, { admin: true }); assert.equal(r.status, 200); assert.match(r.headers.get('cache-control') || '', /no-store/); return { http: r.status, cacheControl: r.headers.get('cache-control'), vary: r.headers.get('vary') }; });
  await result('G08-06.cors', 'Foreign Origin response CORS', 'No arbitrary origin access to protected response', async () => { const r = await request('/api/visits', { admin: true, headers: { Origin: 'https://foreign.example.invalid' } }); assert.equal(r.status, 401); assert.notEqual(r.headers.get('access-control-allow-origin'), '*'); return { http: r.status, allowOrigin: r.headers.get('access-control-allow-origin') }; });

  for (const mime of ['text/html', 'image/svg+xml']) await result('G07-02.' + mime, 'Reject active upload type ' + mime, '400', async () => { const form = new FormData(); form.append('files', new File(['harmless fixture'], 'fixture.' + (mime === 'text/html' ? 'html' : 'svg'), { type: mime })); const r = await request('/api/uploads', { admin: true, form }); assert.equal(r.status, 400); return { http: r.status }; });
  await result('G07-01.mime-spoof', 'HTML/text bytes labelled image/png', 'Reject content that is not an image', async () => { const form = new FormData(); form.append('files', new File(['<!doctype html><p>HARMLESS SECURITY FIXTURE</p>'], 'fixture.png', { type: 'image/png' })); const r = await request('/api/uploads', { admin: true, form }); assert.equal(r.status, 400, `HTTP ${r.status}; non-image accepted=${Boolean(r.data?.paths?.length)}`); return { http: r.status }; });
  await result('G07-03.object-key', 'Object-key traversal on file download', '404', async () => { const r = await request('/api/uploads?key=' + encodeURIComponent('../.env')); assert.equal(r.status, 404); return { http: r.status }; });
  await result('G07-06.file-count', 'Four small uploads exceed allowed count', '400, no uploaded paths', async () => { const form = new FormData(); for (let i = 0; i < 4; i++) form.append('files', new File(['fixture'], 'fixture.png', { type: 'image/png' })); const r = await request('/api/uploads', { admin: true, form }); assert.equal(r.status, 400); assert.equal(r.data.paths, undefined); return { http: r.status }; });
  await result('G07-05.upload-auth', 'Anonymous upload', '401', async () => { const form = new FormData(); form.append('files', new File(['fixture'], 'fixture.png', { type: 'image/png' })); const r = await request('/api/uploads', { form }); assert.equal(r.status, 401); return { http: r.status }; });
  await result('G07-01.valid-image', 'Valid tiny PNG upload/readback control', '201/200 upload, exact bytes served with image MIME and nosniff', async () => {
    const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aB9sAAAAASUVORK5CYII=', 'base64');
    const form = new FormData(); form.append('files', new File([image], 'harmless-security-fixture.png', { type: 'image/png' }));
    const uploaded = await request('/api/uploads', { admin: true, form }); assert.equal(uploaded.status, 200);
    const r = await fetch(base + uploaded.data.paths[0]); assert.equal(r.status, 200); assert.equal(r.headers.get('content-type'), 'image/png'); assert.equal(r.headers.get('x-content-type-options'), 'nosniff'); assert.deepEqual(Buffer.from(await r.arrayBuffer()), image); return { http: [200, 200], exactBytes: true };
  });
  await result('G07-06.file-size', 'One image exceeds 5 MB limit by one byte', '400, no object added', async () => {
    const bucket = await mf.getR2Bucket('BUCKET'), before = (await bucket.list()).objects.length;
    const form = new FormData(); form.append('files', new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'over-limit.png', { type: 'image/png' }));
    const r = await request('/api/uploads', { admin: true, form }); assert.ok([400, 413].includes(r.status), `HTTP ${r.status}`); assert.equal((await bucket.list()).objects.length, before); return { http: r.status, orphanObjects: 0 };
  });
  await result('G09-06.pagination', 'Visitor pagination/date clamp', 'Bounded page size on huge or negative input', async () => { for (const query of ['offset=-1&days=-1', 'offset=999999999&days=999999999']) { const r = await request('/api/visits?' + query, { admin: true }); assert.equal(r.status, 200); assert.equal(r.data.pageSize, 10); assert.ok(r.data.sessions.length <= 10); } return { maxRows: 10 }; });
  await result('G12-08.analytics-redaction', 'Analytics does not retain booking IDs or phone query', 'Stored path is generic and excludes query', async () => {
    const r = await request('/api/visits', { body: { type: 'start', mode: 'anonymous', page: '/booking/' + A.code + '?phone=0900000001', source: 'direct' } }); assert.equal(r.status, 200);
    const cookie = r.headers.get('set-cookie') || ''; assert.match(cookie, /HttpOnly/i); assert.match(cookie, /SameSite=Lax/i);
    const rows = await query('SELECT current_page,landing_page FROM visit_sessions'); assert.ok(rows.length > 0); assert.ok(rows.every(row => row.current_page === '/booking/detail' && row.landing_page === '/booking/detail')); return { http: r.status, redactedPath: '/booking/detail', trackingCookieHttpOnly: true };
  });
  await result('G08-05.analytics-origin', 'Foreign Origin analytics mutation', '403', async () => { const r = await request('/api/visits', { body: { type: 'start', mode: 'anonymous', page: '/' }, headers: { Origin: 'https://foreign.example.invalid' } }); assert.equal(r.status, 403); return { http: r.status }; });
  for (const path of ['/.env', '/.dev.vars', '/.git/config', '/app/api/data/route.ts', '/@vite/client', '/node_modules/.vite/deps_rsc/react-dom.js']) await result('G01-03.' + cases.length, 'Production artifact file exposure ' + path, 'No source or secret file returned', async () => { const r = await request(path); assert.ok(!/^\s*\[core\]/m.test(r.text)); assert.ok(!r.text.includes(token)); assert.ok(!r.text.includes('export async function POST') && !r.text.includes('class HMRClient')); assert.ok(r.status >= 400 || /text\/html/.test(r.headers.get('content-type') || ''), `Unexpected file response HTTP ${r.status}`); return { http: r.status, type: r.headers.get('content-type') }; });
  await result('G08-09.headers', 'Production-build browser security headers', 'CSP frame restrictions, nosniff and Referrer-Policy', async () => {
    const r = await request('/'); const csp = r.headers.get('content-security-policy') || '';
    const missing = []; if (!/frame-ancestors/.test(csp) && !r.headers.get('x-frame-options')) missing.push('frame restriction'); if (r.headers.get('x-content-type-options') !== 'nosniff') missing.push('nosniff'); if (!r.headers.get('referrer-policy')) missing.push('Referrer-Policy');
    assert.deepEqual(missing, [], 'Missing application-level headers: ' + missing.join(', ')); return { http: r.status };
  });
  await result('G15-01.no-local-secret-artifact','Local admin secret excluded from build artifacts','No .dev.vars in server/client output',async()=>{
    for(const directory of ['dist/server','dist/client']){assert.ok(!(await readdir(directory)).includes('.dev.vars'));}return{localSecretArtifacts:0};
  });

  const canaryName = 'SECURITY_XSS <img src="/__security_canary_missing" onerror="window.__SECURITY_CANARY=1">';
  const xss = await post(booking(16, '10:00', { customer: canaryName, phone: '0900000004' })); assert.equal(xss.status, 201);
  const formula = await post(booking(17, '10:00', { customer: '=2+3', phone: '0900000005' })); assert.equal(formula.status, 201);
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', serviceWorkers: 'block', acceptDownloads: true });
  await context.addInitScript(t => { localStorage.setItem('hoanAdminToken', t); localStorage.setItem('hoanAnalyticsConsent', 'no'); }, token);
  await context.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
  const page = await context.newPage();
  for (const path of ['/admin/appointments', '/admin/customers']) await result('G08-02.' + path.split('/').at(-1), 'Stored customer-name XSS on ' + path, 'Canary remains inert text', async () => {
    await page.goto(base + '/?audit=' + path.split('/').at(-1) + '#' + path); await page.waitForFunction(() => window.state?.backendReady); await page.waitForLoadState('networkidle');
    const executed = await page.evaluate(() => window.__SECURITY_CANARY === 1);
    await page.screenshot({ path: resolve(output, 'stored-xss-' + path.split('/').at(-1) + '.png'), fullPage: true });
    assert.equal(executed, false, 'Harmless canary JavaScript executed from saved customer name'); return { canaryExecuted: false };
  });
  await result('G08-02.customer-modal','Persisted name and note stay inert in edit modal','No element injected through input attribute or textarea',async()=>{
    const id=(await query('SELECT id FROM customers WHERE phone=?','0900000004'))[0].id;
    const note='</textarea><img src="/__security_note" onerror="window.__SECURITY_NOTE=1">';
    await db.prepare('UPDATE customers SET note=? WHERE id=?').bind(note,id).run();
    await page.goto(base+'/?audit=modal#/admin/customers');await page.waitForFunction(()=>window.state?.backendReady);await page.waitForLoadState('networkidle');
    const row=page.locator('#customer-body tr').filter({hasText:'0900000004'});await row.locator('[data-action="edit-customer"]').click();
    assert.equal(await page.locator('#modal-customer-note').inputValue(),note);assert.equal(await page.locator('#modal-customer-name').inputValue(),canaryName);assert.equal(await page.evaluate(()=>window.__SECURITY_NOTE===1||window.__SECURITY_CANARY===1),false);
    await page.locator('.modal [data-action="close-modal"]').click();return{canaryExecuted:false,storedTextPreserved:true};
  });
  await result('G05-09.csv', 'Export customer formula canary', 'CSV prefixes untrusted formula values as text', async () => {
    const download = page.waitForEvent('download'); await page.locator('[data-action="export-customers"]').click();
    const csv = await readFile(await (await download).path(), 'utf8'); assert.ok(csv.includes('"\'=2+3"')); assert.ok(!csv.includes('"=2+3"')); return { formulaEscaped: true };
  });
  await result('G08-01.search', 'Reflected XSS in public search', 'Search canary is inert', async () => {
    await page.goto(base + '/?audit=search#/search?q=' + encodeURIComponent('<img src="/__security_reflected" onerror="window.__SECURITY_REFLECTED=1">')); await page.waitForLoadState('networkidle');
    assert.equal(await page.evaluate(() => window.__SECURITY_REFLECTED === 1), false); return { canaryExecuted: false };
  });
  await result('G08-07.framing', 'Sensitive page embedded by a foreign origin', 'Browser blocks sensitive page framing', async () => {
    const parent = createServer((_request, response) => { response.writeHead(200, { 'Content-Type': 'text/html' }); response.end('<!doctype html><title>Owned test parent</title><iframe width="1200" height="800" src="' + base + '/#/admin/settings"></iframe>'); });
    await new Promise(resolve => parent.listen(0, '127.0.0.1', resolve));
    const parentOrigin = 'http://127.0.0.1:' + parent.address().port;
    await context.route(parentOrigin + '/**', route => route.continue());
    const framePage = await context.newPage();
    try {
      await framePage.goto(parentOrigin); await framePage.waitForLoadState('networkidle');
      const framed = framePage.frames().some(frame => frame.url().startsWith(base));
      await framePage.screenshot({ path: resolve(output, 'cross-origin-frame.png'), fullPage: true });
      assert.equal(framed, false, 'Sensitive route loaded in cross-origin iframe on another controlled local port'); return { framed: false };
    } finally { await framePage.close(); parent.closeAllConnections(); await new Promise(resolve => parent.close(resolve)); }
  });
  await result('G08-07.preview-self','Same-origin CMS-style frame remains available','Public preview renders within own origin',async()=>{
    await page.goto(base+'/?audit=self-frame#/');await page.evaluate(()=>{const iframe=document.createElement('iframe');iframe.id='security-self-preview';iframe.src='/?cmsPreview=1#/';document.body.append(iframe);});
    await page.frameLocator('#security-self-preview').locator('#app main').waitFor();assert.ok(page.frames().some(f=>f.parentFrame()&&f.url().startsWith(base)));return{sameOriginPreview:true};
  });
  for(const width of [1440,390]) await result('G03-08.login-'+width,'Real login/logout at '+width+'px','Wrong key denied; right key opens settings; logout clears private state',async()=>{
    const fresh=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});await fresh.addInitScript(()=>localStorage.setItem('hoanAnalyticsConsent','no'));
    await fresh.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
    const screen=await fresh.newPage();
    try{
      await screen.goto(base+'/?audit=login-'+width+'#/admin/settings');await screen.locator('[data-form="admin-login"]').waitFor();await screen.waitForLoadState('networkidle');
      await screen.locator('#admin-access-key').fill('wrong-security-key');await screen.locator('[data-form="admin-login"] button').click();await screen.locator('[data-login-status]').filter({hasText:'Khóa không đúng'}).waitFor();
      assert.equal(await screen.evaluate(()=>window.state?.adminAuthorized),false);
      await screen.locator('#admin-access-key').fill(token);await screen.locator('[data-form="admin-login"] button').click();await screen.locator('.settings-workspace').waitFor();
      assert.equal(await screen.evaluate(()=>window.state?.adminAuthorized),true);
      assert.equal(await screen.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
      if(width===1440)await screen.locator('[data-action="admin-logout"]').click();else{await screen.goto(base+'/?audit=logout#/admin/account');await screen.locator('[data-ma-action="logout"]').click();}
      await screen.locator('[data-form="admin-login"]').waitFor();assert.equal(await screen.evaluate(()=>sessionStorage.getItem('hoanAdminToken')),null);assert.equal(await screen.evaluate(()=>window.state.customers.length),0);return{width,login:true,logout:true};
    }finally{await fresh.close();}
  });
  await context.close();
  await browser.close(); browser = null;
  for(const configuredKey of [true,false]) await result('G03-08.dev-'+configuredKey,'Actual Worker dev flag with '+(configuredKey?'configured':'missing')+' key','Local/LAN hosts cannot bypass credentials',async()=>{
    const authRuntime=new Miniflare(convertV4MiniflareOptions({name:'hoan-auth-regression',modules,modulesRoot:resolve('dist/server'),compatibilityDate:'2024-09-23',compatibilityFlags:['nodejs_compat','enable_weak_ref'],host:'127.0.0.1',port:0,logRequests:false,bindings:{HOAN_LOCAL_DEV:'1',...(configuredKey?{ADMIN_TOKEN:token}:{})},d1Databases:{DB:randomUUID()},r2Buckets:{BUCKET:randomUUID()}}));
    try{
      for(const host of ['localhost','127.0.0.1','192.168.1.20','10.0.0.20','[::1]'])for(const supplied of ['', 'invalid', ...(configuredKey?[]:[token])]){
        const response=await authRuntime.dispatchFetch('http://'+host+'/api/visits',{headers:supplied?{Authorization:'Bearer '+supplied}:{}});assert.equal(response.status,401);await response.text();
      }
      return{devFlag:'1',configuredKey,hostBypasses:0};
    }finally{await authRuntime.dispose();}
  });

  const health = await request('/'); assert.equal(health.status, 200);
  const metadata = { timestamp: new Date().toISOString(), timezone: 'Asia/Bangkok', head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), dirtyWorkingTree: Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()),
    workerSha256: createHash('sha256').update(await readFile('dist/server/index.js')).digest('hex'), appJsSha256: createHash('sha256').update(await readFile('dist/client/app.js')).digest('hex'), scope: 'Actual production Worker build on local Miniflare, isolated D1/R2; no remote domain, cloud edge or live business data', runtime: base, stateDirectory: relative(process.cwd(), directory), counts: { PASS: cases.filter(row => row.status === 'PASS').length, FAIL: cases.filter(row => row.status === 'FAIL').length, BLOCKED: cases.filter(row => row.status === 'BLOCKED').length }, requestCount: requests.length };
  await writeFile(resolve(output, 'results.json'), JSON.stringify({ metadata, cases, requests }, null, 2).replaceAll(token, '[redacted]'));
  console.log(JSON.stringify(metadata, null, 2));
  if (metadata.counts.FAIL || metadata.counts.BLOCKED) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await mf.dispose();
}
