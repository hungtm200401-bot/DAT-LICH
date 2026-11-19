# Verification — 2026-11-03

## Result
All six owner requirements are implemented. OpenFreeMap is the active vector map,
including when local D1 contains legacy Google provider/key settings. Google SDK
modules and preload entries were removed; external directions links remain.

## Checks actually run
- `npm.cmd test`: build passed; 139 tests, 138 passed, zero failed, one existing
  opt-in live raster-tile test skipped.
- `npm.cmd run verify:openfreemap`: passed desktop/mobile search debounce,
  keyboard selection, text escaping, precise pin/address confirmation, failed and
  empty search, cancellation after manual movement, stale-address reset, GPS and
  navigation cleanup. Legacy Google settings and unavailable maps-config cannot
  activate Google. Settings show OpenFreeMap with no key controls or Google requests.
- `node scripts/verify-vector-map.mjs`: passed real MapLibre rendering with mocked
  vector tiles, zoom/pan/click/drag/keyboard, tile-readiness gating, readonly,
  fullscreen, retry/online recovery and cleanup.
- `node scripts/verify-vector-map.mjs --network-only`: passed one fixed viewport
  against actual OpenFreeMap; no failed requests, rendered roads/land/7 labels.
- Live Photon search: both provider handler and actual `/api/address-search`
  on localhost:5173 returned HTTP 200 and four results for Nhà hát lớn Hà Nội.
  Initial sandbox network restriction caused EACCES/503; the managed dev server
  was restarted with network access. This was not handled by bypassing validation.
- `node scripts/verify-location-persistence.mjs`: passed actual HTTP
  createAppointment and customer lookup/readback against an isolated local D1.
  Verified address, ward, city, locationNote, full-precision coordinates and
  confirmation timestamp; no payment was recorded. Owner database untouched.
- `node scripts/verify-booking-goals.mjs`: passed GPS -> pin -> submitted booking,
  original device accuracy/timestamps, desktop/customer/mobile admin location
  displays and exact directions. Business writes mocked. Updated its outdated
  expectation: precise GPS already confirmed does not offer another confirmation.
- `node scripts/verify-location-map-lifecycle.mjs`: passed rerenders during zoom,
  responsive resize, page navigation, cancellation, cleanup and draft preservation.
- `node scripts/verify-admin-location-lazy.mjs`: passed 24-history-map lazy
  rendering/release, readonly without search controls, modal refresh and cleanup.
- `node scripts/verify-location-recovery.mjs`: passed legacy cache recovery,
  coarse GPS guard, region/address validation and mobile behavior.
- `node scripts/verify-overview-version.mjs`: passed synchronized build recovery.
- `git diff --check` and syntax checks for changed location/search modules passed.

## Corrections verified
Search centering is now honored by the raster fallback as well as MapLibre.
Test tile proxies are intercepted to avoid live public-raster traffic. Isolated
persistence test uses its own D1 state and dependency cache under node_modules;
a first cache location outside node_modules caused duplicate CommonJS transforms
and was corrected before the passing rerun.

## Artifacts and limitations
Desktop/mobile UI captures: outputs/openfreemap-search/location-1440.png and
location-390.png (mock raster imagery). Actual vector capture:
outputs/vector-map/real.png. Outputs and isolated D1 files are ignored by Git.

Photon public demo availability and address coverage remain external dependencies;
there is no SLA. Search requests are debounced, cached and bounded; errors retain
pin/GPS/manual entry. Customers must verify their house/address. No remote
deployment was performed; local preview remains at http://localhost:5173/.
