# Interfaces

GET /api/address-search?q=...: q trimmed, 3..200 characters. Returns {results:[{id,label,address,point:{lat,lon,accuracy:null,mode:pin}}],attribution:"© OpenStreetMap contributors · Photon"}. At most five Vietnam results; country code and geometry validated. Errors: 400 invalid query; 503 temporarily unavailable. Timeout 5 seconds; no unbounded query forwarding. Endpoint fixed to Photon, never accepts upstream URLs.

GET /api/maps-config: {provider:"openfreemap",searchProvider:"photon"}, no key or database dependency.

Search UI: combobox supports arrows/Enter/Escape; selection invokes onSelectionChange(point,searchResult). Only a selection is committed, not typed text. Map-only click invokes the same callback without search result, clearing old address metadata.

Booking createAppointment: existing address, ward, city, locationNote and validated locationCoordinates are preserved in existing D1 storage. Search selection still requires Dùng vị trí này and valid current administrative region.
