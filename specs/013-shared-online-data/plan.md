# Implementation Plan: Dữ liệu online chung
**Branch**: `codex/shared-online-data` | **Date**: 2026-11-25 | **Spec**: [spec.md](spec.md)

## Summary
Giữ frontend Vite/Vinext trên loopback; dev reverse proxy toàn bộ `/api/` tới HTTPS origin cố định giống IPA. Chế độ mặc định qua `npm run dev` là online. `npm run dev:local` và chạy Vite trực tiếp dành cho kiểm thử cô lập. Backend/DB online giữ nguyên, không migration hoặc nhập dữ liệu local. Shared mode bỏ binding D1/R2 local để không có đường fallback đọc/ghi.

## Technical Context
**Language/Version**: JavaScript ESM, TypeScript, Node >=22.13.
**Primary Dependencies**: Vite 8.3.5 / proxy có sẵn; không thêm thư viện.
**Storage**: D1/R2 online trong chế độ chung; dữ liệu `.wrangler` cũ nguyên vẹn trong chế độ local.
**Testing**: node:test với Vite server + upstream HTTP fixture cô lập; build/core suite; browser test hiện có; online chỉ public GET/401.
**Target Platform**: Windows loopback browser, HTTPS Cloudflare hiện tại.
**Project Type**: Web + iPhone đã có.
**Performance Goals**: Truyền stream JSON/ảnh, timeout 30 giây; không buffering lớn hay retry mutation.
**Constraints**: Chỉ host/Origin loopback hợp lệ, upstream cố định; không TLS bypass, CORS wildcard, credentials trên frontend hay chia sẻ local sessions. Không tự fallback local.
**Scale/Scope**: Một dev server, toàn bộ business `/api/`; không mở LAN/tunnel trong chế độ chung.

## Constitution Check
Trước và sau thiết kế: PASS. D1 online vẫn là nguồn duy nhất; validation/admin/payment vẫn do backend hiện tại; không sửa dữ liệu/schema. Có spec, test xác thực/đặt lịch/upstream lỗi/bảo vệ nguồn và kiểm tra nghiệp vụ. Frontend theo thiết kế hiện tại, chỉ nhãn nguồn được cập nhật.

## Project Structure
- `build/shared-online-data.mjs`: mode/target, dev plugin, guards, mapping cookies/headers, runtime descriptor.
- `vite.config.ts`: tích hợp dev proxy trước middleware Worker, giữ build production nguyên vẹn.
- `scripts/dev.mjs`: online mặc định, local flag, nhận diện nguồn của server đang chạy.
- `public/app.js`: nhãn nguồn chính xác sau khi đọc metadata từ dev proxy.
- `scripts/windows/CHAY_LOCAL.bat`, `CHAY_DU_AN.bat`, `package.json`: launcher/chế độ.
- `tests/shared-online-data.test.mjs`: fixture upstream/Vite kiểm chứng hợp đồng thật, không ghi production.
- `README.md`, `docs/USER_GUIDE.md`, `docs/PROJECT_STRUCTURE.md`: vận hành.
- `specs/013-shared-online-data/`: đặc tả, nghiên cứu, hợp đồng, nhiệm vụ, chứng cứ.

## Complexity Tracking
Không có vi phạm. Dùng proxy Vite có sẵn thay vì triển khai đồng bộ hai chiều hoặc đổi backend bảo mật.
