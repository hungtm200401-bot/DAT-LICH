# Data model

- SearchResult: id, label (max 500 chars), address (max 300 chars), point {lat,lon,mode:pin,accuracy:null}. Only valid Vietnamese Point features, at most five. Provider text treated as untrusted.
- Search selection: transient reference to SearchResult. Cleared on another pin, GPS/manual selection, region edit or fresh booking. Never turns an imprecise GPS fix into a confirmed destination.
- Appointment: existing address, ward, district columns; bookingDetails stores city, locationNote, locationCoordinates, locationDeviceCoordinates, capture/confirmation timestamps. No new tables/columns.
- Maps config: fixed provider=openfreemap and searchProvider=photon; legacy Google settings inert and never exposed by public config endpoint.
