import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { locationAddressSignature } from '../public/location-utils.js';

// This test starts its own Vite/D1 instance. Never send fixture appointments to
// the owner's running server or use its .wrangler/state directory.
await mkdir('scratch', { recursive: true });
const directory = await mkdtemp(resolve('scratch/location-persistence-'));
const state = resolve(directory, 'state');
process.env.HOAN_LOCATION_TEST_STATE = state;
process.env.WRANGLER_SEND_METRICS = 'false';
process.env.WRANGLER_WRITE_LOGS = 'false';
process.env.MINIFLARE_REGISTRY_PATH = resolve(directory, 'registry');
const schema = (await Promise.all(['0000_broken_jubilee.sql', '0001_visit_analytics.sql', '0002_refund_status.sql', '0003_payment_ledger.sql'].map(name => readFile('drizzle/' + name, 'utf8')))).join('\n');
const schemaPath = resolve(directory, 'schema.sql'); await writeFile(schemaPath, schema);
execFileSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'd1', 'execute', 'site-creator-d1', '--config', 'wrangler.local.json', '--local', '--persist-to', state, '--file', schemaPath], { env: process.env, stdio: 'pipe' });
const { createServer } = await import('vite');
const server = await createServer({ configFile: resolve('scripts/fixtures/location-persistence.vite.config.ts') });
try {
  await server.listen();
  const base = 'http://127.0.0.1:5197';
  const initial = await (await fetch(base + '/api/data')).json();
  assert.equal(initial.appointments.length, 0, 'Test instance must start with no owner appointments');
  const point = { lat: 21.100123456789, lon: 105.500987654321, accuracy: 12, mode: 'gps' };
  const payload = { action: 'createAppointment', customer: 'Khách kiểm thử OpenFreeMap', phone: '0900000000', serviceId: initial.services.find(service => service.enabled).id,
    date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), time: '10:00', locationType: 'client',
    address: '14 Đường kiểm thử', ward: 'Phường Tùng Thiện', city: 'Thành phố Hà Nội', provinceCode: 1, wardCode: 9604,
    locationNote: 'Cổng bên phải, tầng 2', locationCoordinates: point, locationDeviceCoordinates:point, locationCapturedAt:new Date().toISOString(),
    locationConfirmedAt: new Date().toISOString(), locationRegion: { provinceCode: 1, wardCode: 9604 } };
  payload.locationAddressSignature=locationAddressSignature(payload);
  const response = await fetch(base + '/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const created = await response.json(); assert.equal(response.status, 201, JSON.stringify(created));
  const readback = await (await fetch(base + '/api/data?' + new URLSearchParams({ code: created.appointment.code, phone: payload.phone }))).json();
  assert.equal(readback.appointment.address, payload.address); assert.equal(readback.appointment.ward, payload.ward);
  assert.equal(readback.bookingDetails.city, payload.city); assert.equal(readback.bookingDetails.locationNote, payload.locationNote);
  assert.deepEqual(readback.bookingDetails.locationCoordinates, point); assert.equal(readback.bookingDetails.locationConfirmedAt, payload.locationConfirmedAt);
  assert.equal(readback.appointment.paymentStatus, 'unverified'); assert.deepEqual(readback.paymentHistory, []);
  const expectedTotal=initial.services.find(service=>service.id===payload.serviceId).price+Number(initial.settings.travelFee);
  assert.equal(readback.appointment.total,expectedTotal); assert.equal(readback.bookingDetails.travelFee,Number(initial.settings.travelFee));
  for(const edited of [false,true]) {
    const values={...payload,time:edited?'14:00':'12:00',address:edited?'99 Địa chỉ đã sửa':'Địa chỉ hoàn toàn nhập tay',travelFee:1};
    if(!edited) {delete values.locationCoordinates;delete values.locationDeviceCoordinates;delete values.locationAddressSignature;}
    const saved=await fetch(base+'/api/data',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)});
    const result=await saved.json();assert.equal(saved.status,201,JSON.stringify(result));
    const actual=await(await fetch(base+'/api/data?'+new URLSearchParams({code:result.appointment.code,phone:values.phone}))).json();
    assert.equal(actual.appointment.address,values.address);assert.equal(actual.appointment.total,expectedTotal);
    assert.equal(actual.bookingDetails.travelFee,Number(initial.settings.travelFee));
    assert.equal(actual.bookingDetails.locationCoordinates,null);assert.equal(actual.bookingDetails.locationDeviceCoordinates,null);
    assert.equal(actual.bookingDetails.locationConfirmedAt,'');assert.deepEqual(actual.paymentHistory,[]);
  }
  console.log('PASS isolated D1: confirmed precise GPS/address readback, manual booking, stale GPS rejected after street change, unchanged configured travel fee/total and unverified payments; no owner data modified.');
} finally { await server.close(); }
