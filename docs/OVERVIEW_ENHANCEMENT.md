# Bổ sung Tổng quan và sửa thông báo thu tiền

Yêu cầu 2026-11-03: Tổng quan hơi trống, bổ sung vừa đủ; đồng thời xử lý lỗi thu phần còn lại.

Kế hoạch: thêm hai khối nhỏ dưới lịch hôm nay/cần xử lý: dòng tiền 7 ngày và tối đa 4 hoạt động mới. Dùng mô hình dữ liệu hiện có; phân biệt thu, hoàn, số dư cũ; không thêm thao tác duyệt cọc. Giữ trạng thái trống/lỗi thật và responsive.

Lỗi thực tế: lịch HMA-031126-BUA đã thu cọc 200.000đ bằng tham chiếu `mb`; khoản balance 500.000đ dùng lại `mb`, vi phạm chỉ mục chống trùng. Drizzle bọc lỗi D1 trong cause nên messageFor trước đây trả câu SQL ngoài cùng. Sửa ánh xạ nguyên nhân lồng nhau, kiểm tra trùng sau kiểm tra idempotency, giữ nguyên ràng buộc dữ liệu và hướng dẫn nhập mã giao dịch riêng. Không tự ghi thêm tiền hoặc sửa giao dịch thật.

Kiểm tra: regression SQLite cho trường hợp cùng mã bị từ chối/mã riêng thu đủ, lỗi có cause không lộ SQL; browser Tổng quan/Thanh toán/version recovery; build và core tests. Kết quả thực thi được ghi sau kiểm tra.

Kết quả: kiểm thử riêng finance/overview đạt 16/16; browser Tổng quan, Thanh toán và version recovery đều đạt trên local 5174, gồm trống/lỗi, desktop/mobile, tìm kiếm và chuyển trang không ghi dữ liệu thật. Ảnh kiểm thử: outputs/overview/desktop.png và mobile.png. Kiểm tra cập nhật bộ nhớ đệm chờ đúng stylesheet trước khi đánh giá bố cục.

`npm.cmd test` cuối cùng: build thành công; 144 bài, 143 đạt, 1 bài live-map theo cấu hình được bỏ qua, 0 lỗi. Kiểm tra cú pháp JS và diff whitespace đạt. Sửa thông báo lỗi không bỏ chống ghi trùng; retry đồng thời cùng idempotency key vẫn trả giao dịch đã ghi.
