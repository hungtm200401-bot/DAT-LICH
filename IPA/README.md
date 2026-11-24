# Bản cài iPhone HOÀN

File IPA mới nhất và manifest nằm ngay trong thư mục này. `archive/` giữ các phiên bản HOÀN trước đó.

- `HOAN-Admin-iPhone-<version>-build<build>.ipa`: build Xcode dùng chữ ký kiểm tra, cần ký lại để cài.
- File cùng tên đuôi `.json`: commit, phiên bản/build, SHA-256, máy chủ và loại chữ ký.
- `LATEST.json`: thông tin bản vừa lấy thành công từ GitHub Actions.
- `*-<environment>-signed.ipa`: bản đã xuất với chữ ký Apple có quyền APNs, khi đã cung cấp tài khoản phù hợp.

## Lấy bản mới trên Windows

Commit/push mã cần build rồi chạy `npm.cmd run ipa:build` tại thư mục gốc. Công cụ dùng GitHub Actions trên macOS, chờ build/Simulator thành công và xác minh artifact đúng commit trước khi lưu vào đây. Đăng nhập GitHub được đọc từ Git Credential Manager hoặc biến môi trường `GH_TOKEN`; không ghi token vào file.

## Build trên Mac

`bash ios/build-ipa.sh` xuất IPA thử. `bash ios/build-ipa.sh --signed` xuất bản có chữ ký sau khi cấu hình Apple Developer; xem [APNs](../docs/NATIVE_PUSH.md). Bản ký Apple ID miễn phí dùng để thử giao diện, không cấp quyền Push Notifications.

IPA và dữ liệu build không được đưa lên Git. Chỉ tài liệu này thuộc mã nguồn.
