# Tasks: Native APNs

## Phase 1: Setup
- [x] T001 Hoàn tất spec, nghiên cứu và hợp đồng trong specs/012-native-apns/.

## Phase 2: Foundation
- [x] T002 Thêm migration additive và cookie installation trong drizzle/0012_admin_apns.sql và lib/native-push-installation.ts; token even hex64..512, environment development|production.

## Phase 3: US1 đăng ký / gửi thử
**Independent test**: Ẩn danh bị từ chối, quản trị đăng ký đúng môi trường, JWT và request gửi thử được xác minh.
- [x] T003 [US1] Viết kiểm tra tích hợp trong scripts/verify-admin-apns.mjs.
- [x] T004 [US1] Thêm config/JWT/APNs transport và endpoint trong lib/admin-apns.ts, app/api/admin-native-push/route.ts.
- [x] T005 [US1] Thêm coordinator, cầu nối và điều khiển iPhone trong ios/HoanAdmin/NativePushCoordinator.swift, public/mobile-admin.js.

## Phase 4: US2 lịch mới và chạm thông báo
**Independent test**: Lưu lịch sinh request APNs độc lập, cron không gửi trùng, retry có backoff, payload không có dữ liệu khách.
- [x] T006 [US2] Thêm queue và fallback từ sự kiện đã commit trong lib/admin-apns.ts; nối app/api/data/route.ts và worker/index.ts.
- [x] T007 [US2] Xử lý token / chạm notification trong ios/HoanAdmin/AppDelegate.swift và AdminViewController.swift.

## Phase 5: US3 thu hồi
**Independent test**: DELETE/logout xóa installation/jobs, response token cũ không xóa đăng ký mới.
- [x] T008 [US3] Nối logout/revoke và kiểm tra retry trong lib/site-admin.ts, app/api/admin-session/route.ts, scripts/verify-admin-apns.mjs.

## Final phase
- [x] T009 Cấu hình entitlement, version và xuất IPA đã ký trong ios/HoanAdmin.xcodeproj/project.pbxproj, ios/export-signed-ipa.sh.
- [x] T010 Ghi hướng dẫn cài đặt/triển khai trong docs/NATIVE_PUSH.md và ios/README.md.
- [x] T011 Chạy build/core suite, APNs integration, Web Push regression; ghi kết quả thật trong specs/012-native-apns/quickstart.md.
- [ ] T012 Build Xcode và xác minh iPhone thật bằng bản ký có Push; phụ thuộc macOS, tài khoản và credential do chủ app cung cấp.

## Dependencies & execution
T001 → T002 → US1 → US2 → US3 → T009–T012. Viết test trước implementation. Backend và Swift có thể được thực hiện độc lập sau hợp đồng; không có file chung khi làm song song. MVP là đăng ký/gửi thử, sau đó giao thông báo lịch mới và thu hồi. Không coi task/checklist là chứng cứ runtime.
