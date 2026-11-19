# Implementation Plan: OpenFreeMap và tìm địa chỉ

**Branch**: main (existing worktree) | **Date**: 2026-11-03 | **Spec**: [spec.md](spec.md)

## Summary
Make OpenFreeMap the active renderer regardless of legacy Google settings. Reuse MapLibre and existing raster fallback, GPS, administrative-boundary confirmation and D1 booking storage. Add a bounded Photon search endpoint and accessible debounced search UI for editable maps. Remove the Google loader and its settings controls from the active application.

## Technical Context
- Language: existing JavaScript modules and TypeScript routes, Node >=22.13.
- Dependencies: vendored MapLibre 6.16 / Leaflet; Photon public search; no new package.
- Storage: existing D1 appointments and bookingDetails JSON; no schema changes.
- Testing: node:test, existing Playwright/Edge scripts, isolated local database persistence check.
- Target: desktop and mobile browsers; readonly admin map remains readonly.
- Performance: 450 ms typing debounce, minimum three characters, five results, 5 s upstream timeout, bounded server cache/concurrency.
- Constraints: no Google API request even with legacy key saved; queries restricted to Vietnam; search errors must preserve manual entry.

## Constitution Check
PASS before research and after design: scope follows six explicit outcomes; D1 remains authoritative; no payment changes; reuse established UI; preserve GPS quality/confirmation and coordinate precision. No unresolved material unknowns or additional permission needed.

## Project Structure
- public/location-map.js: active renderer and search composition.
- public/location-search.js: combobox, cancellation and selection.
- lib/address-search.mjs, app/api/address-search/route.ts: validated Photon proxy.
- public/booking-location.js: selected search address and confirmation lifecycle.
- public/maps-config.js, public/maps-settings.js, app/api/maps-config/route.ts: OpenFreeMap information and credential-free configuration.
- tests/address-search.test.mjs, scripts/verify-openfreemap-search.mjs: contracts/UI.
- Existing app bootstrap/service worker version markers updated together.

## Implementation Strategy
Provider transition first; then search API/UI; then existing booking persistence verification. Execute sequentially in this workspace. Independent API/unit and browser checks may run concurrently, without delegating agents.

## Complexity Tracking
No constitutional exceptions. Public Photon service has no SLA; document modest-usage limitation and preserve pin/GPS/manual fallback.
