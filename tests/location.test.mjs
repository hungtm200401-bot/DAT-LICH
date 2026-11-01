import test from 'node:test';
import assert from 'node:assert/strict';
import directory from '../public/data/vietnam-administrative-latest.json' with { type: 'json' };
import { findProvince, findWard, normalizeReverseAddress, parseNominatimAddress, parseBigDataCloudAddress, cleanLocationCoordinates, cleanBookingLocation } from '../public/location-utils.js';
import { reverseGeocode } from '../lib/reverse-geocode.mjs';
import aliases from '../public/data/vietnam-ward-aliases.json' with { type: 'json' };
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import { pointInGeometry, findBoundaryFeature, distanceToBoundary } from '../public/location-boundaries.js';
import { acquireDevicePosition, resolveAddressAtPosition } from '../public/device-location.js';

test('a town named Phúc Thọ cannot replace the Hanoi province returned by the map', () => {
  const result = normalizeReverseAddress(directory, parseNominatimAddress({ address: { city: 'Phúc Thọ', state: 'Hà Nội', village: 'Phúc Thọ', country_code: 'vn' } }));
  assert.equal(result.city, 'Thành phố Hà Nội');
  assert.equal(result.ward, 'Xã Phúc Thọ');
  assert.equal(result.address, '');
  assert.equal(findProvince(directory, 'Phúc Thọ'), null);
});

test('each of the 3321 wards belongs to its real province and is selectable by full name', () => {
  assert.equal(directory.length, 34);
  const wards = directory.flatMap(province => province.wards);
  assert.equal(wards.length, 3321);
  assert.equal(new Set(wards.map(ward => ward.code)).size, 3321);
  for (const province of directory) for (const ward of province.wards) assert.equal(findWard(province, ward.name)?.code, ward.code);
  assert.equal(findWard(findProvince(directory, 'Hà Nội'), 'Phường Bến Thành'), null);
});

test('former provinces and accent-insensitive input resolve to current official names', () => {
  assert.equal(findProvince(directory, 'ho chi minh')?.name, 'Thành phố Hồ Chí Minh');
  assert.equal(findProvince(directory, 'Bình Dương')?.name, 'Thành phố Hồ Chí Minh');
  assert.equal(findProvince(directory, 'Hanoi')?.name, 'Thành phố Hà Nội');
  assert.equal(findWard(findProvince(directory, 'Hà Nội'), 'phuc tho')?.name, 'Xã Phúc Thọ');
});

test('names differing only by Vietnamese accents require an unambiguous selection', () => {
  const province = findProvince(directory, 'Thái Nguyên');
  assert.equal(findWard(province, 'Xã Văn Lang')?.code, 2143);
  assert.equal(findWard(province, 'Xã Văn Lăng')?.code, 5665);
  assert.equal(findWard(province, 'xa van lang'), null);
  assert.equal(findWard(findProvince(directory, 'Hà Nội'), 'Phường Phúc Thọ'), null);
});

test('old districts and unrelated streets are never invented as current wards', () => {
  const province = findProvince(directory, 'Hà Nội');
  assert.equal(findWard(province, 'Huyện Phúc Thọ'), null);
  const result = normalizeReverseAddress(directory, parseNominatimAddress({ address: { state: 'Hà Nội', county: 'Huyện Phúc Thọ', road: 'Đường Châu Văn Liêm', country_code: 'vn' } }));
  assert.equal(result.ward, '');
  assert.equal(result.address, 'Đường Châu Văn Liêm');
});

test('unknown or foreign locations never silently become Hanoi', () => {
  assert.equal(normalizeReverseAddress(directory, { city: 'Không rõ', address: 'Đường A' }).city, '');
  const foreign = normalizeReverseAddress(directory, { city: 'Hà Nội', countryCode: 'us', address: 'Main Street' });
  assert.equal(foreign.city, '');
  assert.equal(foreign.address, '');
});

test('a locality-only fallback identifies a province without inventing a ward', () => {
  const result = normalizeReverseAddress(directory, parseBigDataCloudAddress({ city: 'Phúc Thọ', principalSubdivision: 'Hà Nội', locality: 'Phúc Thọ', countryCode: 'VN' }));
  assert.equal(result.city, 'Thành phố Hà Nội');
  assert.equal(result.ward, '');
  assert.equal(result.address, '');
});

test('a display address can supply a missing province, but unrelated place names cannot', () => {
  const result = normalizeReverseAddress(directory, { city: 'Phúc Thọ', ward: 'Phúc Thọ', fullAddress: 'Phúc Thọ, Hà Nội, Việt Nam' });
  assert.equal(result.city, 'Thành phố Hà Nội');
  assert.equal(result.ward, 'Xã Phúc Thọ');
});

test('invalid coordinates return 400 before contacting any provider', async () => {
  for (const payload of [{}, {lat: '', lon: ''}, {lat: 91, lon: 100}, {lat: 21, lon: 181}, {lat: 'NaN', lon: 105}]) {
    const response = await reverseGeocode(payload, () => { throw new Error('Must not fetch'); });
    assert.equal(response.status, 400);
  }
});

test('a confirmed coarse GPS estimate cannot become service directions while its original measurement remains available', () => {
  const timestamp = new Date().toISOString();
  const original = { lat: 21.1, lon: 105.5, accuracy: 997, mode: 'gps' };
  const booking = { locationCoordinates: original, locationDeviceCoordinates: original, locationCapturedAt: timestamp, locationConfirmedAt: timestamp, provinceCode: 1, wardCode: 9604, locationRegion: { provinceCode: 1, wardCode: 9604 } };
  const coarse = cleanBookingLocation(booking);
  assert.equal(coarse.locationCoordinates, null);
  assert.equal(coarse.locationConfirmedAt, '');
  assert.deepEqual(coarse.locationDeviceCoordinates, original);
  const precise = cleanBookingLocation({ ...booking, locationCoordinates: { ...original, accuracy: 12 } });
  assert.equal(precise.locationCoordinates.mode, 'gps');
  assert.equal(precise.locationCoordinates.accuracy, 12);
  const selected = cleanBookingLocation({ ...booking, locationCoordinates: { lat: 21.101, lon: 105.501, accuracy: null, mode: 'pin' } });
  assert.equal(selected.locationCoordinates.mode, 'pin');
  assert.deepEqual(selected.locationDeviceCoordinates, original);
});

test('the API returns validated fields and marks a missing street as a partial result', async () => {
  const response = await reverseGeocode({ lat: 21.1, lon: 105.5 }, async (url, options) => {
    assert.equal(new URL(url).searchParams.get('layer'), 'address');
    assert.ok(options.signal);
    return Response.json({ address: { city: 'Phúc Thọ', state: 'Hà Nội', village: 'Phúc Thọ', country_code: 'vn' } });
  });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.city, 'Thành phố Hà Nội');
  assert.equal(data.ward, 'Xã Phúc Thọ');
  assert.equal(data.partial, true);
});

test('the API preserves a real street and house number without changing the location', async () => {
  const response = await reverseGeocode({ lat: 21.1, lon: 105.5 }, async () => Response.json({ lat: '21.1', lon: '105.5', address: { state: 'Hà Nội', village: 'Phúc Thọ', road: 'Đường A', house_number: '12', country_code: 'vn' } }));
  const data = await response.json();
  assert.equal(data.address, '12 Đường A');
  assert.equal(data.fullAddress, '12 Đường A, Xã Phúc Thọ, Thành phố Hà Nội');
  assert.equal(data.partial, false);
});

test('provider failures are bounded errors and never produce a fabricated address', async () => {
  const response = await reverseGeocode({ lat: 21, lon: 105 }, async () => { throw new Error('Offline'); });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).city, undefined);
});

test('legacy ward conversion works across provinces and keeps split wards ambiguous', () => {
  assert.equal(findWard(findProvince(directory, 'Hà Nội'), 'Phụng Thượng', aliases.aliases)?.name, 'Xã Phúc Thọ');
  let checked = 0;
  for (const alias of aliases.aliases) {
    if (!alias.full || alias.targets.length !== 1) continue;
    const province = directory.find(province => province.code === alias.provinceCode);
    const matched = findWard(province, alias.name, aliases.aliases);
    if (matched) assert.ok(province.wards.some(ward => ward.code === matched.code));
    checked++;
  }
  assert.ok(checked > 5000);
});

test('every current ward has a boundary with its own unique administrative code', async () => {
  for (const province of directory) {
    const code = String(province.code).padStart(2, '0');
    const data = JSON.parse(gunzipSync(await readFile(new URL(`../public/data/administrative-boundaries/wards-${code}.json.gz`, import.meta.url))));
    assert.equal(data.features.length, province.wards.length, province.name);
    assert.equal(new Set(data.features.map(feature => feature.properties.code)).size, province.wards.length);
    for (const feature of data.features) {
      assert.ok(province.wards.some(ward => ward.code === feature.properties.code));
      assert.ok(feature.bbox.every(Number.isFinite));
      assert.ok(['Polygon', 'MultiPolygon'].includes(feature.geometry.type));
    }
  }
});

test('boundary lookup respects polygon holes and multiple islands', () => {
  const outer = [[0,0],[10,0],[10,10],[0,10],[0,0]], hole = [[3,3],[7,3],[7,7],[3,7],[3,3]];
  const geometry = { type:'Polygon', coordinates:[outer,hole] };
  assert.equal(pointInGeometry(1,1,geometry), true);
  assert.equal(pointInGeometry(5,5,geometry), false);
  assert.equal(pointInGeometry(20,20,geometry), false);
  const multi = {type:'MultiPolygon',coordinates:[[outer,hole],[[[20,20],[21,20],[21,21],[20,21],[20,20]]]]};
  assert.equal(pointInGeometry(20.5,20.5,multi), true);
  assert.equal(pointInGeometry(5,5,multi), false);
  assert.ok(distanceToBoundary(1,1,geometry) > 100000);
  assert.equal(findBoundaryFeature([{bbox:[0,0,10,10],geometry,properties:{code:1}}],5,5), null);
});

test('an inaccurate first GPS fix can improve without using a cached location', async () => {
  let cleared = false;
  const geolocation = {
    getCurrentPosition(success, _error, options) { assert.equal(options.maximumAge, 0); success({coords:{latitude:1,longitude:2,accuracy:5000},timestamp:Date.now()}); },
    watchPosition(success) { success({coords:{latitude:1.1,longitude:2.1,accuracy:25},timestamp:Date.now()}); return 1; },
    clearWatch() { cleared = true; }
  };
  const position = await acquireDevicePosition(geolocation, new AbortController().signal);
  assert.equal(position.coords.accuracy, 25);
  assert.equal(cleared, true);
});

test('a moderate GPS fix is refined before being returned, without fabricated precision', async () => {
  let stopped = false;
  const timestamp = Date.now();
  const position = await acquireDevicePosition({
    getCurrentPosition(success, _error, options) { assert.equal(options.enableHighAccuracy,true);success({coords:{latitude:20,longitude:106,accuracy:85},timestamp}); },
    watchPosition(success, _error, options) { assert.equal(options.maximumAge,0);success({coords:{latitude:20.0001,longitude:106.0001,accuracy:12},timestamp:timestamp+1});return 7; },
    clearWatch(id) { assert.equal(id,7);stopped=true; }
  },new AbortController().signal);
  assert.equal(position.coords.accuracy,12);
  assert.equal(position.timestamp,timestamp+1);
  assert.equal(stopped,true);
});

test('a cancelled GPS request never starts a device measurement', async () => {
  const abort = new AbortController();abort.abort();
  await assert.rejects(acquireDevicePosition({getCurrentPosition(){throw new Error('Must not start');}},abort.signal),{name:'AbortError'});
});

test('a coarse GPS fix requests pin confirmation without loading geometry or calling a geocoder', async () => {
  const original = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = () => { requests++;throw new Error('No download is needed'); };
  try {
    const result = await resolveAddressAtPosition(directory,{lat:21.1,lon:105.5,accuracy:5000,mode:'gps'},new AbortController().signal);
    assert.deepEqual(result,{area:null,reliable:false,address:'',coarse:true});
    assert.equal(requests,0);
  } finally {globalThis.fetch=original;}
});

test('a geocoder street several kilometres from the device is not auto-filled', async () => {
  const response = await reverseGeocode({lat:21.1,lon:105.5}, async () => Response.json({lat:'21.2',lon:'105.6',address:{road:'Đường ở nơi khác',state:'Hà Nội',country_code:'vn'}}));
  const result = await response.json();
  assert.equal(result.address, '');
  assert.ok(result.addressDistance > 10000);
});

test('saved booking coordinates preserve a confirmed point and reject malformed values', () => {
  assert.deepEqual(cleanLocationCoordinates({lat:21.1,lon:105.5,mode:'pin',accuracy:null}),{lat:21.1,lon:105.5,mode:'pin',accuracy:null});
  assert.equal(cleanLocationCoordinates({lat:'21.1',lon:105.5}),null);
  assert.equal(cleanLocationCoordinates({lat:91,lon:105.5}),null);
  assert.equal(cleanLocationCoordinates({lat:NaN,lon:105.5}),null);
});

test('unconfirmed or mismatched points cannot become the saved destination while original GPS is retained', () => {
  const location = { locationCoordinates:{lat:21.101,lon:105.501,mode:'pin'},locationDeviceCoordinates:{lat:21.1,lon:105.5,mode:'gps',accuracy:4000},locationCapturedAt:'2026-10-31T08:00:00Z',locationConfirmedAt:'2026-10-31T08:01:00Z',provinceCode:1,wardCode:9604,locationRegion:{provinceCode:1,wardCode:9604} };
  const now = Date.parse('2026-10-31T09:00:00Z');
  const valid = cleanBookingLocation(location,now);
  assert.equal(valid.locationCoordinates.lat,21.101);
  assert.equal(valid.locationDeviceCoordinates.accuracy,4000);
  for (const invalid of [{locationConfirmedAt:''},{locationConfirmedAt:'2030-01-01T00:00:00Z'},{locationRegion:null},{wardCode:1},{provinceCode:2}]) {
    const result = cleanBookingLocation({...location,...invalid},now);
    assert.equal(result.locationCoordinates,null);
    assert.equal(result.locationConfirmedAt,'');
    assert.deepEqual(result.locationDeviceCoordinates,valid.locationDeviceCoordinates);
  }
});
