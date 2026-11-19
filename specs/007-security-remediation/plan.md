# Plan — Security remediation
Technical context: TypeScript/JS, Vinext/Vite, Cloudflare Workers, D1/R2. Shared admin bearer model, server validation and ledger preserved. No migration or account/MFA redesign. Existing dirty edits backed up and retained.
Constitution: scoped outcomes, no real data test writes or fake receipts, existing architecture, runtime regression required. Gates PASS. No extension hooks configured.
Phase0 research resolves local key UX, runtime-compatible image checks, headers and patched dependency set; Phase1 contracts/data-model/quickstart specify responses and evidence.
Implement pure auth/calendar/image helpers; integrate before API mutations; shared desktop/mobile login and escaped customer sinks; compatible Worker headers. Local key in ignored .dev.vars, never bundle. Upgrade coherent dependencies, verify runtime and record residuals.
Validate unit edges, real Worker audit with isolated D1/R2, core suite/build, dev invalid/valid key, preview/framing and before/after report. No deployment without online target.
