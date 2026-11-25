# Research
## Quyền Apple và nguồn mở
**Decision**: Giữ APNs trực tiếp đang có, bổ sung công cụ ký; không lấy khóa công khai của app khác.
**Rationale**: Husk build unsigned/ad-hoc; OneSignal/Firebase/Paje vẫn yêu cầu quyền Apple. Chỉ source code không tạo được entitlement được Apple cho phép.
**Alternatives**: Bark/Telegram/PWA không đáp ứng yêu cầu giữ đúng IPA và thông báo từ HOÀN. Chạy nền/poll/JIT không đáp ứng sau khi vuốt tắt hẳn.
## Ký CI
**Decision**: Dùng cách keychain tạm + profile của GitHub, Manual archive/export.
**Rationale**: Automatic + allowProvisioningUpdates cần tài khoản; CI có p12/profile đã cấp thì nên ký offline rõ ràng. Profile mapping theo UUID, certificate theo fingerprint.
**Alternatives**: Fastlane match hợp lệ nhưng cần thêm Ruby/storage và vẫn cần account/team được phép. Chưa cần thêm dependency.
## Profile
**Decision**: So TeamIdentifier riêng với App ID prefix; cert fingerprint phải có trong DeveloperCertificates và keychain có private key. Profile có thiết bị đăng ký, còn hạn, khớp app/environment. Đối chiếu profile nhúng sau export.
**Rationale**: Legacy App ID prefix không luôn bằng Team ID. Không cần in profile/UDID để xác minh.
## Sources
- https://docs.github.com/en/actions/how-tos/deploy/deploy-to-third-party-platforms/sign-xcode-applications
- https://docs.fastlane.tools/actions/match/
- https://developer.apple.com/documentation/technotes/tn3125-inside-code-signing-provisioning-profiles
- https://developer.apple.com/documentation/xcode-release-notes/xcode-16-release-notes
- https://developer.apple.com/documentation/usernotifications/registering-your-app-with-apns
Research theo speckit-plan đã được agent apns_research đối chiếu độc lập; không sửa file.
