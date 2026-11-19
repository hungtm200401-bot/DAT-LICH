# Decisions
- Existing acquireDevicePosition already validates freshness, accuracy, permission and cancellation. Keep it and its existing tests; add an overall UI watchdog so an unanswered prompt cannot leave loading indefinitely.
- Existing local polygons/current directory determine province/ward. Reject explicit reverse-geocoder disagreement, preserve manual entries and allow manual completion when lookup fails.
- No map or Photon autocomplete is needed on booking. Admin uses the map wrapper only in readonly mode; retain map renderers/vendors/API map tiles. Retain standalone search API for compatibility; remove unused search UI composition.
- Bind new destination GPS to exact core address and point. On manual edits clear destination/device payload coordinates. No changes to existing stored bookings; no schema migration.
- Use existing Nominatim/Photon reverse path with existing bounded cache/rate controls, no added paid service. Photon public service has no SLA; manual fallback stays available.
