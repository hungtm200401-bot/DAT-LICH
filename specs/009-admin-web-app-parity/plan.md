# Kế hoạch dùng chung quản trị cho web và app

## Bối cảnh kỹ thuật

Web và WKWebView dùng ứng dụng Vinext, phiên cookie của máy chủ và Cloudflare D1. Mã giao diện nằm trong `public/app.js` và `public/mobile-admin.js`. Kiểm tra trên máy dùng một cơ sở dữ liệu Miniflare riêng.

## Kiểm tra nguyên tắc dự án

Dùng renderer và API hiện có cho các màn quản trị. Việc lưu khách hàng qua API quản trị tiếp tục dùng bảng khách và lịch sử sửa đổi hiện tại. Giữ ràng buộc khung giờ, sổ giao dịch và phiên đăng nhập. Phát hành lên Worker hiện tại với đúng D1 và secret đã cấu hình.

## Triển khai

1. Dùng danh sách menu và các màn web trong vỏ điều hướng vừa màn hình iPhone. Giữ Tổng quan và các đường dẫn thao tác nhanh.
2. Tải lại dữ liệu quản trị khi trở về ứng dụng, bấm làm mới hoặc chuyển màn với dữ liệu đã cũ. Các màn chỉnh sửa và yêu cầu đang gửi được bảo vệ.
3. Lưu thông tin khách hàng bằng API quản trị và xác minh ở phiên khác.
4. Kiểm tra bản ghi local, sao lưu và chỉ chuyển các hồ sơ được chủ website xác nhận. Đối chiếu sổ giao dịch và xung đột trước khi áp dụng.
5. Chạy bộ kiểm tra dự án và kiểm tra trên khổ điện thoại. Cập nhật Worker và xác minh lại địa chỉ thực tế.
