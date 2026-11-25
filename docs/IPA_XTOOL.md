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
Đã chạy thật trên macOS ngày 2026-11-25:
- Run: https://github.com/hungtm200401-bot/DAT-LICH/actions/runs/45579801031
- Nguồn: 3880152829b16a7201126c28cbbe889c38b2a345, cùng nội dung 5 file Swift
  với thư mục làm việc tại thời điểm thử.
- Xcode 26.6, Swift 6.3.3, iOS SDK 26.5.
- ZIP Xtool khớp checksum, CLI khởi chạy được.
- Build và đóng gói: PASS, exit 0, ứng dụng arm64 cho iPhone, giữ đúng định danh,
  máy chủ, phiên bản 1.3/build 4 và commit trong Info.plist.
- Ký thật bằng --sign: exit 1, báo `requires logging in with xtool auth`.
- Không có embedded.mobileprovision; apnsEntitlementVerified=false,
  pushReady=false và deviceReceiptVerified=false.
- Run tổng thể FAILURE (exit 2 có chủ ý): chưa đạt điều kiện Push; không phải lỗi
  biên dịch. Artifact chẩn đoán vẫn được tải lên thành công.
- IPA thử: IPA/experimental/HOAN-Xtool-1.3-build4-3880152-NO-PUSH.ipa,
  406862 bytes, SHA-256 2a5897556335ffd85ead7659c0bebb74126c9e9a548366639273ede74db46209.
- Đã xác minh SHA-256 ZIP artifact và checksum IPA; validator bundle hiện có đạt.
  IPA cũ giữ SHA-256 1c75143de011b0fae144392103e85bbd7b1267dc341c8adfc8a54891a334f9cd.
- Check cục bộ: Python compile PASS, actionlint PASS; check-ios-build có 39 PASS,
  2 skip cần macOS. Không chạy lại test nghiệp vụ vì không đổi API/DB/web.

Đây chưa phải IPA đã ký Apple hoặc kiểm chứng nhận thông báo trên điện thoại.
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
