const attribution = '© OpenStreetMap contributors · Photon';
const text = (value, max = 300) => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '';

export function normalizeSearchResults(data) {
  const results = [], seen = new Set();
  for (const feature of Array.isArray(data?.features) ? data.features.slice(0, 50) : []) {
    const properties = feature?.properties, coordinates = feature?.geometry?.coordinates;
    const [lon, lat] = Array.isArray(coordinates) ? coordinates : [];
    if (feature?.type !== 'Feature' || feature.geometry?.type !== 'Point' || text(properties?.countrycode).toLowerCase() !== 'vn' || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
    const name = text(properties.name), street = text(properties.street) || (properties.osm_key === 'highway' || properties.type === 'street' ? name : '');
    const road = street ? [text(properties.housenumber, 30), street].filter(Boolean).join(' ') : '';
    const address = text(road || (!['place', 'boundary'].includes(properties.osm_key) ? name : ''));
    const label = [...new Set([name, road, text(properties.district), text(properties.city), text(properties.state)].filter(Boolean))].join(', ').slice(0, 500);
    const signature = JSON.stringify([lat, lon, label]);
    if (!label || seen.has(signature)) continue;
    seen.add(signature);
    results.push({ id: String(results.length), label, address, point: { lat, lon, mode: 'pin', accuracy: null } });
    if (results.length === 5) break;
  }
  return results;
}

export function createAddressSearch({ fetcher = fetch, now = Date.now } = {}) {
  const cache = new Map(), inflight = new Map();
  let windowStart = 0, starts = 0;
  return async function addressSearch(request) {
    const query = (new URL(request.url).searchParams.get('q') || '').trim().replace(/\s+/g, ' ');
    const headers = { 'Cache-Control': 'no-store' };
    if (query.length < 3 || query.length > 200) return Response.json({ error: 'Nhập từ 3 đến 200 ký tự để tìm địa chỉ.' }, { status: 400, headers });
    const key = query.toLocaleLowerCase('vi');
    const cached = cache.get(key);
    if (cached?.expires > now()) return Response.json(cached.data, { headers });
    if (cached) cache.delete(key);
    try {
      let pending = inflight.get(key);
      if (!pending) {
        if (now() - windowStart >= 60000) { windowStart = now(); starts = 0; }
        if (inflight.size >= 4 || starts >= 60) throw new Error('Search busy');
        starts++;
        pending = (async () => {
          const params = new URLSearchParams({ q: query, countrycode: 'VN', limit: '5' });
          const response = await fetcher('https://photon.komoot.io/api/?' + params, {
            headers: { Accept: 'application/json', 'Accept-Language': 'vi', 'User-Agent': 'HoanMakeupArtist/1.0' },
            signal: AbortSignal.timeout(5000),
          });
          if (!response.ok) throw new Error('Search unavailable');
          const data = await response.json();
          if (!Array.isArray(data?.features)) throw new Error('Invalid search response');
          const value = { results: normalizeSearchResults(data), attribution };
          cache.set(key, { data: value, expires: now() + 300000 });
          if (cache.size > 128) cache.delete(cache.keys().next().value);
          return value;
        })().finally(() => inflight.delete(key));
        inflight.set(key, pending);
      }
      return Response.json(await pending, { headers });
    } catch {
      return Response.json({ error: 'Chưa tìm được địa chỉ. Thử lại sau hoặc chọn ghim trên bản đồ.' }, { status: 503, headers });
    }
  };
}

export const addressSearch = createAddressSearch();
