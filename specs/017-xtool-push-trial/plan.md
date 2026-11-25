# Implementation Plan: Xtool Push trial

**Branch**: codex/xtool-push-trial | **Date**: 2026-11-25 | **Spec**: [spec.md](spec.md)

## Summary
Run a real Xtool build of the existing Xcode project on an ephemeral macOS runner,
then attempt Xtool signing and record the actual result. Preserve normal builds,
existing IPA/LATEST.json and all business code. Do not call an unsigned diagnostic
a Push-enabled deliverable. Real Apple authorization and device acceptance remain
external prerequisites, never simulated as success.

## Technical Context
**Language/Version**: Swift app; Python 3 standard library; Bash; Actions YAML.
**Primary Dependencies**: Xtool 2.0.0-beta.1 published macOS binary, Xcode SDK.
**Storage**: Ignored build outputs and diagnostic GitHub artifact; no D1 changes.
**Testing**: Existing IPA tool checks, actionlint, actual macOS Xtool run, later
physical iPhone APNs acceptance. Local tests cannot replace the last stage.
**Target Platform**: macOS CI; existing iOS deployment target; iOS 26.6.1 test phone.
**Project Type**: Internal experimental build tooling.
**Performance Goals**: Bounded CI job, no unbounded login/network waits.
**Constraints**: Host lacks WSL/Swift. Repository secrets list is empty. No passwords
in chat or logs. No reboot, Apple purchase, deployment or automatic booking writes.
**Scale/Scope**: One iPhone target, one opt-in reusable workflow and trial report.

## Constitution Check
- Specify outcomes first: PASS, both stories and actual-device criterion defined.
- Booking/data/payment preservation: PASS, no API, database or business changes.
- Reuse architecture: PASS, existing Xcode project and native Push source reused.
- Proportionate verification: PASS, tool execution separated from Push receipt.
- Post-design recheck: PASS, no exceptions.

## Project Structure
- .github/workflows/ios-xtool.yml: bounded trial, diagnostic-only artifact.
- .github/workflows/ios.yml: opt-in use_xtool dispatch; existing paths preserved.
- ios/xtool-trial.py: verified installer, real CLI execution, report and isolated output.
- docs/IPA_XTOOL.md: commands, actual results, remaining signing/device dependencies.
- specs/017-xtool-push-trial/: current spec, design, tasks and verification status.
- outputs/xtool-trial/: ignored diagnostic IPA/logs/report; never IPA/LATEST.json.

## Research decisions
Use the published beta that supports .xcodeproj instead of converting the app to
SwiftPM or changing sources. Pin the release and SHA-256. Invoke dev build without
--sign for a compilation result; invoke --sign separately to prove the missing-auth
condition. No Apple credentials are passed to the unsigned trial runner.

## Complexity Tracking
No constitution violations. No public contracts: this is internal one-off tooling.
