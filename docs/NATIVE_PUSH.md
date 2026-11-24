# Thông báo lịch mới trong IPA HOÀN

Bản 1.3 (build 4) bổ sung APNs cho IPA: web lưu lịch mới → máy chủ xếp việc gửi → Apple chuyển thông báo đến iPhone khi app đóng. Chạm thông báo mở đúng lịch sau khi đăng nhập. Thông báo màn hình khóa không chứa tên hay số điện thoại khách.

## Điều kiện nhận thật

- App ID chính xác có Push Notifications và provisioning profile thuộc Apple Developer Program có quyền Push. Apple ID miễn phí qua Sideloadly không cấp quyền này.
- Khóa APNs `.p8`, Key ID, Team ID và bundle ID của app. Khóa phải có quyền cho đúng môi trường.
- Worker online đã có migration `0012_admin_apns.sql`, secret cấu hình và cron mỗi phút. Web và IPA phải cùng origin/D1.

Không cần chuyển sang web app. Nhắc lịch đã xác nhận trước 24 giờ vẫn dùng luồng local hiện có để tránh nhắc hai lần. Nhận thông báo lịch mới không yêu cầu khai báo chạy nền hay mở app liên tục.

## Cấu hình Worker

Giữ nguyên `ADMIN_TOKEN` và cấu hình Web Push nếu đang dùng. Tạo một secret `HOAN_APNS_CONFIG` có cấu trúc sau (điền thông tin thật trong giao diện secret Cloudflare hoặc qua stdin của Wrangler):

```json
{
  "teamId": "TEAMID0000",
  "keyId": "KEYID00000",
  "bundleId": "vn.hoanmakeup.admin",
  "environment": "production",
  "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
}
```

`environment` là `production` hoặc `development`, khớp quyền `aps-environment` trong chữ ký và trường `HoanPushEnvironment` của app. Môi trường là quyết định của provisioning profile, không suy ra từ tên Debug/Release. Không đưa `.p8`, `.p12`, profile hoặc giá trị secret vào Git, dòng lệnh, log hay IPA.

Trước deploy: sao lưu D1 theo `docs/BAO_VE_DU_LIEU.md`; chạy `0012_admin_apns.sql` trên đúng DB qua Wrangler với tên/ID thật của tài khoản. Migration chỉ thêm bảng/index và chạy lại an toàn. Deploy build mới sau migration và đặt secret bằng giao diện Cloudflare. Giữ cron `* * * * *` trong `wrangler.jsonc`.

Rollback bằng code trước đó không sửa lịch, khách hoặc giao dịch; giữ bảng APNs để không mất hồ sơ gửi. Đổi khóa APNs trong cùng Team ID không làm mất đăng ký. Đổi khóa quản trị, Team ID, bundle ID hoặc môi trường yêu cầu iPhone mở app và đăng ký lại.

## Xuất IPA đã ký trên Mac

Mở `ios/HoanAdmin.xcodeproj`, chọn Team có quyền Push, kiểm tra bundle ID và capabilities. Cách CLI, sau khi đăng nhập Apple Developer trong Xcode:

```bash
export HOAN_DEVELOPMENT_TEAM=YOURTEAMID
export HOAN_APNS_ENVIRONMENT=production
export HOAN_EXPORT_METHOD=release-testing
# Khi cần, đặt HOAN_APP_BUNDLE_ID và HOAN_ADMIN_ORIGIN phù hợp bản triển khai.
bash ios/build-ipa.sh --signed
```

Team ID là 10 ký tự; ví dụ trên là placeholder. `release-testing` dùng profile phân phối cho thiết bị đã đăng ký; `debugging` thường có môi trường `development`. Script so sánh Team ID, entitlement APNs sau export và môi trường app; sai sẽ dừng thay vì trả bản cài tưởng đã hỗ trợ Push. Các bản được giữ trong `IPA/`, ví dụ: `IPA/HOAN-Admin-iPhone-1.3-build4-production-signed.ipa`.

`bash ios/build-ipa.sh` và artifact mặc định của GitHub Actions vẫn là gói dùng chữ ký kiểm tra để ký lại. Đó không phải bản đã có quyền nhận APNs. Ký lại bằng Apple ID miễn phí không bổ sung được quyền Push. Nếu dùng dịch vụ ký, họ phải giữ capability, bundle ID và môi trường đúng với Worker.

## Kiểm tra trên iPhone

1. Cài bản có chữ ký đúng, mở IPA và đăng nhập quản trị.
2. Vào **Thông báo**, bấm **Bật báo lịch mới**, chọn **Cho phép**. App chỉ báo đã bật sau khi Apple trả token và máy chủ lưu đăng ký.
3. Bấm **Gửi thử**. “Đã gửi yêu cầu thử tới Apple” chỉ có nghĩa Apple nhận yêu cầu, chưa chứng minh banner đã hiện; kiểm tra quyền thông báo/Chế độ tập trung trên máy nếu cần.
4. Khóa màn hình/đóng app, đặt một lịch TEST từ web trên thiết bị khác. Kiểm tra thông báo và chạm mở đúng mã lịch. Thử cả app đang chạy và cold start, phiên đăng nhập còn hạn và hết hạn.
5. Bấm **Tắt báo lịch mới** hoặc đăng xuất; tạo lịch khác và xác nhận iPhone đó không còn nhận. Mỗi iPhone có đăng ký riêng; hết hạn phiên tự nhiên không tự tắt Push.

API chỉ chấp nhận đăng ký/gửi thử sau xác thực admin và same-origin; installation cookie riêng là HttpOnly. Lịch được lưu độc lập với việc gửi. Lỗi mạng/5xx chờ ít nhất 15 phút rồi backoff, tối đa 8 lần trong 24 giờ; 429 cũng backoff. Cron hồi phục sự kiện đã commit nhưng tác vụ gửi bị ngắt. Token 410 bị thu hồi có kiểm tra phiên bản để tránh xóa token mới. Có thể xem `last_status`, `last_reason` trong `admin_apns_jobs` để chẩn đoán, không cần xuất token hoặc secret.

## Kiểm thử tự động

```powershell
npm.cmd test
npm.cmd run verify:native-push
node scripts/verify-admin-web-push.mjs
```

Bài APNs dùng D1 cô lập, khóa ES256 kiểm thử và dịch vụ Apple mô phỏng; không gửi đến người dùng thật. Bao gồm quyền, token khác độ dài, JWT, gửi sau đặt lịch, hồi phục cron, backoff, hủy trước retry, đổi token và logout. Build iOS/Simulator cần macOS; xác minh nhận APNs thật cần Worker production và iPhone có quyền Push.

Nguồn: [đăng ký APNs](https://developer.apple.com/documentation/usernotifications/registering-your-app-with-apns), [gửi yêu cầu](https://developer.apple.com/documentation/usernotifications/sending-notification-requests-to-apns), [môi trường chữ ký](https://developer.apple.com/documentation/bundleresources/entitlements/aps-environment), [HTTP/2 của Worker production](https://github.com/cloudflare/workerd/issues/4841).
