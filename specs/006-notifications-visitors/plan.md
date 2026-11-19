# Plan: Notifications and Visitors
Date: 2026-11-03. Spec: [spec.md](spec.md).

## Summary / Technical Context
The original notification and visitor redesign used the existing JS/Vinext app and D1 APIs. Desktop/mobile reuse one renderer and the existing site-tools QR generator. The session code addition below preserves the existing consent and tracking flow.

## Constitution Check
Pass: defined user outcomes; D1 and permission checks intact; no financial work; scoped responsive design; meaningful browser failure tests plus build/core verification. No violations.

## Source Structure
- public/admin-notifications.js: render/filter/read one id with server-confirmed count update.
- public/visitor-workspace.js: list/filter/page/detail/CSV; independent lifecycle, no fake aggregates.
- public/admin-operations.css: these two screens and actual mobile badge.
- public/app.js/mobile-admin.js/site-tools.js: narrow integration hooks.
- scripts/verify-admin-operations.mjs: isolated API fixtures desktop/mobile, failures/concurrency.
- specs/006-notifications-visitors/: scope and evidence.

## Execution
US1 shared renderer -> checkboxes and real badge; US2 focused list -> filters, detail, export, collapsed link/QR; check both -> stage only scoped content on HEAD -> validate staged snapshot -> commit/push origin without force. Existing dirty files stay intact. No unrelated refactors.

## Mã phiên truy cập

Migration `0004_visit_session_codes.sql` bổ sung bảng liên kết giữa UUID của phiên và số tự tăng. Một trigger cấp số trong cùng thao tác tạo phiên. Migration điền mã cho các phiên còn lưu theo `started_at, id` và giữ nguyên mã đã cấp khi chạy lại. Khóa ngoại xóa liên kết khi phiên bị xóa. Dãy số vẫn tiếp tục tăng.

API danh sách trả thêm `session_code`. Danh sách, chi tiết và CSV đọc cùng trường này. UUID tiếp tục được dùng trong cookie, API chi tiết và liên kết sự kiện. Thay đổi chỉ dùng thông tin đang có từ thống kê.

Chạy migration trước khi dùng Worker mới. Có thể quay lại Worker trước đó và giữ bảng bổ sung để bảo toàn các mã đã cấp. Xác minh trên D1 cục bộ với dữ liệu mẫu trước khi áp dụng migration lên bản dữ liệu đang chạy trên máy.

## Tên trang và mốc thời gian

Migration `0005_visit_departure.sql` thêm trường `left_at` cho tín hiệu rời do trình duyệt gửi. Dùng thời điểm nhận tín hiệu làm giờ rời. Lưu `last_seen_at` theo thời điểm thực và bỏ mốc rời khi phiên hoạt động trở lại. API lọc và đếm phiên hoạt động theo cả mốc gần nhất và trạng thái rời.

Các phiên cũ giữ nguyên dữ liệu. Khi thiếu tín hiệu rời, chọn mốc mới nhất giữa giờ bắt đầu, sự kiện cuối và `last_seen_at`, kể cả thời điểm nhận tín hiệu hoạt động. Nếu phiên có thời gian hoạt động nhưng mốc cuối vẫn trùng giây bắt đầu, hiển thị “Chưa ghi nhận”. Danh sách và chi tiết dùng cùng cách diễn giải. Triển khai migration trước Worker mới. Nếu cần quay lại Worker trước đó, giữ cột bổ sung để bảo toàn dữ liệu đã ghi.
