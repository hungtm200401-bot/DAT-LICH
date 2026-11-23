# iPhone rút gọn và nhắc lịch làm

**Nhánh** `codex/hoan-ios`

**Ngày** 23/11/2026

## Tình huống sử dụng

### US1. Xem lịch làm và nhận nhắc trước 24 giờ

Quản trị xem lịch đã xác nhận trên iPhone. Sau khi cấp quyền thông báo và đồng bộ lịch, iPhone nhắc trước giờ hẹn 24 giờ theo giờ Việt Nam. Thông báo chỉ hiển thị thời gian. Lịch sắp tới và nhắc đã tới hạn xem được trong app.

**Nghiệm thu** Kiểm tra lịch qua nửa đêm, lịch hủy hoặc đổi giờ, lịch mới sát giờ và quyền thông báo. Đồng bộ lại cùng lịch giữ một thông báo cho mỗi mã lịch.

### US2. Duyệt lịch và tiền cọc nhanh

App có bốn tab **Lịch làm**, **Duyệt lịch**, **Duyệt cọc** và **Khách**. Người dùng xem chi tiết cần để quyết định. Duyệt cọc ghi giao dịch thật vào cùng sổ thu chi của web. Hồ sơ đổi trên thiết bị khác được tải lại trước khi xử lý tiếp. Tab Khách hỗ trợ tìm tên hoặc số điện thoại, gọi nhanh và xem lịch đã đặt.

**Nghiệm thu** Duyệt một lịch từ iPhone rồi thấy trạng thái trên web. Nhập giao dịch ngân hàng thiếu mã và nhận báo lỗi từ máy chủ. Hai thao tác đồng thời cho một yêu cầu chỉ ghi một lần.

## Yêu cầu

- **FR-001** Lấy lịch đang xác nhận từ máy chủ quản trị. Tính giờ nhắc bằng giờ bắt đầu trừ 24 giờ.
- **FR-002** Thay thông báo khi lịch đổi, hủy khi lịch không còn hợp lệ hoặc quản trị đăng xuất.
- **FR-003** Giữ dữ liệu liên hệ và số tiền trong app đã xác thực. Thông báo trên màn khóa chỉ hiện thời gian.
- **FR-004** App dùng bốn tab tác vụ. Web tiếp tục dùng trình quản trị đầy đủ trên cùng cơ sở dữ liệu.
- **FR-005** Lưu lịch và giao dịch qua API hiện có với kiểm tra phiên, phiên bản hồ sơ và khóa chống ghi trùng.

### Dữ liệu

Giờ hẹn và mã lịch đã xác nhận xác định thông báo. Lịch và giao dịch có chung quy tắc với bản web. Lịch cập nhật trên thiết bị khác được đưa vào danh sách nhắc khi iPhone đồng bộ lại.
