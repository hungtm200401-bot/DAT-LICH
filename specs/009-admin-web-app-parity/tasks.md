# Việc triển khai quản trị web và app

## Chuẩn bị

- [x] T001 Xác định nguồn D1 của app và đối chiếu số bản ghi qua `ios/HoanAdmin.xcconfig` và cấu hình triển khai.
- [x] T002 Tạo và xác minh sao lưu local qua `scripts/local-d1-backup.mjs`.

## US1. Cùng dữ liệu quản trị

- [x] T003 [US1] Tải lại dữ liệu quản trị và nêu địa chỉ online ở `public/app.js`.
- [x] T004 [US1] Lưu khách từ hai giao diện qua `app/api/data/route.ts` và kiểm tra dữ liệu sau khi mở phiên khác.

## US2. Dùng cùng chức năng

- [x] T005 [US2] Dùng chung các mục và màn quản trị trong `public/app.js`, `public/mobile-admin.js` và `public/mobile-admin.css`.
- [x] T006 [US2] Kiểm tra điều hướng và thao tác quản trị trên hai cỡ màn hình.

## US3. Bảo toàn hồ sơ

- [x] T007 [US3] Xác nhận phạm vi chuyển dữ liệu thử hoặc nghiệp vụ ở `spec.md`.
- [x] T008 [US3] Kiểm tra mốc khôi phục và đối chiếu các hồ sơ được chọn.

## Phát hành

- [x] T009 Kiểm tra bằng `npm.cmd test`, cập nhật Worker đang dùng và xác minh phiên quản trị online.
