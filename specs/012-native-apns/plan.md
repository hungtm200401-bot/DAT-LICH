# Implementation Plan: Native APNs

**Branch**: codex/native-apns | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

## Summary
Thêm đăng ký APNs trong IPA và hàng đợi độc lập trên D1, tận dụng sự kiện lịch đã commit. Giữ Web Push và nhắc cục bộ 24 giờ.

## Technical Context
Swift 5 / UIKit / WKWebView / UserNotifications; TypeScript / Vinext / Cloudflare Workers / D1; jose ES256 sẵn có. iOS 16+. Không thêm dependency. Kiểm thử Worker với Miniflare outboundService và JWT thật bằng khóa kiểm thử; build/core suite và Web Push regression. Xcode và iPhone thật cần xác minh riêng trên macOS.

## Constitution Check
PASS trước/sau thiết kế: giữ D1, auth admin, payment, conflict guards và thiết kế hiện có. Migration chỉ thêm bảng/index; rollback code cũ vẫn đọc dữ liệu cũ, giữ bảng mới để tránh mất hồ sơ gửi. Không có secret trong Git hoặc IPA.

## Project Structure
lib/admin-apns.ts; lib/native-push-installation.ts; app/api/admin-native-push/route.ts; drizzle/0012_admin_apns.sql; ios/HoanAdmin/NativePushCoordinator.swift; public/mobile-admin.js; scripts/verify-admin-apns.mjs; docs/NATIVE_PUSH.md.

## Delivery and verification
createAppointment gọi hai hệ thống độc lập sau commit; cron hồi phục từ thông báo đã lưu. APNs chỉ gửi booking để tránh nhắc đôi. Đăng nhập mới được subscribe/test. Cookie HttpOnly riêng cùng session_hash đảm bảo logout thu hồi kể cả khi Set-Cookie chưa về. UI phân biệt quyền iOS, đăng ký máy chủ, thiếu cấu hình và lỗi ký. Chạm mở mã hợp lệ trong origin đã cấu hình và giữ qua đăng nhập.
