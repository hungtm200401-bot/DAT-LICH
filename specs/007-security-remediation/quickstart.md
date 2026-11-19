# Verification
1. Initialize local key via node scripts/admin-key.mjs --init; open ignored .dev.vars yourself to use key. Never publish or log this file. Start dev and enter key on admin screen.
2. npm.cmd test plus targeted security unit tests.
3. node scripts/verify-security-audit.mjs: fresh D1/R2 only; all original eight findings should have positive and negative regression coverage.
4. Verify dev boot, invalid/missing key versus valid key, desktop/mobile login/upload, same-origin preview versus foreign iframe; no real business writes.
5. npm.cmd audit --json after compatible updates; record remaining findings and scope, no claim full checklist certification.
