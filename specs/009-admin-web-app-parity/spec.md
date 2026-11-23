# Dữ liệu và chức năng quản trị trên web và iPhone

**Nhánh** `codex/hoan-ios`

**Ngày** 23/11/2026

## Tình huống sử dụng và kiểm tra

### US1. Xem cùng dữ liệu quản trị

Chủ website đăng nhập trên web online và trên iPhone bằng hai phiên riêng. Cả hai hiển thị các lịch hẹn, ca làm, khách hàng và giao dịch từ cùng cơ sở dữ liệu. Khi quay về app, người dùng xem được thay đổi vừa lưu trên web. Màn đang nhập hoặc chỉnh sửa giữ thông tin chưa lưu.

**Kiểm tra** Tạo một lịch và ghi tiền cọc trong môi trường thử từ bản web. Đưa app trở lại màn hình và đối chiếu mã lịch, trạng thái, lịch làm và số tiền. Thực hiện ít nhất một thay đổi theo chiều ngược lại.

### US2. Thực hiện chức năng web trên iPhone

Chủ website mở **Tất cả chức năng** trên iPhone để đến các mục của web, gồm nội dung, bộ sưu tập, báo cáo, nhật ký, phân quyền và khách truy cập. Các màn dùng cùng biểu mẫu, kiểm tra dữ liệu và thao tác như web. Thanh điều hướng vẫn vừa với màn hình nhỏ.

**Kiểm tra** Đối chiếu danh sách chức năng với thanh điều hướng web. Mở từng mục và thử các thao tác quản trị trên dữ liệu thử, gồm xuất danh sách và lưu khách hàng.

### US3. Bảo toàn dữ liệu hiện có

Nếu có dữ liệu nghiệp vụ cần chuyển từ máy tính lên web, chủ website có thể chỉ định hồ sơ cần chuyển. Giữ mã lịch, các giao dịch đã ghi và số tiền. Hồ sơ trùng hoặc có nội dung xung đột được đối chiếu trước khi áp dụng.

**Kiểm tra** Ghi nhận bản sao local và mốc khôi phục online. Kiểm tra giao dịch trùng, ca trùng, dữ liệu thử và kết quả trước khi lưu dữ liệu thật.

### Trường hợp biên

- Phiên hết hạn hoặc mạng gián đoạn khi app được mở lại.
- Hai thiết bị lưu lần lượt trong khi một màn chỉnh sửa chưa gửi.
- Hai cơ sở dữ liệu có trùng mã lịch, khách cùng số điện thoại hoặc tham chiếu thanh toán.
- Mục quản trị của web chỉ hiển thị thông tin và chưa có thao tác backend.

## Yêu cầu

- **FR-001** Cả hai giao diện quản trị online đọc và ghi vào cùng nguồn dữ liệu sau khi xác thực.
- **FR-002** Người dùng có thể mở tất cả mục quản trị và thao tác hiện có của web trong app.
- **FR-003** Cập nhật dữ liệu khi mở lại màn quản trị hoặc chủ động bấm làm mới. Giữ nguyên thao tác đang nhập.
- **FR-004** Các thay đổi danh sách khách hàng qua biểu mẫu quản trị phải lưu được ở máy chủ và thấy trong phiên khác.
- **FR-005** Trước khi chuyển dữ liệu thật, xác nhận phạm vi, tạo bản sao và kiểm tra quan hệ giữa lịch, khách, ca làm, dữ liệu bổ sung và giao dịch.
- **FR-006** Trang quản trị chạy thử hiển thị đường dẫn đến nguồn quản trị online của app.

### Dữ liệu liên quan

Lịch hẹn, khách hàng, ca làm, dịch vụ, giao dịch và cấu hình quản trị. Một giao dịch tham chiếu mã lịch đã tồn tại. Số tiền thu và hoàn dựa trên sổ giao dịch.

## Tiêu chí hoàn thành

- Web online và app thấy cùng mã lịch và số tiền sau khi quay lại hoặc tải mới.
- Tất cả liên kết quản trị web mở được từ menu iPhone, gồm các mục trước đây chỉ hiện lời nhắc dùng máy tính.
- Sửa hoặc thêm khách trên một giao diện xuất hiện ở giao diện kia sau khi cập nhật.
- Các bản ghi online đã có vẫn tra cứu được sau chuyển dữ liệu, số giao dịch theo lịch khớp với hồ sơ được chọn.

## Giả định

Web quản trị vận hành dùng cùng địa chỉ HTTPS đã cấu hình cho app. Chủ website đã xác nhận chuyển toàn bộ 4 lịch hẹn và 7 giao dịch từ bản local, cùng hồ sơ khách và chi tiết liên quan.
