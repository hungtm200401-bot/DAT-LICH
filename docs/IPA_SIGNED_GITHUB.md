# IPA HOÀN có quyền Push trên GitHub

GitHub cung cấp mã và máy macOS để tự động kiểm tra/ký/build. Bộ ký vẫn phải được Apple cấp cho Team được phép ký app HOÀN. Công cụ này không biến bộ ký Apple ID miễn phí hoặc chứng chỉ app khác thành quyền Push cho HOÀN.

## Đầu vào cần chuẩn bị một lần

Trong repo GitHub → **Settings → Secrets and variables → Actions**, tạo ba repository secrets:

| Secret | Nội dung |
| --- | --- |
| `IOS_CERTIFICATE_BASE64` | File `.p12` có certificate và private key, mã hóa Base64 |
| `IOS_CERTIFICATE_PASSWORD` | Mật khẩu bảo vệ `.p12` |
| `IOS_PROVISIONING_PROFILE_BASE64` | File `.mobileprovision` có Push, mã hóa Base64 |

Profile phải còn hạn, dành chính xác cho bundle ID của HOÀN và chứa iPhone thử nghiệm. Mặc định là `vn.hoanmakeup.admin`. Profile development dùng môi trường `development`; Ad Hoc dùng `production`. Nếu đổi bundle ID, cấu hình APNs của Worker phải đổi tương ứng. Không lấy Team ID làm App ID prefix: các Team cũ có thể dùng prefix khác.

Ví dụ đưa Base64 của file do bạn được phép sử dụng vào clipboard trên Windows, rồi dán trực tiếp vào GitHub Secret:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\duong-dan-rieng\certificate.p12')) | Set-Clipboard
# Lặp lại với file .mobileprovision cho secret profile.
```

Không đưa nội dung khóa vào Git, issue hoặc chat. Khóa APNs `.p8`, Key ID và Team ID **chỉ cấu hình tại Worker**, theo [NATIVE_PUSH.md](NATIVE_PUSH.md); chúng không cần có trong job ký IPA.

## Chạy build

1. Mở **Actions → HOAN Admin iPhone → Run workflow**.
2. Chọn nhánh chứa công cụ (`codex/ios-signed-ci` khi chưa merge).
3. Bật `sign_with_apple`, chọn `apns_environment` và nhập `bundle_id` khớp profile/Worker.
4. Chạy workflow. Thiếu đầu vào hoặc validation không đạt thì dừng, không xuất bản ký thử thay thế.
5. Khi thành công, tải artifact **HOAN-Admin-iPhone-Signed**, gồm `*-signed.ipa` và manifest cùng tên. Giữ các file này trong `IPA/`.

`npm.cmd run ipa:build` hiện vẫn tải bản ký thử theo quy trình cũ; muốn bản ký Apple hãy chọn workflow như trên. Profile CI hiện chỉ dành cho thiết bị đã đăng ký, chưa hỗ trợ export App Store hoặc Enterprise.

## Công cụ kiểm tra gì

- Đủ bộ ký và đúng Base64; chỉ báo tên secret thiếu, không in giá trị.
- Import private key vào keychain tạm, chỉ chọn identity còn được `security` công nhận; fingerprint certificate phải có trong profile.
- Profile đúng UUID/Team/app ID, có quyền Push và môi trường khớp, chưa hết hạn và có thiết bị đăng ký.
- Archive/export dùng Manual signing, UUID và certificate fingerprint rõ ràng; không tự gọi Apple để sửa profile.
- Sau export: xác minh codesign, certificate thật của signature, entitlement, Info.plist và profile nhúng; tiếp đó kiểm bundle/ZIP/checksum theo quy trình hiện có.
- Khóa/profile tạm được dọn trong `finally` và bước `always()`; không upload keychain, profile giải mã, archive hoặc log ký. Job dùng GitHub-hosted runner riêng, không phải máy tự host dùng chung.

Kiểm tra metadata không thay xác minh chữ ký Apple. Xcode/codesign phải đạt trước khi có artifact. App hiện chỉ có một target; nếu thêm extension phải bổ sung profile và mapping riêng trước khi dùng job này.

## Cài và kiểm chứng trên iPhone

Cài bản IPA đã ký lên iPhone được profile cho phép, giữ chữ ký đó. Nếu ký lại bằng Apple ID miễn phí trong Sideloadly, bản cài sẽ mất quyền Push cần thiết.

Mở HOÀN, đăng nhập, bật **Báo lịch mới** và cho phép thông báo. Kiểm tra **Gửi thử**, sau đó vuốt tắt app, khóa màn hình và đặt một lịch TEST từ web. Chỉ khi iPhone hiện banner và chạm mở đúng lịch mới xác nhận hoàn tất mục tiêu. Manifest có `apnsEntitlementVerified: true` chỉ xác minh quyền ký, chưa chứng minh Worker đã cấu hình khóa hoặc điện thoại đã nhận.

## Kiểm tra công cụ

```powershell
node scripts/check-ios-build.mjs
python -X utf8 ios/ci_signed_build.py --check-secrets
```

Lệnh thứ hai sẽ báo đủ tên đầu vào còn thiếu nếu chưa có secrets trong môi trường. Trên Windows, kiểm keychain thật được skip; workflow chạy nó trên macOS, với một p12 hỏng có chủ ý để xác minh cleanup. Test này không tạo chứng chỉ Apple thật hoặc gửi Push thật.

## Nguồn tham khảo

- [GitHub: ký ứng dụng Xcode bằng certificate/profile và keychain tạm](https://docs.github.com/en/actions/how-tos/deploy/deploy-to-third-party-platforms/sign-xcode-applications).
- [Apple TN3125: profile, Team và App ID prefix](https://developer.apple.com/documentation/technotes/tn3125-inside-code-signing-provisioning-profiles).
- [Fastlane match](https://docs.fastlane.tools/actions/match/) cũng tự động quản lý bộ ký trong storage riêng được phép truy cập. Chưa thêm Fastlane vì công cụ hiện tại có thể ký một target mà không cần thêm Ruby/storage.
- Cách đóng gói được tham khảo từ [Husk](IPA_BUILD.md#tham-khảo-husk); code ký CI được viết cho HOÀN theo công cụ Apple/GitHub, không sao chép khóa hoặc runtime của dự án khác.
