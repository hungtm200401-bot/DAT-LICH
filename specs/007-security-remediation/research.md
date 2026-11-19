# Research
- Authorization: remove hostname bypass entirely, fail closed if no ADMIN_TOKEN. Keep shared bearer model; local key in ignored .dev.vars and same login flow desktop/mobile. No plaintext key in frontend/build.
- Ownership: retain code+phone capability model currently used by lookup/reportPayment; verify before auto-fill; minimized request receipt. Public availability needs date/time/service/status but no appointment code or schedule note.
- XSS: escape at sinks, including existing persisted rows and edit modal; do not destroy customer data by stripping characters.
- Calendar: server validates real calendar, time and window using Vietnam day; preserve existing slot atomic insert and ledger.
- Upload: validate signatures, structural boundaries and dimensions for PNG/JPEG/WebP before any R2 writes. Full re-encoding requires a compatible image-processing binding; do not claim decoding/reencoding when not performed.
- Headers: frame-ancestors self preserves same-origin CMS preview. Same-origin referrer, nosniff, object-src none. Avoid script-src restrictions that break current inline app bootstrap without a nonce migration.
- Dependency research delegated read-only under speckit-plan Phase0. Coherent patched stack: Vite8.3.5, Vinext1.4.3, React trio19.3.1, plugin-rsc0.5.37, CF plugin1.67.0/Wrangler4.156.1, Next/eslint config16.4.5. Test major Vinext compatibility; do not audit fix force or downgrade Drizzle/ESLint. Zod4.6.7 has no application imports. Keep unresolved advisory assessment separate from confirmed application bugs.
