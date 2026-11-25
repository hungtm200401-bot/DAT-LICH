# Specification Quality Checklist: Xtool Push trial

**Created**: 2026-11-25
**Feature**: [spec.md](../spec.md)
**Purpose**: Requirements quality only, not runtime verification.

- [x] Outcomes, actors and scope are defined.
- [x] Existing business behavior and data are preserved.
- [x] Build, valid Push signing and actual receipt are separate outcomes.
- [x] Background/locked and force-quit states have acceptance scenarios.
- [x] Failure and missing-credential behavior is defined.
- [x] Success criteria are observable; documentation does not replace tests.
- [x] Existing IPA is preserved; unverified output does not replace latest.
- [x] Dependencies are explicit; no material decision is unresolved.

All eight criteria reviewed before implementation. Device acceptance remains
in tasks.md and is not asserted by this checklist.
