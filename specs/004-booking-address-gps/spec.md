# Feature Specification: Địa chỉ đặt lịch chỉ dùng GPS và nhập tay

**Created**: 2026-11-03 | **Branch**: main (existing worktree) | **Status**: Implemented and verified; physical-device GPS not tested
**Input**: User's FINAL address-system attachment. Supersedes booking-map UI from feature 003; admin remains unchanged.

## User Scenarios & Testing
### US1 - Nhập địa chỉ không cần bản đồ (P1)
Khách thấy Địa chỉ phục vụ, câu hướng dẫn đúng yêu cầu, nút GPS và bốn trường địa chỉ hiện có. Không thấy bản đồ, ghim, tìm kiếm Photon hoặc khoảng trống bản đồ.
**Independent Test**: Desktop/tablet/mobile; điền tay và hoàn thành đơn không cấp quyền GPS.
**Acceptance**: No map DOM/scripts/tile/search/config requests on booking; province/ward pickers, service/time, fees and total unchanged.

### US2 - Định vị chủ động (P1)
Bấm GPS mới yêu cầu định vị; loading trên nút, chống bấm lặp, lỗi ngắn và kết thúc có giới hạn. Chỉ tự điền dữ liệu phù hợp với địa giới hiện tại và không ghi đè nội dung khách đã chỉnh tay.
**Independent Test**: GPS precise/coarse/denied/unsupported/timeout, reverse success/failure/mismatch/offline, rapid clicks, leaving/revisiting and editing during response.
**Acceptance**: Precise compatible address may be suggested; low-quality or mismatched data leaves manual fields usable, no invented house number, no lost inputs or late overwrite.

### US3 - Xác nhận và lưu đúng địa chỉ (P1)
Khách kiểm tra địa chỉ và bấm Tiếp tục để xác nhận. Nếu sửa tỉnh/xã/đường sau định vị, tọa độ cũ không còn gắn với địa chỉ mới; vẫn đặt lịch bằng địa chỉ tay.
**Independent Test**: Actual isolated D1 create/readback for GPS unchanged, edited address and manual booking; verify fees/payment state and admin history.

### Edge Cases
- Permission prompt left open, repeated requests, cancel/navigation during geocoding.
- Manual address already present, same province with different ward/street, partial geocoder address, foreign/mismatched data.
- New document resets GPS trust while keeping draft address; same-document step navigation preserves valid data.

## Requirements
- FR-001: Remove all map UI/loading/placeholders and map imports/requests from /booking/location only.
- FR-002: Keep four existing fields/order/font/colors; GPS full width, rounded thin border, centered icon/text. Subtitle: Vui lòng cung cấp địa chỉ để chuyên viên đến đúng địa điểm.
- FR-003: Reuse browser GPS and bounded reverse lookup only after explicit click; no paid services or automatic prompts.
- FR-004: Do not overwrite nonempty manual edits or apply stale asynchronous results; no guessed house numbers or mismatched regions.
- FR-005: Confirm coordinates only with an unchanged compatible address; editing core address invalidates old coordinates. GPS optional for booking.
- FR-006: Preserve D1 booking, admin maps/history, service/time/customer validation, travel fee and totals, payment truth and authorization.
- FR-007: Remove unused booking map configuration controls/modules only after confirming other usages. Retain shared map dependencies for admin.
- FR-008: Run build/full existing core suite, new browser regression scenarios and real isolated persistence checks. Distinguish mocked GPS from physical-device validation.

### Key Entities
- GPS candidate: measured coordinates/accuracy/time, verified region and exact associated address.
- Confirmed location: candidate bound to current address and confirmed by Tiếp tục.
- Manual booking: valid four-field address without required coordinates.

## Success Criteria
- SC-001: Zero map SDK/tile/search/config requests on booking, before and after GPS.
- SC-002: Manual and GPS flows complete booking with unchanged fees/totals and correct readback.
- SC-003: Edited/mismatched/late address never saves a stale destination coordinate.
- SC-004: All automated tests pass; physical GPS limitations disclosed in acceptance report.

## Assumptions
- Tiếp tục is the address confirmation action; no extra map or pin confirmation control.
- Apartment/directions note does not change geographic street; changing province, ward or street invalidates the candidate.
- Existing readonly admin map remains; existing stored bookings are not rewritten. No schema migration.

## Nâng cấp định vị hiện tại

- Cho phép khách dùng GPS và chọn tỉnh/phường ngay khi tải xong danh mục hiện hành. Tên hành chính cũ tải độc lập, với hỗ trợ cho địa chỉ nháp đã lưu.
- Nếu trình duyệt đã cấp quyền và lần đọc chuẩn chưa trả kết quả sau 4 giây, thử chế độ dự phòng trong cùng thao tác. Dùng lần đo mới đủ tốt sau một khoảng cải thiện ngắn và ghi sai số thiết bị thực sự báo.
- Bắt đầu đối chiếu địa giới từ lần đo phù hợp đầu tiên. Chỉ tra số nhà hoặc đường khi điểm được chọn nằm trong địa giới đã đối chiếu. Kiểm tra khoảng cách địa chỉ và tránh gợi ý số nhà khi dữ liệu còn mơ hồ.
- Phân biệt bước chờ quyền, đo vị trí, đối chiếu địa giới và tra địa chỉ. Hiện phần địa chỉ khách cần bổ sung và cho phép nhập tay ngay khi khách chọn dừng. Giữ điều kiện xác nhận qua **Tiếp tục** và quy tắc bảo toàn nội dung khách nhập.
- Kiểm tra độ trễ bằng đồng hồ giả lập, hành trình trên các kích thước màn hình và việc lưu địa chỉ trong D1 riêng. Ghi rõ phạm vi kiểm thử GPS vật lý.
