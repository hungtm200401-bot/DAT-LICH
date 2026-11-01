import directory from '../public/data/vietnam-administrative-latest.json' with { type: 'json' };
import { normalizeReverseAddress, parseNominatimAddress, distanceMeters, locationSearchKey } from '../public/location-utils.js';

const providerHeaders = { 'User-Agent': 'HoanMakeupArtist/1.0', Accept: 'application/json', 'Accept-Language': 'vi' };
const providerCache = new Map();
const providerInflight = new Map();
const cacheLifetime = 5 * 60 * 1000;
let lastNominatimStart = -Infinity;

function parsePhotonAddress(data) {
  const feature = data?.features?.[0];
  if (!feature || feature.type !== 'Feature' || feature.geometry?.type !== 'Point' || !feature.properties) throw new Error('No address at this position');
  const properties = feature.properties;
  const [lon, lat] = feature.geometry.coordinates || [];
  // Keep actual address tags separate from a feature's display name. A street
  // feature can use its name, while a locality name never becomes a road.
  const isStreet = properties.type === 'street' || properties.osm_key === 'highway';
  const isHamlet = properties.osm_key === 'place' && properties.osm_value === 'hamlet';
  const isBuilding = properties.osm_key === 'building';
  // Photon district commonly names a former Vietnamese district. An
  // unprefixed district sharing a current ward's name is still not a ward.
  const explicitWard = /^(phuong|xa|dac khu)\s/.test(locationSearchKey(properties.district)) ? properties.district : '';
  const parsed = parseNominatimAddress({ lat, lon, address: {
    house_number: properties.housenumber,
    road: properties.street || (isStreet ? properties.name : ''),
    hamlet: properties.hamlet || (isHamlet ? properties.name : ''),
    neighbourhood: properties.neighbourhood || properties.neighborhood,
    residential: properties.residential, suburb: properties.suburb || explicitWard,
    building: properties.building || (isBuilding ? properties.name : ''),
    postcode: properties.postcode, state: properties.state,
    city: properties.city, village: properties.locality,
    country: properties.country, country_code: properties.countrycode
  } });
  parsed.source = 'photon';
  return parsed;
}

async function fetchProviderAddress(lat, lon, fetcher, rateLimit) {
  try {
    // Public Nominatim allows at most one request/second. Skip to the fallback
    // when this isolate has just used it, without building a slow request queue.
    const now = Date.now();
    if (rateLimit && now - lastNominatimStart < 1000) throw new Error('Address provider busy');
    if (rateLimit) lastNominatimStart = now;
    const params = new URLSearchParams({ format: 'jsonv2', lat: String(lat), lon: String(lon), zoom: '18', addressdetails: '1', 'accept-language': 'vi', layer: 'address' });
    const response = await fetcher(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: providerHeaders, signal: AbortSignal.timeout(3500)
    });
    if (!response.ok) throw new Error('Address provider unavailable');
    const data = await response.json();
    if (data.error || !data.address) throw new Error('No address at this position');
    return parseNominatimAddress(data);
  } catch {
    // The public demo rejects unsupported explicit languages (including vi).
    // Accept-Language still lets it use a supported or local-language name.
    const params = new URLSearchParams({ lat: String(lat), lon: String(lon), limit: '1' });
    const response = await fetcher(`https://photon.komoot.io/reverse?${params}`, {
      headers: providerHeaders, signal: AbortSignal.timeout(4000)
    });
    if (!response.ok) throw new Error('Address provider unavailable');
    return parsePhotonAddress(await response.json());
  }
}

async function getProviderAddress(lat, lon, fetcher) {
  // Injected providers remain isolated, including deterministic tests. Cache
  // provider data only: every response retains its original query coordinates.
  if (fetcher !== fetch) return fetchProviderAddress(lat, lon, fetcher, false);
  const key = `${lat.toFixed(6)},${lon.toFixed(6)}`;
  const cached = providerCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.parsed;
  if (cached) providerCache.delete(key);
  if (providerInflight.has(key)) return providerInflight.get(key);
  if (providerInflight.size >= 8) throw new Error('Address providers busy');
  const request = fetchProviderAddress(lat, lon, fetcher, true).then(parsed => {
    providerCache.set(key, { parsed, expiresAt: Date.now() + cacheLifetime });
    if (providerCache.size > 64) providerCache.delete(providerCache.keys().next().value);
    return parsed;
  }).finally(() => providerInflight.delete(key));
  providerInflight.set(key, request);
  return request;
}

export async function reverseGeocode(payload, fetcher = fetch) {
  const lat = Number(payload.lat), lon = Number(payload.lon);
  if (payload.lat == null || payload.lon == null || payload.lat === '' || payload.lon === '' || !Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return Response.json({ error: 'Tọa độ GPS không hợp lệ.' }, { status: 400 });
  }
  try {
    const parsed = await getProviderAddress(lat, lon, fetcher);
    const addressDistance = parsed.featureLocation ? distanceMeters({ lat, lon }, parsed.featureLocation) : null;
    const result = normalizeReverseAddress(directory, { ...parsed, featureDistanceMeters: addressDistance });
    // Preserve the measured/requested point. Provider coordinates describe the
    // nearest indexed object's centroid and are not the customer's destination.
    return Response.json({ ...result, lat, lon });
  } catch {
    return Response.json({ error: 'Chưa đọc được địa chỉ từ vị trí này. Bạn có thể chọn địa chỉ bên dưới.' }, { status: 503 });
  }
}
