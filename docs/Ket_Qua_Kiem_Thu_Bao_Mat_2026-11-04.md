# Ma trận kiểm thử bảo mật — 04/11/2026

> Kết quả sau bản vá: [103/103 tiểu ca local đạt; phạm vi và phần chưa kiểm](Khac_Phu_Bao_Mat_2026-11-04.md). Số liệu cũ bên dưới thuộc đợt trước vá, được giữ để đối chiếu.

[Đọc báo cáo và lỗi ưu tiên](Bao_Cao_Kiem_Thu_Bao_Mat_Website_2026-11-04.md).

## Cách hiểu số liệu

- 88 tiểu ca lab: 78 PASS, 10 FAIL, 0 BLOCKED. Một tình huống checklist sinh nhiều tiểu ca; 10 FAIL không có nghĩa là 10 lỗ hổng độc lập.
- Checklist gốc 166 tình huống: PASS=22, FAIL=11, BLOCKED=36, NOT RUN=55, N/A=42.
- Độ phủ theo công thức của plan: (22+11)/(166-42) = **26.6%**. BLOCKED và NOT RUN vẫn nằm trong mẫu số.
- PASS chỉ áp dụng môi trường, endpoint, dữ liệu và biến thể nêu trong bằng chứng. Không mở rộng PASS sang cloud/CDN, mọi vai trò hoặc mọi payload của tình huống tổng quát. G04-03 tổng hợp FAIL do dev thật dù các ca lab PASS.
- Nhóm không có tính năng tương ứng được N/A theo inventory; thiếu quyền/cấu hình được BLOCKED; chưa chạy đầy đủ được NOT RUN. Đây không phải nghiệm thu hoàn tất toàn checklist.

## Các tiểu ca thực chạy

| Mã tiểu ca | Trạng thái | Mô tả | Kỳ vọng | Kết quả |
|---|---|---|---|---|
| G04-03.0 | PASS | missing authorization /api/visits | 401/403, no private payload | {"http":401} |
| G04-03.1 | PASS | invalid authorization /api/visits | 401/403, no private payload | {"http":401} |
| G04-03.2 | PASS | cookie-only authorization /api/visits | 401/403, no private payload | {"http":401} |
| G08-05.3 | PASS | Foreign Origin with valid test credential /api/visits | Cross-origin request denied | {"http":401} |
| G04-03.4 | PASS | missing authorization /api/cms-resources?admin=1 | 401/403, no private payload | {"http":401} |
| G04-03.5 | PASS | invalid authorization /api/cms-resources?admin=1 | 401/403, no private payload | {"http":401} |
| G04-03.6 | PASS | cookie-only authorization /api/cms-resources?admin=1 | 401/403, no private payload | {"http":401} |
| G08-05.7 | PASS | Foreign Origin with valid test credential /api/cms-resources?admin=1 | Cross-origin request denied | {"http":401} |
| G04-03.8 | PASS | missing authorization /api/site-content?admin=1 | 401/403, no private payload | {"http":401} |
| G04-03.9 | PASS | invalid authorization /api/site-content?admin=1 | 401/403, no private payload | {"http":401} |
| G04-03.10 | PASS | cookie-only authorization /api/site-content?admin=1 | 401/403, no private payload | {"http":401} |
| G08-05.11 | PASS | Foreign Origin with valid test credential /api/site-content?admin=1 | Cross-origin request denied | {"http":401} |
| G04-03.12 | PASS | missing authorization /api/site-content?history=/ | 401/403, no private payload | {"http":401} |
| G04-03.13 | PASS | invalid authorization /api/site-content?history=/ | 401/403, no private payload | {"http":401} |
| G04-03.14 | PASS | cookie-only authorization /api/site-content?history=/ | 401/403, no private payload | {"http":401} |
| G08-05.15 | PASS | Foreign Origin with valid test credential /api/site-content?history=/ | Cross-origin request denied | {"http":401} |
| G04-03.updateAppointment | PASS | Anonymous admin action updateAppointment | 401 and no changes to controlled booking B | {"http":401,"bookingBUnchanged":true} |
| G04-03.deleteAppointment | PASS | Anonymous admin action deleteAppointment | 401 and no changes to controlled booking B | {"http":401,"bookingBUnchanged":true} |
| G04-03.setScheduleSlot | PASS | Anonymous admin action setScheduleSlot | 401 and no changes to controlled booking B | {"http":401,"bookingBUnchanged":true} |
| G04-03.saveContent | PASS | Anonymous admin action saveContent | 401 and no changes to controlled booking B | {"http":401,"bookingBUnchanged":true} |
| G04-03.saveService | PASS | Anonymous admin action saveService | 401 and no changes to controlled booking B | {"http":401,"bookingBUnchanged":true} |
| G04-03.deleteService | PASS | Anonymous admin action deleteService | 401 and no changes to controlled booking B | {"http":401,"bookingBUnchanged":true} |
| G04-03.resolveRequest | PASS | Anonymous admin action resolveRequest | 401 and no changes to controlled booking B | {"http":401,"bookingBUnchanged":true} |
| G04-03.updateRequest | PASS | Anonymous admin action updateRequest | 401 and no changes to controlled booking B | {"http":401,"bookingBUnchanged":true} |
| G04-03.deleteRequest | PASS | Anonymous admin action deleteRequest | 401 and no changes to controlled booking B | {"http":401,"bookingBUnchanged":true} |
| G04-03.markNotificationsRead | PASS | Anonymous admin action markNotificationsRead | 401 and no changes to controlled booking B | {"http":401,"bookingBUnchanged":true} |
| G04-03.recordPayment | PASS | Anonymous admin action recordPayment | 401 and no changes to controlled booking B | {"http":401,"bookingBUnchanged":true} |
| G04-03.post-site-content | PASS | Anonymous content-management POST /api/site-content | 401 before writes | {"http":401} |
| G04-03.post-cms-resources | PASS | Anonymous content-management POST /api/cms-resources | 401 before writes | {"http":401} |
| G04-06.PUT | PASS | Unsupported API method PUT | 405 and protected B unchanged | {"http":405} |
| G04-06.PATCH | PASS | Unsupported API method PATCH | 405 and protected B unchanged | {"http":405} |
| G04-06.DELETE | PASS | Unsupported API method DELETE | 405 and protected B unchanged | {"http":405} |
| G04-05.public-snapshot | PASS | Public data minimizes private fields | No customer/contact/ledger fields in public list | {"http":200,"publicBookingCodesPresent":true} |
| G04-01.lookup-own | PASS | Own fixture lookup | Correct code and phone return the matching fixture only | {"http":200} |
| G04-01.lookup-other | PASS | A phone combined with B code | 404, no B data | {"http":404} |
| G04-01.request-leak | FAIL | Create support request using public B code without B phone | No owner details disclosed without ownership proof | HTTP 201; response disclosed controlled B name/phone without a phone credential  true !== false  |
| G04-02.request-other | FAIL | A submits a request associated with booking B | Reject mismatched owner phone | Expected rejection, got HTTP 201 |
| G04-02.report-other | PASS | A reports payment for B | Reject and leave B unchanged | {"http":404} |
| G05-01.lookup | PASS | SQL-shaped lookup inputs | No extra rows or database error disclosure | {"testedInputs":2,"http":404} |
| G04-04.booking | PASS | Price/status/owner mass assignment at booking creation | Server derives price, unpaid and pending; ignores extra privilege fields | {"http":201,"priceRecalculated":true,"receivedMoney":0} |
| G11-04.slot-race | PASS | Two concurrent fixture bookings for one slot | One succeeds and one conflicts; one persisted booking | {"http":[201,409],"persisted":1} |
| G11-05.booking-replay | PASS | Replay same booking slot | No duplicate booking on replay | {"http":409} |
| G09-02.invalid-clock | FAIL | Booking validation invalid-clock | 400 and no booking created | HTTP 201; bookingCreated=true  201 !== 400  |
| G09-02.invalid-calendar | FAIL | Booking validation invalid-calendar | 400 and no booking created | HTTP 201; bookingCreated=true  201 !== 400  |
| G09-02.past-date | PASS | Booking validation past-date | 400 and no booking created | {"http":400} |
| G09-02.object-name | PASS | Booking validation object-name | 400 and no booking created | {"http":400} |
| G11-02.booking-window | FAIL | Booking beyond configured open window | Reject dates beyond configured bookingWindow | Expected rejection, got HTTP 201 |
| G11-10.payment-report | PASS | Customer report does not record received money | Only pending verification; no payment transaction | {"http":200,"simulatedReportOnly":true,"ledgerRows":0} |
| G11-03.money--1 | PASS | Reject invalid payment amount -1 | 400, no ledger entry | {"http":400} |
| G11-03.money-0 | PASS | Reject invalid payment amount 0 | 400, no ledger entry | {"http":400} |
| G11-03.money-0.5 | PASS | Reject invalid payment amount 0.5 | 400, no ledger entry | {"http":400} |
| G11-03.money-1000000001 | PASS | Reject invalid payment amount 1000000001 | 400, no ledger entry | {"http":400} |
| G11-03.money-NaN | PASS | Reject invalid payment amount NaN | 400, no ledger entry | {"http":400} |
| G11-05.payment-replay | PASS | SIMULATED local payment idempotency | One local ledger row and replay returns original result | {"http":[201,200],"simulatedOnly":true} |
| G09-08.payment-key-conflict | PASS | Same payment key with changed body | 409, no second payment | {"http":409} |
| G11-03.overpayment | PASS | Receive more than remaining balance | 409 and no extra ledger row | {"http":409} |
| G11-07.overrefund | PASS | Refund more than simulated retained money | 409 and no refund | {"http":409} |
| G11-02.fake-received | PASS | Directly change deposit/paid status without a ledger transaction | 409 | {"http":409} |
| G08-05.write-origin | PASS | Cross-origin admin update with valid test token | 401 and protected B unchanged | {"http":401} |
| G09-02.malformed-json | FAIL | Malformed JSON | 400 client error without stack/SQL | HTTP 500; expected a controlled client error  500 !== 400  |
| G14-02.60 | PASS | Private response cache controls /api/visits | no-store | {"http":200,"cacheControl":"no-store","vary":"Authorization, RSC, Accept, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Next-Url, X-Vinext-Interception-Context, X-Vinext-Mounted-Slots, X-Vinext-Rsc-Render-Mode"} |
| G14-02.61 | PASS | Private response cache controls /api/cms-resources?admin=1 | no-store | {"http":200,"cacheControl":"no-store","vary":"Authorization, RSC, Accept, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Next-Url, X-Vinext-Interception-Context, X-Vinext-Mounted-Slots, X-Vinext-Rsc-Render-Mode"} |
| G14-02.62 | PASS | Private response cache controls /api/site-content?admin=1 | no-store | {"http":200,"cacheControl":"no-store","vary":"Authorization, RSC, Accept, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Next-Url, X-Vinext-Interception-Context, X-Vinext-Mounted-Slots, X-Vinext-Rsc-Render-Mode"} |
| G14-02.63 | PASS | Private response cache controls /api/data | no-store | {"http":200,"cacheControl":"no-store","vary":"Authorization, RSC, Accept, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Next-Url, X-Vinext-Interception-Context, X-Vinext-Mounted-Slots, X-Vinext-Rsc-Render-Mode"} |
| G08-06.cors | PASS | Foreign Origin response CORS | No arbitrary origin access to protected response | {"http":401,"allowOrigin":null} |
| G07-02.text/html | PASS | Reject active upload type text/html | 400 | {"http":400} |
| G07-02.image/svg+xml | PASS | Reject active upload type image/svg+xml | 400 | {"http":400} |
| G07-01.mime-spoof | FAIL | HTML/text bytes labelled image/png | Reject content that is not an image | HTTP 200; non-image accepted=true  200 !== 400  |
| G07-03.object-key | PASS | Object-key traversal on file download | 404 | {"http":404} |
| G07-06.file-count | PASS | Four small uploads exceed allowed count | 400, no uploaded paths | {"http":400} |
| G07-05.upload-auth | PASS | Anonymous upload | 401 | {"http":401} |
| G07-01.valid-image | PASS | Valid tiny PNG upload/readback control | 201/200 upload, exact bytes served with image MIME and nosniff | {"http":[200,200],"exactBytes":true} |
| G07-06.file-size | PASS | One image exceeds 5 MB limit by one byte | 400, no object added | {"http":413,"orphanObjects":0} |
| G09-06.pagination | PASS | Visitor pagination/date clamp | Bounded page size on huge or negative input | {"maxRows":10} |
| G12-08.analytics-redaction | PASS | Analytics does not retain booking IDs or phone query | Stored path is generic and excludes query | {"http":200,"redactedPath":"/booking/detail","trackingCookieHttpOnly":true} |
| G08-05.analytics-origin | PASS | Foreign Origin analytics mutation | 403 | {"http":403} |
| G01-03.76 | PASS | Production artifact file exposure /.env | No source or secret file returned | {"http":404,"type":"text/plain;charset=UTF-8"} |
| G01-03.77 | PASS | Production artifact file exposure /.dev.vars | No source or secret file returned | {"http":404,"type":"text/plain;charset=UTF-8"} |
| G01-03.78 | PASS | Production artifact file exposure /.git/config | No source or secret file returned | {"http":404,"type":"text/plain;charset=UTF-8"} |
| G01-03.79 | PASS | Production artifact file exposure /app/api/data/route.ts | No source or secret file returned | {"http":404,"type":"text/plain;charset=UTF-8"} |
| G01-03.80 | PASS | Production artifact file exposure /@vite/client | No source or secret file returned | {"http":404,"type":"text/plain;charset=UTF-8"} |
| G01-03.81 | PASS | Production artifact file exposure /node_modules/.vite/deps_rsc/react-dom.js | No source or secret file returned | {"http":404,"type":"text/plain;charset=UTF-8"} |
| G08-09.headers | FAIL | Production-build browser security headers | CSP frame restrictions, nosniff and Referrer-Policy | Missing application-level headers: frame restriction, nosniff, Referrer-Policy + actual - expected  + [ +   'frame restriction', +   'nosniff', +   'Referrer-Policy' + ] - []  |
| G08-02.appointments | PASS | Stored customer-name XSS on /admin/appointments | Canary remains inert text | {"canaryExecuted":false} |
| G08-02.customers | FAIL | Stored customer-name XSS on /admin/customers | Canary remains inert text | Harmless canary JavaScript executed from saved customer name  true !== false  |
| G05-09.csv | PASS | Export customer formula canary | CSV prefixes untrusted formula values as text | {"formulaEscaped":true} |
| G08-01.search | PASS | Reflected XSS in public search | Search canary is inert | {"canaryExecuted":false} |
| G08-07.framing | FAIL | Sensitive page embedded by a foreign origin | Browser blocks sensitive page framing | Sensitive route loaded in cross-origin iframe on another controlled local port  true !== false  |

## Toàn bộ checklist gốc

| Mã | Trạng thái | Tình huống | Bằng chứng hoặc giới hạn |
|---|---|---|---|
| G01-01 | BLOCKED | Đối chiếu domain, subdomain, admin, staging, origin và các phiên bản deploy với DNS, tài liệu và cấu hình. | Chưa có domain/triển khai và quyền đọc cấu hình cloud/CDN/IAM/backup để xác minh; local không thay thế được bằng chứng đó. |
| G01-02 | NOT RUN | Rà route ẩn, endpoint cũ, debug, Swagger, dashboard metrics/health và đường dẫn dev. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G01-03 | PASS | Xem cấu hình phục vụ file, bundle và lịch sử repo để tìm .env, .git, bản sao DB, file backup và khóa. | 6 tiểu ca local: G01-03.76, G01-03.77, G01-03.78, G01-03.79, G01-03.80, G01-03.81 |
| G01-04 | NOT RUN | Kiểm tra directory listing, thư mục build, source map và các file dư. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G01-05 | BLOCKED | Rà HTTP→HTTPS, chứng chỉ theo host, hạn dùng, chuỗi tin cậy, giao thức/cipher và HSTS. | Chưa có domain/triển khai và quyền đọc cấu hình cloud/CDN/IAM/backup để xác minh; local không thay thế được bằng chứng đó. |
| G01-06 | BLOCKED | So sánh quyền và hành vi giữa hostname chính, domain mặc định của nhà cung cấp và origin. | Chưa có domain/triển khai và quyền đọc cấu hình cloud/CDN/IAM/backup để xác minh; local không thay thế được bằng chứng đó. |
| G01-07 | BLOCKED | Rà DNS treo, tài nguyên hosting đã xóa, DNS quản trị và subdomain cũ. | Chưa có domain/triển khai và quyền đọc cấu hình cloud/CDN/IAM/backup để xác minh; local không thay thế được bằng chứng đó. |
| G01-08 | FAIL | Kiểm tra các HTTP method được bật, chế độ debug, credential mặc định và công cụ quản trị cài sẵn. | SEC-001: invalid bearer trên dev vẫn nhận snapshot quản trị; chỉ một GET và không lưu PII. |
| G02-01 | N/A | So sánh phản hồi đăng nhập, đăng ký và reset với tài khoản tồn tại/không tồn tại. | Không có hệ thống tài khoản/mật khẩu/reset/MFA; admin dùng shared bearer key. Không được diễn giải thành có MFA hay chính sách mật khẩu đạt. |
| G02-02 | NOT RUN | Thử giới hạn đăng nhập sai với tài khoản giả, trong ngân sách đã chốt; kiểm tra cấu hình chống credential stuffing. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G02-03 | N/A | Rà quy tắc mật khẩu, lưu trữ hash và kiểm tra mật khẩu yếu theo chính sách. | Không có hệ thống tài khoản/mật khẩu/reset/MFA; admin dùng shared bearer key. Không được diễn giải thành có MFA hay chính sách mật khẩu đạt. |
| G02-04 | N/A | Thử gọi trực tiếp API chức năng khi mới hoàn thành bước mật khẩu, chưa qua MFA. | Không có hệ thống tài khoản/mật khẩu/reset/MFA; admin dùng shared bearer key. Không được diễn giải thành có MFA hay chính sách mật khẩu đạt. |
| G02-05 | N/A | Dùng token reset hết hạn, đã dùng, của tài khoản khác và token cấp trước một lần reset thành công. | Không có hệ thống tài khoản/mật khẩu/reset/MFA; admin dùng shared bearer key. Không được diễn giải thành có MFA hay chính sách mật khẩu đạt. |
| G02-06 | N/A | Kiểm tra OTP, resend, recovery code và hạ cấp phương thức MFA. | Không có hệ thống tài khoản/mật khẩu/reset/MFA; admin dùng shared bearer key. Không được diễn giải thành có MFA hay chính sách mật khẩu đạt. |
| G02-07 | N/A | Đổi email, mật khẩu, số điện thoại, gỡ MFA hoặc liên kết tài khoản từ phiên cũ. | Không có hệ thống tài khoản/mật khẩu/reset/MFA; admin dùng shared bearer key. Không được diễn giải thành có MFA hay chính sách mật khẩu đạt. |
| G02-08 | NOT RUN | Thử đăng nhập bằng API, ứng dụng khác, invite, magic link và tài khoản đã khóa/thu hồi. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G03-01 | N/A | Đối chiếu cookie phiên: Secure, HttpOnly, SameSite, Domain/Path và tuổi thọ. | Không dùng cookie phiên, JWT, refresh token hoặc nâng quyền phiên. Cookie analytics không phải cookie đăng nhập. |
| G03-02 | N/A | Đăng nhập hoặc nâng quyền từ phiên đã có; thử lại định danh phiên cũ. | Không dùng cookie phiên, JWT, refresh token hoặc nâng quyền phiên. Cookie analytics không phải cookie đăng nhập. |
| G03-03 | BLOCKED | Gọi lại API bằng phiên đã logout, quá thời hạn, hoặc tài khoản vừa bị khóa/hạ quyền. | Chưa có phiên/tài khoản bị khóa/thu hồi và chính sách vòng đời shared admin key để đối chiếu; xóa web storage không chứng minh server thu hồi key. |
| G03-04 | N/A | Thử JWT sửa nội dung/chữ ký, sai issuer/audience, sai loại token, hết hạn và key không tin cậy. | Không dùng cookie phiên, JWT, refresh token hoặc nâng quyền phiên. Cookie analytics không phải cookie đăng nhập. |
| G03-05 | N/A | Thử refresh token cũ sau khi xoay vòng, dùng lại token đã thu hồi và thử refresh đồng thời trong staging. | Không dùng cookie phiên, JWT, refresh token hoặc nâng quyền phiên. Cookie analytics không phải cookie đăng nhập. |
| G03-06 | NOT RUN | Rà URL, Referer, web storage, cache, log, analytics và error monitoring. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G03-07 | BLOCKED | Kiểm tra phiên giữa thiết bị, thay mật khẩu, xóa thiết bị tin cậy và thu hồi mọi phiên. | Chưa có phiên/tài khoản bị khóa/thu hồi và chính sách vòng đời shared admin key để đối chiếu; xóa web storage không chứng minh server thu hồi key. |
| G03-08 | FAIL | Kiểm tra API chấp nhận đồng thời cookie, bearer, service token hoặc token link. | SEC-001: nhánh local dev được xét trước bearer; lab HOAN_LOCAL_DEV=0 kiểm khóa đúng. |
| G04-01 | FAIL | Khách A thử đọc bản ghi của B qua ID có sẵn trong bộ dữ liệu test (IDOR/BOLA). | G04-01.request-leak |
| G04-02 | FAIL | Với cùng bản ghi B, thử sửa/xóa, hủy, duyệt, tải file, tải hóa đơn và xem lịch sử. | G04-02.request-other |
| G04-03 | FAIL | Dùng khách hoặc nhân viên giới hạn gọi trực tiếp API admin (leo thang quyền/BFLA). | Các tiểu ca admin trong lab PASS; dev live bỏ qua khóa, nên tổng hợp môi trường không được ghi PASS. |
| G04-04 | PASS | Gửi thêm trường ngoài form như role, ownerId, tenantId, status, amount (mass assignment). | 1 tiểu ca local: G04-04.booking |
| G04-05 | PASS | Rà API list/search/autocomplete/export, cả số đếm và các trường lồng nhau. | 1 tiểu ca local: G04-05.public-snapshot |
| G04-06 | PASS | Đổi phương thức, loại nội dung, route alias, phiên bản API hoặc đối tượng cha trong URL. | 3 tiểu ca local: G04-06.PUT, G04-06.PATCH, G04-06.DELETE |
| G04-07 | N/A | Kiểm tra truy cập chéo tổ chức/chi nhánh qua user, job, CDN, cache, file và export. | Không có tenant, chuyển chủ/role server, bulk khách hoặc impersonation/job/service identity tương ứng trong API hiện có. |
| G04-08 | N/A | Truy cập lại sau khi tài nguyên đổi chủ, lời mời bị hủy hoặc vai trò bị hạ. | Không có tenant, chuyển chủ/role server, bulk khách hoặc impersonation/job/service identity tương ứng trong API hiện có. |
| G04-09 | N/A | Thử batch với hỗn hợp bản ghi được phép và bị cấm, cả tạo/sửa/xóa. | Không có tenant, chuyển chủ/role server, bulk khách hoặc impersonation/job/service identity tương ứng trong API hiện có. |
| G04-10 | N/A | Kiểm tra riêng quyền dịch vụ, công việc nền, chức năng impersonation và tài khoản hỗ trợ. | Không có tenant, chuyển chủ/role server, bulk khách hoặc impersonation/job/service identity tương ứng trong API hiện có. |
| G05-01 | PASS | Rà SQL injection từ query, form, JSON, cookie, header, search, sort và trường lưu rồi xử lý sau. | 1 tiểu ca local: G05-01.lookup |
| G05-02 | N/A | Kiểm tra NoSQL injection và ORM qua object toán tử, trường lồng nhau hoặc kiểu dữ liệu khác dự kiến. | Dùng D1/SQLite; không có NoSQL, LDAP hoặc XPath tương ứng. |
| G05-03 | NOT RUN | Rà command/argument injection tại tác vụ xử lý file, ảnh, PDF, backup hoặc công cụ dòng lệnh. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G05-04 | NOT RUN | Kiểm tra template injection trong email, biên nhận, preview, báo cáo và template tùy chỉnh. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G05-05 | N/A | Kiểm tra LDAP, XPath hoặc bộ máy tìm kiếm nếu sử dụng; xem cả trường lọc admin. | Dùng D1/SQLite; không có NoSQL, LDAP hoặc XPath tương ứng. |
| G05-06 | NOT RUN | Rà eval, dynamic import, script runner và xử lý chuỗi cấu hình do người dùng kiểm soát. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G05-07 | NOT RUN | Kiểm tra deserialize dữ liệu từ cookie, queue, file import, payload nhị phân hoặc plugin. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G05-08 | NOT RUN | Thử dữ liệu có ký tự điều khiển vào header, email và log (CRLF, header/mail/log injection). | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G05-09 | PASS | Xuất dữ liệu đánh dấu sang CSV/bảng tính; kiểm tra trường có thể bị hiểu là công thức. | 1 tiểu ca local: G05-09.csv |
| G06-01 | NOT RUN | Tìm chức năng server lấy URL như import, ảnh từ link, PDF renderer, callback và link preview. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G06-02 | NOT RUN | Trong lab, đối chiếu đích giả đại diện loopback, mạng riêng, link-local và metadata cloud. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G06-03 | NOT RUN | Kiểm tra SSRF qua redirect, DNS đổi địa chỉ, IPv6 và khác biệt chuẩn hóa URL bằng đích thử tự quản. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G06-04 | NOT RUN | Kiểm tra blind SSRF bằng máy nhận thử do nhóm kiểm soát, có mã tương quan cho từng yêu cầu. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G06-05 | NOT RUN | Rà XML, SOAP, SVG, tài liệu Office và tính năng import dùng parser XML. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G06-06 | NOT RUN | Kiểm tra dữ liệu sâu, cấu trúc lặp hoặc dữ liệu giải nén lớn bằng mẫu giới hạn trong lab. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G06-07 | NOT RUN | Thử trường trùng, encoding khác nhau, Content-Type lệch và kiểu dữ liệu không mong đợi. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G07-01 | FAIL | Upload file sai định dạng, tên hai đuôi và MIME không khớp bằng file đánh dấu vô hại. | G07-01.mime-spoof |
| G07-02 | PASS | Kiểm tra file HTML/SVG hoặc nội dung có khả năng chạy mã trong trình duyệt. | 2 tiểu ca local: G07-02.text/html, G07-02.image/svg+xml |
| G07-03 | PASS | Thử tên file hoặc khóa object có đường dẫn, chuẩn hóa khác nhau, symlink trong fixture. | 1 tiểu ca local: G07-03.object-key |
| G07-04 | N/A | Rà import ZIP/archive có đường dẫn thoát thư mục, symlink hoặc dung lượng giải nén vượt giới hạn. | Không có luồng import/giải nén ZIP/archive. |
| G07-05 | NOT RUN | Thử tải file riêng bằng ID, link ký tạm, direct storage URL và link hết hạn. | Tiểu ca anonymous upload PASS; chính sách file riêng/signed link chưa chốt. UUID khó đoán không được coi là quyền sở hữu. |
| G07-06 | PASS | Kiểm tra quota upload theo người dùng, số file, loại nội dung và kích cỡ. | 2 tiểu ca local: G07-06.file-count, G07-06.file-size |
| G07-07 | NOT RUN | Rà worker chuyển đổi, quét file và xử lý ảnh/PDF, gồm file lỗi hoặc chưa quét xong. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G07-08 | NOT RUN | Kiểm tra metadata ảnh, link cũ sau xóa/đổi quyền và bản cache/CDN. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G08-01 | PASS | Kiểm tra reflected XSS từ URL, form, route lỗi và tham số tìm kiếm. | 1 tiểu ca local: G08-01.search |
| G08-02 | FAIL | Kiểm tra stored XSS trong hồ sơ, ghi chú, comment, chat, màn admin, báo cáo và preview. | G08-02.customers |
| G08-03 | NOT RUN | Rà DOM XSS, DOM clobbering và prototype pollution khi đưa URL, postMessage, JSON hoặc localStorage vào sink. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G08-04 | NOT RUN | Kiểm tra trình soạn HTML/Markdown, thư viện sanitize, iframe nhúng và link tạo từ input. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G08-05 | PASS | Thử CSRF với thao tác dùng cookie, gồm login, đổi tài khoản, hủy lịch và các đường gọi khác. | 6 tiểu ca local: G08-05.3, G08-05.7, G08-05.11, G08-05.15, G08-05.write-origin, G08-05.analytics-origin |
| G08-06 | PASS | Kiểm tra CORS với origin tin cậy, origin lạ, null, credential và preflight. | 1 tiểu ca local: G08-06.cors |
| G08-07 | FAIL | Thử nhúng trang nhạy cảm vào iframe ngoài danh sách, và rà postMessage ở cả hai phía. | G08-07.framing |
| G08-08 | NOT RUN | Rà redirect sau đăng nhập, link rút gọn, redirect theo tham số và tab được mở từ link ngoài. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G08-09 | FAIL | Kiểm tra CSP thực thi, frame-ancestors, nosniff, Referrer-Policy, Permissions-Policy và mixed content. | G08-09.headers |
| G08-10 | NOT RUN | Kiểm tra service worker, PWA cache, trình duyệt Back và lưu trữ trên máy dùng chung sau logout. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G09-01 | NOT RUN | Đối chiếu route chạy thật với OpenAPI/gateway; tìm shadow API, endpoint mobile và phiên bản cũ. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G09-02 | FAIL | Gửi thiếu trường, sai kiểu, dư trường, giá trị biên, object lồng sâu và tham số trùng. | G09-02.invalid-clock, G09-02.invalid-calendar, G09-02.malformed-json |
| G09-03 | NOT RUN | So sánh response với nhu cầu UI ở các vai trò, bao gồm query mở rộng và trường lồng nhau. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G09-04 | NOT RUN | Kiểm tra quyền đối với API key, token tích hợp, service account và scope ghi/đọc. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G09-05 | NOT RUN | Thử header override, Content-Type khác, body trong phương thức bất thường và route fallback. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G09-06 | PASS | Kiểm tra pagination, filter, sort, fields, bulk và giới hạn theo tài khoản/endpoint. | 1 tiểu ca local: G09-06.pagination |
| G09-07 | NOT RUN | Kiểm tra endpoint tốn phí hoặc nhạy cảm như OTP, export, email, search và tạo tài nguyên. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G09-08 | PASS | Phát lại yêu cầu ghi đã hoàn thành và kiểm tra idempotency key giữa người dùng khác nhau. | 1 tiểu ca local: G09-08.payment-key-conflict |
| G09-09 | NOT RUN | Rà API trả lỗi, retry của client và cache của response có xác thực. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G10-01 | N/A | Thử GraphQL query/mutation vào object, field lồng nhau và global node ID của tài khoản B. | Không có GraphQL/WebSocket/SSE nghiệp vụ trong app; HMR của dev không được coi là realtime nghiệp vụ. |
| G10-02 | N/A | Thử độ sâu, độ phức tạp, aliases, batching và query rộng trong giới hạn lab. | Không có GraphQL/WebSocket/SSE nghiệp vụ trong app; HMR của dev không được coi là realtime nghiệp vụ. |
| G10-03 | N/A | Rà introspection, playground, persisted query và phản hồi lỗi GraphQL. | Không có GraphQL/WebSocket/SSE nghiệp vụ trong app; HMR của dev không được coi là realtime nghiệp vụ. |
| G10-04 | N/A | Kiểm tra GraphQL dùng cookie qua GET/POST và các Content-Type khác nhau. | Không có GraphQL/WebSocket/SSE nghiệp vụ trong app; HMR của dev không được coi là realtime nghiệp vụ. |
| G10-05 | N/A | Kiểm tra WebSocket handshake, Origin, cookie/token, TLS và xác thực lại sau reconnect. | Không có GraphQL/WebSocket/SSE nghiệp vụ trong app; HMR của dev không được coi là realtime nghiệp vụ. |
| G10-06 | N/A | Sau khi mở WebSocket/SSE, thử tham gia kênh B, gửi message sai schema hoặc đổi topic. | Không có GraphQL/WebSocket/SSE nghiệp vụ trong app; HMR của dev không được coi là realtime nghiệp vụ. |
| G10-07 | N/A | Thu hồi quyền giữa phiên kết nối; kiểm tra replay, reconnect và dữ liệu backlog. | Không có GraphQL/WebSocket/SSE nghiệp vụ trong app; HMR của dev không được coi là realtime nghiệp vụ. |
| G10-08 | N/A | Kiểm tra kích cỡ message, tốc độ gửi, số connection và idle timeout ở lab. | Không có GraphQL/WebSocket/SSE nghiệp vụ trong app; HMR của dev không được coi là realtime nghiệp vụ. |
| G11-01 | NOT RUN | Chỉnh giá, giảm giá, tiền cọc, tiền còn lại, thuế, số lượng hoặc đơn vị tiền gửi từ trình duyệt. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G11-02 | FAIL | Bỏ qua bước, đảo thứ tự, gọi trạng thái cuối trực tiếp hoặc sửa trạng thái đã khóa. | G11-02.booking-window |
| G11-03 | PASS | Thử số âm, 0, số rất lớn, số thập phân, làm tròn và múi giờ/giờ biên. | 6 tiểu ca local: G11-03.money--1, G11-03.money-0, G11-03.money-0.5, G11-03.money-1000000001, G11-03.money-NaN, G11-03.overpayment |
| G11-04 | PASS | Gửi đồng thời hai thao tác tranh một slot/ưu đãi/tài nguyên duy nhất trong staging. | 1 tiểu ca local: G11-04.slot-race |
| G11-05 | PASS | Gửi lại yêu cầu đặt lịch, hoàn tiền hoặc xác nhận sau timeout/mất mạng. | 2 tiểu ca local: G11-05.booking-replay, G11-05.payment-replay |
| G11-06 | NOT RUN | Thử dùng coupon hết hạn, sai đối tượng, nhiều tài khoản và kết hợp ưu đãi ngoài quy tắc. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G11-07 | PASS | Kiểm tra hủy, hoàn tiền, chuyển lịch, khôi phục và tranh chấp sau mốc hết hạn. | 1 tiểu ca local: G11-07.overrefund |
| G11-08 | NOT RUN | Mô phỏng spam form, giữ chỗ, đăng ký hoặc gửi tin với số lượng nhỏ được phê duyệt. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G11-09 | NOT RUN | Kiểm tra mã mời, link xác nhận, mã tra cứu biên nhận và quyền chia sẻ. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G11-10 | PASS | So sánh màn hình khách, admin, file xuất và thông báo sau giao dịch thành công/thất bại. | 1 tiểu ca local: G11-10.payment-report |
| G12-01 | N/A | Gửi webhook sandbox thiếu chữ ký, sai chữ ký, body bị chỉnh hoặc timestamp quá cũ. | Không có webhook thanh toán/gửi đi. Thu tiền hiện ghi sổ thủ công; không có cổng thanh toán tự động để kiểm chữ ký. |
| G12-02 | N/A | Gửi lại event đã xử lý, trùng ID, đến sai thứ tự hoặc retry đồng thời. | Không có webhook thanh toán/gửi đi. Thu tiền hiện ghi sổ thủ công; không có cổng thanh toán tự động để kiểm chữ ký. |
| G12-03 | N/A | Thay mã đơn, số tiền, tiền tệ và tài khoản nhận trong sự kiện thanh toán giả. | Không có webhook thanh toán/gửi đi. Thu tiền hiện ghi sổ thủ công; không có cổng thanh toán tự động để kiểm chữ ký. |
| G12-04 | NOT RUN | Mô phỏng đối tác trả schema sai, URL bất thường, nội dung không tin cậy hoặc lỗi. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G12-05 | NOT RUN | Rà quyền và nơi lưu khóa Maps, mail, SMS, thanh toán, storage và API bên thứ ba. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G12-06 | N/A | Kiểm tra webhook gửi đi, cấu hình URL callback, redirect và header bí mật. | Không có webhook thanh toán/gửi đi. Thu tiền hiện ghi sổ thủ công; không có cổng thanh toán tự động để kiểm chữ ký. |
| G12-07 | NOT RUN | Thử timeout và retry đối tác bằng mock/sandbox; kiểm queue, lịch retry và hàng chờ lỗi. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G12-08 | PASS | Đối chiếu dữ liệu gửi cho analytics, email/SMS, bản đồ và công cụ theo dõi lỗi. | 1 tiểu ca local: G12-08.analytics-redaction |
| G13-01 | N/A | Kiểm tra redirect URI được đăng ký và callback qua domain/đường dẫn khác. | Không có OAuth/OIDC/SAML/SSO. |
| G13-02 | N/A | Thử state/nonce thiếu, sai, hết hạn hoặc dùng lại từ luồng khác; kiểm PKCE khi áp dụng. | Không có OAuth/OIDC/SAML/SSO. |
| G13-03 | N/A | Thử token/code sai client, issuer, audience, phạm vi hoặc loại token. | Không có OAuth/OIDC/SAML/SSO. |
| G13-04 | N/A | Kiểm tra nối tài khoản qua email trùng, email chưa xác minh và đổi danh tính nhà cung cấp. | Không có OAuth/OIDC/SAML/SSO. |
| G13-05 | N/A | Rà cấp quyền tự động theo domain/nhóm, người dùng rời tổ chức và SSO role mapping. | Không có OAuth/OIDC/SAML/SSO. |
| G13-06 | N/A | Nếu dùng SAML, kiểm tra chữ ký, phần assertion thực sự được xác thực, audience, recipient, hạn dùng và replay. | Không có OAuth/OIDC/SAML/SSO. |
| G13-07 | N/A | Kiểm tra logout liên kết, thay khóa xác minh, fallback và lỗi IdP. | Không có OAuth/OIDC/SAML/SSO. |
| G14-01 | BLOCKED | Rà Host, X-Forwarded-Host/Proto/For và tạo link reset qua host/header giả trong staging. | Chưa có domain/triển khai và quyền đọc cấu hình cloud/CDN/IAM/backup để xác minh; local không thay thế được bằng chứng đó. |
| G14-02 | PASS | Kiểm tra response riêng qua CDN/proxy ở hai phiên A/B; rà Cache-Control, Vary và cache key. | 4 tiểu ca local: G14-02.60, G14-02.61, G14-02.62, G14-02.63 |
| G14-03 | NOT RUN | Thử cache poisoning/deception với route động, URL có phần mở rộng giả và header không nằm trong cache key. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G14-04 | BLOCKED | Trong lab, đối chiếu cách CDN/proxy/origin xử lý độ dài request, HTTP/2→HTTP/1 và request mơ hồ. | Chưa có domain/triển khai và quyền đọc cấu hình cloud/CDN/IAM/backup để xác minh; local không thay thế được bằng chứng đó. |
| G14-05 | NOT RUN | Thử path normalization, URL encode, slash, chữ hoa/thường và route viết lại. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G14-06 | BLOCKED | Kiểm tra địa chỉ IP thực, access log, geo/IP allowlist và rate limit qua lớp proxy. | Chưa có domain/triển khai và quyền đọc cấu hình cloud/CDN/IAM/backup để xác minh; local không thay thế được bằng chứng đó. |
| G14-07 | BLOCKED | Rà origin trực tiếp, ingress phụ và danh sách trusted proxy; so chính sách khi CDN không sẵn sàng. | Chưa có domain/triển khai và quyền đọc cấu hình cloud/CDN/IAM/backup để xác minh; local không thay thế được bằng chứng đó. |
| G14-08 | BLOCKED | Kiểm tra WAF với yêu cầu hợp lệ và mẫu thử vô hại; rà quy tắc ngoại lệ. | Chưa có domain/triển khai và quyền đọc cấu hình cloud/CDN/IAM/backup để xác minh; local không thay thế được bằng chứng đó. |
| G15-01 | NOT RUN | Tìm secret, token, mật khẩu và dữ liệu khách trong bundle, source map, repo, artifact, log và CI. | 159 file client được quét 5 mẫu, không có khớp; chưa quét entropy, toàn lịch sử Git, log và CI. |
| G15-02 | BLOCKED | Kiểm tra TLS trên đường vào và giữa các thành phần mang dữ liệu nhạy cảm theo kiến trúc. | Chưa có domain/triển khai và quyền đọc cấu hình cloud/CDN/IAM/backup để xác minh; local không thay thế được bằng chứng đó. |
| G15-03 | BLOCKED | Rà mã hóa lưu trữ, quản lý key, môi trường, rotation và quyền giải mã. | Chưa có domain/triển khai và quyền đọc cấu hình cloud/CDN/IAM/backup để xác minh; local không thay thế được bằng chứng đó. |
| G15-04 | NOT RUN | Rà RNG và vòng đời token reset, invite, share và link ký. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G15-05 | NOT RUN | Rà thuật toán, nonce/IV, chữ ký và cách kiểm tra tính toàn vẹn trong code. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G15-06 | NOT RUN | Kiểm tra dữ liệu nhạy cảm trong query string, referer, log, crash report, analytics và ảnh chụp. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G15-07 | NOT RUN | Rà link hóa đơn/biên nhận, địa chỉ/tọa độ, bản in, export, lịch sử trình duyệt và search indexing. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G15-08 | NOT RUN | Kiểm tra chính sách lưu, xóa và sao chép sang staging; dùng bản ghi giả để xác minh. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G15-09 | BLOCKED | Thử backup, bản sao DB, quyền export và khôi phục trong môi trường tách biệt. | Chưa có domain/triển khai và quyền đọc cấu hình cloud/CDN/IAM/backup để xác minh; local không thay thế được bằng chứng đó. |
| G16-01 | PASS | Lập danh sách dependency trực tiếp/gián tiếp, framework, image nền, plugin, CMS và JS từ CDN. | Kiểm kê package.json/package-lock, phiên bản cài đặt và route; npm audit kiểm tree dependency. Chỉ phạm vi checkout, không inventory cloud. |
| G16-02 | BLOCKED | Quét advisory/CVE, rà mã bị ảnh hưởng, phiên bản và khả năng gọi tới đường lỗi. | npm audit có advisory ở 41 package; chưa hoàn tất đánh giá reachability và kế hoạch phiên bản tương thích. Không chạy exploit CVE/tải. |
| G16-03 | NOT RUN | Rà lockfile, registry, nguồn package, nguy cơ typosquatting/dependency confusion và install scripts. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G16-04 | BLOCKED | Rà hành vi CI với pull request từ fork, pipeline secret, runner và quyền của token. | Chưa có quyền/đối chứng pipeline, branch protection và provenance triển khai; biết Git HEAD không xác minh được các cấu hình này. |
| G16-05 | BLOCKED | Rà bảo vệ branch, quyền merge, thay đổi pipeline và phê duyệt triển khai. | Chưa có quyền/đối chứng pipeline, branch protection và provenance triển khai; biết Git HEAD không xác minh được các cấu hình này. |
| G16-06 | BLOCKED | Kiểm tra artifact provenance/chữ ký, digest image, source commit và cơ chế cập nhật. | Chưa có quyền/đối chứng pipeline, branch protection và provenance triển khai; biết Git HEAD không xác minh được các cấu hình này. |
| G16-07 | NOT RUN | Rà script bên thứ ba và quyền truy cập DOM trên trang đăng nhập/thanh toán. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G16-08 | NOT RUN | Quét secret trong lịch sử, build artifact, log CI và cấu hình IaC. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G17-01 | BLOCKED | Rà IAM, tài khoản root/admin, MFA, quyền service account và quyền truy cập chéo môi trường. | Chưa có domain/triển khai và quyền đọc cấu hình cloud/CDN/IAM/backup để xác minh; local không thay thế được bằng chứng đó. |
| G17-02 | BLOCKED | Rà port, firewall/security group, DB, Redis/cache, queue, dashboard quản trị và đường truy cập từ Internet. | Chưa có domain/triển khai và quyền đọc cấu hình cloud/CDN/IAM/backup để xác minh; local không thay thế được bằng chứng đó. |
| G17-03 | BLOCKED | Kiểm ACL bucket, policy public, signed URL, CDN, backup và quyền liệt kê. | Chưa có domain/triển khai và quyền đọc cấu hình cloud/CDN/IAM/backup để xác minh; local không thay thế được bằng chứng đó. |
| G17-04 | BLOCKED | Rà phiên bản OS/runtime, dịch vụ thừa, cấu hình container, filesystem và worker. | Chưa có domain/triển khai và quyền đọc cấu hình cloud/CDN/IAM/backup để xác minh; local không thay thế được bằng chứng đó. |
| G17-05 | BLOCKED | Kiểm quyền DB của ứng dụng, migration, báo cáo và tài khoản backup. | Chưa có domain/triển khai và quyền đọc cấu hình cloud/CDN/IAM/backup để xác minh; local không thay thế được bằng chứng đó. |
| G17-06 | BLOCKED | Rà secrets manager, quyền lấy credential, workload identity và egress. | Chưa có domain/triển khai và quyền đọc cấu hình cloud/CDN/IAM/backup để xác minh; local không thay thế được bằng chứng đó. |
| G17-07 | BLOCKED | Nếu có Kubernetes/serverless, rà ingress, policy mạng, secret, metadata và role thực thi. | Chưa có domain/triển khai và quyền đọc cấu hình cloud/CDN/IAM/backup để xác minh; local không thay thế được bằng chứng đó. |
| G17-08 | BLOCKED | Đối chiếu IaC với cấu hình chạy thật để tìm drift giữa staging và production. | Chưa có domain/triển khai và quyền đọc cấu hình cloud/CDN/IAM/backup để xác minh; local không thay thế được bằng chứng đó. |
| G17-09 | BLOCKED | Kiểm tra quyền quản trị nhà cung cấp DNS/CDN/hosting và quy trình thu hồi quyền nhân sự. | Chưa có domain/triển khai và quyền đọc cấu hình cloud/CDN/IAM/backup để xác minh; local không thay thế được bằng chứng đó. |
| G18-01 | NOT RUN | Gửi input thiếu, sai, kích cỡ chạm ngưỡng hoặc request bị ngắt; rà trang lỗi. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G18-02 | NOT RUN | Trong staging, giả lập lỗi DB, cache hoặc dịch vụ kiểm quyền. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G18-03 | NOT RUN | Giả lập timeout giữa cập nhật dữ liệu và gọi tác vụ nền/đối tác. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G18-04 | NOT RUN | Kiểm giới hạn body, upload, pagination, query, kết nối, thời gian xử lý và job chạy nền. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G18-05 | NOT RUN | Rà regex, parser, tìm kiếm và filter dễ tiêu tốn CPU; thử mẫu nhỏ tăng dần trong lab. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G18-06 | NOT RUN | Kiểm tra quota theo IP, tài khoản, tenant và endpoint; xem cách bảo vệ luồng đắt tiền. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G18-07 | NOT RUN | Thử queue backlog, số job đồng thời, export lớn và xử lý yêu cầu lặp trong môi trường tách biệt. | Chưa thực hiện đầy đủ biến thể/đối chứng của tình huống này trong đợt hiện tại; không suy từ code hoặc ca gần giống thành PASS. |
| G18-08 | BLOCKED | Mô phỏng mất CDN/đối tác hoặc hết quota; kiểm tra ngưỡng cảnh báo và phục hồi. | Chưa có domain/triển khai và quyền đọc cấu hình cloud/CDN/IAM/backup để xác minh; local không thay thế được bằng chứng đó. |
| G19-01 | BLOCKED | Tạo sự kiện thử cho đăng nhập sai, MFA fail, reset, khóa tài khoản và token replay. | Chưa có môi trường/log/alert/runbook vận hành và quyền quản trị cần thiết; không phát sinh sự kiện phá hủy để giả định đạt. |
| G19-02 | BLOCKED | Tạo sự kiện thử cho từ chối quyền, đổi role, export, thao tác admin và truy cập dữ liệu quan trọng. | Chưa có môi trường/log/alert/runbook vận hành và quyền quản trị cần thiết; không phát sinh sự kiện phá hủy để giả định đạt. |
| G19-03 | BLOCKED | Kiểm cảnh báo với đăng nhập sai nhiều lần, tải dữ liệu bất thường hoặc lỗi webhook trong môi trường thử. | Chưa có môi trường/log/alert/runbook vận hành và quyền quản trị cần thiết; không phát sinh sự kiện phá hủy để giả định đạt. |
| G19-04 | BLOCKED | Dùng correlation ID nối CDN, API, DB audit và job; đối chiếu múi giờ/thời gian. | Chưa có môi trường/log/alert/runbook vận hành và quyền quản trị cần thiết; không phát sinh sự kiện phá hủy để giả định đạt. |
| G19-05 | BLOCKED | Rà RBAC, thời hạn lưu và quyền xóa/sửa audit log. | Chưa có môi trường/log/alert/runbook vận hành và quyền quản trị cần thiết; không phát sinh sự kiện phá hủy để giả định đạt. |
| G19-06 | BLOCKED | Kiểm tra làm sạch dữ liệu log, log injection và che PII/secret trên cả lỗi lẫn luồng thành công. | Chưa có môi trường/log/alert/runbook vận hành và quyền quản trị cần thiết; không phát sinh sự kiện phá hủy để giả định đạt. |
| G19-07 | BLOCKED | Diễn tập lộ API key hoặc tài khoản admin trên môi trường thử. | Chưa có môi trường/log/alert/runbook vận hành và quyền quản trị cần thiết; không phát sinh sự kiện phá hủy để giả định đạt. |
| G19-08 | BLOCKED | Diễn tập khôi phục backup và quay lui bản deploy trong môi trường tách biệt. | Chưa có môi trường/log/alert/runbook vận hành và quyền quản trị cần thiết; không phát sinh sự kiện phá hủy để giả định đạt. |
| G20-01 | N/A | Đưa yêu cầu đánh lạc hướng trực tiếp hoặc qua file/web được chatbot đọc (prompt injection). | Không có LLM, RAG hay tool-calling trong API được kiểm kê. |
| G20-02 | N/A | Dùng hai tài khoản thử truy xuất file, lịch sử, bộ nhớ hoặc dữ liệu RAG của người khác. | Không có LLM, RAG hay tool-calling trong API được kiểm kê. |
| G20-03 | N/A | Yêu cầu bot gọi công cụ thực hiện thao tác nhạy cảm, đổi đối tượng đích hoặc bỏ qua bước xác nhận. | Không có LLM, RAG hay tool-calling trong API được kiểm kê. |
| G20-04 | N/A | Rà bí mật trong prompt, kết quả tool, debug log và dữ liệu gửi tới nhà cung cấp. | Không có LLM, RAG hay tool-calling trong API được kiểm kê. |
| G20-05 | N/A | Đưa output mô hình vào HTML, SQL, email, ticket hoặc pipeline tự động trong staging. | Không có LLM, RAG hay tool-calling trong API được kiểm kê. |
| G20-06 | N/A | Thử giới hạn token, số lần gọi tool, thời gian và chi phí theo tài khoản. | Không có LLM, RAG hay tool-calling trong API được kiểm kê. |
