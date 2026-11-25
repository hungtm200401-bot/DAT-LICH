# Data model
Không đổi business DB.
- SigningInput: certificateBase64/password/profileBase64; chỉ giữ trong môi trường hoặc thư mục riêng của runner.
- ValidatedProfile: UUID hợp lệ, TeamIdentifier 10 ký tự, App ID prefix riêng, bundle ID chính xác không wildcard, aps-environment development/production, expiration tương lai, danh sách thiết bị không rỗng, fingerprint certificate khớp identity.
- TemporaryState: path keychain riêng, search list ban đầu và profile do job tạo; chỉ dùng cleanup, không upload.
- PublishedIPA: hợp đồng manifest hiện có; chỉ signing=signed và apnsEntitlementVerified=true khi export/codesign/entitlement thực đạt. Không đồng nghĩa nhận banner thật.
