# HOÀN Makeup Artist — Website đặt lịch & quản trị

Project full-stack gồm website giới thiệu/đặt lịch và hệ thống quản trị vận hành theo phong cách luxury tối giản. Giao diện nền trắng, typography Didone + Inter, màu nhấn đỏ rượu `#7A1832`.

## Chức năng chính

- Quy trình đặt lịch 6 bước: dịch vụ, thời gian, địa điểm, thông tin, đặt cọc và xác nhận.
- Lịch hẹn được lưu vào Cloudflare D1, không dùng dữ liệu khách giả hoặc `localStorage` làm nguồn dữ liệu.
- Khách hàng được tạo/cập nhật tự động khi có lịch mới.
- Quản trị lịch hẹn, trạng thái, dịch vụ, khách hàng, tiền cọc, lịch làm việc, nội dung website và báo cáo.
- Khung giờ khách đặt được kiểm tra trùng và phản ánh ngay trong trang “Lịch làm việc”.
- Thống kê tổng quan, doanh thu và tỷ lệ dịch vụ được tính trực tiếp từ lịch thật.

## Chạy trên máy tính

Yêu cầu Node.js `>=22.13.0`.

Mở terminal tại thư mục ngoài cùng của dự án, nơi có `package.json`, rồi chạy:

```bash
npm run dev
```

Lệnh này sẽ cài thư viện cho thư mục `HOAN_Makeup_Web_Admin`, khởi tạo cơ sở dữ liệu local và chạy website trên máy. Mở địa chỉ Vite hiển thị trong terminal, thường là `http://localhost:5173/`. Website dùng hash route; trang quản trị tại `/#/admin`, lịch làm việc tại `/#/admin/schedule`.

Nếu PowerShell báo lỗi `npm.ps1 cannot be loaded`, mở Command Prompt hoặc chạy qua `cmd /c`:

```bash
cmd /c npm run dev
```

## Cấu trúc quan trọng

- `public/app.js`: toàn bộ giao diện và tương tác website/quản trị.
- `public/styles.css`: hệ thống thiết kế responsive.
- `app/api/data/route.ts`: API dữ liệu thật.
- `db/schema.ts`: schema D1/Drizzle.
- `drizzle/`: migration cơ sở dữ liệu.
- `.openai/hosting.json`: cấu hình triển khai Sites và D1.

## Lưu ý thanh toán

Website ghi nhận yêu cầu đặt lịch và trạng thái chờ đối soát. Tiền cọc chỉ chuyển sang “Đã nhận” khi quản trị viên ghi nhận giao dịch thật. Muốn tự động xác minh VietQR/MoMo cần bổ sung webhook từ nhà cung cấp thanh toán.
