# Validation guide

1. Chạy `node --test tests/shared-online-data.test.mjs`: Vite test server + upstream fixture riêng; booking/readback, auth/revoke, uploads, cookies, CSRF/Host và upstream lỗi.
2. Chạy `npm test`, `npx tsc --noEmit`, kiểm tra browser nghiệp vụ cô lập bằng `npm run verify:business-data` nếu môi trường hỗ trợ.
3. Sao lưu/verify dữ liệu local trước đổi mode. Khởi động `npm run dev`; `/__hoan/runtime` trả online đúng origin IPA; `/api/data` trùng cấu hình công khai upstream; private GET 401 khi chưa đăng nhập. Không tạo lịch/giao dịch production trong tự động hóa.
4. Chủ đăng nhập localhost bằng mật khẩu online; đối chiếu một lịch online có sẵn với app. Ghi rõ khi chưa có phiên để thực hiện bước này.
5. `npm run dev:local`: nhãn local, dữ liệu cũ còn nguyên. Không chạy song song hai mode trên cùng cổng.

## Actual results — 25/11/2026
- `npm.cmd test`: build đạt; 171 bài, 170 đạt, 1 live map tile bỏ qua, 0 lỗi. Bao gồm 14 bài proxy/shared mode (subtests + containers), booking, session/logout, cookie alias, multipart/binary, Host/Origin, encoded API bypass, Windows module path, redirect 307/308 và lỗi/timeout không retry/fallback.
- `tsc --noEmit`, `node --check` app/dev/proxy, `git diff --check`: đạt.
- `npm.cmd run verify:business-data`: Worker/D1 cô lập và Edge desktop/mobile đạt đặt lịch/email, GPS/địa chỉ, tra cứu, thanh toán, archive/restore, 16 mục quản trị web, 4 tác vụ iPhone, khách, đối soát đồng thời, nhắc lịch và logout.
- Edge headless mở trang đăng nhập localhost thực: nhãn online đúng, form mật khẩu hiển thị, không page errors; chặn thao tác ghi trong lần kiểm tra này. Ảnh/JSON ở `outputs/verification/shared-online-data/shared-login.*`.
- Server 5173 hiện chạy shared online. Runtime đúng origin IPA; dịch vụ/brand/settings công khai khớp upstream (không so sánh `serverTime` sinh riêng mỗi request); private GET 401 khi ẩn danh. Explorer báo 0 local D1 và 0 local R2 bindings trong chế độ này.
- `npm run dev` dùng lại đúng source; `--local` khi server online còn chạy bị từ chối, yêu cầu restart.
- Backup AES-GCM đã tạo và kiểm tra giải mã. Dữ liệu local giữ nguyên: 1 lịch, 1 khách, 0 ca, 0 giao dịch và 5 hàng nội dung; hash tất cả hàng trước/sau khớp. Biên bản riêng ở `outputs/verification/shared-online-data/local-before.json` và `local-after.json`; không đưa dữ liệu riêng lên Git.
- Chủ đăng nhập bằng mật khẩu online trên localhost và xác nhận danh sách giống app.
- Sau yêu cầu riêng của chủ tạo clone để kiểm tra iPhone, đã tạo đúng 1 lịch TEST từ localhost qua shared backend: `HMA-251126-A4437CACA4FB`, ngày 25/11/2026 lúc 20:00, pending, deposit=0. Tra cứu trực tiếp upstream trả đúng mã; chủ xác nhận đã thấy trong Duyệt lịch trên iPhone. Không gửi SMS, không ghi giao dịch thật. Lịch TEST vẫn giữ pending; không tự hủy hoặc duyệt.

## Limits
- Đồng bộ dữ liệu đã được kiểm chứng; banner khi app đóng chưa hoạt động. IPA build 4 dùng ad-hoc, chưa xác minh entitlement APNs; chủ đang dùng Apple ID miễn phí qua Sideloadly. Production vẫn là `admin-web-push-2`, endpoint native push 404. Cần bản ký có quyền Push và triển khai/cấu hình APNs; xem `docs/NATIVE_PUSH.md`.
- Dữ liệu local cũ không tự nhập online. Các lịch trong app vẫn cần đúng mục/trạng thái/ngày và mở/làm mới để đọc dữ liệu mới.
- Các spec/checklist/task không thay thế log hoặc kiểm thử runtime ở trên.
