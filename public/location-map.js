import { mountVectorLocationMap } from './location-vector-map.js?v=2.2';

async function mountPreferredMap(container, point, confirm, options) {
  try {
    return await mountVectorLocationMap(container, point, confirm, options);
  } catch (error) {
    // Older devices can still use the lightweight raster renderer. Network
    // failures retain the vector map and its retry controls instead of remounting.
    if (error?.code !== 'MAP_WEBGL_UNAVAILABLE') throw error;
    const raster = await import('./location-raster-map.js?v=2.2');
    return options.readonly
      ? raster.mountReadonlyLocationMap(container, point, options)
      : raster.mountLocationMap(container, point, confirm, options);
  }
}

export function mountLocationMap(container, point, confirm, options = {}) {
  return mountPreferredMap(container, point, confirm, options);
}

export function mountReadonlyLocationMap(container, point, options = {}) {
  return mountPreferredMap(container, point, null, { ...options, readonly: true });
}
