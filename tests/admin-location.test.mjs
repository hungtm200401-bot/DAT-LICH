import test from 'node:test';
import assert from 'node:assert/strict';
import { adminLocationInfo, adminLocationHtml, adminLocationShortcutHtml, adminLocationExportHeaders, adminLocationExportColumns } from '../public/admin-location.js';

const appointment = { code:'TEST-LOCATION', address:'12 Đường thử nghiệm', ward:'Xã thử nghiệm' };
const details = { city:'Thành phố thử nghiệm', locationCoordinates:{lat:21.100012345,lon:105.500023456,accuracy:null,mode:'pin'}, locationDeviceCoordinates:{lat:21.1001,lon:105.5002,accuracy:18.2,mode:'gps'}, locationCapturedAt:'2026-10-31T10:00:00.000Z', locationConfirmedAt:'2026-10-31T10:01:00.000Z' };

test('admin location distinguishes submitted service pin and device GPS without inventing accuracy', () => {
  const info=adminLocationInfo(appointment,details);
  assert.equal(info.coordinates,'21.100012, 105.500023');
  assert.equal(info.deviceCoordinates,'21.100100, 105.500200');
  assert.equal(info.point.accuracy,null);
  assert.equal(info.devicePoint.accuracy,18.2);
  assert.match(info.source,/Khách chọn/);
  assert.match(info.capturedAt,/17:00/);
  assert.equal(new URL(info.directionsUrl).searchParams.get('destination'),'21.100012345,105.500023456');
  assert.equal(new URL(info.mapsUrl).searchParams.get('query'),'21.100012345,105.500023456');
  const html=adminLocationHtml(appointment,details);
  assert.match(html,/±19 m/);
  assert.match(html,/độ chính xác GPS không áp dụng cho điểm ghim/);
  assert.match(html,/GPS thiết bị ban đầu/);
});

test('legacy and absent coordinates remain manual address entries', () => {
  for(const locationCoordinates of [null,undefined,{lat:'21',lon:'105'}, {lat:91,lon:0}, {lat:NaN,lon:105}]) {
    const html=adminLocationHtml(appointment,{locationCoordinates});
    assert.match(html,/chưa có tọa độ/);
    assert.doesNotMatch(html,/data-admin-location-panel|google.com\/maps|Tại Studio/);
    assert.match(adminLocationShortcutHtml(appointment,{locationCoordinates}),/Chưa có tọa độ/);
  }
});

test('location export preserves full precision and columns for real incoming metadata', () => {
  const columns=adminLocationExportColumns(appointment,details);
  assert.equal(columns.length,adminLocationExportHeaders.length);
  assert.equal(columns[0],21.100012345);
  assert.equal(columns[1],105.500023456);
  assert.equal(columns[3],18.2);
  assert.equal(columns[4],21.1001);
  assert.equal(columns[5],105.5002);
  assert.deepEqual(adminLocationExportColumns(appointment,{}),['','','','','','','','','']);
});

test('unconfirmed device GPS stays visible without being presented as service destination', () => {
  const html=adminLocationHtml(appointment,{...details,locationCoordinates:null});
  assert.match(html,/GPS thiết bị ban đầu/);
  assert.match(html,/Chưa được dùng làm điểm đến phục vụ/);
  assert.doesNotMatch(html,/google.com\/maps|data-admin-location-panel/);
});

test('admin location text and data attributes escape customer content', () => {
  const html=adminLocationHtml({...appointment,code:'"<img>',address:'<script>alert(1)</script>'},{...details,locationNote:'"><img src=x onerror=1>'});
  assert.doesNotMatch(html,/<script>|<img/);
  assert.match(html,/&lt;script&gt;/);
  assert.match(html,/&quot;&gt;&lt;img/);
});
