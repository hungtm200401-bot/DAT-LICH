# Bảo vệ lịch hẹn, khách hàng và thanh toán

- Khách chọn ngày và dịch vụ để xem các giờ có thể đặt. Phản hồi công khai chỉ chứa dữ liệu cần thiết cho trang khách.
- Khách xác minh lịch của mình qua mã và số điện thoại. Các thao tác xác minh có giới hạn yêu cầu. Dữ liệu xác minh đi trong nội dung HTTPS.
- Quản trị đổi khóa truy cập thành phiên giới hạn thời gian. Hệ thống kiểm quyền ở API và thu hồi phiên khi đăng xuất.
- Lịch được lưu trữ thay cho xóa. Quản trị có thể phục hồi lịch đã lưu trữ khi giờ vẫn phù hợp. Lịch đã có giao dịch giữ trong lịch sử đối soát. Các thay đổi lịch làm, thông tin khách và cấu hình tiền có bản ghi trước khi sửa.
- Sao lưu được mã hóa trên máy, có kiểm tra phục hồi vào bản sao riêng. Chạy sao lưu trước khi nâng cơ sở dữ liệu đang dùng.

Kiểm tra độc lập bằng khách công khai, quản trị, nhiều yêu cầu đồng thời, phục hồi lịch, và mở lại một bản sao lưu D1. Phân biệt môi trường local và môi trường online trong báo cáo.

## Đăng nhập và báo lỗi nhập liệu

Sau khi xác minh phần bảo vệ dữ liệu, làm lại màn đăng nhập quản trị chung cho máy tính và điện thoại. Biểu mẫu gửi cho backend, gắn lỗi tiếng Việt vào ô được backend chỉ ra và giữ thông tin đang nhập. Với lỗi chung, hiển thị thông báo tại biểu mẫu. Các thông báo tương tác tại chỗ như tải ảnh hoặc xin quyền GPS vẫn phản ánh trạng thái của thiết bị và trình duyệt.

## Quên mã lịch hẹn

Khách chọn **Quên mã lịch hẹn?** để mở biểu mẫu email. Khi đã bật dịch vụ SMS, khách có thể chọn **Xác minh bằng SMS**, nhập số đã đặt và nhập OTP. Sau khi xác minh, trang hiển thị mã, ngày và giờ của các lịch còn tra cứu được đã xác minh với số đó. Khách có thể sao chép mã ngay.

Backend nhận cách viết trong nước, đầu `+84` hoặc `0084` cho số di động Việt Nam và mã quốc gia rõ ràng cho số nước ngoài. Đường dẫn SMS xuất hiện khi nhà cung cấp đã được cấu hình.

Khi bật gửi SMS, khách xác minh số ở bước thông tin của lịch mới. Xác nhận OTP được sử dụng một lần khi ghi lịch và gắn với đúng số đã xác minh. Lịch tạo trước khi xác minh SMS vẫn tra cứu bằng mã gốc và số, hoặc mã đã lưu trên trình duyệt. Thay số trên lịch sẽ hủy liên kết xác minh cũ.

Số sai, OTP sai hoặc hết hạn, nhà cung cấp gián đoạn và nhiều lịch cùng số đều có thông báo backend và kết quả phù hợp. Kiểm tra dịch vụ gửi SMS thật cần cấu hình riêng. Kiểm tra trong dự án dùng lịch mẫu và dịch vụ gửi giả lập cô lập.

## Lấy lại mã bằng Google

Khách có thể liên kết Google sau khi đặt lịch hoặc sau khi mở lịch bằng đúng mã và số điện thoại. Khi quên mã, khách nhập email Google đã liên kết, chọn **Tiếp tục**, sau đó xác minh tài khoản ngay trong luồng này. Khách có thể sửa email hoặc quay lại trang tra cứu. Sau khi xác minh, trang hiển thị mã, ngày giờ và dịch vụ của các lịch đã liên kết với tài khoản đó.

Backend kiểm tra email, xác minh chữ ký, Client ID, mã xác thực dùng một lần và email Google đã xác minh có khớp yêu cầu. Lịch được tìm theo định danh ổn định của tài khoản Google. Một lịch thuộc tối đa một tài khoản Google. Thay số trên lịch thu hồi liên kết cũ. Lịch đã tồn tại cần được khách liên kết sau khi xác minh mã và số đặt lịch.
