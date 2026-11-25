# Validation

Chạy `npm.cmd run ipa:check`, kiểm tra IPA đã có bằng validator, rồi build thật `npm.cmd run ipa:build` từ nhánh đã commit/push. CI cần Xcode, Simulator và Python có sẵn. IPA + JSON trong `IPA/`, logs trong `outputs/hoan-admin-app/ios/build/`; workflow diagnostics giữ cả lỗi.

## Actual results — 2026-11-25

Mã nguồn được kiểm tra: `3787d65db6f9a9e25a84fb297580144643c78326`, nhánh `codex/ipa-build-tooling`. Các cập nhật sau commit này chỉ ghi kết quả kiểm tra trong Spec Kit.

- `npm.cmd run ipa:check`: PASS, 20 unittest; đủ 5 file Swift trong Sources của target HoanAdmin; cú pháp của cả 4 script Bash đạt trên Git Bash.
- `node --check scripts/build-ios-github.mjs`, CLI `--help` và `git diff --check`: PASS.
- Validator chạy trên IPA thật trước đó và IPA mới: PASS. Đọc Info.plist/Mach-O ARM64 nền tảng iPhone, đối chiếu toàn bộ file trong ZIP và metadata/checksum.
- [GitHub Actions run 45539166486](https://github.com/hungtm200401-bot/DAT-LICH/actions/runs/45539166486), attempt 2: SUCCESS. Build Release thực bằng Xcode 16.4 (16F6), SDK iPhoneOS 18.5; preflight, codesign ad-hoc, validation và publish đều đạt.
- Simulator iOS 18.5: iPhone SE 3 (375 × 667) và iPhone 16 Pro Max (440 × 956) PASS. Web view không tràn ngang, có đủ 4 tab, header/tab bar tôn trọng safe area; mỗi máy có đúng một local reminder theo fixture. Đã xem ảnh cả hai máy.
- `npm.cmd run ipa:build` hoàn tất trên Windows: tải artifact, đối chiếu digest/manifest/commit/version/build/origin/bundle/chữ ký rồi lưu vào `IPA/`. IPA 1.3 cũ được giữ ở `IPA/archive/` với tiền tố checksum `09169784`.

Attempt 1 build và Simulator lớn đạt; Simulator nhỏ không tạo được báo cáo vì hai yêu cầu HTTP tới máy chủ local hết thời gian. Đã lưu ảnh/log lỗi, chạy lại riêng job thất bại trên **cùng commit, không sửa code**; lượt chạy lại đạt. Đây là lỗi kết nối trong lần kiểm thử đó; không coi lần thất bại là PASS hoặc bằng chứng lỗi đã được sửa bằng code.

## Delivered artifact

`IPA/HOAN-Admin-iPhone-1.3-build4.ipa`, 221,974 bytes; manifest cùng tên và `IPA/LATEST.json` ghi đầy đủ run/artifact/source.

```text
sourceCommit: 3787d65db6f9a9e25a84fb297580144643c78326
SHA-256: 1c75143de011b0fae144392103e85bbd7b1267dc341c8adfc8a54891a334f9cd
bundleId: vn.hoanmakeup.admin
origin: https://hoan-makeup-artist.hoan-makeup.workers.dev
signing: ad-hoc
apnsEntitlementVerified: false
```

Bằng chứng local (ignored): `outputs/verification/ipa-build-tooling/` chứa diagnostics Xcode, ảnh/JSON Simulator, log lần thất bại và kết quả validation IPA. Báo cáo công cụ tải ở `outputs/ci/ios-build-run.json`.

## Limits

Chưa chạy export ký Apple vì chưa có chứng chỉ/profile/Team có Push. App hiện không có framework hoặc extension nhúng để kiểm chứng ký nested bundle bằng một artifact thực; script đã kiểm tra cú pháp và ký app hiện có trên macOS. Kiểm tra dependency tĩnh chỉ xét tham chiếu trực tiếp của executable, không thay kiểm thử runtime. Không chạy lại bộ nghiệp vụ web vì không sửa app/API/DB/UI. Kết quả Simulator/local reminder và IPA ký thử không chứng minh nhận được APNs khi đóng app; cần cấu hình Apple và máy chủ thật theo `docs/NATIVE_PUSH.md`.
