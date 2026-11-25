# Build IPA HOÀN

## Windows

Sau khi commit và push nhánh cần build, mở `scripts/windows/TAO_IPA.bat`, hoặc chạy tại thư mục gốc:

```powershell
npm.cmd run ipa:build
```

Công cụ kiểm tra nguồn, chạy GitHub Actions trên macOS, chờ Xcode và hai Simulator đạt rồi tải IPA vào `IPA/`. Bản trước được chuyển vào `IPA/archive/`. Đăng nhập GitHub được lấy từ Git Credential Manager hoặc `GH_TOKEN`; không lưu token vào dự án. Nếu chưa cài thư viện, launcher chạy `npm ci --include=dev`.

Kiểm tra trước mà chưa build:

```powershell
npm.cmd run ipa:check
npm.cmd run ipa:build -- --help
```

`ipa:check` cần Python 3.9 trở lên. Khi chạy `ipa:build` trên máy chưa có Python, bước này được chuyển sang GitHub để vẫn build được bằng Windows. Phiên bản/build nằm ở `ios/HoanAdmin.xcconfig`. Máy chủ và bundle ID tải về phải khớp cấu hình đó. Giữ mã nguồn nguyên trạng trong lúc đang chờ build; nếu đổi commit hoặc sửa file, công cụ giữ IPA cũ và yêu cầu build lại đúng nguồn.

## Mac

```bash
bash ios/build-ipa.sh
# Tên đầu ra riêng:
bash ios/build-ipa.sh IPA/HOAN-test.ipa
```

Build trực tiếp có thay đổi chưa commit sẽ được đóng dấu nguồn với hậu tố `-dirty`; CI dùng commit đầy đủ. Build có chữ ký Apple vẫn qua `bash ios/build-ipa.sh --signed`, theo [hướng dẫn APNs](NATIVE_PUSH.md). Nhánh ký Apple giữ chữ ký do Xcode xuất, kiểm tra Team ID/môi trường/quyền Push trước khi ghi manifest.

Để ký bằng bộ certificate/profile được cấp phép trên GitHub, dùng [luồng Apple Signed](IPA_SIGNED_GITHUB.md). Trong **HOAN Admin iPhone → Run workflow**, bật `sign_with_apple`. Luồng này kiểm tra profile và chữ ký thực, không chuyển sang IPA ký thử khi thiếu bộ ký.

## Các bước kiểm tra được dùng chung

- `ios/ipa_bundle.py`: đối chiếu file Swift với Sources của target HoanAdmin, kiểm tra metadata không còn biến Xcode chưa mở rộng, executable trong bundle, ARM64 đúng nền tảng iPhone và các dependency bắt buộc được tham chiếu trực tiếp. Thư viện hệ thống và dependency weak được xử lý riêng.
- `ios/sign-adhoc-bundle.sh`: ký code con, framework, extension rồi tới app; xác minh signature sau cùng. Chỉ dùng cho bản ký thử.
- `ios/write-build-manifest.py`: kiểm tra CRC và toàn bộ file trong ZIP khớp staged app sau ký; ghi version/build/commit/SHA-256/loại chữ ký. Validator và manifest phải thành công trước khi thay IPA đích.
- `scripts/check-ios-build.mjs`: chạy preflight, fixture hồi quy và kiểm tra cú pháp Bash khi có.

Mỗi build có DerivedData riêng nên không đóng gói lại app cũ nếu Xcode thất bại. IPA được thay bằng file hoàn chỉnh trên cùng filesystem. IPA và JSON là hai file riêng; công cụ tải vẫn đối chiếu checksum để phát hiện cặp không khớp.

Log, phiên bản Xcode và kết quả validation ở `outputs/hoan-admin-app/ios/build/`; có thể đổi bằng `HOAN_BUILD_LOG_DIR`. GitHub giữ chúng trong artifact **iPhone-Build-Diagnostics** kể cả khi bước build lỗi. Artifact **HOAN-Admin-iPhone** chỉ xuất khi build/đóng gói thành công.

## Tham khảo Husk

Đã rà soát [Leviidev/Husk, commit 29abb512](https://github.com/Leviidev/Husk/tree/29abb512d81bf8cc08babcbe7f7007cb557208ef), đặc biệt [package_ipa.sh](https://github.com/Leviidev/Husk/blob/29abb512d81bf8cc08babcbe7f7007cb557208ef/scripts/package_ipa.sh). Các nguyên tắc hữu ích được áp dụng: kiểm tra bundle trước đóng gói, chặn binary cũ, dấu nguồn build, ký từ trong ra ngoài và xuất file hoàn chỉnh.

Husk công bố theo GPL-2.0; không chép nguyên script hoặc mã runtime của Husk vào app HOÀN. Công cụ Python/Node ở đây được viết riêng cho cấu trúc HOÀN; không cần QEMU, Rust, XcodeGen, JIT hoặc tài nguyên game của Husk. Cách build ký thử không tự cấp quyền APNs; trạng thái chữ ký được ghi đúng trong manifest.
