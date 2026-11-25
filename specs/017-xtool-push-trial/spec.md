# Feature Specification: Thử build và ký HOÀN bằng Xtool

**Feature Branch**: codex/xtool-push-trial
**Created**: 2026-11-25
**Status**: Specified; implementation pending
**Input**: Thử build ký qua Xtool, phải nhận thông báo khi tắt hoặc vuốt bỏ app.

## User Scenarios & Testing

### User Story 1 - Có bằng chứng build bằng công cụ mới (Priority: P1)
Chủ dự án muốn thử công cụ mới trên nguồn HOÀN hiện tại và có kết quả chạy thật.
**Why this priority**: Xác định khả năng build trước khi thay quy trình đang dùng.
**Independent Test**: Chạy build trên môi trường được hỗ trợ; đối chiếu nguồn,
định danh ứng dụng, máy chủ và kết quả biên dịch trong báo cáo.
**Acceptance Scenarios**:
1. **Given** nguồn iPhone hiện tại, **When** thử công cụ mới, **Then** có log build
   thật; nghiệp vụ, dữ liệu và bản IPA hiện tại được giữ nguyên.
2. **Given** lỗi công cụ hoặc môi trường, **When** build thất bại, **Then** báo đúng
   bước và lỗi; không thay sản phẩm của công cụ khác rồi nhận là đã đạt.

### User Story 2 - Nhận thông báo sau khi vuốt tắt (Priority: P1)
Chủ dự án cần thông báo lịch mới hiện trực tiếp dưới tên HOÀN khi khóa màn hình
và sau khi vuốt tắt hoàn toàn ứng dụng.
**Why this priority**: Đây là điều kiện chấp nhận bản cài, độc lập với việc build.
**Independent Test**: Cài bản được phép nhận Push, bật thông báo và thử lịch thật
trên iPhone ở cả hai trạng thái.
**Acceptance Scenarios**:
1. **Given** bộ ký hợp lệ, **When** xuất bản cài thử, **Then** quyền Push trong chữ
   ký thực tế khớp định danh, Team và môi trường máy chủ.
2. **Given** thiếu bộ ký/quyền Push, **When** thử ký, **Then** báo thiếu đầu vào;
   không công bố bản cài chưa đạt là đã bảo đảm nhận thông báo.
3. **Given** iPhone có Internet, cho phép thông báo và tắt chế độ tập trung,
   **When** đặt lịch thử khi HOÀN ở nền/khóa và khi đã vuốt tắt,
   **Then** mỗi trường hợp hiện thông báo HOÀN; chạm mở đúng lịch sau xác thực.

### Edge Cases
- Công cụ thêm tiền tố định danh: phát hiện sai khác trước khi xuất bản.
- Profile hết hạn, sai môi trường, thiếu thiết bị hoặc thiếu quyền Push.
- Apple nhận yêu cầu nhưng iPhone chưa hiện: chưa đạt kiểm chứng nhận.
- Không đăng nhập Apple: ghi build không ký riêng, không giả lập đăng nhập.
- Windows thiếu môi trường: dùng máy build sẵn có, không tự reboot.

## Requirements

### Functional Requirements
- **FR-001**: Thử nghiệm MUST dùng nguồn iPhone hiện tại; không thay nghiệp vụ đặt
  lịch, thanh toán, dữ liệu hay xác thực.
- **FR-002**: Báo cáo MUST ghi phiên bản công cụ, nguồn và kết quả chạy thật.
- **FR-003**: Bản cài công bố có Push MUST được kiểm tra quyền trong chữ ký và
  profile thực tế; khai báo trong nguồn không thay bằng chứng này.
- **FR-004**: Thử nghiệm MUST giữ bản IPA đã có; sản phẩm chưa kiểm chứng MUST tách
  khỏi bản phát hành đang dùng và không tự thay bản mới nhất.
- **FR-005**: Bí mật ký/gửi MUST không xuất hiện trong Git, log hay báo cáo.
- **FR-006**: Xác nhận hoàn tất MUST gồm nhận trên iPhone sau vuốt tắt và chạm mở
  đúng lịch; phản hồi chấp nhận từ dịch vụ gửi không đủ.
- **FR-007**: Thiếu bộ ký hoặc truy cập thiết bị MUST được báo đúng trạng thái.

### Key Entities
- **Build attempt**: Nguồn, công cụ, môi trường, trạng thái từng bước và bằng chứng.
- **Push verification**: Quyền ký, cấu hình gửi, đăng ký thiết bị, kết quả nhận.

## Success Criteria

### Measurable Outcomes
- **SC-001**: Có một lần chạy công cụ thật với nguồn HOÀN và log kết quả.
- **SC-002**: Không thay dữ liệu nghiệp vụ hoặc bản cài hiện tại do thử nghiệm.
- **SC-003**: Không gắn nhãn hỗ trợ Push cho sản phẩm thiếu quyền hợp lệ.
- **SC-004**: Trước xác nhận hoàn tất, hai trường hợp nền/khóa và vuốt tắt đều nhận
  thông báo thật và mở đúng lịch trên iPhone của chủ dự án.

## Assumptions
- Giữ IPA gốc; không chuyển sang trình duyệt hoặc ứng dụng nhận hộ.
- Chưa có bộ ký Apple được cung cấp; kiểm tra tên đầu vào, không đọc bí mật.
- Được dùng máy build GitHub đang kết nối; không mua dịch vụ.
- Chủ dự án tự đăng nhập/cấp quyền Apple và thao tác iPhone khi cần; không yêu
  cầu mật khẩu Apple hoặc mã xác minh trong chat.
