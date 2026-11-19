# Feature Specification: Một nơi xử lý thanh toán

**Feature Branch**: Existing working branch; preserve unrelated changes.
**Created**: 2026-11-03
**Status**: Accepted for implementation
**Input**: Gom duyệt cọc về Thanh toán, đủ cọc xác nhận lịch cùng lúc, biểu mẫu ngắn và chuyên nghiệp trên máy tính/điện thoại.

## User Scenarios & Testing

### User Story 1 - Một nơi xử lý cọc (Priority: P1)
Admin từ danh sách/chi tiết lịch mở Thanh toán được lọc đúng mã lịch; các trang lịch chỉ thể hiện số tiền và trạng thái.
**Why this priority**: Loại bỏ cảm giác nhiều nơi cùng duyệt một khoản tiền.
**Independent Test**: Mở lịch trên desktop/mobile, theo liên kết Thanh toán; thấy đúng lịch và không có biểu mẫu thu tiền ở trang lịch.
**Acceptance Scenarios**:
1. Given lịch chưa cọc, when mở Thanh toán từ lịch, then thấy đúng lịch, một hành động chính Xác nhận cọc.
2. Given liên kết xử lý cọc cũ, when sử dụng, then đi tới Thanh toán thay vì mở biểu mẫu ở trang khác.

### User Story 2 - Ghi nhận một lần (Priority: P1)
Admin kiểm tra tiền thật, nhập mã giao dịch rồi ghi nhận; đủ cọc thì lịch xác nhận cùng lần đó.
**Why this priority**: Giảm nhập liệu và loại bỏ bước duyệt lịch lặp lại.
**Independent Test**: Ghi đủ/thiếu cọc; kiểm tra tiền và trạng thái lịch, thử gửi lại khi mất phản hồi.
**Acceptance Scenarios**:
1. Given lịch chờ, when ghi nhận đủ cọc, then lịch xác nhận mà không phải đánh dấu thêm ô hay duyệt lần hai.
2. Given nhận thiếu, when ghi số thực nhận, then lịch vẫn chờ và thể hiện phần cọc còn thiếu.
3. Given lỗi mạng sau gửi, when thử lại, then giữ nguyên yêu cầu và không ghi trùng.

### User Story 3 - Giao diện rõ ràng (Priority: P2)
Thanh toán chia Cần xử lý, Tất cả lịch và Sổ giao dịch; mỗi lịch có một hành động chính. Biểu mẫu có sẵn khách, số tiền; thông tin bổ sung mở khi cần.
**Independent Test**: Xem desktop 1440px/mobile 390px; lọc, tìm kiếm, thu tiền mặt, hoàn một phần, đóng và mở lại.
**Acceptance Scenarios**:
1. Given đã đủ cọc, then chỉ đề xuất Thu còn lại; đủ toàn bộ thì Đã thu đủ.
2. Given lịch hủy còn tiền, then hành động chính Hoàn tiền; hoàn chỉ ghi sổ sau chuyển thật và có lý do.

### Edge Cases
- Không có lịch; không có kết quả tìm kiếm; mã lịch không tồn tại.
- Cọc từng lịch khác cài đặt hiện tại; cọc bằng 0; nhận thiếu; thu đủ; lịch hủy.
- Thu/hoàn trùng mã; mất phản hồi; lỗi làm mới sau khi đã ghi thành công.
- Lịch hoàn thành chưa thu đủ vẫn được thu phần còn lại; tiền hoàn không vượt số giữ.

## Requirements
### Functional Requirements
- FR-001: Chỉ mục Thanh toán có khả năng mở biểu mẫu thu/hoàn; lối vào cũ chuyển hướng đúng lịch.
- FR-002: Tính tiền từ sổ giao dịch thật, mức cọc theo từng lịch; không suy luận đã nhận từ trạng thái lịch.
- FR-003: Thu tiền cho lịch chờ tự yêu cầu xác nhận khi đủ mức cọc; thu thiếu không xác nhận.
- FR-004: Biểu mẫu mặc định điền số thiếu, phương thức chuyển khoản, thời gian hiện tại có thể chỉnh; mã ngân hàng vẫn bắt buộc với chuyển khoản.
- FR-005: Thu, hoàn, lịch sử, xuất sổ và chống ghi trùng tiếp tục hoạt động.
- FR-006: Cần xử lý gồm khách báo chuyển, lịch chờ thiếu cọc và lịch hủy cần hoàn; loại lịch đã từ chối hoàn khỏi hàng cần hoàn.
- FR-007: Chức năng hiện có về đặt lịch, quyền admin và dữ liệu khách giữ nguyên.

### Key Entities
- Lịch hẹn: trạng thái phục vụ, mức cọc yêu cầu, tổng chi phí.
- Giao dịch: khoản thu/hoàn thực tế, mã đối chiếu, thời gian, nhận diện yêu cầu chống trùng.

## Success Criteria
### Measurable Outcomes
- SC-001: Không còn nút Duyệt cọc/Hoàn cọc ở danh sách lịch và biểu mẫu thu độc lập ở chi tiết mobile.
- SC-002: Khoản chuyển đủ cọc chỉ cần nhập mã giao dịch và một lần bấm ghi nhận sau đối chiếu.
- SC-003: Nhận thiếu vẫn chờ; đủ cọc xác nhận ngay; gửi lại không sinh khoản thu thứ hai.
- SC-004: Không tràn ngang trang/biểu mẫu ở 390px; các hành động chính và lỗi đọc được.

## Assumptions
- Thực hiện trong checkout local hiện có để chủ dự án xem; không kết nối ngân hàng mới hoặc triển khai hosting.
- Chưa tích hợp xác minh ngân hàng tự động; admin tiếp tục đối chiếu giao dịch thật.
- Không đổi chính sách cọc/hoàn, quyền hạn hoặc cấu trúc dữ liệu.
