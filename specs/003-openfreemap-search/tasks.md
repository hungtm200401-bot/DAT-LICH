# Tasks: OpenFreeMap và tìm địa chỉ

## Setup
- [x] T001 Read existing map/booking code and specify scope in specs/003-openfreemap-search/spec.md.

## Foundation
- [x] T002 Make public/maps-config.js and app/api/maps-config/route.ts credential-free and independent of legacy Google configuration.

## US1 - Active OpenFreeMap
- [x] T003 [US1] Remove Google branch in public/location-map.js and replace configuration UI in public/maps-settings.js; retire inactive Google loader/assets.
- [x] T004 [US1] Verify preserved vector/raster/GPS/readonly flows with scripts/verify-vector-map.mjs and existing location checks.

## US2 - Search
- [x] T005 [US2] Implement bounded Vietnam Photon search in lib/address-search.mjs and app/api/address-search/route.ts; q 3..200, at most five results, 5 s timeout.
- [x] T006 [US2] Add accessible debounced/cancellable UI in public/location-search.js and public/location-experience.css; compose with map cleanup/update in public/location-map.js.
- [x] T007 [US2] Carry search street/house only for matching selected point in public/booking-location.js; clear on manual movement and GPS changes.
- [x] T008 [US2] Verify malformed/foreign results, bounded failures and cache in tests/address-search.test.mjs; browser interaction/stale errors in scripts/verify-openfreemap-search.mjs.

## US3 - Persistence
- [x] T009 [US3] Verify actual createAppointment/readback of address, city/ward, locationNote and precise confirmed coordinates using an isolated local test database and existing app/api/data/route.ts path.

## Polish
- [x] T010 Synchronize app/layout.tsx, app/page.tsx, public/app.js, public/client-bootstrap.js, public/sw.js and build markers; update README.md and map documentation.
- [x] T011 Run build/core/browser checks and record results/remaining limitations in specs/003-openfreemap-search/verification.md.

Dependencies: T001 -> T002/T003 -> T004; T005 -> T006 -> T007 -> T008/T009 -> T010/T011.
Independent validation commands may run concurrently; implementation uses one agent. MVP is US1; deliver all three stories in this task.
