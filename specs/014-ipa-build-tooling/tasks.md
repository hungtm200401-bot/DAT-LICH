# Tasks: Công cụ build IPA
## Setup
- [x] T001 Hoàn tất yêu cầu, nghiên cứu và hợp đồng trong specs/014-ipa-build-tooling/.
## Foundation
- [x] T002 Viết fixture lỗi/thành công trong tests/test_ipa_bundle.py trước implementation.
- [x] T003 Thêm validator nguồn/bundle/ZIP và publish trong ios/ipa_bundle.py.
## US1 - Build một lệnh
- [ ] T004 [US1] Nối preflight, logs, dấu nguồn và publish vào ios/build-ipa.sh, ios/export-signed-ipa.sh, ios/write-build-manifest.py.
- [ ] T005 [US1] Thêm kiểm tra Windows và launcher trong scripts/check-ios-build.mjs, scripts/windows/TAO_IPA.bat, package.json và scripts/build-ios-github.mjs.
## US2 - Chặn gói lỗi
- [ ] T006 [US2] Ký thành phần nhúng theo thứ tự trong ios/sign-adhoc-bundle.sh và xác minh trong CI.
## US3 - Tái sử dụng
- [ ] T007 [US3] Cập nhật .github/workflows/ios.yml, docs/IPA_BUILD.md, ios/README.md, README.md và ghi nguồn Husk.
## Verification
- [ ] T008 Chạy preflight/fixture/IPA thật và ghi specs/014-ipa-build-tooling/quickstart.md.
- [ ] T009 Build macOS/Simulator thực, tải và đối chiếu IPA/manifest/log đúng commit; cập nhật quickstart.md.
## Dependencies
T001 -> T002-T003 -> T004-T007 -> T008-T009. MVP là validator + common publication. Source/build/sign được xử lý tuần tự; research là bounded read-only. Không thay business code hoặc deployment online.
