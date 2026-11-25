# Feature Specification: Dữ liệu online chung cho web trên máy và app

**Feature Branch**: `codex/shared-online-data`
**Created**: 2026-11-25
**Status**: Implemented and verified
**Input**: Chủ dự án xác nhận muốn trang chạy ở 127.0.0.1 cũng đọc và lưu vào dữ liệu online chung với app.

## User Scenarios & Testing

### User Story 1 - Một nguồn lịch cho mọi giao diện (Priority: P1)
Chủ dự án chạy website trên máy để sửa giao diện nhưng khách đặt lịch và chủ duyệt lịch đều dùng hệ thống online hiện có.
**Why this priority**: Tránh lịch chỉ nằm trong máy và không xuất hiện trong app.
**Independent Test**: Gửi một lịch vào máy chủ kiểm thử qua trang chạy trên máy, mở cùng lịch qua giao diện kết nối trực tiếp máy chủ đó; dữ liệu trùng mã và trạng thái. Các test dùng dữ liệu cô lập.
**Acceptance Scenarios**:
1. **Given** website chạy ở 127.0.0.1 trong chế độ chung, **When** khách đặt lịch hợp lệ, **Then** lịch được lưu tại hệ thống online, dùng cùng mã khi mở từ web online hoặc app.
2. **Given** lịch tồn tại online, **When** chủ đăng nhập và xem từ máy tính, **Then** danh sách/trạng thái/tiền cọc phản ánh cùng hồ sơ, không lấy lịch từ bản cũ trên máy.
3. **Given** ảnh được tải lên hoặc mở từ trang trên máy, **When** yêu cầu thành công, **Then** ảnh thuộc kho online và hiển thị ở cùng lịch.

### User Story 2 - Đăng nhập chung, giữ bảo vệ quản trị (Priority: P1)
Chủ sử dụng mật khẩu online khi mở giao diện trên máy. Phiên đăng nhập và đăng xuất được hệ thống online kiểm tra.
**Why this priority**: Kết nối dữ liệu thật phải giữ phân quyền và tính riêng tư.
**Independent Test**: Máy chủ kiểm thử cấp phiên, trang trên máy đọc được lịch riêng bằng phiên đó; không có phiên, sai nguồn hoặc đã đăng xuất đều bị từ chối.
**Acceptance Scenarios**:
1. **Given** mật khẩu online đúng, **When** đăng nhập trên trang máy tính, **Then** phiên online được tạo và dữ liệu riêng chỉ mở sau khi xác thực.
2. **Given** phiên local cũ, **When** chuyển sang chế độ chung, **Then** phiên cũ không tự cấp quyền truy cập online.
3. **Given** chủ đăng xuất, **When** gọi lại dữ liệu quản trị, **Then** hệ thống từ chối và dữ liệu riêng được xóa khỏi giao diện.
4. **Given** yêu cầu đến từ website khác hoặc địa chỉ mạng ngoài máy, **When** cố dùng kết nối chung, **Then** không được chuyển tiếp tới hệ thống online.

### User Story 3 - Phân biệt chế độ, bảo toàn dữ liệu cũ (Priority: P2)
Chế độ mặc định dùng dữ liệu chung; chủ vẫn có lệnh riêng để kiểm thử cô lập và biết đang dùng dữ liệu nào.
**Why this priority**: Ngăn dữ liệu thử trộn vào vận hành và giữ khả năng phục hồi.
**Independent Test**: Đổi chế độ bằng lệnh; nhãn dữ liệu đúng, dữ liệu cũ trên máy giữ nguyên và chế độ chung không ghi vào kho cũ.
**Acceptance Scenarios**:
1. **Given** khởi động thông thường, **When** mở quản trị, **Then** giao diện báo dùng dữ liệu online chung với app.
2. **Given** chủ chạy chế độ thử riêng, **When** đặt lịch thử, **Then** lịch chỉ lưu trên máy và giao diện ghi rõ điều đó.
3. **Given** mất mạng hoặc máy chủ lỗi, **When** lưu lịch/thanh toán, **Then** báo lỗi, không báo đã lưu thành công, không ghi sang dữ liệu cũ và không tự gửi lại thao tác.

### Edge Cases
- Phiên hết hạn, sai mật khẩu, nhiều Set-Cookie, cookie từ chế độ khác; ảnh multipart/binary; query tra cứu không đổi.
- Máy chủ trả lỗi hoặc ngắt kết nối giữa lúc lưu: không tự retry, chủ tra cứu trước khi gửi lại.
- Chạy chế độ khác khi server cũ còn giữ cổng: yêu cầu khởi động lại, không lặng lẽ dùng sai nguồn.
- Redirect không theo sang nguồn khác để không chuyển lộ phiên đăng nhập.
- Hồ sơ local có sẵn được giữ nguyên, chưa tự nhập vào online vì cần đối soát trùng mã, ca và giao dịch.

## Requirements
### Functional Requirements
- **FR-001**: Chế độ chạy thông thường trên máy MUST dùng hệ thống online hiện tại làm nguồn duy nhất cho mọi yêu cầu dữ liệu nghiệp vụ và ảnh.
- **FR-002**: Chủ MUST đăng nhập bằng mật khẩu online; giữ kiểm tra phiên, đăng xuất và lỗi xác thực của máy chủ.
- **FR-003**: Kết nối chung MUST chỉ nhận yêu cầu từ chính máy; không cho nguồn web khác sử dụng nó để đọc/ghi dữ liệu riêng.
- **FR-004**: Cookie/khóa local cũ MUST NOT được chuyển thành quyền online; thông tin đăng nhập không đưa vào mã trang, Git, log hoặc file build.
- **FR-005**: Mọi lỗi online MUST giữ nguyên ý nghĩa lỗi và không chuyển sang dữ liệu local hay tự gửi lại thao tác ghi.
- **FR-006**: Dữ liệu local hiện có MUST được sao lưu/giữ nguyên; không tự chép lên hoặc ghi đè online.
- **FR-007**: Chế độ local cô lập MUST có lệnh riêng và nhãn nguồn dữ liệu rõ ràng; bộ kiểm thử hiện có vẫn dùng dữ liệu cô lập.
- **FR-008**: Hành vi đặt lịch, xác thực, khách hàng, nội dung, vị trí và đối soát tiền thật MUST giữ nguyên.

### Key Entities
- **Hồ sơ online**: Lịch, khách, nội dung và giao dịch hiện có; một bản duy nhất được các giao diện dùng chung.
- **Phiên quản trị online**: Được máy chủ kiểm tra; kết thúc khi đăng xuất/hết hạn như hiện tại.
- **Chế độ dữ liệu**: Chung online hoặc local cô lập; được xác định khi khởi động và không tự đổi khi lỗi.
- **Bản dữ liệu local trước chuyển đổi**: Giữ nguyên, không phải hàng đợi đồng bộ.

## Success Criteria
### Measurable Outcomes
- **SC-001**: Trong các kịch bản hợp lệ, 100% lịch gửi qua chế độ chung có cùng mã/trạng thái khi đọc trực tiếp từ cùng máy chủ.
- **SC-002**: 100% yêu cầu quản trị ẩn danh, phiên cũ local và nguồn web khác trong bộ kiểm tra bị từ chối.
- **SC-003**: Khi mất kết nối, không có thao tác ghi local hoặc tự gửi lại; dữ liệu cũ trên máy không thay đổi.
- **SC-004**: Cả hai chế độ có nhãn đúng và toàn bộ kiểm tra nghiệp vụ hiện có tiếp tục đạt hoặc ghi rõ giới hạn thực thi.

## Assumptions
- Máy chủ hiện tại của IPA là hệ thống online dùng chung đã được chủ xác nhận; không tạo hệ thống mới.
- Chế độ chung cần Internet; không yêu cầu làm việc offline/đồng bộ hai chiều.
- Mật khẩu online hiện có vẫn giữ nguyên; chủ đăng nhập lại khi kết nối chung. Không đổi mật khẩu hoặc quyền truy cập Cloudflare.
- Kiểm thử tự động thao tác ghi dùng hệ thống cô lập; đọc online công khai/401 không cần phiên. Chủ sau đó yêu cầu rõ tạo 1 clone online để đối chiếu trên iPhone, nên kiểm tra đó được thực hiện và ghi kết quả riêng.
