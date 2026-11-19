# Tasks: Google Maps
## Phase 1: Configuration
- [x] T001 [US1] Add shared validation, minimal public configuration API and admin-only save validation in public/maps-config.js and app/api/.
- [x] T002 [US1] Add desktop/mobile configuration form in public/maps-settings.js and admin settings pages.
## Phase 2: Map interaction
- [x] T003 [US2] Add lazy SDK loader, Google map, draggable pin and Vietnam Places search in public/google-maps-loader.js and public/location-google-map.js.
- [x] T004 [US2] Preserve provider selection and booking callbacks in public/location-map.js; version affected assets.
- [x] T005 [US3] Preserve read-only admin behavior, errors, abort cleanup and expanded-map controls.
## Phase 3: Verification and handoff
- [x] T006 Verify configuration/interaction/lifecycle with tests/maps-config.test.mjs, scripts/verify-google-maps.mjs and scripts/verify-maps-settings.mjs.
- [x] T007 Run existing checks, record results in verification.md and provide docs/GOOGLE_MAPS.md with the real-key limitation.
Dependencies: T001 -> T002/T003 -> T004/T005 -> T006/T007. Execution uses one agent.

## Follow-up: saved key rejected by Google
- [x] T008 Diagnose live local failure without logging the browser key: Google returned Permission Denied and invoked gm_authFailure; exact Cloud configuration cause remains unreported by Google.
- [x] T009 Hide Google's oversized error graphic, distinguish retryable network errors from authorization errors requiring page reload, and expand Cloud configuration guidance.
- [x] T010 Verify updated recovery behavior and record results.
