# Research: Xtool Push trial

## Decision: run on existing macOS CI
Windows has no WSL distribution, Swift, Xtool or Xcode.xip. GitHub macOS runner
already supports the project's normal builds. Avoid system installation/reboot.

## Decision: use published Xtool 2.0.0-beta.1
Source commit f1f42aada5002fc2340bdde08da6395a937703bd.
Release tag is 2.0.0-beta.1 (without a v prefix).
macOS ZIP SHA-256: b8789e599abb43b42fe93529cbc90c9e3dd19f48bd600c7dad07f7f6a3a4aa6b.
Sources/XToolSupport/DevCommand.swift defines build --scheme, --configuration,
--ipa and optional --sign. Without --sign it does not read Apple auth.
macOS EnsureSDKOperation uses installed Xcode; no interactive xtool setup needed.
Alternative: stable SwiftPM path requires a new project; not needed for this trial.

## Decision: treat signing and receipt as independent gates
Actual repository secret names query returned total 0. No Apple login is available
to Xtool CI. Its --sign command must fail clearly without auth; this is a blocked
signing attempt, not a successful signed build. Adding a local entitlement does
not grant Push. Never promote unsigned output or overwrite latest IPA.
Xtool auth API-key mode needs Apple authorization; password mode is interactive.
Bundle-ID remapping and device selection require review before using auto-signing
for production. Do not feed paid credentials into experimental signing blindly.

## Sources
- https://github.com/xtool-org/xtool/releases/tag/2.0.0-beta.1
- https://github.com/xtool-org/xtool/blob/2.0.0-beta.1/Sources/XToolSupport/DevCommand.swift
- https://github.com/xtool-org/xtool/blob/2.0.0-beta.1/Sources/XToolSupport/AuthCommand.swift
- Existing docs/NATIVE_PUSH.md and docs/IPA_SIGNED_GITHUB.md.

