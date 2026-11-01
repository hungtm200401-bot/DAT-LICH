import { locateBoundaryCodes, readAdministrativeMapBounds } from './location-boundaries.js?v=3.0';

const running = new Set();
const cancelled = new Set();

self.onmessage = async ({ data }) => {
  const { id, type, payload } = data;
  if (type === 'cancel') {
    if (running.has(id)) cancelled.add(id);
    return;
  }
  running.add(id);
  try {
    const result = type === 'locate'
      ? await locateBoundaryCodes(payload.allowedRegions, payload.point)
      : type === 'bounds'
        ? await readAdministrativeMapBounds(payload.provinceCode, payload.wardCode)
        : null;
    if (!cancelled.has(id)) self.postMessage({ id, result });
  } catch (error) {
    if (!cancelled.has(id)) self.postMessage({ id, error: { name: error.name, message: error.message } });
  } finally {
    running.delete(id);
    cancelled.delete(id);
  }
};
