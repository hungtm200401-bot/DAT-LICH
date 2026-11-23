# Giao tiếp Web Push

- `GET /api/admin-push` trả khóa công khai và trạng thái thiết bị cho quản trị đã đăng nhập.
- `POST /api/admin-push` nhận đăng ký chuẩn hoặc yêu cầu gửi thử tới thiết bị đã đăng ký của phiên này.
- `DELETE /api/admin-push` và đăng xuất thu hồi điểm nhận thuộc mã thiết bị.
- Payload chứa loại sự kiện và mã lịch để mở trong app. Service worker dùng nội dung thông báo cố định.
