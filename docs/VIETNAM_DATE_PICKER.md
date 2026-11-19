# Bộ chọn ngày tiếng Việt

Yêu cầu: ô ngày trong Tạo lịch hẹn mới phải hiển thị ngày/tháng/năm, không lấy tháng/ngày từ trình duyệt tiếng Anh.

Kế hoạch: dùng bộ chọn ngày chung cho các ô ngày quản trị và biểu mẫu mobile. Hiển thị dd/mm/yyyy, lịch tuần từ T2 đến CN, tháng tiếng Việt, nút Hôm nay; có thể nhập tay. Ô giờ dùng HH:mm 24 giờ. Giá trị lưu/gửi API vẫn ISO yyyy-mm-dd và HH:mm; không đổi dữ liệu hay quy tắc đặt lịch. Cần kiểm tra ngày không tồn tại, năm nhuận, giới hạn ngày, đổi tháng/năm, nhập/bàn phím, hủy lịch chọn, desktop/mobile và trình duyệt en-US.

Kết quả:

- `verify-vietnam-date.mjs` đạt với trình duyệt en-US và múi giờ Los Angeles tại thời điểm Việt Nam đã sang ngày mới. Mặc định 03/11/2026, tuần T2–CN, nhập tay và chọn lịch, bàn phím/Escape, năm nhuận, min/max, ngày/giờ sai, payload ISO và HH:mm trên desktop/mobile đều đạt. Chỉ ghi dữ liệu fixture, không ghi lịch thật.
- Browser Tổng quan/bộ lọc ngày, thanh toán/hai ô thu tiền, lịch sử và khôi phục phiên bản đều đạt. Kiểm tra ảnh lịch desktop/mobile không tràn màn hình.
- `npm.cmd test`: build thành công; 150 bài, 149 đạt, 1 live-map test được bỏ qua theo cấu hình, không có lỗi.
- Không đổi API, database hay cách lưu ngày; bộ chọn ngày native của các màn khách hàng được giữ nguyên. Ô datetime giao dịch không thuộc thay đổi này.
- Ảnh kiểm thử tại outputs/vietnam-date/desktop-calendar.png, desktop-form.png và mobile-calendar.png.

Hoàn thiện tiếp: các ô ngày/giờ bắt buộc trong sửa lịch, cập nhật trạng thái, thêm/chặn khung giờ đều chặn giá trị trống trước khi bấm lưu. Browser regression mở rộng đã đạt cho sửa lịch desktop, giữ nguyên dữ liệu khi hủy, sửa và đổi lịch mobile; xác nhận payload dd/mm/yyyy -> yyyy-mm-dd đúng ngày và giờ 24 giờ. Không gửi dữ liệu thật. `npm.cmd test` sau thay đổi vẫn build thành công, 149/150 đạt, 1 live-map test bỏ qua; browser Tổng quan và khôi phục phiên bản đều đạt. Phiên bản giao diện `vietnam-date-2`.
