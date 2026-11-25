# Implementation Plan: Công cụ build IPA
**Branch**: `codex/ipa-build-tooling` | **Date**: 2026-11-25 | **Spec**: [spec.md](spec.md)
## Summary
Bổ sung validator/publication Python dùng chung cho unsigned/signed exports; ký ad-hoc từ code con ra app cha; preflight target Swift, log bền vững và launcher Windows. Giữ pipeline macOS/Simulator đã có, không đổi app hoặc dữ liệu.
## Technical Context
**Language/Version**: Python >=3.9 stdlib, Bash macOS, Node >=22.13 wrapper.
**Primary Dependencies**: Xcode/codesign/lipo/zip hiện có; không thêm package/XcodeGen.
**Storage**: IPA/outputs hiện có, tạm cùng filesystem khi publish.
**Testing**: unittest fixture lỗi/thành công, kiểm tra IPA thật hiện có, Bash syntax và build/Simulator thực trên GitHub.
**Target Platform**: Windows preflight/downloader; macOS build/sign; ARM64 iPhone.
**Project Type**: Công cụ phát triển cho repo web + iPhone.
**Performance Goals**: Đọc metadata/load commands nhỏ; hash theo block; không thêm phụ thuộc lớn.
**Constraints**: Không chạy script Husk nguyên khối; không copy code app/JIT/GPL. Không giả quyền APNs. Publish từng file hoàn chỉnh; cặp IPA/JSON vẫn phải đối chiếu hash.
**Scale/Scope**: Một target HoanAdmin, framework/extensions nếu được nhúng trong tương lai, hai đường ký thử/ký Apple đã có.
## Constitution Check
PASS trước và sau thiết kế: không thay booking/auth/API/DB/payment/UI; nguồn build và chữ ký phản ánh đúng thực tế; kiểm tra tỷ lệ phù hợp. Spec/checklist không thay runtime tests.
## Project Structure
`ios/ipa_bundle.py`, `ios/write-build-manifest.py`, `ios/build-ipa.sh`, `ios/export-signed-ipa.sh`, `ios/sign-adhoc-bundle.sh`; `tests/test_ipa_bundle.py`; `scripts/check-ios-build.mjs`, `scripts/windows/TAO_IPA.bat`; workflow và tài liệu hiện có.
## Complexity Tracking
Không có vi phạm hoặc dependency mới. Không đưa mã QEMU/JIT vào app đặt lịch.
