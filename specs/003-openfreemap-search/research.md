# Research

- Decision: reuse OpenFreeMap Liberty with vendored MapLibre. Already supports click/drag/zoom, GPS accuracy, readonly admin and lifecycle cleanup. Official quick start: https://openfreemap.org/quick_start/.
- Decision: Photon search through a same-origin proxy, restricted to countrycode=VN. Photon explicitly supports search-as-you-type; public Nominatim must not be used for autocomplete. API: https://github.com/komoot/photon/blob/master/docs/api-v1.md.
- Photon public demo permits reasonable usage, throttles extensive requests and has no availability guarantee: https://github.com/komoot/photon#demo-server. Debounce/cache/cancel, bounded concurrency and errors avoid unbounded traffic. No unsupported explicit lang=vi; request local names via Accept-Language.
- Decision: retire active Google SDK/settings controls, including for persisted legacy provider=google. Keep external directions URLs. No database mutation or key migration necessary.
- Decision: search selection is unconfirmed. Retain its street/house only while the point matches; existing local administrative boundaries determine current province/ward. Manual pin clears stale search selection.
- Alternatives: Google requires account setup and is explicitly replaced; Nominatim autocomplete violates its public service policy; paid services add keys and unnecessary setup for this scope.
