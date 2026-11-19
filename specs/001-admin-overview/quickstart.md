# Validation
Use the existing local server at http://127.0.0.1:5173. No production writes required.
Run node --test tests/overview.test.mjs and node scripts/verify-overview.mjs.
Browser fixtures intercept API requests and exercise desktop/mobile navigation, refresh/error,
CSV download, date/service/reset filters, a five-booking limit and nonzero work queues.
Run npm.cmd test for build/core checks, or npm.cmd run build for the production build.
Review outputs/overview for screenshots if generated. Confirm no full-page overflow at 390px.
