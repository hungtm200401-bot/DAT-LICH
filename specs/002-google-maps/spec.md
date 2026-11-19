# Feature Specification: Google Maps for booking and admin
**Created**: 2026-11-03 | **Status**: Superseded by [003-openfreemap-search](../003-openfreemap-search/spec.md) at the owner's request; Google SDK/settings are no longer active.
**Input**: Integrate Google Maps; owner has no key and requests configuration UI and setup instructions.

## User Scenarios & Testing
### US1 — Configure maps (P1)
The administrator can choose the current map or Google Maps, enter a browser key,
set a Map ID and enable/disable address suggestions on desktop/mobile.
Acceptance: configuration saves through authenticated admin operations, preserves unrelated
settings and rejects Google activation without a valid key. Without a key the existing map works.
### US2 — Select a service location (P1)
Customers can click/drag a Google map pin, use device GPS or search Vietnamese places.
Acceptance: selecting a point does not submit a booking; explicit confirmation still applies.
Coarse GPS cannot masquerade as a precise point. Stale search results cannot replace a newer
selection. Existing address validation and manual house/street entry remain available.
### US3 — View a booked location (P2)
Administrators see the stored point on Google Maps, read-only, with existing directions links.
Acceptance: viewing cannot change the appointment coordinates. Closing/navigating cancels
pending map work; network/authentication errors are visible and never enable invalid confirmation.

## Requirements
- FR-001: No Google SDK requests before a Google-enabled map is mounted.
- FR-002: Browser key and optional Map ID are configured in admin settings; do not commit real keys.
- FR-003: Google search is restricted to Vietnam; selection yields only a candidate coordinate.
- FR-004: Pin selection/drag updates full coordinate precision and still requires confirmation.
- FR-005: Preserve GPS source/accuracy and existing boundary/address checks without invented precision.
- FR-006: Read-only admin maps do not allow coordinate changes.
- FR-007: Failures disable map confirmation and retain manual address entry and retry controls.
- FR-008: Leaving a page cleans listeners, markers, overlays, expanded state and late results.
- FR-009: Explain Google billing/API/key restrictions and disclose live verification limitations.

## Edge Cases
No key, wrong key/referrer, missing Places activation, map tiles never ready, offline, aborted
SDK load, late Places response after manual selection, coarse/absent GPS, saved legacy records.

## Key Entities
Existing settings and location coordinates. Only new fields are mapProvider,
googleMapsBrowserKey, googleMapsMapId and googleMapsPlaces on the existing settings document.

## Success Criteria
- SC-001: Configuration is usable on desktop/mobile; saving keeps existing settings.
- SC-002: Map selection, confirmation and read-only behavior pass deterministic browser checks.
- SC-003: Existing map/location checks pass when Google is not configured.
- SC-004: No real booking writes or billable Google requests are made by automated tests.

## Assumptions
Local implementation only. The owner will create and configure a browser-restricted key;
the agent cannot activate billing or obtain credentials on the owner's behalf. Current OSM
maps remain the default until configuration. Google address data is not stored as canonical
address content; the user confirms their destination and existing administrative data applies.
