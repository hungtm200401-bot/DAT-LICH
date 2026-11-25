# Tasks: IPA ký Push trên GitHub
**Input**: spec.md, plan.md, research.md, data-model.md, quickstart.md.

## Setup
- [x] T001 Xác định phạm vi và nguồn trong specs/016-ios-signed-ci/.
## Foundation
- [x] T002 Viết fixture profile/export/cleanup trong tests/test_ipa_signing.py trước implementation.
## US1 — Bản ký đúng
- [x] T003 [US1] Validate profile/App ID prefix/certificate và export trong ios/ios_signing.py.
- [x] T004 [US1] Thêm Manual archive/export vào ios/export-signed-ipa.sh, giữ Automatic hiện có.
## US2 — Chặn đầu vào lỗi
- [x] T005 [US2] Thêm orchestration/check-secrets trong ios/ci_signed_build.py và .github/workflows/ios-signed.yml.
## US3 — Bảo toàn khóa và dùng lại
- [x] T006 [US3] Cleanup cả lỗi/hủy job trong ios/ci_signed_build.py; nối preflight scripts/check-ios-build.mjs.
- [x] T007 [US3] Viết docs/IPA_SIGNED_GITHUB.md và nối từ docs/IPA_BUILD.md.
## Verification
- [x] T008 Chạy unit/syntax/actionlint và job kiểm tra macOS; ghi specs/016-ios-signed-ci/quickstart.md.
- [ ] T009 Khi có bộ ký Apple: build signed thật và thử nhận trên iPhone, ghi specs/016-ios-signed-ci/quickstart.md.

## Dependencies & Strategy
T001 → T002 → T003-T004 → T005-T007 → T008. T009 phụ thuộc bộ ký bên ngoài, phải giữ chưa đạt nếu chưa chạy. MVP là profile validator + Manual export. Có thể đọc nguồn và kiểm tra tài liệu song song; implementation các file có phụ thuộc xử lý tuần tự. Research agent chỉ đọc, không chạm worktree gốc hoặc phần Telegram.
