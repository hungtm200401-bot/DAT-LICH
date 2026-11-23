# Dữ liệu quản trị

- Lịch hẹn định danh bằng mã lịch và tham chiếu dịch vụ. Hồ sơ lịch bổ sung được lưu riêng theo mã lịch.
- Khách hàng có ID riêng, số điện thoại duy nhất và lịch sử đặt lịch. Thay đổi tên và ghi chú giữ nguyên quan hệ với lịch và giao dịch.
- Ca làm dùng ngày, giờ bắt đầu và giờ kết thúc, với kiểm tra khoảng thời gian trùng.
- Giao dịch thu hoặc hoàn tham chiếu mã lịch, có khóa chống ghi trùng và chi tiết thanh toán. Giá trị tổng hợp dựa trên các giao dịch đã lưu.
- Nội dung và cấu hình đọc từ cùng nguồn quản trị online. Giữ riêng dữ liệu thử và phiên đăng nhập.
