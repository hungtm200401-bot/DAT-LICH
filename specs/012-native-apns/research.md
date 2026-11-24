# Research

- Decision: APNs alert qua fetch Worker production, JWT ES256 bằng jose, cache 40 phút và gom các yêu cầu ký đồng thời. Rationale: Workers node:http2 không triển khai; proxy production hỗ trợ H2. Local test phải mô phỏng outboundService. Không thêm gateway khi chưa có nhu cầu.
- Decision: Bảng APNs tách Web Push, cùng sự kiện lịch đã commit. Rationale: tránh thay FK và khóa mã hóa Web Push. Retry 429/5xx; 5xx chờ ít nhất 15 phút, tối đa tám lần và TTL 24 giờ. 410 thu hồi đúng phiên bản đăng ký.
- Decision: Generation gắn admin key/team/bundle/environment, không gắn private key/Key ID. Rationale: rotate khóa gửi trong cùng team không làm mất đăng ký máy đang offline; provider JWT cache vẫn theo toàn bộ cấu hình.
- Decision: APNs chỉ báo lịch mới; nhắc 24 giờ vẫn local. Rationale: tránh thông báo trùng.
- Decision: Cầu nối WKWebView dùng cookie tại cùng origin, token không ghi localStorage; .p8 không nằm trong app. Đọc entitlement bằng SecTask không phải API iOS công khai, dùng callback đăng ký Apple và kiểm tra chữ ký sau export.
- Deployment dependency: Apple ID miễn phí không có Push capability. Bản ký có capability, key .p8/Team/Key ID và Worker deploy là điều kiện nghiệm thu thiết bị thật; không coi mock là live proof.

Sources: https://developer.apple.com/documentation/usernotifications/registering-your-app-with-apns ; https://developer.apple.com/documentation/usernotifications/establishing-a-token-based-connection-to-apns ; https://developer.apple.com/documentation/usernotifications/sending-notification-requests-to-apns ; https://developer.apple.com/documentation/usernotifications/handling-notification-responses-from-apns ; https://github.com/cloudflare/workerd/issues/4841 ; https://developers.cloudflare.com/workers/runtime-apis/nodejs/ .
