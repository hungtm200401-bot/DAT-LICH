# Quản lý nội dung website

Mở **Admin → Nội dung website**. Màn hình chia thành ba khu vực:

- **Sửa trang web:** chọn trang, bấm chữ / ảnh trong bản xem trước để sửa. Cột bên trái chuyển giữa **Danh sách trang** và **Nội dung trang**; mỗi nhóm nội dung có thể đóng / mở riêng. Các thao tác ít dùng của khối nằm trong nút **⋯**.
- **Gói dịch vụ:** danh sách riêng có tìm kiếm, bộ lọc nhóm và nút **Chỉnh sửa**. Không trộn danh sách gói vào trình sửa trang.
- **Thư viện & dữ liệu:** mở **Thư viện ảnh**, **Dữ liệu dùng chung** hoặc **Mẫu của bạn** từ ba thẻ quản lý.

Trong **Gói dịch vụ**, chọn **Thêm gói dịch vụ** hoặc **Chỉnh sửa** rồi đi qua ba bước: **Thông tin → Giá & thời lượng → Hình ảnh**. Dữ liệu được giữ khi chuyển bước hoặc đổi nhóm dịch vụ. Thẻ xem trước cập nhật khi nhập; trên điện thoại, bấm **Xem trước** để chuyển giữa form và thẻ. Nút lưu hiện ở bước cuối; thao tác xóa nằm trong **Thao tác khác**. Ảnh tải thất bại giữ lại ảnh trước đó, và không thể lưu gói khi ảnh còn đang tải.

Các thao tác lịch sử, lưu nháp, kiểm tra trước khi đăng và lưu trang làm mẫu nằm trong **Tùy chọn**, được chia thành từng nhóm.

Trong trình sửa trang, ô chọn trang nằm trên thanh công cụ cùng trạng thái lưu và nút đăng. Danh sách nội dung có ảnh thu nhỏ, loại trường và trạng thái đang chỉnh sửa. Bấm **Danh sách** ở thanh xem trước để ẩn / hiện cột bên trái; thao tác này giữ nguyên iframe và nội dung nháp. Trên máy tính, danh sách và bản xem trước cuộn riêng trong chiều cao trình sửa; trên điện thoại, chúng xếp dọc.

Giao diện quản trị dùng chung `public/admin-interface.css`: tiêu đề sans serif, nền trung tính, tab gọn và danh sách phân cách bằng đường kẻ. Phần xem trước website giữ kiểu trình bày của trang khách.

Cỡ chữ điều khiển và danh sách tối thiểu 14px; tên nội dung 15px, ô nhập liệu 16px. Chữ phụ dùng màu xám đậm để dễ đọc. Cột nội dung được nới rộng, tên dài hiển thị tối đa hai dòng. Trên điện thoại, trạng thái lưu xuống dòng riêng và các nút được bố trí lại để giữ nguyên cỡ chữ.

Form **Dịch vụ** chỉ hiển thị tên, mô tả, giá và thời lượng mà API dịch vụ thực sự lưu. Quản lý ảnh ở **Bộ sưu tập** hoặc **Gói dịch vụ**. Khi sửa ảnh bộ sưu tập, dịch vụ liên kết được giữ đúng; ảnh tải lỗi không thay ảnh đã lưu. Form tạo mới để trống tên, mô tả và giá dịch vụ thay vì tự điền nội dung mẫu.

## Nội dung dùng chung

- **Dịch vụ & bảng giá** sử dụng chính bảng dịch vụ của hệ thống đặt lịch. Chỉnh giá, thời lượng, mô tả hoặc trạng thái ở một nơi; khối **Dịch vụ & bảng giá** trên các trang lấy dữ liệu mới khi trang tải lại / đồng bộ.
- **Thông tin liên hệ** dùng cùng dữ liệu thương hiệu với phần Cài đặt.
- **Album** và **đánh giá khách hàng** được lưu trên máy chủ. Bấm **Chèn vào trang**, hoặc chọn **Nguồn nội dung** trong trình sửa khối ảnh / đánh giá để liên kết. Nội dung được chỉnh trong thư viện; thiết lập bố cục vẫn chỉnh tại khối.
- Chọn **Nội dung riêng của khối** để ngừng liên kết và chỉnh nội dung riêng. Hệ thống giữ dữ liệu riêng trước đó của khối.
- Nút **Lưu & đăng dữ liệu dùng chung** áp dụng ngay cho các trang đã liên kết. Những thay đổi riêng của trang vẫn theo luồng lưu nháp và xuất bản.
- Máy chủ từ chối xóa album / đánh giá còn được trang đã đăng, bản nháp hoặc mẫu sử dụng.

## Thư viện ảnh

Upload 1–3 ảnh JPG, PNG hoặc WebP, tối đa 5 MB mỗi ảnh. Ảnh mới được ghi vào kho R2 và đăng ký vào thư viện; không cần migration cơ sở dữ liệu. Thư viện cũng tìm ảnh từ nội dung trang, bản nháp, album và các Pack cũ.

Có thể tìm theo tên, mô tả, ghi chú, đường dẫn; lọc theo nhóm; sửa tên, nhóm, alt và ghi chú. Mỗi ảnh liệt kê nơi sử dụng trong trang, bản nháp, album, mẫu, Pack và cài đặt thương hiệu. Mô tả trong thư viện được dùng khi chọn ảnh lần sau; mô tả riêng đã đặt trên trang được giữ nguyên.

**Chèn khối ảnh** tạo một khối mới. Trong trình sửa khối ảnh hoặc từng ảnh của gallery, chọn **Thư viện** để thay đúng ảnh đó. Trình chỉnh vị trí ảnh của trang cũng có tìm kiếm và dùng cùng danh mục.

## Mẫu tái sử dụng

Trong trình sửa khối chọn **Lưu làm mẫu**. Trong **Tùy chọn** chọn **Lưu trang làm mẫu**, hoặc dùng nút tương ứng trong **Mẫu của bạn**. Mẫu khối có thể chèn lại; mẫu trang xuất hiện trong danh sách **Mẫu khởi đầu** khi tạo trang.

Mẫu trang lưu cấu trúc khối bổ sung của trình dựng trang và dữ liệu chỉnh sửa. Với trang tùy chỉnh `/pages/...`, đây là toàn bộ cấu trúc khối. Mẫu không sao chép mã giao diện cố định của các trang hệ thống. Các mẫu khởi đầu có sẵn gồm câu chuyện thương hiệu, chiến dịch / dịch vụ, gallery và trang trống.

Bản sao nhận mã khối mới, có thể sửa riêng. Các liên kết đến album và đánh giá dùng chung được giữ. Đổi tên / xóa mẫu không thay đổi các bản sao đã chèn.

## Kiểm tra trước xuất bản

Trong **Tùy chọn → Kiểm tra trước khi đăng**, xem lỗi thiếu tiêu đề, nội dung, ảnh, nút, danh sách rỗng, dịch vụ trống hoặc nguồn dùng chung bị thiếu. Thiếu alt là gợi ý và có thể tiếp tục đăng. Báo cáo cho biết bản nháp hiện tại đã lưu trên máy chủ chưa.

Nút **Đăng lên website** kiểm tra lại dữ liệu. Máy chủ cũng kiểm tra cấu trúc và nội dung bắt buộc để không thể bỏ qua bằng cách gọi API trực tiếp. Bản nháp có thể chưa hoàn chỉnh. Kiểm tra ảnh xác nhận đường dẫn / trường dữ liệu; không xác minh tính sẵn có của ảnh HTTPS bên ngoài.

## Cấu trúc mã

| Module | Trách nhiệm |
| --- | --- |
| `public/cms/block-schema.js` | Loại khối, trường, trường bắt buộc, các lựa chọn trình bày và kiểm tra cấu trúc dùng chung cho client / server |
| `public/cms/block-model.js` | Chuẩn hóa dữ liệu cũ, phiên bản và giá trị mặc định của khối |
| `public/cms/block-editor.js` | Form chỉnh sửa khối |
| `public/content-blocks.js` | Render khối bằng DOM an toàn |
| `public/cms/pages.js` | Danh sách trang, tạo dữ liệu trang và form tạo trang |
| `public/cms/workspace.js`, `usability.css` | Ba khu vực quản lý, danh sách gói, bố cục và phân nhóm thao tác |
| `public/cms/pack-editor.js` | Form gói dịch vụ theo ba bước, thẻ xem trước và điều hướng bàn phím |
| `public/cms/preview.js` | Gửi nội dung nháp, dữ liệu dùng chung và dịch vụ sang iframe |
| `public/cms/api.js`, `persistence.js` | Gọi API, tuần tự hóa việc lưu nháp / xuất bản và giữ đúng trang khi chờ mạng |
| `public/cms/resources.js`, `library-ui.js` | Nguồn dùng chung, bản sao mẫu, tra nơi sử dụng ảnh và giao diện thư viện |
| `public/cms/publish.js` | Kiểm tra nội dung và báo cáo trước xuất bản |
| `lib/cms-resources.ts`, `app/api/cms-resources/route.ts` | Lưu thư viện, kiểm tra quyền, dữ liệu và xung đột phiên bản |

`site-tools.js` điều phối các module và giữ các chức năng thống kê / tương thích hiện có. Thêm một loại khối bằng cách khai báo schema, giá trị mặc định trong model, form bổ sung nếu cần và nhánh render tương ứng. Bộ kiểm thử kiểm tra mọi loại khối đăng ký đều có mẫu khởi đầu hợp lệ.

Dữ liệu thư viện lưu trong bảng `site_content` có sẵn, dưới khóa `cms-resource:shared`, `cms-resource:media`, `cms-resource:templates`. Chỉ dữ liệu dùng chung được trả về công khai. Metadata ảnh, mẫu và bản nháp yêu cầu quyền quản trị. Mỗi lần lưu kiểm tra revision; khi có xung đột, đóng và mở lại thư viện để tải bản mới.

## Kiểm tra

- `npm run test:cms`: kiểm tra model, dữ liệu dùng chung, bảng giá, mẫu, tham chiếu ảnh và lưu nháp.
- `npm test`: build và chạy kiểm thử dự án cùng kiểm thử CMS.
- Khi dev server đang chạy, `npm run verify:cms`: kiểm tra trình duyệt với API giả lập, không sửa nội dung người dùng. Sử dụng Playwright đã có tại `.sites-runtime/browser-tests` và Chrome.
- `npm run verify:cms-api`: kiểm tra API thực trên local, tạo bản ghi tạm trong thư viện rồi dọn đúng các bản ghi thử nghiệm. Không tạo trang xuất bản.
- `npm run verify:content-ui`: kiểm tra chuyển khu vực, tìm / lọc gói, giữ dữ liệu khi đổi bước, ảnh tải lỗi / thành công, lưu gói và giao diện điện thoại; sử dụng dữ liệu thử trong browser context riêng.
- `npm run verify:admin-ui`: rà các trang quản trị, kiểm tra kiểu tiêu đề, form dịch vụ, giá bằng 0, thời lượng không hợp lệ, liên kết dịch vụ của ảnh, upload có xác thực và form trên điện thoại. Dữ liệu ghi được giả lập trong browser context riêng.
- `npm run verify:editor-layout`: kiểm tra kích thước thanh công cụ, ô chọn trang không bị cắt chữ, nhóm nội dung và ảnh thu nhỏ, ẩn / hiện danh sách không tải lại iframe, giữ bản nháp và bố cục ở kích thước máy tính, laptop, tablet, điện thoại.
- Đặt `TEST_BASE_URL` nếu dev server không chạy ở `http://127.0.0.1:5173`.
