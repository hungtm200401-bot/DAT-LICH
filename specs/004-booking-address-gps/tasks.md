# Tasks: GPS and manual booking address
## Setup
- [x] T001 Audit booking/admin dependencies and record final scope in specs/004-booking-address-gps/spec.md.
## US1 - Interface
- [x] T002 [US1] Remove map imports/markup/lifecycle from public/booking-location.js; keep current picker fields and scope button layout in public/location-experience.css.
- [x] T003 [US1] Remove unused booking search UI in public/location-map.js/public/location-search.js and update public/maps-settings.js; retain admin renderers and compatibility APIs.
## US2 - GPS
- [x] T004 [US2] Preserve manual fields, cancel stale responses, bound loading and handle precise/coarse/error cases in public/booking-location.js and public/device-location.js.
## US3 - Confirmed address
- [x] T005 [US3] Bind coordinates to unchanged address in public/location-utils.js, public/booking-location.js and public/app.js; preserve draft address while resetting trust on reload.
- [x] T006 [US3] Verify manual/precise/edited/mismatched persistence and unchanged totals using tests/location.test.mjs and scripts/verify-location-persistence.mjs.
## Validation
- [x] T007 Test desktop/tablet/mobile, GPS states, manual flow, navigation, console and zero map requests in scripts/verify-booking-address.mjs.
- [x] T008 Synchronize build/cache references in app/layout.tsx, app/page.tsx, public/app.js, public/sw.js, public/client-bootstrap.js and build/dev-service-worker.ts.
- [x] T009 Run full core/build suite and retained admin map checks; update README.md/docs and specs/004-booking-address-gps/verification.md with actual results and file list.

Dependencies: T001 -> T002/T003 -> T004/T005 -> T006/T007 -> T008/T009. One agent, sequential edits; independent validation can run concurrently.

## Nâng cấp định vị hiện tại

- [x] T010 Tách danh mục tên cũ khỏi bước mở nút định vị, giữ tương thích nháp.
- [x] T011 Rút thời gian lấy mẫu và kiểm tra địa giới. Kiểm tra khoảng cách, vùng và độ chính xác trước khi gợi ý địa chỉ.
- [x] T012 Làm lại trạng thái định vị, thông tin sai số, hành động dừng và nhập tay.
- [x] T013 Kiểm tra trình duyệt, đồng hồ giả lập và D1 riêng, cập nhật báo cáo.
