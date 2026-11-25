# Validation
1. `node scripts/check-ios-build.mjs`: fixture bundle cũ và signing mới; cú pháp Bash.
2. actionlint kiểm cả `.github/workflows/ios.yml` và `ios-signed.yml`.
3. Push branch: job checks chạy trên macOS, không dùng bộ ký Apple.
4. Chạy `ios.yml` bằng workflow_dispatch với `sign_with_apple=true`, không có secrets: job ký phải fail trước import/build và không có artifact IPA.
5. Với bộ ký thật: import, validate, archive/export/codesign, đối chiếu profile nhúng và manifest; cài trên iPhone được profile cho phép, bật Push và thử khi đã vuốt tắt app.

## Actual results — 2026-11-25
Code được kiểm: `656078afc4b1760b354b60038d1bf152cd16fe60`, nhánh `codex/ios-signed-ci`. Commit sau đó chỉ ghi kết quả Spec Kit.

- Windows: 41 unittest, 39 PASS và 2 skip vì cần công cụ macOS; đủ 5 Swift trong target; Bash syntax cả 4 script PASS.
- actionlint v1.7.12 (official release, checksum verified): PASS cả hai workflow; git diff --check PASS.
- Fixture đã viết trước implementation và ban đầu fail vì chưa có module.
- [Push checks run 45571273794](https://github.com/hungtm200401-bot/DAT-LICH/actions/runs/45571273794): SUCCESS trên macos-15, 41 unittest PASS, không skip. Bao gồm tạo keychain thật → nhập p12 hỏng có chủ ý → khôi phục search list/xóa keychain; kiểm lệnh codesign trích certificate công khai của Xcode.app. Certificate đó chỉ được đọc để kiểm CLI, không dùng ký HOÀN.
- [Signed-mode run 45571333130](https://github.com/hungtm200401-bot/DAT-LICH/actions/runs/45571333130): checks SUCCESS; job signed FAILURE có chủ ý tại Check authorized Apple signing inputs. Log ghi đúng ba tên: IOS_CERTIFICATE_BASE64, IOS_CERTIFICATE_PASSWORD, IOS_PROVISIONING_PROFILE_BASE64. Import/build/upload bị skip; cleanup SUCCESS; API artifact trả count=0. Đây là xác minh đường lỗi, không phải build ký thành công.
- Các lượt build ký thử/Simulator tự kích hoạt bởi push đã được hủy để chạy lượt kiểm riêng ở chế độ ký Apple. Không dùng chúng làm bằng chứng runtime ứng dụng.
- Research/code review độc lập không thấy blocker khác; đây không thay thế kết quả chạy kiểm tra.

## Evidence
Local ignored: outputs/verification/ios-signed-ci/ trong worktree chính chứa macos-checks.log, signed-input-gate.json, missing-inputs.log và gate-artifacts.json. Bản IPA 1.3 đang có không bị thay bằng bản ký thử mới.

## Remaining acceptance
T009 chưa đạt: chưa có p12/profile Apple được cấp phép, nên chưa archive/export với chữ ký Apple thật, chưa xác minh cài được hoặc nhận banner APNs trên iPhone iOS 26.6.1. Mục tiêu cuối cùng vẫn cần bộ ký đó và cấu hình APNs trên Worker. Không sửa nghiệp vụ, app UI/API/DB hoặc phần Telegram của chủ; không chạy lại bộ nghiệp vụ web cho thay đổi công cụ này.
