# Kiểm tra nguồn dữ liệu và giao diện

Bản local lưu dữ liệu riêng trong Miniflare. Trình duyệt qua địa chỉ HTTPS của app cùng đọc D1 online. Việc chạy Vite hoặc build IPA làm việc với môi trường đã chọn ở mỗi nơi.

Giao diện compact có năm tab và một số trình xử lý riêng. Các mục đang dùng màn rút gọn được chuyển sang renderer web hiện có. Dùng chung biểu mẫu giúp giữ cùng hành vi khi cập nhật các chức năng web.

Sổ tiền có ràng buộc chống ghi trùng và giữ lịch sử. Nếu cần chuyển từ local, thử trên bản sao với nguyên ràng buộc. Cấu hình, lịch và giao dịch có thể thuộc những môi trường khác nhau nên đối chiếu trước khi gộp.
