# Data model
Không thêm/sửa bảng D1 hoặc migration. Lịch/khách/nội dung/giao dịch/R2 hiện có vẫn thuộc online backend.

- Data source descriptor: `mode` = online|local, `origin` = upstream HTTPS cố định trong mode online hoặc null; version 1. Tạo khi server khởi động, không tự thay đổi.
- Cookie aliases: whitelist upstream names ánh xạ `hoan_shared_admin`, `hoan_shared_push`, `hoan_shared_native_push`, `hoan_shared_visit`; chỉ alias hợp lệ được forward. Phiên local cũ không có mapping.
- Sessions: đăng nhập -> upstream Set-Cookie -> local alias -> upstream Cookie -> xác thực; logout -> upstream revoke + expired alias -> 401. Cookie không vào JSON/JS/log.
- Existing local records: giữ nguyên, không tự nhập, không hàng đợi offline. Sao lưu mã hóa trước khi đổi chế độ.
