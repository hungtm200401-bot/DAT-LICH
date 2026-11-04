# Plan: Notifications and Visitors
Date: 2026-11-03. Spec: [spec.md](spec.md).

## Summary / Technical Context
Existing JS/Vinext app, D1 APIs. No dependencies/schema/collection changes. Add shared notification controller and visitor workspace module, one scoped stylesheet. Desktop/mobile reuse renderers. Existing site-tools visitor QR generator is reused. Preserve existing CMS/consent/tracking.

## Constitution Check
Pass: defined user outcomes; D1 and permission checks intact; no financial work; scoped responsive design; meaningful browser failure tests plus build/core verification. No violations.

## Source Structure
- public/admin-notifications.js: render/filter/read one id with server-confirmed count update.
- public/visitor-workspace.js: list/filter/page/detail/CSV; independent lifecycle, no fake aggregates.
- public/admin-operations.css: these two screens and actual mobile badge.
- public/app.js/mobile-admin.js/site-tools.js: narrow integration hooks.
- scripts/verify-admin-operations.mjs: isolated API fixtures desktop/mobile, failures/concurrency.
- specs/006-notifications-visitors/: scope and evidence.

## Execution
US1 shared renderer -> checkboxes and real badge; US2 focused list -> filters, detail, export, collapsed link/QR; check both -> stage only scoped content on HEAD -> validate staged snapshot -> commit/push origin without force. Existing dirty files stay intact. No unrelated refactors.
