# Contracts
GET /api/maps-config: no-store JSON containing provider, apiKey, mapId, places. Configuration
errors return a generic 503, not saved private settings. A missing key does not activate Google.
POST /api/data action saveContent/key settings: existing admin authorization; validates map values.
mountGoogleLocationMap(container, point, confirm, options): Promise of cleanup function with
update({point,devicePoint,bounds,regionKey,forceCenter}) and resize(). options includes readonly,
AbortSignal, onSelectionChange and the validated config. Google lat/lng maps to app lat/lon.
Coordinate selections have mode pin and accuracy null; GPS retains original accuracy and mode.
Google Places requests location only, remains a candidate until existing confirmation logic runs.
