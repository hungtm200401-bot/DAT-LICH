# Contract
- /booking/location renders no map/search controls; no map dependencies or requests. Four existing address inputs plus explicit GPS action and bounded inline progress/error.
- createAppointment retains existing fee, service/date/time and payment behavior. cleanBookingLocation accepts only confirmed exact address/point signature, valid current region and permitted accuracy. Otherwise both destination/device coordinates and confirmation timestamps are omitted/null, without blocking a valid manual booking.
- No new endpoint. Existing reverseGeocode action, address-search/maps-config compatibility routes and readonly admin maps retain their contracts.
