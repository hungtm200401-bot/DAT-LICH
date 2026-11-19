# Decisions
- Official Google docs specify Maps JavaScript API with a restricted browser key and billing.
- Places autocomplete uses gmp-select, placePrediction.toPlace and fetchFields; request only location.
- Modern draggable pins use AdvancedMarkerElement and a Map ID. DEMO_MAP_ID is for trial setup.
- Retain exact GPS accuracy and administrative-boundary confirmation from the current app.
- Owner explicitly has no key. Add reusable settings and guidance; validate behavior with a mock SDK.
- Preserve default provider and all existing booking data; do not fabricate a Google key or charge calls.

Sources: https://developers.google.com/maps/documentation/javascript/load-maps-js-api
https://developers.google.com/maps/documentation/javascript/place-autocomplete-new
https://developers.google.com/maps/documentation/javascript/advanced-markers/draggable-markers
https://developers.google.com/maps/documentation/javascript/get-api-key
