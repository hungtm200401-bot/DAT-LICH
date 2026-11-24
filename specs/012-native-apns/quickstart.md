# Kiểm tra APNs

Chạy npm test, npm run verify:native-push và node scripts/verify-admin-web-push.mjs. Dữ liệu kiểm tra nằm trong D1 cô lập, outbound APNs mô phỏng và JWT được xác minh.

Đọc docs/NATIVE_PUSH.md để cấu hình HOAN_APNS_CONFIG trên Worker, chạy migration 0012 và ký IPA có Push trên macOS. Trên iPhone đăng nhập, mở Thông báo, Bật báo lịch mới, Cho phép, Gửi thử. Khóa màn hình rồi đặt lịch từ web trên máy khác. Chạm mở đúng lịch; thử cả phiên hết hạn/cold start, tắt và đăng xuất.

## Kết quả thực thi 24/11/2026 trên Windows

- npm.cmd test: build thành công; 157 bài, 156 đạt, 1 bỏ qua (live map tile), 0 lỗi.
- node scripts/verify-admin-apns.mjs: đạt. Xác minh JWT/chủ đề/môi trường/nội dung không có dữ liệu khách, auth, nhiều iPhone, hồi phục cron, 429/5xx, hết số lần retry, hủy lịch, đổi token, response 410 đến muộn và logout thiếu installation cookie.
- node scripts/verify-admin-web-push.mjs: đạt; Web Push mã hóa, retry, nhắc và logout giữ hoạt động.
- tsc --noEmit, node --check app/mobile JS, bash -n các script xuất IPA, git diff --check: đạt.
- Migration 0012 trên D1 local: thành công. HTTP local sau đăng nhập: native API trả available=false,enabled=false khi chưa có cấu hình, logout phiên kiểm tra trả 200.
- Chưa build Xcode/Simulator trên macOS; chưa xuất IPA đã ký hoặc xác minh banner trên iPhone thật; chưa deploy Worker/APNs secrets lên production. Những bước này cần macOS và tài khoản/cấu hình Apple có Push.

HTTP 200 APNs chỉ chứng minh Apple nhận yêu cầu, không chứng minh iPhone hiện banner. Không tạo thêm lịch production trong kiểm thử tự động.
