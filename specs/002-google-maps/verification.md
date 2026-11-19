# Google Maps integration verification

Validated locally on 2026-11-03. Initial integration was verified before a key
was available. The owner subsequently entered a browser key in local settings
and selected Google Maps. No credential was invented, logged or committed.

## Results

- `npm.cmd test`: build passed; 136 tests, 135 passed, 0 failed, one existing
  opt-in live map-tile check skipped. Includes new configuration validation tests.
- `node scripts/verify-google-maps.mjs`: passed with a mocked Google SDK. Covers
  lazy loading, pre-abort and abort during load, readonly admin, click/drag pin,
  exact lat/lon precision, coarse GPS guard, optional Vietnam Places autocomplete,
  ignoring a late search result after manual selection, busy/confirmed controls,
  authentication and network failures, tile-load timeout, expand/Escape and cleanup.
- `node scripts/verify-maps-settings.mjs`: passed desktop/mobile forms, empty-key
  validation, authenticated save payload, unrelated settings preservation, failed
  save rollback, disabling Google, setup instructions, no Google SDK in settings,
  no horizontal mobile overflow and minimal no-store configuration endpoint.
- `node scripts/verify-location-recovery.mjs`: passed existing legacy-cache,
  booking draft, coarse GPS, address confirmation and mobile checks.
- `node scripts/verify-location-map-lifecycle.mjs`: passed current-provider zoom,
  page rerenders, resize, navigation, pending mount cancellation and cleanup checks.
- `node scripts/verify-admin-location-lazy.mjs`: passed current-provider history
  map lazy-loading and scoped cleanup checks with 24 fixture bookings.
- `node scripts/verify-overview.mjs` and `node scripts/verify-overview-version.mjs`:
  passed existing overview interactions and version recovery after updating build IDs.
- `git diff --check`: passed.

All automated test business writes were intercepted. Google requests in those
tests used a mocked SDK and made no billable Google calls. Separate read-only
live diagnostics used the owner's saved configuration; no real bookings or
settings were changed by the diagnostics.

## Follow-up: Permission Denied

- Live SDK loaded, but Google's map response reported `Permission Denied` and
  invoked `gm_authFailure`. The response did not identify a specific Cloud
  setting; do not label it as a confirmed billing or referrer error.
- Recovery now hides the oversized Google error graphic and disables interaction
  with its canvas, preserves manual address entry, and offers a full page reload
  after authorization failure. Network failure still offers a map-only retry.
- Configuration guidance now links API activation, Credentials and official
  error documentation; saving settings is explicitly distinct from validating
  Google's permissions. Existing saved settings remain unchanged.
- `npm.cmd test` rerun: build passed; 136 tests, 135 passed, 0 failed, one existing
  opt-in live tile test skipped.
- `node scripts/verify-google-maps.mjs` rerun: passed, including failed network
  load followed by successful retry, hidden error canvas, cached authorization
  failure on remount, no automatic auth retry and actual reload-button navigation.
- `node scripts/verify-maps-settings.mjs` rerun: desktop/mobile passed.
- `node scripts/verify-overview-version.mjs`: first run observed a detached DOM
  element during rerender; immediate rerun passed unchanged. No overview source
  was modified for this follow-up.
- `git diff --check` passed.

## Remaining external prerequisite

Live Google map rendering and Places results remain unavailable with the saved
key until the owner checks API activation, API and Website restrictions and active
billing in the corresponding Google Cloud project. The configuration screen and
`docs/GOOGLE_MAPS.md` explain the steps. The existing provider can be selected in
settings if needed. Deployment was not performed; local and hosted D1 settings
must be configured independently.

Code/spec convergence: the bounded integration and configuration requirements
are implemented; successful live-provider verification awaits Google Cloud access
being allowed for the saved key.
