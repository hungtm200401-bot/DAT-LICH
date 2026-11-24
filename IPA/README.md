# Các bản cài IPA

Các script build iPhone xuất file vào thư mục này, đặt tên theo phiên bản và build để giữ được các bản trước.

- `HOAN-Admin-iPhone-<version>-build<build>.ipa`: gói được build bởi Xcode, cần ký lại trước khi cài lên iPhone.
- `HOAN-Admin-iPhone-<version>-build<build>-<environment>-signed.ipa`: gói đã ký bằng tài khoản Apple có quyền Push; script kiểm tra entitlement và môi trường trước khi xuất.

Build trên Mac: `bash ios/build-ipa.sh`. Build có chữ ký: `bash ios/build-ipa.sh --signed`, xem [cấu hình APNs](../docs/NATIVE_PUSH.md).

GitHub Actions lưu artifact **HOAN-Admin-iPhone** từ `IPA/*.ipa`. Giải nén artifact vào thư mục này. Các file IPA, ZIP, danh sách nguồn và bản kiểm tra trên máy được bỏ qua trong Git; chỉ tài liệu này được lưu cùng mã nguồn.

Những IPA phiên bản cũ được gom từ máy giữ nguyên nội dung. Không đổi tên bản 1.2 thành 1.3 để giả làm bản mới; cần build lại mã nguồn 1.3 bằng Xcode.
