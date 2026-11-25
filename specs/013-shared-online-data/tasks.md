# Tasks: Dữ liệu online chung
**Input**: spec.md, plan.md, research.md, data-model.md, contracts/dev-api.md
**Tests**: Bắt buộc theo tiêu chí xác thực/đặt lịch/bảo toàn dữ liệu trong spec.

## Phase 1: Setup
- [x] T001 Hoàn tất đặc tả, checklist và thiết kế trong specs/013-shared-online-data/.

## Phase 2: Foundation
- [x] T002 Sao lưu/verify dữ liệu local và ghi biên bản riêng trong outputs/verification/shared-online-data/.
- [x] T003 Viết kiểm tra proxy tích hợp trước implementation trong tests/shared-online-data.test.mjs.

## Phase 3: US1 - Nguồn dữ liệu chung
**Independent test**: booking/readback và ảnh qua proxy trùng upstream fixture, không local write.
- [x] T004 [US1] Thêm dev proxy stream, target cố định, no retry/fallback và timeout trong build/shared-online-data.mjs.
- [x] T005 [US1] Nối plugin vào vite.config.ts; giữ build production và direct Vite fixture local.

## Phase 4: US2 - Phiên và bảo vệ nguồn
**Independent test**: login/cookie/logout/401, nguồn và Host xấu không tới upstream.
- [x] T006 [US2] Thêm guard loopback/Origin/Referer/Sec-Fetch-Site và alias cookie whitelist trong build/shared-online-data.mjs; không forward cookie local cũ/Authorization/forwarded headers.

## Phase 5: US3 - Chế độ và vận hành
**Independent test**: startup online/local có descriptor và nhãn đúng, reuse từ chối mode khác.
- [x] T007 [US3] Thêm default online và --local/metadata reuse trong scripts/dev.mjs, package.json, CHAY_DU_AN.bat, scripts/windows/CHAY_LOCAL.bat.
- [x] T008 [US3] Cập nhật nhãn nguồn trong public/app.js theo metadata và hướng dẫn trong README.md, docs/USER_GUIDE.md, docs/PROJECT_STRUCTURE.md.

## Final Phase
- [x] T009 Chạy tests/build/typecheck/browser phù hợp; ghi kết quả thật trong specs/013-shared-online-data/quickstart.md.
- [x] T010 Khởi động lại localhost chế độ online, đối chiếu public API/401 với upstream, kiểm tra dữ liệu local giữ nguyên và ghi outputs/verification/shared-online-data/.

## Dependencies & execution
T001 -> T002-T003 -> T004-T006 -> T007-T008 -> T009-T010. US1 là MVP; US2 phải hoàn tất trước khi dùng với production. Không có nhiệm vụ chỉnh DB/API online. Có thể đọc nghiên cứu và kiểm tra offline độc lập; các thay đổi plugin chung được thực hiện tuần tự.

## Implementation strategy
Test fixture trước, proxy/guard sau, rồi startup/UI. Các test tự động chỉ đọc công khai/401 khi chưa có phiên chủ; 1 lịch TEST online được tạo theo yêu cầu riêng sau đó và chủ đã xác nhận trên app. Không nhập dữ liệu cũ hoặc đổi mật khẩu trong phạm vi này.
