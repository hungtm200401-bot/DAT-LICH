# Lịch sử giao dịch toàn thời gian

Yêu cầu 2026-11-03: có danh sách lịch sử không giới hạn theo thời gian, tách khoản cọc và thanh toán, phân biệt lịch đã cọc với đã trả đủ.

Kế hoạch: dùng toàn bộ sổ giao dịch hiện có, không đổi API/database hoặc nghiệp vụ thu tiền. Đổi Sổ giao dịch thành Lịch sử giao dịch, mặc định Toàn bộ thời gian. Thêm nhóm Tất cả / Thu cọc / Thanh toán / Hoàn tiền / Số dư cũ; bộ lọc tháng tùy chọn và trạng thái lịch hiện tại. Mỗi dòng có khách, mã lịch, thời gian, loại, số tiền, đối chiếu, trạng thái và biên nhận. Danh sách không cắt số bản ghi; xuất CSV theo đúng bộ lọc.

Trạng thái hiện tại được tính trên toàn bộ sổ trước khi lọc thời gian/loại. Khoản cọc cũ giữ nguyên loại Thu cọc sau khi lịch được trả đủ. Lịch hủy và các khoản hoàn vẫn có lịch sử. Số dư chuyển sang không có ngày giao dịch thật, tách riêng và chỉ hiển thị khi xem toàn thời gian. Giao dịch thực tế không bị sửa hoặc tạo thêm.

Tiêu chí: giao dịch cũ khác năm/tháng luôn thấy ở mặc định; có thể lọc riêng cọc/thanh toán và đủ cọc/đã trả đủ; tìm bằng mã, tên, điện thoại, đối chiếu; chọn tháng rồi trở về toàn thời gian; CSV phản ánh danh sách; mobile không tràn ngang; luồng thu/hoàn và chống ghi trùng tiếp tục đạt.

Kiểm tra dự kiến: unit cho lịch sử toàn thời gian và phân loại từ toàn sổ, browser desktop/mobile/CSV với dữ liệu kiểm thử, kiểm tra core/build. Kết quả thực thi ghi sau kiểm tra.

Kết quả thực thi:

- `node --test tests/finance.test.mjs`: 12/12 đạt, gồm lịch sử qua nhiều năm, múi giờ Việt Nam, trạng thái tính trước lọc, cọc riêng từng lịch, hoàn tiền, số dư cũ và không giới hạn số dòng.
- `node scripts/verify-payment-history.mjs`: đạt trên local 5174 với API kiểm thử chỉ đọc; đủ 133 dòng, các nhóm cọc/thanh toán/hoàn/số dư cũ, trạng thái hiện tại, tháng tùy chọn và trở lại toàn thời gian, tìm kiếm, CSV đúng bộ lọc, điều hướng và rỗng. Kiểm tra riêng cột loại và trạng thái không bị khuất trên mobile 390px. Ảnh tại outputs/payment-history/.
- Browser luồng thu/hoàn `verify-central-payments.mjs`, Tổng quan `verify-overview.mjs` và khôi phục phiên bản `verify-overview-version.mjs`: đạt.
- `npm.cmd test`: build thành công; 147 bài, 146 đạt, 1 live-map test theo cấu hình bỏ qua, 0 lỗi.
- Không thay API/schema, không ghi giao dịch thật; quyền admin, dữ liệu và chống ghi trùng giữ nguyên.
