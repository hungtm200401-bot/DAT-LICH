# Data model
settings.mapProvider: osm (default) or google.
settings.googleMapsBrowserKey: optional browser-restricted key string; required for google.
settings.googleMapsMapId: optional alphanumeric/underscore/hyphen ID; trial default DEMO_MAP_ID.
settings.googleMapsPlaces: boolean, default true when Google is enabled.
Existing appointment location and GPS fields are unchanged. Browser key is intentionally used
client-side and returned only by the dedicated public configuration endpoint while active.
