# Công việc

- [x] T001 Sao lưu mã hóa và kiểm tra mở lại bản sao local.
- [x] T002 Giới hạn dữ liệu công khai, xác minh lịch và phiên quản trị.
- [x] T003 Bảo toàn lịch, lịch làm và chứng từ cùng giao diện phục hồi.
- [x] T004 Kiểm tra build, Worker và trình duyệt. Ghi cấu hình triển khai và khôi phục.
- [x] T005 Làm lại màn đăng nhập và dùng thông báo backend ở các trường của biểu mẫu nghiệp vụ.
- [x] T006 Thử biểu mẫu sai/đúng trên desktop/mobile và bảo toàn dữ liệu khi máy chủ báo lỗi.
- [x] T007 Tích hợp gửi, kiểm tra OTP và liên kết số đã xác minh với lịch.
- [x] T008 Hiển thị màn OTP và mã lịch cho khách sau khi xác minh.
- [x] T009 Kiểm tra luồng OTP với D1 riêng và chuẩn bị bản thử cục bộ.
- [x] T010 Xác minh chứng thực Google và lưu liên kết lịch trong D1.
- [x] T011 Gắn luồng liên kết và lấy lại mã trên giao diện tra cứu.
- [x] T012 Kiểm tra khác tài khoản, mã xác thực dùng lại và hai kích thước màn hình.
- [x] T013 Làm lại màn quên mã để nhập email trước và chỉ hiện lựa chọn SMS khi có dịch vụ.
- [x] T014 Gắn email với lần xác minh Google và kiểm tra email đã xác minh trước khi trả mã.
- [x] T015 Kiểm tra biểu mẫu, đổi email, xác minh đúng tài khoản và SMS tùy chọn trên desktop/mobile.

Đã áp dụng migration 0006, 0007 và 0008 trên D1 local, sau khi kiểm tra bản sao mã hóa. Localhost xác nhận API công khai, quyền quản trị và thu hồi phiên. Hướng dẫn sao lưu, phục hồi và cập nhật online nằm trong [BAO_VE_DU_LIEU.md](../../docs/BAO_VE_DU_LIEU.md).

Build và bộ kiểm thử đạt 154 ca, một ca bản đồ trực tiếp bỏ qua theo cấu hình. TypeScript đạt. Worker với D1 riêng xác nhận cảnh báo lỗi theo trường, bảo toàn giao dịch và khôi phục lịch. Edge trên máy tính và điện thoại xác nhận đăng nhập, tra cứu, lưu trữ, khôi phục và đăng xuất. Các bài kiểm tra thao tác quản trị và hành trình khách cũng đạt.

Migration 0009 đã chạy trên D1 local sau khi tạo và kiểm tra bản sao mã hóa. `verify:booking-otp` đạt trên Worker riêng và Edge máy tính, điện thoại với dịch vụ gửi thử. Luồng mở lại của lịch cũ và thông báo thiếu cấu hình SMS đạt trong `verify:business-data`. Gửi SMS thật cần secret của Verify Service.

Migration 0010 đã chạy trên D1 local sau khi kiểm tra bản sao mã hóa. `verify:booking-google` đạt trên Worker riêng và Edge máy tính, điện thoại với tài khoản mẫu. `verify:booking-otp` và `verify:business-data` vẫn đạt. Màn local đã hiện trạng thái chờ `GOOGLE_CLIENT_ID` để thử bằng tài khoản thật.

Màn lấy lại mã qua email đã chạy tại `127.0.0.1:5173`. Kiểm tra trình duyệt xác nhận lỗi do backend trả về, giữ email khi dịch vụ chưa cấu hình và chỉ hiện SMS khi đã kết nối. `verify:booking-google` xác nhận thử thách gắn với email và kết quả theo tài khoản Google đã xác minh. `npm test`, `verify:booking-otp` và `verify:business-data` đạt.
