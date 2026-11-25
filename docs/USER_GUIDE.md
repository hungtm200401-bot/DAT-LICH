# Hướng dẫn sử dụng HOÀN

## Mở dự án

Dự án nằm trong một thư mục gốc duy nhất, nơi có `package.json`. Mở `CHAY_DU_AN.bat` để dùng quản trị online chung dữ liệu với app iPhone.

Khi cần thử sửa code, chạy `npm.cmd run dev` hoặc mở `scripts/windows/CHAY_LOCAL.bat`. Lần đầu dùng máy mới: `npm.cmd ci --include=dev`, `npm.cmd run db:migrate:local`, `node scripts/admin-key.mjs --init`, rồi khởi động dev. Khóa quản trị thử nghiệm được lưu trong `.dev.vars`; khóa này chỉ dùng cho bản local. Giữ file này riêng, không đưa lên Git.

## Website và dữ liệu

Website dùng thật: `https://hoan-makeup-artist.hoan-makeup.workers.dev`; quản trị thêm `/#/admin`. IPA hiện tại kết nối đến đúng máy chủ này: lịch khách đặt trên web online, lịch quản trị trên máy tính và lịch trong app cùng nằm trong D1 online, dùng chung mật khẩu quản trị online. Mở hoặc làm mới app sau khi web có thay đổi.

Bản thử nghiệm local: `http://127.0.0.1:5173/`; quản trị thêm `/#/admin`. Dữ liệu local nằm trong `.wrangler/`, tách biệt dữ liệu online. Đặt lịch thử ở localhost không xuất hiện trong app đang kết nối online. Chuyển dữ liệu giữa hai môi trường cần đối soát/sao lưu riêng; không ghi đè dữ liệu vận hành bằng bản thử nghiệm.

Trong Cài đặt, nhập liên hệ và tài khoản nhận cọc thật. Trong Dịch vụ, kiểm tra giá/thời lượng. Trong Lịch làm việc, mở/chặn ca nhận khách.

Khách gửi yêu cầu đặt lịch → lịch chờ xác nhận. Báo đã chuyển khoản → chờ đối soát. Quản trị kiểm tra giao dịch thật rồi ghi nhận ở Tiền cọc; duyệt lịch là thao tác riêng. Website không tự xác minh tiền hoặc tự chuyển khoản hoàn cọc.

## Ứng dụng iPhone

File IPA mới nằm ngay trong `IPA/`; bản trước nằm trong `IPA/archive/`. Mỗi bản có JSON ghi phiên bản, build, commit và SHA-256 khi được xuất qua công cụ mới.

`npm.cmd run ipa:build` lấy bản từ GitHub Actions đã build đúng commit; cần mã nguồn đã commit/push và tài khoản GitHub có quyền chạy Actions. IPA dùng chữ ký kiểm tra cần ký lại để cài. Nhận thông báo khi app đóng cần chữ ký Apple có Push Notifications và cấu hình APNs. Xem [hướng dẫn APNs](NATIVE_PUSH.md).

## Công cụ phụ

- `scripts/windows/CAP_NHAT_LEN_CLOUD.bat`: build và triển khai Worker bằng quyền Cloudflare đã cấu hình.
- `scripts/windows/CHAY_LOCAL.bat`: chạy bản thử nghiệm với dữ liệu riêng trên máy.
- `scripts/windows/CHAY_ONLINE_4G.bat`: mở tunnel cho server local khi có cloudflared.
- `scripts/windows/CAI_SPEC_KIT.bat`: thiết lập công cụ phát triển Spec Kit.

Xem [sao lưu và khôi phục](BAO_VE_DU_LIEU.md) trước khi thao tác dữ liệu vận hành.
