# Triển khai app tác nghiệp và nhắc lịch

Web dùng Vinext và D1. App iPhone giữ vỏ WKWebView và giao diện lối tắt. Bản dựng iPhone dùng UserNotifications để đặt lại lịch nhắc khi nhận ảnh chụp dữ liệu quản trị. Lịch đã đồng bộ nhắc được khi app đóng.

## Nguyên tắc

Dùng phiên và sổ giao dịch của web. Bổ sung điều kiện cập nhật và ghi giao dịch cho nút duyệt trên app. Dữ liệu lịch thật không đưa vào thông báo khóa máy. Giữ chế độ web cho CMS, thu chi chi tiết và cấu hình.

## Công việc

1. Tính lịch nhắc hợp lệ trong ảnh chụp dữ liệu quản trị.
2. Tạo bốn màn tác nghiệp trong giao diện app và dùng lại yêu cầu API.
3. Đăng ký lớp thông báo riêng cho origin đã cấu hình trong WKWebView.
4. Kiểm tra Worker, luồng duyệt trên khổ iPhone và lên lịch thật trong Simulator.
