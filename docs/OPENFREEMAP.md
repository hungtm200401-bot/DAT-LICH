# OpenFreeMap chỉ còn dùng trong quản trị

Phương án cuối ngày 03/11/2026 đã bỏ toàn bộ bản đồ và tìm địa điểm khỏi trang đặt lịch.
Khách dùng nút GPS hoặc bốn trường nhập địa chỉ hiện có. Xem [hướng dẫn GPS và địa chỉ](BOOKING_ADDRESS.md).

Bản đồ OpenFreeMap/MapLibre chỉ xem trong quản trị vẫn hoạt động. Thiết bị thiếu WebGL
vẫn có renderer raster dự phòng. Không thay đổi tọa độ hay lịch sử đơn cũ.
Các dependency dùng chung này được giữ; không preload SDK/tile bản đồ khi vào đặt lịch.

Kiểm tra phần quản trị bằng npm.cmd run verify:openfreemap.
Tài liệu nền: https://openfreemap.org/quick_start/.
