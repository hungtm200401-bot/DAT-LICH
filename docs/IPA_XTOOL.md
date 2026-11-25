# Thử Xtool với HOÀN

Xtool là đường build thử riêng, giữ nguyên dự án Xcode và quy trình IPA đang dùng.
Windows hiện chưa có WSL/Swift; thử nghiệm chạy trên GitHub macOS với SDK đã cài.
Không yêu cầu mật khẩu Apple hay cài/reboot hệ điều hành để chạy phần build.

## Chạy thử
Actions -> HOAN Admin iPhone -> Run workflow -> nhánh codex/xtool-push-trial ->
use_xtool=true. Quy trình tải Xtool 2.0.0-beta.1 và đối chiếu SHA-256 của ZIP
trước khi chạy. Trong bản sao dự án, chạy:
- xtool dev build --configuration release --scheme HoanAdmin --ipa --sign
- xtool dev build --configuration release --scheme HoanAdmin --ipa

Lần ký trên runner không có đăng nhập Apple phải báo lỗi thật yêu cầu đăng nhập.
Build không --sign vẫn có chữ ký ad-hoc, không phải chữ ký Apple có quyền Push.
Workflow trả thất bại khi chưa đạt điều kiện Push, kể cả biên dịch thành công.
Artifact Xtool-Trial-Diagnostics là bằng chứng thử nghiệm; không thay IPA/LATEST.json.

## Kết quả và giới hạn
Chưa có lần chạy macOS của feature này. Kết quả sẽ cập nhật sau khi có log thực tế.
Repo GitHub chưa có bộ khóa Apple ở lần kiểm tra 2026-11-25.

Mã Xtool beta.1 cho thấy bước tự ký:
- Đổi Bundle ID thành XTL-<identityID>.<bundle gốc>.
- Loại aps-environment khi Team miễn phí.
- Tạo profile iosAppDevelopment, không giữ nguyên profile production Ad Hoc.
Vì vậy không thể coi --sign là cách tự cấp Push cho Apple ID miễn phí.
Chưa có bản ký Apple/kiểm chứng iPhone thì không được hứa nhận khi vuốt tắt.

Để hoàn tất: cần Team có quyền Push, bộ ký/profile đúng định danh và thiết bị,
khóa APNs đúng app/môi trường trên Worker, rồi kiểm tra iPhone thật ở nền/khóa và
sau vuốt tắt, chạm mở đúng lịch. Xem IPA_SIGNED_GITHUB.md và NATIVE_PUSH.md.

Nguồn đã kiểm tra: tag 2.0.0-beta.1 tại https://github.com/xtool-org/xtool
(Sources/XToolSupport/DevCommand.swift; Sources/XKit/DeveloperServices/App IDs/;
Sources/XKit/Signer/AutoSigner.swift; DeveloperServicesFetchProfileOperation.swift).
