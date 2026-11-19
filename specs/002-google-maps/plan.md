# Implementation Plan: Configurable Google Maps
## Technical Context
Existing browser JavaScript modules, Vinext API, Drizzle/D1 settings document.
Add public/maps-config.js for shared validation and cached public config, app/api/maps-config/route.ts
for minimal read-only configuration, public/maps-settings.js for independent admin forms,
public/google-maps-loader.js for one lazy SDK load and public/location-google-map.js for renderer.
Route provider selection through public/location-map.js, used by booking and admin maps.
No packages, migrations, credential files or business data modifications.
## Constitution Check
Pass: preserve D1 source, genuine GPS measurements, current location confirmation rules,
server authorization, responsive UI and existing provider. Verify through mocked SDK/API and
existing location checks; do not claim live Google validation without the owner's key.
## Data and contracts
Store browser settings on the existing settings record. GET /api/maps-config returns only
provider/apiKey/mapId/places, no unrelated settings. Disable inactive browser key exposure there.
Google renderer returns cleanup/update/resize methods matching existing renderer ownership.
Use AdvancedMarkerElement, PlaceAutocompleteElement and Google attribution-preserving SDK.
## Delivery
Implement shared config and admin form; renderer and routing; lifecycle and regression tests;
setup guide and honest final handoff naming the missing key.
