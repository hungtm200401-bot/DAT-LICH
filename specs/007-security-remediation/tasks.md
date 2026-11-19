# Tasks
## Foundation
- [x] T001 Scope, spec, research, contracts and baseline evidence under specs/007-security-remediation and ignored scratch backups.
## US1
- [x] T002 Require admin key in lib/site-admin.ts; secure Vite defaults/local key; login/logout UI in public/app.js/mobile-admin.js.
- [x] T003 Enforce linked request ownership and minimize public fields in app/api/data/route.ts.
- [x] T004 Escape persisted customer fields and modal sinks in public/app.js.
## US2
- [x] T005 Calendar/time/window validation in lib/booking-validation.mjs and API.
- [x] T006 Content/dimension validation in lib/image-upload.mjs and uploads route; unit tests.
## US3
- [x] T007 Security headers, safe JSON parsing and tests.
- [x] T008 Compatible dependencies, audit/build and residuals.
## Verification
- [x] T009 Extend scripts/verify-security-audit.mjs; isolated Worker/browser, core suite, dev auth.
- [x] T010 Report before/after results, scoped review.
Dependencies: T001 first. T002–T007 share files and are sequential; read-only dependency research independent. Validate each story and combined. No unrequested deployment.

Runtime: npm.cmd test build PASS, 153/154 passed (1 configured live-map skip); security audit103/103; live local auth GET-only PASS; finance/settings/notifications-visitors fixture browser PASS. All dependency audit0High/0Critical, production-only0; 20Moderate tooling remain documented.
