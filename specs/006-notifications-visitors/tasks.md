# Tasks
## Foundation
- [x] T001 Scope and contracts in specs/006-notifications-visitors/.
## US1
- [x] T002 Add shared public/admin-notifications.js and integrate desktop/mobile checkboxes and badges.
## US2
- [x] T003 Add public/visitor-workspace.js, scoped styles and site-tools integration; preserve collapsed QR tools.
## Validation
- [x] T004 Browser acceptance scripts and build/core checks.
## US3
- [x] T005 Stage scoped changes and validate staged checkout independently of prior local edits.
- [ ] T006 Commit and push the verified scoped changes to origin/main.

Dependencies: T001 -> T002 -> T003 -> T004 -> T005. Shared files sequential; independent checks may run together. Requirements checklist 6/6 satisfied; no extension hooks configured. Runtime results recorded separately after execution.

## Actual verification
- Working checkout: `npm.cmd test` production build PASS; 150 tests, 149 passed, 1 configured live-map test skipped, 0 failures.
- Staged snapshot exported from the Git index into ignored scratch/admin-operations-review: production build PASS; 127 tests, 126 passed, 1 configured live-map test skipped, 0 failures. Uses HEAD baseline plus only this task, not previous unrelated work.
- `verify-admin-operations.mjs`: PASS both working checkout (5174) and staged snapshot (5180). Individual notification checkbox/id, successful-only counter changes on desktop/mobile, reload, open-link distinction, failed save/retry, concurrent reads, unread filter; visitor summary/source/active/date filters, page reset/pagination, scoped CSV, detail error/retry/Escape, collapsed campaign link/QR, empty/error states, responsive layout. Fixtures only, no production data writes.
- Fixed visitor detail Escape handling locally to avoid invoking legacy CMS keyboard handlers outside this screen.
- `git diff --cached --check` PASS; reviewed staged diff: no payments, booking, location, date picker, CMS behavior or tracking API changes. Shared integration functions transplanted onto HEAD; all existing unrelated working edits remain unstaged.
- Remote main matched initial HEAD before commit; no force operations planned.
