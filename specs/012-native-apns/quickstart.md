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

## Build và Simulator ngày 25/11/2026

[GitHub Actions 45528636692](https://github.com/hungtm200401-bot/DAT-LICH/actions/runs/45528636692) đạt cả ba job với mã ứng dụng tại commit `e6e14a0ba99e33048157f8566ab54b4bbc0c21e5`:

- Xcode Release tạo IPA 1.3 build 4, ARM64, iOS tối thiểu 16.0; chữ ký ad-hoc để ký lại/cài thử.
- iPhone SE (3rd generation) và iPhone 16 Pro Max, Simulator iOS 18.5: đăng nhập được; bốn tab công việc đúng; khung web đầy màn hình, không tràn ngang, thanh trên/dưới tôn trọng safe area; có đúng một nhắc lịch local đã lên lịch đúng thời điểm fixture.
- Đã xem ảnh chụp của cả hai Simulator. Thông báo thiếu cấu hình APNs trên máy chủ kiểm thử là trạng thái dự kiến. Nhắc local ở đây chỉ xác minh yêu cầu đang chờ, chưa xác minh banner trên iPhone thật.
- Simulator iOS 18.5 cần đường dẫn thư viện theo [WebKit 293831](https://bugs.webkit.org/show_bug.cgi?id=293831#c2); chỉ áp dụng lúc chạy Simulator, không đổi deployment target của IPA.

IPA thực đã kiểm tra ZIP, Info.plist, executable Mach-O ARM64, phiên bản/build và commit. SHA-256: `09169784d9f67d80b1027796a00fc2fc581bfac7c0d7e9e63a7ad6ddfe49c045`. File và manifest ở `IPA/`; biên bản CI/ảnh/JSON riêng của máy ở `outputs/ci/ios-build-run.json` và `outputs/verification/ios-simulator/final/`.

Chưa xuất bản ký Apple có quyền Push, chưa xác minh nhận APNs trên iPhone thật, chưa triển khai Worker và APNs secrets lên production. Apple ID miễn phí qua Sideloadly chỉ phục vụ cài thử trong điều kiện hiện tại.
