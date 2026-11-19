import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyAdminToken } from '../lib/admin-authorization.mjs';
import { validBookingDateTime, bookingTimeError } from '../lib/booking-validation.mjs';
import { inspectUploadedImage } from '../lib/image-upload.mjs';

test('admin authorization never trusts a local or LAN hostname, or absent server key', async () => {
  for (const host of ['localhost','127.0.0.1','192.168.1.2','10.0.0.1','172.16.1.2','[::1]','example.com']) {
    const url = 'http://' + host + '/api/visits';
    assert.equal(await verifyAdminToken(new Request(url), 'private-test-key'), false);
    assert.equal(await verifyAdminToken(new Request(url,{headers:{Authorization:'Bearer wrong'}}), 'private-test-key'), false);
    const request = new Request(url,{headers:{Authorization:'Bearer private-test-key'}});
    assert.equal(await verifyAdminToken(request, undefined), false);
    assert.equal(await verifyAdminToken(request, 'private-test-key'), true);
    assert.equal(await verifyAdminToken(new Request(url,{headers:{Authorization:'Bearer private-test-key',Origin:'https://foreign.invalid'}}),'private-test-key'),false);
  }
});
test('calendar validation rejects impossible dates, rollover and invalid clocks', () => {
  for (const [date,time] of [['2026-02-29','10:00'],['2026-04-31','10:00'],['2099-99-99','10:00'],['2026-11-04','99:99'],['2026-11-04','24:00'],['2026-11-04','10:60'],['2026-11-04',{}]]) assert.equal(validBookingDateTime(date,time),false);
  assert.equal(validBookingDateTime('2028-02-29','23:59'),true);
});
test('booking window uses Vietnam day inclusively across UTC midnight and year end', () => {
  const now = Date.parse('2026-12-31T17:01:00Z'); // Vietnam Jan 1
  assert.equal(bookingTimeError('2027-01-02','09:00',1,now),'');
  assert.notEqual(bookingTimeError('2027-01-03','09:00',1,now),'');
  assert.notEqual(bookingTimeError('2027-01-01','00:00',1,now),'');
  assert.notEqual(bookingTimeError('2027-01-02','09:00',0,now),'');
});
test('upload validates content, declared type, truncation and dimensions', () => {
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aB9sAAAAASUVORK5CYII=','base64');
  assert.deepEqual(inspectUploadedImage(png,'image/png'),{type:'image/png',width:1,height:1});
  assert.throws(()=>inspectUploadedImage(png,'image/jpeg'));
  assert.throws(()=>inspectUploadedImage(Buffer.from('<!doctype html>'),'image/png'));
  assert.throws(()=>inspectUploadedImage(png.subarray(0,png.length-3),'image/png'));
  const bomb=Buffer.from(png);bomb.writeUInt32BE(30000,16);assert.throws(()=>inspectUploadedImage(bomb,'image/png'));
  const extra=Buffer.concat([png,Buffer.from('<html>')]);assert.throws(()=>inspectUploadedImage(extra,'image/png'));
  const jpg=readFileSync(new URL('../public/assets/contact-brushes-opt.jpg',import.meta.url));
  assert.equal(inspectUploadedImage(jpg,'image/jpeg').type,'image/jpeg');
});
