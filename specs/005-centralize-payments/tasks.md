# Tasks: Một nơi xử lý thanh toán

## Setup and Foundation
- [x] T001 Specify scope, assumptions and acceptance in specs/005-centralize-payments/spec.md.
- [x] T002 Document existing ledger contracts and implementation in specs/005-centralize-payments/plan.md and contracts/ui.md.

## US1 - Canonical Workspace
- [x] T003 [US1] Replace scattered approval actions with filtered navigation in public/app.js and public/mobile-admin.js.
- [x] T004 [US1] Guard external dialog calls and preserve old links in public/finance-admin.js.

## US2 - One Recorded Payment
- [x] T005 [US2] Simplify dialog, automatically request appointment confirmation and preserve retries in public/finance-admin.js.

## US3 - Clear Responsive Interface
- [x] T006 [US3] Build attention/all/ledger views and booking-specific payment actions in public/finance-admin.js.
- [x] T007 [US3] Style responsive workspace, cards and dialog in public/finance-admin.css.

## Polish and Verification
- [x] T008 Update affected asset versions in app/page.tsx, app/layout.tsx, public/sw.js, public/app-version.json.
- [x] T009 Exercise acceptance scenarios and screenshots with scripts/verify-central-payments.mjs.
- [x] T010 Run npm.cmd test and record actual results in this file.

Dependencies: T001 -> T002 -> T003/T004 -> T005 -> T006/T007 -> T008 -> T009/T010. Independent checks may run concurrently; shared file edits run sequentially. Implement the navigation MVP first, then the form and focused workspace; validate the complete journey before handoff.

## Runtime Results
- `npm.cmd test`: PASS verified production build; 142 tests, 141 passed, 1 existing opt-in live-map test skipped; 0 failures.
- `node scripts/verify-central-payments.mjs`: PASS desktop 1440px/mobile 390px, canonical links and legacy navigation, partial/full/custom deposit, cash, partial/full refunds, duplicate rejection, uncertain retry after close/reopen, ledger/export, committed payment plus failed refresh, empty/search states, no browser errors. Mobile dialog/footer fit the viewport. Isolated fixture APIs; no real financial writes.
- `node scripts/verify-overview.mjs`: PASS including global bank-reference search, monthly ledger links and pending/refund links. Adapted old payment table selectors to the new cards and waited for support-filter navigation before assertions to avoid reading a previous render.
- `node scripts/verify-overview-version.mjs`: PASS stale-script recovery and preservation of open edit forms.
- `node --check` on affected JavaScript and scoped `git diff --check`: PASS.
- Visual review: desktop attention/all/dialog/ledger and mobile attention/all/refund dialog. Screenshots in `outputs/central-payments/` use test data, never production records.
- Existing unrelated working-tree changes preserved. No API/schema, hosting deployment, provider integration or bank movement.
- Spec quality checklist: 6/6 passed; no extension hooks configured. This records requirements quality separately from runtime evidence above.
