# Báo cáo kiểm thử bảo mật HOÀN — 04/11/2026

> Cập nhật sau khắc phục: SEC-001–SEC-008 đã vá và retest local đạt 103/103 ca; npm audit không còn High/Critical. Xem [báo cáo bản vá](Khac_Phu_Bao_Mat_2026-11-04.md). Nội dung và số liệu trước vá bên dưới được giữ làm lịch sử. Chưa nghiệm thu toàn bộ website/hosting.

**Kết luận của đợt TRƯỚC VÁ: chưa đạt điều kiện đưa website ra công khai.** Xác nhận 3 vấn đề ưu tiên High trong phạm vi được kiểm: quyền quản trị ở dev, lộ dữ liệu qua yêu cầu hỗ trợ và stored XSS tại Khách hàng. Không có kết luận đã kiểm hết hoặc website không còn lỗ hổng.

## Phạm vi và phiên bản

- Chủ website xác nhận chưa có domain. Kiểm một lượt đọc trên bản dev localhost và chạy trực tiếp API/browser của bản build production trên máy, bằng Miniflare/Cloudflare Workers runtime với D1 và R2 riêng hoàn toàn.
- Thời điểm lượt cuối: 09:49:17 4/11/26 (Asia/Bangkok); UTC: 2026-11-04T02:49:17.051Z.
- HEAD tham chiếu: 8fbddb536e4a480f1d32f57d718af8fb87b83fa0. Working tree có thay đổi chưa commit; đây là **bản build từ working tree**, không được gọi là bản production đang online hay nguyên trạng Git HEAD.
- Worker SHA-256: `d0291b34f90d25cfd7579d7b5387bf1fed8ec3f69997decff1c4d5272a344e71`.
- JS giao diện được kiểm: `15d5ba2d9da250308fb9b7ab11eb8d4425e5cd04c3d083a190704672e05d2491`.
- Lab: `http://127.0.0.1:61105` (đã tắt sau test); state riêng: `scratch\security-audit-v2Q0rS`, nằm trong scratch ignored.
- Lab đặt HOAN_LOCAL_DEV=0 và một ADMIN_TOKEN ngẫu nhiên chỉ tồn tại trong bộ test. Các request ghi dùng DB/R2 mới; HTTP/API thật, không mock response nghiệp vụ. Outbound bị chặn để không gọi dịch vụ thật. Browser chạy Edge headless; production service worker bị tắt trong các ca này.
- Dev thật: GET /api/data với khóa cố ý sai trả 200; phát hiện private collection và trường PII. Chỉ lưu bool/số lượng, dừng các probe dev tiếp theo, không ghi/đổi/xóa bản ghi hoặc lưu tên/phone/token thật vào bằng chứng.
- Không thử tải cao, brute-force, đăng ký tài nguyên DNS, gửi email/SMS, giao dịch ngân hàng thật hoặc tác động hệ thống khác.

## Số liệu thực chạy

| Bộ kiểm tra | Kết quả |
|---|---|
| Tiểu ca HTTP/browser trong lab | 88: **78 PASS, 10 FAIL, 0 BLOCKED** |
| Yêu cầu do HTTP helper ghi nhận | 111; không tính request tải tài nguyên của browser/PNG đọc đối chứng |
| Dev thật | 1 lượt đọc; xác nhận cơ chế bỏ qua khóa ở môi trường dev |
| Quét mẫu secret phía client | 159 file, 0 khớp theo 5 mẫu, 0 file bỏ qua do lớn; không phải quét entropy/lịch sử đầy đủ |
| npm audit | 41 package bị đánh dấu: 1 Critical, 16 High, 23 Moderate, 1 Low; **chưa phải 41 lỗ hổng khai thác được của website** |
| Checklist gốc | 166 tình huống; xem ma trận riêng, không chia 88 cho 166 vì đơn vị khác nhau |

Các kiểm soát đạt trong phạm vi đã thử: API quản trị trong lab đòi khóa đúng; từ chối origin ngoài; tra cứu code B + phone A bị chặn; server tính lại giá; tiền cọc chỉ tăng sau ghi sổ; không thu/hoàn vượt mức; chống ghi trùng giao dịch; hai yêu cầu tranh một slot chỉ một thành công; CSV khách xử lý công thức như text; ảnh hợp lệ và giới hạn upload hoạt động.

## Lỗi xác nhận

| Mã | Mức/Phạm vi | Vấn đề | Ca kế hoạch |
|---|---|---|---|
| SEC-001 | High · DEV | Bản dev bỏ qua khóa quản trị trên localhost/LAN | G01-08, G03-08, G04-03 |
| SEC-002 | High | Yêu cầu hỗ trợ làm lộ chủ lịch và thiếu kiểm quyền sở hữu | G04-01, G04-02 |
| SEC-003 | High | Stored XSS từ tên khách tại màn Khách hàng | G08-02 |
| SEC-004 | Medium | API chấp nhận ngày hoặc giờ không tồn tại | G09-02 |
| SEC-005 | Medium | Giới hạn số ngày mở lịch chưa được thực thi tại API | G11-02 |
| SEC-006 | Low · tăng cường | Upload tin vào MIME do client khai báo | G07-01 |
| SEC-007 | Medium · lớp ứng dụng | Thiếu header bảo vệ trình duyệt và cho phép nhúng admin | G08-07, G08-09 |
| SEC-008 | Low | JSON sai định dạng trả lỗi server 500 | G09-02, G18-01 |

### SEC-001 · Bản dev bỏ qua khóa quản trị trên localhost/LAN

**Bằng chứng:** Một GET /api/data với bearer cố ý sai trên localhost trả HTTP 200 và đủ 5 collection quản trị. Cấu hình host=0.0.0.0, allowedHosts=true, cors=true; siteAdmin cho phép địa chỉ LAN khi HOAN_LOCAL_DEV=1.

**Đường kiểm chứng:** lib/site-admin.ts:19; vite.config.ts:58; dev-exposure.json.

**Hướng sửa và retest:** Chỉ bind loopback theo mặc định, giới hạn host/origin; bỏ bypass LAN và kiểm khóa trước khi cấp quyền. Nếu cần điện thoại LAN, vẫn bắt buộc khóa. Không có bằng chứng đây là lỗ hổng của bản hosting vì chưa triển khai.

**Theo dõi sau khắc phục:** FIXED / RETEST PASS trên local; xem [bản vá và bằng chứng](Khac_Phu_Bao_Mat_2026-11-04.md). Bằng chứng ở trên là kết quả trước vá.

### SEC-002 · Yêu cầu hỗ trợ làm lộ chủ lịch và thiếu kiểm quyền sở hữu

**Bằng chứng:** Danh sách công khai có mã lịch. POST createRequest dùng mã B, không gửi phone/name, vẫn HTTP 201 và phản hồi tên/phone B; gửi phone A với code B cũng được tạo yêu cầu. Thử bằng A/B giả, không chạm khách thật.

**Đường kiểm chứng:** app/api/data/route.ts:157; app/api/data/route.ts:433; G04-01.request-leak; G04-02.request-other.

**Hướng sửa và retest:** Kiểm code + chứng thực sở hữu trước khi lấy thông tin hoặc tạo yêu cầu liên quan lịch; không tự điền/trả PII cho người chưa chứng minh quyền. Chỉ trả dữ liệu xác nhận tối thiểu; hạn chế public code nếu không cần.

**Theo dõi sau khắc phục:** FIXED / RETEST PASS trên local; xem [bản vá và bằng chứng](Khac_Phu_Bao_Mat_2026-11-04.md). Bằng chứng ở trên là kết quả trước vá.

### SEC-003 · Stored XSS từ tên khách tại màn Khách hàng

**Bằng chứng:** Tạo khách bằng luồng đặt lịch công khai với canary img/onerror chỉ đặt biến window. Khi admin mở /admin/customers, canary chạy. Cùng canary tại /admin/appointments không chạy trong ca đối chứng.

**Đường kiểm chứng:** public/app.js:2427; stored-xss-customers.png; G08-02.customers.

**Hướng sửa và retest:** Escape theo ngữ cảnh mọi dữ liệu khách trước khi đưa vào HTML/attribute/textarea, kể cả modal sửa khách. Rà các sink dùng chung và hồi quy với payload đã lưu. Khóa quản trị đang ở web storage cùng origin nên hậu quả có thể vượt việc đổi giao diện.

**Theo dõi sau khắc phục:** FIXED / RETEST PASS trên local; xem [bản vá và bằng chứng](Khac_Phu_Bao_Mat_2026-11-04.md). Bằng chứng ở trên là kết quả trước vá.

### SEC-004 · API chấp nhận ngày hoặc giờ không tồn tại

**Bằng chứng:** Các giá trị clock 99:99 và calendar 2099-99-99 trả HTTP 201 và sinh lịch trong DB riêng. Regex đúng hình thức nhưng Date không hợp lệ không bị chặn.

**Đường kiểm chứng:** app/api/data/route.ts:195; G09-02.invalid-clock; G09-02.invalid-calendar.

**Hướng sửa và retest:** Kiểm ngày lịch thật, giờ 00–23/phút 00–59, Date hữu hạn, thời điểm tương lai và khung vận hành; ca lỗi phải 400 và không sinh lịch/khách/thông báo.

**Theo dõi sau khắc phục:** FIXED / RETEST PASS trên local; xem [bản vá và bằng chứng](Khac_Phu_Bao_Mat_2026-11-04.md). Bằng chứng ở trên là kết quả trước vá.

### SEC-005 · Giới hạn số ngày mở lịch chưa được thực thi tại API

**Bằng chứng:** Khách không có khóa gửi ngày vượt bookingWindow mặc định 60 ngày vẫn nhận HTTP 201. Thử với ngày tương lai vượt giới hạn, không dùng dữ liệu thật.

**Đường kiểm chứng:** app/api/data/route.ts:195; G11-02.booking-window.

**Hướng sửa và retest:** Thực thi bookingWindow ở server theo ngày Việt Nam; nếu admin được đặt ngoài cửa sổ cần quyền và đường gọi rõ ràng.

**Theo dõi sau khắc phục:** FIXED / RETEST PASS trên local; xem [bản vá và bằng chứng](Khac_Phu_Bao_Mat_2026-11-04.md). Bằng chứng ở trên là kết quả trước vá.

### SEC-006 · Upload tin vào MIME do client khai báo

**Bằng chứng:** Nội dung HTML/text vô hại khai image/png được lưu HTTP 200. PNG thật vẫn lưu/đọc đúng bytes; SVG/HTML khai đúng loại bị chặn; quá số file/dung lượng bị từ chối. Chưa chứng minh thực thi HTML/RCE qua file; đường trả ảnh có nosniff.

**Đường kiểm chứng:** app/api/uploads/route.ts:12; G07-01.mime-spoof.

**Hướng sửa và retest:** Nhận diện magic bytes, giải mã và mã hóa lại ảnh bằng công cụ phù hợp runtime; giới hạn kích thước pixel; giữ MIME từ nội dung đã xác minh.

**Theo dõi sau khắc phục:** FIXED / RETEST PASS trên local; xem [bản vá và bằng chứng](Khac_Phu_Bao_Mat_2026-11-04.md). Bằng chứng ở trên là kết quả trước vá.

### SEC-007 · Thiếu header bảo vệ trình duyệt và cho phép nhúng admin

**Bằng chứng:** Response HTML của bản production local thiếu CSP/frame-ancestors hoặc X-Frame-Options, nosniff và Referrer-Policy. Một origin loopback khác do bộ test sở hữu nhúng được trang Cài đặt trong iframe. Không kiểm được header CDN/HTTPS vì chưa có domain.

**Đường kiểm chứng:** worker/index.ts; cross-origin-frame.png; G08-07.framing; G08-09.headers.

**Hướng sửa và retest:** Đặt frame-ancestors phù hợp, nosniff, Referrer-Policy và CSP tương thích các script hiện tại; xác minh bằng browser. HSTS chỉ xác minh sau khi có HTTPS/domain.

**Theo dõi sau khắc phục:** FIXED / RETEST PASS trên local; xem [bản vá và bằng chứng](Khac_Phu_Bao_Mat_2026-11-04.md). Bằng chứng ở trên là kết quả trước vá.

### SEC-008 · JSON sai định dạng trả lỗi server 500

**Bằng chứng:** Body JSON chỉ có dấu mở ngoặc trả HTTP 500 thay vì lỗi client 400. Không xác nhận lộ SQL hay stack trong ca cuối; thông điệp parse không được tính là stack.

**Đường kiểm chứng:** app/api/data/route.ts:168; G09-02.malformed-json.

**Hướng sửa và retest:** Bắt lỗi parse/schema riêng và trả 400 thống nhất; giữ lỗi ngoài dự kiến ở thông điệp an toàn.

**Theo dõi sau khắc phục:** FIXED / RETEST PASS trên local; xem [bản vá và bằng chứng](Khac_Phu_Bao_Mat_2026-11-04.md). Bằng chứng ở trên là kết quả trước vá.

## Dependency: cần đánh giá và lên lịch vá

Lệnh npm audit chạy read-only, không cài mới hoặc audit fix. Có cảnh báo trực tiếp ở Next, react-server-dom-webpack, Vite, Vinext, Cloudflare Vite plugin/Wrangler, Zod và các gói công cụ. Một số đề xuất fix có thay đổi major hoặc downgrade không phù hợp; cần chọn phiên bản tương thích rồi build và chạy lại nghiệp vụ.

- react-server-dom-webpack 19.2.6 nằm trong khoảng cảnh báo [GHSA-wx67-qw84-cm4g](https://github.com/advisories/GHSA-wx67-qw84-cm4g). Chưa thử DoS.
- Vite 8.3.1 nằm trong khoảng cảnh báo Windows/editor [GHSA-587h-7wmj-h5pm](https://github.com/advisories/GHSA-587h-7wmj-h5pm). Chưa thử thực thi lệnh hay gọi editor endpoint.
- Next 16.2.6 bị scanner đánh mức Critical; [GHSA-p293-qw3h-jr36](https://github.com/advisories/GHSA-p293-qw3h-jr36) có điều kiện runtime cụ thể. Dự án chạy Vinext/Workers, không chạy next dev/start; **chưa chứng minh đường lỗi Next đó được sử dụng hoặc khai thác được ở website**.

## Tài sản và ma trận quyền đã dùng

| Tài sản/luồng | Khách chưa có khóa | Code + phone đúng | Admin token đúng trong lab |
|---|---|---|---|
| GET /api/data | Dữ liệu đặt lịch công khai rút gọn, nhưng còn code lịch | Chi tiết đúng lịch | Snapshot quản trị |
| POST createAppointment | Được tạo yêu cầu chưa thu tiền | Như khách | Theo API hiện có |
| Tra cứu lịch khác với phone không khớp | 404 | Chỉ lịch tương ứng | Tra cứu theo quy tắc hiện có |
| POST createRequest có code | Mong đợi kiểm quyền; thực tế FAIL | Luồng cần xác minh lại sau sửa | Quản trị theo quyền |
| Ghi tiền/sửa lịch/đổi nội dung/dịch vụ | 401 trong lab | Không nâng thành admin | Được phép theo validation |
| GET visits, CMS admin, lịch sử/bản nháp | 401 | Không nâng thành admin | 200 |
| Upload | 401 | Không tự có quyền admin | 200 hoặc từ chối theo validation |

- `POST/GET /api/visits`
- `POST/GET /api/uploads`
- `GET/POST /api/site-content`
- `GET /api/maps-config`
- `GET /api/map-tiles`
- `GET/POST /api/data`
- `GET/POST /api/cms-resources`
- `GET /api/address-search`

Luồng chính: browser → API Worker → D1; ảnh → R2 qua uploads; maps/tile/search là tích hợp lấy dữ liệu bên ngoài. Không phát hiện API tài khoản/role thực, GraphQL, OAuth/SSO, webhook thanh toán hay LLM trong route inventory. Mục Phân quyền hiện không được xem là bằng chứng có RBAC server.

## Bằng chứng và cách chạy lại

- [Ma trận checklist và tiểu ca](Ket_Qua_Kiem_Thu_Bao_Mat_2026-11-04.md).
- JSON máy đọc: `outputs/security-audit/results.json`; dev đã che dữ liệu: `dev-exposure.json`; dependency raw: `dependencies.json`; kiểm kê: `inventory.json`.
- Ảnh lab: `outputs/security-audit/stored-xss-customers.png`, `stored-xss-appointments.png`, `cross-origin-frame.png`. Chỉ chứa dữ liệu giả của lab.
- Runner: `scripts/verify-security-audit.mjs`. Tạo DB/R2 mới mỗi lần, đóng runtime sau chạy và trả exit 1 nếu còn FAIL/BLOCKED; không nhận URL production làm đối số. Cần các dependency hiện có của dự án, Playwright tại `.sites-runtime/browser-tests/node_modules/playwright` và Microsoft Edge đã cài trên máy kiểm thử này.

```powershell
npm.cmd run build
node scripts/verify-security-audit.mjs
npm.cmd audit --json
```

Build production đã chạy đạt trước audit trong phiên này; runner cuối hoàn tất 88 ca và exit 1 đúng do lỗi đang mở. Bộ unit test tổng không được chạy lại trong đợt audit vì không sửa mã sản phẩm; kết quả unit test của các đợt trước không được dùng làm chứng nhận bảo mật.

## Phần chưa đủ điều kiện nghiệm thu

Chưa có domain/hosting để kiểm DNS, TLS/HSTS, CDN/WAF, origin phụ, IAM/quyền bucket production, backup, secret thật và log vận hành. Chưa có mô hình tài khoản/phiên riêng để kiểm revocation/MFA/role matrix như checklist mẫu; các tính năng thực sự không có được đánh N/A riêng. Chưa chạy fuzz/tải, đánh giá sâu mọi SSRF/parser, quét secret toàn lịch sử hoặc xác minh reachability từng advisory. Những mục đó giữ BLOCKED/NOT RUN, không ghi PASS.

Ưu tiên tiếp theo: xử lý SEC-001/002/003, kiểm lại đường tương đương và dữ liệu đã lưu; xử lý validation/header; triage dependency tương thích; sau khi có môi trường online mới kiểm lớp hosting và nghiệm thu lại. Báo cáo này là kết quả kiểm thử, không phải chứng nhận ASVS hoặc cam kết không còn lỗ hổng.
