# Validation
Run npm.cmd test and node scripts/verify-booking-address.mjs against localhost:5173.
Check desktop 1440, tablet 768 and mobile 390: exact subtitle, full-width rounded GPS, original four fields and zero map/network requests.
Exercise success/denied/unsupported/timeout/offline/mismatch/coarse/duplicate GPS, manual entry, manual edits before/during/after lookup and navigation/reload.
Run node scripts/verify-location-persistence.mjs for real HTTP create/readback in isolated D1; never create fixtures in owner database.
Run retained vector/admin map and overview checks separately to preserve unaffected behavior. Disclose physical-device testing not performed.
