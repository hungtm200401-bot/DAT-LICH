# Khắc phục và kiểm thử lại bảo mật — 04/11/2026

**Đã vá SEC-001 đến SEC-008 và xác nhận lại trên bản local.** Bộ kiểm thử thực chạy 103/103 PASS, 0 FAIL, 0 BLOCKED. Chưa nghiệm thu toàn bộ checklist hoặc lớp hosting/domain chưa tồn tại.

## Bản được kiểm

- Lượt cuối: 10:16:14 4/11/26 (Asia/Bangkok), UTC 2026-11-04T03:16:14.328Z.
- Working tree local, HEAD tham chiếu 8fbddb536e4a480f1d32f57d718af8fb87b83fa0; còn các chỉnh sửa cũ chưa commit nên không gọi đây là nguyên trạng commit hoặc bản online.
- Worker SHA-256: 2630a93a7fa0661b8a8f38b6cc225a812d9c7ac8e62d3854fc99c433b50bf27e.
- Client app.js SHA-256: a76c5d21223d0abf897c772e11f9110f1f2d226a46fabe8e92f4fd906e791a8b.
- Lab dùng production build và Worker runtime thật, D1/R2 riêng tại scratch\security-audit-fDWlSx; lab đã đóng. Không ghi khách, lịch hoặc tiền vào DB của chủ website; mọi giao dịch kiểm thử là dữ liệu mô phỏng trong lab.
- Kiểm thêm bản dev thật tại localhost5173 chỉ bằng GET và browser; chặn mọi request ghi của browser kiểm thử, không giữ PII hay khóa trong bằng chứng.

## Kết quả trước/sau

| Hạng mục | Trước vá | Sau vá |
|---|---|---|
| Bộ ca bảo mật ban đầu | 78 PASS / 10 FAIL trên 88 ca | Các ca cũ đạt; bổ sung đối chứng, tổng 103 PASS |
| Build và core suite | Kết quả audit cũ chưa đại diện bản vá | npm.cmd test: build đạt, 154 test, 153 PASS, 1 live-map test cấu hình bỏ qua, 0 FAIL |
| Local dev xác thực | Khóa sai vẫn đọc được dữ liệu admin | Thiếu/sai khóa 401; khóa đúng 200 trên lookup session giả không có bản ghi; Host lạ 403 |
| Browser nghiệp vụ | Có stored XSS tại khách hàng | Chữ HTML nằm nguyên trong bảng và form sửa, không chạy canary; login/logout desktop/mobile đạt |
| npm audit toàn tree | 41 package: 1 Critical, 16 High, 23 Moderate, 1 Low | 20 Moderate, 0 High/Critical/Low |
| npm audit --omit=dev | Chưa chạy ở đợt trước | 0 cảnh báo trong phạm vi npm audit production dependencies |

Đã chạy thêm verify-central-payments.mjs, verify-admin-settings.mjs, verify-admin-operations.mjs: PASS trên dev localhost với API fixture; kiểm thu cọc, thu còn lại, hoàn tiền, retry chống trùng, danh sách, thông báo và cài đặt desktop/mobile. Không có ghi dữ liệu thật.

## Trạng thái từng lỗi

| Mã | Trạng thái trong local | Đã sửa và bằng chứng |
|---|---|---|
| SEC-001 | FIXED / RETEST PASS | Không tin hostname/LAN hay cờ dev; thiếu cấu hình khóa từ chối quyền. Dev bind127.0.0.1, host allowlist và CORS đóng. Worker test cả HOAN_LOCAL_DEV=1, có/không khóa server trên localhost/LAN/IPv6. G03-08.dev-true/false, login-1440/390, after-dev-access.json. |
| SEC-002 | FIXED / RETEST PASS | Code+phone phải khớp trước điền thông tin hoặc ghi request. Thiếu/sai phone 404 và không ghi; đúng chủ tạo201 với receipt chỉ id/status. Availability công khai bỏ code lịch và ghi chú slot. G04-01.request-leak, G04-02.request-other/request-own/consultation. |
| SEC-003 | FIXED / RETEST PASS | Escape tên/phone/email/note ở danh sách khách và tên/note trong input/textarea modal; rà phone/email/note/address/ward của lịch. Canary cũ và note đóng textarea vẫn nguyên văn, không thực thi. G08-02.customers/customer-modal/appointments; CSV vẫn xử lý công thức. |
| SEC-004 | FIXED / RETEST PASS | Ngày thực, leap year, giờ00–23/phút00–59, thời điểm tương lai; kiểm trước ghi tại tạo/sửa lịch, slot và yêu cầu đổi lịch/duyệt yêu cầu. G09-02.invalid-clock/invalid-calendar/request-date/admin-date; unit security calendar. |
| SEC-005 | FIXED / RETEST PASS | Cửa sổ theo ngày Việt Nam, tính cả ngày cuối; vượt hạn400, ngày cuối201, kiểm giá trị cấu hình. G11-02.booking-window/last-window-day; unit qua UTC midnight/year end. |
| SEC-006 | FIXED / RETEST PASS (giả MIME) | Kiểm chữ ký, cấu trúc/ranh giới file và kích thước PNG/JPEG/WebP trước mọi ghi R2; MIME khớp nội dung, giới hạn40MP/12000px mỗi chiều. HTML giảPNG, type lệch, file cụt, kích thước quá lớn bị chặn. Ảnh đúng đọc lại khớp bytes. |
| SEC-007 | FIXED / RETEST PASS (ứng dụng) | Worker đặt nosniff, Referrer-Policy same-origin, SAMEORIGIN và CSP frame-ancestors self/object-src none/base-uri self. Browser chặn origin ngoài; frame preview cùng origin vẫn render. G08-07.framing/preview-self, G08-09.headers. |
| SEC-008 | FIXED / RETEST PASS | JSON hỏng hoặc body null/array/string trả400 an toàn trước truy vấn/mutation. G09-02.malformed-json/body-* |

Giới hạn ảnh: kiểm định bytes/cấu trúc và kích thước, **không tuyên bố đã giải mã đầy đủ hoặc mã hóa lại ảnh**. Chưa có image-processing binding để làm việc đó; ảnh WebP động hiện bị từ chối có chủ đích để tránh chỉ kiểm canvas mà bỏ frame. PNG/JPEG/WebP tĩnh được giữ hỗ trợ.

## Khóa quản trị local

Đã khởi tạo khóa ngẫu nhiên trong **.dev.vars** trên máy này; file đã được ignore, không in khóa ra terminal/chat hoặc đưa vào bundle. Người sở hữu mở file lấy giá trị ADMIN_TOKEN rồi nhập vào màn Đăng nhập quản trị. Khởi động lại dùng npm.cmd run dev; mặc định chỉ máy này truy cập được. Muốn chủ động mở LAN phải cấu hình host rõ và vẫn cần khóa.

Khởi tạo trên máy khác: node scripts/admin-key.mjs --init. Không ghi đè khóa đã có. Production phải đặt ADMIN_TOKEN bằng secret của nền tảng, không mang khóa local lên hosting.

Phiên dùng shared bearer key đã có, chỉ lưu key sau khi server xác minh. Logout xóa key khỏi browser và dữ liệu riêng đang hiển thị; **không phải cơ chế thu hồi server của khóa đã bị sao chép**. Muốn thu hồi phải đổi secret. Không xây mới tài khoản/MFA/refresh-token trong bản vá này.

Bộ build mới có cơ chế Cloudflare xuất file .dev.vars phục vụ preview; hook đóng gói dự án đã loại file đó khỏi dist/server và dist/client. Ca G15-01.no-local-secret-artifact đạt. File gốc local vẫn giữ nguyên và không được publish.

## Dependency đã cập nhật và phần còn lại

Đồng bộ Vite8.3.5, Vinext1.4.3, React/react-dom/react-server-dom-webpack19.3.1, plugin-rsc0.5.37, Cloudflare Vite1.67.0/Wrangler4.156.1, Next/eslint-config-next16.4.5, Zod4.6.7. Các bản vá transitive tương thích được cập nhật trong lockfile; fflate0.7.5 được override trong cùng nhánh0.7 để gỡ pin cũ từ thư viện render ảnh.

Không dùng audit fix --force hay hạ Drizzle/ESLint. npm ls các gói chính không có lỗi peer; build, dev/RSC và browser sau nâng Vinext đều đã chạy.

20 cảnh báo Moderate còn lại nằm ở cây công cụ dev (Drizzle Kit, ESLint và plugin), quy về hai advisory gốc:

- Esbuild0.18.20 trong @esbuild-kit/core-utils của Drizzle CLI: [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99). Vite/Wrangler hiện dùng esbuild0.28.2. Không mở esbuild server này ra mạng; cần nâng chuỗi Drizzle tương thích hoặc thay loader, không ép downgrade theo scanner.
- Minimatch3.1.5/10.2.5 trong ESLint: [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). Bản sửa yêu cầu nhánh11; API/engine của plugin cũ chưa xác minh với override major nên không ép thay toàn cây. Cần nâng đồng bộ tooling ở lần bảo trì tiếp, trước khi cho phép pattern/file từ bên ngoài chạy qua tooling.

Owner theo dõi: developer/chủ dự án; trạng thái OPEN-TOOLING, cần đánh giá khi nâng Drizzle/ESLint. npm audit --omit=dev hiện0, không phải chứng minh website không còn lỗi hay mọi advisory đều không khai thác được.

## Bằng chứng và chạy lại

- outputs/security-audit/before-results.json: 88 ca trước vá; results.json và after-results.json: 103 ca sau vá. after-dev-access.json: bằng chứng local đã che dữ liệu; after-dependencies.json và after-prod-dependencies.json: scanner sau cập nhật.
- npm.cmd test; node scripts/verify-security-audit.mjs (fresh D1/R2, tự đóng); node scripts/verify-local-admin-access.mjs (GET-only live local); npm.cmd audit --json; npm.cmd audit --omit=dev --json.
- Giao diện fixture: TEST_BASE_URL=http://127.0.0.1:5173 rồi chạy ba script verify-central-payments/admin-settings/admin-operations.

## Ma trận ca sau vá

| Mã tiểu ca | Trạng thái | Kết quả |
|---|---|---|
| G04-03.0 | PASS | {"http":401} |
| G04-03.1 | PASS | {"http":401} |
| G04-03.2 | PASS | {"http":401} |
| G08-05.3 | PASS | {"http":401} |
| G04-03.4 | PASS | {"http":401} |
| G04-03.5 | PASS | {"http":401} |
| G04-03.6 | PASS | {"http":401} |
| G08-05.7 | PASS | {"http":401} |
| G04-03.8 | PASS | {"http":401} |
| G04-03.9 | PASS | {"http":401} |
| G04-03.10 | PASS | {"http":401} |
| G08-05.11 | PASS | {"http":401} |
| G04-03.12 | PASS | {"http":401} |
| G04-03.13 | PASS | {"http":401} |
| G04-03.14 | PASS | {"http":401} |
| G08-05.15 | PASS | {"http":401} |
| G04-03.updateAppointment | PASS | {"http":401,"bookingBUnchanged":true} |
| G04-03.deleteAppointment | PASS | {"http":401,"bookingBUnchanged":true} |
| G04-03.setScheduleSlot | PASS | {"http":401,"bookingBUnchanged":true} |
| G04-03.saveContent | PASS | {"http":401,"bookingBUnchanged":true} |
| G04-03.saveService | PASS | {"http":401,"bookingBUnchanged":true} |
| G04-03.deleteService | PASS | {"http":401,"bookingBUnchanged":true} |
| G04-03.resolveRequest | PASS | {"http":401,"bookingBUnchanged":true} |
| G04-03.updateRequest | PASS | {"http":401,"bookingBUnchanged":true} |
| G04-03.deleteRequest | PASS | {"http":401,"bookingBUnchanged":true} |
| G04-03.markNotificationsRead | PASS | {"http":401,"bookingBUnchanged":true} |
| G04-03.recordPayment | PASS | {"http":401,"bookingBUnchanged":true} |
| G04-03.post-site-content | PASS | {"http":401} |
| G04-03.post-cms-resources | PASS | {"http":401} |
| G04-06.PUT | PASS | {"http":405} |
| G04-06.PATCH | PASS | {"http":405} |
| G04-06.DELETE | PASS | {"http":405} |
| G04-05.public-snapshot | PASS | {"http":200,"publicBookingCodesPresent":false} |
| G04-01.lookup-own | PASS | {"http":200} |
| G04-01.lookup-other | PASS | {"http":404} |
| G04-01.request-leak | PASS | {"http":404,"leaked":false,"writes":0} |
| G04-02.request-other | PASS | {"http":404} |
| G04-02.request-own | PASS | {"http":201,"minimized":true} |
| G04-02.consultation | PASS | {"http":201} |
| G09-02.request-date | PASS | {"http":400,"writes":0} |
| G09-02.admin-date | PASS | {"http":400} |
| G04-02.report-other | PASS | {"http":404} |
| G05-01.lookup | PASS | {"testedInputs":2,"http":404} |
| G04-04.booking | PASS | {"http":201,"priceRecalculated":true,"receivedMoney":0} |
| G11-04.slot-race | PASS | {"http":[201,409],"persisted":1} |
| G11-05.booking-replay | PASS | {"http":409} |
| G09-02.invalid-clock | PASS | {"http":400} |
| G09-02.invalid-calendar | PASS | {"http":400} |
| G09-02.past-date | PASS | {"http":400} |
| G09-02.object-name | PASS | {"http":400} |
| G11-02.booking-window | PASS | {"http":400} |
| G11-02.last-window-day | PASS | {"http":201} |
| G09-02.body-null | PASS | {"http":400} |
| G09-02.body-[] | PASS | {"http":400} |
| G09-02.body-"text" | PASS | {"http":400} |
| G11-10.payment-report | PASS | {"http":200,"simulatedReportOnly":true,"ledgerRows":0} |
| G11-03.money--1 | PASS | {"http":400} |
| G11-03.money-0 | PASS | {"http":400} |
| G11-03.money-0.5 | PASS | {"http":400} |
| G11-03.money-1000000001 | PASS | {"http":400} |
| G11-03.money-NaN | PASS | {"http":400} |
| G11-05.payment-replay | PASS | {"http":[201,200],"simulatedOnly":true} |
| G09-08.payment-key-conflict | PASS | {"http":409} |
| G11-03.overpayment | PASS | {"http":409} |
| G11-07.overrefund | PASS | {"http":409} |
| G11-02.fake-received | PASS | {"http":409} |
| G08-05.write-origin | PASS | {"http":401} |
| G09-02.malformed-json | PASS | {"http":400} |
| G14-02.68 | PASS | {"http":200,"cacheControl":"no-store","vary":"Authorization, RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Next-Url, X-Vinext-Interception-Context, X-Vinext-Interception-Id, X-Vinext-Mounted-Slots, X-Vinext-Rsc-Render-Mode, X-Vinext-Rsc-State-Fingerprint"} |
| G14-02.69 | PASS | {"http":200,"cacheControl":"no-store","vary":"Authorization, RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Next-Url, X-Vinext-Interception-Context, X-Vinext-Interception-Id, X-Vinext-Mounted-Slots, X-Vinext-Rsc-Render-Mode, X-Vinext-Rsc-State-Fingerprint"} |
| G14-02.70 | PASS | {"http":200,"cacheControl":"no-store","vary":"Authorization, RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Next-Url, X-Vinext-Interception-Context, X-Vinext-Interception-Id, X-Vinext-Mounted-Slots, X-Vinext-Rsc-Render-Mode, X-Vinext-Rsc-State-Fingerprint"} |
| G14-02.71 | PASS | {"http":200,"cacheControl":"no-store","vary":"Authorization, RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Next-Url, X-Vinext-Interception-Context, X-Vinext-Interception-Id, X-Vinext-Mounted-Slots, X-Vinext-Rsc-Render-Mode, X-Vinext-Rsc-State-Fingerprint"} |
| G08-06.cors | PASS | {"http":401,"allowOrigin":null} |
| G07-02.text/html | PASS | {"http":400} |
| G07-02.image/svg+xml | PASS | {"http":400} |
| G07-01.mime-spoof | PASS | {"http":400} |
| G07-03.object-key | PASS | {"http":404} |
| G07-06.file-count | PASS | {"http":400} |
| G07-05.upload-auth | PASS | {"http":401} |
| G07-01.valid-image | PASS | {"http":[200,200],"exactBytes":true} |
| G07-06.file-size | PASS | {"http":400,"orphanObjects":0} |
| G09-06.pagination | PASS | {"maxRows":10} |
| G12-08.analytics-redaction | PASS | {"http":200,"redactedPath":"/booking/detail","trackingCookieHttpOnly":true} |
| G08-05.analytics-origin | PASS | {"http":403} |
| G01-03.84 | PASS | {"http":404,"type":"text/html; charset=utf-8"} |
| G01-03.85 | PASS | {"http":404,"type":"text/html; charset=utf-8"} |
| G01-03.86 | PASS | {"http":404,"type":"text/html; charset=utf-8"} |
| G01-03.87 | PASS | {"http":404,"type":"text/html; charset=utf-8"} |
| G01-03.88 | PASS | {"http":404,"type":"text/html; charset=utf-8"} |
| G01-03.89 | PASS | {"http":404,"type":"text/html; charset=utf-8"} |
| G08-09.headers | PASS | {"http":200} |
| G15-01.no-local-secret-artifact | PASS | {"localSecretArtifacts":0} |
| G08-02.appointments | PASS | {"canaryExecuted":false} |
| G08-02.customers | PASS | {"canaryExecuted":false} |
| G08-02.customer-modal | PASS | {"canaryExecuted":false,"storedTextPreserved":true} |
| G05-09.csv | PASS | {"formulaEscaped":true} |
| G08-01.search | PASS | {"canaryExecuted":false} |
| G08-07.framing | PASS | {"framed":false} |
| G08-07.preview-self | PASS | {"sameOriginPreview":true} |
| G03-08.login-1440 | PASS | {"width":1440,"login":true,"logout":true} |
| G03-08.login-390 | PASS | {"width":390,"login":true,"logout":true} |
| G03-08.dev-true | PASS | {"devFlag":"1","configuredKey":true,"hostBypasses":0} |
| G03-08.dev-false | PASS | {"devFlag":"1","configuredKey":false,"hostBypasses":0} |

## Giới hạn nghiệm thu

Chỉ kết luận 8 lỗi được vá và retest trong phạm vi local ghi trên. Chưa có domain/hosting nên DNS/TLS/HSTS/CDN/WAF/IAM/backup và log vận hành vẫn BLOCKED; checklist166 tình huống không được coi hoàn tất. Chính sách chống spam/rate limit, thu hồi phiên theo tài khoản, CSP script nonce đầy đủ và tái mã hóa ảnh chưa nằm trong 8 ca khắc phục. Giữ bằng chứng lịch sử; không ghi đè lỗi cũ thành chưa từng tồn tại.
