# Địa chỉ đặt lịch: GPS hoặc nhập tay

Trang `/#/booking/location` giữ bốn trường địa chỉ hiện có và nút **Dùng vị trí
hiện tại**. Không có bản đồ, ghim hay tìm kiếm địa điểm. Không tải SDK Google,
OpenFreeMap, MapLibre/Leaflet hoặc tile bản đồ trên trang đặt lịch.

## Khách sử dụng

- Nhập tỉnh/thành phố, phường/xã, số nhà/đường/thôn/xóm; hướng dẫn căn hộ/tầng
  không bắt buộc. Không cần cấp quyền GPS hoặc có tọa độ để đặt lịch.
- Khách chủ động bấm **Dùng vị trí hiện tại**. Trang báo từng bước, từ chờ cấp
  quyền đến đo vị trí, đối chiếu địa giới và tra địa chỉ. Khách có thể chọn
  **Dừng và nhập địa chỉ** trong lúc chờ.
- Trang hiển thị sai số ước tính do thiết bị trả về. Website đối chiếu ranh giới
  tỉnh và phường/xã trước khi tra địa chỉ. Số nhà cần một lần đo có sai số tối đa
  30 m và địa chỉ được tra phải cách điểm đo tối đa 20 m.
- Khi chỉ tìm được một phần địa chỉ, nút **Bổ sung địa chỉ** đưa khách vào ô cần
  điền. GPS yếu, khu vực chưa xác định hoặc dữ liệu không khớp chuyển sang nhập tay.
- Website giữ nội dung khách đã nhập. Khách kiểm tra các trường rồi bấm **Tiếp tục**
  để xác nhận. Nếu khách sửa địa chỉ trong khi hệ thống kiểm tra, khách tiếp tục
  với thông tin mới sau khi bấm lại.

## Tọa độ và địa chỉ được lưu

Khi GPS và địa chỉ đầy đủ còn phù hợp, hệ thống gắn ứng viên GPS với chính tọa độ,
độ chính xác, tỉnh/xã và địa chỉ đó. Tiếp tục ghi thời điểm xác nhận.

Sửa tỉnh, phường/xã hoặc địa chỉ đường hủy ứng viên, thời điểm xác nhận và cả
tọa độ GPS gửi lên đơn. Đơn tiếp tục dùng địa chỉ nhập tay. Sửa ghi chú tầng/cổng
không di chuyển địa chỉ đường, nên không tự hủy ứng viên còn phù hợp.

API tạo lịch kiểm tra lại liên kết địa chỉ/tọa độ; nếu không khớp thì bỏ tọa độ,
vẫn tạo đơn hợp lệ theo địa chỉ tay. Đây là cơ chế chống lưu nhầm dữ liệu cũ,
không phải chứng thực rằng thiết bị không thể giả mạo GPS.

Chuyển bước rồi quay lại giữ dữ liệu hiện tại. Tải lại toàn bộ trang vẫn giữ
địa chỉ nháp nhưng không coi GPS cũ là một lần định vị mới. Đơn lịch sử không
bị sửa; không thêm bảng/column hay thay công thức phí di chuyển/thanh toán.

## Lỗi và giới hạn

- Chỉ yêu cầu quyền khi bấm; từ chối/không hỗ trợ/timeout/mất mạng đều có thông
  báo tiếng Việt và cho phép nhập tay. Không bắt buộc GPS để đặt lịch.
- Toàn bộ thao tác kết thúc sau tối đa 45 giây, kể cả lúc chờ quyền. Với quyền
  đã cấp, website bắt đầu thử dự phòng sau 4 giây nếu lần đo đầu chưa phản hồi.
  Lần đo có sai số trên 30 m đến 60 m được cải thiện trong tối đa 2,5 giây trước
  khi dùng để kiểm tra địa chỉ.
- Danh mục tên cũ tải riêng. Dữ liệu địa giới bắt đầu tải ngay khi thiết bị cung
  cấp lần đo đủ tốt, với tối đa 6,5 giây để đối chiếu. Trang chờ kết quả tra địa
  chỉ tối đa 6 giây.
- Sửa địa chỉ hoặc chuyển trang hủy yêu cầu đang chạy; phản hồi cũ không ghi đè.
- Tái sử dụng Nominatim/Photon reverse với cache, timeout và hạn mức hiện có;
  không có autocomplete theo từng lần gõ, dịch vụ trả phí hoặc thẻ thanh toán.

## Mã dùng chung và quản trị

Giữ bản đồ chỉ xem trong quản trị, MapLibre/Leaflet và API map tiles vì còn được
sử dụng. Bỏ module tìm địa điểm trên giao diện, nhánh gắn search vào bản đồ và
precache bản đồ toàn site. Quản trị không còn ô nhập key/cấu hình Google.
`/api/address-search` và `/api/maps-config` giữ tương thích với bản trước,
không được trang đặt lịch gọi. Không gỡ dependency còn dùng ở quản trị.

## Kiểm tra

```powershell
npm.cmd test
npm.cmd run verify:booking-address
npm.cmd run verify:business-data
```

Kiểm thử trình duyệt dùng GPS, địa chỉ và phản hồi ghi đơn giả lập. Kiểm thử lưu
địa chỉ chạy API với D1 riêng và hồ sơ mẫu. Phần đo GPS thực địa trên điện thoại
cần thiết bị thật để kiểm chứng.
