# Verification — 2026-11-03

Full Vietnamese acceptance report and scoped file list:
[docs/ACCEPTANCE_BOOKING_ADDRESS.md](../../docs/ACCEPTANCE_BOOKING_ADDRESS.md).

- Production build/core: npm.cmd test passed, 140 tests, 139 PASS, 0 FAIL,
  one pre-existing opt-in public raster tile check skipped.
- Booking browser suite: 22 scenarios plus actual production service worker
  installation, zero map-engine/tile/search/config requests. Includes a held
  reverse request released after manual edits and DOM-only browser autofill.
- Isolated real D1 create/readback: accurate confirmed GPS, manual booking,
  stale signature with changed street. Configured travel fee and total preserved,
  no fake payment or owner data mutation.
- Booking-to-admin browser regression passed desktop appointment/customer
  location views and mobile details, with original GPS accuracy/time and exact
  directions. Only booking UI changed, readonly admin maps retained.
- Renderer/admin lazy-map/settings and overview build-recovery checks passed.
- Syntax checks and git diff --check passed.

GPS, reverse responses and business writes were mocked in browser tests.
Persistence test used actual API and isolated D1. Physical device/OS GPS
accuracy and prompts were not tested. Public reverse data may be incomplete;
manual address entry remains available. No schema changes or remote deployment.

Superseded map-specific booking checks were updated where they form the active
journey/commands; the final acceptance suite validates the authorized GPS/manual
flow. Old pin-only ad hoc scripts are not claims about the new UI.

## Kiểm tra nâng cấp định vị

- `npm.cmd test` đạt 156 ca, một ca bản đồ trực tiếp bỏ qua theo cấu hình.
  Đồng hồ giả lập xác nhận dự phòng ở mốc 4 giây sau khi cấp quyền và khoảng
  cải thiện 2,5 giây kể từ lần đo đủ điều kiện.
- `npm.cmd run verify:booking-address` đạt 27 tình huống trên kích thước máy tính,
  máy tính bảng và điện thoại. Kiểm tra địa giới bắt đầu khi đang cải thiện mẫu,
  yêu cầu tra địa chỉ dùng điểm cuối cùng, tên cũ tải chậm không chặn định vị,
  và sửa phường khi đang kiểm tra không làm chuyển bước. Service worker production
  cài được với các tài nguyên đặt lịch.
- `npm.cmd run verify:business-data` đạt với Worker và D1 riêng. Tọa độ đã xác nhận
  được trả đúng khi tra lịch. Lịch có địa chỉ đã sửa lưu địa chỉ mới và bỏ tọa độ cũ.
- TypeScript và kiểm tra khoảng trắng đạt. GPS trình duyệt trong kiểm thử dùng
  dữ liệu mô phỏng. Độ chính xác thực địa cần được kiểm tra bằng điện thoại thật.
