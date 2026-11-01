export function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x, y] = ring[i], [previousX, previousY] = ring[j];
    if ((y > lat) !== (previousY > lat) && lon < (previousX - x) * (lat - y) / (previousY - y) + x) inside = !inside;
  }
  return inside;
}

export function pointInGeometry(lon, lat, geometry) {
  const inPolygon = rings => pointInRing(lon, lat, rings[0]) && !rings.slice(1).some(ring => pointInRing(lon, lat, ring));
  if (geometry.type === 'Polygon') return inPolygon(geometry.coordinates);
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.some(inPolygon);
  return false;
}

export function distanceToBoundary(lon, lat, geometry) {
  const xScale = Math.cos(lat * Math.PI / 180) * 111320, yScale = 111320;
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  let nearest = Infinity;
  for (const rings of polygons) for (const ring of rings) for (let i = 1; i < ring.length; i++) {
    const a = [(ring[i - 1][0] - lon) * xScale, (ring[i - 1][1] - lat) * yScale];
    const b = [(ring[i][0] - lon) * xScale, (ring[i][1] - lat) * yScale];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, -(a[0] * dx + a[1] * dy) / (dx * dx + dy * dy || 1)));
    nearest = Math.min(nearest, Math.hypot(a[0] + t * dx, a[1] + t * dy));
  }
  return nearest;
}

export function findBoundaryFeature(features, lon, lat) {
  return features.find(feature => {
    const [west, south, east, north] = feature.bbox;
    return lon >= west && lon <= east && lat >= south && lat <= north && pointInGeometry(lon, lat, feature.geometry);
  }) || null;
}

const files = new Map();
const retainedProvinceFiles = 3;

function pruneBoundaryFiles() {
  let retained = [...files].filter(([name, entry]) => name !== 'index.json' && entry.settled).length;
  for (const [name, entry] of files) {
    if (retained <= retainedProvinceFiles) break;
    if (name !== 'index.json' && entry.settled) {
      files.delete(name);
      retained--;
    }
  }
}

async function readBoundary(name) {
  const cached = files.get(name);
  if (cached) {
    files.delete(name);
    files.set(name, cached);
    return cached.promise;
  }
  const entry = { settled: false, promise: null };
  entry.promise = (async () => {
    const response = await fetch('/data/administrative-boundaries/' + name, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Boundary directory unavailable');
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes[0] !== 31 || bytes[1] !== 139) return JSON.parse(new TextDecoder().decode(bytes));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).json();
  })().then(data => {
    entry.settled = true;
    pruneBoundaryFiles();
    return data;
  }).catch(error => {
    if (files.get(name) === entry) files.delete(name);
    throw error;
  });
  files.set(name, entry);
  return entry.promise;
}

// Only numeric codes cross the worker boundary; names always come from the
// validated directory belonging to the active booking form.
export async function locateBoundaryCodes(allowedRegions, { lat, lon, accuracy, mode }) {
  const index = await readBoundary('index.json');
  const candidates = index.provinces.filter(({ bbox: [west, south, east, north] }) => lon >= west && lon <= east && lat >= south && lat <= north);
  for (const candidate of candidates) {
    const allowedWards = allowedRegions[candidate.code];
    if (!allowedWards) continue;
    const data = await readBoundary(`wards-${String(candidate.code).padStart(2, '0')}.json.gz`);
    const feature = findBoundaryFeature(data.features, lon, lat);
    if (!feature) continue;
    if (!allowedWards.includes(feature.properties.code)) continue;
    const edgeDistance = distanceToBoundary(lon, lat, feature.geometry);
    const reliable = mode === 'pin' || (Number.isFinite(accuracy) && accuracy > 0 && accuracy <= 150 && edgeDistance > accuracy + 3);
    return { provinceCode: candidate.code, wardCode: feature.properties.code, reliable, edgeDistance, source: 'administrative-boundaries' };
  }
  return null;
}

// A region view only frames the map; it must never become a customer's point.
export async function readAdministrativeMapBounds(provinceCode, wardCode) {
  const index = await readBoundary('index.json');
  const province = index.provinces.find(item => item.code === Number(provinceCode));
  if (!province) return null;
  let bbox = province.bbox;
  if (wardCode) {
    const data = await readBoundary(`wards-${String(province.code).padStart(2, '0')}.json.gz`);
    const ward = data.features.find(item => item.properties.code === Number(wardCode));
    if (ward) bbox = ward.bbox;
  }
  return [[bbox[1], bbox[0]], [bbox[3], bbox[2]]];
}

let boundaryWorker;
let workerUnavailable = false;
let nextJobId = 0;
const jobs = new Map();
const abortError = () => new DOMException('Cancelled', 'AbortError');

function releaseJob(id) {
  const job = jobs.get(id);
  if (!job) return null;
  jobs.delete(id);
  job.signal?.removeEventListener('abort', job.abort);
  clearTimeout(job.timer);
  return job;
}

function disableWorker() {
  workerUnavailable = true;
  boundaryWorker?.terminate();
  boundaryWorker = null;
  for (const id of [...jobs.keys()]) {
    const job = releaseJob(id);
    const error = new Error('Boundary worker unavailable');
    error.workerUnavailable = true;
    job.reject(error);
  }
}

function sharedBoundaryWorker() {
  if (workerUnavailable || typeof Worker !== 'function') return null;
  if (boundaryWorker) return boundaryWorker;
  try {
    boundaryWorker = new Worker(new URL('./location-boundary-worker.js?v=1.0', import.meta.url), { type: 'module', name: 'hoan-address-boundaries' });
    boundaryWorker.onmessage = ({ data }) => {
      const job = releaseJob(data.id);
      if (!job) return;
      if (data.error) {
        const error = new Error(data.error.message || 'Boundary lookup failed');
        error.name = data.error.name || 'Error';
        job.reject(error);
      } else job.resolve(data.result);
    };
    boundaryWorker.onerror = event => {
      event.preventDefault();
      disableWorker();
    };
    boundaryWorker.onmessageerror = disableWorker;
    return boundaryWorker;
  } catch {
    workerUnavailable = true;
    return null;
  }
}

function withCancellation(operation, signal) {
  if (signal?.aborted) return Promise.reject(abortError());
  if (!signal) return operation();
  return new Promise((resolve, reject) => {
    const abort = () => reject(abortError());
    signal.addEventListener('abort', abort, { once: true });
    operation().then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}

async function boundaryTask(type, payload, fallback, signal) {
  if (signal?.aborted) throw abortError();
  const worker = sharedBoundaryWorker();
  if (!worker) return withCancellation(fallback, signal);
  try {
    return await new Promise((resolve, reject) => {
      const id = ++nextJobId;
      const abort = () => {
        const job = releaseJob(id);
        worker.postMessage({ type: 'cancel', id });
        job?.reject(abortError());
      };
      // Fetches are already bounded to 15 seconds; this also handles a worker
      // that cannot start (for example under a restrictive browser policy).
      const timer = setTimeout(disableWorker, 45000);
      jobs.set(id, { resolve, reject, signal, abort, timer });
      signal?.addEventListener('abort', abort, { once: true });
      try { worker.postMessage({ id, type, payload }); }
      catch (error) { releaseJob(id); reject(error); }
    });
  } catch (error) {
    if (error.workerUnavailable) return withCancellation(fallback, signal);
    throw error;
  }
}

export async function locateAdministrativeArea(directory, point, { signal } = {}) {
  const allowedRegions = Object.fromEntries(directory.map(province => [province.code, province.wards.map(ward => ward.code)]));
  const found = await boundaryTask('locate', { allowedRegions, point }, () => locateBoundaryCodes(allowedRegions, point), signal);
  if (!found) return null;
  const province = directory.find(province => province.code === found.provinceCode);
  const ward = province?.wards.find(ward => ward.code === found.wardCode);
  return ward ? { city: province.name, ward: ward.name, ...found } : null;
}

export function administrativeMapBounds(provinceCode, wardCode, { signal } = {}) {
  return boundaryTask('bounds', { provinceCode, wardCode }, () => readAdministrativeMapBounds(provinceCode, wardCode), signal);
}
