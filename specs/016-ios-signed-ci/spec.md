# Feature Specification: Build IPA có quyền Push trên GitHub
**Feature Branch**: `codex/ios-signed-ci`
**Created**: 2026-11-25
**Status**: Tooling implemented; macOS verification pending
**Input**: Tận dụng công cụ nguồn mở để build phù hợp HOÀN; giữ IPA, iOS 26.6.1 và mục tiêu nhận thông báo cả khi vuốt tắt app.

## User Scenarios & Testing
### US1 — Xuất bản cài có chữ ký đúng (Priority: P1)
Chủ cung cấp bộ ký được Team Apple cho phép sử dụng, rồi chạy build có ký riêng để nhận IPA HOÀN.
**Why**: Pipeline hiện tại chỉ xuất bản ký thử, chưa chứng minh quyền Push.
**Independent Test**: Chạy với bộ ký thật có quyền Push; xác minh app xuất ra trước công bố.
**Acceptance**: Profile khớp app, Team, môi trường và chứng chỉ; IPA có entitlement thực khớp profile và manifest.
### US2 — Biết chính xác đầu vào còn thiếu (Priority: P1)
Thiếu hoặc sai bộ ký phải dừng rõ ràng, giữ nguyên IPA đã có.
**Independent Test**: Fixture thiếu đầu vào, profile hết hạn/sai app/sai quyền, chứng chỉ không khớp và cấu hình export sai bị từ chối.
**Acceptance**: Không chuyển sang bản ký thử; lỗi không in nội dung bí mật.
### US3 — Giữ kín bộ ký và dễ dùng lại (Priority: P2)
Bộ ký chỉ dùng trong phiên build; người dùng phân biệt build đã ký và nhận thông báo thật.
**Independent Test**: Kiểm trên Windows/macOS, cleanup khi build lỗi; artifact chỉ chứa IPA/manifest.
**Acceptance**: Khóa APNs máy chủ không vào job ký app; hướng dẫn có nguồn và phần cần tài khoản Apple thật.
### Edge Cases
App ID prefix khác Team ID; wildcard ID; profile không có thiết bị đăng ký; sai mật khẩu p12; hết hạn; UUID sai; hủy job; profile đã có; profile nhúng khác profile yêu cầu.

## Requirements
### Functional Requirements
- FR-001: Có luồng ký riêng do chủ chạy chủ động; giữ luồng ký thử hiện có.
- FR-002: Kiểm tra đủ đầu vào; không dùng bộ ký không được phép.
- FR-003: Kiểm tra app ID, Team, quyền Push, hạn profile, chứng chỉ và danh sách thiết bị trước build; xử lý App ID prefix riêng.
- FR-004: Xác minh chữ ký và quyền thực sau export; chỉ công bố IPA/manifest sau khi đạt.
- FR-005: Không lưu/in/upload bộ ký hoặc profile giải mã; cleanup khi lỗi và khi hủy job có thể xử lý cleanup.
- FR-006: Không đổi booking/API/DB/UI hoặc Telegram; không giả quyền Push hay hứa APNs thật trước khi thử iPhone.
- FR-007: Có fixture hồi quy và kiểm trên macOS; báo riêng phần chưa thể chạy vì thiếu đầu vào Apple.
### Key Entities
Bộ ký (chứng chỉ/private key/mật khẩu/profile) và bản cài (IPA/entitlement/manifest).

## Success Criteria
- SC-001: Tất cả fixture sai bị chặn trước công bố IPA.
- SC-002: Đầu vào thật hợp lệ tạo được bản cài đúng app và môi trường.
- SC-003: Lỗi build không thay IPA cũ và không đưa khóa vào artifact.

## Assumptions
Đầu vào Apple chưa có trong repo/GitHub; không thể tạo bằng sao chép mã. Phạm vi lần này là công cụ nhận bộ ký hợp lệ; build ký thật và thử Push trên iPhone phụ thuộc đầu vào bên ngoài. Chỉ hỗ trợ profile cho thiết bị đăng ký, chưa phân phối App Store/Enterprise. Không cần thay SDK thông báo đang có.
