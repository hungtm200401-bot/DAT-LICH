# HOÀN Admin cho iPhone

Ứng dụng chạy trên iPhone từ iOS 16. Bản cài mở giao diện quản trị trong WKWebView và dùng bố cục theo chiều rộng màn hình. Phiên đăng nhập do backend quản lý.

App có **Lịch làm**, **Duyệt lịch**, **Duyệt cọc** và **Khách**. Bấm **Bật nhắc lịch** và cấp quyền thông báo trên iPhone. Lịch đã xác nhận và đồng bộ được nhắc trước 24 giờ theo giờ Việt Nam. Khi lịch đổi hoặc bị hủy trên web, app cập nhật nhắc ở lần đồng bộ kế tiếp.

## Build IPA

Mở `HoanAdmin.xcodeproj` bằng Xcode trên Mac hoặc chạy lệnh ở thư mục gốc của dự án.

```bash
bash ios/build-ipa.sh
```

Tệp xuất nằm tại `outputs/hoan-admin-app/ios/HOAN-Admin-iPhone.ipa`. GitHub Actions lưu tệp trong artifact **HOAN-Admin-iPhone**. Tệp đóng gói sử dụng chữ ký kiểm tra của macOS và cần ký bằng thông tin Apple phù hợp để cài trên iPhone thật.

Trên Xcode, chọn Team ở **Signing & Capabilities** và chạy thẳng trên iPhone đã kết nối để thử. Để xuất bản cài đã ký cho thiết bị đăng ký, chọn **Product → Archive**, rồi chọn **Distribute App → Debugging** trong Organizer. [Hướng dẫn của Apple](https://developer.apple.com/documentation/xcode/distributing-apps-to-your-development-devices)

## Địa chỉ máy chủ

Địa chỉ mặc định đặt trong `HoanAdmin.xcconfig`. Khi build cho một bản triển khai HTTPS khác, dùng biến `HOAN_ADMIN_ORIGIN` hoặc trường `admin_origin` của workflow.

```bash
HOAN_ADMIN_ORIGIN=https://admin.example.com bash ios/build-ipa.sh
```

App chỉ mở trang đăng nhập sau khi `/api/admin-session` và `/api/data?admin=1` đều trả HTTP 401 cho yêu cầu ẩn danh. Nếu app báo cần cập nhật máy chủ, kiểm tra bản triển khai backend đang được dùng.

## Kiểm tra trên iPhone Simulator

Chạy backend local của dự án ở `127.0.0.1:5173`, rồi chạy `bash ios/check-simulator.sh` trên Mac đã cài iOS Simulator. Script lưu ảnh và số đo cho hai khổ iPhone tại `outputs/hoan-admin-app/ios/simulator/`. Workflow GitHub dùng lịch kiểm thử để kiểm tra thêm bốn tab sau đăng nhập và yêu cầu nhắc đã đặt trong iOS.
