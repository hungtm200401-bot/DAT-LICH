# Bảo vệ dữ liệu HOÀN

Khách xem các giờ có thể đặt cho ngày và dịch vụ đã chọn. Lịch hẹn, số điện thoại, ghi chú lịch làm và sổ thu hoàn chỉ nằm ở API quản trị. Khách tra cứu đúng lịch của mình bằng mã lịch và số điện thoại, có giới hạn yêu cầu. Trang tra cứu gửi thông tin xác minh trong nội dung yêu cầu.

Quản trị dùng khóa hiện có để mở phiên 8 giờ. Đăng xuất thu hồi phiên tại máy chủ. Sau khi cập nhật, đăng nhập lại bằng khóa của bạn. Ai giữ khóa chủ đều có thể đọc dữ liệu quản trị. Nếu khóa bị lộ, đổi secret tại nơi đang chạy web để vô hiệu hóa các phiên cũ.

Trong mục Lịch hẹn, dùng **Lưu trữ** để giữ lịch và chi tiết gốc. Mở **Đã lưu trữ** để khôi phục một lịch. Hệ thống từ chối khi lịch đang chờ đối soát hoặc đã có giao dịch. Các thay đổi trên lịch, khách và cấu hình tiền có bản ghi cũ tại D1. Sổ giao dịch giữ chứng từ đã ghi.

## Sao lưu và kiểm tra trên máy

Chạy từ thư mục gốc dự án, nơi có `package.json`.

```powershell
npm.cmd run db:backup:local
node scripts/local-d1-backup.mjs verify <tên-tệp.sqlite.enc>
node scripts/local-d1-backup.mjs restore-copy <tên-tệp.sqlite.enc>
```

Bản sao D1 mã hóa AES-256-GCM nằm trong `.wrangler/recovery-backups`. Cất bản sao trên ổ hoặc nơi lưu trữ riêng do chủ web kiểm soát và giữ tệp khóa `.wrangler/recovery-key.bin` ở một nơi riêng. Hai tệp này nằm ngoài Git. Bản phục hồi kiểm tra nằm ở `.wrangler/recovery-restored`, chứa dữ liệu gốc nên cần được giữ riêng. Lệnh tạo bản phục hồi không ghi lên D1 đang dùng.

Để thử phục hồi, mở bản sao riêng bằng SQLite. Kiểm tra số lịch, số khách, ca làm và tổng các giao dịch thu/hoàn theo từng lịch, rồi đối chiếu với sổ. Khi dùng bản sao để phục hồi vận hành, đổi khóa quản trị và thu hồi các phiên còn trong bản sao. Ảnh R2 cần sao lưu riêng nếu muốn phục hồi cả ảnh đính kèm.

## Cập nhật môi trường Cloudflare

1. Xác nhận Worker đang trỏ đúng D1 và tạo điểm khôi phục trước cập nhật. Giữ thêm bản xuất được mã hóa ở nơi lưu trữ độc lập. Cloudflare có [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) và [hướng dẫn xuất D1](https://developers.cloudflare.com/d1/best-practices/import-export-data/). Thời gian lưu tùy [gói Cloudflare](https://developers.cloudflare.com/d1/platform/limits/).
2. Áp dụng các migration còn thiếu theo thứ tự, đến `0010_booking_google_recovery.sql`. Kiểm tra dữ liệu và schema của D1 trước khi chuyển sang Worker mới.
3. Dùng HTTPS và cấu hình secret chủ quản trị. Kiểm tra trang khách, tra cứu đúng lịch, đăng nhập, lưu trữ và giao dịch trên bản kiểm tra trước khi đưa người dùng vào bản mới.
4. Nếu cần phục hồi bản online, xác định thời điểm mất dữ liệu và lưu lại dữ liệu mới phát sinh. Đối chiếu với bản phục hồi riêng trước khi thay D1 đang vận hành.

Kiểm tra dự án bằng `npm.cmd test` và `npm.cmd run verify:business-data`. Bài kiểm tra thứ hai mở Worker đã build với cơ sở dữ liệu mới chỉ chứa dữ liệu kiểm thử.

## Gửi OTP để lấy lại mã lịch

Nút **Quên mã lịch hẹn?** mở ô nhập số trên cùng website. Số di động Việt Nam nhập được với đầu `0`, `+84` hoặc `0084`. Với số nước ngoài, nhập mã quốc gia cùng dấu `+` hoặc tiền tố `00`. Backend chuẩn hóa số về E.164 trước khi gửi SMS và dùng cùng cách chuẩn hóa để tra cứu lịch. [Định dạng E.164](https://www.twilio.com/docs/glossary/what-e164)

Tạo một Verify Service dành cho HOÀN. Cấp khóa cho backend có quyền gửi và kiểm tra OTP, sau đó lưu ba cấu hình dưới dạng secret của Worker, hoặc trong `.dev.vars` khi chạy local. Xem [Twilio Verify API](https://www.twilio.com/docs/verify/api).

- `TWILIO_VERIFY_SERVICE_SID` là SID của Verify Service.
- `TWILIO_API_KEY_SID` là SID của khóa API.
- `TWILIO_API_KEY_SECRET` là giá trị riêng của khóa API.

Bật SMS cho các nước phục vụ trong Verify Geo Permissions. Kiểm tra gửi thật đến số do chủ web kiểm soát trước khi đưa luồng vào vận hành. Trang đặt lịch xác minh số của khách khi đã cấu hình đủ secret. Một lần xác minh có hiệu lực trong 5 phút. Khi quản trị thay số trên lịch, hệ thống thu hồi liên kết với số cũ. Lịch chưa xác minh vẫn mở bằng mã gốc và số đã dùng khi đặt. [Verify Geo Permissions](https://www.twilio.com/docs/verify/preventing-toll-fraud/verify-geo-permissions) · [Hướng dẫn SMS Việt Nam](https://www.twilio.com/en-us/guidelines/vn/sms)

Sau khi build, chạy `npm.cmd run verify:booking-otp` để kiểm tra trên D1 riêng. Lệnh `npm.cmd run preview:booking-otp` mở bản thử trên loopback cổng `5188` và in số điện thoại cùng OTP mẫu. Bản thử dùng dữ liệu riêng và mô phỏng dịch vụ SMS bên trong môi trường kiểm tra.

## Lấy lại mã bằng Google

Trong Google Auth Platform, tạo OAuth client kiểu **Web application** và lưu Client ID vào `GOOGLE_CLIENT_ID` trong `.dev.vars`. Bản online dùng biến cùng tên của Worker. Thêm origin HTTPS thật của website vào **Authorized JavaScript origins**. Với bản local, thêm `http://localhost` và `http://localhost:5173`. Khởi động lại phiên máy chủ local sau khi cập nhật `.dev.vars`, rồi mở `http://localhost:5173` để thử tài khoản thật. [Cấu hình đăng nhập Google](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid)

Khách chọn **Lưu lịch bằng Google** sau khi đặt lịch hoặc sau khi tra cứu mã và số điện thoại. Khi cần lấy lại mã, chọn **Quên mã lịch hẹn?**, nhập email của tài khoản đã liên kết và xác minh với Google ngay trong cùng trang. Backend đối chiếu email đã xác minh và tìm lịch theo định danh tài khoản Google. Email nhập tại màn này chỉ dùng cho lần xác minh hiện tại. Tùy chọn **Xác minh bằng SMS** xuất hiện khi có cấu hình SMS. Nếu đổi số trên lịch, mở lịch bằng mã và số mới để liên kết lại.
