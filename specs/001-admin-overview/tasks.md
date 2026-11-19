# Tasks: Complete Admin Overview

## Phase 1: Setup
- [x] T001 Record audit findings and UI contracts in specs/001-admin-overview/.
## Phase 2: Shared model
- [x] T002 [US2] Implement Vietnam dates, cash metrics, service counts and activity in public/overview-utils.js.
- [x] T003 [US2] Verify calendar boundaries, refunds, historical balances and empty states in tests/overview.test.mjs.
## Phase 3: Actionable overview
- [x] T004 [US1] Implement responsive overview cards, queues and today list in public/admin-overview.js and public/admin-overview.css.
- [x] T005 [US1] Complete destination appointment/request filters in public/app.js and public/mobile-admin.js; accept finance month links in public/finance-admin.js.
- [x] T006 [US2] Add dated accessible cash chart and service counts to public/admin-overview.js.
## Phase 4: Follow-up actions
- [x] T007 [US3] Add real recent events, safe CSV export and guarded refresh/error feedback in public/admin-overview.js.
- [x] T008 [US3] Load/mount shared overview and version affected assets in public/app.js, app/page.tsx, app/layout.tsx and public/sw.js.
- [x] T011 [US1] Activate header search across real appointments/customers/payments in public/overview-utils.js, public/admin-overview.js and public/finance-admin.js.

## Phase 5: Validation
- [x] T009 Verify desktop/mobile interactions and no real writes in scripts/verify-overview.mjs.
- [x] T010 Run build/core checks, reconcile acceptance criteria and document evidence in specs/001-admin-overview/verification.md.

Dependencies: T001 -> T002/T003 -> T004/T005/T006 -> T007/T008 -> T009/T010.
Independent work may separate model tests and presentation; this execution uses one agent.
MVP: working queue/card destinations; complete all stories before handing off.

## Phase 6: Simplification requested by the owner
The current spec replaces the earlier dense overview; earlier tasks remain historical.
- [x] T012 [US1] Reduce the overview to three metrics and two panels in public/admin-overview.js.
- [x] T013 [US2] Limit today's list to five, show only nonzero queues, simplify mobile actions and refine public/admin-overview.css.
- [x] T014 [US3] Keep CSV in a secondary menu, preserve detail routes, refresh and search, and version affected assets.
- [x] T015 Verify the revised UI with tests/overview.test.mjs, scripts/verify-overview.mjs, production build and screenshot review.

## Phase 7: Layout alignment and old-build recovery
- [x] T016 [US1] Consolidate header/actions and align KPI/panel grids within a 1280px workspace in public/admin-overview.js and public/admin-overview.css.
- [x] T017 [US3] Load matching overview CSS before rendering and synchronize build identity in public/app.js, public/client-bootstrap.js, public/app-version.json, app/layout.tsx and public/sw.js.
- [x] T018 Verify 1920px empty-state alignment, legacy-page recovery and edit-form preservation in scripts/verify-overview.mjs and scripts/verify-overview-version.mjs; rerun build/core suite and location recovery.
