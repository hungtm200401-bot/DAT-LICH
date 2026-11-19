# Chữ quản trị và hai ô xác nhận khoản thu

Yêu cầu: tăng nhẹ chữ nhỏ để đọc dễ hơn trên desktop/mobile; tách Thu cọc và Thu còn lại thành hai ô để tích rõ từng khoản.

Kế hoạch: thêm stylesheet quản trị dùng chung, nâng phần mô tả/nhãn từ 9–11px lên 12–14px, tăng giãn dòng. Giữ thang chữ tiêu đề/chỉ số. Thay hành động thu tiền động trong thẻ lịch ở Thanh toán bằng hai ô riêng, điền đúng biểu mẫu Thu cọc/Thu còn lại. Không thay API/schema hay luồng đặt lịch.

Ô tích được suy ra từ giao dịch thật: đủ cọc thì ô Thu cọc hoàn tất; đủ toàn bộ thì cả hai hoàn tất. Tích ô chưa hoàn tất chỉ mở xác nhận, không tự ghi tiền. Hủy biểu mẫu không thay đổi trạng thái; nhận thiếu vẫn chưa đánh dấu đủ. Thu còn lại chỉ mở khi đã đủ cọc (cọc bằng 0 được bỏ qua). Ô đã xong không bỏ tích để sửa tiền; hoàn tiền giữ thao tác hiện có. Lịch hủy dùng luồng hoàn tiền. Số tiền và lịch sử luôn từ sổ giao dịch.

Kiểm tra: browser Tổng quan, lịch sử và thu/hoàn trên desktop/mobile; mở/hủy không ghi tiền, thu thiếu/đủ, hai ô riêng và chống ghi trùng; build và core suite theo thay đổi luồng thu. Không ghi giao dịch thật trong kiểm thử.

Kết quả thực thi:

- Browser Tổng quan, Lịch sử giao dịch (133 dòng, CSV, desktop/mobile), thu/hoàn và khôi phục phiên bản đều đạt với dữ liệu kiểm thử.
- Luồng hai ô xác nhận: chưa thu không tích; mở rồi hủy không gửi giao dịch; nhận thiếu vẫn chưa hoàn tất; đủ cọc hoàn tất ô đầu và mở ô sau; thu đủ phần còn lại hoàn tất cả hai, tải lại vẫn đúng. Lịch hủy không hiện ô thu, vẫn dùng hoàn tiền. Mất phản hồi/thử lại không tạo khoản trùng.
- `npm.cmd test`: build thành công; 147 bài, 146 đạt, 1 live-map test theo cấu hình bỏ qua, không có lỗi.
- Đã xem ảnh desktop và mobile; cỡ chữ phụ 12–14px, hai ô đặt cạnh nhau trên mobile. Biểu mẫu và trang không tràn ngang, nút ghi nhận vẫn nằm trong màn hình.
- Không thay dữ liệu nghiệp vụ, quyền admin, API hoặc database; tăng phiên bản tài nguyên để nhận giao diện mới sau khi tải lại.
