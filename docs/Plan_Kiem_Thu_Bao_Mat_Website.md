# Kế hoạch kiểm thử bảo mật website

> Kết quả sau bản vá: [103/103 tiểu ca local đạt; phạm vi và phần chưa kiểm](Khac_Phu_Bao_Mat_2026-11-04.md). Số liệu cũ bên dưới thuộc đợt trước vá, được giữ để đối chiếu.

**Dùng cho QA, developer và người quản trị website.** Bắt đầu bằng kiểm kê tài sản, sau đó kiểm tra theo rủi ro trên giao diện, API, mã nguồn và hạ tầng. Mỗi tình huống dưới đây có mã để ghi kết quả, tạo lỗi và kiểm tra lại. Một tình huống có thể sinh nhiều ca test theo endpoint, vai trò, quyền sở hữu và môi trường.

Không có đợt kiểm thử nào chứng minh website không còn lỗ hổng. Mục tiêu của kế hoạch là xác minh các kiểm soát trong phạm vi đã chốt, chỉ rõ phần chưa kiểm tra và giữ lại bằng chứng để lần sau chạy lại được.

## 1. Chuẩn bị trước khi test

| Việc cần chốt | Cách làm |
|---|---|
| Phạm vi | Liệt kê chính xác domain/subdomain, frontend, admin, API, kho file, CDN, máy chủ, repository, dịch vụ nền và tích hợp. Ghi người sở hữu, bản build/commit, môi trường và tài sản ngoài phạm vi. Chỉ kiểm thử hệ thống bạn sở hữu hoặc được phép kiểm thử. |
| Luồng và dữ liệu | Vẽ luồng từ trình duyệt qua CDN/proxy tới API, cơ sở dữ liệu, kho file và bên thứ ba. Đánh dấu dữ liệu khách, mật khẩu, token, khóa API, giao dịch và điểm chuyển quyền tin cậy. |
| Môi trường | Dùng staging có cấu hình kiểm soát tương đương production, dữ liệu giả và tài khoản riêng. Email, SMS, thanh toán dùng sandbox hoặc máy nhận giả. Xác nhận backup và cách quay lại trạng thái ban đầu. |
| Vai trò thử | Chuẩn bị khách chưa đăng nhập, khách A, khách B, nhân viên giới hạn, admin, tài khoản bị khóa/thu hồi; thêm tài khoản ở tổ chức B nếu hệ thống đa tổ chức. Tạo bản ghi A/B với giá trị đánh dấu dễ nhận ra. |
| Kiểu tiếp cận | Hộp đen: nhìn như khách ngoài. Hộp xám: dùng tài khoản kiểm thử theo vai trò. Hộp trắng: đọc code, cấu hình, pipeline, quyền cloud và log. Nếu thiếu một kiểu tiếp cận, ghi rõ phần không thể xác minh. |
| Giới hạn thực thi | Trên production chỉ đối chiếu cấu hình và xác minh lưu lượng thấp đã thống nhất. Quét chủ động, fuzzing, kiểm tra đồng thời, fault injection và tải thực hiện trong môi trường cô lập với hạn mức. |
| Điều kiện dừng | Dừng nếu chạm dữ liệu thật ngoài dự kiến, phát sinh email/SMS/giao dịch thật, test đi ra ngoài phạm vi hoặc vượt ngưỡng lỗi/độ trễ đã thống nhất. Ghi thời điểm, mã test và báo người phụ trách. |

**Đầu ra của bước chuẩn bị:** bảng tài sản, sơ đồ luồng dữ liệu và ma trận quyền. Bảng API tối thiểu có: phương thức, đường dẫn, phiên bản, nguồn phát hiện, xác thực, vai trò, chủ sở hữu bản ghi, trường được đọc/sửa, tích hợp, giới hạn sử dụng và người phụ trách. Đối chiếu DevTools, OpenAPI, route trong code, gateway và log đã lọc để tìm endpoint ẩn hoặc cũ.

**Ma trận quyền mẫu.** Sửa theo quy tắc thực tế trước khi dùng làm kết quả mong đợi:

| Hành động | Chưa đăng nhập | Khách chủ sở hữu | Khách khác | Nhân viên | Admin |
|---|---|---|---|---|---|
| Đọc lịch riêng | Từ chối nếu không có link được cấp | Lịch của mình | Từ chối | Theo lịch được giao | Theo quyền cấu hình |
| Sửa/hủy lịch | Từ chối nếu không có link đúng phạm vi | Theo trạng thái và thời hạn | Từ chối | Theo quyền và phạm vi | Theo quyền và trạng thái |
| Xuất dữ liệu khách | Từ chối | Chỉ dữ liệu của mình nếu có chức năng | Từ chối | Chỉ khi được cấp quyền xuất | Có quyền xuất và ghi audit |
| Thay đổi quyền tài khoản | Từ chối | Từ chối | Từ chối | Từ chối trừ quyền quản trị được ủy quyền | Theo quyền quản trị và ghi audit |

## 2. Thứ tự thực hiện

| Vòng | Làm gì | Đầu ra |
|---|---|---|
| 1 · Kiểm kê | Chốt phạm vi, kiến trúc, tài khoản, role matrix và luồng dễ bị lạm dụng. Thu dữ liệu từ cấu hình và các lượt dùng bình thường. | Danh mục bề mặt tấn công; tài sản thiếu quyền truy cập. |
| 2 · Luồng có tác động lớn | Dùng hai tài khoản đối chiếu quyền. Kiểm tra đăng nhập, reset, phiên, admin, upload, dữ liệu riêng và các luồng tiền/lịch nếu có. | Bằng chứng truy cập hoặc thay đổi trái quyền, hoặc kết quả từ chối đúng. |
| 3 · Phủ toàn bộ nhóm áp dụng | Chạy danh sách ca kiểm thử dưới đây. Kết hợp thủ công, đọc code/cấu hình và quét có giới hạn. Mở rộng theo stack và luồng thực tế. | Ma trận kết quả, lỗi xác nhận, phần bị chặn và lý do. |
| 4 · Sửa và test lại | Sửa theo mức ảnh hưởng. Chạy lại ca lỗi, ca hợp lệ và các endpoint dùng chung middleware, bộ lọc hoặc logic nghiệp vụ. | Bằng chứng trước/sau, test hồi quy và báo cáo nghiệm thu. |

**Khi ít thời gian**, làm trước G04-01/02/03/04, G02-05, G03-03/04, G01-03, G15-01, rồi nhóm áp dụng cho thanh toán, đặt lịch, upload hoặc tích hợp. Đây là thứ tự ưu tiên chạy test; mức nghiêm trọng của lỗi được quyết định sau khi xác nhận tác động.

## 3. Danh mục kiểm thử

Cột **Đạt khi** mô tả tiêu chí có thể kiểm chứng. Với mỗi ca, tạo ít nhất một yêu cầu hợp lệ làm đối chứng và một yêu cầu vi phạm quy tắc. Mở rộng cho các phương thức, phiên bản API, loại nội dung và điểm vào có liên quan. Dùng dữ liệu đánh dấu, dịch vụ giả và kiểm tra log/DB để xác nhận tác động khi cần.

### G01 · Bề mặt công khai và cấu hình triển khai

| Mã | Thử gì | Đạt khi |
|---|---|---|
| G01-01 | Đối chiếu domain, subdomain, admin, staging, origin và các phiên bản deploy với DNS, tài liệu và cấu hình. | Tài sản công khai có chủ sở hữu và mục đích; môi trường nội bộ có kiểm soát truy cập. |
| G01-02 | Rà route ẩn, endpoint cũ, debug, Swagger, dashboard metrics/health và đường dẫn dev. | Route nhạy cảm tắt hoặc có quyền đúng; health công khai chỉ trả thông tin tối thiểu. |
| G01-03 | Xem cấu hình phục vụ file, bundle và lịch sử repo để tìm .env, .git, bản sao DB, file backup và khóa. | Không lộ dữ liệu nội bộ hay bí mật; secret từng lộ được thu hồi/đổi và rà truy cập. |
| G01-04 | Kiểm tra directory listing, thư mục build, source map và các file dư. | File dư không truy cập được; source map công khai là quyết định có chủ đích và không chứa bí mật. |
| G01-05 | Rà HTTP→HTTPS, chứng chỉ theo host, hạn dùng, chuỗi tin cậy, giao thức/cipher và HSTS. | HTTPS theo cấu hình mục tiêu; luồng nhạy cảm không gửi thông tin qua HTTP. |
| G01-06 | So sánh quyền và hành vi giữa hostname chính, domain mặc định của nhà cung cấp và origin. | Không có đường phụ bỏ qua xác thực hoặc lớp bảo vệ bắt buộc. |
| G01-07 | Rà DNS treo, tài nguyên hosting đã xóa, DNS quản trị và subdomain cũ. | Không có bản ghi trỏ vào tài nguyên có nguy cơ bị chiếm; xác minh bằng cấu hình, không đăng ký lại tài nguyên. |
| G01-08 | Kiểm tra các HTTP method được bật, chế độ debug, credential mặc định và công cụ quản trị cài sẵn. | Chỉ mở phương thức và dịch vụ có nhu cầu; tài khoản/cấu hình mặc định không dùng được. |

### G02 · Đăng nhập và khôi phục tài khoản

| Mã | Thử gì | Đạt khi |
|---|---|---|
| G02-01 | So sánh phản hồi đăng nhập, đăng ký và reset với tài khoản tồn tại/không tồn tại. | Không suy ra danh sách tài khoản từ nội dung, mã lỗi hoặc khác biệt thời gian rõ rệt. |
| G02-02 | Thử giới hạn đăng nhập sai với tài khoản giả, trong ngân sách đã chốt; kiểm tra cấu hình chống credential stuffing. | Hệ thống hạn chế thử sai hợp lý theo tài khoản và nguồn, có giám sát và giảm nguy cơ khóa hàng loạt người dùng. |
| G02-03 | Rà quy tắc mật khẩu, lưu trữ hash và kiểm tra mật khẩu yếu theo chính sách. | Máy chủ thực thi chính sách; mật khẩu lưu bằng hàm băm dành cho mật khẩu với salt và tham số phù hợp. |
| G02-04 | Thử gọi trực tiếp API chức năng khi mới hoàn thành bước mật khẩu, chưa qua MFA. | Phiên chưa hoàn thành MFA không có quyền tương đương phiên đã xác thực đầy đủ. |
| G02-05 | Dùng token reset hết hạn, đã dùng, của tài khoản khác và token cấp trước một lần reset thành công. | Token có phạm vi, hết hạn và chỉ dùng một lần; token không còn hợp lệ không đổi được mật khẩu. |
| G02-06 | Kiểm tra OTP, resend, recovery code và hạ cấp phương thức MFA. | Có giới hạn thử/gửi; mã cũ, sai mục đích hoặc đã dùng bị từ chối; luồng fallback không bỏ qua xác minh. |
| G02-07 | Đổi email, mật khẩu, số điện thoại, gỡ MFA hoặc liên kết tài khoản từ phiên cũ. | Thao tác nhạy cảm có xác minh lại phù hợp; thông báo và thu hồi phiên thực hiện theo chính sách. |
| G02-08 | Thử đăng nhập bằng API, ứng dụng khác, invite, magic link và tài khoản đã khóa/thu hồi. | Mọi kênh áp dụng mức kiểm soát phù hợp; tài khoản bị vô hiệu không đăng nhập được. |

### G03 · Phiên đăng nhập và token

| Mã | Thử gì | Đạt khi |
|---|---|---|
| G03-01 | Đối chiếu cookie phiên: Secure, HttpOnly, SameSite, Domain/Path và tuổi thọ. | Thuộc tính phù hợp thiết kế, phạm vi tối thiểu; cookie nhạy cảm không xuất hiện ở kênh không cần thiết. |
| G03-02 | Đăng nhập hoặc nâng quyền từ phiên đã có; thử lại định danh phiên cũ. | Định danh phiên được xoay khi cần; định danh cũ không nhận quyền mới. |
| G03-03 | Gọi lại API bằng phiên đã logout, quá thời hạn, hoặc tài khoản vừa bị khóa/hạ quyền. | Máy chủ áp dụng thời hạn và thu hồi đúng chính sách; quyền mới có hiệu lực trong thời gian đã cam kết. |
| G03-04 | Thử JWT sửa nội dung/chữ ký, sai issuer/audience, sai loại token, hết hạn và key không tin cậy. | Xác minh chữ ký, thuật toán cho phép và các claim bắt buộc; loại token sai bị từ chối. |
| G03-05 | Thử refresh token cũ sau khi xoay vòng, dùng lại token đã thu hồi và thử refresh đồng thời trong staging. | Xử lý replay/đồng thời theo thiết kế; không phát sinh thêm phiên ngoài quyền đã cấp. |
| G03-06 | Rà URL, Referer, web storage, cache, log, analytics và error monitoring. | Token không rò qua URL/log/tracker; nơi lưu và tuổi thọ phù hợp mô hình đe dọa. |
| G03-07 | Kiểm tra phiên giữa thiết bị, thay mật khẩu, xóa thiết bị tin cậy và thu hồi mọi phiên. | Quy tắc thu hồi thực sự được áp dụng trên các endpoint bảo vệ. |
| G03-08 | Kiểm tra API chấp nhận đồng thời cookie, bearer, service token hoặc token link. | Thứ tự ưu tiên và ranh giới từng loại credential rõ ràng; credential yếu không mở quyền mạnh hơn. |

### G04 · Phân quyền và cách ly dữ liệu

| Mã | Thử gì | Đạt khi |
|---|---|---|
| G04-01 | Khách A thử đọc bản ghi của B qua ID có sẵn trong bộ dữ liệu test (IDOR/BOLA). | Từ chối truy cập; body, cache, redirect và thông báo không lộ nội dung của B. |
| G04-02 | Với cùng bản ghi B, thử sửa/xóa, hủy, duyệt, tải file, tải hóa đơn và xem lịch sử. | Không đổi DB, kho file hoặc tác vụ nền; không tải được file qua đường phụ. |
| G04-03 | Dùng khách hoặc nhân viên giới hạn gọi trực tiếp API admin (leo thang quyền/BFLA). | Quyền được kiểm tra ở máy chủ trên từng chức năng; ẩn nút chỉ là giao diện. |
| G04-04 | Gửi thêm trường ngoài form như role, ownerId, tenantId, status, amount (mass assignment). | Máy chủ từ chối hoặc bỏ qua trường ngoài quyền; ghi DB và response đúng quy tắc từng trường. |
| G04-05 | Rà API list/search/autocomplete/export, cả số đếm và các trường lồng nhau. | Bộ lọc quyền áp dụng từ truy vấn; không trả thuộc tính nhạy cảm hoặc kết quả của B. |
| G04-06 | Đổi phương thức, loại nội dung, route alias, phiên bản API hoặc đối tượng cha trong URL. | Quyền không bị bỏ qua khi cùng chức năng được truy cập theo đường khác. |
| G04-07 | Kiểm tra truy cập chéo tổ chức/chi nhánh qua user, job, CDN, cache, file và export. | Tenant được xác định từ ngữ cảnh tin cậy; bản ghi và tác vụ bị cách ly ở mọi lớp. |
| G04-08 | Truy cập lại sau khi tài nguyên đổi chủ, lời mời bị hủy hoặc vai trò bị hạ. | Quyền thay đổi được thực thi theo thời hạn cam kết trên phiên, link, cache và job. |
| G04-09 | Thử batch với hỗn hợp bản ghi được phép và bị cấm, cả tạo/sửa/xóa. | Mỗi bản ghi được kiểm quyền; kết quả một phần hoặc rollback đúng đặc tả, không tác động ngoài quyền. |
| G04-10 | Kiểm tra riêng quyền dịch vụ, công việc nền, chức năng impersonation và tài khoản hỗ trợ. | Quyền tối thiểu; thao tác mạo danh có giới hạn, dấu vết và không vượt phạm vi được giao. |

### G05 · Injection và thực thi mã phía máy chủ

| Mã | Thử gì | Đạt khi |
|---|---|---|
| G05-01 | Rà SQL injection từ query, form, JSON, cookie, header, search, sort và trường lưu rồi xử lý sau. | Truy vấn dùng tham số; phần cấu trúc như sort được giới hạn; không thay đổi điều kiện truy vấn ngoài dự kiến. |
| G05-02 | Kiểm tra NoSQL injection và ORM qua object toán tử, trường lồng nhau hoặc kiểu dữ liệu khác dự kiến. | Schema và kiểu dữ liệu chặt; input không trở thành toán tử hoặc truy vấn tùy ý. |
| G05-03 | Rà command/argument injection tại tác vụ xử lý file, ảnh, PDF, backup hoặc công cụ dòng lệnh. | Dữ liệu người dùng không biến thành lệnh hoặc tham số nguy hiểm; worker chạy quyền tối thiểu. |
| G05-04 | Kiểm tra template injection trong email, biên nhận, preview, báo cáo và template tùy chỉnh. | Nội dung người dùng được truyền như dữ liệu; không đánh giá như biểu thức hay mã. |
| G05-05 | Kiểm tra LDAP, XPath hoặc bộ máy tìm kiếm nếu sử dụng; xem cả trường lọc admin. | Dữ liệu không thể thay đổi cấu trúc truy vấn; có mã hóa hoặc API an toàn theo ngữ cảnh. |
| G05-06 | Rà eval, dynamic import, script runner và xử lý chuỗi cấu hình do người dùng kiểm soát. | Không thực thi mã tùy ý từ dữ liệu ngoài; chức năng script hợp lệ có sandbox và quyền rõ ràng. |
| G05-07 | Kiểm tra deserialize dữ liệu từ cookie, queue, file import, payload nhị phân hoặc plugin. | Định dạng/schema được giới hạn; không khởi tạo kiểu đối tượng hoặc chạy hook tùy ý. |
| G05-08 | Thử dữ liệu có ký tự điều khiển vào header, email và log (CRLF, header/mail/log injection). | Không sinh header/dòng log giả, đổi người nhận hoặc thay đổi cấu trúc bản tin. |
| G05-09 | Xuất dữ liệu đánh dấu sang CSV/bảng tính; kiểm tra trường có thể bị hiểu là công thức. | File xuất xử lý dữ liệu người dùng như văn bản trong trình đọc được hỗ trợ. |

### G06 · SSRF và trình phân tích dữ liệu

| Mã | Thử gì | Đạt khi |
|---|---|---|
| G06-01 | Tìm chức năng server lấy URL như import, ảnh từ link, PDF renderer, callback và link preview. | Máy chủ chỉ gọi đích/giao thức theo chính sách và dùng kiểm soát mạng cho luồng ra. |
| G06-02 | Trong lab, đối chiếu đích giả đại diện loopback, mạng riêng, link-local và metadata cloud. | Đích nội bộ bị chặn theo chính sách ở cả ứng dụng và mạng; không truy cập metadata thật để chứng minh. |
| G06-03 | Kiểm tra SSRF qua redirect, DNS đổi địa chỉ, IPv6 và khác biệt chuẩn hóa URL bằng đích thử tự quản. | Đích sau phân giải và mỗi redirect được kiểm tra; mạng chặn đích cấm kể cả khi parser hiểu khác. |
| G06-04 | Kiểm tra blind SSRF bằng máy nhận thử do nhóm kiểm soát, có mã tương quan cho từng yêu cầu. | Hành vi gọi ra khớp allowlist; không gửi header, token hoặc dữ liệu nội bộ sang đích khác. |
| G06-05 | Rà XML, SOAP, SVG, tài liệu Office và tính năng import dùng parser XML. | External entity, DTD/XInclude hoặc truy cập mạng/file bị tắt khi không cần; parser có giới hạn. |
| G06-06 | Kiểm tra dữ liệu sâu, cấu trúc lặp hoặc dữ liệu giải nén lớn bằng mẫu giới hạn trong lab. | Từ chối sớm hoặc dừng trong ngân sách bộ nhớ, CPU và thời gian. |
| G06-07 | Thử trường trùng, encoding khác nhau, Content-Type lệch và kiểu dữ liệu không mong đợi. | Gateway và app diễn giải thống nhất hoặc từ chối; lớp kiểm tra dữ liệu không bị né. |

### G07 · Upload, lưu trữ và tải file

| Mã | Thử gì | Đạt khi |
|---|---|---|
| G07-01 | Upload file sai định dạng, tên hai đuôi và MIME không khớp bằng file đánh dấu vô hại. | Xác thực loại file từ nội dung và chính sách; tên do server kiểm soát. |
| G07-02 | Kiểm tra file HTML/SVG hoặc nội dung có khả năng chạy mã trong trình duyệt. | File không chạy mã trong origin chứa phiên; phục vụ theo thiết kế cách ly hoặc bắt buộc tải xuống. |
| G07-03 | Thử tên file hoặc khóa object có đường dẫn, chuẩn hóa khác nhau, symlink trong fixture. | Đọc/ghi chỉ trong phạm vi cho phép, không ghi đè file hệ thống hoặc file của người khác. |
| G07-04 | Rà import ZIP/archive có đường dẫn thoát thư mục, symlink hoặc dung lượng giải nén vượt giới hạn. | Giải nén bị giới hạn đường dẫn, kích thước/số lượng; job lỗi được dọn. |
| G07-05 | Thử tải file riêng bằng ID, link ký tạm, direct storage URL và link hết hạn. | Quyền đọc đúng phạm vi; link ký hết hạn và không truy cập được file khác. |
| G07-06 | Kiểm tra quota upload theo người dùng, số file, loại nội dung và kích cỡ. | Từ chối đúng ngưỡng trước khi tốn quá nhiều tài nguyên; không lưu file mồ côi. |
| G07-07 | Rà worker chuyển đổi, quét file và xử lý ảnh/PDF, gồm file lỗi hoặc chưa quét xong. | Worker ít quyền, có timeout; file cần kiểm duyệt chưa thể phát hành khi chưa đạt. |
| G07-08 | Kiểm tra metadata ảnh, link cũ sau xóa/đổi quyền và bản cache/CDN. | Dữ liệu nhạy cảm được lọc theo chính sách; thời hạn còn truy cập của bản sao được kiểm soát. |

### G08 · Bảo mật trình duyệt

| Mã | Thử gì | Đạt khi |
|---|---|---|
| G08-01 | Kiểm tra reflected XSS từ URL, form, route lỗi và tham số tìm kiếm. | Dữ liệu hiển thị được mã hóa theo ngữ cảnh HTML/attribute/JS/URL; không thực thi chỉ dấu thử. |
| G08-02 | Kiểm tra stored XSS trong hồ sơ, ghi chú, comment, chat, màn admin, báo cáo và preview. | Dữ liệu đã lưu an toàn ở mọi nơi render, cả khi nhân viên/admin mở lại. |
| G08-03 | Rà DOM XSS, DOM clobbering và prototype pollution khi đưa URL, postMessage, JSON hoặc localStorage vào sink. | Input không điều khiển thuộc tính, DOM hoặc thao tác thực thi ngoài thiết kế. |
| G08-04 | Kiểm tra trình soạn HTML/Markdown, thư viện sanitize, iframe nhúng và link tạo từ input. | Chỉ giữ markup và URL được phép; nội dung không vượt sandbox hoặc tạo script. |
| G08-05 | Thử CSRF với thao tác dùng cookie, gồm login, đổi tài khoản, hủy lịch và các đường gọi khác. | Yêu cầu từ site lạ không thực hiện được thao tác nhạy cảm; có biện pháp chống CSRF phù hợp. |
| G08-06 | Kiểm tra CORS với origin tin cậy, origin lạ, null, credential và preflight. | Chỉ origin được phép đọc dữ liệu nhạy cảm; không phản chiếu tùy ý Origin có credentials. |
| G08-07 | Thử nhúng trang nhạy cảm vào iframe ngoài danh sách, và rà postMessage ở cả hai phía. | Chặn clickjacking; kiểm origin/source và kiểu message; không gửi dữ liệu sang nơi không được phép. |
| G08-08 | Rà redirect sau đăng nhập, link rút gọn, redirect theo tham số và tab được mở từ link ngoài. | Chỉ điều hướng tới đích được phép hoặc có xác nhận phù hợp; không chuyển token theo redirect. |
| G08-09 | Kiểm tra CSP thực thi, frame-ancestors, nosniff, Referrer-Policy, Permissions-Policy và mixed content. | Chính sách phù hợp nhu cầu thực tế và kiểm thử được bằng trình duyệt; exception có lý do. |
| G08-10 | Kiểm tra service worker, PWA cache, trình duyệt Back và lưu trữ trên máy dùng chung sau logout. | Tài nguyên riêng không còn truy cập ngoài thời hạn theo chính sách; phạm vi service worker đúng. |

### G09 · REST API và giao thức dữ liệu

| Mã | Thử gì | Đạt khi |
|---|---|---|
| G09-01 | Đối chiếu route chạy thật với OpenAPI/gateway; tìm shadow API, endpoint mobile và phiên bản cũ. | Có chủ sở hữu và mức kiểm soát tương ứng; phiên bản ngừng dùng được đóng hoặc giới hạn. |
| G09-02 | Gửi thiếu trường, sai kiểu, dư trường, giá trị biên, object lồng sâu và tham số trùng. | Schema được kiểm tra phía máy chủ, phản hồi nhất quán; không đổi quyền hoặc trạng thái vì parse khác. |
| G09-03 | So sánh response với nhu cầu UI ở các vai trò, bao gồm query mở rộng và trường lồng nhau. | API chỉ trả đúng dữ liệu được phép, kể cả thuộc tính nội bộ bị ẩn trên giao diện. |
| G09-04 | Kiểm tra quyền đối với API key, token tích hợp, service account và scope ghi/đọc. | Phân tách theo môi trường/phạm vi; token thu hồi hoặc thiếu scope không hoạt động. |
| G09-05 | Thử header override, Content-Type khác, body trong phương thức bất thường và route fallback. | Chỉ chấp nhận giao thức được hỗ trợ; quyền và validation nhất quán giữa gateway và app. |
| G09-06 | Kiểm tra pagination, filter, sort, fields, bulk và giới hạn theo tài khoản/endpoint. | Không đọc quá phạm vi hoặc làm truy vấn vượt ngân sách bằng tùy chọn API. |
| G09-07 | Kiểm tra endpoint tốn phí hoặc nhạy cảm như OTP, export, email, search và tạo tài nguyên. | Có hạn mức phù hợp, không dễ bỏ qua qua kênh phụ; trả lỗi có kiểm soát. |
| G09-08 | Phát lại yêu cầu ghi đã hoàn thành và kiểm tra idempotency key giữa người dùng khác nhau. | Không tạo side effect trùng; key bị ràng buộc theo người dùng/luồng và nội dung khi cần. |
| G09-09 | Rà API trả lỗi, retry của client và cache của response có xác thực. | Lỗi không lộ stack/secret; retry đúng điều kiện; cache không chia sẻ dữ liệu riêng. |

### G10 · GraphQL và kết nối thời gian thực nếu có

| Mã | Thử gì | Đạt khi |
|---|---|---|
| G10-01 | Thử GraphQL query/mutation vào object, field lồng nhau và global node ID của tài khoản B. | Resolver kiểm quyền ở cấp đối tượng/trường; mọi đường lấy cùng dữ liệu có quyền nhất quán. |
| G10-02 | Thử độ sâu, độ phức tạp, aliases, batching và query rộng trong giới hạn lab. | Chi phí được tính cả phần lặp/lồng; request vượt ngân sách bị dừng. |
| G10-03 | Rà introspection, playground, persisted query và phản hồi lỗi GraphQL. | Phơi bày schema theo chính sách; quyền và ngân sách thực thi vẫn áp dụng dù có introspection hay không. |
| G10-04 | Kiểm tra GraphQL dùng cookie qua GET/POST và các Content-Type khác nhau. | Mutation chỉ qua phương thức được phép; chống CSRF phù hợp với kiểu xác thực. |
| G10-05 | Kiểm tra WebSocket handshake, Origin, cookie/token, TLS và xác thực lại sau reconnect. | Kết nối từ origin/phiên không hợp lệ bị từ chối; kiểm Origin phù hợp cho client trình duyệt. |
| G10-06 | Sau khi mở WebSocket/SSE, thử tham gia kênh B, gửi message sai schema hoặc đổi topic. | Kiểm quyền trên từng thao tác và kênh; không nhận dữ liệu người khác. |
| G10-07 | Thu hồi quyền giữa phiên kết nối; kiểm tra replay, reconnect và dữ liệu backlog. | Không tiếp tục nhận dữ liệu ngoài khoảng thu hồi cho phép; backlog được lọc quyền. |
| G10-08 | Kiểm tra kích cỡ message, tốc độ gửi, số connection và idle timeout ở lab. | Hệ thống cắt hoặc giới hạn kết nối trong ngân sách, có log khi cần. |

### G11 · Nghiệp vụ và lạm dụng quy trình

| Mã | Thử gì | Đạt khi |
|---|---|---|
| G11-01 | Chỉnh giá, giảm giá, tiền cọc, tiền còn lại, thuế, số lượng hoặc đơn vị tiền gửi từ trình duyệt. | Máy chủ tính lại từ dữ liệu tin cậy; lưu trữ, thanh toán và biên nhận nhất quán. |
| G11-02 | Bỏ qua bước, đảo thứ tự, gọi trạng thái cuối trực tiếp hoặc sửa trạng thái đã khóa. | Máy chủ thực thi sơ đồ trạng thái, các điều kiện và quyền trên từng lần chuyển. |
| G11-03 | Thử số âm, 0, số rất lớn, số thập phân, làm tròn và múi giờ/giờ biên. | Quy tắc dữ liệu đúng đặc tả; không phát sinh giá âm, lịch sai hoặc trạng thái bất nhất. |
| G11-04 | Gửi đồng thời hai thao tác tranh một slot/ưu đãi/tài nguyên duy nhất trong staging. | Không đặt trùng hoặc dùng ưu đãi hai lần; kết quả có khóa/ràng buộc/transaction bảo vệ. |
| G11-05 | Gửi lại yêu cầu đặt lịch, hoàn tiền hoặc xác nhận sau timeout/mất mạng. | Không tạo bản ghi, giao dịch, biên nhận hoặc thông báo trùng. |
| G11-06 | Thử dùng coupon hết hạn, sai đối tượng, nhiều tài khoản và kết hợp ưu đãi ngoài quy tắc. | Áp điều kiện ở máy chủ, có giới hạn sử dụng và audit cho ghi đè có chủ đích. |
| G11-07 | Kiểm tra hủy, hoàn tiền, chuyển lịch, khôi phục và tranh chấp sau mốc hết hạn. | Đúng quyền, mốc thời gian và giới hạn; trạng thái kế tiếp không làm mất dấu lịch sử. |
| G11-08 | Mô phỏng spam form, giữ chỗ, đăng ký hoặc gửi tin với số lượng nhỏ được phê duyệt. | Có quota, hết hạn giữ chỗ, cơ chế kiểm soát lạm dụng và bảo vệ chi phí. |
| G11-09 | Kiểm tra mã mời, link xác nhận, mã tra cứu biên nhận và quyền chia sẻ. | Mã phù hợp mục đích, khó đoán, hạn chế theo thời gian/phạm vi; không lộ dữ liệu ngoài dự kiến. |
| G11-10 | So sánh màn hình khách, admin, file xuất và thông báo sau giao dịch thành công/thất bại. | Số tiền, người sở hữu và trạng thái nhất quán; nguồn tin cậy cho mỗi giá trị được xác định. |

### G12 · Webhook và tích hợp bên thứ ba

| Mã | Thử gì | Đạt khi |
|---|---|---|
| G12-01 | Gửi webhook sandbox thiếu chữ ký, sai chữ ký, body bị chỉnh hoặc timestamp quá cũ. | Kiểm chữ ký trên dữ liệu đúng đặc tả của nhà cung cấp; từ chối sự kiện không hợp lệ. |
| G12-02 | Gửi lại event đã xử lý, trùng ID, đến sai thứ tự hoặc retry đồng thời. | Xử lý một lần theo phạm vi; không lùi trạng thái trái phép hoặc sinh side effect trùng. |
| G12-03 | Thay mã đơn, số tiền, tiền tệ và tài khoản nhận trong sự kiện thanh toán giả. | Đối chiếu với giao dịch nguồn tin cậy; redirect trình duyệt không tự đánh dấu đã thanh toán. |
| G12-04 | Mô phỏng đối tác trả schema sai, URL bất thường, nội dung không tin cậy hoặc lỗi. | Validate dữ liệu đối tác như input ngoài; lỗi không nâng quyền hoặc đổi trạng thái sai. |
| G12-05 | Rà quyền và nơi lưu khóa Maps, mail, SMS, thanh toán, storage và API bên thứ ba. | Khóa server nằm phía server; khóa client công khai được giới hạn nơi sử dụng và quota nếu hỗ trợ. |
| G12-06 | Kiểm tra webhook gửi đi, cấu hình URL callback, redirect và header bí mật. | Giới hạn đích, chống SSRF, ký sự kiện theo thiết kế và không chuyển secret sang host khác. |
| G12-07 | Thử timeout và retry đối tác bằng mock/sandbox; kiểm queue, lịch retry và hàng chờ lỗi. | Retry có giới hạn/backoff, có cảnh báo; chi phí và dữ liệu vẫn nhất quán. |
| G12-08 | Đối chiếu dữ liệu gửi cho analytics, email/SMS, bản đồ và công cụ theo dõi lỗi. | Chỉ gửi trường cần thiết; tọa độ, điện thoại và thông tin khách không sang dịch vụ ngoài mục đích đã chốt. |

### G13 · OAuth OIDC và SSO nếu có

| Mã | Thử gì | Đạt khi |
|---|---|---|
| G13-01 | Kiểm tra redirect URI được đăng ký và callback qua domain/đường dẫn khác. | Redirect URI được đối chiếu theo quy tắc giao thức; code/token không đi tới đích không tin cậy. |
| G13-02 | Thử state/nonce thiếu, sai, hết hạn hoặc dùng lại từ luồng khác; kiểm PKCE khi áp dụng. | Callback được ràng buộc với phiên, luồng và client; không hoán đổi được đăng nhập. |
| G13-03 | Thử token/code sai client, issuer, audience, phạm vi hoặc loại token. | Ứng dụng kiểm thông số giao thức và loại credential tại mỗi điểm dùng. |
| G13-04 | Kiểm tra nối tài khoản qua email trùng, email chưa xác minh và đổi danh tính nhà cung cấp. | Liên kết yêu cầu xác minh phù hợp và dùng định danh tin cậy của provider, tránh chiếm tài khoản. |
| G13-05 | Rà cấp quyền tự động theo domain/nhóm, người dùng rời tổ chức và SSO role mapping. | Quyền tối thiểu; thu hồi quyền theo thời hạn cam kết; mapping không tin claim ngoài nguồn đã cấu hình. |
| G13-06 | Nếu dùng SAML, kiểm tra chữ ký, phần assertion thực sự được xác thực, audience, recipient, hạn dùng và replay. | Chỉ assertion hợp lệ từ IdP tin cậy được chấp nhận; không đọc nội dung ngoài phần đã xác minh. |
| G13-07 | Kiểm tra logout liên kết, thay khóa xác minh, fallback và lỗi IdP. | Không hạ cấp kiểm soát khi IdP lỗi; xoay khóa/thu hồi phiên theo thiết kế. |

### G14 · CDN proxy HTTP và cache

| Mã | Thử gì | Đạt khi |
|---|---|---|
| G14-01 | Rà Host, X-Forwarded-Host/Proto/For và tạo link reset qua host/header giả trong staging. | Chỉ tin proxy đã định danh và host hợp lệ; link nhạy cảm được tạo từ base URL tin cậy. |
| G14-02 | Kiểm tra response riêng qua CDN/proxy ở hai phiên A/B; rà Cache-Control, Vary và cache key. | A không nhận nội dung của B; trang hoặc file riêng không vào cache chia sẻ ngoài thiết kế. |
| G14-03 | Thử cache poisoning/deception với route động, URL có phần mở rộng giả và header không nằm trong cache key. | Biến thể response quan trọng được tách hoặc không cache; route riêng không biến thành tài nguyên công khai. |
| G14-04 | Trong lab, đối chiếu cách CDN/proxy/origin xử lý độ dài request, HTTP/2→HTTP/1 và request mơ hồ. | Từ chối framing không nhất quán; không có dấu hiệu request smuggling/desync giữa các lớp. |
| G14-05 | Thử path normalization, URL encode, slash, chữ hoa/thường và route viết lại. | ACL, router và cache nhận diện tài nguyên nhất quán; đường dẫn biến thể không bỏ qua kiểm quyền. |
| G14-06 | Kiểm tra địa chỉ IP thực, access log, geo/IP allowlist và rate limit qua lớp proxy. | Header do client gửi không thay thế IP tin cậy hoặc làm vượt hạn mức. |
| G14-07 | Rà origin trực tiếp, ingress phụ và danh sách trusted proxy; so chính sách khi CDN không sẵn sàng. | Không bỏ qua lớp bảo vệ; origin được hạn chế theo kiến trúc. |
| G14-08 | Kiểm tra WAF với yêu cầu hợp lệ và mẫu thử vô hại; rà quy tắc ngoại lệ. | Không chặn sai luồng hợp lệ quan trọng; lỗi gốc vẫn được sửa trong ứng dụng khi có. |

### G15 · Dữ liệu riêng và mật mã

| Mã | Thử gì | Đạt khi |
|---|---|---|
| G15-01 | Tìm secret, token, mật khẩu và dữ liệu khách trong bundle, source map, repo, artifact, log và CI. | Secret không có trong tài nguyên công khai; phát hiện lộ dẫn tới đổi/thu hồi và rà phạm vi ảnh hưởng. |
| G15-02 | Kiểm tra TLS trên đường vào và giữa các thành phần mang dữ liệu nhạy cảm theo kiến trúc. | Mã hóa và xác minh chứng chỉ theo yêu cầu; không có luồng nhạy cảm không được bảo vệ. |
| G15-03 | Rà mã hóa lưu trữ, quản lý key, môi trường, rotation và quyền giải mã. | Khóa và dữ liệu tách quyền phù hợp; quy trình xoay/thu hồi khóa đã được kiểm tra. |
| G15-04 | Rà RNG và vòng đời token reset, invite, share và link ký. | Token bảo mật dùng nguồn ngẫu nhiên phù hợp hoặc cơ chế ký đúng; không dùng giá trị dễ đoán làm chứng thực. |
| G15-05 | Rà thuật toán, nonce/IV, chữ ký và cách kiểm tra tính toàn vẹn trong code. | Dùng thư viện và thuật toán phù hợp, nonce đúng quy tắc, kiểm toàn vẹn trước khi tin dữ liệu. |
| G15-06 | Kiểm tra dữ liệu nhạy cảm trong query string, referer, log, crash report, analytics và ảnh chụp. | Chỉ lưu/truyền trường cần thiết, có che dữ liệu và giới hạn truy cập. |
| G15-07 | Rà link hóa đơn/biên nhận, địa chỉ/tọa độ, bản in, export, lịch sử trình duyệt và search indexing. | Truy cập đúng quyền, không lưu cache/index ngoài ý muốn; robots/noindex chỉ hỗ trợ hiển thị tìm kiếm. |
| G15-08 | Kiểm tra chính sách lưu, xóa và sao chép sang staging; dùng bản ghi giả để xác minh. | Không đưa dữ liệu thật sang môi trường không được phép; xóa và lưu giữ theo chính sách có thể kiểm chứng. |
| G15-09 | Thử backup, bản sao DB, quyền export và khôi phục trong môi trường tách biệt. | Bản sao có kiểm soát truy cập và mã hóa theo chính sách; khôi phục không làm lộ dữ liệu/khóa. |

### G16 · Chuỗi cung ứng phần mềm và CI/CD

| Mã | Thử gì | Đạt khi |
|---|---|---|
| G16-01 | Lập danh sách dependency trực tiếp/gián tiếp, framework, image nền, plugin, CMS và JS từ CDN. | Tài sản có phiên bản và chủ sở hữu; xác định được thành phần nằm trong bản đang chạy. |
| G16-02 | Quét advisory/CVE, rà mã bị ảnh hưởng, phiên bản và khả năng gọi tới đường lỗi. | Phân loại theo mức ảnh hưởng thực tế; có kế hoạch vá hoặc giảm thiểu cho lỗi áp dụng. |
| G16-03 | Rà lockfile, registry, nguồn package, nguy cơ typosquatting/dependency confusion và install scripts. | Nguồn package được giới hạn; build có thể truy vết; thay đổi dependency được review. |
| G16-04 | Rà hành vi CI với pull request từ fork, pipeline secret, runner và quyền của token. | Code chưa tin cậy không tiếp cận secret/deploy; token ngắn hạn và quyền tối thiểu theo môi trường. |
| G16-05 | Rà bảo vệ branch, quyền merge, thay đổi pipeline và phê duyệt triển khai. | Thay đổi quan trọng có kiểm soát review; có lịch sử ai đã phát hành gì. |
| G16-06 | Kiểm tra artifact provenance/chữ ký, digest image, source commit và cơ chế cập nhật. | Xác minh tính toàn vẹn trước khi triển khai; xác định được artifact đang chạy từ commit nào. |
| G16-07 | Rà script bên thứ ba và quyền truy cập DOM trên trang đăng nhập/thanh toán. | Giảm script nhạy cảm, giới hạn nguồn; SRI/CSP dùng phù hợp khi có thể. |
| G16-08 | Quét secret trong lịch sử, build artifact, log CI và cấu hình IaC. | Không có secret khả dụng nằm sai chỗ; thu hồi và điều tra khi phát hiện lộ. |

### G17 · Cloud máy chủ cơ sở dữ liệu và mạng

| Mã | Thử gì | Đạt khi |
|---|---|---|
| G17-01 | Rà IAM, tài khoản root/admin, MFA, quyền service account và quyền truy cập chéo môi trường. | Quyền tối thiểu, tách môi trường, quyền đặc biệt có bảo vệ và theo dõi. |
| G17-02 | Rà port, firewall/security group, DB, Redis/cache, queue, dashboard quản trị và đường truy cập từ Internet. | Thành phần nội bộ chỉ mở cho nguồn đã định; quản trị có xác thực phù hợp. |
| G17-03 | Kiểm ACL bucket, policy public, signed URL, CDN, backup và quyền liệt kê. | File riêng không thể đọc/liệt kê công khai; không tin riêng vào việc URL khó đoán. |
| G17-04 | Rà phiên bản OS/runtime, dịch vụ thừa, cấu hình container, filesystem và worker. | Phiên bản có kế hoạch vá; workload không chạy quyền cao hoặc mount tài nguyên nhạy cảm khi không cần. |
| G17-05 | Kiểm quyền DB của ứng dụng, migration, báo cáo và tài khoản backup. | Không dùng chung tài khoản quản trị; mỗi luồng có đúng quyền cần thiết. |
| G17-06 | Rà secrets manager, quyền lấy credential, workload identity và egress. | Credential ngắn hạn nếu phù hợp; workload không truy cập được secret hoặc đích mạng ngoài nhu cầu. |
| G17-07 | Nếu có Kubernetes/serverless, rà ingress, policy mạng, secret, metadata và role thực thi. | Runtime tuân chính sách mạng và quyền; không có dashboard hoặc secret công khai. |
| G17-08 | Đối chiếu IaC với cấu hình chạy thật để tìm drift giữa staging và production. | Khác biệt được ghi nhận và kiểm soát; kết quả staging chỉ áp dụng cho cấu hình tương đương. |
| G17-09 | Kiểm tra quyền quản trị nhà cung cấp DNS/CDN/hosting và quy trình thu hồi quyền nhân sự. | Có MFA và audit phù hợp, người rời dự án không giữ quyền quản trị. |

### G18 · Tài nguyên lỗi và hành vi khi phụ thuộc gián đoạn

| Mã | Thử gì | Đạt khi |
|---|---|---|
| G18-01 | Gửi input thiếu, sai, kích cỡ chạm ngưỡng hoặc request bị ngắt; rà trang lỗi. | Lỗi an toàn; không lộ stack, query, nội dung bí mật hoặc trả dữ liệu dở dang ngoài quyền. |
| G18-02 | Trong staging, giả lập lỗi DB, cache hoặc dịch vụ kiểm quyền. | Hành động cần quyền bị từ chối khi không thể xác minh; không chuyển sang mặc định cho phép. |
| G18-03 | Giả lập timeout giữa cập nhật dữ liệu và gọi tác vụ nền/đối tác. | Có rollback hoặc bù trừ phù hợp, trạng thái không lệch và retry không nhân bản. |
| G18-04 | Kiểm giới hạn body, upload, pagination, query, kết nối, thời gian xử lý và job chạy nền. | Request vượt ngưỡng được xử lý sớm; có giới hạn tài nguyên tại các lớp phù hợp. |
| G18-05 | Rà regex, parser, tìm kiếm và filter dễ tiêu tốn CPU; thử mẫu nhỏ tăng dần trong lab. | Không khóa worker; có timeout và giới hạn độ dài/độ phức tạp. |
| G18-06 | Kiểm tra quota theo IP, tài khoản, tenant và endpoint; xem cách bảo vệ luồng đắt tiền. | Hạn mức không bị vượt bằng điểm vào tương đương; ghi nhận theo đúng danh tính nguồn. |
| G18-07 | Thử queue backlog, số job đồng thời, export lớn và xử lý yêu cầu lặp trong môi trường tách biệt. | Có backpressure, giới hạn đồng thời, phân tách tài nguyên và dọn job hết hạn. |
| G18-08 | Mô phỏng mất CDN/đối tác hoặc hết quota; kiểm tra ngưỡng cảnh báo và phục hồi. | Suy giảm dịch vụ có kiểm soát; không mất dữ liệu, lộ thông tin hoặc bỏ qua bảo vệ. |

### G19 · Log cảnh báo và ứng phó

| Mã | Thử gì | Đạt khi |
|---|---|---|
| G19-01 | Tạo sự kiện thử cho đăng nhập sai, MFA fail, reset, khóa tài khoản và token replay. | Log có thời gian, actor/nguồn phù hợp, kết quả và mã tương quan; không ghi credential. |
| G19-02 | Tạo sự kiện thử cho từ chối quyền, đổi role, export, thao tác admin và truy cập dữ liệu quan trọng. | Có audit đủ truy vết; các thao tác được gắn với danh tính và tài nguyên phù hợp. |
| G19-03 | Kiểm cảnh báo với đăng nhập sai nhiều lần, tải dữ liệu bất thường hoặc lỗi webhook trong môi trường thử. | Cảnh báo đến đúng kênh/người trực, đủ bối cảnh và có kiểm soát nhiễu. |
| G19-04 | Dùng correlation ID nối CDN, API, DB audit và job; đối chiếu múi giờ/thời gian. | Truy vết được chuỗi sự kiện đến thành phần liên quan; log có mốc thời gian nhất quán. |
| G19-05 | Rà RBAC, thời hạn lưu và quyền xóa/sửa audit log. | Log được giới hạn truy cập và bảo vệ khỏi chỉnh sửa ngoài thẩm quyền. |
| G19-06 | Kiểm tra làm sạch dữ liệu log, log injection và che PII/secret trên cả lỗi lẫn luồng thành công. | Trình thu thập không hiểu nội dung ngoài thành sự kiện giả; dữ liệu nhạy cảm được che đúng. |
| G19-07 | Diễn tập lộ API key hoặc tài khoản admin trên môi trường thử. | Đổi khóa, thu hồi phiên, khóa quyền và tìm phạm vi ảnh hưởng theo runbook có người phụ trách. |
| G19-08 | Diễn tập khôi phục backup và quay lui bản deploy trong môi trường tách biệt. | Có bằng chứng đạt mục tiêu thời gian/điểm khôi phục đã cam kết; app và dữ liệu hoạt động sau khôi phục. |

### G20 · AI chatbot và chức năng tự động nếu có

| Mã | Thử gì | Đạt khi |
|---|---|---|
| G20-01 | Đưa yêu cầu đánh lạc hướng trực tiếp hoặc qua file/web được chatbot đọc (prompt injection). | Nội dung ngoài không đổi quyền hoặc điều khiển hành động vượt ý định được phép. |
| G20-02 | Dùng hai tài khoản thử truy xuất file, lịch sử, bộ nhớ hoặc dữ liệu RAG của người khác. | Truy xuất và cache được lọc quyền theo người dùng/tenant trước khi đưa vào mô hình. |
| G20-03 | Yêu cầu bot gọi công cụ thực hiện thao tác nhạy cảm, đổi đối tượng đích hoặc bỏ qua bước xác nhận. | Máy chủ kiểm quyền, dữ liệu đầu vào, đối tượng và bước xác nhận theo thiết kế. |
| G20-04 | Rà bí mật trong prompt, kết quả tool, debug log và dữ liệu gửi tới nhà cung cấp. | Không lấy prompt làm kho secret; dữ liệu chuyển đi được tối thiểu hóa và kiểm soát. |
| G20-05 | Đưa output mô hình vào HTML, SQL, email, ticket hoặc pipeline tự động trong staging. | Output được xem là dữ liệu không tin cậy và kiểm tra trước khi render, lưu hoặc hành động. |
| G20-06 | Thử giới hạn token, số lần gọi tool, thời gian và chi phí theo tài khoản. | Có giới hạn và cơ chế dừng; vòng lặp hoặc thao tác lặp không vượt ngân sách. |

## 4. Ba ca mẫu cho website đặt lịch

Nếu áp dụng cho web đặt lịch như HOÀN, chạy ba ca dưới đây trước, sau đó mở rộng sang biên nhận, quản trị, link chia sẻ, bản đồ và nhật ký. Dùng tài khoản, lịch và tích hợp giả.

| Ca | Thao tác | Kết quả cần xác nhận |
|---|---|---|
| Khách A thử xem lịch của B · G04-01/02 | Tạo một lịch riêng cho mỗi khách. Lấy yêu cầu đọc/sửa/tải biên nhận của A, thay mã lịch bằng mã B đã tạo. Kiểm tra cả route file và export nếu có. | A thao tác được với lịch A theo quyền. Lịch B bị từ chối, không trả tên, số điện thoại, địa chỉ, tọa độ, link PDF hoặc dữ liệu B. Bản ghi B và audit được đối chiếu. |
| Sửa tiền từ trình duyệt · G11-01/10 | Tạo lịch theo bảng giá thử, chặn yêu cầu gửi và đổi giá, giảm giá, cọc hoặc tiền còn lại. Kiểm tra lại API, màn admin và file biên nhận. | Máy chủ từ chối hoặc tính lại theo bảng giá/quyền giảm giá; số tiền khớp ở các nơi và không tạo giao dịch thật. |
| Hai người đặt cùng một slot · G11-04/05 | Tạo slot thử chỉ có một chỗ. Dùng A/B gửi hai yêu cầu đồng thời; phát lại yêu cầu thành công với cùng idempotency key nếu hệ thống hỗ trợ. | Chỉ một lịch giữ slot, yêu cầu còn lại báo hết chỗ. Không sinh lịch, thông báo hoặc biên nhận trùng. |

## 5. Dụng cụ và cách ghi bằng chứng

| Mục đích | Cách dùng |
|---|---|
| Xem giao diện và yêu cầu | DevTools cùng proxy như Burp Suite hoặc OWASP ZAP để bắt/sửa/phát lại request với tài khoản test. Rà thủ công các ca phân quyền, phiên và logic. |
| Kiểm tra API | Dùng Postman, curl hoặc bộ test của dự án. Chạy theo vai trò, ID đối chứng, đường gọi và trạng thái. Đối chiếu DB/log cho yêu cầu thay đổi dữ liệu. |
| Tìm vấn đề trong code và cấu hình | Dùng trình phân tích tĩnh như Semgrep/CodeQL, quét dependency như OSV-Scanner/Trivy và quét secret như Gitleaks, tùy stack. Đọc thủ công đường đi từ input đến truy vấn, quyền và tích hợp. |
| Rà triển khai | Kiểm tra DNS/TLS, gateway/CDN, IaC, IAM, cấu hình môi trường, kho file và CI. Kiểm tra cấu hình production trực tiếp nếu có quyền. |
| Hồi quy | Đưa lỗi đã xác nhận vào bộ test API hoặc Playwright khi phù hợp. Giữ cả ca bị chặn và luồng hợp lệ để phát hiện lỗi chặn quá tay. |

**Mỗi ca ghi:** mã ca, tài sản/endpoint, bản build, môi trường, role/chủ sở hữu, dữ liệu test, bước chạy, kỳ vọng, thực tế, trạng thái, bằng chứng đã che dữ liệu, người chạy và ngày. Với kết quả từ scanner, đối chiếu bằng tái hiện tối thiểu hoặc đọc code/cấu hình trước khi ghi lỗi xác nhận. Không suy ra an toàn chỉ vì công cụ không cảnh báo, cũng không coi HTTP 403 là đủ nếu dữ liệu đã bị đổi trước khi trả lỗi.

| Trạng thái | Khi dùng |
|---|---|
| PASS | Có bằng chứng kiểm soát hoạt động đúng với bản build/môi trường đã ghi. |
| FAIL | Có bằng chứng kỳ vọng bị vi phạm; tạo mã lỗi và nối lại với ca test. |
| BLOCKED | Thiếu tài khoản, cấu hình, môi trường hoặc điều kiện để chạy; ghi người gỡ chặn. |
| NOT RUN | Chưa kiểm tra; ghi lý do và thời điểm dự kiến. |
| N/A | Tính năng/kiến trúc không áp dụng, có căn cứ như tài liệu, code hoặc danh mục tài sản. |

**Mẫu phiếu lỗi:** SEC-001 · tiêu đề thể hiện tác động · mã ca · bản build · tài sản · điều kiện/role · bước tái hiện · mong đợi và thực tế · bằng chứng đã che token/PII · tác động và phạm vi · độ nghiêm trọng · nguyên nhân nếu đã xác minh · đề xuất sửa · người phụ trách · kết quả retest.

Đánh mức theo điều kiện khai thác, quyền cần có, lượng dữ liệu bị ảnh hưởng và tác động thực tế:

| Mức | Ví dụ để phân loại |
|---|---|
| Critical | Thực thi mã từ xa có tác động lớn, chiếm quyền admin diện rộng hoặc truy cập dữ liệu nhạy cảm hàng loạt. |
| High | Chiếm tài khoản, vượt quyền ghi/xóa dữ liệu quan trọng, sửa thanh toán hoặc đọc dữ liệu riêng đáng kể. |
| Medium | Khai thác cần điều kiện đáng kể hoặc tác động bị giới hạn; vẫn có đường ảnh hưởng thực tế. |
| Low / Info | Vấn đề tăng cường bảo vệ hoặc quan sát kỹ thuật với tác động đã xác minh thấp/chưa đủ để kết luận có thể khai thác. |

## 6. Nghiệm thu và theo dõi

1. Ghi tỷ lệ kiểm thử bằng **(PASS + FAIL) / (tổng ca trong phạm vi − N/A)**. Ghi số PASS, FAIL, BLOCKED, NOT RUN và N/A riêng; nhóm bị chặn vẫn nằm trong mẫu số. Đo thêm độ phủ API và vai trò, vì một ca có thể áp dụng cho nhiều endpoint.
2. Kiểm tra xong các ca ưu tiên cao áp dụng. Không còn Critical/High mở hoặc ca rủi ro cao chưa được xác minh trước khi nghiệm thu phát hành. Phần còn thiếu phải hiện rõ trong báo cáo.
3. Lỗi đã sửa phải có retest trên đúng bản build, gồm tái hiện cũ, đường gọi tương đương và một ca hợp lệ. Với lỗi cấu hình, đối chiếu lại bản cấu hình chạy thật.
4. Mỗi lỗi Medium/Low còn mở có người phụ trách, thời hạn và quyết định xử lý. Danh sách BLOCKED/NOT RUN có kế hoạch bổ sung, tránh báo đã kiểm đủ.
5. Bàn giao bảng tài sản, ma trận quyền, kết quả theo mã, báo cáo lỗi, bằng chứng đã lọc và rủi ro còn lại. Chạy lại khi đổi xác thực, phân quyền, thanh toán, upload, CDN, cấu hình cloud hoặc dependency trọng yếu.

## 7. Chuẩn đối chiếu

- [OWASP ASVS 5.0.0](https://asvs.owasp.org/): chuẩn yêu cầu kỹ thuật. Khi biết stack và mục tiêu, tải danh sách yêu cầu, chọn mức áp dụng và nối từng yêu cầu áp dụng với mã ca và bằng chứng. Với web có tài khoản hoặc dữ liệu khách, cân nhắc lấy Level 2 làm mục tiêu và bổ sung theo rủi ro; checklist này không phải chứng nhận ASVS.
- [OWASP Web Security Testing Guide v4.2](https://wstg.owasp.org/v4.2/): hướng dẫn cách kiểm thử từng nhóm. Dùng liên kết theo phiên bản khi ghi nguồn cho một ca.
- [OWASP Top 10:2025](https://top10.owasp.org/2025/): danh mục rủi ro để rà phạm vi, gồm cả chuỗi cung ứng, cảnh báo và xử lý điều kiện lỗi.
- [OWASP API Security Top 10:2023](https://api-security.owasp.org/editions/2023/en/0x11-t10/): đối chiếu riêng với endpoint, phân quyền đối tượng/trường/chức năng, hạn mức, danh mục API và dữ liệu từ bên thứ ba.


## 8. Đợt kiểm thử trực tiếp ngày 04/11/2026

Chủ website xác nhận chưa có domain. Đã kiểm bản localhost và production build
trong runtime cô lập dùng D1/R2 mới, không gửi giao dịch hoặc thay dữ liệu thật.

- [Báo cáo, lỗi xác nhận và hướng sửa](Bao_Cao_Kiem_Thu_Bao_Mat_Website_2026-11-04.md).
- [Ma trận 166 tình huống và 88 tiểu ca đã chạy](Ket_Qua_Kiem_Thu_Bao_Mat_2026-11-04.md).
- Kết quả lab: 78 PASS, 10 FAIL, 0 BLOCKED; dev có lỗi bỏ qua khóa được ghi riêng.
- Chưa nghiệm thu bảo mật: còn lỗi High mở và phần domain/HTTPS/cloud/log chưa kiểm được.
- Chưa sửa mã sản phẩm trong đợt kiểm thử; lỗi giữ OPEN, retest sau khi có bản vá.
