import { mountVectorLocationMap } from './location-vector-map.js?v=2.3';

async function mountPreferredMap(container, point, confirm, options) {
  if (options.signal?.aborted || !container.isConnected) return () => { };
  container.dataset.mapProvider = 'openfreemap';
  let renderer;
  try {
    renderer = await mountVectorLocationMap(container, point, confirm, options);
  } catch (error) {
    // Older devices can still use the lightweight raster renderer. Network
    // failures retain the vector map and its retry controls instead of remounting.
    if (error?.code !== 'MAP_WEBGL_UNAVAILABLE') throw error;
    const raster = await import('./location-raster-map.js?v=2.4');
    renderer = options.readonly
      ? await raster.mountReadonlyLocationMap(container, point, options)
      : await raster.mountLocationMap(container, point, confirm, options);
  }
  return renderer;
}

export function mountLocationMap(container, point, confirm, options = {}) {
  return mountPreferredMap(container, point, confirm, options);
}

export function mountReadonlyLocationMap(container, point, options = {}) {
  return mountPreferredMap(container, point, null, { ...options, readonly: true });
}
