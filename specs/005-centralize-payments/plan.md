# Implementation Plan: Một nơi xử lý thanh toán

**Date**: 2026-11-03 | **Spec**: [spec.md](spec.md)

## Summary
Reuse the existing ledger/API and shared finance renderer. Route every external payment entry to the canonical payments page. Rework that page and its single dialog for focused reconciliation.

## Technical Context
- JavaScript ES modules, React/Vinext shell, existing CSS and native dialog.
- D1 and immutable payment transactions unchanged; no migration, dependencies or bank integration.
- Node test suite, verified build, existing Playwright installation on Windows.
- Desktop and mobile share the same renderer; white canvas and wine accent.
- Preserve pending request identity across network failures; distinguish committed payments from refresh failures.

## Constitution Check
Pass before/after design: scoped user outcomes specified; real transactions and D1 preserved; authentication and validation unchanged; existing visual system reused; relevant runtime checks required. No violations.

## Project Structure
- public/finance-admin.js and .css: canonical payment screen, compact form, filtering/export/retry.
- public/app.js and public/mobile-admin.js: navigation and read-only money status outside payments.
- app/page.tsx, app/layout.tsx, public/sw.js, public/app-version.json: consistent asset revision.
- scripts/verify-central-payments.mjs: browser acceptance scenarios and screenshots.

## Implementation Sequence
1. Centralize entry points and preserve filtered links.
2. Build attention queue, all-booking view and ledger tab with responsive cards.
3. Simplify dialog; set confirmation automatically for pending income; preserve real-transaction validation and retries.
4. Verify desktop/mobile navigation and financial edge cases, core suite and build.
