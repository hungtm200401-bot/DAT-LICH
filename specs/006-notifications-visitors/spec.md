# Feature Specification: Thông báo từng mục và khách truy cập gọn

Created: 2026-11-03. Status: Ready for implementation.
Input: Tích từng thông báo để đọc, chỉ rõ chưa đọc, giảm số icon; làm lại Khách truy cập gọn đẹp; hoàn tất kiểm tra rồi đẩy Git, không sửa phần khác.

## User Scenarios & Testing
### US1 - Đọc từng thông báo (P1)
Admin thấy mục chưa đọc có chấm màu và nhãn Chưa đọc; tích ô của mục đó để lưu Đã đọc. Mở liên kết chi tiết không tự đọc. Icon chuông desktop/mobile giảm đúng 1 sau lưu thành công, 0 thì bỏ số.
Independent test: tích một trong 3 mục chưa đọc, tải lại, xem lọc Chưa đọc; cố tình lỗi API thì trạng thái và số giữ nguyên.
Acceptance: chỉ gửi id của mục được tích, không gửi đọc toàn bộ; chống bấm lặp và cập nhật đồng thời các mục khác nhau; mục đã đọc không thể vô tình bỏ tích. Không còn nút đọc tất cả.

### US2 - Khách truy cập (P1)
Admin chọn 1/7/30/90 ngày, nguồn và đang hoạt động, xem 3 số liệu chính và danh sách gọn; mở một phiên xem trang đã đi, nhấp và chuyển đổi. Mobile có đầy đủ chức năng. Giữ công cụ tạo link/QR trong phần mở rộng.
Independent test: lọc reset trang, phân trang 10 dòng, làm mới, lỗi/tải/rỗng, xuất CSV đúng trang, mở/đóng hành trình, tạo/copy link và tải QR.
Acceptance: không biểu đồ tính từ một trang rồi giả làm tổng; số liệu tổng lấy đúng summary API; chỉ mô tả phiên được đo, không suy luận danh tính; không thay theo dõi/đồng ý/lưu giữ 90 ngày.

### US3 - Git đúng phạm vi (P1)
Chỉ commit phần hai mục và tài nguyên liên quan. Giữ nguyên thay đổi cũ chưa commit. Kiểm tra checkout và nội dung commit trước khi push remote hiện có, không force push.

### US4 - Mã phiên dễ đối chiếu (P1)
Admin thấy cùng một mã như `HMA-000001` trong danh sách, cửa sổ Hành trình truy cập và CSV. Có thể tìm theo mã trong trang danh sách đang xem.
Mỗi phiên truy cập được ghi nhận có một số riêng. Mã giữ nguyên khi khách tiếp tục cùng phiên, sau khi tải lại hoặc khi thay đổi thứ tự danh sách. Khi một phiên bị xóa, số đã cấp không được dùng lại.
Các phiên còn lưu được cấp mã theo thời điểm bắt đầu. Dữ liệu hành trình hiện có tiếp tục mở đúng theo phiên. Số thứ tự áp dụng cho lượt ghé được thống kê của khách, kể cả khách vãng lai.

### US5 - Tên trang và mốc thời gian dễ đọc (P1)
Mỗi dòng trong danh sách dùng tên trang tiếng Việt. Đường dẫn `/` hiển thị là “Trang chủ”. Admin thấy mốc bắt đầu và mốc cuối theo giờ Việt Nam, gồm cả giây để phân biệt phiên ngắn.
Khi có tín hiệu rời trang, hiển thị giờ rời. Với phiên hết hoạt động do không còn tín hiệu hoặc dữ liệu cũ thiếu giờ rời, hiển thị mốc cuối có dữ liệu. Khi khách mở lại trang và tiếp tục phiên, cập nhật trạng thái của phiên.

## Requirements
- FR1: Một checkbox cho mỗi thông báo, lưu bằng API đã có với id.
- FR2: Nhãn/chấm chưa đọc và badge thật trên cả hai loại thiết bị.
- FR3: Không thay thanh toán/đặt lịch/CMS/địa chỉ/ngày giờ.
- FR4: Khách truy cập giữ API hiện có, có bảo vệ lỗi mạng, pagination và hủy kết quả cũ khi bộ lọc thay đổi.
- FR5: Danh tính vãng lai hiển thị đúng bản chất, tên chỉ từ dữ liệu đã ghi.
- FR6: Kiểm thử đọc từng mục, trạng thái sau lỗi, badge sau reload và khách truy cập desktop/mobile.
- FR7: Mã phiên gồm tiền tố `HMA-` và số thứ tự có ít nhất sáu chữ số. Giữ liên kết với sự kiện của phiên và quy tắc đồng ý thống kê.
- FR8: Danh sách và chi tiết diễn giải nhất quán tên trang, giờ bắt đầu, trạng thái và mốc cuối. Giờ rời chỉ xuất hiện với phiên có tín hiệu rời được ghi nhận.

## Success Criteria
- Một tích = một id lưu; badge chỉ giảm sau thành công và được giữ sau reload.
- Không tràn trang ở 390px; chữ chính 14px, chữ phụ tối thiểu 12px.
- Duyệt nguồn/trang/chi tiết/CSV được với dữ liệu thật từ API, rỗng và lỗi rõ ràng.
- Mỗi phiên đã lưu có đúng một mã. Các phiên mở cùng lúc có mã khác nhau. Mã hiện nhất quán trên desktop, mobile và trong CSV.
- Commit giới hạn đúng hai mục; có SHA push thành công hoặc ghi rõ lỗi thực tế.

## Assumptions & Edge Cases
Không thêm kênh thông báo, không gửi email/Zalo, không thay phân quyền. API đọc thông báo đã có id. Bài kiểm thử dùng fixture; không ghi dữ liệu thật. Nếu remote thay đổi, fetch và tích hợp an toàn trước push. Không có thông báo, mục không có id, lỗi lưu, refresh chậm, rời trang khi request đang chạy, bộ lọc không có kết quả, phiên hết dữ liệu đều phải xử lý.
