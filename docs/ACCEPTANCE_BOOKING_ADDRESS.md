# Nghiệm thu địa chỉ đặt lịch — 03/11/2026

## Kết quả giao diện

Đã triển khai trực tiếp trên dự án đang mở. Trang `/#/booking/location` chỉ giữ
nút **Dùng vị trí hiện tại**, trạng thái khi thao tác và bốn trường địa chỉ hiện
có. Giữ thứ tự, font, màu sắc, phí di chuyển và tổng tiền. Nút GPS toàn chiều
rộng, bo tròn, viền mảnh, icon/chữ căn giữa. Câu hướng dẫn đúng yêu cầu:
“Vui lòng cung cấp địa chỉ để chuyên viên đến đúng địa điểm.”

Đã bỏ khung bản đồ, mở rộng/zoom/pan, ghim/kéo ghim, tìm địa điểm, thử lại bản đồ,
loading/placeholder và khoảng trống bản đồ. Không gọi Google Maps, OpenFreeMap,
MapLibre/Leaflet hoặc API tile/search/config trên bước đặt lịch. Service worker
cũng không tải trước các thư viện bản đồ. Bản đồ chỉ xem trong quản trị giữ nguyên.

## Danh sách file và mục đích thay đổi

| File | Thay đổi trong đợt này |
| --- | --- |
| `public/booking-location.js` | Gỡ markup/import/lifecycle bản đồ; giữ picker hành chính; GPS có giới hạn, hủy khi sửa/chuyển trang, bảo vệ nhập tay và xác nhận bằng Tiếp tục. |
| `public/location-utils.js` | Gắn tọa độ với đúng địa chỉ; bộ lọc lưu đơn loại tọa độ và thời điểm xác nhận nếu không khớp. |
| `public/device-location.js` | Báo dữ liệu reverse không khớp ranh giới/tỉnh/xã; không tự dùng dữ liệu mâu thuẫn. |
| `public/app.js` | Giữ địa chỉ nháp khi tải lại; reset độ tin cậy GPS cũ; lọc lại ứng viên trước tạo lịch; cập nhật phiên bản module. |
| `public/location-experience.css` | Bố trí GPS toàn chiều rộng/bo tròn; bỏ CSS tìm địa điểm và thanh tiến trình cũ; giữ style bản đồ dùng ở quản trị. |
| `public/location-map.js` | Bỏ phần ghép UI tìm địa điểm; giữ renderer dùng chung cho quản trị. |
| `public/location-search.js` | Đã xóa module UI tìm địa điểm không còn được sử dụng. |
| `public/maps-settings.js` | Thông tin cài đặt phản ánh GPS/nhập tay và bản đồ quản trị; không còn cấu hình Google cần nhập. |
| `public/admin-location.js` | Chỉ đổi URL phiên bản wrapper, giữ cách hiển thị/lazy load bản đồ quản trị. |
| `public/sw.js` | Bỏ precache engine/tile/search bản đồ; đồng bộ các asset mới và đổi cache version. |
| `app/layout.tsx`, `app/page.tsx` | Đổi phiên bản script/CSS/build để tải bản mới. |
| `public/app-version.json`, `public/client-bootstrap.js`, `build/dev-service-worker.ts` | Đồng bộ build `booking-address-gps-1` và cơ chế phục hồi cache cũ. |
| `package.json` | Lệnh kiểm tra GPS/địa chỉ và kiểm tra bản đồ quản trị riêng. Không thêm/xóa package dependency. |
| `tests/location.test.mjs` | Mở rộng quy tắc xác nhận: đổi đường/tỉnh/xã/tọa độ hoặc thiếu chữ ký sẽ không lưu điểm cũ; ghi chú tầng/cổng không tự đổi vị trí đường. |
| `scripts/verify-booking-address.mjs` | 22 tình huống trình duyệt trên desktop/tablet/mobile, kiểm tra Console và Network, gồm autofill không phát input. |
| `scripts/verify-booking-worker.mjs` | Cài service worker production thật trên origin thử riêng; kiểm tra không tải/precache bản đồ. |
| `scripts/verify-location-persistence.mjs` | API thật/D1 riêng cho đơn GPS, nhập tay và sửa địa chỉ; kiểm tra phí và tổng tiền. |
| `scripts/verify-booking-goals.mjs` | Cập nhật hành trình GPS không bản đồ, giữ kiểm tra đơn/khách hàng/chi tiết quản trị desktop/mobile. |
| `scripts/verify-openfreemap-search.mjs` | Điểm chạy tương thích chuyển sang kiểm tra luồng địa chỉ mới, thay kiểm tra UI đã bỏ. |
| `README.md`, `docs/BOOKING_ADDRESS.md`, `docs/OPENFREEMAP.md`, `docs/GOOGLE_MAPS.md` | Hướng dẫn phương án cuối và cách kiểm tra hiện tại. |
| `specs/004-booking-address-gps/*`, `specs/003-openfreemap-search/spec.md` | Spec/plan/tasks/kiểm chứng của phương án cuối; đánh dấu UI map/search cũ đã được thay thế. |

Các API `/api/address-search` và `/api/maps-config` được giữ để tương thích,
không được bước đặt lịch gọi. Giữ engine, vendor, API tile và dependency còn
dùng trong quản trị. Không đổi schema, lịch sử đơn, mức phí hoặc công thức tiền.

## GPS, xác nhận và lưu dữ liệu

1. Chỉ bấm GPS mới gọi Geolocation; không xin quyền khi vừa vào trang/nhập tay.
2. Loading xuất hiện ngay trên nút, khóa bấm lặp, có nút dừng. Toàn bộ thao tác
   có watchdog 75 giây; thuật toán lấy mẫu và reverse giữ giới hạn riêng hiện có.
3. Dùng latitude/longitude/sai số thật; đối chiếu địa giới hiện tại. Không bịa số
   nhà, không tự dùng dữ liệu mâu thuẫn và không ghi đè nội dung đã chỉnh tay.
4. Khách kiểm tra và bấm Tiếp tục để xác nhận. Chỉ ứng viên GPS chính xác, có
   địa chỉ đầy đủ và còn khớp mới được lưu tọa độ/thời điểm xác nhận cùng đơn.
5. Sửa tỉnh/phường/đường hủy tọa độ cũ. API kiểm tra lại; đơn hợp lệ vẫn được tạo
   theo địa chỉ tay nếu không có GPS hoặc không còn xác nhận phù hợp.
6. Chuyển bước giữ dữ liệu. Tải lại trang giữ địa chỉ nháp nhưng không tin GPS cũ
   như phép đo mới. Không sửa các đơn lịch sử đã lưu.

Không thêm API trả phí, API key hoặc yêu cầu thẻ thanh toán. Dùng reverse lookup
hiện có, chỉ khi chủ động định vị, có cache/timeout/hạn mức, không gọi theo từng ký tự.

## Kết quả chạy thực tế

| Kiểm tra | Kết quả |
| --- | --- |
| `npm.cmd test` (gồm production build) | Build thành công; **140 test: 139 PASS, 0 FAIL, 1 SKIP**. SKIP là kiểm tra tile public opt-in đã có. |
| `npm.cmd run verify:booking-address` | **22 tình huống PASS**, không có lỗi Console/runtime ngoài lỗi HTTP được cố ý giả lập và không có request bản đồ. Kiểm tra service worker production PASS. |
| `node scripts/verify-location-persistence.mjs` | PASS: tạo/đọc lại ba đơn trong D1 riêng; tọa độ GPS đầy đủ, nhập tay không GPS, địa chỉ sửa không lưu GPS cũ; phí/tổng đúng, không ghi nhận thanh toán giả. |
| `node scripts/verify-booking-goals.mjs` | PASS: GPS → xác nhận địa chỉ → thông tin → đơn, xem lại điểm trong quản trị lịch/khách hàng và mobile, đường dẫn chỉ đường đúng. |
| `npm.cmd run verify:openfreemap` | PASS: renderer vector, lazy load lịch sử quản trị 24 lịch, chế độ chỉ xem, cấu hình desktop/mobile. |
| `node scripts/verify-overview-version.mjs` | PASS: phục hồi phiên bản khớp và bảo vệ form đang chỉnh. |
| `git diff --check`, kiểm tra cú pháp module đã đổi | PASS. |

22 tình huống bao gồm nhập tay trên 1440/768/390 px; GPS thành công, từ chối,
không hỗ trợ, timeout, sai số lớn, offline, reverse lỗi/không khớp; sửa trước,
trong và sau định vị; đổi tỉnh/xã/đường; bấm lặp; dừng; hộp quyền chưa trả lời;
chuyển bước/quay lại, autofill không phát input và tải lại trang. Test phản hồi chậm giữ thực sự một yêu cầu
reverse đang chạy rồi sửa địa chỉ, sau đó thả phản hồi cũ.

Kiểm tra ghi dữ liệu chạy trong D1 riêng dưới `scratch/location-persistence-*`.
Các kiểm tra giao diện chặn/giả lập ghi đơn, GPS và phản hồi dịch vụ. Không tạo
đơn thử hoặc ghi nhận tiền trong database của người dùng.

Ảnh kiểm tra: `outputs/booking-address/manual-1440.png`, `manual-768.png`,
`manual-390.png`; ảnh quản trị trong `outputs/booking-goals/`.

## Giới hạn và việc chưa xác minh thực tế

- **Chưa kiểm thử GPS trên điện thoại/thiết bị vật lý thật**, quyền vị trí cấp OS
  hoặc độ chính xác ngoài thực địa. GPS trong trình duyệt kiểm thử được giả lập.
- Dữ liệu reverse công cộng có thể thiếu số nhà/đường hoặc tạm không khả dụng;
  khách luôn có thể nhập tay. Kết quả tự điền là gợi ý cần khách kiểm tra.
- Không phát hiện lỗi runtime/regression chưa xử lý trong các kiểm tra đã chạy.
  Các script cũ chỉ dành cho thao tác ghim của giao diện đã bỏ không được dùng
  làm tiêu chí phương án cuối; thay bằng suite GPS/địa chỉ nêu trên.
- Không triển khai lên môi trường remote trong đợt này. Xem local tại
  `http://localhost:5173/#/booking/location` và Ctrl+F5 nếu tab còn bản cũ.
