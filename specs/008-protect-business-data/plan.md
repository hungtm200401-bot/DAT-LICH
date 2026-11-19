# Kế hoạch

1. Sao lưu D1 bằng ảnh chụp SQLite nhất quán, mã hóa và kiểm tra mở lại. Giữ tệp khóa riêng với bản sao.
2. Thêm migration cho phiên quản trị, giới hạn yêu cầu, lưu trữ lịch và lịch sử thay đổi. Cơ sở dữ liệu bảo vệ các bản ghi nghiệp vụ khỏi xóa trực tiếp.
3. Tách dữ liệu công khai, giờ còn trống theo ngày, tra cứu lịch của khách và dữ liệu quản trị. Giữ kiểm tra trùng lịch tại lúc ghi.
4. Cập nhật trang đặt lịch, đăng nhập/đăng xuất quản trị và nút lưu trữ/khôi phục. Dùng lại giao diện desktop/mobile.
5. Chạy bộ kiểm thử, kiểm tra Worker trên D1 riêng, xác minh dữ liệu local. Hướng dẫn cập nhật và khôi phục Cloudflare.

Migration thêm cột/bảng và trigger. Phục hồi trước hết vào cơ sở dữ liệu khác rồi đối chiếu lịch, khách và sổ giao dịch. Khi cần quay lại Worker cũ, giữ bản sao lưu và đối chiếu ảnh hưởng của trigger ghi trước khi thay đổi schema.

## Xác minh qua SMS

1. Thêm bảng xác minh có thời hạn và bảng liên kết số đã xác minh với lịch. Giữ bản sao D1 trước khi áp dụng migration.
2. Dùng Twilio Verify để gửi và kiểm tra OTP. Giới hạn lần gửi, số lần nhập và phạm vi dữ liệu trả về. Chỉ ghi liên kết số đã xác minh cùng giao dịch tạo lịch.
3. Thay form liên hệ trong trang quên mã bằng luồng nhập số, OTP và kết quả. Bổ sung xác minh trước khi tạo lịch mới khi có cấu hình SMS.
4. Kiểm tra sai số, sai OTP, hết hạn, dùng lại mã và khác trình duyệt với dữ liệu mẫu. Ghi cách cấu hình bảo mật và điểm cần kiểm tra với SMS thật.

## Xác minh qua Google

1. Lưu thử thách có thời hạn và liên kết lịch trong D1. Xác minh ID token bằng khóa công khai của Google qua HTTPS.
2. Gắn liên kết một lần khi xác minh mã và số đặt lịch. Lần tra cứu sau dùng định danh tài khoản Google đã xác minh.
3. Đưa biểu mẫu email lên đầu hành trình xin lại mã. Lấy email làm gợi ý cho nút Google chính thức sau khi backend chấp nhận, gắn email với mã xác minh ngắn hạn và kiểm tra email đã xác minh từ Google trước khi tra lịch theo định danh tài khoản. Dùng bảng thử thách hiện có.
4. Kiểm tra thông báo lỗi, lựa chọn đổi email, kết quả theo tài khoản và hai kích thước màn hình trong môi trường riêng với chứng thực ký bằng khóa thử nghiệm.
