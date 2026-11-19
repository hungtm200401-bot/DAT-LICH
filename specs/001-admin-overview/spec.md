# Feature Specification: Tổng quan gọn và dễ dùng

**Updated**: 2026-11-03 | **Status**: Implemented and verified locally
**Input**: Tổng quan quá nhiều chi tiết; cần dễ dùng, nhìn là hiểu và chuyên nghiệp.
This revision supersedes the earlier request for detailed charts and activity on the overview.

## User Scenarios & Testing
### US1 — Nắm tình hình trong một lần nhìn (P1)
Quản trị viên thấy ba số liệu: lịch hôm nay, lịch chờ xác nhận và thu ròng tháng.
Acceptance: tên chỉ số ngắn, số tiền vẫn tính theo giao dịch thật và ngày Việt Nam;
nhấn mỗi thẻ mở danh sách đúng bộ lọc. Không lặp lại cùng chỉ số ở nhiều khu vực.
### US2 — Tập trung vào việc hôm nay (P1)
Quản trị viên thấy tối đa năm lịch hôm nay, theo thứ tự giờ, và các yêu cầu cần xử lý.
Acceptance: mỗi dòng lịch chỉ có giờ, khách, dịch vụ, trạng thái và lối mở chi tiết.
Các việc đối soát, đổi lịch và hoàn tiền chỉ xuất hiện khi có số lượng lớn hơn không.
Nếu có hơn năm lịch, liên kết cho biết tổng số và mở toàn bộ ngày đó.
### US3 — Xem sâu khi cần (P2)
Quản trị viên có một thao tác tạo lịch chính, làm mới, menu phụ và liên kết trang chi tiết.
Acceptance: biểu đồ, bảng tiền theo ngày, cơ cấu dịch vụ và lịch sử không xuất hiện ở
Tổng quan. Xuất file nằm trong menu ba chấm. Điện thoại mở trang thu chi đầy đủ,
không dẫn sang màn hình báo cáo di động chưa được triển khai.

## Requirements
- FR-001: Chỉ hiển thị ba thẻ chính, dùng cách tính hiện có; giữ đúng liên kết bộ lọc.
- FR-002: Danh sách hôm nay tối đa năm dòng, hiển thị thông tin đủ để nhận biết buổi hẹn.
- FR-003: Chỉ hiện hàng việc cần xử lý có dữ liệu; dữ liệu trống có trạng thái ngắn gọn.
- FR-004: Bỏ các biểu đồ, bảng tiền, cơ cấu dịch vụ và hoạt động khỏi màn hình chính.
- FR-005: Một nút tạo lịch chính ở đầu trang trên mỗi kích thước màn hình.
- FR-006: Làm mới nhỏ gọn; xuất file trong menu phụ; trang chi tiết mở qua liên kết.
- FR-007: Giữ tìm kiếm đầu trang, dữ liệu thật, phản hồi lỗi mạng và trạng thái chưa tải.
- FR-008: Tiêu đề, ngày cập nhật và nút tạo lịch dùng một hàng đầu trang; ba thẻ
  cùng hàng trên desktop, hai khối bên dưới thẳng mép và cân chiều cao.
- FR-009: Giới hạn chiều rộng nội dung 1280px trên màn hình rộng; không render
  Tổng quan trước khi stylesheet đúng phiên bản tải xong. Phiên Tổng quan cũ
  tự phục hồi khi an toàn, không tải lại khi đang sửa biểu mẫu.

## Edge Cases
Không có lịch; hơn năm lịch; không có việc cần xử lý; lỗi khi làm mới; dữ liệu chưa tải;
tên khách/dịch vụ dài; số tiền lớn/âm; màn hình điện thoại; nội dung khách chứa HTML.

## Key Entities
Dùng lịch hẹn, giao dịch, dịch vụ và yêu cầu hiện có. Không đổi API, schema hoặc dữ liệu.

## Success Criteria
- SC-001: Chỉ có ba thẻ và hai khối nội dung chính trên desktop và điện thoại.
- SC-002: Không có bảng chi tiết/biểu đồ/lịch sử trên Tổng quan; tối đa năm dòng lịch.
- SC-003: Các lối tắt, tìm kiếm, tạo lịch, làm mới và xuất file tiếp tục hoạt động.
- SC-004: Không tràn ngang ở 390px; kiểm tra trình duyệt không lỗi JavaScript hoặc ghi dữ liệu thật.

## Assumptions
Phạm vi là tinh giản giao diện Tổng quan local hiện có theo phản hồi mới của chủ dự án.
Giữ các phần đã hoàn thiện ở trang chi tiết. Không mở rộng tính năng ngoài phạm vi.
