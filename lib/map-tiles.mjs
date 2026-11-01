const PROVIDER = 'https://tile.openstreetmap.org';
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const FORWARDED_HEADERS = ['cache-control', 'expires', 'etag', 'last-modified', 'date', 'vary'];
const DEFAULT_FRESHNESS_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_TILE_BYTES = 512 * 1024;

function coordinates(url) {
  if ([...url.searchParams.keys()].some(key => !['z', 'x', 'y'].includes(key))) return null;
  const values = ['z', 'x', 'y'].map(key => {
    const all = url.searchParams.getAll(key);
    return all.length === 1 && /^(0|[1-9]\d{0,6})$/.test(all[0]) ? Number(all[0]) : NaN;
  });
  const [z, x, y] = values;
  return values.every(Number.isSafeInteger) && z >= 0 && z <= 19 && x >= 0 && y >= 0 && x < 2 ** z && y < 2 ** z ? values.join('/') : null;
}

function cachePolicy(headers, now) {
  const directives = new Map((headers.get('cache-control') || '').toLowerCase().split(',').map(part => {
    const [name, value] = part.trim().split('=');
    return [name, value?.replace(/^"|"$/g, '')];
  }));
  // Unknown Vary fields could depend on a caller's Referer. Do not reuse them.
  const varies = (headers.get('vary') || '').toLowerCase().split(',').map(value => value.trim()).filter(Boolean);
  const cacheable = !directives.has('no-store') && !directives.has('private') && varies.every(value => ['accept', 'accept-encoding'].includes(value));
  const upstreamDate = Date.parse(headers.get('date') || '');
  const ageHeader = Number(headers.get('age') || 0);
  const initialAge = Math.max(Number.isFinite(ageHeader) && ageHeader >= 0 ? ageHeader * 1000 : 0, Number.isFinite(upstreamDate) ? Math.max(0, now - upstreamDate) : 0);
  const maxAge = directives.get('s-maxage') ?? directives.get('max-age');
  const expires = Date.parse(headers.get('expires') || '');
  let lifetime = DEFAULT_FRESHNESS_MS;
  if (maxAge !== undefined) lifetime = /^\d+$/.test(maxAge) ? Number(maxAge) * 1000 : 0;
  else if (headers.has('expires')) lifetime = Number.isFinite(expires) ? Math.max(0, expires - (Number.isFinite(upstreamDate) ? upstreamDate : now)) : 0;
  if (directives.has('no-cache')) lifetime = 0;
  return { cacheable, initialAge, freshUntil: now + Math.max(0, lifetime - initialAge) };
}

function responseHeaders(source) {
  const headers = new Headers({ 'Content-Type': 'image/png', 'X-Content-Type-Options': 'nosniff' });
  for (const key of FORWARDED_HEADERS) if (source.has(key)) headers.set(key, source.get(key));
  // The OSM policy requires seven days of caching when no freshness is supplied.
  if (!headers.has('cache-control') && !headers.has('expires')) headers.set('Cache-Control', 'public, max-age=604800');
  return headers;
}

function tileResponse(entry, request, now) {
  const headers = new Headers(entry.headers);
  headers.set('Age', String(Math.floor((entry.initialAge + Math.max(0, now - entry.storedAt)) / 1000)));
  const clientTag = request.headers.get('if-none-match');
  const tag = headers.get('etag');
  const sameTag = clientTag && (clientTag.trim() === '*' || (tag && clientTag.split(',').some(value => value.trim().replace(/^W\//, '') === tag.replace(/^W\//, ''))));
  const modifiedSince = Date.parse(request.headers.get('if-modified-since') || '');
  const lastModified = Date.parse(headers.get('last-modified') || '');
  if (sameTag || (!clientTag && Number.isFinite(modifiedSince) && Number.isFinite(lastModified) && lastModified <= modifiedSince)) return new Response(null, { status: 304, headers });
  return new Response(entry.bytes.slice(), { headers });
}

async function readPng(response, controller) {
  if (!/^image\/png(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) throw new Error('Invalid tile content type');
  const length = Number(response.headers.get('content-length') || 0);
  if (length > MAX_TILE_BYTES) throw new Error('Tile too large');
  if (!response.body) throw new Error('Empty tile');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_TILE_BYTES) throw new Error('Tile too large');
      chunks.push(value);
    }
  } catch (error) {
    controller.abort();
    void reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  if (!PNG_SIGNATURE.every((byte, index) => bytes[index] === byte)) throw new Error('Invalid PNG signature');
  return bytes;
}

/** Fixed-provider, on-demand tile relay. Each isolate has a bounded LRU cache. */
export function createMapTileProxy({ fetcher = fetch, now = Date.now, timeoutMs = 6500, maxEntries = 128, maxCacheBytes = 16 * 1024 * 1024, maxInflight = 32 } = {}) {
  const cache = new Map();
  const inflight = new Map();
  let cacheBytes = 0;
  function remove(key) {
    const entry = cache.get(key);
    if (entry) cacheBytes -= entry.bytes.byteLength;
    cache.delete(key);
  }
  function remember(key, entry) {
    remove(key);
    if (!entry.cacheable || maxEntries < 1 || entry.bytes.byteLength > maxCacheBytes) return;
    cache.set(key, entry);
    cacheBytes += entry.bytes.byteLength;
    while (cache.size > maxEntries || cacheBytes > maxCacheBytes) remove(cache.keys().next().value);
  }
  async function load(request, path, cached) {
    const origin = new URL(request.url).origin;
    const headers = new Headers({ Accept: 'image/png', 'User-Agent': `HoanMakeupArtist/1.0 (+${origin})`, Referer: request.headers.get('referer') || `${origin}/` });
    if (cached?.headers.has('etag')) headers.set('If-None-Match', cached.headers.get('etag'));
    if (cached?.headers.has('last-modified')) headers.set('If-Modified-Since', cached.headers.get('last-modified'));
    const controller = new AbortController();
    let timer;
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => { controller.abort(); reject(new Error('Tile deadline exceeded')); }, Math.min(7000, Math.max(1, timeoutMs)));
    });
    try {
      return await Promise.race([(async () => {
        const upstream = await fetcher(`${PROVIDER}/${path}.png`, { headers, signal: controller.signal, redirect: 'error' });
        let bytes, copied;
        if (upstream.status === 304 && cached) {
          bytes = cached.bytes;
          copied = new Headers(cached.headers);
          for (const key of [...FORWARDED_HEADERS, 'age']) if (upstream.headers.has(key)) copied.set(key, upstream.headers.get(key));
          // A successful validation resets its age unless the server supplies one.
          if (!upstream.headers.has('date')) copied.set('Date', new Date(now()).toUTCString());
          if (!upstream.headers.has('age')) copied.delete('age');
        } else {
          if (upstream.status !== 200) throw new Error('Tile provider unavailable');
          bytes = await readPng(upstream, controller);
          copied = new Headers(upstream.headers);
        }
        const storedAt = now();
        return { bytes, headers: responseHeaders(copied), storedAt, ...cachePolicy(copied, storedAt) };
      })(), deadline]);
    } catch (error) {
      controller.abort();
      throw error;
    } finally { clearTimeout(timer); }
  }
  return async function mapTile(request) {
    const url = new URL(request.url);
    const path = coordinates(url);
    if (!path) return Response.json({ error: 'Invalid map tile coordinates.' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    const key = `${url.origin}/${path}`;
    // A response may vary by Referer or be private; do not share that in-flight
    // response across different Referers before its cache policy is known.
    const flightKey = `${key}\n${request.headers.get('referer') || `${url.origin}/`}`;
    const cached = cache.get(key);
    const forceValidation = /(?:^|,)\s*(?:no-cache|max-age\s*=\s*0)\b/i.test(request.headers.get('cache-control') || '') || /no-cache/i.test(request.headers.get('pragma') || '');
    if (cached && cached.freshUntil > now() && !forceValidation) {
      cache.delete(key); cache.set(key, cached);
      return tileResponse(cached, request, now());
    }
    let pending = inflight.get(flightKey);
    if (!pending) {
      if (inflight.size >= maxInflight) return Response.json({ error: 'Map tiles are busy. Please retry.' }, { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '2' } });
      pending = load(request, path, cached).then(entry => { remember(key, entry); return entry; }).finally(() => inflight.delete(flightKey));
      inflight.set(flightKey, pending);
    }
    try { return tileResponse(await pending, request, now()); }
    catch { return Response.json({ error: 'Map tiles are temporarily unavailable.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } }); }
  };
}

export const mapTile = createMapTileProxy();
