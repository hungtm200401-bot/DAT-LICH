# Giao diện Cài đặt

Phạm vi: làm lại riêng trang `/admin/settings` trên máy tính và điện thoại.

Kế hoạch: nhóm các trường theo tác vụ; dùng chung biểu mẫu desktop/mobile; giữ
API lưu cài đặt, thông tin liên hệ và tải QR hiện có; kiểm tra responsive và lưu lại.

- Điều hướng nhanh tới Đặt lịch & chi phí, Tài khoản nhận tiền, Liên hệ và Địa chỉ.
- Thẻ nội dung có tiêu đề, mô tả ngắn, nhãn trường và đơn vị rõ ràng; QR có khung riêng.
- Nút lưu thiết lập và lưu liên hệ nằm tại đúng nhóm; không gộp hai loại dữ liệu.
- Điện thoại dùng cùng biểu mẫu và luồng lưu hiện có của desktop, gồm email,
  mã VietQR và tải QR. Không điền thông tin ngân hàng/hotline giả.
- Hướng dẫn địa chỉ nằm trong khối thu gọn; giữ module hướng dẫn sẵn có nếu có.
- CSS giới hạn trong workspace Cài đặt; không thêm thư viện hoặc thay API/database.
- Đổi mã build và phiên bản tài nguyên để trình duyệt nhận giao diện mới.

Kiểm tra thực tế:

- `npm.cmd test`: build đạt; 150 tests, 149 đạt, 1 live-map test được cấu hình bỏ qua, 0 lỗi.
- `node scripts/verify-admin-settings.mjs`: đạt ở 1440, 1024, 768, 390 và 320 px.
  Kiểm tra nhảy mục, không tràn ngang, trạng thái tài khoản, QR trống/có ảnh/tải lên,
  lưu và tải lại settings/brand, giữ số 0 đầu tài khoản, lỗi lưu và thử lại.
  Tất cả dữ liệu ghi trong browser test đều dùng API fixture.
- Ảnh kiểm tra nằm trong thư mục ignored `outputs/admin-settings/`.
- Bản index được xuất riêng tại ignored `scratch/settings-redesign-review/`, chỉ
  gồm HEAD cộng thay đổi của trang Cài đặt. `npm.cmd test` trên bản này đạt:
  build thành công, 127 tests, 126 đạt, 1 live-map test bỏ qua, 0 lỗi.
  Browser script trên cổng 5180 cũng đạt cả 5 cỡ màn hình và các ca lưu dữ liệu/QR.
- `git diff --cached --check` đạt; chỉ stage trang Cài đặt, tài nguyên tích hợp,
  tài liệu và script kiểm tra tương ứng; giữ các thay đổi cũ khác ngoài commit.
