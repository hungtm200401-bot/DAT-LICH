# Cấu trúc và nguyên tắc tổ chức dự án

Repo Git, `package.json` và mã nguồn cùng nằm ở thư mục gốc `DAT-LICH-main`. Chạy npm tại đây. Các đường dẫn bên trong dự án vẫn theo quy ước hiện có của Vinext/Next và Xcode.

## Mã nguồn cần giữ

`app`, `components`, `hooks`, `public`, `lib`, `db`, `drizzle`, `worker`, `ios` là mã ứng dụng. `build` chứa plugin cấu hình, không phải kết quả build. `scripts` và `tests` phục vụ cài đặt, kiểm thử, sao lưu và phát hành. Thư viện bản đồ trong `public/vendor` và các dữ liệu địa chỉ được ứng dụng sử dụng.

## Tài liệu và công cụ

Hướng dẫn ở `docs/`, thiết kế đã duyệt ở `docs/design/`, đặc tả các tính năng ở `specs/`. Một launcher chính `CHAY_DU_AN.bat`; các công cụ Windows còn lại ở `scripts/windows/`. `AGENTS.md`, `.agents` và `.specify` chứa hướng dẫn phát triển của repo.

## File tạo trên máy

- `node_modules/`: thư viện cài đúng `package-lock.json`.
- `dist/`, `.next/`, `.vinext/`: kết quả và cache build/dev, có thể tạo lại.
- `.sites-runtime/`: cache npm và công cụ kiểm thử riêng của checkout.
- `.wrangler/`: dữ liệu local và bản sao lưu; cần giữ khi muốn giữ dữ liệu.
- `.dev.vars`: cấu hình/khóa riêng của máy, cần giữ riêng.
- `outputs/`: log và kết quả kiểm thử; không thuộc bản cài.
- `IPA/`: IPA mới và manifest; `IPA/archive/` lưu phiên bản trước.

Các file tạo trên máy đã được bỏ qua trong Git và ẩn khỏi Explorer của VS Code để màn hình làm việc tập trung vào mã nguồn.

## Kiểm tra đợt sắp xếp 24/11/2026

Đã sao lưu D1 bằng AES-256-GCM với công cụ của dự án và kiểm tra giải mã. Sau khi di chuyển repo, 27 file SQLite/WAL, khóa/bản sao lưu và cấu hình được đối chiếu SHA-256 trước/sau. Biên bản riêng của máy ở `outputs/project-move-integrity.json`, không đưa lên Git.

File mẫu D1 và CSS mẫu không có tham chiếu runtime được bỏ khỏi repo. Các bản sao IPA của ứng dụng khác được bỏ khỏi dự án sau khi xác nhận bản gốc ngoài dự án còn nguyên. Các bản HOÀN cũ được giữ trong `IPA/archive/`.

Kết quả kiểm tra tại thư mục gốc: build và 156/157 bài core đạt (1 live map tile bỏ qua), TypeScript đạt, APNs mô phỏng và Web Push đạt. Kiểm tra Worker và Edge desktop/mobile đạt cho đặt lịch, xác thực, địa chỉ, thanh toán, archive/restore và đăng xuất; bốn tác vụ iPhone admin cũng được kiểm tra với dữ liệu cô lập. Build Xcode và Simulator trên macOS được xác minh riêng qua workflow GitHub trước khi lấy IPA.

Ngày 25/11/2026, [workflow 45528636692](https://github.com/hungtm200401-bot/DAT-LICH/actions/runs/45528636692) đã đạt Xcode ARM64 và cả iPhone SE / iPhone 16 Pro Max Simulator. IPA 1.3 build 4 được tải về `IPA/`, đối chiếu commit/manifest/SHA-256 và kiểm tra nội dung thực. [Biên bản và giới hạn kiểm thử](../specs/012-native-apns/quickstart.md).
