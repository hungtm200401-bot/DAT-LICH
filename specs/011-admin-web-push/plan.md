# Kế hoạch báo lịch mới

## Tóm tắt

Dùng Worker online, D1 và Web Push trên HOÀN cài lên Màn hình chính. Bản cài dùng giao diện bốn tab của app hiện tại.

## Bối cảnh kỹ thuật

Worker bắt đầu gửi sau khi giao dịch tạo lịch đã lưu sự kiện. Công việc định kỳ dùng sự kiện đã lưu để phục hồi lượt gửi gián đoạn và tìm lịch xác nhận đến mốc nhắc.

## Nguyên tắc

Đăng ký bằng phiên quản trị hợp lệ. Thiết bị có mã thu hồi riêng. Giữ khóa đẩy tại Worker. Khóa, số điện thoại, địa chỉ và số tiền nằm trong ứng dụng sau đăng nhập. Nguồn lịch, người dùng và giao dịch tiếp tục ở D1.

## Cấu trúc

- `lib/admin-web-push.ts` mã hóa, giới hạn đích, gửi, lập lại và nhắc lịch.
- `app/api/admin-push/route.ts` điều khiển đăng ký và gửi thử.
- `public/admin-web-push.js` và `public/sw.js` bật, nhận và mở thông báo.
- `worker/index.ts` và `wrangler.jsonc` chạy công việc định kỳ.
