# Feature Specification: Khắc phục kiểm thử bảo mật
Created: 2026-11-04. Status: Accepted. Branch: main (giữ working tree hiện tại).
Input: Sửa các lỗi sau kiểm thử SEC-001–008 và rà thư viện tương thích.

## User Scenarios & Testing
### US1 — Bảo vệ quản trị và khách hàng (P1)
Chỉ người có khóa đúng đọc/ghi quản trị; khách chỉ gửi yêu cầu cho lịch có thông tin chứng thực khớp. Tên/ghi chú khách đã lưu luôn là dữ liệu văn bản.
Acceptance: thiếu/sai khóa bị từ chối kể cả localhost/LAN; khóa đúng đăng nhập được desktop/mobile; logout xóa thông tin đang hiển thị. Code B + phone A và thiếu phone không làm lộ dữ liệu hoặc tạo yêu cầu; thông tin đúng vẫn gửi được. Tên/ghi chú có ký tự HTML không chạy mã ở bảng/modal.
### US2 — Đặt lịch và tải ảnh an toàn (P2)
Khách đặt được trong cửa sổ mở lịch bằng ngày Việt Nam hợp lệ; dữ liệu ngày/giờ sai không tạo tác dụng phụ. Ảnh đúng định dạng được tải; giả MIME bị từ chối.
Acceptance: ngày không tồn tại, giờ sai, quá cửa sổ bị 400; ngày cuối cửa sổ hợp lệ, giá và tiền không bị sửa từ client. Kiểm định ảnh trước khi ghi; không ảnh mồ côi khi từ chối.
### US3 — Phòng vệ và kiểm chứng (P2)
Trang không bị nhúng bởi origin ngoài; dữ liệu lỗi trả thông báo an toàn. Các thư viện bị cảnh báo được triage và cập nhật tương thích.
Acceptance: JSON lỗi 400; browser chặn iframe ngoài nhưng preview nội bộ còn dùng được; kiểm thử tiền và đặt lịch không hồi quy; có kết quả trước/sau và danh sách advisory còn lại.

## Requirements
- FR001 Không bỏ qua khóa theo host/môi trường; không cấu hình bí mật vào mã client.
- FR002 Chứng thực quyền sở hữu lịch trước khi đọc/điền thông tin hỗ trợ; trả xác nhận tối thiểu.
- FR003 Escape tên, phone, email, note trong danh sách và biểu mẫu sửa khách, kể cả dữ liệu cũ.
- FR004 Ngày lịch thật, giờ trong ngày, thời điểm tương lai và cửa sổ đặt lịch phải được kiểm trên server trước khi ghi.
- FR005 Kiểm nội dung ảnh và giới hạn kích thước/dung lượng; trả MIME đã xác nhận.
- FR006 Header chống framing origin ngoài và MIME sniffing; chính sách referrer phù hợp; giữ preview cùng origin.
- FR007 Từ chối body JSON hỏng/sai loại trước truy vấn; không lộ SQL/stack.
- FR008 Rà phiên bản và nâng thư viện có bản vá tương thích; không dùng audit fix force/downgrade mù.
- FR009 Không chạm dữ liệu thật khi test; bảo toàn ledger và các thay đổi cũ trong workspace.

## Key Entities
Khóa quản trị (bí mật phía server), lịch và chứng thực code/phone hiện có, yêu cầu hỗ trợ, ảnh tải lên, bằng chứng kiểm thử.
## Success Criteria
Mọi ca tái hiện 8 lỗi có đối chứng hợp lệ và đạt sau sửa; không tạo dữ liệu ngoài quyền; không có canary thực thi; luồng hợp lệ desktop/mobile và sổ thu chi không hồi quy. Phần cloud/domain chưa có tiếp tục ghi giới hạn.
## Assumptions
Giữ mô hình shared admin key hiện có; không xây tài khoản/MFA mới. Khóa local được tạo vào file bí mật ignored và người sở hữu dùng qua màn đăng nhập. Không tự triển khai hosting khi chưa có domain.
