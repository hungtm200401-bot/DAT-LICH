# Nguồn kỹ thuật

WebKit hỗ trợ Web Push cho ứng dụng trên Màn hình chính từ iOS 16.4. Trình duyệt yêu cầu thao tác trực tiếp để đăng ký thông báo. [WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)

Thư viện mã hóa dùng RFC 8291 và VAPID RFC 8292. Worker gửi tới các máy chủ đẩy đã biết và kiểm tra kết quả. [Thư viện Web Push](https://github.com/block65/webcrypto-web-push/releases/tag/v2.0.0)

Worker có thể gửi sau phản hồi đặt lịch và chạy công việc định kỳ trên Cloudflare. [Cloudflare waitUntil](https://developers.cloudflare.com/workers/runtime-apis/context/) · [Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
