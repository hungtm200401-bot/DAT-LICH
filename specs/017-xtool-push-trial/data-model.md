# Data model: Xtool trial

No business data or schema changes.
A trial report records schema version, source commit, Xtool release/checksum,
runner SDK/toolchain, build outcome, signing attempt outcome, artifact hashes,
actual Bundle ID/origin/version and APNs verification state.
Build states: pending -> success | failed.
Signing states: pending -> blocked-missing-auth | failed | unexpected-success.
Push state remains unverified until signing/profile validation and real-device
delivery both pass. Never infer receipt from a manifest or provider HTTP 200.
No private keys, Device Tokens or credential contents are report fields.
