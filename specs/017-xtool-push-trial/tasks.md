# Tasks: Xtool Push trial

**Input**: spec.md, plan.md, research.md, data-model.md, quickstart.md.

## Phase 1: Setup
- [x] T001 Record requirements and preserve unrelated work in specs/017-xtool-push-trial/spec.md.
- [x] T002 Research exact CLI and release checksum in specs/017-xtool-push-trial/research.md.

## Phase 2: Foundation
- [x] T003 Implement isolated verified Xtool runner/report in ios/xtool-trial.py.

## Phase 3: US1 - Real build trial (P1)
**Goal**: actual build without changing existing release.
**Independent test**: real macOS run and diagnostic bundle inspection.
- [x] T004 [US1] Add opt-in workflow .github/workflows/ios-xtool.yml and dispatch input in .github/workflows/ios.yml.
- [x] T005 [US1] Run tool checks/actionlint and real Xtool CI; record actual outcome in docs/IPA_XTOOL.md.

## Phase 4: US2 - Honest signing and Push acceptance (P1)
**Goal**: separate tool signing from working phone notifications.
**Independent test**: fail missing auth, later verify authorized signature and device receipt.
- [x] T006 [US2] Run actual Xtool --sign command and record missing-auth/error without claiming successful signing in docs/IPA_XTOOL.md.
- [ ] T007 [US2] With authorized Apple credentials, validate signed app/profile/Bundle ID/APS environment in docs/IPA_XTOOL.md.
- [ ] T008 [US2] Verify real iPhone locked/background and force-quit receipt/opening using specs/017-xtool-push-trial/quickstart.md.

## Phase 5: Report
- [x] T009 Record results, preserve existing IPA hashes and update specs/017-xtool-push-trial/tasks.md.

## Dependencies and strategy
T001/T002 -> T003 -> T004 -> T005/T006 -> T009. T007 requires Apple inputs;
T008 requires T007, backend configuration and physical-device observation.
MVP is a real diagnostic compilation; it is not final Push acceptance.
Parallel example: source research and host inventory are independent read-only
tasks. Workflow mutations, runs, verification and task updates remain sequential.

## Verification status
Run 45579801031: actual Xtool build PASS; actual --sign blocked by missing Apple
authentication; overall run correctly FAILURE because no Push-ready release exists.
T007/T008 remain uncompleted external acceptance requirements. Documentation,
checked tooling tasks and an ad-hoc IPA do not prove APNs receipt.
