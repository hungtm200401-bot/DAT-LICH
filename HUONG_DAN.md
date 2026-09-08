# HOÀN Makeup — website và quản trị trong một dự án

## Mở bản đang hoạt động

Website: https://hoan-makeup-booking.hungtm34511.chatgpt.site

Quản trị: https://hoan-makeup-booking.hungtm34511.chatgpt.site/#/admin

## Chạy trên máy cá nhân

Cần Node.js 22.13 trở lên. Trên Windows nên dùng WSL hoặc Git Bash vì bộ công cụ hiện có sử dụng Bash.

1. Giải nén toàn bộ thư mục.
2. Mở terminal tại thư mục có `package.json`.
3. Chạy `npm ci`.
4. Chạy `npm run db:migrate:local` một lần để khởi tạo cơ sở dữ liệu cục bộ.
5. Chạy `npm run dev` và mở địa chỉ được terminal hiển thị.
6. Thêm `/#/admin` vào địa chỉ để mở quản trị.

Website và quản trị dùng chung API và cơ sở dữ liệu; không cần chạy hai ứng dụng riêng.

## Thiết lập trước khi nhận khách

Trong Quản trị → Cài đặt:

- Nhập số điện thoại/Zalo và email thật.
- Nhập ngân hàng, số tài khoản, tên chủ tài khoản nhận cọc.
- Kiểm tra mức cọc, phí di chuyển và số ngày nhận lịch.
- Trong Dịch vụ, kiểm tra giá và thời lượng; dịch vụ giá liên hệ dẫn đến tư vấn.
- Trong Lịch làm việc, mở hoặc chặn giờ nhận khách.

Không có tài khoản ngân hàng mẫu trong thanh toán. Khi chưa thiết lập, khách được hướng dẫn gửi yêu cầu và liên hệ Hoàn.

## Đối soát và hỗ trợ

- Khách tạo yêu cầu → lịch chờ xác nhận, cọc chưa thanh toán.
- Khách chuyển khoản rồi báo đã chuyển → chờ đối soát.
- Quản trị kiểm tra giao dịch thật, ghi nhận cọc ở Tiền cọc.
- Quản trị xác nhận lịch ở Lịch hẹn. Hai trạng thái độc lập.
- Biên nhận chỉ xuất hiện khi có cọc đã nhận; dùng In / Lưu PDF của trình duyệt.
- Lời nhắn và yêu cầu đổi/hủy xuất hiện ở Yêu cầu hỗ trợ.
- Đổi ngày/giờ hoặc hủy trong Lịch hẹn, sau đó ghi kết quả xử lý trong Yêu cầu hỗ trợ.
- Hoàn cọc cần thực hiện giao dịch ngoài website và ghi rõ kết quả; website không tự chuyển tiền.

## Phạm vi kỹ thuật

- Mã giao diện khách và quản trị: `public/app.js`.
- Kiểu dáng giao diện đã duyệt: `public/couture.css`; quản trị hiện có: `public/styles.css`.
- Logo và ảnh: `public/assets/`; phông chữ: `public/fonts/`.
- API dữ liệu: `app/api/data/route.ts`; ảnh tham khảo: `app/api/uploads/route.ts`.
- Cơ sở dữ liệu: Cloudflare D1. Ảnh khách tải lên: Cloudflare R2.
- Bộ ZIP chứa mã nguồn, tài nguyên và migration; không chứa dữ liệu khách thật, mật khẩu hay thư mục node_modules.

## Giới hạn cần biết

Chưa tích hợp tự đối soát ngân hàng, VietQR động, MoMo hoặc tự gửi Zalo/email. Không hiển thị đồng hồ giữ chỗ giả. Lịch chờ xử lý được giữ cho đến khi quản trị xử lý hoặc hủy.

Các mục quản trị nâng cao từ bản cũ như phân quyền chi tiết, mã ưu đãi và gửi thông báo chưa có tích hợp vận hành đầy đủ. Bản triển khai Sites hiện chỉ dành cho chủ dự án. Nếu tự triển khai ra internet cho khách công khai, cần bổ sung đăng nhập/phân quyền API quản trị và giới hạn dữ liệu trả về trước khi mở truy cập công khai.
