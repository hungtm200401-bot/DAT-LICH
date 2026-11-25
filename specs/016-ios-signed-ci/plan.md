# Implementation Plan: Ký IPA có Push trên GitHub
**Branch**: `codex/ios-signed-ci` | **Date**: 2026-11-25 | **Spec**: [spec.md](spec.md)
## Summary
Workflow ký riêng dùng certificate/profile được cấp phép; keychain tạm và manual signing. Tái dùng validator/manifest và export đã có. Không thêm SDK vào app.
## Technical Context
**Language/Version**: Python >=3.9 stdlib, Bash, Node >=22.
**Primary Dependencies**: security, Xcode/codesign trên macos-15; không thêm Fastlane/Ruby.
**Storage**: RUNNER_TEMP cho khóa/state; IPA/ cho gói đã kiểm; không có migration.
**Testing**: unittest metadata/profile/export/cleanup, Bash syntax, actionlint, job kiểm tra macOS; export thật chỉ khi có bộ ký Apple.
**Target Platform**: GitHub macOS; validator chạy Windows/Linux.
**Project Type**: Công cụ build cho app HOÀN.
**Performance Goals**: Không thêm dependency lớn hoặc build app trong preflight.
**Constraints**: Manual signing không cần đăng nhập Apple trên runner; không log/upload secrets; không sửa business code. Chuỗi chứng chỉ/profile vẫn do Apple xác nhận qua Xcode và iPhone, metadata validation không thay xác minh đó.
**Scope**: Một target HoanAdmin, profile phát triển/Ad Hoc cho iPhone đăng ký; không dùng App Store/Enterprise hoặc app extensions.
## Constitution Check
PASS trước/sau thiết kế: chỉ công cụ build, không đổi booking/payment/D1/auth/UI. Không gọi kết quả fixture là Push thật. Công việc cô lập khỏi thay đổi Telegram của chủ trong worktree gốc.
## Project Structure
- ios/ios_signing.py: validate profile/export, tạo ExportOptions.
- ios/ci_signed_build.py: quản lý secrets/keychain/profile tạm và cleanup.
- ios/export-signed-ipa.sh: thêm nhánh Manual; giữ Automatic trên Mac.
- .github/workflows/ios-signed.yml: checks + job ký thủ công.
- tests/test_ipa_signing.py, scripts/check-ios-build.mjs, docs/IPA_SIGNED_GITHUB.md, docs/IPA_BUILD.md.
## Complexity Tracking
Không có vi phạm. Worktree trong outputs/ dùng tạm để bảo toàn thay đổi chưa commit của chủ. Research agent chỉ đọc và đã hoàn tất; implementation tuần tự.
