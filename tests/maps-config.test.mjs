import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeMapsConfig } from '../public/maps-config.js';

test('OpenFreeMap is active even with legacy Google settings and never exposes a credential', () => {
  const expected = { provider: 'openfreemap', searchProvider: 'photon' };
  for (const settings of [undefined, {}, { mapProvider: 'osm' }, { mapProvider: 'google', googleMapsBrowserKey: 'legacy-unused-key', googleMapsMapId: 'old-id', googleMapsPlaces: true, bankAccount: 'private' }]) {
    assert.deepEqual(normalizeMapsConfig(settings), expected);
  }
});
