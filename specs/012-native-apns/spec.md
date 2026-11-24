# Feature Specification: Thông báo lịch mới trực tiếp trong IPA

**Feature Branch**: `codex/native-apns`
**Created**: 2026-11-24
**Status**: Specified
**Input**: Chủ app yêu cầu nhận thông báo lịch mới khi đóng app IPA, sau khi lịch thử chỉ xuất hiện lúc mở app.

## User Scenarios & Testing
### User Story 1 - Bật và kiểm tra thông báo iPhone (Priority: P1)
Quản trị đăng nhập IPA, cấp quyền, thấy đăng ký thành công và gửi thử. Khi bản cài hoặc máy chủ chưa hỗ trợ, app nêu đúng nguyên nhân, không báo đã bật.
**Independent Test**: Kiểm tra bật, gửi thử, từ chối quyền và bản cài thiếu quyền.
**Acceptance Scenarios**:
1. Đăng nhập và có đủ cấu hình, bật thông báo đăng ký thiết bị và gửi thử tới đúng máy.
2. Chưa đăng nhập, yêu cầu đăng ký/gửi thử bị từ chối.
3. Bản ký miễn phí hoặc thiếu cấu hình hiển thị lý do và vẫn cho xem lịch bình thường.

### User Story 2 - Nhận lịch mới khi đóng app (Priority: P1)
Web lưu lịch thành công thì từng iPhone đã bật nhận thông báo. Chạm mở đúng lịch, giữ yêu cầu đăng nhập nếu phiên hết hạn.
**Independent Test**: Tạo lịch trên web với app đóng; kiểm tra yêu cầu gửi, nội dung và mở lịch.
**Acceptance Scenarios**:
1. Một lịch mới tạo một thông báo cho mỗi thiết bị đã đăng ký trước đó.
2. Mất kết nối tạm thời được thử lại; việc tạo lịch không thất bại theo dịch vụ thông báo.
3. Mở thông báo khi app chưa chạy hoặc đã chạy đều dẫn tới đúng lịch sau xác thực.

### User Story 3 - Tắt và thu hồi thông báo (Priority: P2)
Tắt hoặc đăng xuất thu hồi thiết bị; token hết hạn bị loại bỏ an toàn.
**Independent Test**: Tắt/đăng xuất rồi tạo lịch; kiểm tra thiết bị đó không còn yêu cầu gửi.

### Edge Cases
- Token thay đổi, bản cài đổi môi trường, đổi khóa quản trị, nhiều máy đăng ký, chạm thông báo trước khi trang sẵn sàng.
- Lịch bị hủy/lưu trữ trước lần thử lại; lỗi chứng chỉ hoặc dịch vụ tạm ngừng; thiếu cấu hình.

## Requirements
### Functional Requirements
- **FR-001** Chỉ quản trị đã đăng nhập được bật/gửi thử; tắt và đăng xuất thu hồi đúng thiết bị.
- **FR-002** Thông báo lịch mới chạy độc lập sau khi lưu lịch; tối đa tám lần gửi có khoảng chờ tăng dần và hạn 24 giờ.
- **FR-003** Màn hình khóa chỉ hiện loại sự kiện, không hiện tên, số điện thoại hoặc khóa quản trị.
- **FR-004** Chạm thông báo mở lịch theo mã hợp lệ trong chính máy chủ đã cấu hình; không mở địa chỉ ngoài do nội dung thông báo cung cấp.
- **FR-005** Không giả lập thành công khi bản ký không hỗ trợ hoặc máy chủ chưa cấu hình.
- **FR-006** Giữ nhắc lịch 24 giờ hiện có; thông báo lịch mới không phụ thuộc việc app chạy nền.
- **FR-007** Kiểm thử tích hợp tự động kiểm tra xác thực, token, nội dung gửi, thử lại, thu hồi và bảo toàn lịch thật.

### Key Entities
- Đăng ký iPhone: định danh cài đặt, token, môi trường và thế hệ khóa.
- Lần gửi: thiết bị, mã lịch, thời điểm thử lại, số lần thử, hạn và kết quả gần nhất.

## Success Criteria
### Measurable Outcomes
- **SC-001** Khi đủ cấu hình và mạng hoạt động, yêu cầu thông báo đầu tiên bắt đầu ngay sau khi lưu lịch, không cần mở app.
- **SC-002** Lặp tác vụ nền không tạo thêm sự kiện cho cùng lịch và thiết bị.
- **SC-003** Yêu cầu đăng ký/gửi thử ẩn danh và các tình huống từ chối quyền được xử lý rõ ràng.
- **SC-004** Có biên bản kiểm thử tách kết quả tự động khỏi kết quả nhận trên iPhone thật.

## Assumptions
- Chủ app hiện ký miễn phí; chuẩn bị code đầy đủ nhưng nhận đẩy thật cần bản ký có quyền Push và thông tin dịch vụ do chủ app cấu hình.
- Giữ ứng dụng IPA và giao diện hiện có; không chuyển sang ứng dụng web.
- Chỉ thêm thông báo lịch mới; không thay đổi lịch, tiền cọc hay nhắc lịch cục bộ 24 giờ.
