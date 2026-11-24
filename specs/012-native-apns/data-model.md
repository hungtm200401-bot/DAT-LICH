# Data model

admin_apns_installations: id SHA256 installation cookie; generation HMAC admin key + team/topic/environment; session_hash của phiên dùng đăng ký (không FK để giữ thông báo khi phiên hết hạn tự nhiên); device_token lowercase even-length hex 64–512; environment development|production; unique(device_token,environment); created_at/updated_at ms. Không lưu endpoint tùy ý hoặc tên/số điện thoại khách.

admin_apns_jobs: installation_id FK CASCADE; event_key booking:CODE; appointment_code; next_attempt_at,expires_at ms; attempts 0..8; done 0|1; last_status,last_reason chẩn đoán không chứa credential. PK(installation_id,event_key). Lease 45 giây; chỉ gửi khi booking còn hiệu lực và generation hợp lệ.

Rotation: đổi token/environment xóa jobs cũ trước upsert; response muộn dùng token + updated_at guard. Logout/tắt xóa installation và jobs. Đổi admin key làm generation cũ ngừng nhận. Rotate khóa gửi cùng team không vô hiệu thiết bị.

Logout xóa theo cả installation cookie và session_hash: subscribe có thể commit trước khi Set-Cookie tới máy, nên chỉ dùng cookie không đủ chống race.
