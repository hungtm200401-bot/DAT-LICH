# HOÀN Makeup — Đặt lịch và quản trị

Một dự án gồm website đặt lịch, API quản trị, dữ liệu D1 và ứng dụng iPhone. Mở trực tiếp thư mục `DAT-LICH-main` có file `package.json`; không còn thư mục dự án lồng bên trong.

## Chạy trên Windows

Cần Node.js từ 22.13. Mở `CHAY_DU_AN.bat`, hoặc chạy trong thư mục gốc:

```powershell
npm.cmd ci --include=dev
npm.cmd run db:migrate:local
node scripts/admin-key.mjs --init
npm.cmd run dev
```

Các lần sau chỉ cần `npm.cmd run dev`. Website: `http://127.0.0.1:5173/`; quản trị: `http://127.0.0.1:5173/#/admin`. Khóa quản trị nằm trong `.dev.vars` trên máy. [Hướng dẫn sử dụng](docs/USER_GUIDE.md).

## Build và lấy IPA mới

Commit và push nhánh cần build lên GitHub, rồi chạy:

```powershell
npm.cmd run ipa:build
```

Lệnh dùng đăng nhập GitHub đã lưu trong Git Credential Manager (hoặc `GH_TOKEN` trong môi trường), chạy workflow trên macOS, chờ build/Simulator đạt và tải IPA vào `IPA/`. Manifest kèm file xác minh commit, phiên bản/build và SHA-256. Bản cũ nằm trong `IPA/archive/`.

Trên Mac có Xcode: `bash ios/build-ipa.sh`. Để nhận thông báo APNs khi đóng app, cần bản ký có quyền Push và cấu hình máy chủ. [Hướng dẫn iPhone](ios/README.md) · [Cấu hình APNs](docs/NATIVE_PUSH.md).

## Cấu trúc

- `app/`, `public/`: trang web, giao diện khách/quản trị và API.
- `lib/`, `db/`, `drizzle/`, `worker/`: nghiệp vụ, dữ liệu, migration và Worker.
- `components/`, `hooks/`: các thành phần giao diện dùng chung.
- `ios/`: mã nguồn iPhone và công cụ build Xcode.
- `scripts/`, `tests/`, `build/`: công cụ vận hành, kiểm thử và tích hợp build.
- `docs/`, `specs/`: hướng dẫn, thiết kế đã duyệt và đặc tả tính năng.
- `IPA/`: các bản cài iPhone và thông tin kiểm chứng.

[Xem cấu trúc và dữ liệu local](docs/PROJECT_STRUCTURE.md). Công cụ phụ Windows nằm trong `scripts/windows/`. Quy trình Codex theo `AGENTS.md`; [Spec Kit](docs/SPEC_KIT.md).

## Kiểm tra

```powershell
npm.cmd test
npm.cmd run verify:native-push
node scripts/verify-admin-web-push.mjs
```

Lịch và giao dịch dùng D1; tiền cọc chỉ ghi nhận sau khi đối soát giao dịch thật. [Bảo vệ và sao lưu dữ liệu](docs/BAO_VE_DU_LIEU.md).
