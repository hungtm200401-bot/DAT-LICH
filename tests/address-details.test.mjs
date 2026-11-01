import test from 'node:test';
import assert from 'node:assert/strict';
import directory from '../public/data/vietnam-administrative-latest.json' with { type: 'json' };
import { formatAddressDetails, normalizeReverseAddress, parseNominatimAddress } from '../public/location-utils.js';
import { reverseGeocode } from '../lib/reverse-geocode.mjs';

const query = { lat: 21.1, lon: 105.5 };
const baseAddress = { state: 'Hà Nội', village: 'Phúc Thọ', country: 'Việt Nam', country_code: 'vn' };
const feature = (address = {}, meters = 0) => ({
  lat: String(query.lat + meters / 111195), lon: String(query.lon),
  address: { ...baseAddress, ...address }
});
const request = async data => {
  const response = await reverseGeocode(query, async () => Response.json(data));
  assert.equal(response.status, 200);
  return response.json();
};

test('a nearby house exposes structured details and current administrative names', async () => {
  const result = await request(feature({ house_number: '12A', road: 'Đường A', hamlet: 'Thôn B', neighbourhood: 'Khu C', residential: 'Khu dân cư D', building: 'Tòa E', postcode: '100000' }, 10));
  assert.equal(result.addressPrecision, 'house');
  assert.equal(result.partial, false);
  assert.deepEqual(result.missingParts, []);
  assert.deepEqual(result.addressParts, {
    houseNumber: '12A', road: 'Đường A', hamlet: 'Thôn B', neighbourhood: 'Khu C', residential: 'Khu dân cư D', suburb: '', building: 'Tòa E', postcode: '100000',
    ward: 'Xã Phúc Thọ', province: 'Thành phố Hà Nội', country: 'Việt Nam'
  });
  assert.equal(result.address, 'Tòa E, 12A Đường A, Thôn B, Khu C, Khu dân cư D');
  assert.equal(result.fullAddress, `${result.address}, Xã Phúc Thọ, Thành phố Hà Nội`);
  assert.equal(result.lat, query.lat);
  assert.equal(result.lon, query.lon);
  assert.ok(result.featureDistanceMeters > 9 && result.featureDistanceMeters < 11);
  assert.equal(result.addressDistance, result.featureDistanceMeters);
});

test('street-only and rural locality results never invent a house number', async () => {
  const street = await request(feature({ road: 'Đường A' }));
  assert.equal(street.address, 'Đường A');
  assert.equal(street.addressPrecision, 'street');
  assert.equal(street.addressParts.houseNumber, '');
  assert.ok(street.missingParts.includes('houseNumber'));
  assert.equal(street.partial, true);
  const rural = await request(feature({ hamlet: 'Thôn B' }));
  assert.equal(rural.address, 'Thôn B');
  assert.equal(rural.addressPrecision, 'locality');
  assert.equal(rural.addressParts.road, '');
  assert.equal(rural.addressParts.houseNumber, '');
  assert.ok(rural.missingParts.includes('houseNumber'));
  assert.equal(rural.partial, true);
});

test('a house number needs a useful street or place before it can be complete', async () => {
  const orphan = await request(feature({ house_number: '12' }));
  assert.equal(orphan.address, '');
  assert.equal(orphan.addressPrecision, 'locality');
  assert.ok(orphan.missingParts.includes('road'));
  assert.equal(orphan.partial, true);
  const rural = await request(feature({ house_number: '12', hamlet: 'Thôn B' }));
  assert.equal(rural.address, '12 Thôn B');
  assert.equal(rural.addressPrecision, 'house');
  assert.equal(rural.partial, false);
  const administrativeOnly = await request(feature({ house_number: '12', suburb: 'Phường Cũ' }));
  assert.equal(administrativeOnly.addressPrecision, 'locality');
  assert.equal(administrativeOnly.partial, true);
});

test('a nearby road survives when its returned house is too far away', async () => {
  const result = await request(feature({ house_number: '12', road: 'Đường A', hamlet: 'Thôn B', building: 'Tòa nhà bên cạnh' }, 60));
  assert.equal(result.address, 'Đường A, Thôn B');
  assert.equal(result.addressParts.houseNumber, '');
  assert.equal(result.addressParts.building, '');
  assert.equal(result.addressPrecision, 'street');
  assert.ok(result.missingParts.includes('houseNumber'));
  assert.equal(result.partial, true);
});

test('house and street distance limits include their exact thresholds', () => {
  const parsed = parseNominatimAddress(feature({ house_number: '12', road: 'Đường A' }));
  const atDistance = featureDistanceMeters => normalizeReverseAddress(directory, { ...parsed, featureDistanceMeters });
  assert.equal(atDistance(25).address, '12 Đường A');
  assert.equal(atDistance(25.001).address, 'Đường A');
  assert.equal(atDistance(150).address, 'Đường A');
  assert.equal(atDistance(150.001).address, '');
});

test('features over 150 metres away cannot auto-fill street or house details', async () => {
  const result = await request(feature({ house_number: '12', road: 'Đường A', building: 'Tòa E' }, 300));
  assert.equal(result.address, '');
  assert.equal(result.addressParts.houseNumber, '');
  assert.equal(result.addressParts.road, '');
  assert.equal(result.addressParts.building, '');
  assert.equal(result.addressPrecision, 'locality');
  assert.equal(result.partial, true);
});

test('missing, empty, invalid and out-of-range feature coordinates remain unknown', async () => {
  for (const coordinates of [{}, { lat: null, lon: null }, { lat: '', lon: '' }, { lat: ' ', lon: '105.5' }, { lat: '91', lon: '105.5' }, { lat: '21.1', lon: '181' }, { lat: 'NaN', lon: '105.5' }]) {
    const data = { ...feature({ house_number: '12', road: 'Đường A' }), lat: undefined, lon: undefined, ...coordinates };
    assert.equal(parseNominatimAddress(data).featureLocation, null);
    const result = await request(data);
    assert.equal(result.addressDistance, null);
    assert.equal(result.featureDistanceMeters, null);
    assert.equal(result.address, '');
    assert.equal(result.addressParts.houseNumber, '');
    assert.equal(result.addressParts.road, '');
    assert.equal(result.addressPrecision, 'locality');
    assert.equal(result.partial, true);
    assert.equal(result.lat, query.lat);
    assert.equal(result.lon, query.lon);
  }
  assert.deepEqual(parseNominatimAddress({ lat: '0', lon: '0' }).featureLocation, { lat: 0, lon: 0 });
});

test('normalizing an API response preserves conservative distance and details', async () => {
  const result = await request(feature({ house_number: '12', road: 'Đường A' }, 60));
  const normalized = normalizeReverseAddress(directory, result);
  assert.equal(normalized.address, 'Đường A');
  assert.equal(normalized.addressParts.houseNumber, '');
  assert.equal(normalized.addressPrecision, 'street');
  assert.equal(normalized.featureDistanceMeters, result.featureDistanceMeters);
  assert.equal(formatAddressDetails({ ...result.addressParts, houseNumber: '' }), 'Đường A');
});

test('the canonical full address excludes raw former ward and country tokens', async () => {
  const result = await request({ ...feature({ state: 'Bình Dương', village: 'Bến Thành', suburb: 'Phường Cũ', house_number: '12', road: 'Đường A' }), display_name: '12, Đường A, Phường Cũ, Bình Dương, Việt Nam' });
  assert.equal(result.city, 'Thành phố Hồ Chí Minh');
  assert.equal(result.ward, 'Phường Bến Thành');
  assert.equal(result.addressParts.province, result.city);
  assert.equal(result.addressParts.ward, result.ward);
  assert.equal(result.fullAddress, '12 Đường A, Phường Bến Thành, Thành phố Hồ Chí Minh');
  for (const address of [{ country: 'Hà Nội' }, { village: 'Hà Nội' }]) {
    const parsed = parseNominatimAddress({ address: { ...address, country_code: 'vn' }, display_name: 'Hà Nội' });
    assert.equal(normalizeReverseAddress(directory, parsed).city, '');
  }
});

test('foreign address details cannot be used as a Vietnamese destination', async () => {
  const result = await request(feature({ state: 'Hà Nội', house_number: '12', road: 'Main Street', country: 'United States', country_code: 'us' }));
  assert.equal(result.address, '');
  assert.equal(result.city, '');
  assert.equal(result.ward, '');
  assert.equal(result.fullAddress, '');
  assert.equal(result.addressParts.houseNumber, '');
  assert.equal(result.addressPrecision, 'missing');
  assert.equal(result.partial, true);
});

const photonFeature = (properties = {}, meters = 0) => ({
  type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [query.lon, query.lat + meters / 111195] },
    properties: { state: 'Hà Nội', district: 'Phúc Thọ', country: 'Việt Nam', countrycode: 'VN', street: 'Đường A', housenumber: '12', ...properties } }]
});

test('a failed Nominatim request falls back to bounded Photon house suggestions', async () => {
  for (const failure of ['network', '503']) {
    const calls = [];
    const response = await reverseGeocode(query, async (url, options) => {
      calls.push(new URL(url));
      assert.ok(options.signal);
      if (calls.length === 1) {
        assert.equal(calls[0].hostname, 'nominatim.openstreetmap.org');
        if (failure === 'network') throw new Error('Offline');
        return new Response(null, { status: 503 });
      }
      assert.equal(calls[1].hostname, 'photon.komoot.io');
      assert.equal(calls[1].pathname, '/reverse');
      assert.equal(calls[1].searchParams.get('limit'), '1');
      assert.equal(calls[1].searchParams.has('lang'), false);
      return Response.json(photonFeature());
    });
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.equal(calls.length, 2);
    assert.equal(result.source, 'photon');
    assert.equal(result.address, '12 Đường A');
    assert.equal(result.addressPrecision, 'house');
    assert.equal(result.lat, query.lat);
    assert.equal(result.lon, query.lon);
    assert.equal(result.ward, '');
    assert.equal(result.partial, true);
  }
});

test('a Photon former district cannot impersonate a current ward sharing its name', async () => {
  for (const district of ['Phúc Thọ', 'Huyện Phúc Thọ']) {
    const response = await reverseGeocode(query, async url => {
      if (new URL(url).hostname === 'nominatim.openstreetmap.org') throw new Error('Offline');
      return Response.json(photonFeature({ district }));
    });
    const result = await response.json();
    assert.equal(result.city, 'Thành phố Hà Nội');
    assert.equal(result.ward, '');
    assert.equal(result.addressParts.ward, '');
    assert.equal(result.address, '12 Đường A');
    assert.ok(result.missingParts.includes('ward'));
  }
});

test('Photon fallback applies the same house, road and country guards', async () => {
  for (const { data, address, precision } of [
    { data: photonFeature({}, 60), address: 'Đường A', precision: 'street' },
    { data: photonFeature({}, 300), address: '', precision: 'locality' },
    { data: photonFeature({ countrycode: 'US', country: 'United States' }), address: '', precision: 'missing' },
    { data: { ...photonFeature(), features: [{ ...photonFeature().features[0], geometry: { type: 'Point', coordinates: [null, null] } }] }, address: '', precision: 'locality' }
  ]) {
    const response = await reverseGeocode(query, async url => {
      if (new URL(url).hostname === 'nominatim.openstreetmap.org') throw new Error('Offline');
      return Response.json(data);
    });
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.equal(result.source, 'photon');
    assert.equal(result.address, address);
    assert.equal(result.addressParts.houseNumber, '');
    assert.equal(result.addressPrecision, precision);
    assert.equal(result.partial, true);
  }
});

test('default provider requests deduplicate inflight and cached points without changing query precision', async () => {
  const originalFetch = globalThis.fetch;
  const point = { lat: 21.10012311, lon: 105.50012311 };
  let requests = 0, release;
  const pending = new Promise(resolve => { release = resolve; });
  globalThis.fetch = async url => {
    requests++;
    if (new URL(url).hostname === 'nominatim.openstreetmap.org') throw new Error('Offline');
    await pending;
    const data = photonFeature();
    // These two requests round to one cache key, but fall on opposite sides of
    // the 25 m house limit. Cached provider data must be evaluated again.
    data.features[0].geometry.coordinates = [point.lon, point.lat - 24.9995 / (6371000 * Math.PI / 180)];
    return Response.json(data);
  };
  try {
    const first = reverseGeocode(point);
    const nearbyPoint = { lat: 21.10012312, lon: 105.50012312 };
    const second = reverseGeocode(nearbyPoint);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(requests, 2);
    release();
    const [firstResult, secondResult] = await Promise.all([first, second]);
    const firstData = await firstResult.json(), secondData = await secondResult.json();
    assert.equal(firstData.lat, point.lat);
    assert.equal(firstData.addressParts.houseNumber, '12');
    assert.equal(secondData.lat, nearbyPoint.lat);
    assert.equal(secondData.addressParts.houseNumber, '');
    const cached = await (await reverseGeocode(nearbyPoint)).json();
    assert.equal(requests, 2);
    assert.equal(cached.lon, nearbyPoint.lon);
    assert.ok(cached.featureDistanceMeters > 25);
    assert.equal(cached.addressParts.houseNumber, '');
    await reverseGeocode({ ...point, lat: point.lat + 0.00001 });
    assert.equal(requests, 3, 'another point within one second skips Nominatim and uses Photon');
  } finally { release(); globalThis.fetch = originalFetch; }
});
