# Nguồn dữ liệu và cách gửi nhắc lịch

Backend ghi giờ hẹn theo giờ Việt Nam và đã có bộ kiểm tra ngày giờ. Giờ nhắc dùng dấu thời gian tuyệt đối để giữ đúng mốc khi điện thoại đổi múi giờ.

Thông báo cục bộ được iOS giữ sau khi đã lên lịch, kể cả khi app đóng. Giới hạn số yêu cầu gần nhất và dùng cùng mã cho các lần đổi giờ. Lịch mới trên web đi vào bộ nhắc khi app nhận dữ liệu mới. [Tài liệu Apple](https://developer.apple.com/documentation/usernotifications/scheduling-a-notification-locally-from-your-app)

Nút duyệt cọc dùng sổ giao dịch hiện tại. Yêu cầu phải còn ở trạng thái thích hợp khi thực hiện câu lệnh ghi. Quy tắc đối soát thanh toán và số tiền cọc vẫn chạy tại máy chủ.
