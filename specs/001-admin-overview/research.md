# Findings and Decisions
## Current design revision
- The owner found the completed overview too dense. Use three metrics, two panels,
  five booking rows at most, nonzero queues and a secondary export menu.
- Remove charts and activity from the landing screen; preserve their underlying
  data and the existing detailed destinations. Do not add another dashboard section.

## Initial implementation findings
- Desktop task rows are divs with decorative arrows, so they do not navigate.
- Desktop appointment date is rendered but never used; status query links are ignored.
- Mobile recent activity always displays a placeholder; desktop cash chart has no dates/values.
- Current reports export all ledger rows rather than the displayed overview.
- The admin header search input has no event handler; use the existing authorized
  snapshot for appointment/customer/payment results without adding another API.
- Use one Vietnam-calendar model for desktop/mobile; exclude opening balances from period cash.
- Keep original retained-customer-funds meaning including opening balances and all appointments.
- Use real notifications/payment records for recent activity; do not invent an audit log.
- Reuse local preview and existing Playwright installation. No new infrastructure is required.
