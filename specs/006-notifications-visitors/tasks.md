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
- [x] T006 Commit and push the verified scoped changes to origin/main.

Dependencies: T001 -> T002 -> T003 -> T004 -> T005. Shared files sequential; independent checks may run together. Requirements checklist 6/6 satisfied; no extension hooks configured. Runtime results recorded separately after execution.

## Actual verification
- Working checkout: `npm.cmd test` production build PASS; 150 tests, 149 passed, 1 configured live-map test skipped, 0 failures.
- Staged snapshot exported from the Git index into ignored scratch/admin-operations-review: production build PASS; 127 tests, 126 passed, 1 configured live-map test skipped, 0 failures. Uses HEAD baseline plus only this task, not previous unrelated work.
- `verify-admin-operations.mjs`: PASS both working checkout (5174) and staged snapshot (5180). Individual notification checkbox/id, successful-only counter changes on desktop/mobile, reload, open-link distinction, failed save/retry, concurrent reads, unread filter; visitor summary/source/active/date filters, page reset/pagination, scoped CSV, detail error/retry/Escape, collapsed campaign link/QR, empty/error states, responsive layout. Fixtures only, no production data writes.
- Fixed visitor detail Escape handling locally to avoid invoking legacy CMS keyboard handlers outside this screen.
- `git diff --cached --check` PASS; reviewed staged diff: no payments, booking, location, date picker, CMS behavior or tracking API changes. Shared integration functions transplanted onto HEAD; all existing unrelated working edits remain unstaged.
- Remote main matched initial HEAD before commit; no force operations planned.
- Commit `bce739e` pushed successfully to `origin/main`; Git reported `39b64e8..bce739e main -> main`.

## US4 - Mã phiên truy cập

- [x] T007 Thêm số phiên tự tăng, cấp mã cho dữ liệu cũ và tích hợp vào migration local.
- [x] T008 Trả mã trong API quản trị và dùng mã khi hiển thị, tìm trong trang và xuất CSV.
- [x] T009 Kiểm tra D1 và trình duyệt với dữ liệu mẫu, sau đó chạy migration trên dữ liệu local.

`npm.cmd test`: build thành công, 154 kiểm thử đạt và một kiểm thử bản đồ trực tiếp được bỏ qua theo cấu hình. `node scripts/verify-admin-operations.mjs`: đạt trên desktop/mobile, gồm hiển thị, tìm theo mã, CSV và liên kết sự kiện. Worker đã build chạy với D1 riêng xác nhận cấp mã đồng thời, giữ mã khi tiếp tục phiên, chạy lại migration và giữ hành trình cũ. Migration local thành công, kiểm tra cho thấy 148/148 phiên đã có mã.

## US5 - Tên trang và mốc thời gian

- [x] T010 Lưu tín hiệu rời trang và lọc phiên hoạt động theo trạng thái mới.
- [x] T011 Hiển thị tên trang, giờ bắt đầu và mốc cuối ở danh sách và chi tiết.
- [x] T012 Xác minh dữ liệu phiên cũ, phiên có tín hiệu rời, tiếp tục phiên và giao diện desktop/mobile.

`npm.cmd test`: build thành công, 154 kiểm thử đạt, một kiểm thử bản đồ trực tiếp được bỏ qua theo cấu hình. `node scripts/verify-admin-operations.mjs`: đạt trên desktop/mobile, gồm tên Trang chủ, giờ bắt đầu có giây, mốc rời có tín hiệu và mốc cuối cho phiên cũ. Worker với D1 thử nghiệm xác nhận giữ dữ liệu cũ, lưu giờ rời và cập nhật lại phiên khi hoạt động tiếp. Migration đã chạy thành công trên D1 local.
