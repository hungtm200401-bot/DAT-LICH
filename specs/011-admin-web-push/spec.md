# Báo lịch mới trên HOÀN Màn hình chính

**Nhánh** `codex/hoan-ios`

**Ngày** 23/11/2026

## Tình huống sử dụng

### US1. Bật thông báo một lần

Quản trị cài HOÀN lên Màn hình chính iPhone, mở biểu tượng, đăng nhập và bấm **Bật thông báo**. App có bốn tab tác vụ hiện có. Quản trị có thể gửi thử hoặc tắt thông báo của máy này.

**Nghiệm thu** Mở từ biểu tượng trên iOS 16.4 trở lên, cấp quyền và thấy trạng thái đã bật khi máy chủ ghi nhận thiết bị. Khách ẩn danh bị từ chối đăng ký.

### US2. Báo lịch mới khi đóng ứng dụng

Khi web online lưu lịch mới, máy chủ bắt đầu gửi một thông báo đẩy tới từng thiết bị quản trị đã bật. Chạm thông báo mở đúng lịch trong HOÀN. Thiết bị vẫn nhận khi phiên đăng nhập web đã hết hạn và quản trị chưa chủ động đăng xuất.

**Nghiệm thu** Tạo lịch khi app đã đóng, kiểm tra máy chủ gửi ngay sau khi lưu và thử nhận trên iPhone. Thử đăng xuất, đăng ký hết hạn và sự cố gửi tạm thời.

### US3. Nhắc lịch làm

Với lịch đã xác nhận, máy chủ nhắc ở mốc 24 giờ trước giờ hẹn Việt Nam. Kiểm tra lại trạng thái và thời gian trước khi gửi. Lịch đổi giờ có mốc mới, lịch đã hủy không phát sinh nhắc.

## Yêu cầu

- **FR-001** Dùng Web Push chuẩn qua service worker trên môi trường online.
- **FR-002** Chỉ thiết bị do quản trị đăng ký mới nhận được. Đăng xuất hoặc tắt thu hồi thiết bị, đổi khóa quản trị vô hiệu hóa đăng ký cũ.
- **FR-003** Thông báo màn hình khóa chứa loại thông báo. Thông tin khách mở sau xác thực.
- **FR-004** Việc gửi chạy tách khỏi giao dịch tạo lịch. Lỗi tạm thời được thử lại và mỗi thiết bị có hồ sơ gửi riêng.
- **FR-005** App đọc cùng D1 với web online. Phiên duyệt lịch, cọc và khách tiếp tục dùng các luồng hiện có.

## Tiêu chí hoàn thành

Kiểm thử kết nối từ sự kiện lưu lịch D1 tới yêu cầu Web Push, mã hóa, quyền đăng ký, chống trùng, đổi hoặc hủy lịch và thu hồi khi đăng xuất. Xác minh phiên bản online có service worker và khóa đẩy đã cấu hình. Xác nhận hiển thị trên iPhone sau khi chủ app cài và cấp quyền.
