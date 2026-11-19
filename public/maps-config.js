// Legacy Google settings remain inert. Neither a saved provider nor an old key
// may trigger Google's SDK in the OpenFreeMap location flow.
export function normalizeMapsConfig() {
  return { provider: 'openfreemap', searchProvider: 'photon' };
}
