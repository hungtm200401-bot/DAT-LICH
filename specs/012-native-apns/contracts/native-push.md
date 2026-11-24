# Native Push contract

GET /api/admin-native-push: admin session; {available,enabled,environment?}.
POST cùng endpoint: authenticated, same-origin, safe transport, max4096 bytes. action subscribe + token even hex64..512 + environment development|production. 201 sau khi lưu đăng ký và session còn hiệu lực trong giao dịch. action test cần own installation cookie; accepted=true nghĩa APNs nhận yêu cầu, không khẳng định iPhone đã hiển thị.
DELETE: same-origin transport, thu hồi installation cookie kể cả khi phiên hết hạn; không chấp nhận ID tùy ý. Logout xóa theo session_hash và cookie, chặn race subscribe commit trước response.
Cookie __Host-hoan_native_push (HTTPS) / hoan_native_push_local (local), HttpOnly SameSite=Strict path=/; hạn một năm, random32 bytes; DB ID SHA256.
Bridge hoanNativePush: sync,unauthenticated,enable,test,disable,logout; chỉ main frame tại origin đã cấu hình và route admin. State callback window.HoanMobileAdmin.setNativePushStatus. Payload chạm: kind booking và code, không URL; xác minh lại phiên và hydrate thành công trước khi tiêu thụ pending code.
