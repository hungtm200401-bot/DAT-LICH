# Feature Specification: Bộ công cụ build IPA dễ dùng
**Feature Branch**: `codex/ipa-build-tooling`
**Created**: 2026-11-25
**Status**: Implemented and verified
**Input**: Lấy các phần phù hợp từ cách build Husk để các lần build HOÀN sau dễ hơn.

## User Scenarios & Testing
### US1 - Build một lệnh, có kết quả rõ (Priority: P1)
Chủ chạy công cụ quen thuộc trên Windows hoặc Mac để tạo IPA đúng nguồn và tìm được bản mới/log nếu lỗi.
**Independent Test**: Chạy kiểm tra trước build trên Windows; build thực trên macOS CI; tải đúng IPA/manifest và mở log.
**Acceptance**: Build thành công có đúng version/build/nguồn, checksum; lỗi build không đóng gói lại binary cũ; log lỗi giữ lại.
### US2 - Chặn gói không cài được (Priority: P1)
Công cụ phát hiện metadata thiếu, binary sai nền tảng/kiến trúc, thư viện đóng gói thiếu và IPA không khớp app.
**Independent Test**: Dùng fixture hợp lệ và các gói hỏng có chủ ý; gói hỏng bị từ chối và IPA đã có không bị thay.
**Acceptance**: Gói hợp lệ được xuất; thiếu executable/key/thư viện hoặc dùng Simulator bị chặn; thành phần nhúng được ký trước app chứa nó.
### US3 - Dùng lại được về sau (Priority: P2)
Có launcher, lệnh kiểm tra và hướng dẫn rõ ràng; thêm file Swift mà quên đưa vào target được phát hiện trước build.
**Independent Test**: Thêm fixture Swift chưa có trong Sources; kiểm tra báo tên file cần sửa. Hướng dẫn/lệnh không yêu cầu cài bộ giả lập của Husk.

## Requirements
- FR-001: Giữ một lệnh build trên Windows qua GitHub và lệnh build Mac; thêm bước kiểm tra có thể chạy trước build.
- FR-002: Kiểm tra đầy đủ các trường cài đặt cần thiết, executable thực, kiến trúc/nền tảng iPhone và các thư viện nhúng bắt buộc.
- FR-003: Chỉ công bố IPA sau khi kiểm tra bundle, ZIP và manifest khớp nguồn; file IPA được thay bằng bản hoàn chỉnh, không ghi dở lên file đích.
- FR-004: Build dùng vùng tạm riêng, lỗi không dùng lại binary cũ; giữ log và không ghi khóa/chứng chỉ riêng vào log/Git.
- FR-005: Nhãn nguồn phản ánh việc có thay đổi chưa commit; build CI vẫn khớp commit đầy đủ.
- FR-006: Giữ hành vi app, API, dữ liệu, version/build hiện tại và điều kiện APNs. Các thành phần giả lập/JIT không thuộc phạm vi.
- FR-007: Viết kiểm tra hồi quy bằng fixture và chạy build thật; ghi nguồn tham khảo Husk, không nhập mã app GPL hoặc phụ thuộc game.

## Edge Cases
Sai Info.plist, executable trỏ ra ngoài bundle, ARM64 Simulator, thư viện thiếu, ZIP cũ không khớp app mới, nguồn chưa commit, build bị ngắt, đầu ra nằm trên cùng filesystem hoặc file đã có.

## Key Entities
- Bundle app: metadata, Mach-O, tài nguyên và thành phần nhúng.
- IPA/manifest: gói được xác minh và thông tin build thực.
- Log build: chẩn đoán riêng, không bí mật người dùng.

## Success Criteria
- SC-001: Tất cả gói lỗi trong bộ kiểm tra bị từ chối trước khi thay IPA có sẵn.
- SC-002: Build thật tạo gói ARM64 đúng version/build/commit và checksum.
- SC-003: Chủ chỉ cần một launcher/lệnh để build, tải và tìm file/log.

## Assumptions
Các bước build/macOS dùng hạ tầng GitHub hiện có; không cần mua hoặc đăng nhập tài khoản Apple cho IPA ký thử. Chữ ký Apple có Push vẫn cần tài khoản/cấu hình thật như trước. Viết công cụ riêng theo các nguyên tắc đóng gói đã tham khảo; không sao chép mã giả lập hoặc script nguyên khối của Husk.
