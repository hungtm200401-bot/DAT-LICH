# HOÀN Makeup Artist — Website đặt lịch & quản trị

Project full-stack gồm website giới thiệu/đặt lịch và hệ thống quản trị vận hành theo phong cách luxury tối giản. Giao diện nền trắng, typography Didone + Inter, màu nhấn đỏ rượu `#7A1832`.

## Chức năng chính

- Quy trình đặt lịch 6 bước: dịch vụ, thời gian, địa điểm, thông tin, đặt cọc và xác nhận.
- Lịch hẹn được lưu vào Cloudflare D1, không dùng dữ liệu khách giả hoặc `localStorage` làm nguồn dữ liệu.
- Khách hàng được tạo/cập nhật tự động khi có lịch mới.
- Quản trị lịch hẹn, trạng thái, dịch vụ, khách hàng, tiền cọc, lịch làm việc, nội dung website và báo cáo.
- Khung giờ khách đặt được kiểm tra trùng và phản ánh ngay trong trang “Lịch làm việc”.
- Thống kê tổng quan, doanh thu và tỷ lệ dịch vụ được tính trực tiếp từ lịch thật.

## Quy trình phát triển với Spec Kit

Repo đã có skill Spec Kit cho Codex và nguyên tắc phát triển trong `AGENTS.md`.
Các file này đi cùng code qua Git. Máy Windows muốn có công cụ dùng chung chỉ
cần chạy `CAI_SPEC_KIT.bat` một lần; sau đó dùng `speckit-project "D:\Projects\DuAnKhac"`
để áp dụng cho dự án khác. Xem [hướng dẫn Spec Kit](docs/SPEC_KIT.md).

## Chạy trên máy tính

Yêu cầu Node.js `>=22.13.0`.

Mở terminal tại thư mục dự án, nơi có `package.json`. Lần đầu sau khi tải mã nguồn, cài thư viện và khởi tạo cơ sở dữ liệu local:

```bash
npm ci --include=dev
npm run db:migrate:local
```

Sau đó chạy website (các lần sau chỉ cần lệnh này):

```bash
npm run dev
```

`npm run dev` chỉ khởi động Vite, không tự cài thư viện. Nếu gặp lỗi `'vite' is not recognized`, hãy chạy bước cài thư viện ở trên. Trên Windows cũng có thể mở `CHAY_DU_AN.bat` để cài thư viện, khởi tạo cơ sở dữ liệu local và chạy website.

Mở địa chỉ Vite hiển thị trong terminal, thường là `http://localhost:5173/`. Website dùng hash route; trang quản trị tại `/#/admin`, lịch làm việc tại `/#/admin/schedule`.

Quản trị yêu cầu khóa thật ở cả localhost và LAN. Khởi tạo một lần bằng
`node scripts/admin-key.mjs --init`, mở file `.dev.vars` trên máy để lấy giá trị
`ADMIN_TOKEN`, khởi động lại dev rồi nhập khóa tại màn Đăng nhập quản trị.
Trình duyệt nhận phiên có hạn 8 giờ. Bản local dùng loopback, bản online cần HTTPS.
Giữ `.dev.vars` trên máy và đặt `ADMIN_TOKEN` online bằng secret của nền tảng.
Xem [bảo vệ, sao lưu và khôi phục dữ liệu](docs/BAO_VE_DU_LIEU.md).

Nếu PowerShell báo lỗi `npm.ps1 cannot be loaded`, dùng `npm.cmd` thay cho `npm` trong các lệnh trên, hoặc mở Command Prompt:

```bash
npm.cmd run dev
```

## Cấu trúc quan trọng

- `public/app.js`: toàn bộ giao diện và tương tác website/quản trị.
- `public/styles.css`: hệ thống thiết kế responsive.
- `app/api/data/route.ts`: API dữ liệu thật.
- `db/schema.ts`: schema D1/Drizzle.
- `drizzle/`: migration cơ sở dữ liệu.
- `.openai/hosting.json`: cấu hình triển khai Sites và D1.

## Ứng dụng quản trị cho iPhone

Mở dự án Xcode trong thư mục `ios/`. Cách xuất IPA và kiểm tra trên các khổ iPhone có trong [hướng dẫn iOS](ios/README.md).

## Địa chỉ đặt lịch

Trang đặt lịch chỉ có **Dùng vị trí hiện tại** và bốn trường địa chỉ cũ, không
hiển thị hoặc tải bản đồ. Khách có thể nhập hoàn toàn thủ công mà không cấp quyền GPS.
GPS chỉ gợi ý địa chỉ khi dữ liệu đủ tin cậy; **Tiếp tục** xác nhận địa chỉ hiện tại.
Sửa tỉnh/phường/đường sẽ hủy tọa độ cũ. Bản đồ quản trị vẫn giữ nguyên.
Xem [hướng dẫn địa chỉ và GPS](docs/BOOKING_ADDRESS.md).

## Lưu ý thanh toán

Website ghi nhận yêu cầu đặt lịch và trạng thái chờ đối soát. Tiền cọc chỉ chuyển sang “Đã nhận” khi quản trị viên ghi nhận giao dịch thật. Muốn tự động xác minh VietQR/MoMo cần bổ sung webhook từ nhà cung cấp thanh toán.
