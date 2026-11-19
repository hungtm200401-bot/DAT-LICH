# Validation

1. Run npm.cmd run dev; open /#/booking/location. Existing Google settings must not start its SDK.
2. Pan, zoom and choose a pin; use current position with granted/denied/coarse GPS.
3. Type a Vietnamese location (at least three characters), select with mouse/keyboard, inspect pin and confirm. Check/bổ sung số nhà.
4. Complete booking in an isolated test database; read back address and full coordinate precision.
5. Run npm.cmd test, node scripts/verify-openfreemap-search.mjs, existing vector/lifecycle/location browser checks. Mock business writes for UI tests; isolate any real persistence check from owner data.
6. Check desktop/mobile, empty/error search, stale responses, readonly admin and zero Google API requests.
