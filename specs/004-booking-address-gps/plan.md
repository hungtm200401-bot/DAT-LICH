# Implementation Plan: GPS and manual booking address
**Date**: 2026-11-03 | **Branch**: main | **Spec**: [spec.md](spec.md)

## Summary
Remove booking map/search composition while retaining administrative pickers and existing GPS/reverse geocoder. Bind a precise GPS candidate to its exact suggested address; Tiếp tục confirms it. Core address edits cancel lookup and invalidate coordinates. Existing manual fields are preserved, including fresh document drafts. Admin-only map renderer and dependencies stay available.

## Technical Context
Existing vanilla JS modules, TypeScript API, Cloudflare D1/Drizzle, vendored MapLibre/Leaflet; no new package or database schema. Add shared address/coordinate binding helper and focused Node/browser tests. UI overall GPS operation bounded at 75 s, existing native quality/refinement tests unchanged. Reverse lookup only on click and existing cache/rate limits retained.

## Constitution Check
PASS before/after design: explicit user scope, reuse design/pickers/GPS, preserve D1/payment/admin boundaries, no remote deployment or real-data test writes. User confirmed final design in attachment; no further clarification required.

## Project Structure
public/booking-location.js loses map lifecycle, gains bounded GPS and edit preservation.
public/location-utils.js supplies address binding and safe persistence validation.
public/device-location.js reports region/address mismatch conservatively.
public/app.js preserves draft address and validates current confirmation.
public/location-experience.css scopes GPS layout to booking.
public/maps-settings.js describes current GPS/manual flow and readonly admin map.
app/api/data/route.ts retains existing save path with shared location sanitizer.
Existing map/search modules remain only when used by admin/API consumers; unused booking search UI is removed.
tests/location.test.mjs and new tests cover binding/persistence; scripts/verify-booking-address.mjs covers visual/network/GPS/manual scenarios; isolated D1 script extended.

## Implementation Strategy
Preserve administrative picker code; replace only map-specific blocks. Unit rules first, then booking UI/GPS, storage, build markers and browser verification. Single agent; independent test commands can run concurrently. No rollback to prior app version.

## Complexity Tracking
No exceptions. Bound signature prevents accidental stale associations, not malicious geolocation spoofing. Real physical GPS and mobile OS permission dialogs cannot be certified by browser mocks.

## Nâng cấp tốc độ và giao diện định vị

1. Mở nút định vị theo danh mục hiện hành. Giữ danh mục tên cũ cho tìm kiếm và khôi phục nháp.
2. Rút thời gian chờ lần đo đầu khi quyền đã cấp, giới hạn thời gian cải thiện mẫu đủ tốt và đối chiếu ranh giới từ mẫu phù hợp đầu tiên.
3. Giới hạn riêng việc tải địa giới và tra địa chỉ. Dùng địa giới đã kiểm tra trước khi gửi yêu cầu tra ngược. Gắn mức độ đầy đủ và sai số đo vào thông báo cho khách.
4. Kiểm tra đủ nhanh, lỗi và hủy yêu cầu bằng đồng hồ giả lập. Kiểm tra biểu mẫu, lựa chọn nhập tay và việc ghi lịch với các bản ghi mẫu.
