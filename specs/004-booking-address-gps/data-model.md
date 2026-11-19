# Data model
- Existing address fields: city/provinceCode, ward/wardCode, street address and optional locationNote.
- GPS candidate: locationCoordinates/deviceCoordinates, capturedAt, compatible region, locationAddressSignature. Only a fresh accurate point and unchanged complete address can produce a signature.
- Confirmed candidate: locationConfirmedAt set by Tiếp tục; server sanitizer requires signature/address/region/point match. Unmatched or absent GPS becomes manual booking with null coordinates.
- Direction note does not change core geographic binding. Draft reload preserves address but clears GPS trust. D1 bookingDetails JSON accepts signature without schema changes; historical records untouched.
