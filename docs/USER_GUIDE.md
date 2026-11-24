# Hướng dẫn sử dụng HOÀN

## Mở dự án

Dự án nằm trong một thư mục gốc duy nhất, nơi có `package.json`. Mở terminal tại đây rồi chạy `npm.cmd run dev`, hoặc mở `CHAY_DU_AN.bat`.

Lần đầu dùng máy mới: `npm.cmd ci --include=dev`, `npm.cmd run db:migrate:local`, `node scripts/admin-key.mjs --init`, rồi khởi động dev. Khóa quản trị được lưu trong `.dev.vars`; mở file trên máy để xem và đăng nhập. Giữ file này riêng, không đưa lên Git.

## Website và dữ liệu

Bản local: `http://127.0.0.1:5173/`; quản trị thêm `/#/admin`. Dữ liệu local nằm trong `.wrangler/`, tách biệt dữ liệu online. Website online mặc định của IPA là `https://hoan-makeup-artist.hoan-makeup.workers.dev`.

Trong Cài đặt, nhập liên hệ và tài khoản nhận cọc thật. Trong Dịch vụ, kiểm tra giá/thời lượng. Trong Lịch làm việc, mở/chặn ca nhận khách.

Khách gửi yêu cầu đặt lịch → lịch chờ xác nhận. Báo đã chuyển khoản → chờ đối soát. Quản trị kiểm tra giao dịch thật rồi ghi nhận ở Tiền cọc; duyệt lịch là thao tác riêng. Website không tự xác minh tiền hoặc tự chuyển khoản hoàn cọc.

## Ứng dụng iPhone

File IPA mới nằm ngay trong `IPA/`; bản trước nằm trong `IPA/archive/`. Mỗi bản có JSON ghi phiên bản, build, commit và SHA-256 khi được xuất qua công cụ mới.

`npm.cmd run ipa:build` lấy bản từ GitHub Actions đã build đúng commit; cần mã nguồn đã commit/push và tài khoản GitHub có quyền chạy Actions. IPA dùng chữ ký kiểm tra cần ký lại để cài. Nhận thông báo khi app đóng cần chữ ký Apple có Push Notifications và cấu hình APNs. Xem [hướng dẫn APNs](NATIVE_PUSH.md).

## Công cụ phụ

- `scripts/windows/CAP_NHAT_LEN_CLOUD.bat`: build và triển khai Worker bằng quyền Cloudflare đã cấu hình.
- `scripts/windows/CHAY_ONLINE_4G.bat`: mở tunnel cho server local khi có cloudflared.
- `scripts/windows/CAI_SPEC_KIT.bat`: thiết lập công cụ phát triển Spec Kit.

Xem [sao lưu và khôi phục](BAO_VE_DU_LIEU.md) trước khi thao tác dữ liệu vận hành.
