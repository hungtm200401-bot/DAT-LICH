# Feature Specification: OpenFreeMap và tìm địa chỉ

**Feature Branch**: `main` (existing workspace)
**Created**: 2026-11-03
**Status**: Booking-map/search UI superseded by [004-booking-address-gps](../004-booking-address-gps/spec.md); readonly admin map and compatibility APIs retained.
**Input**: Sáu yêu cầu chuyển OpenFreeMap, giữ thao tác bản đồ/GPS, lưu tọa độ và địa chỉ, thêm gợi ý địa chỉ và bỏ lỗi quyền Google.

## User Scenarios & Testing

### User Story 1 - Chọn điểm trên bản đồ (Priority: P1)
Khách mở bước địa điểm, phóng to/thu nhỏ, di chuyển và đặt ghim mà không cần cấu hình Google.
**Why this priority**: Khôi phục việc chọn điểm đến ngay cả khi đã lưu key Google bị từ chối.
**Independent Test**: Mở bước địa điểm với cấu hình Google cũ; bản đồ OpenFreeMap vẫn tương tác được.
**Acceptance Scenarios**:
1. Given cấu hình Google cũ, when mở địa điểm/quản trị, then không tải Google Maps API và không hiện Permission Denied.
2. Given bản đồ đã tải, when phóng to, di chuyển và chọn điểm, then ghim đúng tọa độ và khách có thể xác nhận.
3. Given khách cho phép định vị, when bấm Dùng vị trí hiện tại, then giữ tọa độ và sai số thật; GPS kém chính xác cần chỉnh ghim.

### User Story 2 - Tìm địa chỉ (Priority: P2)
Khách nhập tên đường/địa điểm, chọn gợi ý và kiểm tra ghim.
**Why this priority**: Giảm thao tác tìm trên bản đồ.
**Independent Test**: Nhập ít nhất ba ký tự, chọn kết quả Việt Nam, kiểm tra ghim và địa chỉ.
**Acceptance Scenarios**:
1. Given nhập nhanh, when gợi ý xuất hiện, then chỉ truy vấn sau khi dừng nhập và kết quả cũ không thay thế truy vấn mới.
2. Given đã chọn gợi ý, when bấm Dùng vị trí này, then đối chiếu tỉnh/xã hiện tại và điền địa chỉ gợi ý để khách kiểm tra.
3. Given mất mạng hoặc không có kết quả, when tìm, then có thông báo dễ hiểu và vẫn dùng được bản đồ/GPS/nhập tay.

### User Story 3 - Lưu điểm phục vụ (Priority: P1)
Khi khách gửi đơn, quản trị nhận đúng địa chỉ và tọa độ đã xác nhận.
**Why this priority**: Hoàn cần biết đúng nơi phục vụ.
**Independent Test**: Tạo lịch trong database thử nghiệm, đọc lại địa chỉ và tọa độ với đủ độ chính xác.
**Acceptance Scenarios**:
1. Given ghim và địa chỉ đã xác nhận, when tạo lịch và đọc lại, then dữ liệu được lưu cùng lịch hẹn.
2. Given sửa ghim sau khi tìm kiếm, when xác nhận, then không giữ địa chỉ gợi ý của ghim cũ.

### Edge Cases
- Dịch vụ tìm kiếm chậm/lỗi, không có kết quả, nội dung HTML độc hại, tọa độ sai hoặc ngoài Việt Nam.
- Chuyển trang trong lúc tìm; kéo ghim trong lúc có kết quả chậm; bàn phím và màn hình nhỏ.
- WebGL không hỗ trợ: giữ renderer dự phòng hiện có; không dùng Google thay thế.
- Địa chỉ thiếu số nhà: yêu cầu khách bổ sung, không tự bịa địa chỉ.

## Requirements
### Functional Requirements
- FR-001: OpenFreeMap là mặc định cho khách và quản trị; cấu hình Google cũ không kích hoạt SDK Google.
- FR-002: Giữ phóng to/thu nhỏ, di chuyển, chọn/kéo ghim, mở rộng và nút định vị hiện tại.
- FR-003: Cung cấp gợi ý địa chỉ Việt Nam khi nhập từ ba ký tự, dùng được chuột và bàn phím.
- FR-004: Chọn gợi ý đặt ghim; chỉ lưu điểm phục vụ sau xác nhận và đối chiếu địa chỉ hợp lệ.
- FR-005: Lưu địa chỉ, tỉnh/xã, tọa độ đã xác nhận và hướng dẫn đến nhà cùng lịch hẹn trong dữ liệu thật.
- FR-006: Bảo toàn độ chính xác tọa độ, sai số GPS, kiểm tra xung đột lịch và quyền quản trị.
- FR-007: Không phát sinh yêu cầu Google Maps API hoặc lỗi quyền Google trong luồng OpenFreeMap.
- FR-008: Hủy truy vấn cũ, giới hạn yêu cầu và thông báo khi tìm kiếm không khả dụng.
### Key Entities
- Gợi ý địa chỉ: nhãn hiển thị, phần số nhà/đường nếu có, tọa độ và nguồn.
- Điểm phục vụ: tọa độ, thời điểm xác nhận và địa chỉ thuộc lịch hẹn.

## Success Criteria
### Measurable Outcomes
- SC-001: Không có yêu cầu Google Maps API trong các luồng khách/quản trị được kiểm tra.
- SC-002: Các thao tác bản đồ, GPS và chọn gợi ý hoàn thành trên máy tính và điện thoại.
- SC-003: Lịch thử nghiệm đọc lại đúng địa chỉ và tọa độ đã gửi, không làm tròn tọa độ.
- SC-004: Kết quả chậm không ghi đè lựa chọn mới; lỗi tìm kiếm không chặn nhập tay.

## Assumptions
- Dùng dữ liệu địa chỉ mở và giới hạn Việt Nam; độ đầy đủ địa chỉ tùy dữ liệu, khách kiểm tra số nhà.
- Google chỉ còn là liên kết chỉ đường mở khi bấm; không cần xóa dữ liệu cấu hình cũ.
- Dùng cơ chế lưu lịch hiện có, không thay schema và không tạo đơn giả trong database thật.
