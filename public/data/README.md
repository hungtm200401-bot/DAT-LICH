# Dữ liệu hành chính Việt Nam

- `vietnam-administrative-latest.json`: danh mục 34 tỉnh/thành và 3.321 phường, xã, đặc khu theo mô hình chính quyền địa phương hai cấp. Bản dữ liệu tĩnh được lấy từ API v2 của [provinces.open-api.vn](https://provinces.open-api.vn/) để website hoạt động ổn định mà không phụ thuộc mạng lúc khách đặt lịch.
- `vietnam-legacy-districts.json`: 696 quận/huyện/thị xã/thành phố thuộc tỉnh trước khi cấp huyện kết thúc hoạt động. Dữ liệu chỉ dùng cho ô tra cứu địa chỉ cũ, không được coi là cấp hành chính hiện hành.

Nguồn pháp lý chính: Quyết định 19/2025/QĐ-TTg, có hiệu lực từ 01/07/2025. Khi cập nhật dữ liệu, cần giữ đủ 34 đơn vị cấp tỉnh và 3.321 đơn vị cấp xã, đồng thời chạy `npm test`.
