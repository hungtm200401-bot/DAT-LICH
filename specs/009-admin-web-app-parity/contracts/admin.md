# Giao diện và giao tiếp quản trị

- Menu iPhone lấy chung mục và địa chỉ từ thanh điều hướng quản trị trên web. Mỗi đường dẫn gọi cùng màn web và hiển thị trong vỏ điều hướng phù hợp màn nhỏ.
- Đọc dữ liệu từ `GET /api/data?admin=1` qua phiên quản trị. Bấm **Làm mới** hoặc quay lại ứng dụng cập nhật từ nguồn này.
- Gửi `saveCustomer` tới `POST /api/data` với phiên đã xác thực. Khi tạo khách, gửi tên, số điện thoại, email tùy chọn và ghi chú. Khi chỉnh sửa, gửi ID, tên và ghi chú. Thông báo sau khi máy chủ trả kết quả.
- Trình duyệt local có liên kết mở hệ thống online để chủ website làm việc trên cùng dữ liệu với iPhone.
