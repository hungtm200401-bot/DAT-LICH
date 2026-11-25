# Research decisions

## Một backend qua proxy dev
Decision: chuyển `/api/` tới HTTPS origin hiện có; frontend, HMR và tài nguyên tĩnh vẫn phục vụ local. Không đọc remote D1 trực tiếp.
Rationale: giữ kiểm tra lịch, auth, real payments, migrations và R2 tại đúng backend mà app dùng. Upload trả `/api/uploads?key=...`, nên cùng rule bao phủ ảnh. Không có backend OAuth redirect; Google GIS cần authorized localhost origin nếu bật.
Alternatives: đồng bộ SQLite hai chiều gây xung đột lịch/giao dịch; remote D1 trong local Worker giữ auth/secret khác và gây lệch phiên; CORS trực tiếp thay đổi server production và phụ thuộc third-party cookies.
Sources: [Vite server.proxy](https://vite.dev/config/server-options#server-proxy), mã `app/api/uploads/route.ts`, `public/app.js`, `lib/site-admin.ts`. Research agent shared_backend_research rà soát read-only theo speckit-plan.

## Phiên và CSRF
Decision: whitelist upstream cookies `__Host-hoan_admin`, `__Host-hoan_push`, `__Host-hoan_native_push`, `hoan_visit`, ánh xạ sang alias local riêng, HttpOnly, Path=/, SameSite=Strict; bỏ Secure chỉ trên HTTP loopback. Đổi lại tên cookie và Origin/Referer chỉ sau khi xác minh Host/Origin/Sec-Fetch-Site và kết nối loopback hợp lệ. Không forward local cookie cũ, Authorization, CF/forwarded headers do client gửi.
Rationale: upstream vẫn kiểm tra session đúng secret/D1. Cookie Secure có ngoại lệ localhost không đồng nhất giữa browser; alias riêng không mạo danh __Host cookie trên HTTP. Không bypass auth hoặc chia sẻ mật khẩu.
Sources: [MDN cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies), [Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie), `lib/admin-authorization.mjs`.

## Lỗi và môi trường
Decision: proxy timeout, không follow redirects, không retry, lỗi 502/504 không fallback; runtime descriptor và response header nguồn cho frontend/reuse server. Direct Vite CLI vẫn local để CI/test không dùng production. Shared mode chỉ bind loopback và từ chối LAN/tunnel. SW dev tiếp tục tự unregister; không hứa Web Push local.
Rationale: tránh lưu nhầm nơi hoặc ghi trùng thanh toán/lịch khi mạng lỗi. Source of truth không đổi.
All material unknowns resolved. Còn phụ thuộc mật khẩu online do chủ nhập để kiểm tra dữ liệu riêng trên production; test fixture xác minh phiên đầy đủ.

## Review follow-up
Research review phát hiện redirect ngoại origin vẫn có thể khiến browser phát lại POST 307/308 dù Node không follow; đã chọn trả 502 không Location, chỉ rewrite same-origin. Guard từ chối encoded separators/double encoding; shared mode không gắn D1/R2 local, nên không có local DB để dùng nếu route bị miss. Kiểm thử hồi quy thực tế được bổ sung; review không thay cho runtime tests.
